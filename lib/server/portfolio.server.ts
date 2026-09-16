import { portfolioRepository } from "@/lib/repositories/portfolio.repo";
import { PortfolioProject } from "@/lib/types/portfolio";

export async function getServerPortfolio(): Promise<PortfolioProject[]> {
  return portfolioRepository.getAll();
}

export async function getServerPortfolioBySlug(slug: string): Promise<PortfolioProject | null> {
  return portfolioRepository.getBySlug(slug);
}
