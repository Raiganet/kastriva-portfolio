> Pembaruan keamanan: ikuti `PANDUAN-TAHAP-1.md` di root proyek untuk deployment dan login. Jangan menggunakan kembali konfigurasi autentikasi atau endpoint publik dari panduan lama di bawah ini.

# 🚀 Phase 10: Update Google Apps Script

## File BARU (buat di Apps Script):
1. **CustomerAuth.gs** ← copy dari google-apps-script/CustomerAuth.gs
2. **Quotations.gs** ← copy dari google-apps-script/Quotations.gs
3. **CustomerPortal.gs** ← copy dari google-apps-script/CustomerPortal.gs

## File REPLACE (ganti seluruh isi):
4. **Router.gs** ← copy dari google-apps-script/Router.gs (versi v3)

## Deploy → New version

## Test Flow Quotation Lengkap:
1. Admin → Quotations → Buat Quotation → pilih order → isi items → kirim
2. Cek email customer → ada penawaran + total
3. Buka /customer/login → login (email customer + nomor order)
4. Dashboard customer → quotation muncul → klik "Setujui Penawaran"
5. Cek email admin → notifikasi "DISETUJUI"
6. Admin → Orders → status order otomatis "Approved" ✅
