"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { trackEvent, trackPageView } from "@/lib/analytics";

function reportWebVital(metric: { name: string; value: number; id: string; rating?: string }) {
  if (Math.random() > 0.25) return;
  trackEvent("web_vital", {
    metric_name: metric.name,
    metric_value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
    metric_id: metric.id,
    metric_rating: metric.rating,
  });
}

export default function AnalyticsProvider() {
  const pathname = usePathname();

  useEffect(() => {
    const path = `${pathname}${window.location.search || ""}`;
    trackPageView(path);
  }, [pathname]);

  useReportWebVitals(reportWebVital);

  return null;
}
