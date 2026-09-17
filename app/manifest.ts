import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kastriva - Jasa Website & Aplikasi",
    short_name: "Kastriva",
    description: "Portfolio, layanan, pemesanan, dan dashboard project Kastriva.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0A0A0F",
    theme_color: "#6C5CE7",
    categories: ["business", "productivity"],
    icons: [
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Mulai Project", short_name: "Order", url: "/order?source=pwa-shortcut" },
      { name: "Lihat Portfolio", short_name: "Portfolio", url: "/portfolio?source=pwa-shortcut" },
      { name: "Lacak Order", short_name: "Tracking", url: "/order/track?source=pwa-shortcut" },
    ],
  };
}
