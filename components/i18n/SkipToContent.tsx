"use client";

import { useLanguage } from "@/components/i18n/LanguageProvider";

export default function SkipToContent() {
  const { language } = useLanguage();
  return (
    <a href="#main-content" className="fixed left-4 top-2 z-[100] -translate-y-20 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition focus:translate-y-0">
      {language === "en" ? "Skip to content" : "Lewati ke konten"}
    </a>
  );
}
