import ServicesSection from "@/components/sections/ServicesSection";
import FinalCTA from "@/components/sections/FinalCTA";
import { config } from "@/data/config";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Layanan Pembuatan Website & Aplikasi",
  description: "Layanan pembuatan website, web app, sistem informasi, dan aplikasi Android profesional.",
  path: "/services",
});

export default function ServicesPage() {
  return (
    <div className="pt-32">
      <ServicesSection />
      <FinalCTA />
    </div>
  );
}
