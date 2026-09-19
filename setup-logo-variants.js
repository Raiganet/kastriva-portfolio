const fs = require("fs");

const required = [
  "public/brand/kastriva-logo-on-dark.png",
  "public/brand/kastriva-logo-on-light.png",
  "public/brand/kastriva-mark.png",
  "public/android-chrome-192x192.png",
  "public/android-chrome-512x512.png",
  "public/maskable-icon-512x512.png",
];

console.log("\nKastriva Brand System check\n");
let ok = true;
for (const file of required) {
  if (fs.existsSync(file)) console.log(`OK  ${file}`);
  else { console.log(`MISSING  ${file}`); ok = false; }
}

console.log(
  ok
    ? "\nBrand assets are ready. UI integration is handled by components/BrandLogo.tsx.\n"
    : "\nOne or more brand assets are missing. Restore them from public/brand.\n"
);
process.exit(ok ? 0 : 1);
