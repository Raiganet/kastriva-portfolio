# 🚀 Phase 9: Update Google Apps Script

## 1️⃣ Buat file baru: Projects.gs

1. Apps Script editor → **+** → **Script** → nama: **Projects**
2. Copy seluruh isi `google-apps-script/Projects.gs`
3. Save

## 2️⃣ Update Router.gs (2 baris)

**A. Tambahkan ke `protectedActions`:**
```javascript
'createProject',   // <-- tambahkan
```

**B. Tambahkan case di switch (bagian PROTECTED: PROJECTS):**
```javascript
case 'createProject':
  return Projects.create(body);
```

## 3️⃣ Deploy → New version

## 4️⃣ Test Flow Lengkap

1. Login ke /admin
2. Menu **Projects** → pilih order di "Convert Order → Project" → **Mulai Project**
3. Klik project → **Kirim Update** (judul + progress 30%)
4. Cek: timeline muncul, progress bar berubah
5. Cek email customer → ada email update
6. Buka /order/track (sebagai customer) → progress 30% terlihat!
