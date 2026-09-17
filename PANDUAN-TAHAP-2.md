# Tahap 2 — Keandalan penyimpanan order

Paket ini sudah mencakup tahap 1. Gunakan paket lengkap ini sebagai versi terbaru proyek. Jika tahap 1 belum dipasang, ikuti `PANDUAN-TAHAP-1.md` terlebih dahulu.

## Perubahan utama

- Setiap permintaan memiliki ID acak tetap. Pengiriman ulang ID dan isi yang sama mengembalikan order yang sama, bukan membuat baris baru.
- Identitas permintaan, ringkasan isi, dan antrean email disimpan bersama order dalam satu penulisan baris.
- Jika respons hilang setelah Spreadsheet menerima order, pelanggan dapat mencoba kembali dengan ID yang sama.
- Order, pencarian/pembuatan pelanggan, dan alokasi nomor berjalan dalam script lock yang sama. Nomor menggunakan counter persisten dan pemeriksaan nomor tertinggi, bukan urutan baris terakhir.
- Penulisan status, pembuatan/progres proyek, serta pembuatan/respons penawaran melalui router memakai lock yang sama. Nomor penawaran tidak terpotong kembali ke empat digit setelah 9999.
- Perubahan status manual dari admin memeriksa waktu pembaruan yang terakhir dilihat. Data lama ditolak dan dimuat ulang.
- Input order divalidasi kembali di GAS; teks yang dapat dianggap formula ditulis sebagai teks biasa.
- Draf formulir dipulihkan setelah reload. Selama hasil pengiriman belum diketahui, isi dikunci dan tombol coba lagi memakai data asli.
- Gangguan penyimpanan history browser tidak mengubah hasil order berhasil menjadi gagal.
- Email order diproses oleh antrean persisten terpisah dari penyimpanan order.

## Pemasangan tanpa membuat ulang database

1. Cadangkan source GAS dan Spreadsheet yang sedang digunakan.
2. Tetap gunakan `SPREADSHEET_ID`, `GAS_API_URL`, dan rahasia tahap 1 yang sama. Tidak ada environment baru untuk tahap 2.
3. Di editor Google Apps Script, tambahkan file baru `DataIntegrity.gs` dan `OrderNotifications.gs` dari folder `google-apps-script`.
4. Ganti seluruh isi `Orders.gs`, `Router.gs`, `Utils.gs`, `Quotations.gs`, dan `CustomerPortal.gs` dengan versi dalam paket ini. File keamanan tahap 1 tetap diperlukan. Pastikan `OrdersEnhancements.gs` tetap kosong sesuai tahap 1.
5. Jalankan fungsi `setupOrderReliabilityStage2()` sekali. Fungsi aman dijalankan ulang: hanya menambahkan header yang belum ada dan memastikan satu trigger antrean email.
6. Pastikan sheet Orders memiliki tiga kolom tambahan di bagian akhir: `requestId`, `requestHash`, dan `notifications`. Kolom lama A–S tidak boleh dipindah atau diganti namanya. Nilai order lama tetap dipertahankan.
7. Pastikan pada menu Triggers terdapat `processOrderNotificationsStage2`, berjalan setiap menit. Gunakan akun pemilik deployment yang mempunyai izin mengirim email. Jika diminta, izinkan akses Gmail/Spreadsheet/trigger.
8. Perbarui deployment GAS aktif melalui Manage deployments → Edit → New version → Deploy.
9. Unggah source frontend terbaru ke repository dan redeploy Vercel. Tidak perlu menjalankan ulang pembuatan password admin.

**Jangan menjalankan `setupDatabase()` pada pembaruan ini** karena fungsi lama tersebut membuat Spreadsheet baru.

Jadwalkan jeda singkat saat memperbarui GAS dan frontend: frontend lama belum mengirim ID permintaan sehingga akan ditolak oleh backend baru. Jangan membuka kembali endpoint lama untuk mengatasi jeda tersebut. Deployment lama yang rentan tetap harus diarsipkan sesuai tahap 1.

## Cara kerja bagi pelanggan

- Saat mengisi formulir, draf disimpan pada browser yang sama.
- Draf yang belum dikirim serta konfirmasi yang sudah selesai dibersihkan saat dibuka kembali setelah 7 hari.
- Draf dengan hasil pengiriman belum pasti tidak dihapus otomatis. Pelanggan perlu menekan **Coba kirim kembali dengan aman** sampai memperoleh hasil.
- Tombol kirim tidak aktif saat offline; tidak ada pengiriman otomatis diam-diam saat internet pulih.
- Setelah berhasil, formulir menampilkan nomor order dan mencegah pengiriman ulang tanpa sengaja. Untuk pesanan lain, pilih **Buat permintaan baru**.
- Selama status pengiriman belum pasti, pelanggan tidak dapat menghapus draf atau mengganti isinya dari formulir. Ini mencegah permintaan yang sudah tersimpan berubah menjadi order kedua.
- Jika browser menolak penyimpanan, aplikasi meminta pengguna mengaktifkannya sebelum memulai pengiriman. Tidak ada nomor order buatan browser.

Browser dengan Web Locks memakai draf bersama dan mengoordinasikan pengiriman antartab pada origin yang sama. Browser tanpa Web Locks menggunakan sessionStorage per tab; draf tetap bertahan saat reload tab tersebut, tetapi biasanya tidak setelah tab ditutup. Draf tidak tersinkron antarperangkat, antarprofil browser, mode privat, atau domain berbeda.

Draf menyimpan data formulir pada perangkat, bukan password atau token login. Pada perangkat bersama, gunakan Hapus draf setelah tidak diperlukan. Jangan membersihkan storage saat hasil kirim belum jelas sebelum memeriksa order melalui login pelanggan/admin.

## Antrean email

Kolom `notifications` berisi status untuk penerima `admin` dan `customer`:

| State | Arti |
| --- | --- |
| `pending` | Menunggu trigger |
| `sending` | Sudah diklaim satu proses pengirim |
| `sent` | Gmail menerima pengiriman; bukan jaminan email sudah masuk inbox |
| `failed` | Proses mengirim melaporkan kegagalan |
| `uncertain` | Proses terputus sebelum hasil pengiriman dapat dicatat |

Trigger mengambil maksimal 10 email setiap eksekusi. Email dikirim setelah lock Spreadsheet dilepas. Order lama tanpa antrean tidak dikirim ulang. Order baru tetap sah dan dapat dilihat di admin meskipun email menunggu atau gagal.

State `sending` yang melewati 10 menit berubah menjadi `uncertain`. State `failed` dan `uncertain` tidak dikirim ulang secara otomatis karena Gmail dan Spreadsheet tidak menyediakan transaksi bersama: pengiriman mungkin sudah diterima sebelum koneksi terputus.

Untuk pemulihan:

1. Periksa nomor order, folder Sent pada akun pengirim, izin Gmail, kuota, dan log eksekusi trigger.
2. Jika sudah terkirim, jangan mengirim ulang.
3. Jika memang perlu dikirim lagi, buat fungsi sementara di editor GAS berikut, ganti nomor order dan penerima yang tepat, lalu jalankan secara manual:

```javascript
function retryOneOrderEmail() {
  const result = retryOrderNotificationStage2('KAS-2026-0001', 'customer');
  Logger.log(JSON.stringify(result));
}
```

Penerima hanya `customer` atau `admin`. Fungsi pemulihan hanya mengubah `failed`/`uncertain` menjadi `pending`; trigger akan mengerjakannya. Jangan memanggilnya berulang. Pengiriman ulang manual dapat menghasilkan email ganda bila email sebelumnya sebenarnya sudah diterima.

## Pemeriksaan setelah deploy

1. Isi satu order baru: pastikan satu baris muncul di Orders dan satu nomor konfirmasi diterima.
2. Ulangi permintaan yang sama atau reload saat hasil kirim belum pasti: harus kembali ke nomor yang sama.
3. Buka draf yang sama di dua tab pada Chrome/Edge terbaru: pengiriman bersamaan harus menghasilkan satu order untuk ID yang sama.
4. Kirim dua order berbeda: nomor berbeda, meskipun baris Spreadsheet diurutkan ulang.
5. Matikan internet saat mengisi: draf tidak hilang, tombol kirim tidak aktif.
6. Setelah internet kembali, lakukan pengiriman ulang secara manual.
7. Periksa kedua status email di kolom notifications setelah trigger berjalan.
8. Dua admin membuka data order yang sama; setelah admin pertama mengubah status, perubahan dari tampilan lama admin kedua harus ditolak dengan permintaan muat ulang.
9. Pastikan login OTP, tracking milik pelanggan, dan dashboard tahap 1 tetap berfungsi.

## Batas jaminan

- Idempotensi berlaku untuk **ID permintaan yang sama**, selama baris order dan kolom identitasnya tetap ada. Order identik yang sengaja dimulai sebagai permintaan baru memiliki ID berbeda dan dianggap pesanan baru.
- Jangan menghapus baris order yang masih mungkin dicoba ulang, mengosongkan requestId/requestHash, atau menghapus counter `sequence_*` di Script Properties. Gunakan status Cancelled untuk pembatalan.
- Gunakan satu proyek GAS sebagai penulis database ini. Script lock tidak mengunci proyek GAS lain atau edit Spreadsheet manual.
- Counter dapat memiliki nomor yang terlewati jika suatu proses berhenti setelah alokasi nomor. Nomor tidak harus rapat; tujuannya mencegah benturan.
- Spreadsheet tidak mendukung transaksi penuh antarsheet. Pelanggan yang sudah tercatat sebelum proses order terputus dapat dipakai kembali pada retry. Idempotensi tahap ini khusus pembuatan order, bukan semua operasi pembuatan penawaran/progres proyek.
- Perubahan status/proyek/penawaran dibuat berurutan melalui lock, tetapi pemulihan otomatis setiap kegagalan sebagian antarsheet belum termasuk tahap ini.
- Perbaikan kewenangan CMS portofolio dan pengisian referensi proyek dari CMS tetap masuk tahap 3.

## Verifikasi lokal

```bash
npm ci
npm run test:security
npm run typecheck
npm run build
```

Pengujian menggunakan simulasi Spreadsheet, script lock, storage browser, dan pengiriman email. Tidak ada Spreadsheet produksi yang diubah atau email nyata dikirim selama pengujian paket. Tetap lakukan pemeriksaan deployment di akun Anda.

Hasil pemeriksaan paket: 35 pengujian otomatis lulus; pemeriksaan tipe dan build produksi Next.js berhasil.
