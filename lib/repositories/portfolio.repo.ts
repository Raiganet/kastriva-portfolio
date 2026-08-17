import { config } from "@/data/config";
import { gasGet, isGasConfigured } from "@/lib/gas-client";
import { normalizePortfolio } from "./normalizer";
import { PortfolioProject, PortfolioCategory } from "@/lib/types/portfolio";

export interface PortfolioRepository {
  getAll(): Promise<PortfolioProject[]>;
  getById(id: number | string): Promise<PortfolioProject | null>;
  getBySlug(slug: string): Promise<PortfolioProject | null>;
  getFeatured(): Promise<PortfolioProject[]>;
  getCategories(): Promise<PortfolioCategory[]>;
  search(query: string): Promise<PortfolioProject[]>;
  filterByCategory(category: string): Promise<PortfolioProject[]>;
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Hybrid Repository:
 * 1. Coba ambil dari Google Apps Script (Google Sheets)
 * 2. Jika gagal / belum dikonfigurasi → fallback ke data/config.ts
 */
class HybridPortfolioRepository implements PortfolioRepository {
  private async fetchFromGas(): Promise<PortfolioProject[] | null> {
    if (!isGasConfigured()) return null;
    try {
      const res = await gasGet<any[]>("getPortfolio");
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map(normalizePortfolio).filter((p) => p.published);
      }
      return null;
    } catch {
      return null;
    }
  }

  async getAll(): Promise<PortfolioProject[]> {
    const remote = await this.fetchFromGas();
    if (remote) return remote;
    return config.portfolio.filter((p) => p.published);
  }

  async getById(id: number | string): Promise<PortfolioProject | null> {
    const all = await this.getAll();
    return all.find((p) => String(p.id) === String(id)) || null;
  }

  async getBySlug(slug: string): Promise<PortfolioProject | null> {
    // Coba endpoint khusus dulu (include images gallery)
    if (isGasConfigured()) {
      try {
        const res = await gasGet<any>("getPortfolioBySlug", { slug });
        if (res.success && res.data) return normalizePortfolio(res.data);
      } catch {
        // fallback di bawah
      }
    }
    const all = await this.getAll();
    return all.find((p) => generateSlug(p.title) === slug) || null;
  }

  async getFeatured(): Promise<PortfolioProject[]> {
    const all = await this.getAll();
    return all.filter((p) => p.featured).slice(0, 3);
  }

  async getCategories(): Promise<PortfolioCategory[]> {
    if (isGasConfigured()) {
      try {
        const res = await gasGet<PortfolioCategory[]>("getPortfolioCategories");
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          return res.data;
        }
      } catch {
        // fallback di bawah
      }
    }
    const all = await this.getAll();
    const map = new Map<string, number>();
    all.forEach((p) => map.set(p.category, (map.get(p.category) || 0) + 1));
    const categories: PortfolioCategory[] = [
      { id: "all", name: "Semua", slug: "all", count: all.length },
    ];
    map.forEach((count, name) => {
      categories.push({ id: generateSlug(name), name, slug: generateSlug(name), count });
    });
    return categories;
  }

  async search(query: string): Promise<PortfolioProject[]> {
    const all = await this.getAll();
    const q = query.toLowerCase();
    return all.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.technologies.some((t) => t.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q)
    );
  }

  async filterByCategory(category: string): Promise<PortfolioProject[]> {
    const all = await this.getAll();
    if (category === "Semua" || category === "all") return all;
    return all.filter((p) => p.category === category);
  }
}

export const portfolioRepository = new HybridPortfolioRepository();
