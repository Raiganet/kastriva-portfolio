import type { Metadata } from "next";
import Hero from "@/components/Hero";
import ServicesSection from "@/components/sections/ServicesSection";
import WhyChooseSection from "@/components/sections/WhyChooseSection";
import PricingSection from "@/components/sections/PricingSection";
import FinalCTA from "@/components/sections/FinalCTA";
import StatsSection from "@/components/sections/StatsSection";
import FeaturedProject from "@/components/sections/FeaturedProject";
import TestimonialSection from "@/components/sections/TestimonialSection";
import FAQSection from "@/components/sections/FAQSection";
import { getSiteContent } from "@/lib/server/site-content.server";
import { pageMetadata } from "@/lib/seo-cms";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteContent();
  return pageMetadata(site, "home", "/", site.seo.siteTitle, site.seo.description);
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <div className="content-auto"><StatsSection /></div>
      <div className="content-auto"><ServicesSection /></div>
      <div className="content-auto"><FeaturedProject /></div>
      <div className="content-auto"><WhyChooseSection /></div>
      <div className="content-auto"><PricingSection /></div>
      <div className="content-auto"><TestimonialSection /></div>
      <div className="content-auto"><FAQSection /></div>
      <div className="content-auto"><FinalCTA /></div>
    </>
  );
}
