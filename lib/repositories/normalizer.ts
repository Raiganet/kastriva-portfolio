import { PortfolioProject } from "@/lib/types/portfolio";

/**
 * Parse value yang mungkin berupa JSON string (dari Google Sheets)
 * menjadi array sungguhan.
 */
export function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[];
  if (typeof value === "string" && value.trim() !== "") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function toBool(value: unknown): boolean {
  return value === true || value === "TRUE" || value === "true" || value === 1;
}

/**
 * Normalisasi row mentah dari Google Sheets menjadi PortfolioProject
 */
export function normalizePortfolio(raw: any): PortfolioProject {
  return {
    id: raw.id,
    title: String(raw.title || ""),
    category: String(raw.category || "Lainnya"),
    description: String(raw.description || ""),
    shortDescription: raw.shortDescription ? String(raw.shortDescription) : undefined,
    image: String(raw.image || ""),
    images: raw.images ? parseJsonArray(raw.images) : undefined,
    technologies: parseJsonArray(raw.technologies),
    demoUrl: String(raw.demoUrl || ""),
    githubUrl: raw.githubUrl ? String(raw.githubUrl) : undefined,
    year: String(raw.year || ""),
    status: String(raw.status || "Completed"),
    featured: toBool(raw.featured),
    problemSolved: String(raw.problemSolved || ""),
    solution: String(raw.solution || ""),
    features: parseJsonArray(raw.features),
    myRole: String(raw.myRole || ""),
    published: toBool(raw.published),
    sortOrder: Number(raw.sortOrder) || undefined,
    slug: raw.slug ? String(raw.slug) : undefined,
    cmsSource: raw.cmsSource === "bundled" ? "bundled" : raw.cmsSource === "cms" ? "cms" : undefined,
    deleted: toBool(raw.deleted),
    createdAt: String(raw.createdAt || ""),
    updatedAt: String(raw.updatedAt || ""),
  };
}
