import { Metadata } from "next";
import Hero from "@/components/Hero";
import { config } from "@/data/config";
import ServicesSection from "@/components/sections/ServicesSection";
import WhyChooseSection from "@/components/sections/WhyChooseSection";
import PricingSection from "@/components/sections/PricingSection";
import FinalCTA from "@/components/sections/FinalCTA";
import StatsSection from "@/components/sections/StatsSection";
import FeaturedProject from "@/components/sections/FeaturedProject";
import TestimonialSection from "@/components/sections/TestimonialSection";
import FAQSection from "@/components/sections/FAQSection";

export const metadata: Metadata = {
  title: `${config.brand.name} | Jasa Pembuatan Website & Aplikasi Profesional`,
  description: config.hero.subheadline,
  keywords: [
    "jasa pembuatan website",
    "jasa website profesional",
    "jasa pembuatan web app",
    "jasa pembuatan aplikasi",
    "web developer Indonesia",
    "jasa pembuatan sistem informasi",
    "jasa website UMKM",
  ],
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsSection />
      <ServicesSection />
      <FeaturedProject />
      <WhyChooseSection />
      <PricingSection />
      <TestimonialSection />
      <FAQSection />
      <FinalCTA />
    </>
  );
}
