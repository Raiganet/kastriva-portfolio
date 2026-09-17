const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');const crypto=require('node:crypto');
function compile(file,globals={},imports={}) {
 const module={exports:{}};const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(source,{module,exports:module.exports,require:n=>imports[n]||require(n),crypto,...globals});return module.exports;
}
function storage(){const items=new Map();return {items,getItem:k=>items.get(k)||null,setItem:(k,v)=>items.set(k,v),removeItem:k=>items.delete(k)};}
function fixture(){const local=storage(),session=storage();let queue=Promise.resolve();const globals={window:{localStorage:local,sessionStorage:session},navigator:{onLine:true,locks:{request:(_,fn)=>{const result=queue.then(fn);queue=result.catch(()=>{});return result;}}}};const load=()=>compile('lib/order/draft.ts',globals);return {local,globals,load,draft:load()};}
const data={name:'Customer',email:'a@example.test',whatsapp:'081234567890',type:'Website',description:'A detailed request for a project',website:''};
test('draft survives reload and pending request keeps its original payload/id',async()=>{
 const f=fixture();await f.draft.saveOrderDraft(data);const first=await f.draft.prepareOrder(data);const reload=f.load();const next=await reload.prepareOrder({...data,name:'Edited'});assert.equal(next.pending.requestId,first.pending.requestId);assert.equal(next.pending.data.name,'Customer');await reload.saveOrderDraft({...data,name:'Changed'});assert.equal(reload.readOrderDraft().pending.data.name,'Customer');
});
test('parallel tabs share a single immutable pending request',async()=>{
 const f=fixture(),tab=f.load();const [a,b]=await Promise.all([f.draft.prepareOrder(data),tab.prepareOrder(data)]);assert.equal(a.pending.requestId,b.pending.requestId);
});
test('confirmed receipt prevents accidental resubmit until explicit new request',async()=>{
 const f=fixture();const a=await f.draft.prepareOrder(data);await f.draft.completeOrder(a.pending.requestId,{orderNumber:'KAS-2026-0001'});const reload=f.load();assert.equal((await reload.prepareOrder(data)).receipt.orderNumber,'KAS-2026-0001');await reload.startNewOrder({});const fresh=await reload.prepareOrder(data);assert.notEqual(fresh.pending.requestId,a.pending.requestId);
});
test('pending request cannot be discarded as a fresh order',async()=>{
 const f=fixture();await f.draft.prepareOrder(data);await assert.rejects(()=>f.draft.startNewOrder({}));
});
test('unavailable persistent storage refuses submission instead of losing retry identity',async()=>{
 const f=fixture();f.local.setItem=()=>{throw new Error('quota');};await assert.rejects(()=>f.draft.prepareOrder(data),/Penyimpanan/);
});
test('successful server save remains success even when browser history is corrupt/full',async()=>{
 const f=fixture();const pending=await f.draft.prepareOrder(data);const globals={...f.globals,localStorage:{getItem:()=>'{broken',setItem:()=>{throw new Error('full');}}};
 const service=compile('lib/services/order.service.ts',globals,{
 '@/lib/repositories/order.repo':{orderRepository:{submit:async(payload,id)=>{assert.equal(id,pending.pending.requestId);return {success:true,orderNumber:'KAS-2026-0001'};}}},
 '@/lib/validators/order':{validateOrderForm:()=>({success:true,data})},'@/lib/order/draft':f.draft
 });
 assert.equal((await service.OrderService.submit(data)).success,true);
});
test('ambiguous network response preserves key, while definitive rejection unlocks editing',async()=>{
 const f=fixture();let response={success:false,error:'timeout'};const ids=[];
 const service=compile('lib/services/order.service.ts',{...f.globals,localStorage:f.local},{
 '@/lib/repositories/order.repo':{orderRepository:{submit:async(_,id)=>{ids.push(id);return response;}}},
 '@/lib/validators/order':{validateOrderForm:()=>({success:true,data})},'@/lib/order/draft':f.draft
 });
 await service.OrderService.submit(data);await service.OrderService.submit(data);assert.equal(ids[0],ids[1]);response={success:false,committed:false,code:'RATE_LIMIT'};await service.OrderService.submit(data);assert.equal(f.draft.readOrderDraft().pending,undefined);
});
