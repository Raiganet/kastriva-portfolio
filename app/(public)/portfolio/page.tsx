import { Metadata } from "next";
import Portfolio from "@/components/Portfolio";
import { config } from "@/data/config";

export const metadata: Metadata = {
  title: `Portfolio | ${config.brand.name}`,
  description: "Lihat portfolio project website, web app, dan aplikasi yang pernah saya buat.",
};

export default function PortfolioPage() {
  return (
    <div className="pt-32">
      <Portfolio />
    </div>
  );
}
