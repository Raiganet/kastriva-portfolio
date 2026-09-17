# Kastriva Portfolio — Tahap 4
## PWA, Performa, SEO, Analytics & Penyempurnaan Tampilan

Tahap ini tidak mengubah struktur Google Sheet/GAS dan tidak memerlukan migrasi database baru.

## 1. PWA
Perubahan:
- Manifest dipindahkan ke `app/manifest.ts` agar dikelola oleh Next.js.
- Service worker baru di `public/sw.js`.
- Offline fallback di `/offline`.
- Cache untuk asset statis dan halaman publik yang pernah dikunjungi.
- Area sensitif (`/admin`, `/customer`, `/api`, `/login`) tidak dicache oleh service worker.
- Tombol **Instal App** muncul otomatis saat browser mengizinkan instalasi PWA.
- Shortcut PWA: Mulai Project, Portfolio, dan Lacak Order.
- Icon maskable baru: `public/maskable-icon-512x512.png`.

Catatan pengujian PWA:
1. Deploy ke HTTPS (Vercel otomatis HTTPS).
2. Buka website dari Chrome Android/desktop.
3. Refresh sekali setelah deployment agar service worker terdaftar.
4. Cek DevTools → Application → Manifest dan Service Workers.
5. Coba buka beberapa halaman publik, matikan internet, lalu buka kembali halaman yang pernah dikunjungi.

Service worker hanya diregistrasikan saat `NODE_ENV=production`, jadi gunakan `npm run build && npm start` atau deployment Vercel untuk menguji PWA secara penuh.

## 2. Analytics / GA4
Tambahkan Environment Variable di Vercel:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SITE_URL=https://domain-anda.com
```

Setelah mengubah environment variable, lakukan redeploy.

Event yang dikirim:
- `page_view`
- `portfolio_view`
- `portfolio_demo_click`
- `portfolio_order_click`
- `order_started`
- `order_submitted`
- `whatsapp_click`
- `pwa_install_prompt`
- `pwa_installed`
- `web_vital`

`web_vital` disampling 25% agar jumlah event tidak berlebihan. Metric berisi nama metric, nilai, ID, dan rating Core Web Vitals.

## 3. SEO
Perubahan:
- Canonical URL untuk halaman publik utama.
- Open Graph dan Twitter metadata yang konsisten.
- Dynamic Open Graph image 1200×630 di `app/opengraph-image.tsx`.
- Structured data Schema.org untuk Organization, WebSite, ProfessionalService, dan halaman detail portfolio.
- `robots.txt` tidak mengindeks admin, customer dashboard, API, login, tracking order, success page, dan offline page.
- Sitemap tetap tersedia walaupun CMS/GAS portfolio sementara gagal diakses.
- Portfolio detail memiliki canonical dan metadata gambar sendiri.

Sesudah domain production aktif, daftarkan:
- `https://domain-anda.com/sitemap.xml` ke Google Search Console.
- Pastikan `NEXT_PUBLIC_SITE_URL` menggunakan domain final, bukan preview URL Vercel.

## 4. Performa
Perubahan:
- Next.js compression aktif.
- Header `X-Powered-By` dimatikan.
- Next Image menggunakan AVIF/WebP jika didukung.
- Cache TTL gambar ditingkatkan.
- Asset statis mendapat cache browser jangka panjang.
- Logo navbar memakai `next/image` dan diberi priority.
- Bagian homepage di bawah fold memakai `content-visibility: auto` untuk mengurangi initial rendering cost.
- Core Web Vitals dapat dikirim ke GA4.
- Animasi menghormati `prefers-reduced-motion`.

## 5. Penyempurnaan UI/UX
Perubahan global:
- Focus ring keyboard yang jelas.
- Skip-to-content untuk aksesibilitas.
- Selection color konsisten dengan brand.
- Utility premium `surface-card`, `btn-primary`, `btn-secondary`, `section-kicker`, dan `bg-mesh`.
- Halaman offline menggunakan tampilan premium dan responsif.
- Tombol Hero sekarang menuju `/order` dan `/portfolio`; sebelumnya menggunakan anchor yang tidak selalu memiliki section tujuan pada homepage.
- Install App terintegrasi ke navbar desktop dan mobile.

## 6. Deployment Checklist
1. Push source Tahap 4 ke GitHub.
2. Pastikan Vercel memiliki `NEXT_PUBLIC_SITE_URL` sesuai domain production.
3. Opsional: isi `NEXT_PUBLIC_GA_MEASUREMENT_ID` untuk GA4.
4. Redeploy Vercel.
5. Hard refresh browser sekali setelah deployment.
6. DevTools → Application → cek Manifest + Service Worker.
7. DevTools → Lighthouse → jalankan Performance, Accessibility, Best Practices, SEO, dan PWA/Installability jika tersedia.
8. Test desktop + Android:
   - install app,
   - offline fallback,
   - portfolio,
   - order,
   - login customer/admin,
   - dashboard,
   - workflow Tahap 3.
9. Test GA4 Realtime setelah klik Portfolio, WhatsApp, dan submit order.
10. Submit `/sitemap.xml` ke Search Console.

## Tidak Ada Perubahan GAS
Tahap 4 fokus frontend/infrastruktur web. Tidak ada fungsi setup Spreadsheet baru dan tidak perlu menjalankan migrasi GAS tambahan.
