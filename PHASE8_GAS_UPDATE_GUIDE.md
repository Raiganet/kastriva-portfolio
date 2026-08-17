# 🚀 Phase 8: Update Google Apps Script

## 1️⃣ Buat file baru: Stats.gs

1. Di Apps Script editor, klik **+** → **Script**
2. Beri nama: **Stats**
3. Copy seluruh isi file `google-apps-script/Stats.gs` (dari project lokal Anda)
4. Save (Ctrl+S)

## 2️⃣ Update Router.gs (2 perubahan kecil)

**A. Tambahkan ke array `protectedActions`:**

```javascript
'getDashboardStats',   // <-- tambahkan di daftar protectedActions
```

**B. Tambahkan case baru di switch (bagian PROTECTED):**

```javascript
case 'getDashboardStats':
  return Stats.getDashboard();
```

## 3️⃣ Deploy New Version

Deploy → Manage deployments → ✏️ Edit → Version: **New version** → Deploy

## 4️⃣ (PENTING) Ganti Password Admin

Buka **Config.gs**, ganti:

```javascript
ADMIN_PASSWORD: 'change-this-password',
```

menjadi password kuat pilihan Anda. Save + deploy new version lagi.

## Kredensial Default

- Email: `admin@kastriva.com` (ubah ADMIN_EMAIL jika perlu)
- Password: sesuai Config.gs
