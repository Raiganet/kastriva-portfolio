const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const crypto=require('node:crypto');
function fixture(migrated=true) {
 let held=false, busy=false, flushFailure=false, crashAppend=false, reentrant=null, now=Date.now();
 const props={GAS_BRIDGE_SECRET:'b'.repeat(64)},sends=[];const triggers=[];
 const headers=['id','orderNumber','customerId','name','business','email','whatsapp','projectType','serviceId','portfolioId','portfolioTitle','budget','deadline','description','features','referenceUrl','status','createdAt','updatedAt'];
 const tables={Orders:[migrated?[...headers,'requestId','requestHash','notifications']:headers],Customers:[['id','name','email','whatsapp','business','avatar','status','createdAt','lastActivity']],Projects:[['id','orderId','customerId']],ProjectUpdates:[['id','projectId']],Quotations:[['id','quotationNumber']]};
 const sheet=name=>({getDataRange:()=>({getValues:()=>tables[name].map(r=>[...r])}),getMaxColumns:()=>26,insertColumnsAfter(){},
 appendRow(row){assert.equal(held,true,'write must hold lock');tables[name].push([...row]);if(reentrant){const f=reentrant;reentrant=null;f();}if(crashAppend && name==='Orders'){crashAppend=false;throw new Error('Lost response after append');}},
 getRange(row,col){return {setValue(value){assert.equal(held,true);while(tables[name].length<row)tables[name].push([]);tables[name][row-1][col-1]=value;},getValue(){return tables[name][row-1]?.[col-1];}};}});
 class Clock extends Date{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}}
 const ctx=vm.createContext({Date:Clock,Config:{APP_NAME:'Test',ADMIN_EMAIL:'admin@example.test',getSheet:sheet},
 PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]||null,setProperty:(k,v)=>props[k]=v,deleteProperty:k=>delete props[k],getProperties:()=>({...props})})},
 LockService:{getScriptLock:()=>({tryLock(){if(held||busy)return false;held=true;return true;},releaseLock(){held=false;}})},
 SpreadsheetApp:{flush(){if(flushFailure){flushFailure=false;throw new Error('flush failed');}}},Logger:{log(){}},
 ScriptApp:{getProjectTriggers:()=>triggers.map(x=>({getHandlerFunction:()=>x})),newTrigger:name=>({timeBased:()=>({everyMinutes:()=>({create:()=>triggers.push(name)})})})},
 Utilities:{Charset:{UTF_8:'utf8'},DigestAlgorithm:{SHA_256:'sha256'},getUuid:crypto.randomUUID,computeDigest:(_,s)=>[...crypto.createHash('sha256').update(s).digest()],computeHmacSha256Signature:(s,k)=>[...crypto.createHmac('sha256',k).update(s).digest()]},
 Utils:{generateId:crypto.randomUUID,isValidEmail:s=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s),logAudit(){},sanitize:s=>String(s||'')},
 send:(kind,number)=>{assert.equal(held,false,'email must not hold write lock');sends.push({kind,number});return {success:true};}
 });
 for(const name of ['Security','DataIntegrity','Orders','OrderNotifications','CustomerPortal'])vm.runInContext(fs.readFileSync('google-apps-script/'+name+'.gs','utf8'),ctx);
 const run=s=>vm.runInContext(s,ctx);run("Orders.sendAdminNotification=(n)=>send('admin',n);Orders.sendConfirmationEmail=(n)=>send('customer',n);");
 const data=overrides=>({requestId:crypto.randomUUID(),name:'Customer',business:'Shop',email:'owner@example.test',whatsapp:'081234567890',type:'Website',description:'A sufficiently detailed project description',...overrides});
 const create=d=>run(`Orders.create(${JSON.stringify(d)})`);
 return {run,tables,props,sends,triggers,data,create,getHeld:()=>held,block:v=>busy=v,crash:()=>crashAppend=true,failFlush:()=>flushFailure=true,reenter:f=>reentrant=f,advance:ms=>now+=ms};
}
test('same request returns one order/customer/number and does not resend emails',()=>{
 const f=fixture(),data=f.data();const a=f.create(data),b=f.create(data);assert.equal(a.success,true);assert.equal(b.success,true);assert.equal(a.data.id,b.data.id);assert.equal(b.data.replayed,true);assert.equal(f.tables.Orders.length,2);assert.equal(f.tables.Customers.length,2);assert.equal(f.sends.length,0);
 f.run('processOrderNotificationsStage2()');assert.equal(f.sends.length,2);f.create(data);f.run('processOrderNotificationsStage2()');assert.equal(f.sends.length,2);
});
test('lost response after row commit recovers original result',()=>{
 const f=fixture(),data=f.data();f.crash();assert.equal(f.create(data).success,false);const r=f.create(data);assert.equal(r.success,true);assert.equal(r.data.replayed,true);assert.equal(f.tables.Orders.length,2);assert.equal(f.getHeld(),false);
});
test('same id with different contents is rejected without disclosing existing order',()=>{
 const f=fixture(),d=f.data();f.create(d);const r=f.create({...d,email:'other@example.test'});assert.equal(r.code,'IDEMPOTENCY_CONFLICT');assert.equal(r.data,undefined);assert.equal(f.tables.Orders.length,2);
});
test('overlapping requests cannot enter write section; retry resolves same commit',()=>{
 const f=fixture(),d=f.data();let overlapped;f.reenter(()=>{overlapped=f.create(d);});assert.equal(f.create(d).success,true);assert.equal(overlapped.code,'BUSY');assert.equal(f.create(d).data.replayed,true);assert.equal(f.tables.Orders.length,2);
});
test('lock timeout does not allocate number/customer or write order',()=>{
 const f=fixture();f.block(true);const r=f.create(f.data());assert.equal(r.code,'BUSY');assert.equal(f.tables.Orders.length,1);assert.equal(f.tables.Customers.length,1);assert.equal(Object.keys(f.props).filter(x=>x.startsWith('sequence_')).length,0);
});
test('reordered/deleted rows do not reuse allocated numbers; quotation digits never wrap',()=>{
 const f=fixture();const a=f.create(f.data()),b=f.create(f.data());f.tables.Orders.splice(2,1);const c=f.create(f.data());assert.notEqual(c.data.orderNumber,b.data.orderNumber);assert.notEqual(c.data.orderNumber,a.data.orderNumber);
 const year=new Date().getFullYear();f.tables.Quotations.push(['q','QTN-'+year+'-9999']);const number=f.run("DataIntegrity.mutate(()=>({success:true,data:DataIntegrity.nextNumber('Quotations','QTN')}))");assert.equal(number.data,'QTN-'+year+'-10000');
});
test('successful retries bypass new-order rate limits',()=>{
 const f=fixture(),d=f.data();assert.equal(f.create(d).success,true);for(let i=0;i<4;i++)assert.equal(f.create(f.data()).success,true);assert.equal(f.create(f.data()).code,'RATE_LIMIT');assert.equal(f.create(d).data.replayed,true);
});
test('backend rejects invalid payload and stores formula-like values as text',()=>{
 const f=fixture();for(const extra of [{name:{x:1}},{description:'x'},{type:'unknown'},{whatsapp:'abcdefghijk'},{website:'spam'},{budget:'x'.repeat(101)},{requestId:'bad'}])assert.equal(f.create(f.data(extra)).code,'VALIDATION');
 assert.equal(f.create(f.data({name:'=IMPORTXML("x")',description:'@a sufficiently long description'})).success,true);assert.equal(f.tables.Orders[1][3][0],"'");assert.equal(f.tables.Customers[1][1][0],"'");
});
test('migration adds only headers, keeps old rows and creates one trigger',()=>{
 const f=fixture(false);f.tables.Orders.push(['old','KAS-2025-0090']);const old=[...f.tables.Orders[1]];assert.equal(f.create(f.data()).code,'MIGRATION_REQUIRED');f.run('setupOrderReliabilityStage2()');f.run('setupOrderReliabilityStage2()');assert.deepEqual(f.tables.Orders[1],old);assert.equal(f.tables.Orders[0].length,22);assert.equal(f.triggers.length,1);f.run('processOrderNotificationsStage2()');assert.equal(f.sends.length,0);
});
test('interrupted email job becomes uncertain without automatic duplicate delivery',()=>{
 const f=fixture();f.create(f.data());const claim=f.run('OrderNotifications.claim()');assert.equal(claim.success,true);f.advance(11*60000);f.run('processOrderNotificationsStage2()');const jobs=JSON.parse(f.tables.Orders[1][21]);assert.equal(jobs.admin.state,'uncertain');assert.equal(f.sends.filter(x=>x.kind==='admin').length,0);assert.equal(f.sends.filter(x=>x.kind==='customer').length,1);
});
test('stale admin status update is rejected',()=>{
 const f=fixture();const r=f.create(f.data());const timestamp=f.tables.Orders[1][18];const update={id:r.data.id,status:'Reviewing',expectedUpdatedAt:timestamp};assert.equal(f.run(`DataIntegrity.mutate(()=>Orders.updateStatus(${JSON.stringify(update)}))`).success,true);assert.equal(f.run(`DataIntegrity.mutate(()=>Orders.updateStatus(${JSON.stringify({...update,status:'Cancelled'})}))`).code,'CONFLICT');assert.equal(f.tables.Orders[1][16],'Reviewing');
});
test('customer dashboard and tracking never disclose replay keys or notification state',()=>{
 const f=fixture();const r=f.create(f.data());const id=f.tables.Orders[1][2];const dashboard=f.run(`CustomerPortal.getDashboard('${id}')`);assert.equal(dashboard.data.orders[0].requestId,undefined);const tracking=f.run(`Orders.getByOrderNumber('${r.data.orderNumber}','${id}')`);assert.equal(tracking.data.order.requestHash,undefined);assert.equal(tracking.data.order.notifications,undefined);
});
test('flush failure after append keeps request recoverable without another order',()=>{
 const f=fixture(),d=f.data();f.failFlush();const first=f.create(d);assert.equal(first.success,false);assert.equal(f.getHeld(),false);const retry=f.create(d);assert.equal(retry.data.replayed,true);assert.equal(f.tables.Orders.length,2);
});
test('email failure is independent of order success and needs explicit recovery',()=>{
 const f=fixture();f.run('Orders.sendAdminNotification=()=>({success:false})');const r=f.create(f.data());assert.equal(r.success,true);f.run('processOrderNotificationsStage2()');assert.equal(JSON.parse(f.tables.Orders[1][21]).admin.state,'failed');const before=f.sends.length;f.run('processOrderNotificationsStage2()');assert.equal(f.sends.length,before);f.run(`retryOrderNotificationStage2('${r.data.orderNumber}','admin')`);assert.equal(JSON.parse(f.tables.Orders[1][21]).admin.state,'pending');
});
