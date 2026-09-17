"use client";

import { createContext, useContext } from "react";
import type { SiteContent } from "@/lib/types/site-content";
import { defaultSiteContent } from "@/data/site-content";

const SiteContentContext = createContext<SiteContent>(defaultSiteContent);

export function SiteContentProvider({ value, children }: { value: SiteContent; children: React.ReactNode }) {
  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  return useContext(SiteContentContext);
}
