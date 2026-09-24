# Perbaikan Responsive Admin Mobile

Perubahan utama:

- Topbar admin mobile disederhanakan menjadi logo/nama halaman + tombol menu.
- Navigasi admin mobile dipindahkan ke drawer dengan label lengkap dan area scroll sendiri.
- Target sentuh menu/tombol dibuat minimal sekitar 44–48 px.
- Halaman Website CMS memakai dropdown pemilih bagian pada layar kecil agar tidak perlu menggeser tab panjang.
- Tombol Preview Website dan Muat Ulang menjadi full-width pada mobile.
- Input CMS memakai ukuran teks mobile yang mencegah auto-zoom pada browser tertentu.
- Tombol Simpan Perubahan menjadi sticky/full-width di bawah layar pada mobile, termasuk safe-area.
- Wrapper admin mencegah horizontal overflow.
- Referensi thumbnail Kastriva-Katalog diperbaiki ke file PNG yang benar-benar tersedia.
- Ditambahkan regression test `tests/admin-mobile-responsive.test.cjs`.

## Uji cepat

```bash
npm install
npm run dev
```

Buka `/admin/cms` pada lebar 320–430 px dan cek:

1. Topbar tidak lagi penuh ikon.
2. Tombol menu membuka drawer admin.
3. Drawer dapat di-scroll dan Logout tetap mudah dijangkau.
4. Dropdown `Bagian CMS` bisa berpindah Umum/Beranda/Layanan/dll.
5. Form tidak melebar keluar layar.
6. Tombol `Simpan Perubahan` selalu mudah dijangkau di bagian bawah.

> Jangan commit `.env.local`. File hasil perbaikan sengaja tidak menyertakan `.env.local`, `.git`, `.next`, dan folder backup lokal.
