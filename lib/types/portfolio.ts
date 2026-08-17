/**
 * Interface untuk data project portfolio
 * Kompatibel dengan local config DAN Google Sheets (GAS)
 */
export interface PortfolioProject {
  id: number | string;
  title: string;
  category: string;
  description: string;
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
