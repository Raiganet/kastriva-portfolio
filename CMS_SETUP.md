# Kastriva Portfolio CMS

CMS portfolio sekarang menggunakan Google Sheets sebagai sumber data sehingga project dapat ditambah/edit tanpa mengubah kode Next.js.

## 1. Update Google Apps Script

Di project Apps Script yang digunakan oleh `NEXT_PUBLIC_GAS_API_URL`, update file berikut:

- `google-apps-script/Router.gs`
- `google-apps-script/Portfolio.gs`

Fungsi CMS yang ditambahkan:

- `getPortfolioAdmin` — mengambil semua portfolio termasuk Draft/unpublished
- `createPortfolio` — tambah project
- `updatePortfolio` — edit project
- `deletePortfolio` — hapus project

`PortfolioImages` otomatis disinkronkan ketika project disimpan.

## 2. Deploy ulang GAS

Setelah paste/update script:

1. Save project Apps Script.
2. Pastikan Spreadsheet sudah memiliki sheet `Portfolio` dan `PortfolioImages`.
3. Deploy > Manage deployments.
4. Edit deployment Web app.
5. Pilih versi `New version`.
6. Execute as akun pemilik script.
7. Who has access harus sesuai kebutuhan API (umumnya Anyone untuk frontend publik).
8. Deploy.

Tidak perlu menjalankan fungsi khusus untuk setiap penambahan/edit portfolio. CMS akan menulis langsung ke Sheets.

## 3. CMS di website

Login sebagai Admin lalu buka:

`/admin/portfolio`

Di sana tersedia:

- Tambah project
- Edit project
- Hapus project
- Publish / Draft
- Featured / non-featured
- Live Demo URL
- GitHub URL
- Gambar utama
- Gallery images
- Teknologi, fitur, deskripsi, solusi, role, tahun, status, urutan
- Preview gambar sebelum disimpan

## 4. URL gambar

Versi ini menggunakan URL gambar agar sederhana dan tidak mengubah alur upload Drive yang sudah ada. Gunakan URL gambar publik HTTPS, misalnya dari Vercel Blob, Cloudinary, atau storage lain yang bisa diakses browser.

## 5. Frontend

Setelah GAS dideploy, deploy ulang Next.js/Vercel agar versi CMS dan redesign login aktif.

Pastikan environment:

`NEXT_PUBLIC_GAS_API_URL=<URL Web App GAS>`

Tetap sama seperti deployment sebelumnya.
