import type { Metadata } from "next";
import Portfolio from "@/components/Portfolio";
import { getSiteContent } from "@/lib/server/site-content.server";
import { pageMetadata } from "@/lib/seo-cms";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteContent();
  return pageMetadata(site, "portfolio", "/portfolio", site.portfolio.title, site.portfolio.subtitle);
}

export default function PortfolioPage() {
  return <div className="pt-32"><Portfolio /></div>;
}
