const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

test('default site content includes official NIB and legal footer config', () => {
  const source = read('data/site-content.ts');
  assert.match(source, /nib:\s*"1803260015159"/);
  assert.match(source, /showLegalIdentity:\s*true/);
  assert.match(source, /legalTitle:\s*"Legalitas Usaha"/);
});

test('footer renders OSS legal identity without exposing document details', () => {
  const source = read('components/Footer.tsx');
  assert.match(source, /Terdaftar OSS/);
  assert.match(source, /Nomor Induk Berusaha/);
  assert.match(source, /site\.footer\.nib/);
  assert.doesNotMatch(source, /Perumahan Citra Mulia|Lemahmulya|Majalaya 41388/);
});

test('CMS can edit and hide legal identity', () => {
  const source = read('app/admin/cms/page.tsx');
  assert.match(source, /Tampilkan Legalitas NIB/);
  assert.match(source, /Nomor Induk Berusaha \(NIB\)/);
  assert.match(source, /legalDescription/);
});
