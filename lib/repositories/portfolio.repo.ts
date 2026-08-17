import { config } from "@/data/config";
import { PortfolioProject, PortfolioCategory } from "@/lib/types/portfolio";

/**
 * Portfolio Repository
 * Abstraction layer untuk data portfolio.
 * Saat ini menggunakan local config, nantinya bisa swap ke Google Apps Script.
 */

export interface PortfolioRepository {
  getAll(): Promise<PortfolioProject[]>;
  getById(id: number): Promise<PortfolioProject | null>;
  getBySlug(slug: string): Promise<PortfolioProject | null>;
  getFeatured(): Promise<PortfolioProject[]>;
  getCategories(): Promise<PortfolioCategory[]>;
  search(query: string): Promise<PortfolioProject[]>;
  filterByCategory(category: string): Promise<PortfolioProject[]>;
}

// Helper: generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

class LocalPortfolioRepository implements PortfolioRepository {
  async getAll(): Promise<PortfolioProject[]> {
    // TODO: Nantinya fetch dari Google Apps Script
    // const response = await apiClient.get<PortfolioProject[]>("/portfolio");
    // if (response.success && response.data) return response.data;
    
    // Fallback ke local config
    return config.portfolio.filter(p => p.published);
  }

  async getById(id: number): Promise<PortfolioProject | null> {
    const all = await this.getAll();
    return all.find(p => p.id === id) || null;
  }

  async getBySlug(slug: string): Promise<PortfolioProject | null> {
    const all = await this.getAll();
    return all.find(p => generateSlug(p.title) === slug) || null;
  }

  async getFeatured(): Promise<PortfolioProject[]> {
    const all = await this.getAll();
    return all.filter(p => p.featured).slice(0, 3);
  }

  async getCategories(): Promise<PortfolioCategory[]> {
    const all = await this.getAll();
    const categoryMap = new Map<string, number>();
    
    all.forEach(p => {
      categoryMap.set(p.category, (categoryMap.get(p.category) || 0) + 1);
    });

    const categories: PortfolioCategory[] = [
      {
        id: "all",
        name: "Semua",
        slug: "all",
        count: all.length,
      },
    ];

    categoryMap.forEach((count, name) => {
      categories.push({
        id: generateSlug(name),
        name,
        slug: generateSlug(name),
        count,
      });
    });

    return categories;
  }

  async search(query: string): Promise<PortfolioProject[]> {
    const all = await this.getAll();
    const lowerQuery = query.toLowerCase();
    
    return all.filter(p => 
      p.title.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      p.technologies.some(t => t.toLowerCase().includes(lowerQuery)) ||
      p.category.toLowerCase().includes(lowerQuery)
    );
  }

  async filterByCategory(category: string): Promise<PortfolioProject[]> {
    const all = await this.getAll();
    if (category === "Semua" || category === "all") return all;
    return all.filter(p => p.category === category);
  }
}

// Export singleton instance
export const portfolioRepository = new LocalPortfolioRepository();
