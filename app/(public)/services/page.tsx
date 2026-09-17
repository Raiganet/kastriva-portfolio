import type { Metadata } from "next";
import ServicesSection from "@/components/sections/ServicesSection";
import FinalCTA from "@/components/sections/FinalCTA";
import { getSiteContent } from "@/lib/server/site-content.server";
import { pageMetadata } from "@/lib/seo-cms";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteContent();
  return pageMetadata(site, "services", "/services", "Layanan Pembuatan Website & Aplikasi", site.services.subtitle);
}

export default function ServicesPage() {
  return <div className="pt-32"><ServicesSection /><FinalCTA /></div>;
}
