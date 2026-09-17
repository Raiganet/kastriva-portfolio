# Kastriva Portfolio — Tahap 5: Full Website CMS

Tahap 5 mengubah konten website publik menjadi **CMS-driven**. Admin dapat memperbarui konten dari **Admin → Website CMS** tanpa mengedit source code dan tanpa deploy ulang Vercel untuk perubahan konten biasa.

## 1. Yang sekarang dapat dikelola dari CMS

### Umum
- Nama brand dan tagline
- WhatsApp, email, alamat/area layanan
- Instagram, TikTok, GitHub, website, YouTube
- Menu navbar: label + URL
- Label Lacak Order dan Mulai Project

### Beranda
- Hero: tampil/sembunyi, eyebrow, headline, subheadline, CTA dan badge
- Statistik
- Judul Project Unggulan
- Keunggulan
- Preview Cara Kerja pada section keunggulan

### Layanan & Harga
- Tampil/sembunyi section
- Judul dan subjudul
- Tambah/hapus/edit layanan
- Icon, deskripsi, fitur, harga mulai, durasi, status aktif
- Paket harga dan paket yang disorot

### Portfolio
**Website CMS → Portfolio** mengatur tampilan section:
- Judul dan subjudul
- Placeholder pencarian
- Empty state
- Label Featured, Live Demo, Detail, Reset, Buat Project Serupa, Kembali dan Fullscreen

**Admin → Portfolio CMS** tetap digunakan untuk item project:
- Judul project
- Kategori
- Gambar / galeri
- Deskripsi/detail project
- Demo URL
- Featured dan data project lainnya

Pemisahan ini disengaja agar pengelolaan tampilan website dan data project tetap rapi.

### Cara Kerja
- Tampil/sembunyi
- Judul, subjudul
- Tahapan proses dan deskripsinya

### Testimonial
- Tampil/sembunyi
- Judul/subjudul/empty state
- Tambah/hapus testimonial
- Nama, bisnis/instansi, isi, rating
- Publish/unpublish

### FAQ
- Tampil/sembunyi
- Eyebrow, judul, subjudul
- Tambah/hapus pertanyaan
- Publish/unpublish

### Tentang & Tim
- Judul, lead, paragraf Tentang
- Prinsip kerja
- Section tim/profil opsional
- Nama, peran, bio, URL foto, skill, status aktif

### Kontak & CTA
- Judul/subjudul halaman kontak
- Judul dan deskripsi kartu WhatsApp, Email, Instagram dan GitHub
- CTA global: tampil/sembunyi, judul, subjudul, tombol dan link

### Footer
- Deskripsi brand
- Copyright (`{year}` otomatis menjadi tahun berjalan)
- Judul kolom navigasi/akun
- Tampilkan/sembunyikan login customer dan admin
- Kontak, alamat dan social link mengambil data Identitas Brand

### SEO
- Site title
- Template title (`%s` untuk judul halaman)
- Meta description global
- Keywords
- Area layanan
- Price range
- Title + description per halaman

Metadata halaman publik, manifest PWA, structured data, Navbar/Footer, dan konten section utama sekarang membaca CMS dengan fallback aman.

---

## 2. Update Google Apps Script

Salin/replace seluruh file terbaru pada folder:

`google-apps-script/`

Pastikan file berikut ikut diperbarui:
- `Cms.gs`
- `Router.gs`
- `SetupSiteCmsStage5.gs`
- file GAS lain dari project terbaru tetap dipertahankan

Jangan hanya menyalin satu file karena Router dan sistem keamanan saling berhubungan.

---

## 3. Jalankan migrasi sekali

Di Apps Script Editor, pilih fungsi:

```text
setupSiteCmsStage5
```

Lalu klik **Run** satu kali.

Migrasi ini bersifat **non-destructive**:
- Tidak menghapus Orders
- Tidak menghapus Customers
- Tidak menghapus Projects
- Tidak menghapus Portfolio
- Tidak menghapus Quotation/Invoice/Revisi/Serah Terima
- Membuat sheet `SiteContent` jika belum ada
- Tidak menimpa section CMS yang sudah pernah tersimpan
- Brand/Hero lama dari Settings dipakai sebagai seed awal bila tersedia

Setelah berhasil, sheet baru memiliki struktur:

| section | content | updatedAt |
|---|---|---|
| brand | JSON | waktu update |
| hero | JSON | waktu update |
| ... | ... | ... |

Jangan edit JSON `SiteContent` secara manual kecuali benar-benar memahami formatnya. Gunakan menu Website CMS.

---

## 4. Deploy ulang GAS

Setelah seluruh file GAS terbaru dimasukkan dan migrasi selesai:

1. **Deploy → Manage deployments**
2. Pilih Web App yang sudah ada
3. Klik **Edit**
4. Pilih **New version**
5. Deploy

Jika deployment URL tetap sama, environment variable Vercel tidak perlu diganti.

---

## 5. Deploy Next.js / Vercel

Push source Tahap 5 ke GitHub seperti biasa. Pastikan environment variable Tahap sebelumnya tetap ada, terutama konfigurasi GAS/server gateway, site URL, admin dan analytics yang sudah digunakan project.

Tahap 5 tidak mengharuskan environment variable CMS baru.

---

## 6. Cara menggunakan CMS

1. Login Admin
2. Buka **Website CMS**
3. Pilih tab yang akan diedit
4. Ubah konten
5. Klik **Simpan Perubahan**
6. Klik **Preview Website** untuk memeriksa hasil

Setelah save, cache `site-content` di Next.js akan di-invalidate. Jika invalidasi tidak dapat dijalankan karena gangguan sementara, cache juga memiliki revalidasi otomatis sekitar 60 detik.

---

## 7. Fallback keamanan konten

Frontend menyimpan default content lokal sebagai fallback. Artinya:
- Jika GAS sedang offline, website masih bisa menampilkan konten default.
- Jika section CMS lama belum memiliki field baru, field yang hilang otomatis mengambil nilai default.
- Field/section asing dari server tidak otomatis dimasukkan ke struktur frontend.

Write CMS hanya tersedia untuk sesi **Admin** melalui same-origin gateway. Browser tidak menerima token admin GAS.

URL yang disimpan melalui CMS juga disanitasi. Untuk field URL, gunakan:
- path internal seperti `/portfolio`
- `https://...`
- `#` untuk menyembunyikan social link yang belum digunakan

---

## 8. Hal penting tentang Portfolio

Jangan bingung dengan dua menu berikut:

**Website CMS → Portfolio**  
Untuk teks/tampilan halaman portfolio.

**Portfolio CMS**  
Untuk data project nyata, gambar, kategori, detail dan demo.

Keduanya bekerja bersamaan di halaman `/portfolio` dan halaman detail project.

---

## 9. Validasi Tahap 5

Pada source Tahap 5 ini dilakukan pemeriksaan:
- Test keamanan/reliabilitas project
- Test khusus CMS
- Parser seluruh file TypeScript/TSX
- Syntax seluruh file Google Apps Script
- Proteksi write CMS sebagai admin action
- Sanitasi URL/kontak CMS
- Same-origin cache invalidation

Full `next build` tidak dijadikan satu-satunya validasi pada environment pengerjaan karena instalasi dependency penuh sempat terputus. Jalankan `npm ci && npm run build` pada mesin lokal/Vercel sebagai pemeriksaan build produksi akhir.

---

## 10. Workflow akhir website

Setelah Tahap 5, struktur pengelolaannya menjadi:

```text
Admin
├── Website CMS
│   ├── Umum / Brand / Navbar
│   ├── Beranda
│   ├── Layanan & Harga
│   ├── Portfolio (tampilan)
│   ├── Cara Kerja
│   ├── Testimonial
│   ├── FAQ
│   ├── Tentang & Tim
│   ├── Kontak & CTA
│   ├── Footer
│   └── SEO
│
├── Portfolio CMS
│   └── Item project / gambar / detail / demo
│
├── Orders
├── Penawaran
├── Invoices
├── Projects
├── Revisi
└── Serah Terima
```

Dengan ini konten marketing utama website tidak lagi harus diubah melalui `config.ts` atau komponen React.
