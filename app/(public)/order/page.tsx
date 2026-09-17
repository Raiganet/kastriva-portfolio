import type { Metadata } from "next";
import SmartOrderForm from "@/components/order/SmartOrderForm";
import { getSiteContent } from "@/lib/server/site-content.server";
import { pageMetadata } from "@/lib/seo-cms";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteContent();
  return pageMetadata(site, "order", "/order", "Mulai Project", `Mulai konsultasi dan order project bersama ${site.brand.name}.`);
}

export default function OrderPage() {
  return <div className="pt-32 pb-20"><SmartOrderForm /></div>;
}
