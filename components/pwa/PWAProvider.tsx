"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

export default function PWAProvider() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      const register = () => {
        navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
          console.warn("Service worker registration failed:", error);
        });
      };
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  useEffect(() => {
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      window.__deferredPWAInstall = event as BeforeInstallPromptEvent;
      window.dispatchEvent(new Event("pwa-install-available"));
      trackEvent("pwa_install_prompt", { available: true });
    };

    const handleInstalled = () => {
      window.__deferredPWAInstall = undefined;
      window.dispatchEvent(new Event("pwa-install-complete"));
      trackEvent("pwa_installed", { installed: true });
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  return null;
}
