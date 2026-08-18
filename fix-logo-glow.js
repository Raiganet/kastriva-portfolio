const fs = require('fs');

const p = 'components/auth/LoginPageClient.tsx';

if (!fs.existsSync(p)) {
  console.log('⚠️ File LoginPageClient.tsx tidak ditemukan!');
  process.exit(1);
}

let c = fs.readFileSync(p, 'utf8');
const before = c;

// 1. Tambahkan backdrop-blur ke base class dock
c = c.replace(
  'inline-block p-4 lg:p-5 rounded-2xl transition-all duration-700',
  'inline-block p-4 lg:p-5 rounded-2xl backdrop-blur-xl transition-all duration-700'
);

// 2. Ganti warna solid hitam -> glass transparan + neon glow
c = c.replace(
  '                isAdmin\n                  ? "bg-white/5 border border-white/10"\n                  : "bg-[#050B18] shadow-xl shadow-blue-900/25 ring-1 ring-blue-500/20"',
  '                isAdmin\n                  ? "bg-white/5 border border-[#00D9FF]/25 shadow-[0_0_35px_rgba(0,102,255,0.25)]"\n                  : "bg-[#050B18]/70 border border-[#00D9FF]/40 shadow-[0_0_45px_rgba(0,217,255,0.35)]"'
);

if (c !== before) {
  fs.writeFileSync(p, c, 'utf8');
  console.log('✅ Dock logo kini glass + neon blue glow!');
} else {
  console.log('⚠️ Pattern tidak ditemukan — cek manual bagian dock logo');
}

console.log('');
console.log('📌 Test: npm run dev → /login');
console.log('   Mode Customer: dock samar (70% transparan) + blur + glow cyan');
console.log('   Mode Admin: glass halus + glow biru lembut');
console.log('');
console.log('💡 Jika masih terasa gelap, ubah "bg-[#050B18]/70" menjadi "/60" atau "/50"');
console.log('');
console.log('git add . && git commit -m "Login: neon glass logo dock" && git push');