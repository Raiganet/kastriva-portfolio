const fs = require('fs');
const path = require('path');

function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Created: ' + filePath);
}

console.log('\n🚀 Memulai Phase 6: Frontend ↔ GAS Integration...\n');

// 1. Update types (id bisa string dari GAS)
writeFile('lib/types/portfolio.ts', `/**
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
`);

// 2. Normalizer - samakan bentuk data GAS dengan type frontend
writeFile('lib/repositories/normalizer.ts', `import { PortfolioProject } from "@/lib/types/portfolio";

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
    createdAt: String(raw.createdAt || ""),
    updatedAt: String(raw.updatedAt || ""),
  };
}
`);

// 3. Hybrid Portfolio Repository (GAS优先, fallback lokal)
writeFile('lib/repositories/portfolio.repo.ts', `import { config } from "@/data/config";
import { gasGet, isGasConfigured } from "@/lib/gas-client";
import { normalizePortfolio } from "./normalizer";
import { PortfolioProject, PortfolioCategory } from "@/lib/types/portfolio";

export interface PortfolioRepository {
  getAll(): Promise<PortfolioProject[]>;
  getById(id: number | string): Promise<PortfolioProject | null>;
  getBySlug(slug: string): Promise<PortfolioProject | null>;
  getFeatured(): Promise<PortfolioProject[]>;
  getCategories(): Promise<PortfolioCategory[]>;
  search(query: string): Promise<PortfolioProject[]>;
  filterByCategory(category: string): Promise<PortfolioProject[]>;
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Hybrid Repository:
 * 1. Coba ambil dari Google Apps Script (Google Sheets)
 * 2. Jika gagal / belum dikonfigurasi → fallback ke data/config.ts
 */
class HybridPortfolioRepository implements PortfolioRepository {
  private async fetchFromGas(): Promise<PortfolioProject[] | null> {
    if (!isGasConfigured()) return null;
    try {
      const res = await gasGet<any[]>("getPortfolio");
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map(normalizePortfolio).filter((p) => p.published);
      }
      return null;
    } catch {
      return null;
    }
  }

  async getAll(): Promise<PortfolioProject[]> {
    const remote = await this.fetchFromGas();
    if (remote) return remote;
    return config.portfolio.filter((p) => p.published);
  }

  async getById(id: number | string): Promise<PortfolioProject | null> {
    const all = await this.getAll();
    return all.find((p) => String(p.id) === String(id)) || null;
  }

  async getBySlug(slug: string): Promise<PortfolioProject | null> {
    // Coba endpoint khusus dulu (include images gallery)
    if (isGasConfigured()) {
      try {
        const res = await gasGet<any>("getPortfolioBySlug", { slug });
        if (res.success && res.data) return normalizePortfolio(res.data);
      } catch {
        // fallback di bawah
      }
    }
    const all = await this.getAll();
    return all.find((p) => generateSlug(p.title) === slug) || null;
  }

  async getFeatured(): Promise<PortfolioProject[]> {
    const all = await this.getAll();
    return all.filter((p) => p.featured).slice(0, 3);
  }

  async getCategories(): Promise<PortfolioCategory[]> {
    if (isGasConfigured()) {
      try {
        const res = await gasGet<PortfolioCategory[]>("getPortfolioCategories");
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          return res.data;
        }
      } catch {
        // fallback di bawah
      }
    }
    const all = await this.getAll();
    const map = new Map<string, number>();
    all.forEach((p) => map.set(p.category, (map.get(p.category) || 0) + 1));
    const categories: PortfolioCategory[] = [
      { id: "all", name: "Semua", slug: "all", count: all.length },
    ];
    map.forEach((count, name) => {
      categories.push({ id: generateSlug(name), name, slug: generateSlug(name), count });
    });
    return categories;
  }

  async search(query: string): Promise<PortfolioProject[]> {
    const all = await this.getAll();
    const q = query.toLowerCase();
    return all.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.technologies.some((t) => t.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q)
    );
  }

  async filterByCategory(category: string): Promise<PortfolioProject[]> {
    const all = await this.getAll();
    if (category === "Semua" || category === "all") return all;
    return all.filter((p) => p.category === category);
  }
}

export const portfolioRepository = new HybridPortfolioRepository();
`);

// 4. Hybrid Order Repository (simpan ke Sheets + WhatsApp)
writeFile('lib/repositories/order.repo.ts', `import { OrderFormData } from "@/lib/validators/order";
import { getWhatsAppLink } from "@/data/config";
import { gasPost, isGasConfigured } from "@/lib/gas-client";

export interface OrderRepository {
  submit(data: OrderFormData): Promise<{
    success: boolean;
    orderNumber?: string;
    whatsappUrl?: string;
    error?: string;
  }>;
  generateOrderNumber(): Promise<string>;
}

/**
 * Hybrid Order Repository:
 * 1. Simpan order ke Google Sheets via GAS (jika dikonfigurasi)
 * 2. Tetap buka WhatsApp dengan pesan terformat (order number dari Sheets)
 */
class HybridOrderRepository implements OrderRepository {
  async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-4);
    return \`KAS-\${year}-\${timestamp}\`;
  }

  async submit(data: OrderFormData): Promise<{
    success: boolean;
    orderNumber?: string;
    whatsappUrl?: string;
    error?: string;
  }> {
    try {
      let orderNumber = "";

      // 1. Coba simpan ke Google Sheets
      if (isGasConfigured()) {
        try {
          const res = await gasPost<{ orderNumber: string; id: string }>({
            action: "createOrder",
            ...data,
          });
          if (res.success && res.data && res.data.orderNumber) {
            orderNumber = res.data.orderNumber;
          }
        } catch {
          // GAS gagal → lanjut dengan nomor lokal
        }
      }

      // 2. Fallback nomor lokal
      if (!orderNumber) {
        orderNumber = await this.generateOrderNumber();
      }

      // 3. Format pesan WhatsApp
      const message = \`Halo Kastriva 👋

Saya ingin berkonsultasi mengenai project.

*Order:* \${orderNumber}

*Detail:*
- Nama: \${data.name}
- Bisnis: \${data.business || "-"}
- Email: \${data.email}
- WhatsApp: \${data.whatsapp}
- Jenis Project: \${data.type}
- Budget: \${data.budget || "Belum ditentukan"}
- Deadline: \${data.deadline || "Fleksibel"}
- Referensi: \${data.reference || "Tidak ada"}

*Deskripsi:*
\${data.description}

*Fitur Dibutuhkan:*
\${data.features || "-"}

Terima kasih.\`;

      return {
        success: true,
        orderNumber,
        whatsappUrl: getWhatsAppLink(message),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Gagal mengirim order",
      };
    }
  }
}

export const orderRepository = new HybridOrderRepository();
`);

// 5. Update service signatures
writeFile('lib/services/portfolio.service.ts', `import { portfolioRepository } from "@/lib/repositories/portfolio.repo";
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
`);

// 6. Server-side data helper (untuk page & generateMetadata)
writeFile('lib/server/portfolio.server.ts', `import { config } from "@/data/config";
import { gasGet, isGasConfigured } from "@/lib/gas-client";
import { normalizePortfolio } from "@/lib/repositories/normalizer";
import { PortfolioProject } from "@/lib/types/portfolio";

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/**
 * Ambil portfolio di Server Component (GAS优先, fallback lokal)
 */
export async function getServerPortfolio(): Promise<PortfolioProject[]> {
  if (isGasConfigured()) {
    try {
      const res = await gasGet<any[]>("getPortfolio");
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map(normalizePortfolio).filter((p) => p.published);
      }
    } catch {
      // fallback
    }
  }
  return config.portfolio.filter((p) => p.published);
}

export async function getServerPortfolioBySlug(
  slug: string
): Promise<PortfolioProject | null> {
  if (isGasConfigured()) {
    try {
      const res = await gasGet<any>("getPortfolioBySlug", { slug });
      if (res.success && res.data) return normalizePortfolio(res.data);
    } catch {
      // fallback
    }
  }
  const all = await getServerPortfolio();
  return all.find((p) => generateSlug(p.title) === slug) || null;
}
`);

// 7. Update portfolio detail page (async server fetch)
writeFile('app/(public)/portfolio/[slug]/page.tsx', `import { notFound } from "next/navigation";
import { Metadata } from "next";
import { config } from "@/data/config";
import PortfolioDetailView from "@/components/portfolio/PortfolioDetailView";
import { getServerPortfolioBySlug } from "@/lib/server/portfolio.server";

// Revalidasi tiap 60 detik agar data Sheets tidak stale
export const revalidate = 60;

interface PortfolioDetailProps {
  params: { slug: string };
}

export async function generateMetadata({
  params,
}: PortfolioDetailProps): Promise<Metadata> {
  const project = await getServerPortfolioBySlug(params.slug);

  if (!project) {
    return { title: "Project Not Found" };
  }

  return {
    title: \`\${project.title} | \${config.brand.name} Portfolio\`,
    description: project.description,
    openGraph: {
      title: project.title,
      description: project.description,
      images: [project.image],
    },
  };
}

export default async function PortfolioDetailPage({
  params,
}: PortfolioDetailProps) {
  const project = await getServerPortfolioBySlug(params.slug);

  if (!project) {
    notFound();
  }

  return <PortfolioDetailView project={project} />;
}
`);

// 8. .env.local placeholder
writeFile('.env.local', `# PASTE URL WEB APP GOOGLE APPS SCRIPT ANDA DI SINI
# Format: https://script.google.com/macros/s/AKfycb.../exec
NEXT_PUBLIC_GAS_API_URL=
`);

console.log('\n🎉 Phase 6: Frontend ↔ GAS Integration berhasil!');
console.log('');
console.log('📌 LANGKAH WAJIB SELANJUTNYA:');
console.log('');
console.log('1️⃣  ISI .env.local (local development):');
console.log('   NEXT_PUBLIC_GAS_API_URL=https://script.google.com/macros/s/XXXX/exec');
console.log('');
console.log('2️⃣  SET ENV DI VERCEL (WAJIB agar production pakai Sheets):');
console.log('   Vercel Dashboard → Project → Settings → Environment Variables');
console.log('   → Add: NEXT_PUBLIC_GAS_API_URL = [URL exec Anda]');
console.log('   → Apply ke: Production, Preview');
console.log('');
console.log('3️⃣  Commit & Push:');
console.log('   git add . && git commit -m "Phase 6: Connect frontend to GAS API" && git push');
console.log('');
console.log('4️⃣  Vercel akan rebuild otomatis dengan env baru.');
console.log('');
console.log('🧪 CARA MEMBUKTIKAN INTEGRASI BERHASIL:');
console.log('   1. Buka Google Sheets → sheet Portfolio');
console.log('   2. Ubah title "Sistem Manajemen Inventaris" jadi "Sistem Inventaris v2"');
console.log('   3. Refresh https://kastriva-portfolio.vercel.app/portfolio');
console.log('   4. Judul di website BERUBAH → data sudah dari Sheets! ✅');