# Perbaikan Portfolio → Form Order

Perubahan ini membenahi hubungan antara data portfolio (termasuk data dari CMS/Google Sheets) dan form order utama (`SmartOrderForm`).

## Yang diperbaiki

- Tombol **Buat Project Serupa** tersedia di kartu portfolio, project unggulan, dan halaman detail.
- Klik dari portfolio membawa `portfolioId` menuju `/order`.
- Form order memuat detail portfolio dari repository/GAS, bukan hanya data statis `config.portfolio`.
- Kategori CMS yang bebas otomatis dipetakan ke tipe order yang valid (`Website`, `Web App`, `Sistem Informasi`, dan lainnya).
- `portfolioId`, `portfolioTitle`, dan `serviceId` tidak lagi dibuang oleh validator frontend.
- Referensi portfolio tersimpan ke order dan ikut muncul pada pesan WhatsApp.
- Admin dapat melihat nama portfolio referensi langsung pada tabel **Admin → Orders**.
- Draft order lama tetap aman; data kontak/budget tidak dihapus saat referensi portfolio dimuat.

## Catatan GAS / Spreadsheet

Struktur GAS yang ada di project ini sudah mendukung kolom `serviceId`, `portfolioId`, dan `portfolioTitle`, jadi tidak diperlukan penambahan kolom baru apabila versi GAS produksi sudah mengikuti struktur `SetupDatabase.gs` / tahap reliability yang ada pada project ini.
