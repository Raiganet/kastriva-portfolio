# Kastriva Portfolio

Professional Digital Service Platform.


## 🏗️ Phase 3: Architecture (Repository Pattern)

Website ini menggunakan **3-layer architecture** untuk maintainability dan scalability:

```
UI Components
    ↓
Service Layer (business logic)
    ↓
Repository Layer (data source)
    ↓
Data Source (Local Config / Google Apps Script)
```

### File Structure:
- `lib/api-client.ts` - HTTP client abstraction
- `lib/validators/` - Zod validation schemas
- `lib/repositories/` - Data source abstraction
- `lib/services/` - Business logic
- `lib/hooks/` - Custom React hooks
- `lib/analytics.ts` - Analytics tracking
- `components/ui/` - Reusable UI components (Loading, Empty, Error states)

### Swap to Google Apps Script:
Ketika backend GAS sudah siap (Phase 11), cukup ubah implementasi di `lib/repositories/` tanpa mengubah UI.


## 🔌 Phase 5: Google Apps Script Backend

Panduan lengkap ada di `google-apps-script/DEPLOYMENT.md`.

Ringkasan setup:
1. Buat project di script.google.com
2. Copy semua file .gs dari folder google-apps-script/
3. Jalankan setupDatabase() → copy SPREADSHEET_ID ke Config.gs
4. Deploy sebagai Web App (access: Anyone)
5. Copy Web App URL ke .env.local (NEXT_PUBLIC_GAS_API_URL)
6. Test: {URL}?action=health
