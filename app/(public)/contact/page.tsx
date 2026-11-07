import type { Metadata } from "next";
import { getSiteContent } from "@/lib/server/site-content.server";
import { pageMetadata } from "@/lib/seo-cms";
import ContactContent from "@/components/sections/ContactContent";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteContent();
  return pageMetadata(site, "contact", "/contact", site.contact.title, site.contact.subtitle);
}

export default async function ContactPage() {
  const site = await getSiteContent();
  return <ContactContent site={site} />;
}
