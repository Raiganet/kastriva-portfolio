const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const crypto = require('node:crypto');
function load(file, overrides={}){
  const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const module={exports:{}}; vm.runInNewContext(source,{module,exports:module.exports,require:n=>overrides[n]||require(n),process,Buffer,console}); return module.exports;
}
test('Stage 6 sessions are signed server-side and role separated',()=>{
  process.env.SESSION_SECRET='s'.repeat(64);
  const s=load('lib/server/session.ts',{'node:crypto':crypto});
  const created=s.createSession('admin',{email:'admin@example.test',name:'Admin'},true);
  assert.equal(typeof created.token,'string');
  assert.equal(s.verifySession(created.token,'admin').email,'admin@example.test');
  assert.equal(s.verifySession(created.token,'customer'),null);
  assert.equal(s.verifySession(created.token+'x','admin'),null);
  delete process.env.SESSION_SECRET;
});
test('Firestore rules deny direct browser reads and writes',()=>{
  const rules=fs.readFileSync('firestore.rules','utf8');
  assert.match(rules,/allow read, write: if false/);
  assert.doesNotMatch(rules,/if true/);
});
test('production backend route uses Firebase and does not call GAS bridge',()=>{
  const route=fs.readFileSync('app/api/backend/route.ts','utf8');
  const backend=fs.readFileSync('lib/server/firebase-backend.ts','utf8');
  assert.match(route,/firebase-backend/);
  assert.doesNotMatch(route,/gas-bridge|script\.google\.com|GAS_API_URL/);
  assert.match(backend,/listDocs\('orders'\)|listDocs\('portfolio'\)|siteContent/);
});
test('SmartOrderForm preserves strict ProjectType on select change',()=>{
  const src=fs.readFileSync('components/order/SmartOrderForm.tsx','utf8');
  assert.match(src,/type ProjectType/);
  assert.match(src,/e\.target\.value as ProjectType/);
});
