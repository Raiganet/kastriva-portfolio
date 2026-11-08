"use client";

import Link from "next/link";
import { Home, RefreshCw } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export default function OfflineActions() {
  const { language } = useLanguage();
  const english = language === "en";
  return (
    <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
      <Link href="/" className="btn-secondary"><Home size={17} /> {english ? "Home" : "Beranda"}</Link>
      <button type="button" onClick={() => window.location.reload()} className="btn-primary">
        <RefreshCw size={17} /> {english ? "Try Again" : "Coba Lagi"}
      </button>
    </div>
  );
}
