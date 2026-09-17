import type { PortfolioProject } from "@/lib/types/portfolio";

export const PROJECT_TYPES = [
  "Website",
  "Landing Page",
  "Company Profile",
  "Web App",
  "Dashboard",
  "Sistem Informasi",
  "Android App",
  "Custom",
] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];

export function isProjectType(value?: string | null): value is ProjectType {
  return !!value && PROJECT_TYPES.includes(value as ProjectType);
}

/**
 * Ubah kategori/nama portfolio yang bebas dari CMS menjadi tipe order yang
 * memang diterima validator dan Google Apps Script.
 */
export function inferPortfolioProjectType(
  project?: Pick<PortfolioProject, "title" | "category"> | null,
  preferred?: string | null
): ProjectType {
  if (isProjectType(preferred)) return preferred;

  const text = `${project?.title || ""} ${project?.category || ""}`.toLowerCase();

  if (/landing\s*page/.test(text)) return "Landing Page";
  if (/company\s*profile|profil\s*perusahaan/.test(text)) return "Company Profile";
  if (/dashboard/.test(text)) return "Dashboard";
  if (/android|apk|mobile\s*app/.test(text)) return "Android App";
  if (/sistem\s*informasi|absensi|sekolah|madrasah/.test(text)) return "Sistem Informasi";
  if (/web\s*app|aplikasi|kasir|arisan|utilitas|bellmatic/.test(text)) return "Web App";
  if (/website|web\b/.test(text)) return "Website";

  return "Custom";
}

export function getPortfolioReference(project: PortfolioProject): string {
  if (project.demoUrl && project.demoUrl !== "#") return project.demoUrl;
  return project.title;
}

export function getPortfolioOrderHref(project: PortfolioProject): string {
  const params = new URLSearchParams();
  params.set("portfolio", String(project.id));
  params.set("service", inferPortfolioProjectType(project));
  return `/order?${params.toString()}`;
}
