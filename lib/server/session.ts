import { createHmac, timingSafeEqual } from 'node:crypto';

export type SessionRole = 'admin' | 'customer';
export interface ServerSession {
  role: SessionRole;
  email: string;
  name?: string;
  customerId?: string;
  expiresAt: number;
}

function secret(): string {
  const value = process.env.SESSION_SECRET || '';
  if (value.length < 32) throw new Error('SESSION_SETUP_REQUIRED');
  return value;
}

function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function unb64url(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}
function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('hex');
}
function safeEqual(a: string, b: string): boolean {
  if (!/^[a-f0-9]{64}$/.test(a) || !/^[a-f0-9]{64}$/.test(b)) return false;
  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}

export function createSession(role: SessionRole, identity: Omit<ServerSession, 'role' | 'expiresAt'>, remember: boolean): { token: string; session: ServerSession } {
  const session: ServerSession = {
    ...identity,
    role,
    expiresAt: Date.now() + (remember ? 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000),
  };
  const encoded = b64url(JSON.stringify(session));
  return { token: `${encoded}.${sign(encoded)}`, session };
}

export function verifySession(token: string | undefined, role: SessionRole): ServerSession | null {
  try {
    if (!token || token.length > 4096) return null;
    const [encoded, signature, extra] = token.split('.');
    if (!encoded || !signature || extra || !safeEqual(signature, sign(encoded))) return null;
    const data = JSON.parse(unb64url(encoded)) as ServerSession;
    if (!data || data.role !== role || !Number.isFinite(data.expiresAt) || data.expiresAt <= Date.now()) return null;
    if (typeof data.email !== 'string' || data.email.length > 254) return null;
    if (role === 'customer' && (!data.customerId || typeof data.customerId !== 'string')) return null;
    return data;
  } catch { return null; }
}
