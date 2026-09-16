#!/usr/bin/env node
// Run locally. Password is read without echo and is never written to disk.
const { randomBytes, scryptSync } = require('node:crypto');
const readline = require('node:readline');
function passwordPrompt() {
  return new Promise(resolve => {
    if (!process.stdin.isTTY) throw new Error('Jalankan dari terminal interaktif.');
    process.stdout.write('Password admin baru (minimal 12 karakter): ');
    process.stdin.setRawMode(true); process.stdin.resume(); process.stdin.setEncoding('utf8');
    let value = '';
    const receive = chunk => {
      for (const c of chunk) {
        if (c === '\u0003') { process.stdin.setRawMode(false); process.exit(1); }
        if (c === '\r' || c === '\n') {
          process.stdin.removeListener('data', receive); process.stdin.setRawMode(false); process.stdin.pause(); process.stdout.write('\n'); resolve(value); return;
        }
        if (c === '\u007f' || c === '\b') value = value.slice(0, -1);
        else if (c >= ' ') value += c;
      }
    };
    process.stdin.on('data', receive);
  });
}
(async () => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const email = await new Promise(resolve => rl.question('Email admin: ', resolve)); rl.close();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new Error('Email tidak valid.');
  const password = await passwordPrompt();
  if (password.length < 12 || password.length > 256) throw new Error('Password harus 12–256 karakter.');
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString('hex');
  console.log('\nSalin ke environment server (nilai rahasia, jangan commit):');
  console.log('ADMIN_EMAIL=' + email.trim().toLowerCase());
  console.log('ADMIN_PASSWORD_SCRYPT=scrypt-v1$' + salt + '$' + hash);
  console.log('GAS_BRIDGE_SECRET=' + randomBytes(32).toString('hex'));
  console.log('\nSalin GAS_BRIDGE_SECRET yang sama dan ADMIN_EMAIL ke Script Properties GAS.');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
