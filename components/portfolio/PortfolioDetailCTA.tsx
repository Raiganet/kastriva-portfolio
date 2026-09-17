"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { inferPortfolioProjectType } from "@/lib/order/portfolio-reference";
import { PortfolioService } from "@/lib/services/portfolio.service";

interface PortfolioDetailCTAProps {
  portfolioId: string;
  portfolioTitle: string;
  portfolioCategory: string;
}

export default function PortfolioDetailCTA({
  portfolioId,
  portfolioTitle,
  portfolioCategory,
}: PortfolioDetailCTAProps) {
  const params = new URLSearchParams();
  params.set("portfolio", portfolioId);
  params.set(
    "service",
    inferPortfolioProjectType({ title: portfolioTitle, category: portfolioCategory })
  );

  return (
    <Link
      href={`/order?${params.toString()}`}
      onClick={() => PortfolioService.trackOrderClick(portfolioId, portfolioTitle)}
      className="w-full bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20"
    >
      Buat Project Serupa <ArrowRight size={18} />
    </Link>
  );
}
