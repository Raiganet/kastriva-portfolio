import { scrypt, timingSafeEqual } from 'node:crypto';

/** Versioned, fixed-parameter scrypt verifier. No plaintext admin password in source. */
export async function verifyAdminPassword(email: unknown, password: unknown): Promise<boolean> {
  const configuredEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const encoded = process.env.ADMIN_PASSWORD_SCRYPT || '';
  const [version, salt, expected] = encoded.split('$');
  if (!configuredEmail || version !== 'scrypt-v1' || !/^[a-f0-9]{32}$/.test(salt || '') || !/^[a-f0-9]{128}$/.test(expected || '')) return false;
  if (typeof password !== 'string' || password.length > 256 || typeof email !== 'string') return false;
  const derived = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (err, key) => err ? reject(err) : resolve(key));
  });
  return timingSafeEqual(derived, Buffer.from(expected, 'hex')) && email.trim().toLowerCase() === configuredEmail;
}
