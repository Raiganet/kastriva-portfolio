import { NextRequest, NextResponse } from 'next/server';
import { callGas } from '@/lib/server/gas-bridge';
import { verifyAdminPassword } from '@/lib/server/admin-password';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const publicActions = new Set(['getPortfolio', 'getPortfolioBySlug', 'getPortfolioCategories', 'getServices', 'getSettings', 'getSiteContent', 'createOrder', 'health', 'requestCustomerOtp']);
const adminActions = new Set(['getDashboardStats', 'getOrders', 'getOrder', 'updateOrderStatus', 'getCustomers', 'getCustomer', 'getProjects', 'getProject', 'createProject', 'createProjectUpdate', 'getPortfolioAdmin', 'createPortfolio', 'updatePortfolio', 'deletePortfolio', 'getSiteContentAdmin', 'updateSiteContentSection', 'createQuotation', 'getQuotations', 'createInvoice', 'getInvoices', 'updateInvoicePayment', 'getRevisions', 'updateRevision', 'createHandover', 'getHandovers', 'adminSession', 'logout']);
const customerActions = new Set(['getMyDashboard', 'respondQuotation', 'requestRevision', 'respondHandover', 'getOrderByNumber', 'customerSession', 'customerLogout']);
const secure = process.env.NODE_ENV === 'production';
const cookieName = (role: string) => `${secure ? '__Host-' : ''}kastriva_${role}_session`;
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store, private', 'Vary': 'Cookie', 'X-Content-Type-Options': 'nosniff' } });
const denied = () => json({ success: false, error: 'Silakan login terlebih dahulu.', code: 'UNAUTHORIZED' }, 401);

export async function POST(request: NextRequest) {
  // Explicit same-origin check protects login, logout and all cookie-authenticated mutations.
  const origin = request.headers.get('origin');
  const expectedOrigin = `${request.nextUrl.protocol}//${request.headers.get('host') || request.nextUrl.host}`;
  if (!origin || origin !== expectedOrigin || request.headers.get('sec-fetch-site') === 'cross-site') {
    return json({ success: false, error: 'Permintaan lintas situs ditolak.' }, 403);
  }
  if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ success: false, error: 'Format permintaan tidak valid.' }, 415);
  try {
    // Streaming limit prevents an unbounded JSON body from entering memory.
    const reader = request.body?.getReader();
    if (!reader) return json({ success: false, error: 'Permintaan kosong.' }, 400);
    let size = 0; const chunks: Uint8Array[] = [];
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 64000) { await reader.cancel(); return json({ success: false, error: 'Data terlalu besar.' }, 413); }
      chunks.push(value);
    }
    const input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!input || Array.isArray(input) || typeof input !== 'object') return json({ success: false, error: 'Permintaan tidak valid.' }, 400);
    const { action } = input;
    if (typeof action !== 'string') return json({ success: false, error: 'Action wajib diisi.' }, 400);
    // Never trust a caller-supplied token, role, verification flag or previous session.
    const { token: _token, passwordVerified: _verified, previousToken: _previous, role: _role, password: _password, ...clean } = input;
    delete clean.action;
    let role: 'admin' | 'customer' | null = null;
    let result;
    if (action === 'login') {
      const attempt = await callGas('__adminAttempt');
      if (!attempt.success) return json(attempt, attempt.code === 'RATE_LIMIT' ? 429 : 503);
      if (!(await verifyAdminPassword(input.email, input.password))) return json({ success: false, error: 'Email atau password salah.' }, 401);
      role = 'admin';
      result = await callGas('login', { email: process.env.ADMIN_EMAIL!.trim().toLowerCase(), passwordVerified: true, remember: input.remember === true, previousToken: request.cookies.get(cookieName(role))?.value });
    } else if (action === 'verifyCustomerOtp') {
      role = 'customer';
      result = await callGas(action, { challengeId: input.challengeId, code: input.code, remember: input.remember === true, previousToken: request.cookies.get(cookieName(role))?.value });
    } else {
      if (adminActions.has(action)) role = 'admin';
      else if (customerActions.has(action)) role = 'customer';
      else if (!publicActions.has(action)) return json({ success: false, error: 'Action tidak tersedia.' }, 400);
      const token = role ? request.cookies.get(cookieName(role))?.value : undefined;
      if (role && !token && action !== 'logout' && action !== 'customerLogout') return denied();
      result = await callGas(action, { ...clean, ...(token ? { token } : {}) }, clean);
    }
    const signingIn = action === 'login' || action === 'verifyCustomerOtp';
    const sessionToken = signingIn && result.success ? result.data?.token : undefined;
    // Only an allowlisted set of non-secret session fields reaches JavaScript.
    if (signingIn && result.success) {
      const d = result.data;
      if (!/^[a-f0-9]{64}$/.test(sessionToken || '') || !Number.isFinite(d?.expiresAt) || d.expiresAt <= Date.now()) return json({ success: false, error: 'Respons sesi tidak valid.' }, 502);
      result = { success: true, data: { email: d.email, name: d.name, customerId: d.customerId, expiresAt: d.expiresAt, role } };
    }
    const response = json(result, result.code === 'UNAUTHORIZED' ? 401 : result.code === 'RATE_LIMIT' ? 429 : result.code === 'SETUP_REQUIRED' || result.code === 'UPSTREAM_ERROR' ? 503 : 200);
    if (sessionToken && role) {
      response.cookies.set(cookieName(role), sessionToken, { httpOnly: true, secure, sameSite: 'strict', path: '/', ...(input.remember === true ? { maxAge: Math.max(0, Math.floor((result.data.expiresAt - Date.now()) / 1000)) } : {}) });
    }
    if (role && (action === 'logout' || action === 'customerLogout' || result.code === 'UNAUTHORIZED')) {
      response.cookies.set(cookieName(role), '', { httpOnly: true, secure, sameSite: 'strict', path: '/', maxAge: 0 });
    }
    return response;
  } catch {
    return json({ success: false, error: 'Permintaan gagal diproses. Silakan coba kembali.' }, 400);
  }
}
