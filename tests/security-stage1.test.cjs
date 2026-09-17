const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const crypto = require('node:crypto');

function fixture() {
  const props = { GAS_BRIDGE_SECRET: 'a'.repeat(64) };
  const mail = [];
  let now = 1800000000000;
  const headers = ['id','orderNumber','customerId','name','business','email','whatsapp','projectType','serviceId','portfolioId','portfolioTitle','budget','deadline','description','features','referenceUrl','status','createdAt','updatedAt'];
  headers.push('requestId','requestHash','notifications');
  const rows = {
    Customers: [['id','name','email'], ['c1','First','one@example.test'], ['c2','Second','two@example.test']],
    Orders: [headers, ['o1','KAS-2026-0001','c1','First','','one@example.test','08000000000','Website','','','','','','Private one','','','Submitted','',''], ['o2','KAS-2026-0002','c2','Second','','two@example.test','08000000000','Website','','','','','','Private two','','','Submitted','','']],
    Projects: [['id','orderId','customerId']], ProjectUpdates: [['id','projectId']], Quotations: [['id','number','orderId','customerId']]
  };
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } }
  const ctx = vm.createContext({ Date: Clock, Logger: { log() {} },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] || null, setProperty: (k,v) => props[k]=v, deleteProperty: k => delete props[k], getProperties: () => ({...props}) }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    Utilities: { Charset: { UTF_8: 'utf8' }, DigestAlgorithm: { SHA_256: 'sha256' }, getUuid: crypto.randomUUID, computeDigest: (_,s) => [...crypto.createHash('sha256').update(s).digest()], computeHmacSha256Signature: (s,key) => [...crypto.createHmac('sha256',key).update(s).digest()] },
    Config: { APP_NAME: 'Kastriva', getSheet(name) { if (!rows[name]) throw new Error('Missing'); const a=rows[name]; return { getDataRange: () => ({ getValues: () => a }), appendRow: r => a.push(r), getRange: () => ({ setValue() {} }) }; } },
    SpreadsheetApp: {flush() {}},
    Utils: { isValidEmail: x => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x), sanitize: x => String(x||''), generateId: crypto.randomUUID, generateOrderNumber: () => 'KAS-2026-0003', logAudit() {} },
    GmailApp: { sendEmail: (to,subject,body) => mail.push({to,body}) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: text => ({ text, setMimeType() { return this; } }) }
  });
  for (const name of ['Security','DataIntegrity','Auth','CustomerAuth','Orders','CustomerPortal','Router','Code']) vm.runInContext(fs.readFileSync(`google-apps-script/${name}.gs`,'utf8'),ctx);
  const run = code => vm.runInContext(code,ctx);
  run('Orders.sendAdminNotification=()=>{}; Orders.sendConfirmationEmail=()=>{};');
  function login(email='one@example.test') { const req=run(`CustomerAuth.request(${JSON.stringify(email)})`); const code=mail.at(-1).body.match(/\d{8}/)[0]; return { request: req, code, session: run(`CustomerAuth.verifyCode(${JSON.stringify({ challengeId:req.data.challengeId,code,remember:true })})`) }; }
  return { run,props,mail,rows,login,advance: ms => now+=ms,now:()=>now };
}

test('direct GAS requests and legacy email/order login are rejected', () => {
  const f=fixture();
  assert.equal(JSON.parse(f.run('doGet()').text).success,false);
  assert.equal(JSON.parse(f.run(`doPost({postData:{contents:'{"action":"getOrderByNumber","orderNumber":"KAS-2026-0001"}'}})`).text).success,false);
  assert.equal(f.run(`Router.handle('customerLogin',{}, {email:'one@example.test',orderNumber:'KAS-2026-0001'},'POST')`).success,false);
  assert.equal(f.run(`Router.handle('getOrderByNumber',{orderNumber:'KAS-2026-0001'}, {},'POST')`).success,false);
});
test('creating an order under an existing email does not issue a session', () => {
  const f=fixture(); const created=f.run(`Orders.create({name:'Someone',email:'one@example.test',whatsapp:'08000000000',type:'Website',description:'A long enough project description',requestId:'12345678-1234-4123-8123-123456789abc'})`);
  assert.equal(created.success,true); assert.equal(created.data.token,undefined);
  assert.equal(f.run(`Router.handle('customerLogin',{}, {email:'one@example.test',orderNumber:'KAS-2026-0003'},'POST')`).success,false);
});
test('OTP creates expiring session, is single-use, tracking enforces ownership', () => {
  const f=fixture(); const {session,request,code}=f.login(); assert.equal(session.success,true); assert.ok(session.data.expiresAt>f.now());
  assert.equal(f.run(`CustomerAuth.verifyCode(${JSON.stringify({challengeId:request.data.challengeId,code})})`).success,false);
  const token=session.data.token;
  const own=f.run(`Router.handle('getOrderByNumber',{orderNumber:'KAS-2026-0001'}, {token:'${token}'},'POST')`); assert.equal(own.success,true);
  const other=f.run(`Router.handle('getOrderByNumber',{orderNumber:'KAS-2026-0002'}, {token:'${token}'},'POST')`); assert.equal(other.success,false);
  assert.equal(f.run(`Auth.verifyToken('${token}')`).success,false);
  assert.ok(!JSON.stringify(f.props).includes(token));
  f.advance(86400001); assert.equal(f.run(`CustomerAuth.verify('${token}')`).success,false);
});
test('five wrong OTP attempts invalidate challenge', () => {
  const f=fixture();const r=f.run("CustomerAuth.request('one@example.test')"); const code=f.mail[0].body.match(/\d{8}/)[0]; const wrong=code==='00000000'?'11111111':'00000000';
  for(let i=0;i<5;i++) assert.equal(f.run(`CustomerAuth.verifyCode({challengeId:'${r.data.challengeId}',code:'${wrong}'})`).success,false);
  assert.equal(f.run(`CustomerAuth.verifyCode({challengeId:'${r.data.challengeId}',code:'${code}'})`).success,false);
});
test('OTP expiry, resend replacement and rate limits', () => {
  const f=fixture(); const r=f.run("CustomerAuth.request('one@example.test')"); const code=f.mail[0].body.match(/\d{8}/)[0];
  assert.equal(f.run("CustomerAuth.request('one@example.test')").code,'RATE_LIMIT');
  f.advance(61000); const next=f.run("CustomerAuth.request('one@example.test')"); assert.equal(next.success,true);
  assert.equal(f.run(`CustomerAuth.verifyCode({challengeId:'${r.data.challengeId}',code:'${code}'})`).success,false);
  const current=f.mail[1].body.match(/\d{8}/)[0];f.advance(600001);
  assert.equal(f.run(`CustomerAuth.verifyCode({challengeId:'${next.data.challengeId}',code:'${current}'})`).success,false);
});
test('unknown email gets same response shape without email or session', () => {
  const f=fixture();const a=f.run("CustomerAuth.request('one@example.test')");const b=f.run("CustomerAuth.request('unknown@example.test')");
  assert.deepEqual(Object.keys(a),Object.keys(b));assert.deepEqual(Object.keys(a.data),Object.keys(b.data));assert.equal(a.message,b.message);assert.equal(f.mail.length,1);
});
test('logout and re-login revoke old sessions; legacy sessions are not accepted', () => {
  const f=fixture(); const one=f.login().session;f.advance(61000);const two=f.login().session;
  assert.equal(f.run(`CustomerAuth.verify('${one.data.token}')`).success,false);
  assert.equal(f.run(`CustomerAuth.verify('${two.data.token}')`).success,true);
  f.run(`CustomerAuth.logout('${two.data.token}')`);assert.equal(f.run(`CustomerAuth.verify('${two.data.token}')`).success,false);
  f.props.customerSessions=JSON.stringify({legacy:{customerId:'c1',expiresAt:f.now()+9999}});
  assert.equal(f.run("CustomerAuth.verify('legacy')").success,false);
});
test('admin attempt limiter and role separation', () => {
  const f=fixture();for(let i=0;i<10;i++) assert.equal(f.run('Auth.attempt()').success,true); assert.equal(f.run('Auth.attempt()').code,'RATE_LIMIT');
  assert.equal(f.run("Auth.login({email:'a',passwordVerified:false})").success,false);
  const s=f.run("Auth.login({email:'admin@example.test',passwordVerified:true})");
  assert.equal(f.run(`CustomerAuth.verify('${s.data.token}')`).success,false);
});
test('gateway rejects invalid signatures, expired envelopes and replay', () => {
  const f=fixture();const payload=JSON.stringify({action:'health'});const nonce=crypto.randomUUID();const timestamp=f.now();
  const signature=crypto.createHmac('sha256',f.props.GAS_BRIDGE_SECRET).update(`${timestamp}.${nonce}.${payload}`).digest('hex');
  const env={payload,nonce,timestamp,signature};
  assert.equal(f.run(`Security.verifyEnvelope(${JSON.stringify({...env,signature:'0'.repeat(64)})})`),null);
  assert.equal(f.run(`Security.verifyEnvelope(${JSON.stringify(env)})`).action,'health');
  assert.equal(f.run(`Security.verifyEnvelope(${JSON.stringify(env)})`),null);
  f.advance(61000);assert.equal(f.run(`Security.verifyEnvelope(${JSON.stringify(env)})`),null);
});
