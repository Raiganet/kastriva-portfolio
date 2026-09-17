import ProcessSection from "@/components/sections/ProcessSection";
import FinalCTA from "@/components/sections/FinalCTA";
import { config } from "@/data/config";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Proses Kerja Pengembangan Project",
  description: "Pelajari proses pengerjaan project Kastriva dari konsultasi, penawaran, pengembangan, revisi, hingga serah terima.",
  path: "/process",
});

export default function ProcessPage() {
  return (
    <div className="pt-32">
      <ProcessSection />
      <FinalCTA />
    </div>
  );
}
