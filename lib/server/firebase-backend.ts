import { createHash, createHmac, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import { defaultSiteContent } from '@/data/site-content';
import { projects as bundledPortfolio } from '@/data/projects';
import { applyPortfolioUpdates, findBundledPortfolio, mergePortfolioForCms, portfolioSlug, type PortfolioRecord } from '@/lib/repositories/portfolio-merge';
import { validateOrderForm } from '@/lib/validators/order';
import { createDoc, deleteDoc, getDoc, listDocs, mergeDoc, queryEquals, setDoc } from './firebase-rest';
import type { ServerSession } from './session';

export interface BackendResult<T = any> { success: boolean; data?: T; error?: string; code?: string; message?: string; committed?: boolean; }

const CMS_SECTIONS = ['brand','navigation','hero','stats','services','featured','portfolio','whyChoose','pricing','process','testimonials','faq','team','about','contact','cta','footer','seo'];
const HIDDEN_ORDER_FIELDS = new Set(['requestId','requestHash']);
const memRate = new Map<string,{count:number;resetAt:number}>();

const ok = <T>(data?: T, extra: Partial<BackendResult<T>> = {}): BackendResult<T> => ({ success: true, ...(data === undefined ? {} : { data }), ...extra });
const fail = (error: string, code?: string, committed?: boolean): BackendResult => ({ success: false, error, ...(code ? { code } : {}), ...(committed === undefined ? {} : { committed }) });
const iso = () => new Date().toISOString();
const cleanText = (v: any, max = 2000) => String(v ?? '').trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').slice(0,max);
const slugify = (v: any) => cleanText(v,200).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const safeUrl = (v: any) => { const s=String(v||'').trim(); if (!s) return ''; if (s.startsWith('/') || /^https:\/\//i.test(s)) return s.slice(0,1000); throw new Error('URL harus menggunakan HTTPS.'); };
const hash = (v: string) => createHash('sha256').update(v).digest('hex');
const compareHex = (a:string,b:string) => /^[a-f0-9]{64}$/.test(a) && /^[a-f0-9]{64}$/.test(b) && timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));
const numberId = (prefix:string) => `${prefix}-${new Date().getFullYear()}-${Date.now()}${randomInt(1000,9999)}`;
const byDateDesc = (field:string) => (a:any,b:any) => Date.parse(String(b[field]||'')) - Date.parse(String(a[field]||''));
const stripOrderPrivate = (o:any) => Object.fromEntries(Object.entries(o).filter(([k])=>!HIDDEN_ORDER_FIELDS.has(k)));

function consumeRate(key:string, limit:number, windowMs:number): boolean {
  const now=Date.now(); const old=memRate.get(key); const state=!old||old.resetAt<=now?{count:0,resetAt:now+windowMs}:old;
  if (state.count>=limit) return false; state.count++; memRate.set(key,state); return true;
}

export function allowAdminLoginAttempt(emailInput:any): boolean {
  const email=String(emailInput||'').trim().toLowerCase();
  const emailKey=email?hash(email).slice(0,24):'missing';
  return consumeRate('admin-login-global',40,15*60*1000) && consumeRate(`admin-login:${emailKey}`,8,15*60*1000);
}

async function mail(to:string|undefined, subject:string, text:string) {
  const email=String(to||'').trim(); if (!email) return;
  try { await setDoc('mail', randomUUID(), { to:[email], message:{subject:cleanText(subject,300), text:cleanText(text,12000)}, createdAt:iso(), source:'kastriva-next' }); } catch { /* email is best-effort; Firebase Trigger Email extension may be optional */ }
}

async function audit(action:string, userId:string, details:any={}) {
  try { await setDoc('auditLogs', randomUUID(), { action, userId, details, createdAt:iso(), userEmail:userId.includes('@')?userId:'' }); } catch {}
}

async function getByField(collection:string, field:string, value:any): Promise<any|null> {
  const rows=await queryEquals(collection,field,value); return rows[0]||null;
}
async function patch(collection:string,id:string,fields:any){ return mergeDoc(collection,id,{...fields}); }

function sanitizeCms(value:any,key='',depth=0):any {
  if(depth>8) throw new Error('Struktur konten terlalu dalam.');
  if(value===null) return null;
  if(Array.isArray(value)){ if(value.length>100) throw new Error('Terlalu banyak item dalam satu bagian.'); return value.map(x=>sanitizeCms(x,key,depth+1)); }
  if(typeof value==='object') { const out:any={}; Object.keys(value).slice(0,100).forEach(k=>{ if(/^[A-Za-z0-9_-]{1,50}$/.test(k)) out[k]=sanitizeCms(value[k],k,depth+1); }); return out; }
  if(typeof value==='boolean') return value;
  if(typeof value==='number') return Number.isFinite(value)?value:0;
  let text=String(value??'').trim().slice(0,8000); const lower=key.toLowerCase();
  if(/(href|url|website|instagram|tiktok|github|youtube|image)$/.test(lower)&&text){ if(!(text==='#'||text.startsWith('/')||/^https:\/\//i.test(text)||/^mailto:/i.test(text))) return '#'; }
  if(lower==='whatsapp') text=text.replace(/[^0-9+]/g,'').slice(0,20);
  return text;
}

async function getSiteContentMap(){
  const docs=await listDocs('siteContent');
  const out:any={};
  docs.forEach(d=>{
    if(CMS_SECTIONS.includes(d.id)&&d.content&&typeof d.content==='object') out[d.id]=d.content;
  });

  // One-time compatibility migration: older CMS data may still contain the
  // placeholder email used before kastriva.web.id was configured. Normalize
  // only that exact legacy value, while preserving any future custom email.
  if(String(out.brand?.email||'').trim().toLowerCase()==='hello@kastriva.com'){
    out.brand={...out.brand,email:defaultSiteContent.brand.email};
    try {
      await setDoc('siteContent','brand',{content:out.brand,updatedAt:iso()});
    } catch {
      // The public site can still use the normalized in-memory value even if
      // persistence is temporarily unavailable.
    }
  }

  return out;
}

function bundledPortfolioPayload(project:any, index:number, now=iso()) {
  return {
    slug: portfolioSlug(String(project.title || '')),
    title: cleanText(project.title,200),
    category: cleanText(project.category,100),
    description: cleanText(project.description,4000),
    shortDescription: cleanText(project.shortDescription || '',500),
    image: String(project.image || '').trim(),
    images: Array.isArray(project.images) ? project.images.map((x:any)=>String(x).trim()).filter(Boolean).slice(0,30) : [],
    technologies: Array.isArray(project.technologies) ? project.technologies.map((x:any)=>cleanText(x,100)).filter(Boolean) : [],
    demoUrl: String(project.demoUrl || '').trim(),
    githubUrl: String(project.githubUrl || '').trim(),
    year: String(project.year || new Date().getFullYear()),
    status: cleanText(project.status || 'Completed',50),
    problemSolved: cleanText(project.problemSolved || '',2000),
    solution: cleanText(project.solution || '',2000),
    features: Array.isArray(project.features) ? project.features.map((x:any)=>cleanText(x,200)).filter(Boolean) : [],
    myRole: cleanText(project.myRole || '',500),
    featured: project.featured === true,
    published: project.published !== false,
    sortOrder: Number(project.sortOrder) || index + 1,
    deleted: false,
    createdAt: project.createdAt || now,
    updatedAt: project.updatedAt || now,
  };
}

async function getPortfolio(admin=false, params:any={}) {
  const remote = await listDocs('portfolio') as PortfolioRecord[];
  let rows = mergePortfolioForCms(remote, admin);

  if(params.category&&params.category!=='Semua'&&params.category!=='all') rows=rows.filter(x=>x.category===params.category);
  if(params.search){ const q=String(params.search).toLowerCase(); rows=rows.filter(x=>[x.title,x.description,x.category,(x.technologies||[]).join(' ')].some(v=>String(v||'').toLowerCase().includes(q))); }

  // cmsSource is useful in Admin CMS only. Keep public payload clean.
  if(!admin) rows=rows.map(({cmsSource,deleted,...row})=>row as PortfolioRecord);
  return rows;
}

async function syncBundledPortfolioDefaults() {
  const remote = await listDocs('portfolio') as PortfolioRecord[];
  let imported = 0;
  let skipped = 0;
  const now = iso();

  for (let index = 0; index < bundledPortfolio.length; index++) {
    const project = bundledPortfolio[index];
    const exists = remote.some((record) => findBundledPortfolio(applyPortfolioUpdates(record))?.id === project.id);
    if (exists) { skipped++; continue; }
    await setDoc('portfolio', String(project.id), bundledPortfolioPayload(project, index, now));
    imported++;
  }

  await audit('portfolio_defaults_synced','admin',{imported,skipped,total:bundledPortfolio.length});
  return { imported, skipped, total: bundledPortfolio.length };
}

async function revisionQuota(orderId:string){ const rows=(await listDocs('quotations')).filter(q=>q.orderId===orderId&&q.status==='approved').sort(byDateDesc('updatedAt')); return rows[0]?Math.max(0,Number(rows[0].revisionLimit??2)):2; }

async function customerDashboard(customerId:string){
  const [orders0,projects0,quotes0,invoices0,revisions0,handovers0,updates0]=await Promise.all(['orders','projects','quotations','invoices','revisions','handovers','projectUpdates'].map(listDocs));
  const orders=orders0.filter((o:any)=>o.customerId===customerId).map(stripOrderPrivate).sort(byDateDesc('createdAt'));
  const revisions=revisions0.filter((r:any)=>r.customerId===customerId).sort(byDateDesc('requestedAt'));
  const projects=await Promise.all(projects0.filter((p:any)=>p.customerId===customerId).map(async(p:any)=>({ ...p,
    updates:updates0.filter((u:any)=>u.projectId===p.id).sort(byDateDesc('createdAt')),
    revisions:revisions.filter((r:any)=>r.projectId===p.id), revisionLimit:await revisionQuota(p.orderId),
    revisionUsed:revisions.filter((r:any)=>r.projectId===p.id&&r.status!=='Rejected').length,
  })));
  const quotations=quotes0.filter((q:any)=>q.customerId===customerId).map((q:any)=>({...q,items:Array.isArray(q.items)?q.items:[],revisionLimit:Number(q.revisionLimit??2),displayStatus:q.status==='sent'&&q.validUntil&&new Date(`${q.validUntil}T23:59:59`).getTime()<Date.now()?'expired':q.status})).sort(byDateDesc('createdAt'));
  const invoices=invoices0.filter((i:any)=>i.customerId===customerId).map((i:any)=>{const total=Number(i.total||0), paid=Number(i.amountPaid||0); let display=i.paymentStatus; if(!['Paid','Cancelled'].includes(i.paymentStatus)&&i.dueDate&&new Date(i.dueDate)<new Date()) display='Overdue'; return {...i,items:Array.isArray(i.items)?i.items:[],total,amountPaid:paid,balance:Math.max(0,total-paid),displayStatus:display};}).sort(byDateDesc('createdAt'));
  const handovers=handovers0.filter((h:any)=>h.customerId===customerId).sort(byDateDesc('createdAt'));
  return {orders,projects,quotations,invoices,revisions,handovers};
}

export async function requestCustomerOtp(emailInput:any): Promise<BackendResult> {
  const email=String(emailInput||'').trim().toLowerCase();
  if(!/^\S+@\S+\.\S+$/.test(email)||email.length>254) return fail('Format email tidak valid.');
  if(!consumeRate('otp-global',60,3600000)||!consumeRate(`otp-hour:${email}`,5,3600000)||!consumeRate(`otp-minute:${email}`,1,60000)) return fail('Permintaan terlalu sering. Tunggu sebelum mencoba kembali.','RATE_LIMIT');
  const customer=(await queryEquals('customers','email',email))[0]||null;
  const challengeId=hash(`${randomUUID()}:${Date.now()}:${email}`); const code=String(randomInt(0,100000000)).padStart(8,'0'); const expiresAt=Date.now()+10*60000;
  const otpSecret=process.env.SESSION_SECRET||''; const codeHash=createHmac('sha256',otpSecret).update(`${challengeId}:${code}`).digest('hex');
  await setDoc('authChallenges',challengeId,{customerId:customer?.id||'',email,name:customer?.name||'',codeHash,attempts:0,expiresAt,createdAt:iso()});
  if(customer) await mail(email,'Kode login Kastriva',`Kode login Anda: ${code}\n\nBerlaku 10 menit dan hanya dapat dipakai sekali. Jangan bagikan kode ini kepada siapa pun.\nJika Anda tidak meminta login, abaikan email ini.`);
  return ok({challengeId,expiresAt,retryAfter:60},{message:'Jika email terdaftar, kode verifikasi telah dikirim. Periksa inbox dan folder spam.'});
}

export async function verifyCustomerOtp(challengeId:any, code:any): Promise<BackendResult<any>> {
  if(!consumeRate('otp-verify',100,60000)) return fail('Terlalu banyak percobaan. Coba lagi nanti.','RATE_LIMIT');
  const generic=()=>fail('Kode salah, sudah dipakai, atau kedaluwarsa. Minta kode baru bila diperlukan.');
  const id=String(challengeId||''); if(!/^[a-f0-9]{64}$/.test(id)) return generic();
  const row=await getDoc('authChallenges',id); if(!row||Number(row.expiresAt||0)<=Date.now()) { if(row) await deleteDoc('authChallenges',id); return generic(); }
  const attempts=Number(row.attempts||0)+1; const expected=createHmac('sha256',process.env.SESSION_SECRET||'').update(`${id}:${String(code||'')}`).digest('hex');
  if(!/^\d{8}$/.test(String(code||''))||!compareHex(String(row.codeHash||''),expected)||!row.customerId){ if(attempts>=5) await deleteDoc('authChallenges',id); else await patch('authChallenges',id,{attempts}); return generic(); }
  const customer=await getDoc('customers',String(row.customerId)); await deleteDoc('authChallenges',id); if(!customer||String(customer.email).toLowerCase()!==String(row.email).toLowerCase()) return generic();
  return ok({customerId:customer.id,email:customer.email,name:customer.name});
}

export async function handleFirebaseAction(action:string, body:any={}, params:any={}, session:ServerSession|null=null): Promise<BackendResult> {
  try {
    switch(action){
      case 'health': return ok({status:'ok',timestamp:iso(),version:'6.0-firebase',backend:'firestore'});
      case 'getSiteContent': return ok(await getSiteContentMap());
      case 'getSiteContentAdmin': return ok(await getSiteContentMap());
      case 'updateSiteContentSection': { const section=String(body.section||''); if(!CMS_SECTIONS.includes(section)||!body.content||typeof body.content!=='object'||Array.isArray(body.content)) return fail('Konten CMS tidak valid.'); const content=sanitizeCms(body.content,section); const json=JSON.stringify(content); if(json.length>45000)return fail('Konten bagian ini terlalu besar.'); const updatedAt=iso(); await setDoc('siteContent',section,{content,updatedAt}); return ok({section,updatedAt}); }
      case 'getPortfolio': return ok(await getPortfolio(false,params));
      case 'getPortfolioAdmin': return ok(await getPortfolio(true,params));
      case 'getPortfolioBySlug': { const slug=String(params.slug||body.slug||''); const rows=await getPortfolio(false,{}); const p=rows.find(x=>String(x.slug||slugify(x.title))===slug); return p?ok(p):fail('Portfolio not found'); }
      case 'getPortfolioCategories': { const rows=await getPortfolio(false,{}); const m=new Map<string,number>(); rows.forEach(x=>m.set(String(x.category||'Lainnya'),(m.get(String(x.category||'Lainnya'))||0)+1)); return ok([{id:'all',name:'Semua',slug:'all',count:rows.length},...Array.from(m.entries()).map(([name,count])=>({id:slugify(name),name,slug:slugify(name),count}))]); }
      case 'createPortfolio':
      case 'updatePortfolio': { const id=action==='updatePortfolio'?String(body.id||''):randomUUID(); if(action==='updatePortfolio'&&!id)return fail('ID portfolio wajib diisi'); const title=cleanText(body.title,200),category=cleanText(body.category,100),description=cleanText(body.description,4000); if(!title||!category||!description)return fail('Judul, kategori, dan deskripsi wajib diisi'); const old=action==='updatePortfolio'?await getDoc('portfolio',id):null; const now=iso(); const data={slug:slugify(title),title,category,description,shortDescription:cleanText(body.shortDescription,500),image:String(body.image||'').trim(),images:Array.isArray(body.images)?body.images.map((x:any)=>String(x).trim()).filter(Boolean).slice(0,30):[],technologies:Array.isArray(body.technologies)?body.technologies.map((x:any)=>cleanText(x,100)).filter(Boolean):[],demoUrl:String(body.demoUrl||'').trim(),githubUrl:String(body.githubUrl||'').trim(),year:String(body.year||new Date().getFullYear()),status:cleanText(body.status||'Completed',50),problemSolved:cleanText(body.problemSolved,2000),solution:cleanText(body.solution,2000),features:Array.isArray(body.features)?body.features.map((x:any)=>cleanText(x,200)).filter(Boolean):[],myRole:cleanText(body.myRole,500),featured:body.featured===true||String(body.featured).toLowerCase()==='true',published:body.published===true||String(body.published).toLowerCase()==='true',sortOrder:Math.max(1,Number(body.sortOrder)||999),deleted:false,createdAt:old?.createdAt||now,updatedAt:now}; await setDoc('portfolio',id,data); await audit(action==='createPortfolio'?'portfolio_created':'portfolio_updated','admin',{id,title}); return ok({id}); }
      case 'syncPortfolioDefaults': return ok(await syncBundledPortfolioDefaults());
      case 'deletePortfolio': { const id=String(body.id||''); if(!id)return fail('ID portfolio wajib diisi'); const existing=await getDoc('portfolio',id); const candidate=(existing||{id}) as PortfolioRecord; const bundled=findBundledPortfolio(candidate); if(bundled){ const index=Math.max(0,bundledPortfolio.findIndex((p)=>String(p.id)===String(bundled.id))); const base=bundledPortfolioPayload(bundled,index); await setDoc('portfolio',id,{...base,...(existing||{}),deleted:true,published:false,updatedAt:iso()}); } else { await deleteDoc('portfolio',id); } await audit('portfolio_deleted','admin',{id,bundled:Boolean(bundled)}); return ok(); }
      case 'getServices': { const rows=(await listDocs('services')).filter(x=>x.isActive===true).sort((a,b)=>(Number(a.sortOrder)||999)-(Number(b.sortOrder)||999)); return ok(rows); }
      case 'getSettings': { const d=await getDoc('settings','global'); return ok(d?Object.fromEntries(Object.entries(d).filter(([k])=>k!=='id')):{}); }
      case 'createOrder': {
        const requestId=String(body.requestId||'').toLowerCase(); if(!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(requestId))return fail('ID permintaan tidak valid. Muat ulang formulir versi terbaru.','VALIDATION',false);
        const validation=validateOrderForm(body); if(!validation.success)return fail(Object.values(validation.errors||{})[0]||'Data order tidak valid.','VALIDATION',false); const d=validation.data!; const requestHash=hash(JSON.stringify(d));
        const existing=await getDoc('orders',requestId); if(existing){ if(existing.requestHash!==requestHash)return fail('Permintaan ini sudah digunakan dengan isi berbeda. Periksa order sebelumnya.','IDEMPOTENCY_CONFLICT'); return ok({id:existing.id,orderNumber:existing.orderNumber,status:existing.status,replayed:true}); }
        if(!consumeRate('order-global',30,3600000)||!consumeRate(`order-email:${d.email}`,5,3600000))return fail('Terlalu banyak permintaan. Coba kembali setelah batas waktu berakhir.','RATE_LIMIT',false);
        const migratedCustomer=(await queryEquals('customers','email',d.email))[0]||null; const customerId=String(migratedCustomer?.id||`cus_${hash(d.email).slice(0,24)}`); const now=iso(); const oldCustomer=migratedCustomer||await getDoc('customers',customerId); await setDoc('customers',customerId,{name:d.name,email:d.email,whatsapp:d.whatsapp,business:d.business||'',avatar:oldCustomer?.avatar||'',status:'Active',createdAt:oldCustomer?.createdAt||now,lastActivity:now});
        const orderNumber=numberId('KAS'); const order={orderNumber,customerId,name:d.name,business:d.business||'',email:d.email,whatsapp:d.whatsapp,projectType:d.type,serviceId:d.serviceId||'',portfolioId:d.portfolioId||'',portfolioTitle:d.portfolioTitle||'',budget:d.budget||'',deadline:d.deadline||'',description:d.description,features:d.features||'',referenceUrl:d.reference||'',status:'Submitted',createdAt:now,updatedAt:now,requestId,requestHash};
        const made=await createDoc('orders',requestId,order); if(!made.created){ const replay=await getDoc('orders',requestId); if(replay && replay.requestHash===requestHash)return ok({id:requestId,orderNumber:replay.orderNumber,status:replay.status,replayed:true}); return fail('Permintaan sedang diproses. Coba lagi dengan permintaan yang sama.','CONFLICT'); }
        await audit('order_created',customerId,{orderId:requestId,orderNumber}); await mail(process.env.ADMIN_EMAIL,`Order Baru ${orderNumber} | Kastriva`,`Order baru dari ${d.name}\nEmail: ${d.email}\nJenis: ${d.type}\nNomor: ${orderNumber}`); await mail(d.email,`Order ${orderNumber} diterima | Kastriva`,`Halo ${d.name},\n\nOrder Anda ${orderNumber} sudah kami terima. Simpan nomor ini untuk referensi.\n\nSalam,\nTim Kastriva`); return ok({id:requestId,orderNumber,status:'Submitted',replayed:false});
      }
      case 'getOrders': { let rows=(await listDocs('orders')).map(stripOrderPrivate); if(params.status)rows=rows.filter(x=>x.status===params.status); if(params.search){const q=String(params.search).toLowerCase();rows=rows.filter(x=>[x.name,x.orderNumber,x.email].some(v=>String(v||'').toLowerCase().includes(q)));} rows.sort(byDateDesc('createdAt')); return ok(rows); }
      case 'getOrder': { const row=await getDoc('orders',String(params.id||body.id||'')); return row?ok(stripOrderPrivate(row)):fail('Order not found'); }
      case 'updateOrderStatus': { const id=String(body.id||''); const status=String(body.status||''); if(!['Submitted','Reviewing','Discussing','Cancelled'].includes(status))return fail('Invalid status'); const row=await getDoc('orders',id); if(!row)return fail('Order not found'); if(String(body.expectedUpdatedAt||'')!==String(row.updatedAt||''))return fail('Order telah diperbarui. Muat ulang sebelum mengubah status.','CONFLICT'); const updatedAt=new Date(Math.max(Date.now(),Date.parse(String(row.updatedAt||''))+1||Date.now())).toISOString(); await patch('orders',id,{status,updatedAt}); await audit('order_status_updated','admin',{orderId:id,status}); return ok({id,status}); }
      case 'getCustomers': { const rows=(await listDocs('customers')).sort(byDateDesc('lastActivity')); return ok(rows); }
      case 'getCustomer': { const row=await getDoc('customers',String(params.id||body.id||'')); return row?ok(row):fail('Customer not found'); }
      case 'getDashboardStats': { const [orders,customers,projects,quotes]=await Promise.all(['orders','customers','projects','quotations'].map(listDocs)); const breakdown:any={};orders.forEach(o=>breakdown[o.status||'Unknown']=(breakdown[o.status||'Unknown']||0)+1); const recent=orders.sort(byDateDesc('createdAt')).slice(0,5).map(o=>({id:o.id,orderNumber:o.orderNumber,name:o.name,projectType:o.projectType,status:o.status,createdAt:o.createdAt})); return ok({totalOrders:orders.length,newOrders:breakdown.Submitted||0,activeProjects:projects.filter(p=>!['Completed','Cancelled',''].includes(p.status)).length,completedProjects:projects.filter(p=>p.status==='Completed').length,totalCustomers:customers.length,pendingQuotations:quotes.filter(q=>['pending','sent'].includes(q.status)).length,statusBreakdown:breakdown,recentOrders:recent}); }
      case 'getProjects': { const rows=(await listDocs('projects')).sort(byDateDesc('createdAt')); return ok(rows); }
      case 'getProject': { const id=String(params.id||body.id||''); const project=await getDoc('projects',id); if(!project)return fail('Project not found'); const [updates,order]=await Promise.all([queryEquals('projectUpdates','projectId',id),getDoc('orders',String(project.orderId))]); updates.sort(byDateDesc('createdAt')); return ok({project,updates,order:order?{orderNumber:order.orderNumber,customerName:order.name,customerEmail:order.email,whatsapp:order.whatsapp}:null}); }
      case 'createProject': { const orderId=String(body.orderId||''); if(!orderId)return fail('Missing orderId'); const order=await getDoc('orders',orderId); if(!order)return fail('Order not found'); if(order.status!=='Approved')return fail('Project hanya dapat dimulai setelah quotation disetujui customer'); if((await queryEquals('projects','orderId',orderId)).length)return fail('Project sudah ada untuk order ini'); const id=randomUUID(),now=iso(); const project={orderId,customerId:order.customerId,projectName:cleanText(body.projectName||`${order.projectType} - ${order.name}`,200),description:cleanText(body.description||order.description,2000),status:'In Progress',progress:0,startDate:now,deadline:order.deadline||'',completedDate:'',createdAt:now,updatedAt:now}; await setDoc('projects',id,project);await patch('orders',orderId,{status:'In Progress',updatedAt:now});await audit('project_created','admin',{projectId:id,orderId});return ok({id}); }
      case 'createProjectUpdate': { const projectId=String(body.projectId||''); if(!projectId||!cleanText(body.title,200))return fail('Missing projectId or title'); const project=await getDoc('projects',projectId); if(!project)return fail('Project not found'); const progress=Math.max(0,Math.min(95,Number(body.progress)||0)),status=String(body.status||'In Progress'); if(!['In Progress','Revision'].includes(status))return fail('Status progress tidak valid. Gunakan Serah Terima untuk menyelesaikan project.');const now=iso(),id=randomUUID();await setDoc('projectUpdates',id,{projectId,title:cleanText(body.title,200),description:cleanText(body.description,2000),progress,status,createdAt:now,createdBy:'admin'});await patch('projects',projectId,{status,progress,updatedAt:now});await patch('orders',String(project.orderId),{status,updatedAt:now});const order=await getDoc('orders',String(project.orderId));if(order?.email)await mail(order.email,`Update Project: ${project.projectName} (${progress}%) | Kastriva`,`Halo ${order.name},\n\n${cleanText(body.title,200)}\n${cleanText(body.description,2000)}\n\nProgress: ${progress}%\nStatus: ${status}`);return ok(); }
      case 'getQuotations': { const rows=(await listDocs('quotations')).map(q=>({...q,items:Array.isArray(q.items)?q.items:[],revisionLimit:Number(q.revisionLimit??2),displayStatus:q.status==='sent'&&q.validUntil&&new Date(`${q.validUntil}T23:59:59`).getTime()<Date.now()?'expired':q.status})).sort(byDateDesc('createdAt'));return ok(rows); }
      case 'createQuotation': { const orderId=String(body.orderId||''); if(!orderId||!Array.isArray(body.items)||!body.items.length)return fail('Order dan items wajib diisi');const order=await getDoc('orders',orderId);if(!order)return fail('Order tidak ditemukan');const existing=(await queryEquals('quotations','orderId',orderId)).find(q=>q.status==='approved'||(q.status==='sent'&&(!q.validUntil||new Date(`${q.validUntil}T23:59:59`).getTime()>=Date.now())));if(existing)return fail(`Order ini masih memiliki penawaran aktif: ${existing.quotationNumber}`);let subtotal=0;const items=body.items.slice(0,30).map((it:any)=>{const description=cleanText(it.description,300),qty=Math.max(1,Math.min(999,Number(it.qty)||1)),price=Math.max(0,Math.min(999999999999,Number(it.price)||0)),total=qty*price; if(!description||price<=0)return null;subtotal+=total;return{description,qty,price,total};}).filter(Boolean);if(!items.length)return fail('Minimal satu item penawaran harus valid');const discount=Math.max(0,Math.min(subtotal,Number(body.discount)||0)),taxPercent=Math.max(0,Math.min(100,Number(body.tax)||0)),tax=Math.round((subtotal-discount)*taxPercent/100),total=subtotal-discount+tax,revisionLimit=Number.isFinite(Number(body.revisionLimit))?Math.max(0,Math.min(20,Math.floor(Number(body.revisionLimit)))):2;const now=iso(),id=randomUUID(),quotationNumber=numberId('QTN'),projectName=cleanText(body.projectName||`${order.projectType} - ${order.name}`,200),paymentTerms=cleanText(body.paymentTerms||'Pembayaran mengikuti invoice yang diterbitkan setelah penawaran disetujui.',1000),notes=cleanText(body.notes,1500);await setDoc('quotations',id,{quotationNumber,orderId,customerId:order.customerId,projectName,items,subtotal,discount,tax,total,notes,validUntil:String(body.validUntil||''),status:'sent',createdAt:now,updatedAt:now,revisionLimit,paymentTerms,customerNote:'',respondedAt:''});await patch('orders',orderId,{status:'Quotation',updatedAt:now});if(order.email)await mail(order.email,`Penawaran ${quotationNumber} | Kastriva`,`Halo ${order.name},\n\nPenawaran ${quotationNumber} untuk ${projectName}.\nTotal: Rp ${total.toLocaleString('id-ID')}\nRevisi: ${revisionLimit} kali\nBerlaku hingga: ${body.validUntil||'-'}\n\nSilakan login ke Customer Dashboard untuk merespons.`);return ok({id,quotationNumber,total}); }
      case 'respondQuotation': { const id=String(body.quotationId||''),response=String(body.response||'');if(!id||!['approved','rejected'].includes(response))return fail('Respons penawaran tidak valid');const q=await getDoc('quotations',id);if(!q)return fail('Penawaran tidak ditemukan');if(q.customerId!==session?.customerId)return fail('Unauthorized');if(q.status!=='sent')return fail('Penawaran sudah direspons sebelumnya');if(q.validUntil&&new Date(`${q.validUntil}T23:59:59`).getTime()<Date.now())return fail('Masa berlaku penawaran sudah berakhir. Hubungi admin untuk penawaran terbaru.');const now=iso(),customerNote=cleanText(body.customerNote,1000);await patch('quotations',id,{status:response,customerNote,respondedAt:now,updatedAt:now});await patch('orders',String(q.orderId),{status:response==='approved'?'Approved':'Discussing',updatedAt:now});await mail(process.env.ADMIN_EMAIL,`${response==='approved'?'✅':'❌'} Penawaran ${q.quotationNumber} ${response==='approved'?'disetujui':'ditolak'}`,`Customer ${response==='approved'?'menyetujui':'menolak'} penawaran ${q.quotationNumber}.${customerNote?`\nCatatan: ${customerNote}`:''}`);return ok(); }
      case 'getInvoices': { const rows=(await listDocs('invoices')).map(inv=>{const total=Number(inv.total||0),paid=Number(inv.amountPaid||0);let display=inv.paymentStatus;if(!['Paid','Cancelled'].includes(inv.paymentStatus)&&inv.dueDate&&new Date(inv.dueDate)<new Date())display='Overdue';return{...inv,items:Array.isArray(inv.items)?inv.items:[],total,amountPaid:paid,balance:Math.max(0,total-paid),displayStatus:display};}).sort(byDateDesc('createdAt'));return ok(rows); }
      case 'createInvoice': { const quotationId=String(body.quotationId||'');if(!quotationId)return fail('Pilih penawaran yang sudah disetujui');const q=await getDoc('quotations',quotationId);if(!q)return fail('Penawaran tidak ditemukan');if(q.status!=='approved')return fail('Invoice hanya dapat dibuat dari penawaran yang disetujui');if((await queryEquals('invoices','quotationId',quotationId)).some(x=>x.paymentStatus!=='Cancelled'))return fail('Invoice untuk penawaran ini sudah ada');const order=await getDoc('orders',String(q.orderId));if(!order)return fail('Order terkait tidak ditemukan');const id=randomUUID(),invoiceNumber=numberId('INV'),now=iso(),paymentMethod=cleanText(body.paymentMethod||'Transfer bank / metode yang disepakati',500),notes=cleanText(body.notes,1200);await setDoc('invoices',id,{invoiceNumber,orderId:q.orderId,customerId:q.customerId,projectName:q.projectName,items:Array.isArray(q.items)?q.items:[],subtotal:Number(q.subtotal||0),discount:Number(q.discount||0),tax:Number(q.tax||0),total:Number(q.total||0),paymentStatus:'Unpaid',dueDate:String(body.dueDate||''),paymentMethod,createdAt:now,updatedAt:now,quotationId:q.id,amountPaid:0,notes,paidAt:''});if(order.email)await mail(order.email,`Invoice ${invoiceNumber} | Kastriva`,`Halo ${order.name},\n\nInvoice ${invoiceNumber} untuk ${q.projectName} telah diterbitkan.\nTotal: Rp ${Number(q.total||0).toLocaleString('id-ID')}\nJatuh tempo: ${body.dueDate||'-'}\nMetode: ${paymentMethod}`);return ok({id,invoiceNumber,total:Number(q.total||0)}); }
      case 'updateInvoicePayment': { const id=String(body.invoiceId||''),status=String(body.paymentStatus||'');if(!id||!['Unpaid','Partial','Paid','Cancelled'].includes(status))return fail('Status pembayaran tidak valid');const inv=await getDoc('invoices',id);if(!inv)return fail('Invoice tidak ditemukan');if(inv.paymentStatus==='Cancelled'&&status!=='Cancelled')return fail('Invoice yang dibatalkan tidak dapat diaktifkan kembali');const total=Number(inv.total||0);let amountPaid=Math.max(0,Math.min(total,Number(body.amountPaid)||0));if(status==='Paid')amountPaid=total;if(status==='Unpaid')amountPaid=0;if(status==='Partial'&&(amountPaid<=0||amountPaid>=total))return fail('Nominal pembayaran sebagian harus lebih dari 0 dan kurang dari total invoice');const now=iso();await patch('invoices',id,{paymentStatus:status,amountPaid,paidAt:status==='Paid'?now:'',updatedAt:now});const order=await getDoc('orders',String(inv.orderId));if(order?.email)await mail(order.email,`Update pembayaran ${inv.invoiceNumber} | Kastriva`,`Status: ${status}\nDibayar: Rp ${amountPaid.toLocaleString('id-ID')}\nSisa: Rp ${Math.max(0,total-amountPaid).toLocaleString('id-ID')}`);return ok(); }
      case 'getRevisions': return ok((await listDocs('revisions')).sort(byDateDesc('requestedAt')));
      case 'requestRevision': { const projectId=String(body.projectId||'');if(!projectId||!cleanText(body.title,200)||!cleanText(body.description,2000))return fail('Project, judul, dan detail revisi wajib diisi');const project=await getDoc('projects',projectId);if(!project)return fail('Project tidak ditemukan');if(project.customerId!==session?.customerId)return fail('Unauthorized');if(project.status==='Completed')return fail('Project sudah selesai dan serah terima telah diterima');if(project.status==='Handover')return fail('Project sedang dalam tahap serah terima. Hubungi admin bila masih ada koreksi.');if((await queryEquals('handovers','projectId',projectId)).some(h=>h.status==='Accepted'))return fail('Serah terima project sudah diterima');const revisions=await queryEquals('revisions','projectId',projectId),quota=await revisionQuota(String(project.orderId)),used=revisions.filter(r=>r.status!=='Rejected').length;if(quota>0&&used>=quota)return fail(`Kuota revisi pada penawaran sudah digunakan (${used}/${quota}). Hubungi admin untuk perubahan scope tambahan.`,'REVISION_LIMIT');const now=iso(),id=randomUUID(),revisionNumber=numberId('REV'),priority=['Low','Normal','High'].includes(body.priority)?body.priority:'Normal';await setDoc('revisions',id,{revisionNumber,projectId,orderId:project.orderId,customerId:session!.customerId,title:cleanText(body.title,200),description:cleanText(body.description,2000),status:'Requested',priority,adminResponse:'',requestedAt:now,updatedAt:now,resolvedAt:''});await patch('projects',projectId,{status:'Revision',updatedAt:now});await patch('orders',String(project.orderId),{status:'Revision',updatedAt:now});await mail(process.env.ADMIN_EMAIL,`🔁 Permintaan revisi ${revisionNumber} | ${project.projectName}`,`${body.title}\n${body.description}`);return ok({id,revisionNumber,used:used+1,limit:quota}); }
      case 'updateRevision': { const id=String(body.revisionId||''),status=String(body.status||'');if(!id||!['Requested','In Progress','Resolved','Rejected'].includes(status))return fail('Status revisi tidak valid');const rev=await getDoc('revisions',id);if(!rev)return fail('Revisi tidak ditemukan');const now=iso(),adminResponse=cleanText(body.adminResponse,1600);await patch('revisions',id,{status,adminResponse,updatedAt:now,resolvedAt:['Resolved','Rejected'].includes(status)?now:''});const project=await getDoc('projects',String(rev.projectId));if(project){const open=(await queryEquals('revisions','projectId',String(rev.projectId))).some(r=>r.id!==id&&['Requested','In Progress'].includes(r.status));const next=['Requested','In Progress'].includes(status)||open?'Revision':'In Progress';if(project.status!=='Completed'){await patch('projects',project.id,{status:next,updatedAt:now});await patch('orders',String(project.orderId),{status:next,updatedAt:now});}}const order=await getDoc('orders',String(rev.orderId));if(order?.email)await mail(order.email,`Update revisi ${rev.revisionNumber} | Kastriva`,`Status: ${status}${adminResponse?`\nRespons admin: ${adminResponse}`:''}`);return ok(); }
      case 'getHandovers': return ok((await listDocs('handovers')).sort(byDateDesc('createdAt')));
      case 'createHandover': { const projectId=String(body.projectId||'');if(!projectId)return fail('Pilih project');const project=await getDoc('projects',projectId);if(!project)return fail('Project tidak ditemukan');if(Number(project.progress||0)<90)return fail('Progress project minimal 90% sebelum serah terima');const open=(await queryEquals('revisions','projectId',projectId)).find(r=>['Requested','In Progress'].includes(r.status));if(open)return fail(`Selesaikan revisi ${open.revisionNumber} sebelum serah terima`);const existing=(await queryEquals('handovers','projectId',projectId)).find(h=>h.status!=='Cancelled');if(existing)return fail(`Serah terima project ini sudah ada: ${existing.handoverNumber}`);const deliverables=(Array.isArray(body.deliverables)?body.deliverables.slice(0,20):[]).map((x:any)=>{const name=cleanText(x.name,200);if(!name)return null;let url='';try{url=x.url?safeUrl(x.url):'';}catch{return null;}return{name,url,type:cleanText(x.type||'Link',80)}}).filter(Boolean);let liveUrl='',repositoryUrl='',adminUrl='';try{liveUrl=body.liveUrl?safeUrl(body.liveUrl):'';repositoryUrl=body.repositoryUrl?safeUrl(body.repositoryUrl):'';adminUrl=body.adminUrl?safeUrl(body.adminUrl):'';}catch(e:any){return fail(e.message);}if(!deliverables.length&&!liveUrl&&!repositoryUrl&&!adminUrl)return fail('Tambahkan minimal satu hasil serah terima atau URL project');const now=iso(),id=randomUUID(),handoverNumber=numberId('HOV'),notes=cleanText(body.notes,1800);await setDoc('handovers',id,{handoverNumber,projectId,orderId:project.orderId,customerId:project.customerId,projectName:project.projectName,deliverables,liveUrl,repositoryUrl,adminUrl,notes,warrantyUntil:String(body.warrantyUntil||''),status:'Sent',sentAt:now,acceptedAt:'',createdAt:now,updatedAt:now});await patch('projects',projectId,{status:'Handover',progress:Math.max(95,Number(project.progress||0)),updatedAt:now});await patch('orders',String(project.orderId),{status:'Handover',updatedAt:now});const order=await getDoc('orders',String(project.orderId));if(order?.email)await mail(order.email,`Serah Terima ${handoverNumber} | Kastriva`,`Project ${project.projectName} sudah memasuki tahap serah terima. Silakan periksa di Customer Dashboard.`);return ok({id,handoverNumber}); }
      case 'respondHandover': { const id=String(body.handoverId||'');if(!id||body.response!=='Accepted')return fail('Respons serah terima tidak valid');const h=await getDoc('handovers',id);if(!h)return fail('Serah terima tidak ditemukan');if(h.customerId!==session?.customerId)return fail('Unauthorized');if(h.status!=='Sent')return fail('Serah terima sudah diproses sebelumnya');const now=iso();await patch('handovers',id,{status:'Accepted',acceptedAt:now,updatedAt:now});await patch('projects',String(h.projectId),{status:'Completed',progress:100,completedDate:now,updatedAt:now});await patch('orders',String(h.orderId),{status:'Completed',updatedAt:now});await mail(process.env.ADMIN_EMAIL,`✅ Serah terima ${h.handoverNumber} diterima`,`Customer telah menerima serah terima project ${h.projectName}.`);return ok(); }
      case 'getMyDashboard': { if(!session?.customerId)return fail('Unauthorized','UNAUTHORIZED'); return ok(await customerDashboard(session.customerId)); }
      case 'getOrderByNumber': { if(!session?.customerId)return fail('Unauthorized','UNAUTHORIZED');const orderNumber=String(params.orderNumber||body.orderNumber||'');if(!/^KAS-\d{4}-\d{4,}$/.test(orderNumber))return fail('Format nomor order tidak valid');const matches=await queryEquals('orders','orderNumber',orderNumber),order=matches.find(o=>o.customerId===session.customerId);if(!order)return fail('Order tidak ditemukan');const projects=await queryEquals('projects','orderId',order.id),project=projects[0]||null,updates=project?(await queryEquals('projectUpdates','projectId',project.id)).sort(byDateDesc('createdAt')):[];return ok({order:stripOrderPrivate(order),project,updates}); }
      default: return fail(`Action tidak tersedia: ${action}`);
    }
  } catch (e:any) {
    if(String(e?.message||'')==='FIREBASE_SETUP_REQUIRED') return fail('Firebase belum dikonfigurasi. Hubungi admin.','SETUP_REQUIRED');
    return fail('Permintaan gagal diproses. Silakan coba kembali.','UPSTREAM_ERROR');
  }
}

export async function publicSiteContentWithFallback(){
  try { const remote=await getSiteContentMap(); return Object.keys(remote).length?remote:defaultSiteContent; } catch { return defaultSiteContent; }
}
