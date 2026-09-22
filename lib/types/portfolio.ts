/**
 * Interface untuk data project portfolio.
 * CMS/Firebase adalah source of truth; data/projects.ts hanya fallback/seed awal.
 */
export interface PortfolioProject {
  id: number | string;
  title: string;
  category: string;
  description: string;
  shortDescription?: string;
  image: string;
  images?: string[];
  technologies: string[];
  demoUrl: string;
  githubUrl?: string;
  year: string;
  status: string;
  featured: boolean;
  problemSolved: string;
  solution: string;
  features: string[];
  myRole: string;
  published: boolean;
  sortOrder?: number;
  slug?: string;
  /** Admin-only hint: record already saved in CMS or still from bundled seed. */
  cmsSource?: "cms" | "bundled";
  /** Internal tombstone used so bundled projects can be removed from CMS/public view. */
  deleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioCategory {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface DashboardStats {
  totalPortfolio: number;
  completedProjects: number;
  activeProjects: number;
  totalCustomers: number;
}
