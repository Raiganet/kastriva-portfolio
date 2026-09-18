# Kastriva Portfolio — Tahap 1 Hardening

Paket ini dibuat untuk snapshot repository `Raiganet/kastriva-portfolio` yang diperiksa pada 19 September 2026.

## Yang diterapkan

1. **Profil pelanggan tidak lagi bisa tertimpa dari form order publik.**
   - Order baru tetap menyimpan nama/kontak yang dikirim pada dokumen order.
   - Bila email sudah memiliki profil customer, form publik hanya memperbarui `lastActivity`.
   - Data profil utama seperti nama, WhatsApp, bisnis, avatar, status, dan `createdAt` tidak ditimpa oleh pengunjung yang hanya mengetahui alamat email.

2. **Rate limit login / OTP menjadi persistent di Firestore.**
   - Menghapus limiter `Map` di memory proses Vercel.
   - Counter dijalankan melalui transaksi Firestore, sehingga beberapa instance Vercel memakai limiter yang sama.
   - Admin login, request OTP, verifikasi OTP, dan limit order memakai mekanisme persistent.

3. **OTP diperkuat.**
   - Challenge OTP dikonsumsi secara transaksional sehingga pemakaian paralel tidak dapat memakai kode yang sama dua kali.
   - Lima percobaan salah tetap membatalkan challenge.
   - Request kode baru membatalkan challenge lama untuk email yang sama.
   - Email yang tidak terdaftar tetap mendapat respons generik, tetapi tidak dibuatkan challenge Firestore yang bisa digunakan.

4. **Quotation + status order ditulis atomik.**
   - Pembuatan quotation dan perubahan order ke `Quotation` memakai satu atomic Firestore commit.
   - Respons customer pada quotation dan perubahan status order terkait juga satu atomic commit.
   - Mengurangi risiko quotation sudah berubah tetapi order belum berubah, atau sebaliknya.

5. **JSON-LD aman dari penutupan tag `<script>`.**
   - Menambahkan `lib/seo-jsonld.ts`.
   - Karakter `<`, `>`, `&`, U+2028 dan U+2029 di-escape sebelum JSON-LD dimasukkan ke `dangerouslySetInnerHTML`.
   - Diterapkan pada root layout dan halaman detail portfolio.

6. **Regression test baru**
   - `tests/firebase-hardening-stage1.test.cjs`

## Cara menerapkan

Salin `apply-tahap1-hardening.cjs` ke root repository, lalu dari PowerShell:

```powershell
cd C:\path\ke\kastriva-portfolio
node .\apply-tahap1-hardening.cjs
npm run test:security
npm run typecheck
npm run build
```

Patcher membuat backup otomatis di `.stage1-backup/<timestamp>/`.

Jika semua lulus:

```powershell
git add .
git commit -m "security: apply stage 1 hardening"
git push origin main
```

## Catatan GitHub

Koneksi GitHub yang digunakan ChatGPT saat paket ini dibuat hanya memiliki izin `pull/read`, bukan `push/write`, sehingga perubahan tidak bisa dikirim langsung ke branch `main` dari koneksi tersebut. Script ini dibuat agar perubahan yang sama dapat diterapkan tanpa edit manual pada working tree lokal.
