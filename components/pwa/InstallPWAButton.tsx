"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

interface InstallPWAButtonProps {
  compact?: boolean;
}

export default function InstallPWAButton({ compact = false }: InstallPWAButtonProps) {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    if (standalone) return;

    const sync = () => setAvailable(Boolean(window.__deferredPWAInstall));
    sync();
    window.addEventListener("pwa-install-available", sync);
    window.addEventListener("pwa-install-complete", sync);
    return () => {
      window.removeEventListener("pwa-install-available", sync);
      window.removeEventListener("pwa-install-complete", sync);
    };
  }, []);

  if (!available) return null;

  const install = async () => {
    const prompt = window.__deferredPWAInstall;
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice;
    window.__deferredPWAInstall = undefined;
    setAvailable(false);
  };

  return (
    <button
      type="button"
      onClick={install}
      className={compact
        ? "flex items-center gap-2 py-2 text-base font-medium"
        : "inline-flex items-center gap-2 rounded-full border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary-400 hover:text-primary-600 dark:border-slate-700 dark:text-slate-200 dark:hover:text-primary-400"}
      aria-label="Instal Kastriva sebagai aplikasi"
    >
      <Download size={compact ? 16 : 15} /> Instal App
    </button>
  );
}
