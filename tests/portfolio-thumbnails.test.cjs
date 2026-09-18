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
const { mergePortfolio, applyPortfolioUpdates } = load('lib/repositories/portfolio-merge.ts', {
  '@/data/projects': { projects }
});

test('all seven portfolio thumbnails refer to exact existing filenames', () => {
  assert.equal(projects.length, 7);
  const names = fs.readdirSync(path.join(root, 'public/portfolio'));
  for (const project of projects) {
    assert.ok(names.includes(project.image.replace('/portfolio/', '')), project.image);
    assert.equal(new URL(project.demoUrl).protocol, 'https:');
  }
});
test('legacy inventory becomes Smart Kasir without duplicate or fictional metadata', () => {
  const old = { ...projects[0], id: 'cms-inventory', title: 'Sistem Manajemen Inventaris',
    demoUrl: 'https://demo.kastriva.com/inventory', githubUrl: 'https://github.com/kastriva/inventory',
    technologies: ['PostgreSQL'], image: '/portfolio/inventory.png' };
  const result = mergePortfolio([old]);
  assert.equal(result.length, 7);
  assert.equal(result[0].title, 'Kastriva-Smart Kasir');
  assert.equal(result[0].demoUrl, 'https://kastriva-smart-kasir.vercel.app/');
  assert.equal(result[0].githubUrl, undefined);
  assert.deepEqual(result[0].technologies, []);
  assert.equal(applyPortfolioUpdates(old).image, projects[0].image);
});
test('CMS project keeps its content but uses the supplied thumbnail', () => {
  const cms = { ...projects[1], id: 'cms-warung', image: '/logo-kastriva.png', description: 'CMS description' };
  const result = mergePortfolio([cms]);
  assert.equal(result.length, 7);
  assert.equal(result[0].image, projects[1].image);
  assert.equal(result[0].description, 'CMS description');
  assert.equal(mergePortfolio([{ ...cms, published: false }]).length, 6);
});
