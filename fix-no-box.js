const fs = require('fs');

const p = 'components/auth/LoginPageClient.tsx';

if (!fs.existsSync(p)) {
  console.log('⚠️ File LoginPageClient.tsx tidak ditemukan!');
  process.exit(1);
}

let c = fs.readFileSync(p, 'utf8');
const before = c;

// Admin mode: hilangkan kotak sepenuhnya (logo menyatu dengan panel gelap)
// Customer mode: tetap dock neon glass (kontras di panel putih)
c = c.replace(
  '                isAdmin\n                  ? "bg-white/5 border border-[#00D9FF]/25 shadow-[0_0_35px_rgba(0,102,255,0.25)]"\n                  : "bg-[#050B18]/70 border border-[#00D9FF]/40 shadow-[0_0_45px_rgba(0,217,255,0.35)]"',
  '                isAdmin\n                  ? "bg-transparent border border-transparent"\n                  : "bg-[#050B18]/70 border border-[#00D9FF]/40 shadow-[0_0_45px_rgba(0,217,255,0.35)]"'
);

if (c !== before) {
  fs.writeFileSync(p, c, 'utf8');
  console.log('✅ Mode Admin: kotak dihapus — logo menyatu dengan panel!');
  console.log('✅ Mode Customer: dock neon glass tetap ada (kontras di panel putih)');
} else {
  console.log('⚠️ Pattern tidak ditemukan — cek manual bagian dock logo');
}

console.log('');
console.log('📌 Test: npm run dev → /login');
console.log('   Toggle Admin  → logo melayang bebas di panel gelap, TANPA kotak');
console.log('   Toggle Customer → dock neon glass muncul smooth (transisi 700ms)');
console.log('');
console.log('git add . && git commit -m "Login: remove logo box in admin mode" && git push');