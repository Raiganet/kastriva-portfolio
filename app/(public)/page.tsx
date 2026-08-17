import { Metadata } from "next";
import Hero from "@/components/Hero";
import { config } from "@/data/config";
import Section from "@/components/Section";
import ServicesSection from "@/components/sections/ServicesSection";
import WhyChooseSection from "@/components/sections/WhyChooseSection";
import PricingSection from "@/components/sections/PricingSection";
import FinalCTA from "@/components/sections/FinalCTA";
import StatsSection from "@/components/sections/StatsSection";
import FeaturedProject from "@/components/sections/FeaturedProject";

export const metadata: Metadata = {
  title: `${config.brand.name} | Jasa Pembuatan Website & Aplikasi Profesional`,
  description: config.hero.subheadline,
  keywords: ["jasa pembuatan website", "jasa web app", "web developer Indonesia"],
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
      <FinalCTA />
    </>
  );
}
