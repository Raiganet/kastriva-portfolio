import { gasPost } from '@/lib/gas-client';
export interface SessionInfo { email: string; name?: string; customerId?: string; expiresAt: number; role: 'admin' | 'customer'; }
const sessions: Partial<Record<'admin' | 'customer', SessionInfo>> = {};
export function clearLegacyCredentials() {
  if (typeof window === 'undefined') return;
  try { for (const key of ['kastriva_admin_token', 'kastriva_customer_token']) { localStorage.removeItem(key); sessionStorage.removeItem(key); } } catch { /* Storage may be disabled. Cookies still work. */ }
}
export function setSession(role: 'admin' | 'customer', value: SessionInfo | null) {
  clearLegacyCredentials();
  if (value) sessions[role] = value; else delete sessions[role];
}
export function getSession(role: 'admin' | 'customer'): SessionInfo | null {
  const s = sessions[role];
  return s && Number.isFinite(s.expiresAt) && Date.now() < s.expiresAt ? s : null;
}
export async function refreshSession(role: 'admin' | 'customer'): Promise<boolean> {
  const result = await gasPost<SessionInfo>({ action: role === 'admin' ? 'adminSession' : 'customerSession' });
  setSession(role, result.success && result.data ? result.data : null);
  return !!getSession(role);
}
export async function logoutSession(role: 'admin' | 'customer'): Promise<boolean> {
  const result = await gasPost({ action: role === 'admin' ? 'logout' : 'customerLogout' });
  // Server returns a response and clears its cookie even when GAS is unavailable.
  if (result.success || result.code === 'UPSTREAM_ERROR' || result.code === 'SETUP_REQUIRED') { setSession(role, null); return true; }
  return false;
}
