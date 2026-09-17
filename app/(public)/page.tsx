import Hero from "@/components/Hero";
import { config } from "@/data/config";
import { buildMetadata } from "@/lib/seo";
import ServicesSection from "@/components/sections/ServicesSection";
import WhyChooseSection from "@/components/sections/WhyChooseSection";
import PricingSection from "@/components/sections/PricingSection";
import FinalCTA from "@/components/sections/FinalCTA";
import StatsSection from "@/components/sections/StatsSection";
import FeaturedProject from "@/components/sections/FeaturedProject";
import TestimonialSection from "@/components/sections/TestimonialSection";
import FAQSection from "@/components/sections/FAQSection";

export const metadata = buildMetadata({
  title: "Jasa Pembuatan Website & Aplikasi Profesional",
  description: config.hero.subheadline,
  path: "/",
  keywords: [
    "jasa pembuatan website",
    "jasa website profesional",
    "jasa pembuatan web app",
    "jasa pembuatan aplikasi",
    "web developer Indonesia",
    "jasa pembuatan sistem informasi",
    "jasa website UMKM",
  ],
});

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
