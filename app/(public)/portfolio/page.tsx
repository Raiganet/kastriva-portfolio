import Portfolio from "@/components/Portfolio";
import { config } from "@/data/config";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Portfolio Website & Aplikasi",
  description: "Lihat portfolio project website, web app, sistem informasi, dan aplikasi yang pernah dikerjakan Kastriva.",
  path: "/portfolio",
});

export default function PortfolioPage() {
  return (
    <div className="pt-32">
      <Portfolio />
    </div>
  );
}
