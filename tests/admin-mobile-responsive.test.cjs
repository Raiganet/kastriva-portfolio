const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('admin mobile navigation uses a labeled drawer instead of icon overflow', () => {
  const sidebar = read('components/admin/AdminSidebar.tsx');
  assert.match(sidebar, /Buka menu admin/);
  assert.match(sidebar, /role="dialog"/);
  assert.match(sidebar, /Navigasi admin mobile/);
  assert.match(sidebar, /min-h-\[48px\]/);
  assert.doesNotMatch(sidebar, /max-w-\[75vw\]/);
});

test('website CMS has mobile-friendly section picker, inputs, actions and save bar', () => {
  const cms = read('app/admin/cms/page.tsx');
  assert.match(cms, /aria-label="Pilih bagian CMS"/);
  assert.match(cms, /text-base sm:text-sm/);
  assert.match(cms, /fixed bottom-0 left-0 right-0/);
  assert.match(cms, /min-h-\[48px\] w-full items-center justify-center/);
});

test('admin layout prevents horizontal overflow on small screens', () => {
  const layout = read('app/admin/layout.tsx');
  assert.match(layout, /overflow-x-hidden/);
  assert.match(layout, /p-3 sm:p-4/);
});
