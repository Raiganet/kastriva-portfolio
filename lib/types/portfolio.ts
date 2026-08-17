/**
 * Interface untuk data project portfolio
 * Sesuaikan dengan struktur data di Google Sheets nantinya
 */
export interface PortfolioProject {
  id: number;
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

/**
 * Interface untuk kategori portfolio
 */
export interface PortfolioCategory {
  id: string;
  name: string;
  slug: string;
  count: number;
}

/**
 * Interface untuk statistik dashboard
 */
export interface DashboardStats {
  totalPortfolio: number;
  completedProjects: number;
  activeProjects: number;
  totalCustomers: number;
}
