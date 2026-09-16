const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const crypto = require('node:crypto');
function load(file, overrides={}) {
 const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const module={exports:{}};
 vm.runInNewContext(source,{module,exports:module.exports,require:n=>overrides[n]||require(n),process,Buffer,AbortSignal,fetch,setTimeout,clearTimeout});
 return module.exports;
}
function routeFixture() {
 const calls=[];let passwordValid=false;let result={success:true,data:{token:'c'.repeat(64),email:'admin@example.test',role:'admin',expiresAt:Date.now()+7200000}};
 const route=load('app/api/gas/route.ts',{
  'next/server':{NextResponse:{json:(body,opts)=>{const changes=[];return {body,status:opts.status,headers:opts.headers,changes,cookies:{set:(...args)=>changes.push(args)}};}}},
  '@/lib/server/gas-bridge':{callGas:async(action,body,params)=>{calls.push({action,body,params});return action==='__adminAttempt'?{success:true}:structuredClone(result);}},
  '@/lib/server/admin-password':{verifyAdminPassword:async()=>passwordValid}
 });
 return {post:route.POST,calls,password:v=>passwordValid=v,result:v=>result=v,request:(data,origin='https://example.test',cookies={})=>({headers:new Headers({origin,'content-type':'application/json'}),nextUrl:new URL('https://example.test/api/gas'),body:new Blob([JSON.stringify(data)]).stream(),cookies:{get:n=>cookies[n]?{value:cookies[n]}:undefined}})};
}
test('cross-site, unknown actions and caller-supplied admin flags cannot log in',async()=>{
 const f=routeFixture();
 assert.equal((await f.post(f.request({action:'login'},'https://attacker.test'))).status,403);
 assert.equal((await f.post(f.request({action:'__adminAttempt'}))).status,400);
 assert.equal((await f.post(f.request({action:'login',passwordVerified:true,email:'admin@example.test'}))).status,401);
 assert.deepEqual(f.calls.map(x=>x.action),['__adminAttempt']);
});
test('protected actions require cookies and ignore caller tokens',async()=>{
 const f=routeFixture();assert.equal((await f.post(f.request({action:'getOrders',token:'forged'}))).status,401);assert.equal(f.calls.length,0);
 const cookie=process.env.NODE_ENV==='production'?'__Host-kastriva_admin_session':'kastriva_admin_session';
 f.result({success:true,data:[]});await f.post(f.request({action:'getOrders',token:'forged',passwordVerified:true},undefined,{[cookie]:'real-server-cookie'}));
 assert.equal(f.calls[0].body.token,'real-server-cookie');assert.equal(f.calls[0].body.passwordVerified,undefined);assert.equal(f.calls[0].params.token,undefined);
});
test('login sets HttpOnly same-site cookie without returning token',async()=>{
 process.env.ADMIN_EMAIL='admin@example.test';const f=routeFixture();f.password(true);
 const response=await f.post(f.request({action:'login',email:'admin@example.test',password:'test',remember:true}));
 assert.equal(response.status,200);assert.equal(response.body.data.token,undefined);assert.equal(response.changes.length,1);
 const opts=response.changes[0][2];assert.equal(opts.httpOnly,true);assert.equal(opts.sameSite,'strict');assert.equal(opts.path,'/');assert.ok(opts.maxAge>0);assert.match(response.headers['Cache-Control'],/no-store/);
});
test('logout clears cookies even when upstream cannot be reached',async()=>{
 const f=routeFixture();f.result({success:false,code:'UPSTREAM_ERROR',error:'offline'});
 const r=await f.post(f.request({action:'logout'}));assert.equal(r.changes[0][2].maxAge,0);
});
test('scrypt verifier accepts only correct password and email',async()=>{
 const salt=crypto.randomBytes(16).toString('hex');const password='a-long-test-password';
 const hash=crypto.scryptSync(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024}).toString('hex');
 process.env.ADMIN_EMAIL='admin@example.test';process.env.ADMIN_PASSWORD_SCRYPT=`scrypt-v1$${salt}$${hash}`;
 const {verifyAdminPassword}=load('lib/server/admin-password.ts');
 assert.equal(await verifyAdminPassword('admin@example.test',password),true);
 assert.equal(await verifyAdminPassword('other@example.test',password),false);
 assert.equal(await verifyAdminPassword('admin@example.test','wrong'),false);
 delete process.env.ADMIN_PASSWORD_SCRYPT;delete process.env.ADMIN_EMAIL;
});
