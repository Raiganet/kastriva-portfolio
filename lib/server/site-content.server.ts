import { unstable_cache } from 'next/cache';
import { defaultSiteContent } from '@/data/site-content';
import type { SiteContent } from '@/lib/types/site-content';
import { handleFirebaseAction } from './firebase-backend';

function isPlainObject(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
function mergeKnown<T>(fallback:T,incoming:unknown):T{
  if(Array.isArray(fallback)) return (Array.isArray(incoming)?incoming:fallback) as T;
  if(isPlainObject(fallback)){ if(!isPlainObject(incoming))return fallback; const out:Record<string,unknown>={...fallback}; for(const key of Object.keys(fallback)) out[key]=mergeKnown((fallback as any)[key],(incoming as any)[key]); return out as T; }
  return typeof incoming===typeof fallback ? incoming as T : fallback;
}
const loadSiteContent=unstable_cache(async():Promise<SiteContent>=>{ const result=await handleFirebaseAction('getSiteContent'); if(!result.success||!isPlainObject(result.data))return defaultSiteContent; return mergeKnown(defaultSiteContent,result.data); },['kastriva-site-content-firebase-v1'],{revalidate:60,tags:['site-content']});
export async function getSiteContent():Promise<SiteContent>{return loadSiteContent();}
