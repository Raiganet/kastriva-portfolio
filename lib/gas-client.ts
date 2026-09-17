/** Browser requests go through the same-origin server gateway; no GAS credentials or tokens. */
export function isGasConfigured(): boolean { return true; }
export function getGasUrl(): string { return '/api/gas'; }
export interface GasResponse<T> { success: boolean; data?: T; error?: string; code?: string; message?: string; committed?: boolean; }
export async function gasPost<T>(payload: Record<string, unknown>): Promise<GasResponse<T>> {
  try {
    const { token: _legacyToken, ...body } = payload;
    const res = await fetch('/api/gas', { method: 'POST', credentials: 'same-origin', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(35000) });
    const result = await res.json();
    if (typeof result?.success !== 'boolean') throw new Error('Invalid response');
    if (payload.action !== 'adminSession' && payload.action !== 'customerSession' && res.status === 401 && result.code === 'UNAUTHORIZED' && typeof window !== 'undefined') window.dispatchEvent(new Event('kastriva-session-expired'));
    return result as GasResponse<T>;
  } catch { return { success: false, error: 'Koneksi gagal. Silakan coba kembali.' }; }
}
export function gasGet<T>(action: string, params: Record<string, string> = {}): Promise<GasResponse<T>> { return gasPost<T>({ ...params, action }); }
