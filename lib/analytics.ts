/**
 * Analytics tracking abstraction
 * Siap diintegrasikan dengan Google Analytics / Plausible / dll
 */

type EventName = 
  | "portfolio_view"
  | "portfolio_demo_click"
  | "portfolio_order_click"
  | "order_started"
  | "order_submitted"
  | "whatsapp_click"
  | "contact_submitted"
  | "service_consult";

interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

declare global {
  interface Window {
    trackEvent?: (name: EventName, properties?: EventProperties) => void;
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Track event ke analytics provider
 * Saat ini hanya console.log, siap diintegrasikan ke GA4
 */
export function trackEvent(name: EventName, properties?: EventProperties): void {
  // Log untuk development
  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics]", name, properties);
  }

  // TODO: Integrasikan dengan Google Analytics 4
  // if (typeof window !== "undefined" && window.gtag) {
  //   window.gtag("event", name, properties);
  // }

  // Simpan ke window object untuk diakses global
  if (typeof window !== "undefined") {
    window.trackEvent = trackEvent;
  }
}

// Auto-register saat module diimport
if (typeof window !== "undefined") {
  window.trackEvent = trackEvent;
}
