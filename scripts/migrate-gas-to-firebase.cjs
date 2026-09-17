const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function loadDotEnv(file='.env.local'){
  const p=path.resolve(process.cwd(),file); if(!fs.existsSync(p))return;
  for(const line of fs.readFileSync(p,'utf8').split(/\r?\n/)){
    const m=line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/); if(!m||process.env[m[1]])continue;
    let v=m[2]; if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1); process.env[m[1]]=v;
  }
}
loadDotEnv();
const required=['GAS_API_URL','GAS_BRIDGE_SECRET','ADMIN_EMAIL','FIREBASE_PROJECT_ID','FIREBASE_CLIENT_EMAIL','FIREBASE_PRIVATE_KEY'];
const missing=required.filter(k=>!process.env[k]); if(missing.length){console.error('Missing env:',missing.join(', '));process.exit(1);}
const gasUrl=process.env.GAS_API_URL, gasSecret=process.env.GAS_BRIDGE_SECRET;

async function callGas(action,body={},params={}){
  const payload=JSON.stringify({action,body,params}); const timestamp=Date.now(); const nonce=crypto.randomUUID(); const signature=crypto.createHmac('sha256',gasSecret).update(`${timestamp}.${nonce}.${payload}`).digest('hex');
  const r=await fetch(gasUrl,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({payload,timestamp,nonce,signature}),redirect:'follow'}); if(!r.ok)throw new Error(`GAS ${r.status}`); const j=await r.json(); if(!j.success)throw new Error(`${action}: ${j.error||'failed'}`); return j.data;
}
let tokenCache=null;
function b64url(x){return Buffer.from(x).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_')}
async function firebaseToken(){if(tokenCache&&tokenCache.exp>Date.now()+60000)return tokenCache.token;const now=Math.floor(Date.now()/1000),header=b64url(JSON.stringify({alg:'RS256',typ:'JWT'})),claims=b64url(JSON.stringify({iss:process.env.FIREBASE_CLIENT_EMAIL,scope:'https://www.googleapis.com/auth/datastore',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600})),u=`${header}.${claims}`,sign=crypto.createSign('RSA-SHA256');sign.update(u);sign.end();const assertion=`${u}.${b64url(sign.sign(process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g,'\n')))}`;const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion})});const j=await r.json();if(!r.ok||!j.access_token)throw new Error('Firebase auth failed');tokenCache={token:j.access_token,exp:Date.now()+(j.expires_in||3600)*1000};return j.access_token;}
function ev(v){if(v===null)return{nullValue:null};if(Array.isArray(v))return{arrayValue:{values:v.map(ev)}};if(typeof v==='boolean')return{booleanValue:v};if(typeof v==='number')return Number.isInteger(v)?{integerValue:String(v)}:{doubleValue:v};if(typeof v==='object'){const fields={};for(const[k,x]of Object.entries(v))if(x!==undefined)fields[k]=ev(x);return{mapValue:{fields}}}return{stringValue:String(v??'')}}
function fields(o){const f={};for(const[k,v]of Object.entries(o||{}))if(k!=='id'&&v!==undefined)f[k]=ev(v);return f;}
async function setDoc(c,id,data){const t=await firebaseToken(),url=`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(process.env.FIREBASE_PROJECT_ID)}/databases/(default)/documents/${encodeURIComponent(c)}/${encodeURIComponent(String(id))}`;const r=await fetch(url,{method:'PATCH',headers:{Authorization:`Bearer ${t}`,'Content-Type':'application/json'},body:JSON.stringify({fields:fields(data)})});if(!r.ok)throw new Error(`Firestore ${c}/${id}: ${r.status} ${await r.text()}`);}
async function importRows(collection,rows){for(const row of rows||[]){const id=String(row.id||crypto.randomUUID());await setDoc(collection,id,row);}console.log(`  ${collection}: ${(rows||[]).length}`)}

(async()=>{
  console.log('Kastriva GAS -> Firebase migration');
  const login=await callGas('login',{email:process.env.ADMIN_EMAIL.trim().toLowerCase(),passwordVerified:true,remember:false}); const token=login.token; if(!token)throw new Error('No admin token from GAS');
  const admin=(action,params={})=>callGas(action,{token,...params},{token,...params});
  const site=await callGas('getSiteContent'); for(const [section,content] of Object.entries(site||{}))await setDoc('siteContent',section,{content,updatedAt:new Date().toISOString()}); console.log('  siteContent:',Object.keys(site||{}).length);
  await importRows('portfolio',await admin('getPortfolioAdmin'));
  await importRows('services',await callGas('getServices'));
  await setDoc('settings','global',await callGas('getSettings')); console.log('  settings: 1');
  const customers=await admin('getCustomers'),orders=await admin('getOrders'),projects=await admin('getProjects'),quotes=await admin('getQuotations'),invoices=await admin('getInvoices'),revisions=await admin('getRevisions'),handovers=await admin('getHandovers');
  await importRows('customers',customers);await importRows('orders',orders);await importRows('projects',projects);await importRows('quotations',quotes);await importRows('invoices',invoices);await importRows('revisions',revisions);await importRows('handovers',handovers);
  let updates=[]; for(const p of projects||[]){try{const detail=await admin('getProject',{id:p.id}); if(Array.isArray(detail?.updates))updates.push(...detail.updates);}catch(e){console.warn('  skip updates for',p.id,e.message)}} await importRows('projectUpdates',updates);
  await setDoc('_meta','migration',{source:'Google Apps Script + Google Sheets',migratedAt:new Date().toISOString(),counts:{customers:customers.length,orders:orders.length,projects:projects.length,quotations:quotes.length,invoices:invoices.length,revisions:revisions.length,handovers:handovers.length,projectUpdates:updates.length}});
  console.log('\nDONE. Verify Firebase data before removing GAS_API_URL/GAS_BRIDGE_SECRET from Vercel.');
})().catch(e=>{console.error('\nMigration failed:',e.message);process.exit(1)});
