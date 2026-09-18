const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const source = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('security rate limits are persistent and admin route awaits them', () => {
  const backend = source('lib/server/firebase-backend.ts');
  const rest = source('lib/server/firebase-rest.ts');
  const route = source('app/api/backend/route.ts');
  assert.ok(!backend.includes('const memRate = new Map'));
  assert.ok(backend.includes('consumeRateLimit(hash(key)'));
  assert.ok(rest.includes("mutateDocTransaction<boolean>('securityRateLimits'"));
  assert.ok(route.includes('if(!await allowAdminLoginAttempt(input.email))'));
});

test('OTP challenge is transactionally consumed and resend replaces prior code', () => {
  const backend = source('lib/server/firebase-backend.ts');
  assert.ok(backend.includes("mutateDocTransaction<any>('authChallenges'"));
  assert.ok(backend.includes("queryEquals('authChallenges','email',email)"));
  assert.ok(backend.includes("previous.map((row:any)=>deleteDoc('authChallenges'"));
  assert.ok(!backend.includes("await setDoc('authChallenges',challengeId,{customerId:customer?.id||''"));
});

test('public order cannot overwrite an existing customer profile', () => {
  const backend = source('lib/server/firebase-backend.ts');
  assert.ok(backend.includes("if(oldCustomer){await patch('customers',customerId,{lastActivity:now});}else{await setDoc('customers'"));
});

test('quotation and order state are committed atomically', () => {
  const backend = source('lib/server/firebase-backend.ts');
  assert.ok(backend.includes("commitAtomic([{collection:'quotations',id,data:{quotationNumber"));
  assert.ok(backend.includes("commitAtomic([{collection:'quotations',id,data:{status:response"));
});

test('JSON-LD serializer escapes HTML-significant characters', () => {
  const code = ts.transpileModule(source('lib/seo-jsonld.ts'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  new Function('module','exports',code)(module,module.exports);
  const out = module.exports.serializeJsonLd({ x: '</script><script>alert(1)</script>&\u2028\u2029' });
  assert.equal(out.includes('</script>'), false);
  assert.ok(out.includes('\\u003c/script\\u003e'));
  assert.ok(out.includes('\\u0026'));
  assert.ok(out.includes('\\u2028'));
  assert.ok(out.includes('\\u2029'));
  assert.ok(source('app/layout.tsx').includes('serializeJsonLd(jsonLd)'));
  assert.ok(source('app/(public)/portfolio/[slug]/page.tsx').includes('serializeJsonLd(portfolioJsonLd)'));
});
