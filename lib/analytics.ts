/**
 * Central analytics helper. Events are forwarded to GA4 when configured and
 * remain safe no-ops when analytics is disabled.
 */
export type AnalyticsEventName =
  | "page_view"
  | "portfolio_view"
  | "portfolio_demo_click"
  | "portfolio_order_click"
  | "order_started"
  | "order_submitted"
  | "whatsapp_click"
  | "contact_submitted"
  | "service_consult"
  | "pwa_install_prompt"
  | "pwa_installed"
  | "web_vital";

export interface AnalyticsEventProperties {
  [key: string]: string | number | boolean | undefined;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    trackEvent?: (name: AnalyticsEventName, properties?: AnalyticsEventProperties) => void;
    __deferredPWAInstall?: BeforeInstallPromptEvent;
  }

  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
    prompt(): Promise<void>;
  }
}

export function trackEvent(name: AnalyticsEventName, properties: AnalyticsEventProperties = {}): void {
  if (typeof window === "undefined") return;

  if (process.env.NODE_ENV === "development") {
    console.debug("[Analytics]", name, properties);
  }

  if (typeof window.gtag === "function") {
    window.gtag("event", name, properties);
  }
}

export function trackPageView(path: string): void {
  if (typeof window === "undefined") return;
  trackEvent("page_view", {
    page_path: path,
    page_title: document.title,
    page_location: window.location.href,
  });
}

if (typeof window !== "undefined") {
  window.trackEvent = trackEvent;
}
