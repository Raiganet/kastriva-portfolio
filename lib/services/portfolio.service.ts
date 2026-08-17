import { portfolioRepository } from "@/lib/repositories/portfolio.repo";
import { PortfolioProject, PortfolioCategory } from "@/lib/types/portfolio";

export class PortfolioService {
  static async getAll(): Promise<PortfolioProject[]> {
    return portfolioRepository.getAll();
  }

  static async getById(id: number | string): Promise<PortfolioProject | null> {
    return portfolioRepository.getById(id);
  }

  static async getBySlug(slug: string): Promise<PortfolioProject | null> {
    return portfolioRepository.getBySlug(slug);
  }

  static async getFeatured(): Promise<PortfolioProject[]> {
    return portfolioRepository.getFeatured();
  }

  static async getCategories(): Promise<PortfolioCategory[]> {
    return portfolioRepository.getCategories();
  }

  static async search(query: string): Promise<PortfolioProject[]> {
    if (!query.trim()) return portfolioRepository.getAll();
    return portfolioRepository.search(query);
  }

  static async filterByCategory(category: string): Promise<PortfolioProject[]> {
    return portfolioRepository.filterByCategory(category);
  }

  static async filterAndSearch(category: string, query: string): Promise<PortfolioProject[]> {
    let projects = await portfolioRepository.getAll();
    if (category && category !== "Semua" && category !== "all") {
      projects = projects.filter((p) => p.category === category);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      projects = projects.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.technologies.some((t) => t.toLowerCase().includes(q))
      );
    }
    return projects;
  }

  static trackView(projectId: number | string, projectTitle: string): void {
    if (typeof window !== "undefined" && (window as any).trackEvent) {
      (window as any).trackEvent("portfolio_view", { projectId: String(projectId), projectTitle });
    }
  }

  static trackDemoClick(projectId: number | string, projectTitle: string): void {
    if (typeof window !== "undefined" && (window as any).trackEvent) {
      (window as any).trackEvent("portfolio_demo_click", { projectId: String(projectId), projectTitle });
    }
  }

  static trackOrderClick(projectId: number | string, projectTitle: string): void {
    if (typeof window !== "undefined" && (window as any).trackEvent) {
      (window as any).trackEvent("portfolio_order_click", { projectId: String(projectId), projectTitle });
    }
  }
}
