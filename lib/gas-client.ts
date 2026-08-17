/**
 * Google Apps Script API Client
 * CORS-safe: POST menggunakan Content-Type text/plain
 * untuk menghindari preflight request yang tidak didukung GAS.
 */

const GAS_URL = process.env.NEXT_PUBLIC_GAS_API_URL || "";

export function isGasConfigured(): boolean {
  return GAS_URL.length > 0;
}

export interface GasResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * GET request ke GAS API
 */
export async function gasGet<T>(
  action: string,
  params: Record<string, string> = {}
): Promise<GasResponse<T>> {
  if (!isGasConfigured()) {
    return { success: false, error: "GAS API belum dikonfigurasi" };
  }
  try {
    const url = new URL(GAS_URL);
    url.searchParams.set("action", action);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString(), { method: "GET" });
    return (await res.json()) as GasResponse<T>;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * POST request ke GAS API
 */
export async function gasPost<T>(
  payload: Record<string, unknown>
): Promise<GasResponse<T>> {
  if (!isGasConfigured()) {
    return { success: false, error: "GAS API belum dikonfigurasi" };
  }
  try {
    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    return (await res.json()) as GasResponse<T>;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}
