const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function load(file, imports = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)((name) => {
    if (name in imports) return imports[name];
    throw new Error('Unexpected import: ' + name);
  }, module, module.exports);
  return module.exports;
}
const { projects } = load('data/projects.ts');
const { mergePortfolio, applyPortfolioUpdates, mergePortfolioForCms } = load('lib/repositories/portfolio-merge.ts', {
  '@/data/projects': { projects }
});

test('all portfolio thumbnails refer to exact existing filenames', () => {
  assert.equal(projects.length, 9);
  const names = fs.readdirSync(path.join(root, 'public/portfolio'));
  for (const project of projects) {
    assert.ok(names.includes(project.image.replace('/portfolio/', '')), project.image);
    assert.equal(new URL(project.demoUrl).protocol, 'https:');
  }
});

test('legacy inventory becomes Smart Kasir without duplicate or fictional metadata', () => {
  const smartKasir = projects.find((project) => project.id === 'kastriva-smart-kasir');
  assert.ok(smartKasir);
  const old = { ...smartKasir, id: 'cms-inventory', title: 'Sistem Manajemen Inventaris',
    demoUrl: 'https://demo.kastriva.com/inventory', githubUrl: 'https://github.com/kastriva/inventory',
    technologies: ['PostgreSQL'], image: '/portfolio/inventory.png' };
  const result = mergePortfolio([old]);
  assert.equal(result.length, 9);
  assert.equal(result[0].title, 'Kastriva-Smart Kasir');
  assert.equal(result[0].demoUrl, 'https://kastriva-smart-kasir.vercel.app/');
  assert.equal(result[0].githubUrl, undefined);
  assert.deepEqual(result[0].technologies, []);
  assert.equal(applyPortfolioUpdates(old).image, smartKasir.image);
});

test('CMS project overrides bundled content including thumbnail', () => {
  const warung = projects.find((project) => project.id === 'kasir-kilat-warung');
  assert.ok(warung);
  const cms = { ...warung, id: 'cms-warung', image: '/logo-kastriva.png', description: 'CMS description' };
  const result = mergePortfolio([cms]);
  assert.equal(result.length, 9);
  assert.equal(result.find((project) => project.id === 'cms-warung').image, '/logo-kastriva.png');
  assert.equal(result.find((project) => project.id === 'cms-warung').description, 'CMS description');
  assert.equal(mergePortfolio([{ ...cms, published: false }]).length, 8);
});

test('Admin CMS sees all bundled projects even when Firestore is empty', () => {
  const result = mergePortfolioForCms([], true);
  assert.equal(result.length, 9);
  assert.ok(result.every((project) => project.cmsSource === 'bundled'));
  assert.equal(result[0].sortOrder, 1);
});

test('Persisted CMS record replaces matching bundled record and becomes editable source of truth', () => {
  const lingo = projects.find((project) => project.id === 'lingospace-pro');
  assert.ok(lingo);
  const remote = { ...lingo, image: '/portfolio/custom-lingo.jpg', description: 'Edited from CMS', sortOrder: 7, cmsSource: 'cms' };
  const result = mergePortfolioForCms([remote], true);
  assert.equal(result.length, 9);
  const edited = result.find((project) => project.id === 'lingospace-pro');
  assert.equal(edited.cmsSource, 'cms');
  assert.equal(edited.image, '/portfolio/custom-lingo.jpg');
  assert.equal(edited.description, 'Edited from CMS');
  assert.equal(edited.sortOrder, 7);
});

test('deleted CMS tombstone suppresses bundled fallback', () => {
  const lingo = projects.find((project) => project.id === 'lingospace-pro');
  const resultAdmin = mergePortfolioForCms([{ ...lingo, deleted: true, published: false, cmsSource: 'cms' }], true);
  const resultPublic = mergePortfolioForCms([{ ...lingo, deleted: true, published: false, cmsSource: 'cms' }], false);
  assert.equal(resultAdmin.some((project) => project.id === 'lingospace-pro'), false);
  assert.equal(resultPublic.some((project) => project.id === 'lingospace-pro'), false);
});
