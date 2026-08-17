import { Metadata } from "next";
import ServicesSection from "@/components/sections/ServicesSection";
import FinalCTA from "@/components/sections/FinalCTA";
import { config } from "@/data/config";

export const metadata: Metadata = {
  title: `Layanan | ${config.brand.name}`,
  description: "Layanan pembuatan website, web app, sistem informasi, dan aplikasi Android profesional.",
};

export default function ServicesPage() {
  return (
    <div className="pt-32">
      <ServicesSection />
      <FinalCTA />
    </div>
  );
}
