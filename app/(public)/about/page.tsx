import type { Metadata } from "next";
import { getSiteContent } from "@/lib/server/site-content.server";
import { pageMetadata } from "@/lib/seo-cms";
import AboutContent from "@/components/sections/AboutContent";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteContent();
  return pageMetadata(site, "about", "/about", site.about.title, site.about.lead);
}

export default async function AboutPage() {
  const site = await getSiteContent();
  return <AboutContent site={site} />;
}
