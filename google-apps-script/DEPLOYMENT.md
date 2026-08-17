# 🚀 Google Apps Script Deployment Guide

## Step 1: Setup Google Apps Script Project

1. Buka [script.google.com](https://script.google.com)
2. Klik **"New Project"**
3. Ganti nama project menjadi **"Kastriva API"**

## Step 2: Copy Files

Copy SEMUA file `.gs` dari folder `google-apps-script/` ke Apps Script editor:

- `Code.gs` (replace default code)
- `Config.gs` (create new file)
- `Router.gs` (create new file)
- `Auth.gs` (create new file)
- `Utils.gs` (create new file)
- `Portfolio.gs` (create new file)
- `Orders.gs` (create new file)
- `Services.gs` (create new file)
- `Settings.gs` (create new file)
- `Customers.gs` (create new file)
- `SetupDatabase.gs` (create new file)

**Cara copy:**
1. Di Apps Script editor, klik **"+"** → **"Script"**
2. Beri nama file (tanpa .gs, otomatis ditambahkan)
3. Copy-paste isi file dari folder `google-apps-script/`
4. Save (Ctrl+S)

## Step 3: Setup Database

1. Di Apps Script editor, pilih function **`setupDatabase`** dari dropdown
2. Klik **"Run"**
3. Klik **"Review Permissions"** → Pilih akun Google → **"Allow"**
4. Tunggu proses selesai, lalu lihat **Execution log** di panel bawah
5. Copy **SPREADSHEET_ID** yang muncul di log
6. Buka file **Config.gs**, paste ID ke `Config.SPREADSHEET_ID`
7. Save (Ctrl+S)

## Step 4: Deploy Web App

1. Klik **"Deploy"** → **"New deployment"**
2. Klik icon gear ⚙️ → pilih **"Web app"**
3. Isi form:
   - **Description**: Kastriva API v1
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Klik **"Deploy"**
5. Authorize permissions → pilih akun → **"Allow"**
6. Copy **Web app URL** (format: `https://script.google.com/macros/s/XXXX/exec`)

## Step 5: Hubungkan ke Frontend Next.js

1. Buat / edit file `.env.local` di root project
2. Isi dengan URL web app Anda:

```
NEXT_PUBLIC_GAS_API_URL=https://script.google.com/macros/s/XXXX/exec
```

3. Restart dev server (`npm run dev`)

## Step 6: Test API di Browser

Buka URL berikut (ganti {URL} dengan web app URL Anda):

- Health: `{URL}?action=health`
- Portfolio: `{URL}?action=getPortfolio`
- Categories: `{URL}?action=getPortfolioCategories`
- Services: `{URL}?action=getServices`
- Settings: `{URL}?action=getSettings`

Jika muncul JSON `{"success":true,...}` berarti API sudah AKTIF ✅

## Step 7: Test Create Order (POST)

Buka Console browser (F12) di tab manapun, paste:

```js
fetch("https://script.google.com/macros/s/XXXX/exec", {
  method: "POST",
  headers: { "Content-Type": "text/plain;charset=utf-8" },
  body: JSON.stringify({
    action: "createOrder",
    name: "Test User",
    email: "test@email.com",
    whatsapp: "081234567890",
    type: "Website",
    description: "Test order dari API client Kastriva"
  })
}).then(r => r.json()).then(console.log)
```

Expected: `{"success":true,"data":{"orderNumber":"KAS-2026-0001",...}}`

Cek Google Sheets → sheet **Orders** → baris baru muncul ✅
Cek Gmail admin → email notifikasi order baru ✅

## Troubleshooting

| Masalah | Solusi |
|---|---|
| "SPREADSHEET_ID not configured" | Paste ID spreadsheet ke Config.gs |
| Permission error | Run function testAPI sekali untuk authorize |
| CORS error saat POST | Gunakan Content-Type text/plain (hindari preflight) |
| Data tidak muncul | Pastikan setupDatabase() sudah dijalankan |

## Catatan Keamanan

- Ganti `ADMIN_PASSWORD` di Config.gs sebelum production
- Endpoint publik terbuka, endpoint admin dilindungi token session
- Session disimpan server-side (PropertiesService), bukan di frontend
