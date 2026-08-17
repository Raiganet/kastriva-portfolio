import { config } from "@/data/config";
import { gasGet, isGasConfigured } from "@/lib/gas-client";
import { normalizePortfolio } from "@/lib/repositories/normalizer";
import { PortfolioProject } from "@/lib/types/portfolio";

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/**
 * Ambil portfolio di Server Component (GAS优先, fallback lokal)
 */
export async function getServerPortfolio(): Promise<PortfolioProject[]> {
  if (isGasConfigured()) {
    try {
      const res = await gasGet<any[]>("getPortfolio");
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map(normalizePortfolio).filter((p) => p.published);
      }
    } catch {
      // fallback
    }
  }
  return config.portfolio.filter((p) => p.published);
}

export async function getServerPortfolioBySlug(
  slug: string
): Promise<PortfolioProject | null> {
  if (isGasConfigured()) {
    try {
      const res = await gasGet<any>("getPortfolioBySlug", { slug });
      if (res.success && res.data) return normalizePortfolio(res.data);
    } catch {
      // fallback
    }
  }
  const all = await getServerPortfolio();
  return all.find((p) => generateSlug(p.title) === slug) || null;
}
