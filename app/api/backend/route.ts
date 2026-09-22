import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminPassword } from '@/lib/server/admin-password';
import { createSession, verifySession, type SessionRole } from '@/lib/server/session';
import { allowAdminLoginAttempt, handleFirebaseAction, requestCustomerOtp, verifyCustomerOtp } from '@/lib/server/firebase-backend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const publicActions = new Set(['getPortfolio','getPortfolioBySlug','getPortfolioCategories','getServices','getSettings','getSiteContent','createOrder','health','requestCustomerOtp']);
const adminActions = new Set(['getDashboardStats','getOrders','getOrder','updateOrderStatus','getCustomers','getCustomer','getProjects','getProject','createProject','createProjectUpdate','getPortfolioAdmin','createPortfolio','updatePortfolio','deletePortfolio','syncPortfolioDefaults','getSiteContentAdmin','updateSiteContentSection','createQuotation','getQuotations','createInvoice','getInvoices','updateInvoicePayment','getRevisions','updateRevision','createHandover','getHandovers']);
const customerActions = new Set(['getMyDashboard','respondQuotation','requestRevision','respondHandover','getOrderByNumber']);
const secure = process.env.NODE_ENV === 'production';
const cookieName = (role: SessionRole) => `${secure ? '__Host-' : ''}kastriva_${role}_session`;
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control':'no-store, private','Vary':'Cookie','X-Content-Type-Options':'nosniff' } });
const denied = () => json({ success:false,error:'Silakan login terlebih dahulu.',code:'UNAUTHORIZED' },401);

async function readInput(request: NextRequest) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw Object.assign(new Error('Format permintaan tidak valid.'),{status:415});
  const reader=request.body?.getReader(); if(!reader) throw Object.assign(new Error('Permintaan kosong.'),{status:400});
  let size=0; const chunks:Uint8Array[]=[];
  while(true){ const {value,done}=await reader.read(); if(done)break; size+=value.byteLength; if(size>64000){await reader.cancel();throw Object.assign(new Error('Data terlalu besar.'),{status:413});} chunks.push(value); }
  const input=JSON.parse(Buffer.concat(chunks).toString('utf8')); if(!input||Array.isArray(input)||typeof input!=='object')throw Object.assign(new Error('Permintaan tidak valid.'),{status:400}); return input as Record<string,any>;
}

export async function POST(request: NextRequest) {
  const origin=request.headers.get('origin'); const expected=`${request.nextUrl.protocol}//${request.headers.get('host')||request.nextUrl.host}`;
  if(!origin||origin!==expected||request.headers.get('sec-fetch-site')==='cross-site') return json({success:false,error:'Permintaan lintas situs ditolak.'},403);
  try {
    const input=await readInput(request); const action=input.action; if(typeof action!=='string')return json({success:false,error:'Action wajib diisi.'},400);
    const { token:_token,passwordVerified:_verified,previousToken:_previous,role:_role,password:_password,action:_action,...clean }=input;
    let role:SessionRole|null=null; let result:any; let sessionToken=''; let sessionInfo:any=null;

    if(action==='login'){
      if(!allowAdminLoginAttempt(input.email)) return json({success:false,error:'Terlalu banyak percobaan login. Coba lagi beberapa menit lagi.',code:'RATE_LIMIT'},429);
      if(!(await verifyAdminPassword(input.email,input.password))) return json({success:false,error:'Email atau password salah.'},401);
      role='admin'; const created=createSession('admin',{email:(process.env.ADMIN_EMAIL||'').trim().toLowerCase(),name:'Admin'},input.remember===true); sessionToken=created.token; sessionInfo=created.session; result={success:true,data:created.session};
    } else if(action==='requestCustomerOtp') {
      result=await requestCustomerOtp(input.email);
    } else if(action==='verifyCustomerOtp') {
      role='customer'; const verified=await verifyCustomerOtp(input.challengeId,input.code); if(!verified.success||!verified.data) result=verified; else { const created=createSession('customer',{email:verified.data.email,name:verified.data.name,customerId:verified.data.customerId},input.remember===true); sessionToken=created.token; sessionInfo=created.session; result={success:true,data:created.session}; }
    } else if(action==='adminSession'||action==='customerSession') {
      role=action==='adminSession'?'admin':'customer'; const session=verifySession(request.cookies.get(cookieName(role))?.value,role); result=session?{success:true,data:session}:{success:false,error:'Sesi berakhir. Silakan login kembali.',code:'UNAUTHORIZED'};
    } else if(action==='logout'||action==='customerLogout') {
      role=action==='logout'?'admin':'customer'; result={success:true};
    } else {
      if(adminActions.has(action)) role='admin'; else if(customerActions.has(action)) role='customer'; else if(!publicActions.has(action)) return json({success:false,error:'Action tidak tersedia.'},400);
      const session=role?verifySession(request.cookies.get(cookieName(role))?.value,role):null; if(role&&!session)return denied();
      result=await handleFirebaseAction(action,clean,clean,session);
    }

    const status=result.code==='UNAUTHORIZED'?401:result.code==='RATE_LIMIT'?429:result.code==='SETUP_REQUIRED'||result.code==='UPSTREAM_ERROR'?503:200;
    const response=json(result,status);
    if(sessionToken&&role&&sessionInfo){ response.cookies.set(cookieName(role),sessionToken,{httpOnly:true,secure,sameSite:'strict',path:'/',...(input.remember===true?{maxAge:Math.max(0,Math.floor((sessionInfo.expiresAt-Date.now())/1000))}:{})}); }
    if(role&&(action==='logout'||action==='customerLogout'||result.code==='UNAUTHORIZED')) response.cookies.set(cookieName(role),'',{httpOnly:true,secure,sameSite:'strict',path:'/',maxAge:0});
    return response;
  } catch(e:any){ return json({success:false,error:e?.message||'Permintaan gagal diproses.'},Number(e?.status)||400); }
}
