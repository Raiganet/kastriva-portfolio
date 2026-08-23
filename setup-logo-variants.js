const fs = require('fs');

console.log('\n🎨 Setup 2 varian logo (light & dark) untuk halaman login...\n');

// ===== Cek file logo =====
let ok = true;
['public/logo-dark.png', 'public/logo-light.png'].forEach(f => {
  if (fs.existsSync(f)) {
    console.log('✅ Ditemukan: ' + f);
  } else {
    console.log('❌ BELUM ADA: ' + f);
    ok = false;
  }
});

if (!ok) {
  console.log('\n📌 Copy dulu kedua file logo ke folder public/ dengan nama persis:');
  console.log('   - logo-dark.png  (teks putih, untuk panel gelap)');
  console.log('   - logo-light.png (teks hitam, untuk panel putih)');
  console.log('Lalu jalankan ulang script ini.');
  process.exit(1);
}

// ===== Update LoginPageClient =====
const p = 'components/auth/LoginPageClient.tsx';

if (!fs.existsSync(p)) {
  console.log('⚠️ File LoginPageClient.tsx tidak ditemukan!');
  process.exit(1);
}

let c = fs.readFileSync(p, 'utf8');

const startMarker = '{/* Logo */}';
const endMarker = '<div className="relative z-10 space-y-4">';

const si = c.indexOf(startMarker);
const ei = c.indexOf(endMarker);

if (si === -1 || ei === -1) {
  console.log('⚠️ Marker tidak ditemukan — cek manual bagian {/* Logo */}');
  process.exit(1);
}

const newBlock = `{/* Logo */}
          <div className="relative z-10">
            {logoError ? (
              <div className="flex items-center gap-3">
                <img
                  src="/android-chrome-192x192.png"
                  alt="Kastriva"
                  className="w-12 h-12 rounded-xl"
                />
                <span
                  className={\`text-2xl font-extrabold tracking-widest transition-colors duration-700 \${
                    isAdmin ? "text-white" : "text-slate-900"
                  }\`}
                >
                  KASTRIVA
                </span>
              </div>
            ) : (
              <div className="relative h-14 lg:h-20 w-[240px] lg:w-[320px]">
                {/* Logo dark: tampil saat panel gelap (Admin) */}
                <img
                  src="/logo-dark.png"
                  alt="Kastriva – WebApp & Android Development"
                  onError={() => setLogoError(true)}
                  className={\`absolute inset-0 h-full w-full object-contain transition-all duration-700 \${
                    isAdmin
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-95 pointer-events-none"
                  }\`}
                />
                {/* Logo light: tampil saat panel terang (Customer) */}
                <img
                  src="/logo-light.png"
                  alt="Kastriva – WebApp & Android Development"
                  onError={() => setLogoError(true)}
                  className={\`absolute inset-0 h-full w-full object-contain transition-all duration-700 \${
                    isAdmin
                      ? "opacity-0 scale-95 pointer-events-none"
                      : "opacity-100 scale-100"
                  }\`}
                />
              </div>
            )}
          </div>

          `;

c = c.slice(0, si) + newBlock + c.slice(ei);
fs.writeFileSync(p, c, 'utf8');

console.log('✅ LoginPageClient.tsx: logo light/dark crossfade terpasang!');
console.log('');
console.log('📌 TEST:');
console.log('1. npm run dev → buka /login');
console.log('2. Mode Admin   → logo TEKS PUTIH muncul di panel gelap');
console.log('3. Mode Customer → logo TEKS HITAM muncul di panel putih');
console.log('4. Toggle bolak-balik → crossfade + scale smooth 700ms, TANPA KOTAK');
console.log('');
console.log('git add . && git commit -m "Login: dual logo variants (light/dark) crossfade" && git push');