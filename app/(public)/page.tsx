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
import Reveal from "@/components/ui/Reveal";
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
      <Reveal className="content-auto"><StatsSection /></Reveal>
      <Reveal className="content-auto"><ServicesSection /></Reveal>
      <Reveal className="content-auto"><FeaturedProject /></Reveal>
      <Reveal className="content-auto"><WhyChooseSection /></Reveal>
      <Reveal className="content-auto"><PricingSection /></Reveal>
      <Reveal className="content-auto"><TestimonialSection /></Reveal>
      <Reveal className="content-auto"><FAQSection /></Reveal>
      <Reveal className="content-auto"><FinalCTA /></Reveal>
    </>
  );
}
