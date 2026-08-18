const fs = require('fs');

console.log('\n🎨 Mengganti logo Admin & Customer area dengan logo asli...\n');

// ===== 1. AdminSidebar =====
const aPath = 'components/admin/AdminSidebar.tsx';
if (fs.existsSync(aPath)) {
  let c = fs.readFileSync(aPath, 'utf8');
  const before = c;

  // Logo desktop sidebar
  c = c.replace(
    '<div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">\n              <ShieldCheck size={20} className="text-white" />\n            </div>',
    '<img\n              src="/android-chrome-192x192.png"\n              alt="Logo Kastriva"\n              className="w-9 h-9 rounded-xl shadow-lg shadow-primary-600/30"\n            />'
  );

  // Logo mobile top bar
  c = c.replace(
    '<div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">\n            <ShieldCheck size={16} className="text-white" />\n          </div>',
    '<img\n            src="/android-chrome-192x192.png"\n            alt="Logo Kastriva"\n            className="w-8 h-8 rounded-lg"\n          />'
  );

  // Bersihkan import yang tidak dipakai
  c = c.replace('  ExternalLink,\n  ShieldCheck,\n} from "lucide-react";', '  ExternalLink,\n} from "lucide-react";');

  if (c !== before) {
    fs.writeFileSync(aPath, c, 'utf8');
    console.log('✅ AdminSidebar: logo diganti dengan logo asli');
  } else {
    console.log('⚠️ AdminSidebar: pattern tidak ditemukan — cek manual');
  }
} else {
  console.log('⚠️ File AdminSidebar.tsx tidak ditemukan');
}

// ===== 2. CustomerNav =====
const cPath = 'components/customer/CustomerNav.tsx';
if (fs.existsSync(cPath)) {
  let c = fs.readFileSync(cPath, 'utf8');
  const before = c;

  c = c.replace(
    '<div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">\n            <UserCircle2 size={18} className="text-white" />\n          </div>',
    '<img\n            src="/android-chrome-192x192.png"\n            alt="Logo Kastriva"\n            className="w-8 h-8 rounded-lg"\n          />'
  );

  // Bersihkan import yang tidak dipakai
  c = c.replace('UserCircle2, ', '');

  if (c !== before) {
    fs.writeFileSync(cPath, c, 'utf8');
    console.log('✅ CustomerNav: logo diganti dengan logo asli');
  } else {
    console.log('⚠️ CustomerNav: pattern tidak ditemukan — cek manual');
  }
} else {
  console.log('⚠️ File CustomerNav.tsx tidak ditemukan');
}

console.log('\n🎉 Selesai!');
console.log('');
console.log('📌 Test:');
console.log('1. npm run dev');
console.log('2. Buka /admin → sidebar kiri atas kini menampilkan logo Kastriva');
console.log('3. Buka /customer → nav bar atas juga logo Kastriva');
console.log('');
console.log('💡 TIP: Jika ingin logo HORISONTAL (teks KASTRIVA) di sidebar,');
console.log('   ganti src="/android-chrome-192x192.png" menjadi src="/logo-kastriva.png"');
console.log('   dan className menjadi "h-10 w-auto object-contain"');
console.log('');
console.log('git add . && git commit -m "Use real Kastriva logo in admin & customer area" && git push');