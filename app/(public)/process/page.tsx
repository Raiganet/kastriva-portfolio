import { Metadata } from "next";
import ProcessSection from "@/components/sections/ProcessSection";
import FinalCTA from "@/components/sections/FinalCTA";
import { config } from "@/data/config";

export const metadata: Metadata = {
  title: `Proses Kerja | ${config.brand.name}`,
  description: "Bagaimana project Anda dikerjakan dari konsultasi hingga deployment.",
};

export default function ProcessPage() {
  return (
    <div className="pt-32">
      <ProcessSection />
      <FinalCTA />
    </div>
  );
}
