const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function loadTs(file, overrides = {}) {
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, {
    module,
    exports: module.exports,
    require: (name) => overrides[name] || require(name),
    process,
    Buffer,
    AbortSignal,
    fetch,
    setTimeout,
    clearTimeout,
  });
  return module.exports;
}

function cmsFixture() {
  const rows = [
    ['section', 'content', 'updatedAt'],
    ['brand', JSON.stringify({ name: 'Kastriva lama', socials: { website: 'https://example.test' } }), 'old'],
    ['evil', JSON.stringify({ injected: true }), 'old'],
    ['hero', '{bad json', 'old'],
  ];
  const sheet = {
    getDataRange: () => ({ getValues: () => rows.map((row) => [...row]) }),
    getRange(row, col) {
      return {
        setValues(values) {
          for (let r = 0; r < values.length; r++) {
            rows[row - 1 + r] ||= [];
            for (let c = 0; c < values[r].length; c++) rows[row - 1 + r][col - 1 + c] = values[r][c];
          }
          return this;
        },
      };
    },
    appendRow: (row) => rows.push([...row]),
  };
  const context = vm.createContext({
    Config: { getSheet: (name) => { assert.equal(name, 'SiteContent'); return sheet; } },
    SpreadsheetApp: { flush() {} },
    Date,
    JSON,
    Number,
    String,
    Object,
    Array,
    RegExp,
    Error,
  });
  vm.runInContext(fs.readFileSync('google-apps-script/Cms.gs', 'utf8'), context);
  return { rows, run: (code) => vm.runInContext(code, context) };
}

test('CMS public read only returns known sections with valid JSON', () => {
  const f = cmsFixture();
  const result = f.run('Cms.getAll()');
  assert.equal(result.success, true);
  assert.equal(result.data.brand.name, 'Kastriva lama');
  assert.equal(result.data.evil, undefined);
  assert.equal(result.data.hero, undefined);
});

test('CMS write rejects unknown sections and sanitizes URLs/contact values', () => {
  const f = cmsFixture();
  const invalid = f.run(`Cms.updateSection({section:'unknown',content:{x:'y'}})`);
  assert.equal(invalid.success, false);

  const saved = f.run(`Cms.updateSection({section:'brand',content:{
    name:' Kastriva Baru ',
    whatsapp:' +62 812-ABC-345 ',
    socials:{website:'javascript:alert(1)',github:'http://unsafe.test',youtube:'https://youtube.com/@safe'}
  }})`);
  assert.equal(saved.success, true);
  const stored = JSON.parse(f.rows.find((row) => row[0] === 'brand')[1]);
  assert.equal(stored.name, 'Kastriva Baru');
  assert.equal(stored.whatsapp, '+62812-345'.replace('-', ''));
  assert.equal(stored.socials.website, '#');
  assert.equal(stored.socials.github, '#');
  assert.equal(stored.socials.youtube, 'https://youtube.com/@safe');
});

test('CMS write action is admin-protected by the same-origin gateway', async () => {
  const calls = [];
  const route = loadTs('app/api/gas/route.ts', {
    'next/server': { NextResponse: { json: (body, opts) => ({ body, status: opts.status, headers: opts.headers, cookies: { set() {} } }) } },
    '@/lib/server/gas-bridge': { callGas: async (action, body, params) => { calls.push({ action, body, params }); return { success: true, data: {} }; } },
    '@/lib/server/admin-password': { verifyAdminPassword: async () => false },
  });
  const request = (cookies = {}) => ({
    headers: new Headers({ origin: 'https://example.test', 'content-type': 'application/json' }),
    nextUrl: new URL('https://example.test/api/gas'),
    body: new Blob([JSON.stringify({ action: 'updateSiteContentSection', section: 'hero', content: { headline: 'Baru' } })]).stream(),
    cookies: { get: (name) => cookies[name] ? { value: cookies[name] } : undefined },
  });
  assert.equal((await route.POST(request())).status, 401);
  assert.equal(calls.length, 0);

  const cookie = process.env.NODE_ENV === 'production' ? '__Host-kastriva_admin_session' : 'kastriva_admin_session';
  const response = await route.POST(request({ [cookie]: 'server-session' }));
  assert.equal(response.status, 200);
  assert.equal(calls[0].action, 'updateSiteContentSection');
  assert.equal(calls[0].body.token, 'server-session');
});

test('CMS cache invalidation rejects cross-site requests and revalidates same-origin saves', async () => {
  const tags = [];
  const route = loadTs('app/api/cms/revalidate/route.ts', {
    'next/server': { NextResponse: { json: (body, opts = {}) => ({ body, status: opts.status || 200, headers: opts.headers || {} }) } },
    'next/cache': { revalidateTag: (tag) => tags.push(tag) },
  });
  const req = (origin) => ({
    headers: new Headers({ origin }),
    nextUrl: new URL('https://example.test/api/cms/revalidate'),
  });
  assert.equal((await route.POST(req('https://attacker.test'))).status, 403);
  assert.deepEqual(tags, []);
  assert.equal((await route.POST(req('https://example.test'))).status, 200);
  assert.deepEqual(tags, ['site-content']);
});
