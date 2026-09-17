import { unstable_cache } from "next/cache";
import { callGas } from "@/lib/server/gas-bridge";
import { defaultSiteContent } from "@/data/site-content";
import type { SiteContent } from "@/lib/types/site-content";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function mergeKnown<T>(fallback: T, incoming: unknown): T {
  if (Array.isArray(fallback)) return (Array.isArray(incoming) ? incoming : fallback) as T;
  if (isPlainObject(fallback)) {
    if (!isPlainObject(incoming)) return fallback;
    const out: Record<string, unknown> = { ...fallback };
    for (const key of Object.keys(fallback)) {
      out[key] = mergeKnown((fallback as Record<string, unknown>)[key], incoming[key]);
    }
    return out as T;
  }
  if (typeof incoming === typeof fallback) return incoming as T;
  return fallback;
}

const loadSiteContent = unstable_cache(
  async (): Promise<SiteContent> => {
    const result = await callGas<Record<string, unknown>>("getSiteContent");
    if (!result.success || !isPlainObject(result.data)) return defaultSiteContent;
    return mergeKnown(defaultSiteContent, result.data);
  },
  ["kastriva-site-content-v1"],
  { revalidate: 60, tags: ["site-content"] }
);

/**
 * Public CMS content with a safe local fallback.
 * The cache is invalidated immediately after an admin CMS save via /api/cms/revalidate.
 */
export async function getSiteContent(): Promise<SiteContent> {
  return loadSiteContent();
}
