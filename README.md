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
- FAQ + Testimonial (data-driven, placeholder jujur)
- SEO: sitemap.xml, robots.txt, JSON-LD schema.org, OpenGraph

### Backend (Google Apps Script + Google Sheets)
- 18 sheet database (setup otomatis via setupDatabase())
- API router dengan 3 tier auth: public / admin / customer
- Email otomatis: notifikasi admin, konfirmasi customer, update project, quotation
- Order → Customer auto-create → Project → Updates → Quotation

### Admin Dashboard (/admin)
- Login aman (token session server-side, expire 24 jam)
- Statistik dashboard real-time dari Sheets
- Order management (search, filter, ubah status)
- Project management (convert order, kirim update progress)
- Quotation builder (items, diskon, pajak, total server-side)
- Customer management

### Customer Dashboard (/customer)
- Login dengan Email + kode OTP
- Pantau orders, projects + timeline progress
- Approve/reject quotation

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
| `/customer` | Customer dashboard (protected) |

## 🚀 Deployment (Vercel)

1. Push ke GitHub
2. Import project di Vercel
3. Set environment variables
4. Deploy

## 📝 Mengelola Konten

- **Portfolio/Services/Pricing/FAQ**: edit `data/config.ts` & `data/content.ts`
  (atau langsung di Google Sheets untuk portfolio setelah GAS aktif)
- **Brand/WhatsApp/Social**: `data/config.ts` + sheet Settings

---

© 2026 Kastriva. All rights reserved.

## Project portfolio lokal

Lima project selesai disimpan di `data/projects.ts`. Ubah judul, deskripsi, dan `demoUrl` di sana. Gambar saat ini memakai logo Kastriva; ganti `image` dengan screenshot di `public/portfolio/` bila tersedia. Tahun, teknologi, dan studi kasus yang belum dikonfirmasi dibiarkan kosong.

Daftar publik menggabungkan project CMS dengan project lokal. Entri CMS diprioritaskan jika ID, slug judul, atau URL demo sama (garis miring terakhir diabaikan). Entri CMS yang tidak dipublikasikan menyembunyikan padanan lokalnya. Kategori, halaman detail, project unggulan, dan sitemap memakai repository yang sama.
