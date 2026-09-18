import { cache } from "react";
import { normalizePortfolio } from "@/lib/repositories/normalizer";
import { applyPortfolioUpdates, mergePortfolio, portfolioSlug } from "@/lib/repositories/portfolio-merge";
import type { PortfolioProject } from "@/lib/types/portfolio";
import { handleFirebaseAction } from "./firebase-backend";

export const getServerPortfolio = cache(async (): Promise<PortfolioProject[]> => {
  const response = await handleFirebaseAction("getPortfolio");
  const remote = response.success && Array.isArray(response.data) ? response.data.map(normalizePortfolio) : [];
  return mergePortfolio(remote);
});

export const getServerPortfolioBySlug = cache(async (value: string): Promise<PortfolioProject | null> => {
  const response = await handleFirebaseAction("getPortfolioBySlug", {}, { slug: value });
  if (response.success && response.data) {
    const project = applyPortfolioUpdates(normalizePortfolio(response.data));
    return project.published ? project : null;
  }
  return (await getServerPortfolio()).find((p) => portfolioSlug(p.title) === value) || null;
});
