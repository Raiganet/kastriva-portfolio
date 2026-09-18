# Pembaruan terbaru: Tahap 5 — Full Website CMS

**Mulai dari [PANDUAN-TAHAP-5.md](PANDUAN-TAHAP-5.md).** Paket ini sudah mencakup Tahap 1–4: keamanan/order reliability, workflow penawaran-invoice-revisi-serah terima, PWA/performa/SEO/analytics, dan sekarang CMS seluruh website. Jalankan `setupSiteCmsStage5()` satu kali lalu redeploy Google Apps Script.

# Pembaruan terbaru: keamanan tahap 1

**Mulai dari [PANDUAN-TAHAP-1.md](PANDUAN-TAHAP-1.md).** Frontend dan GAS wajib dipasang bersama. Login pelanggan memakai OTP email; admin memakai hash scrypt di environment server; sesi memakai cookie HttpOnly.

Panduan berikut merupakan dokumentasi fitur awal. Untuk konfigurasi autentikasi, environment, dan deployment, panduan tahap 1 menjadi acuan.

#  Kastriva — Professional Digital Service Platform

Website portfolio + sistem bisnis lengkap untuk jasa pembuatan website, web app,
sistem informasi, dan aplikasi Android.

## ✨ Fitur

### Public Website
- Landing page premium (dark/light mode, animasi halus)
- Portfolio engine: filter, search, detail page, lightbox gallery
- Order system: validasi Zod, honeypot anti-spam, nomor order unik (KAS-YYYY-NNNN)
- Order tracking publik dengan timeline visual
- FAQ + Testimonial (CMS-driven)
- Full Website CMS: Hero, layanan, harga, portfolio presentation, proses, testimonial, FAQ, tentang/tim, kontak/CTA, footer, dan SEO
- PWA + offline fallback + install prompt
- SEO: sitemap.xml, robots.txt, JSON-LD schema.org, OpenGraph
- Analytics GA4 + Core Web Vitals

### Backend (Google Apps Script + Google Sheets)
- Database Google Sheets dengan migrasi non-destructive per tahap, termasuk `SiteContent` untuk CMS
- API router dengan 3 tier auth: public / admin / customer
- Email otomatis: notifikasi admin, konfirmasi customer, update project, quotation
- Order → Customer auto-create → Project → Updates → Quotation

### Admin Dashboard (/admin)
- Login aman (token session server-side, expire 24 jam)
- Statistik dashboard real-time dari Sheets
- Order management (search, filter, ubah status)
- Project management (convert order, kirim update progress)
- Quotation builder (items, diskon, pajak, total server-side)
- Invoice, revisi, dan serah terima
- Full Website CMS + Portfolio CMS
- Customer management

### Customer Dashboard (/customer)
- Login dengan Email + kode OTP
- Pantau orders, projects + timeline progress
- Approve/reject quotation
- Pantau invoice, ajukan revisi, dan terima serah terima

## 🛠️ Tech Stack
Next.js 14 (App Router) • TypeScript • Tailwind CSS • Framer Motion •
Lucide React • next-themes • Zod • Google Apps Script • Google Sheets

## 📦 Instalasi

```bash
npm install
npm run dev
```

## ⚙️ Environment Variables

```
GAS_API_URL=https://script.google.com/macros/s/XXXX/exec
NEXT_PUBLIC_SITE_URL=https://domain-anda.com
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXX   # opsional
```

Set di `.env.local` DAN Vercel (Settings → Environment Variables).

## 🔌 Setup Google Apps Script

1. Buat project di [script.google.com](https://script.google.com)
2. Copy semua file `.gs` dari folder `google-apps-script/`
3. Jalankan `setupDatabase()` → copy SPREADSHEET_ID ke `Config.gs`
4. Ikuti konfigurasi rahasia dan hash password di `PANDUAN-TAHAP-1.md`
5. Deploy → Web app → Execute as: Me → Who has access: **Anyone**
6. Copy URL `/exec` ke env variable

## 🔐 Kredensial

- **Admin**: email dan password yang dikonfigurasi melalui setup keamanan server → login di `/admin`
- **Customer**: kode OTP yang dikirim ke email → login di `/customer`

## 🗂️ Struktur Data Layer

```
UI → Service → Repository → API Client → Google Apps Script → Sheets
```

Repository memiliki fallback ke `data/config.ts` jika GAS belum dikonfigurasi,
sehingga website tidak pernah blank.

## 📄 Route Map

| Route | Fungsi |
|---|---|
| `/` | Homepage |
| `/portfolio`, `/portfolio/[slug]` | Portfolio + detail |
| `/order` | Form order |
| `/order/track` | Lacak order |
| `/order/success` | Konfirmasi order |
| `/services`, `/process`, `/about`, `/contact` | Halaman statis |
| `/admin` | Admin dashboard (protected) |
| `/admin/cms` | Full Website CMS (protected) |
| `/customer` | Customer dashboard (protected) |

## 🚀 Deployment (Vercel)

1. Push ke GitHub
2. Import project di Vercel
3. Set environment variables
4. Deploy

## 📝 Mengelola Konten

- **Website CMS (`/admin/cms`)**: brand, navbar, Hero, statistik, layanan, harga, tampilan portfolio, proses, testimonial, FAQ, Tentang/Tim, Kontak/CTA, Footer, dan SEO.
- **Portfolio CMS (`/admin/portfolio`)**: item project, kategori, gambar, detail, demo URL, dan featured.
- `data/config.ts` / `data/content.ts` sekarang berfungsi sebagai **fallback lokal**, bukan tempat utama mengubah konten website.

---

© 2026 Kastriva. All rights reserved.

## Project portfolio lokal

Tujuh project selesai disimpan di `data/projects.ts`. Ubah judul, deskripsi, dan `demoUrl` di sana. Thumbnail menggunakan screenshot di `public/portfolio/`, dengan nama file yang harus sama persis (termasuk huruf besar, spasi, dan ekstensi). Tahun, teknologi, dan studi kasus yang belum dikonfirmasi dibiarkan kosong.

Daftar publik menggabungkan project CMS dengan project lokal. Entri CMS diprioritaskan jika ID, slug judul, atau URL demo sama (garis miring terakhir diabaikan). Entri CMS yang tidak dipublikasikan menyembunyikan padanan lokalnya. Kategori, halaman detail, project unggulan, dan sitemap memakai repository yang sama.

Thumbnail tujuh project dikenal mengikuti `data/projects.ts` meskipun entri berasal dari CMS. Project contoh Sistem Manajemen Inventaris dipetakan menjadi Kastriva-Smart Kasir pada tampilan publik; dokumen CMS asli tidak diubah. Aturan ini berada di `lib/repositories/portfolio-merge.ts` dan dipakai bersama oleh browser dan server.
