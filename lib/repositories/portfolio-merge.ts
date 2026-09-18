import { projects } from "@/data/projects";
import type { PortfolioProject } from "@/lib/types/portfolio";

export const portfolioSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const urlKey = (url: string) => url.replace(/\/$/, "");
const matches = (a: PortfolioProject, b: PortfolioProject) =>
  String(a.id) === String(b.id) || portfolioSlug(a.title) === portfolioSlug(b.title) ||
  Boolean(a.demoUrl && b.demoUrl && urlKey(a.demoUrl) === urlKey(b.demoUrl));

// Replace the old sample project without carrying over its fictional case study.
export function applyPortfolioUpdates(project: PortfolioProject): PortfolioProject {
  if (portfolioSlug(project.title) === "sistem-manajemen-inventaris" ||
      urlKey(project.demoUrl) === "https://demo.kastriva.com/inventory") {
    const replacement = projects.find((p) => p.id === "kastriva-smart-kasir")!;
    return { ...replacement, id: project.id, featured: project.featured, published: project.published };
  }
  const local = projects.find((p) => matches(p, project));
  return local ? { ...project, image: local.image } : project;
}

export function mergePortfolio(remote: PortfolioProject[], local = projects): PortfolioProject[] {
  const updated = remote.map(applyPortfolioUpdates);
  const combined = [...updated, ...local.filter((p) => !updated.some((r) => matches(r, p)))];
  return combined.filter((p, index) => p.published &&
    !combined.slice(0, index).some((previous) => matches(previous, p)));
}
