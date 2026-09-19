import { createSign } from 'node:crypto';

export type FirestoreRecord = Record<string, any>;

type TokenCache = { token: string; expiresAt: number };
let tokenCache: TokenCache | null = null;

function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function config() {
  const projectId = (process.env.FIREBASE_PROJECT_ID || '').trim();
  const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || '').trim();
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n').trim();
  if (!projectId || !clientEmail || !privateKey.includes('BEGIN PRIVATE KEY')) {
    throw new Error('FIREBASE_SETUP_REQUIRED');
  }
  return { projectId, clientEmail, privateKey };
}

export function isFirebaseConfigured(): boolean {
  try { config(); return true; } catch { return false; }
}

async function accessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt - 60_000 > Date.now()) return tokenCache.token;
  const { clientEmail, privateKey } = config();
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(JSON.stringify({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${claims}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const assertion = `${unsigned}.${b64url(signer.sign(privateKey))}`;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error('FIREBASE_AUTH_FAILED');
  const data = await response.json() as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error('FIREBASE_AUTH_FAILED');
  tokenCache = { token: data.access_token, expiresAt: Date.now() + Math.max(300, data.expires_in || 3600) * 1000 };
  return data.access_token;
}

function dbBase(): string {
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(config().projectId)}/databases/(default)/documents`;
}

function encodeValue(value: any): any {
  if (value === null) return { nullValue: null };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
  switch (typeof value) {
    case 'boolean': return { booleanValue: value };
    case 'number':
      if (!Number.isFinite(value)) return { nullValue: null };
      return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
    case 'string': return { stringValue: value };
    case 'object': {
      const fields: Record<string, any> = {};
      for (const [k, v] of Object.entries(value)) {
        if (v !== undefined) fields[k] = encodeValue(v);
      }
      return { mapValue: { fields } };
    }
    default: return { stringValue: String(value ?? '') };
  }
}

function decodeValue(value: any): any {
  if (!value || typeof value !== 'object') return null;
  if ('nullValue' in value) return null;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('timestampValue' in value) return String(value.timestampValue);
  if ('stringValue' in value) return String(value.stringValue);
  if ('referenceValue' in value) return String(value.referenceValue);
  if ('bytesValue' in value) return String(value.bytesValue);
  if ('geoPointValue' in value) return value.geoPointValue;
  if ('arrayValue' in value) return (value.arrayValue?.values || []).map(decodeValue);
  if ('mapValue' in value) return decodeFields(value.mapValue?.fields || {});
  return null;
}

function encodeFields(data: FirestoreRecord): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) fields[key] = encodeValue(value);
  }
  return fields;
}

function decodeFields(fields: Record<string, any>): FirestoreRecord {
  const out: FirestoreRecord = {};
  for (const [key, value] of Object.entries(fields || {})) out[key] = decodeValue(value);
  return out;
}

function docId(name: string): string {
  const parts = String(name || '').split('/');
  return decodeURIComponent(parts[parts.length - 1] || '');
}

async function request(url: string, init: RequestInit = {}): Promise<Response> {
  const token = await accessToken();
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
    cache: 'no-store',
    signal: init.signal || AbortSignal.timeout(20_000),
  });
}

export async function getDoc(collection: string, id: string): Promise<FirestoreRecord | null> {
  const response = await request(`${dbBase()}/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`FIRESTORE_GET_${response.status}`);
  const doc = await response.json();
  return { id: docId(doc.name), ...decodeFields(doc.fields || {}) };
}

export async function setDoc(collection: string, id: string, data: FirestoreRecord): Promise<FirestoreRecord> {
  const response = await request(`${dbBase()}/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields: encodeFields(data) }),
  });
  if (!response.ok) throw new Error(`FIRESTORE_SET_${response.status}`);
  const doc = await response.json();
  return { id: docId(doc.name), ...decodeFields(doc.fields || {}) };
}

export async function createDoc(collection: string, id: string, data: FirestoreRecord): Promise<{ created: boolean; data?: FirestoreRecord }> {
  const url = `${dbBase()}/${encodeURIComponent(collection)}?documentId=${encodeURIComponent(id)}`;
  const response = await request(url, { method: 'POST', body: JSON.stringify({ fields: encodeFields(data) }) });
  if (response.status === 409) return { created: false };
  if (!response.ok) throw new Error(`FIRESTORE_CREATE_${response.status}`);
  const doc = await response.json();
  return { created: true, data: { id: docId(doc.name), ...decodeFields(doc.fields || {}) } };
}

export async function deleteDoc(collection: string, id: string): Promise<boolean> {
  const response = await request(`${dbBase()}/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (response.status === 404) return false;
  if (!response.ok) throw new Error(`FIRESTORE_DELETE_${response.status}`);
  return true;
}

export async function listDocs(collection: string): Promise<FirestoreRecord[]> {
  const results: FirestoreRecord[] = [];
  let pageToken = '';
  do {
    const url = new URL(`${dbBase()}/${encodeURIComponent(collection)}`);
    url.searchParams.set('pageSize', '1000');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const response = await request(url.toString());
    if (response.status === 404) return [];
    if (!response.ok) throw new Error(`FIRESTORE_LIST_${response.status}`);
    const data = await response.json();
    for (const doc of data.documents || []) results.push({ id: docId(doc.name), ...decodeFields(doc.fields || {}) });
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return results;
}

export async function queryEquals(collection: string, field: string, value: any): Promise<FirestoreRecord[]> {
  const { projectId } = config();
  const response = await request(`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents:runQuery`, {
    method: 'POST',
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: collection }],
        where: { fieldFilter: { field: { fieldPath: field }, op: 'EQUAL', value: encodeValue(value) } },
      },
    }),
  });
  if (!response.ok) throw new Error(`FIRESTORE_QUERY_${response.status}`);
  const rows = await response.json();
  return rows.filter((x: any) => x.document).map((x: any) => ({ id: docId(x.document.name), ...decodeFields(x.document.fields || {}) }));
}

export async function mergeDoc(collection: string, id: string, patch: FirestoreRecord): Promise<FirestoreRecord> {
  const current = await getDoc(collection, id);
  return setDoc(collection, id, { ...(current || {}), ...patch, id: undefined });
}

export async function healthCheck(): Promise<boolean> {
  try { await listDocs('_health'); return true; } catch { return false; }
}
