import { portfolioRepository } from "@/lib/repositories/portfolio.repo";
import { PortfolioProject, PortfolioCategory } from "@/lib/types/portfolio";

/**
 * Portfolio Service
 * Business logic layer untuk portfolio.
 * Memisahkan logic dari UI component.
 */

export class PortfolioService {
  /**
   * Get all published portfolio
   */
  static async getAll(): Promise<PortfolioProject[]> {
    return portfolioRepository.getAll();
  }

  /**
   * Get portfolio by ID
   */
  static async getById(id: number): Promise<PortfolioProject | null> {
    return portfolioRepository.getById(id);
  }

  /**
   * Get portfolio by slug (untuk URL SEO-friendly)
   */
  static async getBySlug(slug: string): Promise<PortfolioProject | null> {
    return portfolioRepository.getBySlug(slug);
  }

  /**
   * Get featured projects
   */
  static async getFeatured(): Promise<PortfolioProject[]> {
    return portfolioRepository.getFeatured();
  }

  /**
   * Get all categories dengan count
   */
  static async getCategories(): Promise<PortfolioCategory[]> {
    return portfolioRepository.getCategories();
  }

  /**
   * Search portfolio
   */
  static async search(query: string): Promise<PortfolioProject[]> {
    if (!query.trim()) return portfolioRepository.getAll();
    return portfolioRepository.search(query);
  }

  /**
   * Filter portfolio by category
   */
  static async filterByCategory(category: string): Promise<PortfolioProject[]> {
    return portfolioRepository.filterByCategory(category);
  }

  /**
   * Combined filter + search
   */
  static async filterAndSearch(category: string, query: string): Promise<PortfolioProject[]> {
    let projects = await portfolioRepository.getAll();
    
    if (category && category !== "Semua" && category !== "all") {
      projects = projects.filter(p => p.category === category);
    }
    
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      projects = projects.filter(p => 
        p.title.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery) ||
        p.technologies.some(t => t.toLowerCase().includes(lowerQuery))
      );
    }
    
    return projects;
  }

  /**
   * Track portfolio view (untuk analytics)
   */
  static trackView(projectId: number, projectTitle: string): void {
    if (typeof window !== "undefined" && (window as any).trackEvent) {
      (window as any).trackEvent("portfolio_view", { projectId, projectTitle });
    }
  }

  /**
   * Track demo click
   */
  static trackDemoClick(projectId: number, projectTitle: string): void {
    if (typeof window !== "undefined" && (window as any).trackEvent) {
      (window as any).trackEvent("portfolio_demo_click", { projectId, projectTitle });
    }
  }

  /**
   * Track order from portfolio
   */
  static trackOrderClick(projectId: number, projectTitle: string): void {
    if (typeof window !== "undefined" && (window as any).trackEvent) {
      (window as any).trackEvent("portfolio_order_click", { projectId, projectTitle });
    }
  }
}
