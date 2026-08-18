const fs = require('fs');

const p = 'components/auth/LoginPageClient.tsx';

if (!fs.existsSync(p)) {
  console.log('⚠️ File components/auth/LoginPageClient.tsx tidak ditemukan!');
  process.exit(1);
}

let c = fs.readFileSync(p, 'utf8');

const startMarker = '{/* Logo */}';
const endMarker = '<div className="relative z-10 space-y-4">';

const si = c.indexOf(startMarker);
const ei = c.indexOf(endMarker);

if (si === -1 || ei === -1) {
  console.log('⚠️ Marker tidak ditemukan. Edit manual bagian {/* Logo */} di LoginPageClient.tsx');
  process.exit(1);
}

const newBlock = `{/* Logo */}
          <div className="relative z-10">
            <div
              className={\`inline-block p-4 lg:p-5 rounded-2xl transition-all duration-700 \${
                isAdmin
                  ? "bg-white/5 border border-white/10"
                  : "bg-[#050B18] shadow-xl shadow-blue-900/25 ring-1 ring-blue-500/20"
              }\`}
            >
              {logoError ? (
                <div className="flex items-center gap-3">
                  <img
                    src="/android-chrome-192x192.png"
                    alt="Kastriva"
                    className="w-12 h-12 rounded-xl"
                  />
                  <span className="text-2xl font-extrabold tracking-widest text-white">
                    KASTRIVA
                  </span>
                </div>
              ) : (
                <img
                  src="/logo-kastriva.png"
                  alt="Kastriva – Web Developer"
                  className="h-12 lg:h-16 w-auto object-contain"
                  onError={() => setLogoError(true)}
                />
              )}
            </div>
          </div>

          `;

c = c.slice(0, si) + newBlock + c.slice(ei);
fs.writeFileSync(p, c, 'utf8');

console.log('✅ Logo dock terpasang!');
console.log('');
console.log('📌 Test:');
console.log('1. npm run dev → buka /login');
console.log('2. Mode Customer → logo kini berada di kartu dark navy, terlihat JELAS');
console.log('3. Mode Admin → dock menyatu halus dengan panel gelap');
console.log('4. Toggle bolak-balik → transisi smooth 700ms');
console.log('');
console.log('git add . && git commit -m "Fix: logo dock agar jelas di mode light" && git push');