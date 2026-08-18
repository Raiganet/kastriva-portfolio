const fs = require('fs');
const p = 'components/Navbar.tsx';
let c = fs.readFileSync(p, 'utf8');

const oldStr = '<Link href="/" className="text-2xl font-bold tracking-tight text-gradient">\n          {config.brand.name}\n        </Link>';

const newStr = '<Link href="/" className="flex items-center gap-2.5">\n          <img\n            src="/android-chrome-192x192.png"\n            alt="Logo Kastriva"\n            className="w-9 h-9 rounded-xl shadow-lg shadow-primary-600/30"\n          />\n          <span className="text-xl font-bold tracking-tight text-gradient">\n            {config.brand.name}\n          </span>\n        </Link>';

if (c.includes(oldStr)) {
  c = c.replace(oldStr, newStr);
  fs.writeFileSync(p, c, 'utf8');
  console.log('✅ Navbar logo updated!');
} else {
  console.log('⚠️ Pattern tidak ditemukan — cek manual components/Navbar.tsx');
}