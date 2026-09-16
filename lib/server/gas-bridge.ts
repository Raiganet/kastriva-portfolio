import { createHmac, randomUUID } from 'node:crypto';

export interface BridgeResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

export async function callGas<T = any>(action: string, body: Record<string, unknown> = {}, params: Record<string, unknown> = {}): Promise<BridgeResult<T>> {
  const endpoint = process.env.GAS_API_URL || '';
  const secret = process.env.GAS_BRIDGE_SECRET || '';
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(endpoint) || secret.length < 32) {
    return { success: false, error: 'Layanan belum dikonfigurasi. Hubungi admin.', code: 'SETUP_REQUIRED' };
  }
  const payload = JSON.stringify({ action, body, params });
  const timestamp = Date.now();
  const nonce = randomUUID();
  const signature = createHmac('sha256', secret).update(`${timestamp}.${nonce}.${payload}`).digest('hex');
  try {
    const response = await fetch(endpoint, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ payload, timestamp, nonce, signature }),
      cache: 'no-store', signal: AbortSignal.timeout(25000), redirect: 'follow',
    });
    if (!response.ok) throw new Error('Upstream failed');
    const result = await response.json();
    if (typeof result?.success !== 'boolean') throw new Error('Invalid response');
    return result;
  } catch {
    return { success: false, error: 'Tidak dapat menghubungi layanan. Silakan coba kembali.', code: 'UPSTREAM_ERROR' };
  }
}
