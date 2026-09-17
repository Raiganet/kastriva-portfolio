import type { OrderFormData } from '@/lib/validators/order';
export type OrderDraft = {
  version: 2;
  data: Record<string,string>;
  updatedAt: number;
  pending?: { requestId: string; data: OrderFormData };
  receipt?: { orderNumber: string; whatsappUrl?: string };
};
const KEY = 'kastriva_order_draft_v2';
let memory: OrderDraft | null = null;
// Web Locks serialize shared local drafts across tabs. Fallback isolates each tab.
const shared = () => typeof navigator !== 'undefined' && !!navigator.locks;
const storage = () => shared() ? window.localStorage : window.sessionStorage;
export function readOrderDraft(): OrderDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw=storage().getItem(KEY);
    if (!raw) return memory;
    const d=JSON.parse(raw);
    if (d.version!==2 || !d.data || typeof d.data!=='object' || !Number.isFinite(d.updatedAt)) throw new Error('Draf tidak dapat dibaca. Jangan kirim ulang sebelum memeriksa order sebelumnya.');
    if ((!d.pending || d.receipt) && Date.now()-d.updatedAt>7*86400000) { storage().removeItem(KEY);return null; }
    memory=d;return d;
  } catch (e) {
    if (e instanceof SyntaxError || (e instanceof Error && e.message.startsWith('Draf'))) throw new Error('Draf rusak. Hubungi admin untuk memastikan order sebelumnya sebelum menghapus data browser.');
    return memory;
  }
}
function write(d: OrderDraft): boolean {
  memory=d;
  try { storage().setItem(KEY,JSON.stringify(d));return true; } catch { return false; }
}
async function locked<T>(fn:()=>T):Promise<T> {
  if (shared()) return navigator.locks.request(KEY,fn);
  return fn();
}
export async function saveOrderDraft(data: Record<string,string>) {
  return locked(()=>{
    const previous=readOrderDraft();
    if(previous?.pending || previous?.receipt) return {draft:previous,persisted:true};
    const draft:OrderDraft={version:2,data,updatedAt:Date.now()};
    return {draft,persisted:write(draft)};
  });
}
export async function prepareOrder(data:OrderFormData) {
  return locked(()=>{
    const previous=readOrderDraft();
    if(previous?.receipt) return previous;
    if(previous?.pending) return previous;
    const draft:OrderDraft={version:2,data:data as Record<string,string>,updatedAt:Date.now(),pending:{requestId:crypto.randomUUID(),data}};
    // Do not begin a network write without a recoverable request identity.
    if(!write(draft)) { memory=previous;throw new Error('Penyimpanan draf tidak tersedia. Aktifkan penyimpanan situs di browser sebelum mengirim.'); }
    return draft;
  });
}
export async function completeOrder(requestId:string,receipt:{orderNumber:string;whatsappUrl?:string}) {
  return locked(()=>{
    const d=readOrderDraft();if(d?.pending?.requestId!==requestId) return;
    // Keep the immutable pending identity as well, so failed local writes remain retryable.
    write({...d,receipt,updatedAt:Date.now()});
  });
}
export async function rejectOrder(requestId:string) {
  return locked(()=>{
    const d=readOrderDraft();if(d?.pending?.requestId!==requestId || d.receipt) return;
    const {pending:_pending,...rest}=d;write({...rest,updatedAt:Date.now()});
  });
}
export async function startNewOrder(data:Record<string,string>) {
  return locked(()=>{
    const d=readOrderDraft();
    if(d?.pending && !d.receipt) throw new Error('Pastikan hasil permintaan sebelumnya dengan tombol coba lagi.');
    const draft:OrderDraft={version:2,data,updatedAt:Date.now()};write(draft);return draft;
  });
}
export function isOrderDraftStorageEvent(e:StorageEvent) {return e.key===KEY;}
