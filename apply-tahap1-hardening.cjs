#!/usr/bin/env node
"use strict";

/**
 * Kastriva Portfolio — Tahap 1 Hardening Patcher
 * Target: Raiganet/kastriva-portfolio, main (snapshot 2026-09-19)
 *
 * Run from repository root:
 *   node apply-tahap1-hardening.cjs
 *
 * The script aborts if expected source fragments are not found, so it will not
 * silently patch a different code version.
 */

const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(root, ".stage1-backup", stamp);

function read(rel) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) throw new Error(`File tidak ditemukan: ${rel}`);
  return fs.readFileSync(p, "utf8");
}
function write(rel, content) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, "utf8");
}
function backup(rel) {
  const src = path.join(root, rel);
  if (!fs.existsSync(src)) return;
  const dst = path.join(backupRoot, rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
}
function replaceExact(rel, oldText, newText) {
  const current = read(rel);
  if (current.includes(newText)) {
    console.log(`SKIP  ${rel} (sudah diterapkan)`);
    return;
  }
  if (!current.includes(oldText)) {
    throw new Error(`Fragment target tidak ditemukan di ${rel}. Patch dihentikan agar source tidak rusak.`);
  }
  backup(rel);
  write(rel, current.replace(oldText, newText));
  console.log(`PATCH ${rel}`);
}
function replaceRegex(rel, regex, replacement, label) {
  const current = read(rel);
  if (current.includes(replacement)) {
    console.log(`SKIP  ${rel} (${label} sudah diterapkan)`);
    return;
  }
  if (!regex.test(current)) {
    throw new Error(`Pola "${label}" tidak ditemukan di ${rel}. Patch dihentikan agar source tidak rusak.`);
  }
  backup(rel);
  write(rel, current.replace(regex, replacement));
  console.log(`PATCH ${rel} (${label})`);
}
function createOnce(rel, content) {
  const p = path.join(root, rel);
  if (fs.existsSync(p)) {
    const existing = fs.readFileSync(p, "utf8");
    if (existing === content) {
      console.log(`SKIP  ${rel} (sudah ada)`);
      return;
    }
    backup(rel);
  }
  write(rel, content);
  console.log(`WRITE ${rel}`);
}

try {
  // ---------------------------------------------------------------------------
  // 1) Firestore atomic write + persistent transactional rate limiter
  // ---------------------------------------------------------------------------
  const firebaseRestFile = "lib/server/firebase-rest.ts";
  const firebaseRestAnchor = `export async function mergeDoc(collection: string, id: string, patch: FirestoreRecord): Promise<FirestoreRecord> {
  const current = await getDoc(collection, id);
  return setDoc(collection, id, { ...(current || {}), ...patch, id: undefined });
}

export async function healthCheck(): Promise<boolean> {`;

  const firebaseRestReplacement = `export async function mergeDoc(collection: string, id: string, patch: FirestoreRecord): Promise<FirestoreRecord> {
  const current = await getDoc(collection, id);
  return setDoc(collection, id, { ...(current || {}), ...patch, id: undefined });
}

export type AtomicWrite = {
  collection: string;
  id: string;
  data: FirestoreRecord;
  merge?: boolean;
  exists?: boolean;
};

type TransactionMutation<T> = {
  result: T;
  data?: FirestoreRecord;
  merge?: boolean;
  delete?: boolean;
};

function documentName(collection: string, id: string): string {
  const { projectId } = config();
  return \`projects/\${projectId}/databases/(default)/documents/\${collection}/\${id}\`;
}

function writePayload(write: AtomicWrite): Record<string, any> {
  const fields = Object.entries(write.data).filter(([, value]) => value !== undefined);
  const payload: Record<string, any> = {
    update: {
      name: documentName(write.collection, write.id),
      fields: encodeFields(Object.fromEntries(fields)),
    },
  };
  if (write.merge) {
    payload.updateMask = { fieldPaths: fields.map(([key]) => key) };
  }
  if (write.exists !== undefined) {
    payload.currentDocument = { exists: write.exists };
  }
  return payload;
}

/**
 * Atomic multi-document commit. Either all writes are persisted or none are.
 */
export async function commitAtomic(writes: AtomicWrite[]): Promise<void> {
  if (!writes.length) return;
  const response = await request(\`\${dbBase()}:commit\`, {
    method: 'POST',
    body: JSON.stringify({ writes: writes.map(writePayload) }),
  });
  if (!response.ok) throw new Error(\`FIRESTORE_COMMIT_\${response.status}\`);
}

/**
 * Transactionally mutate one document. Used for security counters and OTP
 * challenges so parallel Vercel instances cannot bypass in-memory state.
 */
export async function mutateDocTransaction<T>(
  collection: string,
  id: string,
  mutator: (current: FirestoreRecord | null) => TransactionMutation<T>,
  retries = 5,
): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const begin = await request(\`\${dbBase()}:beginTransaction\`, {
      method: 'POST',
      body: JSON.stringify({ options: { readWrite: {} } }),
    });
    if (!begin.ok) throw new Error(\`FIRESTORE_TX_BEGIN_\${begin.status}\`);
    const beginData = await begin.json() as { transaction?: string };
    const transaction = beginData.transaction;
    if (!transaction) throw new Error('FIRESTORE_TX_MISSING');

    const url = new URL(\`\${dbBase()}/\${encodeURIComponent(collection)}/\${encodeURIComponent(id)}\`);
    url.searchParams.set('transaction', transaction);
    const readResponse = await request(url.toString());

    let current: FirestoreRecord | null = null;
    if (readResponse.status !== 404) {
      if (!readResponse.ok) throw new Error(\`FIRESTORE_TX_GET_\${readResponse.status}\`);
      const doc = await readResponse.json();
      current = { id: docId(doc.name), ...decodeFields(doc.fields || {}) };
    }

    const mutation = mutator(current);

    if (!mutation.data && !mutation.delete) {
      try {
        await request(\`\${dbBase()}:rollback\`, {
          method: 'POST',
          body: JSON.stringify({ transaction }),
        });
      } catch {}
      return mutation.result;
    }

    const writes = mutation.delete
      ? [{ delete: documentName(collection, id) }]
      : [writePayload({
          collection,
          id,
          data: mutation.data || {},
          merge: mutation.merge === true,
        })];

    const commit = await request(\`\${dbBase()}:commit\`, {
      method: 'POST',
      body: JSON.stringify({ writes, transaction }),
    });

    if (commit.ok) return mutation.result;
    if (commit.status === 409 || commit.status === 412) continue;
    throw new Error(\`FIRESTORE_TX_COMMIT_\${commit.status}\`);
  }
  throw new Error('FIRESTORE_TX_RETRY_EXHAUSTED');
}

/**
 * Persistent fixed-window limiter stored in Firestore. The key should already
 * be privacy-safe (the backend hashes e-mail based scopes before calling this).
 */
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const now = Date.now();
  return mutateDocTransaction<boolean>('securityRateLimits', key, (current) => {
    const resetAt = Number(current?.resetAt || 0);
    const active = resetAt > now;
    const count = active ? Number(current?.count || 0) : 0;
    if (active && count >= limit) return { result: false };

    return {
      result: true,
      data: {
        count: count + 1,
        resetAt: active ? resetAt : now + windowMs,
        updatedAt: new Date(now).toISOString(),
      },
    };
  });
}

export async function healthCheck(): Promise<boolean> {`;

  replaceExact(firebaseRestFile, firebaseRestAnchor, firebaseRestReplacement);

  // ---------------------------------------------------------------------------
  // 2) Firebase backend: protect customer profile, strengthen OTP/rate limits,
  //    and write quotation + order state atomically.
  // ---------------------------------------------------------------------------
  const backendFile = "lib/server/firebase-backend.ts";

  replaceExact(
    backendFile,
    `import { createDoc, deleteDoc, getDoc, listDocs, mergeDoc, queryEquals, setDoc } from './firebase-rest';`,
    `import { commitAtomic, consumeRateLimit, createDoc, deleteDoc, getDoc, listDocs, mergeDoc, mutateDocTransaction, queryEquals, setDoc } from './firebase-rest';`
  );

  replaceExact(
    backendFile,
    `const HIDDEN_ORDER_FIELDS = new Set(['requestId','requestHash']);
const memRate = new Map<string,{count:number;resetAt:number}>();`,
    `const HIDDEN_ORDER_FIELDS = new Set(['requestId','requestHash']);`
  );

  replaceExact(
    backendFile,
    `function consumeRate(key:string, limit:number, windowMs:number): boolean {
  const now=Date.now(); const old=memRate.get(key); const state=!old||old.resetAt<=now?{count:0,resetAt:now+windowMs}:old;
  if (state.count>=limit) return false; state.count++; memRate.set(key,state); return true;
}

export function allowAdminLoginAttempt(emailInput:any): boolean {
  const email=String(emailInput||'').trim().toLowerCase();
  const emailKey=email?hash(email).slice(0,24):'missing';
  return consumeRate('admin-login-global',40,15*60*1000) && consumeRate(\`admin-login:\${emailKey}\`,8,15*60*1000);
}`,
    `async function consumeRate(key:string, limit:number, windowMs:number): Promise<boolean> {
  return consumeRateLimit(hash(key),limit,windowMs);
}

export async function allowAdminLoginAttempt(emailInput:any): Promise<boolean> {
  const email=String(emailInput||'').trim().toLowerCase();
  const emailKey=email?hash(email).slice(0,24):'missing';
  if(!await consumeRate('admin-login-global',40,15*60*1000)) return false;
  return consumeRate(\`admin-login:\${emailKey}\`,8,15*60*1000);
}`
  );

  replaceExact(
    backendFile,
    `export async function requestCustomerOtp(emailInput:any): Promise<BackendResult> {
  const email=String(emailInput||'').trim().toLowerCase();
  if(!/^\\S+@\\S+\\.\\S+$/.test(email)||email.length>254) return fail('Format email tidak valid.');
  if(!consumeRate('otp-global',60,3600000)||!consumeRate(\`otp-hour:\${email}\`,5,3600000)||!consumeRate(\`otp-minute:\${email}\`,1,60000)) return fail('Permintaan terlalu sering. Tunggu sebelum mencoba kembali.','RATE_LIMIT');
  const customer=(await queryEquals('customers','email',email))[0]||null;
  const challengeId=hash(\`\${randomUUID()}:\${Date.now()}:\${email}\`); const code=String(randomInt(0,100000000)).padStart(8,'0'); const expiresAt=Date.now()+10*60000;
  const otpSecret=process.env.SESSION_SECRET||''; const codeHash=createHmac('sha256',otpSecret).update(\`\${challengeId}:\${code}\`).digest('hex');
  await setDoc('authChallenges',challengeId,{customerId:customer?.id||'',email,name:customer?.name||'',codeHash,attempts:0,expiresAt,createdAt:iso()});
  if(customer) await mail(email,'Kode login Kastriva',\`Kode login Anda: \${code}\\n\\nBerlaku 10 menit dan hanya dapat dipakai sekali. Jangan bagikan kode ini kepada siapa pun.\\nJika Anda tidak meminta login, abaikan email ini.\`);
  return ok({challengeId,expiresAt,retryAfter:60},{message:'Jika email terdaftar, kode verifikasi telah dikirim. Periksa inbox dan folder spam.'});
}`,
    `export async function requestCustomerOtp(emailInput:any): Promise<BackendResult> {
  const email=String(emailInput||'').trim().toLowerCase();
  if(!/^\\S+@\\S+\\.\\S+$/.test(email)||email.length>254) return fail('Format email tidak valid.');
  if(!await consumeRate('otp-global',60,3600000)||!await consumeRate(\`otp-hour:\${email}\`,5,3600000)||!await consumeRate(\`otp-minute:\${email}\`,1,60000)) return fail('Permintaan terlalu sering. Tunggu sebelum mencoba kembali.','RATE_LIMIT');
  const customer=(await queryEquals('customers','email',email))[0]||null;
  const challengeId=hash(\`\${randomUUID()}:\${Date.now()}:\${email}\`); const code=String(randomInt(0,100000000)).padStart(8,'0'); const expiresAt=Date.now()+10*60000;
  const otpSecret=process.env.SESSION_SECRET||''; const codeHash=createHmac('sha256',otpSecret).update(\`\${challengeId}:\${code}\`).digest('hex');

  if(customer){
    const previous=await queryEquals('authChallenges','email',email);
    await Promise.all(previous.map((row:any)=>deleteDoc('authChallenges',String(row.id))));
    await setDoc('authChallenges',challengeId,{customerId:customer.id,email,name:customer.name||'',codeHash,attempts:0,expiresAt,createdAt:iso()});
    await mail(email,'Kode login Kastriva',\`Kode login Anda: \${code}\\n\\nBerlaku 10 menit dan hanya dapat dipakai sekali. Jangan bagikan kode ini kepada siapa pun.\\nJika Anda tidak meminta login, abaikan email ini.\`);
  }
  return ok({challengeId,expiresAt,retryAfter:60},{message:'Jika email terdaftar, kode verifikasi telah dikirim. Periksa inbox dan folder spam.'});
}`
  );

  replaceExact(
    backendFile,
    `export async function verifyCustomerOtp(challengeId:any, code:any): Promise<BackendResult<any>> {
  if(!consumeRate('otp-verify',100,60000)) return fail('Terlalu banyak percobaan. Coba lagi nanti.','RATE_LIMIT');
  const generic=()=>fail('Kode salah, sudah dipakai, atau kedaluwarsa. Minta kode baru bila diperlukan.');
  const id=String(challengeId||''); if(!/^[a-f0-9]{64}$/.test(id)) return generic();
  const row=await getDoc('authChallenges',id); if(!row||Number(row.expiresAt||0)<=Date.now()) { if(row) await deleteDoc('authChallenges',id); return generic(); }
  const attempts=Number(row.attempts||0)+1; const expected=createHmac('sha256',process.env.SESSION_SECRET||'').update(\`\${id}:\${String(code||'')}\`).digest('hex');
  if(!/^\\d{8}$/.test(String(code||''))||!compareHex(String(row.codeHash||''),expected)||!row.customerId){ if(attempts>=5) await deleteDoc('authChallenges',id); else await patch('authChallenges',id,{attempts}); return generic(); }
  const customer=await getDoc('customers',String(row.customerId)); await deleteDoc('authChallenges',id); if(!customer||String(customer.email).toLowerCase()!==String(row.email).toLowerCase()) return generic();
  return ok({customerId:customer.id,email:customer.email,name:customer.name});
}`,
    `export async function verifyCustomerOtp(challengeId:any, code:any): Promise<BackendResult<any>> {
  if(!await consumeRate('otp-verify',100,60000)) return fail('Terlalu banyak percobaan. Coba lagi nanti.','RATE_LIMIT');
  const generic=()=>fail('Kode salah, sudah dipakai, atau kedaluwarsa. Minta kode baru bila diperlukan.');
  const id=String(challengeId||''); if(!/^[a-f0-9]{64}$/.test(id)) return generic();
  const submitted=String(code||'');
  const expected=createHmac('sha256',process.env.SESSION_SECRET||'').update(\`\${id}:\${submitted}\`).digest('hex');

  const consumed=await mutateDocTransaction<any>('authChallenges',id,(row)=>{
    if(!row) return {result:null};
    if(Number(row.expiresAt||0)<=Date.now()) return {result:null,delete:true};
    const attempts=Number(row.attempts||0)+1;
    const valid=/^\\d{8}$/.test(submitted)&&compareHex(String(row.codeHash||''),expected)&&Boolean(row.customerId);
    if(valid) return {result:{customerId:String(row.customerId),email:String(row.email||''),name:String(row.name||'')},delete:true};
    if(attempts>=5) return {result:null,delete:true};
    return {result:null,data:{attempts},merge:true};
  });
  if(!consumed) return generic();

  const customer=await getDoc('customers',consumed.customerId);
  if(!customer||String(customer.email).toLowerCase()!==String(consumed.email).toLowerCase()) return generic();
  return ok({customerId:customer.id,email:customer.email,name:customer.name});
}`
  );

  replaceExact(
    backendFile,
    `if(!consumeRate('order-global',30,3600000)||!consumeRate(\`order-email:\${d.email}\`,5,3600000))return fail('Terlalu banyak permintaan. Coba kembali setelah batas waktu berakhir.','RATE_LIMIT',false);`,
    `if(!await consumeRate('order-global',30,3600000)||!await consumeRate(\`order-email:\${d.email}\`,5,3600000))return fail('Terlalu banyak permintaan. Coba kembali setelah batas waktu berakhir.','RATE_LIMIT',false);`
  );

  replaceExact(
    backendFile,
    `const migratedCustomer=(await queryEquals('customers','email',d.email))[0]||null; const customerId=String(migratedCustomer?.id||\`cus_\${hash(d.email).slice(0,24)}\`); const now=iso(); const oldCustomer=migratedCustomer||await getDoc('customers',customerId); await setDoc('customers',customerId,{name:d.name,email:d.email,whatsapp:d.whatsapp,business:d.business||'',avatar:oldCustomer?.avatar||'',status:'Active',createdAt:oldCustomer?.createdAt||now,lastActivity:now});`,
    `const migratedCustomer=(await queryEquals('customers','email',d.email))[0]||null; const customerId=String(migratedCustomer?.id||\`cus_\${hash(d.email).slice(0,24)}\`); const now=iso(); const oldCustomer=migratedCustomer||await getDoc('customers',customerId); if(oldCustomer){await patch('customers',customerId,{lastActivity:now});}else{await setDoc('customers',customerId,{name:d.name,email:d.email,whatsapp:d.whatsapp,business:d.business||'',avatar:'',status:'Active',createdAt:now,lastActivity:now});}`
  );

  replaceRegex(
    backendFile,
    /await setDoc\('quotations',id,\{quotationNumber,orderId,customerId:order\.customerId,projectName,items,subtotal,discount,tax,total,notes,validUntil:String\(body\.validUntil\|\|''\),status:'sent',createdAt:now,updatedAt:now,revisionLimit,paymentTerms,customerNote:'',respondedAt:''\}\);await patch\('orders',orderId,\{status:'Quotation',updatedAt:now\}\);/,
    `await commitAtomic([{collection:'quotations',id,data:{quotationNumber,orderId,customerId:order.customerId,projectName,items,subtotal,discount,tax,total,notes,validUntil:String(body.validUntil||''),status:'sent',createdAt:now,updatedAt:now,revisionLimit,paymentTerms,customerNote:'',respondedAt:''},exists:false},{collection:'orders',id:orderId,data:{status:'Quotation',updatedAt:now},merge:true,exists:true}]);`,
    "atomic createQuotation"
  );

  replaceRegex(
    backendFile,
    /await patch\('quotations',id,\{status:response,customerNote,respondedAt:now,updatedAt:now\}\);await patch\('orders',String\(q\.orderId\),\{status:response==='approved'\?'Approved':'Discussing',updatedAt:now\}\);/,
    `await commitAtomic([{collection:'quotations',id,data:{status:response,customerNote,respondedAt:now,updatedAt:now},merge:true,exists:true},{collection:'orders',id:String(q.orderId),data:{status:response==='approved'?'Approved':'Discussing',updatedAt:now},merge:true,exists:true}]);`,
    "atomic respondQuotation"
  );

  // ---------------------------------------------------------------------------
  // 3) Await persistent admin login limiter.
  // ---------------------------------------------------------------------------
  replaceExact(
    "app/api/backend/route.ts",
    `if(!allowAdminLoginAttempt(input.email)) return json({success:false,error:'Terlalu banyak percobaan login. Coba lagi beberapa menit lagi.',code:'RATE_LIMIT'},429);`,
    `if(!await allowAdminLoginAttempt(input.email)) return json({success:false,error:'Terlalu banyak percobaan login. Coba lagi beberapa menit lagi.',code:'RATE_LIMIT'},429);`
  );

  // ---------------------------------------------------------------------------
  // 4) Safe JSON-LD serializer: prevents </script> / HTML injection via CMS data.
  // ---------------------------------------------------------------------------
  createOnce(
    "lib/seo-jsonld.ts",
`export function serializeJsonLd(value: unknown): string {
  const json = JSON.stringify(value) ?? 'null';
  return json
    .replace(/</g, '\\\\u003c')
    .replace(/>/g, '\\\\u003e')
    .replace(/&/g, '\\\\u0026')
    .replace(/\\u2028/g, '\\\\u2028')
    .replace(/\\u2029/g, '\\\\u2029');
}
`
  );

  replaceExact(
    "app/layout.tsx",
    `import { getSiteContent } from "@/lib/server/site-content.server";`,
    `import { getSiteContent } from "@/lib/server/site-content.server";
import { serializeJsonLd } from "@/lib/seo-jsonld";`
  );
  replaceExact(
    "app/layout.tsx",
    `dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}`,
    `dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}`
  );

  replaceExact(
    "app/(public)/portfolio/[slug]/page.tsx",
    `import { getServerPortfolioBySlug } from "@/lib/server/portfolio.server";`,
    `import { getServerPortfolioBySlug } from "@/lib/server/portfolio.server";
import { serializeJsonLd } from "@/lib/seo-jsonld";`
  );
  replaceExact(
    "app/(public)/portfolio/[slug]/page.tsx",
    `dangerouslySetInnerHTML={{ __html: JSON.stringify(portfolioJsonLd) }}`,
    `dangerouslySetInnerHTML={{ __html: serializeJsonLd(portfolioJsonLd) }}`
  );

  // ---------------------------------------------------------------------------
  // 5) Regression tests.
  // ---------------------------------------------------------------------------
  createOnce(
    "tests/firebase-hardening-stage1.test.cjs",
`const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const source = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('security rate limits are persistent and admin route awaits them', () => {
  const backend = source('lib/server/firebase-backend.ts');
  const rest = source('lib/server/firebase-rest.ts');
  const route = source('app/api/backend/route.ts');
  assert.ok(!backend.includes('const memRate = new Map'));
  assert.ok(backend.includes('consumeRateLimit(hash(key)'));
  assert.ok(rest.includes("mutateDocTransaction<boolean>('securityRateLimits'"));
  assert.ok(route.includes('if(!await allowAdminLoginAttempt(input.email))'));
});

test('OTP challenge is transactionally consumed and resend replaces prior code', () => {
  const backend = source('lib/server/firebase-backend.ts');
  assert.ok(backend.includes("mutateDocTransaction<any>('authChallenges'"));
  assert.ok(backend.includes("queryEquals('authChallenges','email',email)"));
  assert.ok(backend.includes("previous.map((row:any)=>deleteDoc('authChallenges'"));
  assert.ok(!backend.includes("await setDoc('authChallenges',challengeId,{customerId:customer?.id||''"));
});

test('public order cannot overwrite an existing customer profile', () => {
  const backend = source('lib/server/firebase-backend.ts');
  assert.ok(backend.includes("if(oldCustomer){await patch('customers',customerId,{lastActivity:now});}else{await setDoc('customers'"));
});

test('quotation and order state are committed atomically', () => {
  const backend = source('lib/server/firebase-backend.ts');
  assert.ok(backend.includes("commitAtomic([{collection:'quotations',id,data:{quotationNumber"));
  assert.ok(backend.includes("commitAtomic([{collection:'quotations',id,data:{status:response"));
});

test('JSON-LD serializer escapes HTML-significant characters', () => {
  const code = ts.transpileModule(source('lib/seo-jsonld.ts'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  new Function('module','exports',code)(module,module.exports);
  const out = module.exports.serializeJsonLd({ x: '</script><script>alert(1)</script>&\\u2028\\u2029' });
  assert.equal(out.includes('</script>'), false);
  assert.ok(out.includes('\\\\u003c/script\\\\u003e'));
  assert.ok(out.includes('\\\\u0026'));
  assert.ok(out.includes('\\\\u2028'));
  assert.ok(out.includes('\\\\u2029'));
  assert.ok(source('app/layout.tsx').includes('serializeJsonLd(jsonLd)'));
  assert.ok(source('app/(public)/portfolio/[slug]/page.tsx').includes('serializeJsonLd(portfolioJsonLd)'));
});
`
  );

  console.log("");
  console.log("Tahap 1 hardening berhasil diterapkan ke working tree lokal.");
  console.log(`Backup: ${backupRoot}`);
  console.log("");
  console.log("Jalankan verifikasi:");
  console.log("  npm run test:security");
  console.log("  npm run typecheck");
  console.log("  npm run build");
  console.log("");
  console.log("Setelah semuanya lulus:");
  console.log("  git add .");
  console.log('  git commit -m "security: apply stage 1 hardening"');
  console.log("  git push origin main");
} catch (error) {
  console.error("");
  console.error("PATCH GAGAL:", error && error.message ? error.message : error);
  console.error("Tidak ada patch lanjutan yang diterapkan setelah titik kegagalan.");
  process.exitCode = 1;
}
