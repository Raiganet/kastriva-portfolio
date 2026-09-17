# Tahap 6 — Migrasi Server Kastriva ke Firebase / Firestore

Tahap ini mengganti backend utama **Google Apps Script + Google Sheets** menjadi **Firebase Firestore**, tanpa mengubah tampilan dan workflow utama Kastriva.

## Arsitektur baru

```text
Browser / PWA
     ↓
Next.js di Vercel
     ↓  (same-origin /api/backend)
Firebase Firestore
```

Credential Firebase **tidak pernah dikirim ke browser**. Semua akses Firestore dilakukan oleh server Next.js menggunakan Firebase service account.

## Yang pindah ke Firestore

- Orders
- Customers
- Projects
- Project Updates
- Quotations
- Invoices
- Revisions
- Handovers
- Portfolio CMS
- Website CMS / SiteContent
- Services
- Settings
- Audit Logs
- Customer OTP challenges

Admin login tetap memakai `ADMIN_EMAIL` + `ADMIN_PASSWORD_SCRYPT` agar UI login tidak berubah. Session admin/customer sekarang menggunakan cookie HttpOnly yang ditandatangani `SESSION_SECRET`, sehingga tidak lagi memerlukan session di GAS.

## 1. Buat Firebase Project

1. Buka Firebase Console.
2. Create/Add project.
3. Buka **Build → Firestore Database → Create database**.
4. Pilih lokasi Firestore yang paling dekat dengan mayoritas pengguna Anda. Untuk pengguna Indonesia, pilih region yang tersedia dan paling sesuai dari Firebase Console.
5. Setelah database aktif, deploy `firestore.rules` dari project ini atau set rules sehingga akses langsung browser ditolak.

Project ini sengaja menggunakan Firestore hanya dari server Vercel. Jangan membuat rules `allow read, write: if true`.

## 2. Buat Service Account

Firebase Console → Project Settings → Service accounts → **Generate new private key**.

Dari JSON hasil download, gunakan:

- `project_id` → `FIREBASE_PROJECT_ID`
- `client_email` → `FIREBASE_CLIENT_EMAIL`
- `private_key` → `FIREBASE_PRIVATE_KEY`

Jangan commit file JSON service account ke GitHub.

Di Vercel masukkan private key sebagai satu Environment Variable. Bentuk aman:

```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n....\n-----END PRIVATE KEY-----\n"
```

Kode server otomatis mengubah `\n` kembali menjadi baris baru.

## 3. Buat SESSION_SECRET

Di folder project jalankan:

```powershell
npm run firebase:secret
```

Hasil:

```text
SESSION_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Masukkan nilai tersebut ke Vercel sebagai `SESSION_SECRET`.

Ini **tidak mengganti GAS_BRIDGE_SECRET**. Setelah Firebase aktif, `GAS_BRIDGE_SECRET` justru tidak diperlukan lagi untuk produksi.

## 4. Environment Variables Vercel setelah Firebase aktif

Wajib:

```env
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
SESSION_SECRET=...
ADMIN_EMAIL=kastriva01@gmail.com
ADMIN_PASSWORD_SCRYPT=scrypt-v1$...$...
NEXT_PUBLIC_SITE_URL=https://kastriva-portfolio.vercel.app
```

Opsional:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Setelah migrasi selesai dan sudah diverifikasi, hapus dari Vercel production:

```env
GAS_API_URL
GAS_BRIDGE_SECRET
NEXT_PUBLIC_GAS_API_URL
```

## 5. Migrasikan data lama dari GAS / Spreadsheet

Agar CMS, portfolio, order, project, invoice, dan data lama tidak hilang, project menyediakan migrator satu kali.

Sebelum menjalankan migrator, buat `.env.local` di laptop berisi **Firebase service account** serta GAS lama:

```env
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

GAS_API_URL=https://script.google.com/macros/s/.../exec
GAS_BRIDGE_SECRET=SECRET_GAS_LAMA
ADMIN_EMAIL=kastriva01@gmail.com
```

Lalu jalankan:

```powershell
npm run firebase:migrate
```

Script membaca backend GAS lama melalui signed bridge lalu menyalin data ke Firestore. Script aman dijalankan ulang karena dokumen lama ditulis menggunakan ID yang sama.

Setelah muncul `DONE`, buka Firebase Console → Firestore dan pastikan collection seperti berikut sudah ada:

```text
siteContent
portfolio
orders
customers
projects
projectUpdates
quotations
invoices
revisions
handovers
services
settings
```

## 6. Customer OTP Email

Tahap 6 menggunakan collection Firestore bernama `mail` untuk email otomatis. Cara termudah adalah memasang Firebase Extension **Trigger Email**.

Setelah extension dipasang dan SMTP dikonfigurasi, email berikut dapat berjalan lagi:

- kode OTP Customer Login
- konfirmasi order
- quotation
- invoice
- update project
- revisi
- serah terima

Jika extension belum dipasang, fitur database tetap berjalan, tetapi email OTP/customer tidak akan terkirim. Karena Customer Login memakai OTP, pasang extension sebelum menggunakan portal customer secara produksi.

## 7. Deploy

Setelah Environment Variables disimpan:

```powershell
npm run build
```

Kemudian push ke GitHub dan deploy/redeploy di Vercel.

## 8. Tes setelah deploy

Urutan tes yang disarankan:

1. `/` tampil normal dan CMS terbaca.
2. Admin login.
3. Admin → Website CMS → ubah satu teks → Simpan → refresh halaman publik.
4. Buat order test.
5. Pastikan order muncul realtime setelah refresh Admin → Orders.
6. Buat quotation dan setujui dari Customer Dashboard.
7. Buat invoice.
8. Buat project/update.
9. Buat revisi.
10. Serah terima dan customer accept.

## Catatan kompatibilitas

`/api/gas` tetap tersedia sebagai endpoint kompatibilitas untuk PWA/browser cache lama, tetapi endpoint tersebut sekarang hanya meneruskan request ke backend Firebase. Backend produksi **tidak lagi memanggil Google Apps Script**.
