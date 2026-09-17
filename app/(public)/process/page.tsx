import type { Metadata } from "next";
import ProcessSection from "@/components/sections/ProcessSection";
import FinalCTA from "@/components/sections/FinalCTA";
import { getSiteContent } from "@/lib/server/site-content.server";
import { pageMetadata } from "@/lib/seo-cms";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteContent();
  return pageMetadata(site, "process", "/process", site.process.title, site.process.subtitle);
}

export default function ProcessPage() {
  return <div className="pt-32"><ProcessSection /><FinalCTA /></div>;
}
