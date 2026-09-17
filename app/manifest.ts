import type { MetadataRoute } from "next";
import { getSiteContent } from "@/lib/server/site-content.server";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const site = await getSiteContent();
  return {
    name: `${site.brand.name} - Jasa Website & Aplikasi`,
    short_name: site.brand.name,
    description: site.seo.description,
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
      { name: site.navigation.startProjectLabel, short_name: "Order", url: "/order?source=pwa-shortcut" },
      { name: site.portfolio.title, short_name: "Portfolio", url: "/portfolio?source=pwa-shortcut" },
      { name: site.navigation.trackOrderLabel, short_name: "Tracking", url: "/order/track?source=pwa-shortcut" },
    ],
  };
}
