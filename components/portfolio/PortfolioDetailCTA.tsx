"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface PortfolioDetailCTAProps {
  portfolioId: string;
  portfolioTitle: string;
  portfolioCategory: string;
}

export default function PortfolioDetailCTA({ 
  portfolioId, 
  portfolioTitle, 
  portfolioCategory 
}: PortfolioDetailCTAProps) {
  return (
    <Link
      href={`/order?portfolio=${portfolioId}&service=${encodeURIComponent(portfolioCategory)}`}
      className="w-full bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20"
    >
      Saya Ingin Website Seperti Ini <ArrowRight size={18} />
    </Link>
  );
}
