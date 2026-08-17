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
