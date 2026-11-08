"use client";

import { WifiOff } from "lucide-react";
import OfflineActions from "@/components/pwa/OfflineActions";
import { LanguageProvider, useLanguage } from "@/components/i18n/LanguageProvider";

function OfflineContent() {
  const { language } = useLanguage();
  const english = language === "en";
  return (
    <main className="min-h-screen bg-mesh px-4 py-16 flex items-center justify-center">
      <section className="surface-card max-w-lg w-full p-8 md:p-10 text-center">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
          <WifiOff size={30} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{english ? "You are offline" : "Anda sedang offline"}</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          {english
            ? "Previously visited pages may still be available from cache. Reconnect to get the latest data or submit forms."
            : "Halaman yang pernah dibuka masih dapat tersedia dari cache. Sambungkan internet untuk mengambil data terbaru atau mengirim formulir."}
        </p>
        <OfflineActions />
      </section>
    </main>
  );
}

export default function OfflinePageContent() {
  return <LanguageProvider><OfflineContent /></LanguageProvider>;
}
