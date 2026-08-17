const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Created: ' + filePath);
}

function appendToFile(filePath, content) {
  if (fs.existsSync(filePath)) {
    fs.appendFileSync(filePath, content, 'utf8');
    console.log('✅ Updated: ' + filePath);
  }
}

console.log('\n🚀 Memulai Phase 3: Repository Pattern & Service Layer...\n');

// 1. Install Zod dependency
console.log('📦 Installing Zod...');
try {
  execSync('npm install zod', { stdio: 'inherit' });
  console.log('✅ Zod installed successfully\n');
} catch (e) {
  console.log('⚠️  Warning: Could not install zod automatically. Please run: npm install zod\n');
}

// 2. API Client Abstraction
const apiClientCode = `/**
 * API Client Abstraction
 * Layer ini memungkinkan swap dari local config ke Google Apps Script
 * tanpa mengubah UI code.
 */

import { config } from "@/data/config";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export interface ApiClientConfig {
  baseUrl: string;
  useLocalStorage?: boolean;
  timeout?: number;
}

class ApiClient {
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = config;
  }

  /**
   * GET request
   * Saat ini fallback ke local, nanti bisa diganti dengan fetch ke GAS
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      // TODO: Replace dengan fetch ke Google Apps Script
      // const url = new URL(this.config.baseUrl + endpoint);
      // if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
      // const response = await fetch(url.toString(), { signal: AbortSignal.timeout(this.config.timeout || 10000) });
      // return await response.json();

      // Fallback: return mock success
      return {
        success: true,
        data: undefined as unknown as T,
        meta: { timestamp: new Date().toISOString() },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        meta: { timestamp: new Date().toISOString() },
      };
    }
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    try {
      // TODO: Replace dengan fetch POST ke Google Apps Script
      // const response = await fetch(this.config.baseUrl + endpoint, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(body),
      //   signal: AbortSignal.timeout(this.config.timeout || 10000),
      // });
      // return await response.json();

      // Fallback: simulate success
      return {
        success: true,
        data: undefined as unknown as T,
        meta: { timestamp: new Date().toISOString() },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        meta: { timestamp: new Date().toISOString() },
      };
    }
  }

  /**
   * Check if API is available
   * Digunakan untuk fallback ke local config
   */
  async isAvailable(): Promise<boolean> {
    // Untuk sekarang, selalu false karena kita masih pakai local config
    // Nantinya akan check ke GAS endpoint
    return false;
  }
}

// Singleton instance
export const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_GAS_API_URL || "",
  useLocalStorage: true,
  timeout: 10000,
});
`;
writeFile('lib/api-client.ts', apiClientCode);

// 3. Zod Validators
const orderValidatorCode = `import { z } from "zod";

/**
 * Zod schema untuk validasi form order
 */
export const orderFormSchema = z.object({
  name: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(100, "Nama maksimal 100 karakter"),
  business: z
    .string()
    .max(100, "Nama bisnis maksimal 100 karakter")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .email("Format email tidak valid"),
  whatsapp: z
    .string()
    .min(10, "Nomor WhatsApp minimal 10 digit")
    .max(20, "Nomor WhatsApp maksimal 20 digit")
    .regex(/^[0-9+\\-\\s]+$/, "Nomor hanya boleh berisi angka"),
  type: z.enum([
    "Website",
    "Landing Page",
    "Company Profile",
    "Web App",
    "Dashboard",
    "Sistem Informasi",
    "Android App",
    "Custom",
  ], {
    errorMap: () => ({ message: "Pilih jenis project" }),
  }),
  budget: z.string().optional(),
  deadline: z.string().max(100).optional(),
  description: z
    .string()
    .min(20, "Deskripsi minimal 20 karakter agar kami paham kebutuhan Anda")
    .max(2000, "Deskripsi maksimal 2000 karakter"),
  features: z.string().max(500).optional(),
  reference: z.string().max(200).optional(),
  // Honeypot field untuk anti-spam
  website: z.string().max(0, "Spam detected").optional(),
});

export type OrderFormData = z.infer<typeof orderFormSchema>;

/**
 * Validasi data order, kembalikan error jika invalid
 */
export function validateOrderForm(data: unknown): {
  success: boolean;
  data?: OrderFormData;
  errors?: Record<string, string>;
} {
  const result = orderFormSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const field = err.path[0] as string;
    errors[field] = err.message;
  });
  
  return { success: false, errors };
}
`;
writeFile('lib/validators/order.ts', orderValidatorCode);

const contactValidatorCode = `import { z } from "zod";

export const contactFormSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  message: z.string().min(10, "Pesan minimal 10 karakter").max(1000),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
`;
writeFile('lib/validators/contact.ts', contactValidatorCode);

const validatorsIndexCode = `export * from "./order";
export * from "./contact";
`;
writeFile('lib/validators/index.ts', validatorsIndexCode);

// 4. Repository Pattern - Portfolio
const portfolioRepoCode = `import { config } from "@/data/config";
import { PortfolioProject, PortfolioCategory } from "@/lib/types/portfolio";

/**
 * Portfolio Repository
 * Abstraction layer untuk data portfolio.
 * Saat ini menggunakan local config, nantinya bisa swap ke Google Apps Script.
 */

export interface PortfolioRepository {
  getAll(): Promise<PortfolioProject[]>;
  getById(id: number): Promise<PortfolioProject | null>;
  getBySlug(slug: string): Promise<PortfolioProject | null>;
  getFeatured(): Promise<PortfolioProject[]>;
  getCategories(): Promise<PortfolioCategory[]>;
  search(query: string): Promise<PortfolioProject[]>;
  filterByCategory(category: string): Promise<PortfolioProject[]>;
}

// Helper: generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

class LocalPortfolioRepository implements PortfolioRepository {
  async getAll(): Promise<PortfolioProject[]> {
    // TODO: Nantinya fetch dari Google Apps Script
    // const response = await apiClient.get<PortfolioProject[]>("/portfolio");
    // if (response.success && response.data) return response.data;
    
    // Fallback ke local config
    return config.portfolio.filter(p => p.published);
  }

  async getById(id: number): Promise<PortfolioProject | null> {
    const all = await this.getAll();
    return all.find(p => p.id === id) || null;
  }

  async getBySlug(slug: string): Promise<PortfolioProject | null> {
    const all = await this.getAll();
    return all.find(p => generateSlug(p.title) === slug) || null;
  }

  async getFeatured(): Promise<PortfolioProject[]> {
    const all = await this.getAll();
    return all.filter(p => p.featured).slice(0, 3);
  }

  async getCategories(): Promise<PortfolioCategory[]> {
    const all = await this.getAll();
    const categoryMap = new Map<string, number>();
    
    all.forEach(p => {
      categoryMap.set(p.category, (categoryMap.get(p.category) || 0) + 1);
    });

    const categories: PortfolioCategory[] = [
      {
        id: "all",
        name: "Semua",
        slug: "all",
        count: all.length,
      },
    ];

    categoryMap.forEach((count, name) => {
      categories.push({
        id: generateSlug(name),
        name,
        slug: generateSlug(name),
        count,
      });
    });

    return categories;
  }

  async search(query: string): Promise<PortfolioProject[]> {
    const all = await this.getAll();
    const lowerQuery = query.toLowerCase();
    
    return all.filter(p => 
      p.title.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      p.technologies.some(t => t.toLowerCase().includes(lowerQuery)) ||
      p.category.toLowerCase().includes(lowerQuery)
    );
  }

  async filterByCategory(category: string): Promise<PortfolioProject[]> {
    const all = await this.getAll();
    if (category === "Semua" || category === "all") return all;
    return all.filter(p => p.category === category);
  }
}

// Export singleton instance
export const portfolioRepository = new LocalPortfolioRepository();
`;
writeFile('lib/repositories/portfolio.repo.ts', portfolioRepoCode);

// 5. Repository Pattern - Order
const orderRepoCode = `import { OrderFormData } from "@/lib/validators/order";
import { getWhatsAppLink } from "@/data/config";

/**
 * Order Repository
 * Menangani submission order.
 * Saat ini kirim ke WhatsApp, nantinya bisa simpan ke Google Sheets via GAS.
 */

export interface OrderRepository {
  submit(data: OrderFormData): Promise<{
    success: boolean;
    orderNumber?: string;
    whatsappUrl?: string;
    error?: string;
  }>;
  generateOrderNumber(): Promise<string>;
}

class LocalOrderRepository implements OrderRepository {
  /**
   * Generate order number dengan format: KAS-YYYY-NNNN
   * Saat ini pakai timestamp, nantinya auto-increment dari Google Sheets
   */
  async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-4);
    return \`KAS-\${year}-\${timestamp}\`;
  }

  /**
   * Submit order
   * Saat ini: format pesan WhatsApp
   * Nantinya: POST ke Google Apps Script + kirim WhatsApp
   */
  async submit(data: OrderFormData): Promise<{
    success: boolean;
    orderNumber?: string;
    whatsappUrl?: string;
    error?: string;
  }> {
    try {
      const orderNumber = await this.generateOrderNumber();
      
      // TODO: Nantinya POST ke GAS
      // const response = await apiClient.post("/orders", { ...data, orderNumber });
      // if (!response.success) throw new Error(response.error);

      // Format pesan WhatsApp
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

      const whatsappUrl = getWhatsAppLink(message);

      // Track event (siap untuk Google Analytics)
      if (typeof window !== "undefined" && (window as any).trackEvent) {
        (window as any).trackEvent("order_submitted", {
          orderNumber,
          projectType: data.type,
          budget: data.budget,
        });
      }

      return {
        success: true,
        orderNumber,
        whatsappUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Gagal mengirim order",
      };
    }
  }
}

export const orderRepository = new LocalOrderRepository();
`;
writeFile('lib/repositories/order.repo.ts', orderRepoCode);

// 6. Repository Index
const repoIndexCode = `export * from "./portfolio.repo";
export * from "./order.repo";
`;
writeFile('lib/repositories/index.ts', repoIndexCode);

// 7. Service Layer - Portfolio
const portfolioServiceCode = `import { portfolioRepository } from "@/lib/repositories/portfolio.repo";
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
`;
writeFile('lib/services/portfolio.service.ts', portfolioServiceCode);

// 8. Service Layer - Order
const orderServiceCode = `import { orderRepository } from "@/lib/repositories/order.repo";
import { OrderFormData, validateOrderForm } from "@/lib/validators/order";

/**
 * Order Service
 * Business logic untuk order system.
 */

export interface SubmitOrderResult {
  success: boolean;
  orderNumber?: string;
  whatsappUrl?: string;
  errors?: Record<string, string>;
  error?: string;
}

export class OrderService {
  /**
   * Submit order dengan validasi
   */
  static async submit(data: unknown): Promise<SubmitOrderResult> {
    // Step 1: Validasi
    const validation = validateOrderForm(data);
    if (!validation.success) {
      return {
        success: false,
        errors: validation.errors,
      };
    }

    // Step 2: Honeypot check (anti-spam)
    if ((data as any).website && (data as any).website.length > 0) {
      return {
        success: false,
        error: "Spam detected",
      };
    }

    // Step 3: Rate limiting (client-side check)
    const lastSubmit = localStorage.getItem("lastOrderSubmit");
    const now = Date.now();
    if (lastSubmit && now - parseInt(lastSubmit) < 30000) {
      return {
        success: false,
        error: "Terlalu cepat. Silakan tunggu 30 detik sebelum mengirim lagi.",
      };
    }

    // Step 4: Submit ke repository
    const result = await orderRepository.submit(validation.data!);
    
    if (result.success) {
      localStorage.setItem("lastOrderSubmit", now.toString());
    }

    return result;
  }

  /**
   * Generate order number preview
   */
  static async previewOrderNumber(): Promise<string> {
    return orderRepository.generateOrderNumber();
  }
}
`;
writeFile('lib/services/order.service.ts', orderServiceCode);

// 9. Service Index
const serviceIndexCode = `export * from "./portfolio.service";
export * from "./order.service";
`;
writeFile('lib/services/index.ts', serviceIndexCode);

// 10. Custom Hooks - usePortfolio
const usePortfolioHookCode = `"use client";
import { useState, useEffect, useCallback } from "react";
import { PortfolioService } from "@/lib/services/portfolio.service";
import { PortfolioProject, PortfolioCategory } from "@/lib/types/portfolio";

interface UsePortfolioReturn {
  projects: PortfolioProject[];
  categories: PortfolioCategory[];
  filteredProjects: PortfolioProject[];
  loading: boolean;
  error: string | null;
  activeCategory: string;
  searchQuery: string;
  setCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  refresh: () => Promise<void>;
}

export function usePortfolio(): UsePortfolioReturn {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [categories, setCategories] = useState<PortfolioCategory[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [allProjects, allCategories] = await Promise.all([
        PortfolioService.getAll(),
        PortfolioService.getCategories(),
      ]);
      setProjects(allProjects);
      setCategories(allCategories);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat portfolio");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Filter ketika category atau search berubah
  useEffect(() => {
    PortfolioService.filterAndSearch(activeCategory, searchQuery)
      .then(setFilteredProjects)
      .catch(err => setError(err.message));
  }, [activeCategory, searchQuery, projects]);

  const setCategory = useCallback((category: string) => {
    setActiveCategory(category);
  }, []);

  return {
    projects,
    categories,
    filteredProjects,
    loading,
    error,
    activeCategory,
    searchQuery,
    setCategory,
    setSearchQuery,
    refresh,
  };
}
`;
writeFile('lib/hooks/usePortfolio.ts', usePortfolioHookCode);

// 11. Custom Hooks - useOrder
const useOrderHookCode = `"use client";
import { useState, useCallback } from "react";
import { OrderService, SubmitOrderResult } from "@/lib/services/order.service";
import { OrderFormData } from "@/lib/validators/order";

interface UseOrderReturn {
  submit: (data: unknown) => Promise<SubmitOrderResult>;
  submitting: boolean;
  lastResult: SubmitOrderResult | null;
  reset: () => void;
}

export function useOrder(): UseOrderReturn {
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<SubmitOrderResult | null>(null);

  const submit = useCallback(async (data: unknown): Promise<SubmitOrderResult> => {
    setSubmitting(true);
    try {
      const result = await OrderService.submit(data);
      setLastResult(result);
      return result;
    } catch (err) {
      const errorResult: SubmitOrderResult = {
        success: false,
        error: err instanceof Error ? err.message : "Gagal mengirim order",
      };
      setLastResult(errorResult);
      return errorResult;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLastResult(null);
  }, []);

  return { submit, submitting, lastResult, reset };
}
`;
writeFile('lib/hooks/useOrder.ts', useOrderHookCode);

// 12. Hooks Index
const hookIndexCode = `export * from "./usePortfolio";
export * from "./useOrder";
`;
writeFile('lib/hooks/index.ts', hookIndexCode);

// 13. Analytics utility
const analyticsCode = `/**
 * Analytics tracking abstraction
 * Siap diintegrasikan dengan Google Analytics / Plausible / dll
 */

type EventName = 
  | "portfolio_view"
  | "portfolio_demo_click"
  | "portfolio_order_click"
  | "order_started"
  | "order_submitted"
  | "whatsapp_click"
  | "contact_submitted"
  | "service_consult";

interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

declare global {
  interface Window {
    trackEvent?: (name: EventName, properties?: EventProperties) => void;
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Track event ke analytics provider
 * Saat ini hanya console.log, siap diintegrasikan ke GA4
 */
export function trackEvent(name: EventName, properties?: EventProperties): void {
  // Log untuk development
  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics]", name, properties);
  }

  // TODO: Integrasikan dengan Google Analytics 4
  // if (typeof window !== "undefined" && window.gtag) {
  //   window.gtag("event", name, properties);
  // }

  // Simpan ke window object untuk diakses global
  if (typeof window !== "undefined") {
    window.trackEvent = trackEvent;
  }
}

// Auto-register saat module diimport
if (typeof window !== "undefined") {
  window.trackEvent = trackEvent;
}
`;
writeFile('lib/analytics.ts', analyticsCode);

// 14. Loading & Error components
const loadingSpinnerCode = `interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-3",
  };

  return (
    <div
      className={\`inline-block animate-spin rounded-full border-primary-600 border-t-transparent \${sizeClasses[size]} \${className}\`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
`;
writeFile('components/ui/LoadingSpinner.tsx', loadingSpinnerCode);

const emptyStateCode = `import { Package, RefreshCw } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        {icon || <Package className="text-slate-400" size={32} />}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      {description && (
        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
        >
          <RefreshCw size={16} />
          {action.label}
        </button>
      )}
    </div>
  );
}
`;
writeFile('components/ui/EmptyState.tsx', emptyStateCode);

const errorStateCode = `import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({ 
  title = "Terjadi Kesalahan", 
  message, 
  onRetry 
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
        <AlertCircle className="text-red-500" size={32} />
      </div>
      <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
        >
          <RefreshCw size={16} />
          Coba Lagi
        </button>
      )}
    </div>
  );
}
`;
writeFile('components/ui/ErrorState.tsx', errorStateCode);

const uiIndexCode = `export { default as LoadingSpinner } from "./LoadingSpinner";
export { default as EmptyState } from "./EmptyState";
export { default as ErrorState } from "./ErrorState";
`;
writeFile('components/ui/index.ts', uiIndexCode);

// 15. Update Portfolio component untuk menggunakan service layer
const updatedPortfolioCode = `"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ExternalLink, Calendar, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePortfolio } from "@/lib/hooks/usePortfolio";
import { PortfolioService } from "@/lib/services/portfolio.service";
import { LoadingSpinner, EmptyState, ErrorState } from "@/components/ui";
import { PortfolioProject } from "@/lib/types/portfolio";

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function Portfolio() {
  const {
    categories,
    filteredProjects,
    loading,
    error,
    activeCategory,
    searchQuery,
    setCategory,
    setSearchQuery,
    refresh,
  } = usePortfolio();

  const handleProjectClick = (project: PortfolioProject) => {
    PortfolioService.trackView(project.id, project.title);
  };

  const handleDemoClick = (project: PortfolioProject) => {
    PortfolioService.trackDemoClick(project.id, project.title);
  };

  if (loading) {
    return (
      <section id="portfolio" className="py-20 bg-slate-50 dark:bg-dark-surface/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center justify-center py-20">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-slate-600 dark:text-slate-400">Memuat portfolio...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="portfolio" className="py-20 bg-slate-50 dark:bg-dark-surface/50">
        <div className="container mx-auto px-4 md:px-6">
          <ErrorState message={error} onRetry={refresh} />
        </div>
      </section>
    );
  }

  return (
    <section id="portfolio" className="py-20 bg-slate-50 dark:bg-dark-surface/50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Project yang Pernah Saya Buat</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Beberapa hasil kerja terbaik yang telah membantu klien mencapai tujuan digital mereka.
          </p>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.name)}
                className={\`px-4 py-2 rounded-full text-sm font-medium transition-all \${
                  activeCategory === cat.name
                    ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20"
                    : "bg-white dark:bg-dark-bg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
                }\`}
              >
                {cat.name} {cat.count > 0 && \`(\${cat.count})\`}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white dark:bg-dark-bg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>
        </div>

        {/* Grid */}
        {filteredProjects.length === 0 ? (
          <EmptyState
            title="Project tidak ditemukan"
            description="Coba ubah filter atau kata kunci pencarian Anda."
            icon={<ImageIcon className="text-slate-400" size={32} />}
            action={{
              label: "Reset Filter",
              onClick: () => {
                setCategory("Semua");
                setSearchQuery("");
              },
            }}
          />
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredProjects.map((project) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="group bg-white dark:bg-dark-bg rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:shadow-primary-900/5 transition-all duration-300 hover:-translate-y-1"
                >
                  <Link
                    href={\`/portfolio/\${generateSlug(project.title)}\`}
                    onClick={() => handleProjectClick(project)}
                    className="block relative h-48 bg-slate-200 dark:bg-slate-800 overflow-hidden"
                  >
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      onError={(e) => {
                        // Fallback jika image gagal dimuat
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded-md">
                        {project.category}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar size={12} /> {project.year}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary-600 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.technologies.slice(0, 3).map((tech, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      {project.demoUrl && project.demoUrl !== "#" && (
                        <a
                          href={project.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDemoClick(project);
                          }}
                          className="flex-1 text-center py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                        >
                          <ExternalLink size={16} /> Live Demo
                        </a>
                      )}
                      <Link
                        href={\`/portfolio/\${generateSlug(project.title)}\`}
                        onClick={() => handleProjectClick(project)}
                        className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg text-sm font-medium transition-colors text-center"
                      >
                        Detail
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </section>
  );
}
`;
writeFile('components/Portfolio.tsx', updatedPortfolioCode);

// 16. Update SmartOrderForm dengan validasi Zod dan service layer
const updatedSmartOrderFormCode = `"use client";
import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { config } from "@/data/config";
import { useOrder } from "@/lib/hooks/useOrder";
import { OrderFormData } from "@/lib/validators/order";
import { trackEvent } from "@/lib/analytics";

function OrderFormContent() {
  const searchParams = useSearchParams();
  const portfolioId = searchParams.get("portfolio");
  const serviceType = searchParams.get("service");

  const portfolioProject = portfolioId
    ? config.portfolio.find((p) => String(p.id) === portfolioId)
    : null;

  const { submit, submitting, lastResult, reset } = useOrder();
  const [success, setSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: "",
    business: "",
    email: "",
    whatsapp: "",
    type: serviceType || (portfolioProject ? portfolioProject.category : "Website"),
    budget: "",
    deadline: "",
    description: portfolioProject
      ? \`Saya tertarik dengan konsep project "\${portfolioProject.title}" dan ingin membuat website serupa.\`
      : "",
    features: portfolioProject ? portfolioProject.features.join(", ") : "",
    reference: portfolioProject ? portfolioProject.title : "",
    website: "", // Honeypot field
  });

  useEffect(() => {
    if (serviceType) {
      setFormData((prev) => ({ ...prev, type: serviceType }));
    }
  }, [serviceType]);

  useEffect(() => {
    trackEvent("order_started", {
      source: portfolioProject ? "portfolio" : "direct",
      portfolioId: portfolioId || undefined,
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    reset();

    const result = await submit(formData);

    if (result.success && result.whatsappUrl && result.orderNumber) {
      setOrderNumber(result.orderNumber);
      setSuccess(true);
      // Buka WhatsApp di tab baru
      window.open(result.whatsappUrl, "_blank");
      // Reset form setelah 3 detik
      setTimeout(() => {
        setFormData({
          name: "",
          business: "",
          email: "",
          whatsapp: "",
          type: "Website",
          budget: "",
          deadline: "",
          description: "",
          features: "",
          reference: "",
          website: "",
        });
        setSuccess(false);
      }, 5000);
    } else if (result.errors) {
      setFieldErrors(result.errors);
    }
  };

  const inputClass = (field: string) =>
    \`w-full px-4 py-3 rounded-xl bg-white dark:bg-dark-bg border \${
      fieldErrors[field]
        ? "border-red-500 focus:ring-red-500"
        : "border-slate-200 dark:border-slate-700 focus:ring-primary-500"
    } focus:outline-none focus:ring-2 transition-all text-sm\`;

  return (
    <div className="container mx-auto px-4 md:px-6 max-w-4xl">
      {portfolioProject && (
        <div className="mb-6 p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-primary-600 dark:text-primary-400 flex-shrink-0" size={20} />
            <div>
              <p className="text-sm font-semibold text-primary-900 dark:text-primary-100">
                Referensi Project: {portfolioProject.title}
              </p>
              <p className="text-xs text-primary-700 dark:text-primary-300">
                Form sudah diisi otomatis berdasarkan project ini
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Mulai Project Anda</h2>
        <p className="text-slate-600 dark:text-slate-400">
          Isi form di bawah ini untuk mendiskusikan kebutuhan digital Anda.
        </p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="bg-white dark:bg-dark-bg p-6 md:p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 space-y-5"
      >
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-4 rounded-xl flex items-start gap-3 border border-green-200 dark:border-green-800">
            <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Order berhasil dikirim!</p>
              <p className="text-sm mt-1">
                Nomor Order: <span className="font-mono">{orderNumber}</span>
              </p>
              <p className="text-sm">WhatsApp telah dibuka di tab baru.</p>
            </div>
          </div>
        )}

        {lastResult?.error && !success && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-xl flex items-center gap-3 border border-red-200 dark:border-red-800">
            <AlertCircle size={20} />
            <p>{lastResult.error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium mb-2">Nama Lengkap *</label>
            <input
              required
              type="text"
              className={inputClass("name")}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            {fieldErrors.name && (
              <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Nama Bisnis</label>
            <input
              type="text"
              className={inputClass("business")}
              value={formData.business}
              onChange={(e) => setFormData({ ...formData, business: e.target.value })}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium mb-2">Email *</label>
            <input
              required
              type="email"
              className={inputClass("email")}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            {fieldErrors.email && (
              <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">WhatsApp *</label>
            <input
              required
              type="tel"
              className={inputClass("whatsapp")}
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
            />
            {fieldErrors.whatsapp && (
              <p className="text-xs text-red-500 mt-1">{fieldErrors.whatsapp}</p>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-medium mb-2">Jenis Project *</label>
            <select
              required
              className={inputClass("type")}
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              {[
                "Website",
                "Landing Page",
                "Company Profile",
                "Web App",
                "Dashboard",
                "Sistem Informasi",
                "Android App",
                "Custom",
              ].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Budget</label>
            <select
              className={inputClass("budget")}
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            >
              <option value="">Pilih Range</option>
              <option value="< 5 Juta">{"<"} 5 Juta</option>
              <option value="5 - 15 Juta">5 - 15 Juta</option>
              <option value="15 - 50 Juta">15 - 50 Juta</option>
              <option value="> 50 Juta">{">"} 50 Juta</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Deadline</label>
            <input
              type="text"
              placeholder="Contoh: 1 bulan"
              className={inputClass("deadline")}
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Deskripsi *</label>
          <textarea
            required
            rows={4}
            className={inputClass("description")}
            placeholder="Jelaskan kebutuhan Anda (minimal 20 karakter)..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          {fieldErrors.description && (
            <p className="text-xs text-red-500 mt-1">{fieldErrors.description}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Fitur yang Dibutuhkan</label>
          <input
            type="text"
            className={inputClass("features")}
            placeholder="Contoh: Login, Payment Gateway"
            value={formData.features}
            onChange={(e) => setFormData({ ...formData, features: e.target.value })}
          />
        </div>

        {/* Honeypot - hidden from users, trap for bots */}
        <div style={{ display: "none" }} aria-hidden="true">
          <label>Website</label>
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          />
        </div>

        <button
          disabled={submitting}
          type="submit"
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20"
        >
          {submitting ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Send size={20} />
          )}
          {submitting ? "Mengirim..." : "Kirim Permintaan Project"}
        </button>

        <p className="text-xs text-center text-slate-500 mt-4">
          *Data Anda aman. Kami akan membalas dalam waktu 1x24 jam pada hari kerja.
        </p>
      </motion.form>
    </div>
  );
}

export default function SmartOrderForm() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center">
          <Loader2 className="animate-spin mx-auto" size={32} />
        </div>
      }
    >
      <OrderFormContent />
    </Suspense>
  );
}
`;
writeFile('components/order/SmartOrderForm.tsx', updatedSmartOrderFormCode);

// 17. Environment file template
const envExampleCode = `# Google Apps Script API URL (akan dikonfigurasi di Phase 11)
NEXT_PUBLIC_GAS_API_URL=

# Analytics (optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=

# Environment
NEXT_PUBLIC_APP_ENV=development
`;
writeFile('.env.example', envExampleCode);

// 18. Documentation
const readmeAddition = `

## 🏗️ Phase 3: Architecture (Repository Pattern)

Website ini menggunakan **3-layer architecture** untuk maintainability dan scalability:

\`\`\`
UI Components
    ↓
Service Layer (business logic)
    ↓
Repository Layer (data source)
    ↓
Data Source (Local Config / Google Apps Script)
\`\`\`

### File Structure:
- \`lib/api-client.ts\` - HTTP client abstraction
- \`lib/validators/\` - Zod validation schemas
- \`lib/repositories/\` - Data source abstraction
- \`lib/services/\` - Business logic
- \`lib/hooks/\` - Custom React hooks
- \`lib/analytics.ts\` - Analytics tracking
- \`components/ui/\` - Reusable UI components (Loading, Empty, Error states)

### Swap to Google Apps Script:
Ketika backend GAS sudah siap (Phase 11), cukup ubah implementasi di \`lib/repositories/\` tanpa mengubah UI.
`;

if (fs.existsSync('README.md')) {
  appendToFile('README.md', readmeAddition);
} else {
  writeFile('README.md', `# Kastriva Portfolio\n\nProfessional Digital Service Platform.\n${readmeAddition}`);
}

console.log('\n🎉 Phase 3: Repository Pattern & Service Layer berhasil diimplementasikan!');
console.log('\n📌 YANG DITAMBAHKAN:');
console.log('✅ Zod validation untuk form order');
console.log('✅ Repository Pattern (portfolio, order)');
console.log('✅ Service Layer dengan business logic');
console.log('✅ Custom Hooks (usePortfolio, useOrder)');
console.log('✅ API Client abstraction (siap swap ke GAS)');
console.log('✅ Loading, Empty, Error state components');
console.log('✅ Analytics tracking utility');
console.log('✅ Honeypot anti-spam di form');
console.log('✅ Rate limiting client-side');
console.log('✅ Order number generator (KAS-YYYY-NNNN)');
console.log('\n📌 LANGKAH SELANJUTNYA:');
console.log('1. Test: npm run dev');
console.log('2. Coba submit order (akan tervalidasi dengan Zod)');
console.log('3. Coba filter portfolio (menggunakan service layer)');
console.log('4. Commit: git add . && git commit -m "Phase 3: Repository Pattern"');
console.log('5. Push: git push');
console.log('\n💡 TEST CASES:');
console.log('- Submit order dengan nama terlalu pendek → error validation');
console.log('- Submit order 2x dalam 30 detik → rate limit error');
console.log('- Filter portfolio → menggunakan service layer');
console.log('- Klik project → track analytics event');