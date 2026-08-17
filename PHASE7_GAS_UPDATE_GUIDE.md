# 🚀 Phase 7: Update Google Apps Script

## File Baru yang Perlu Ditambahkan ke Apps Script

### 1️⃣ Tambahkan endpoint baru ke Router.gs

Buka file **Router.gs** di Apps Script, lalu:

**A. Tambahkan ke array publicActions:**
\`\`\`javascript
const publicActions = [
  'getPortfolio',
  'getPortfolioBySlug',
  'getPortfolioCategories',
  'getServices',
  'getSettings',
  'createOrder',
  'getOrderByNumber',  // <-- TAMBAHKAN INI
  'health'
];
\`\`\`

**B. Tambahkan case baru di switch:**
\`\`\`javascript
case 'getOrderByNumber':
  return Orders.getByOrderNumber(params.orderNumber);
\`\`\`

### 2️⃣ Tambahkan 2 function baru ke Orders.gs

Buka file **Orders.gs**, scroll ke paling bawah, lalu paste:

\`\`\`javascript
// Copy isi file google-apps-script/OrdersEnhancements.gs ke sini
// (berisi: Orders.getByOrderNumber dan Orders.sendConfirmationEmail)
\`\`\`

### 3️⃣ Kirim email konfirmasi setelah order dibuat

Di file **Orders.gs**, cari function **Orders.create**, temukan baris:

\`\`\`javascript
sheet.appendRow([...]);
\`\`\`

**TAMBAHKAN** baris ini **setelahnya**:

\`\`\`javascript
// Kirim email konfirmasi ke customer
Orders.sendConfirmationEmail(orderNumber, data);
\`\`\`

### 4️⃣ Save & Test

1. **Save** (Ctrl+S)
2. **Deploy** → **Manage deployments** → Edit (pencil icon) → **Version: New version** → **Deploy**
3. Test endpoint baru di browser:

\`\`\`
{URL}?action=getOrderByNumber&orderNumber=KAS-2026-0001
\`\`\`

Jika ada order dengan nomor tersebut, akan muncul detail lengkap ✅

## Checklist Frontend

Setelah GAS diupdate:

1. Jalankan `node phase7-setup.js`
2. `npm run dev` (test di local)
3. Test submit order → harus redirect ke `/order/success`
4. Test lacak order di `/order/track`
5. Commit & push: `git add . && git commit -m "Phase 7: Order System End-to-End" && git push`
