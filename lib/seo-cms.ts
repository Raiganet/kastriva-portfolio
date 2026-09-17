import type { Metadata } from "next";
import type { SiteContent } from "@/lib/types/site-content";

export function pageMetadata(site: SiteContent, page: string, path: string, fallbackTitle: string, fallbackDescription: string): Metadata {
  const item = site.seo.pages?.[page];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kastriva-portfolio.vercel.app";
  const title = item?.title || fallbackTitle;
  const description = item?.description || fallbackDescription;
  const canonical = new URL(path || "/", siteUrl).toString();
  return {
    title,
    description,
    keywords: site.seo.keywords,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website", locale: "id_ID", siteName: site.brand.name },
    twitter: { card: "summary_large_image", title, description },
  };
}
