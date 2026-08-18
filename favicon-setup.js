const fs = require('fs');
const path = require('path');

const required = [
  'android-chrome-192x192.png',
  'android-chrome-512x512.png',
  'apple-touch-icon.png',
  'favicon.ico',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'site.webmanifest',
];

console.log('\n🎨 Setup Favicon Kastriva...\n');

// 1. Cek file sudah ada di public/
let missing = [];
required.forEach(f => {
  if (!fs.existsSync(path.join('public', f))) missing.push(f);
});

if (missing.length > 0) {
  console.log('⚠️  File berikut BELUM ada di folder public/:');
  missing.forEach(f => console.log('   - ' + f));
  console.log('\n📌 Copy dulu semua file favicon ke folder public/, lalu jalankan ulang script ini.');
  process.exit(1);
}
console.log('✅ Semua file favicon sudah ada di public/');

// 2. Update branding di site.webmanifest
try {
  const mPath = 'public/site.webmanifest';
  const m = JSON.parse(fs.readFileSync(mPath, 'utf8'));
  m.name = 'Kastriva - Jasa Pembuatan Website & Aplikasi';
  m.short_name = 'Kastriva';
  m.theme_color = '#6C5CE7';
  m.background_color = '#0A0A0F';
  m.start_url = m.start_url || '/';
  m.display = m.display || 'standalone';
  fs.writeFileSync(mPath, JSON.stringify(m, null, 2), 'utf8');
  console.log('✅ Updated: public/site.webmanifest (branding Kastriva)');
} catch (e) {
  console.log('⚠️  Gagal update site.webmanifest: ' + e.message);
}

// 3. Update app/layout.tsx (manifest + icons)
const layoutPath = 'app/layout.tsx';
if (fs.existsSync(layoutPath)) {
  let content = fs.readFileSync(layoutPath, 'utf8');
  const original = content;

  content = content.replace(
    'manifest: "/manifest.webmanifest",',
    'manifest: "/site.webmanifest",'
  );

  content = content.replace(
    'icons: { icon: "/icon.svg" },',
    'icons: {\n' +
    '    icon: [\n' +
    '      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },\n' +
    '      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },\n' +
    '      { url: "/favicon.ico", sizes: "any" },\n' +
    '    ],\n' +
    '    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],\n' +
    '  },'
  );

  if (content !== original) {
    fs.writeFileSync(layoutPath, content, 'utf8');
    console.log('✅ Updated: app/layout.tsx (icons + manifest baru)');
  } else {
    console.log('ℹ️  layout.tsx tidak berubah (sudah benar atau cek manual).');
  }
} else {
  console.log('⚠️  app/layout.tsx tidak ditemukan!');
}

// 4. Hapus file icon lama dari Phase 11 (sudah tidak dipakai)
['public/manifest.webmanifest', 'public/icon.svg'].forEach(f => {
  if (fs.existsSync(f)) {
    fs.unlinkSync(f);
    console.log('🗑️  Deleted file lama: ' + f);
  }
});

console.log('\n🎉 Selesai!');
console.log('1. npm run dev');
console.log('2. Hard refresh browser: Ctrl + Shift + R (favicon sering di-cache)');
console.log('3. Logo Kastriva muncul di tab browser ✅');
console.log('4. git add . && git commit -m "Add Kastriva favicon & web manifest" && git push');