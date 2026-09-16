# Kastriva — Pembaruan keamanan tahap 1

Paket ini mengganti login pelanggan dengan kode email, melindungi tracking berdasarkan kepemilikan order, dan memindahkan sesi ke cookie HttpOnly. Frontend dan GAS harus diperbarui bersama. Mengunggah source ke GitHub saja belum mengaktifkan perlindungan pada GAS lama.

## 1. Persiapan

1. Buat cadangan Spreadsheet dan source GAS yang sedang digunakan.
2. Catat ID Spreadsheet lama dan URL deployment GAS aktif (`.../exec`). Tetap gunakan Spreadsheet lama.
3. Jangan menjalankan `setupDatabase()` untuk pembaruan ini: fungsi tersebut membuat database baru.
4. Gunakan Node.js 20 atau 22 LTS pada komputer/Vercel. Jalankan perintah berikut dari folder proyek:

```bash
npm ci
npm run security:setup
```

Masukkan email admin dan password baru sepanjang 12–256 karakter. Password tidak ditampilkan saat diketik. Program menghasilkan tiga nilai:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_SCRYPT`
- `GAS_BRIDGE_SECRET`

Simpan hasil secara privat. Jangan memasukkannya ke GitHub, chat publik, atau variabel `NEXT_PUBLIC_*`. Password asli digunakan saat login admin; nilai hash hanya untuk konfigurasi server. Tidak perlu memasang OpenSSL.

## 2. Atur Google Apps Script

Buka proyek GAS yang selama ini digunakan, kemudian **Project Settings → Script Properties**. Tambahkan:

| Nama | Nilai |
| --- | --- |
| `SPREADSHEET_ID` | ID Spreadsheet lama, bukan URL lengkap |
| `GAS_BRIDGE_SECRET` | Hasil program setup; harus sama persis dengan environment Vercel |
| `ADMIN_EMAIL` | Email penerima notifikasi admin |

Perbarui file dari folder `google-apps-script` pada ZIP ini. File keamanan yang wajib:

- Baru: `Security.gs`.
- Ganti seluruh isi: `Code.gs`, `Auth.gs`, `CustomerAuth.gs`, `Router.gs`, `Config.gs`, `Orders.gs`, `Quotations.gs`.
- Kosongkan `OrdersEnhancements.gs` atau ganti dengan komentar kosong yang ada dalam paket ini. Kode lama di file ini menimpa fungsi tracking dan dapat mengembalikan celah keamanan.
- Jangan menambahkan `Router.gs.new`; file lama tersebut sudah dihapus.
- Cari duplikasi `Orders.getByOrderNumber =` di file GAS lain. Hapus override lama. Gunakan hanya implementasi `Orders.gs` paket ini.

Jalankan `setupSecurityStage1()` sekali dari editor. Setujui izin yang diminta. Fungsi ini memvalidasi konfigurasi rahasia, menghapus sesi versi lama, dan membuat jadwal pembersihan sesi/OTP setiap jam. Izin Gmail diperlukan untuk pengiriman kode.

Lalu buka **Deploy → Manage deployments → Edit → New version → Deploy**. Perbarui deployment aktif yang URL-nya digunakan website. Jalankan sebagai pemilik proyek (Execute as: Me); akses web app boleh Anyone karena setiap permintaan aplikasi kini harus memiliki tanda tangan server yang valid.

**Arsipkan deployment lama yang masih menjalankan kode sebelum tahap 1.** Jika deployment lama tetap aktif, orang lain masih dapat memanggil endpoint lama. Deployment baru tidak otomatis menonaktifkan URL deployment lain.

## 3. Atur Vercel dan deploy frontend

Pada **Project → Settings → Environment Variables**, isi:

| Variabel | Keterangan |
| --- | --- |
| `GAS_API_URL` | URL GAS aktif yang telah diperbarui, berakhiran `/exec` |
| `GAS_BRIDGE_SECRET` | Sama persis dengan Script Properties GAS |
| `ADMIN_EMAIL` | Email login admin yang dimasukkan saat setup |
| `ADMIN_PASSWORD_SCRYPT` | Seluruh hasil hash `scrypt-v1$...$...`, tanpa tanda kutip tambahan |
| `NEXT_PUBLIC_SITE_URL` | Domain website produksi |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Opsional; pertahankan nilai sebelumnya |

Hapus `NEXT_PUBLIC_GAS_API_URL` karena tidak lagi digunakan. Jangan mengubah nama rahasia menjadi `NEXT_PUBLIC_*`.

Unggah isi folder proyek ke repository GitHub dan redeploy Vercel setelah environment disimpan. Pastikan environment diisi untuk target deploy yang digunakan. Untuk testing, gunakan proyek GAS/Spreadsheet uji terpisah dari produksi bila memungkinkan.

Ada jeda pemeliharaan singkat ketika GAS sudah diperbarui tetapi frontend masih lama. Selama jeda itu, permintaan lama sengaja ditolak. Jangan mengembalikan endpoint tanpa tanda tangan untuk mengatasi jeda tersebut.

## 4. Cara login setelah pembaruan

**Admin:** buka `/login` atau `/admin/login`, pilih Admin, lalu masukkan email dan password baru. Password lama di `Config.gs` tidak berlaku.

**Pelanggan:** buka `/login?role=customer` atau `/customer/login`, masukkan email yang digunakan saat memesan, lalu klik Kirim kode. Masukkan 8 digit kode dari email. Nomor order tidak lagi menjadi password.

- Kode berlaku 10 menit dan hanya bisa dipakai sekali.
- Maksimal 5 percobaan per kode. Kode baru membatalkan kode sebelumnya.
- Pengiriman ulang minimal 60 detik; maksimal 5 permintaan per email per jam.
- Email tidak terdaftar mendapat pesan layar yang sama, tetapi tidak dikirimi kode.
- Alamat email pada sheet Customers menjadi sumber identitas pelanggan. Pastikan pelanggan lama memiliki alamat yang benar dan tidak ada akun berbeda yang sengaja memakai email sama.
- Pelanggan baru tercatat dari formulir order seperti sebelumnya, tetapi akses ke data pelanggan tetap membutuhkan bukti kepemilikan email. Membuat order tidak menerbitkan sesi.

**Tracking:** halaman `/order/track` meminta login pelanggan. Setelah login, hanya nomor order milik pelanggan tersebut yang dapat dibuka. Penawaran dan dashboard tetap memeriksa identitas sesi di GAS.

## 5. Sesi dan batas percobaan

- Cookie sesi: HttpOnly, SameSite=Strict, Secure pada produksi, path `/`, tanpa domain lintas subdomain.
- Token tidak diberikan dalam JSON login, localStorage, sessionStorage, atau query URL.
- “Remember me”: sesi maksimum 24 jam. Tanpa centang: maksimum 2 jam dengan cookie sesi browser. Browser tertentu dapat memulihkan cookie sesi saat mengembalikan sesi sebelumnya; batas waktu server tetap berlaku.
- Satu sesi aktif per akun/peran. Login baru membatalkan sesi perangkat sebelumnya.
- Logout menghapus cookie dan mencoba mencabut sesi server. Jika GAS sedang tidak dapat dijangkau, cookie tetap dihapus; catatan server akan habis masa berlakunya.
- Maksimal 10 percobaan login admin global per 15 menit. Batas global sengaja tidak mempercayai header IP dari pengguna; dapat menyebabkan login tertunda saat diserang.
- Batas pengiriman kode global 60/jam dan verifikasi 100/menit; sesuaikan dengan kapasitas operasional hanya setelah evaluasi.
- Permintaan order dibatasi 5/email/jam dan 30 global/jam.
- Gateway GAS dibatasi 180 permintaan/menit. Pengunjung besar mungkin memerlukan penyesuaian atau backend lain; ini bukan pengganti perlindungan DDoS platform.
- Tanda tangan HMAC memiliki jendela waktu 60 detik dan nonce sekali pakai untuk mencegah replay.

Untuk mencabut semua sesi dan OTP, jalankan `revokeAllSessionsStage1()` di editor GAS. Lakukan ini setelah mengganti password admin atau bila ada dugaan akses tidak sah. Rotasi `GAS_BRIDGE_SECRET` harus dilakukan pada GAS dan Vercel bersamaan lalu redeploy frontend.

## 6. Pemeriksaan setelah pemasangan

1. Login admin dengan password baru berhasil; password salah ditolak.
2. Login pelanggan menerima email kode dan berhasil dengan kode benar.
3. Kode yang sudah digunakan tidak dapat dipakai lagi.
4. Setelah logout, dashboard tidak dapat diakses tanpa login ulang.
5. Login sebagai pelanggan A, lalu coba nomor order pelanggan B: harus ditolak.
6. Buka URL GAS langsung atau panggil endpoint lama tanpa tanda tangan: harus ditolak.
7. Pada browser DevTools, token hanya ada di cookie HttpOnly; tidak muncul di respons login atau penyimpanan lokal.
8. Periksa order, CMS portofolio, proyek, dan penawaran admin tetap dapat dimuat.
9. Coba kirim order pada koneksi gagal: harus muncul gagal, bukan nomor order sukses buatan browser.

Perintah verifikasi lokal:

```bash
npm run test:security
npm run typecheck
npm run build
```

Pengujian otomatis menggunakan data contoh dan tiruan layanan GAS. Pengiriman email, Spreadsheet nyata, izin Google, dan deployment harus diperiksa setelah konfigurasi di akun Anda.

## 7. Troubleshooting

- **Layanan belum dikonfigurasi:** periksa empat environment server, URL `/exec`, dan redeploy.
- **Unauthorized pada semua permintaan:** secret berbeda, deployment belum diperbarui, atau masih memakai URL deployment lama.
- **OTP tidak masuk:** periksa spam, email pada Customers, izin Gmail, kuota email, log eksekusi GAS, dan tunggu batas kirim ulang. Respons layar sengaja tidak mengungkap apakah email terdaftar.
- **Login benar tetapi kembali ke halaman login:** periksa cookie HTTPS, domain yang digunakan, jam server, dan apakah akun baru saja login di perangkat lain.
- **Terlalu banyak percobaan:** tunggu jendela pembatasan. Tidak ada tombol reset limit publik.
- **Order lama hilang:** pastikan SPREADSHEET_ID tetap memakai database lama; jangan membuat ulang database.

## 8. Batas lingkup tahap 1

Next.js dinaikkan dari 14.2.3 ke patch 14.2.35 untuk mengurangi risiko dari patch lama. Versi mayor 14 tetap di luar dukungan resmi; migrasi ke versi LTS yang didukung masih perlu dikerjakan tersendiri beserta penyesuaian React/API. Paket ini bukan klaim bahwa seluruh aplikasi sudah bebas celah.

CMS seluruh halaman, konflik penulisan order bersamaan, idempotensi pengiriman ulang, invoice, dan PWA penuh belum termasuk tahap ini. Penanganan order gagal dibuat fail-closed agar penolakan keamanan tidak berubah menjadi sukses palsu. Data pengguna dan konten tidak dimigrasi atau dihapus.

## Hasil verifikasi paket

- 14 pengujian keamanan otomatis lulus, termasuk OTP, pembatasan percobaan, otorisasi order, cookie, hash password, tanda tangan, dan replay.
- Pemeriksaan TypeScript dan build produksi Next.js 14.2.35 lulus.
- Server produksi lokal: 3 halaman dan 5 pemeriksaan penolakan/konfigurasi API lulus.
- Tidak ada email nyata yang dikirim atau data Spreadsheet produksi yang diubah selama pengujian.
