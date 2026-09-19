# Kastriva Brand System

The Kastriva Portfolio project uses one canonical logo identity. Do not redesign the symbol per page; only switch the official contrast variant.

## Canonical assets

- `public/brand/kastriva-logo-on-dark.png` — horizontal logo for dark/navy backgrounds.
- `public/brand/kastriva-logo-on-light.png` — horizontal logo for white/light backgrounds.
- `public/brand/kastriva-mark.png` — icon-only brand mark for compact UI.
- `public/brand/kastriva-mark-white.png` — monochrome mark for dark backgrounds.
- `public/brand/kastriva-mark-dark.png` — monochrome mark for light backgrounds.
- `public/brand/kastriva-app-icon-round.png` — round app/social icon.
- `public/brand/kastriva-app-icon-square.png` — rounded-square app icon.
- `public/brand/kastriva-app-icon-maskable.png` — PWA maskable icon.
- `public/brand/kastriva-brand-system.png` — visual reference board.

## UI usage

Use `components/BrandLogo.tsx` for horizontal logos. `surface="dark"` selects the white-wordmark version, `surface="light"` selects the navy-wordmark version, and `surface="auto"` follows light/dark theme.

PWA, favicon, Apple touch, admin/customer compact icons all use the same K-shaped brand mark so the identity remains consistent everywhere.
