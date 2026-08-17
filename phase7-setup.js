const fs = require('fs');
const path = require('path');

function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Created: ' + filePath);
}

console.log('\n🚀 Memulai Phase 7: Order System End-to-End...\n');

// ====== 1. TAMBAHAN GOOGLE APPS SCRIPT (paste ke editor GAS) ======

const gasOrderEnhancements = `/**
 * ORDER ENHANCEMENTS (paste ke file Orders.gs Anda, TAMBAHKAN di bawah kode yang sudah ada)
 * 
 * Fitur baru:
 * - getOrderByNumber: ambil order by nomor order (untuk tracking)
 * - sendConfirmationEmail: kirim email ke customer setelah order dibuat
 */

/**
 * Get order by order number (PUBLIC - untuk customer tracking)
 */
Orders.getByOrderNumber = function(orderNumber) {
  try {
    if (!orderNumber || !/^KAS-\\d{4}-\\d{4}$/.test(orderNumber)) {
      return { success: false, error: 'Format nomor order tidak valid' };
    }
    
    const sheet = Config.getSheet('Orders');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][1] === orderNumber) { // Column B = orderNumber
        const obj = {};
        headers.forEach((header, j) => {
          obj[header] = rows[i][j];
        });
        
        // Get related project if exists
        const projectsSheet = Config.getSheet('Projects');
        const projectsData = projectsSheet.getDataRange().getValues();
        const projectsHeaders = projectsData[0];
        let relatedProject = null;
        
        for (let p = 1; p < projectsData.length; p++) {
          if (projectsData[p][1] === obj.id) { // orderId match
            const proj = {};
            projectsHeaders.forEach((h, j) => {
              proj[h] = projectsData[p][j];
            });
            relatedProject = proj;
            break;
          }
        }
        
        // Get updates if project exists
        let updates = [];
        if (relatedProject) {
          const updatesSheet = Config.getSheet('ProjectUpdates');
          const updatesData = updatesSheet.getDataRange().getValues();
          const updatesHeaders = updatesData[0];
          updates = updatesData.slice(1)
            .filter(row => row[1] === relatedProject.id)
            .map(row => {
              const u = {};
              updatesHeaders.forEach((h, j) => { u[h] = row[j]; });
              return u;
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        
        return {
          success: true,
          data: {
            order: obj,
            project: relatedProject,
            updates: updates
          }
        };
      }
    }
    
    return { success: false, error: 'Order tidak ditemukan' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Send confirmation email ke customer
 */
Orders.sendConfirmationEmail = function(orderNumber, customerData) {
  try {
    const subject = 'Pesanan Anda Diterima - ' + orderNumber + ' | ' + Config.APP_NAME;
    const body = \`Halo \${customerData.name}, 👋

Terima kasih telah menghubungi \${Config.APP_NAME}!

Pesanan Anda telah kami terima dengan detail sebagai berikut:

📋 NOMOR ORDER: \${orderNumber}
📌 Jenis Project: \${customerData.type}
💰 Budget: \${customerData.budget || 'Akan didiskusikan'}
⏰ Deadline: \${customerData.deadline || 'Fleksibel'}

📝 DESKRIPSI PROJECT:
\${customerData.description}

🔧 FITUR YANG DIMINTA:
\${customerData.features || '-'}

━━━━━━━━━━━━━━━━━━━━━━━━

⏭️  LANGKAH SELANJUTNYA:
1. Tim kami akan membalas via WhatsApp/email dalam 1x24 jam (hari kerja)
2. Kami akan menjadwalkan sesi konsultasi untuk membahas detail project
3. Setelah scope disepakati, kami akan mengirimkan penawaran resmi (quotation)

🔗 LACAK STATUS ORDER:
Anda dapat melacak status order kapan saja di website kami menggunakan nomor order di atas.

━━━━━━━━━━━━━━━━━━━━━━━━

Jika ada pertanyaan, silakan balas email ini atau hubungi kami via WhatsApp.

Salam hangat,
Tim \${Config.APP_NAME}
\${Config.getSettings ? '' : ''}WhatsApp: \${Config.whatsapp || '-'}
Email: \${Config.email || '-'}\`;

    GmailApp.sendEmail(customerData.email, subject, body, {
      name: Config.APP_NAME,
      replyTo: Config.ADMIN_EMAIL
    });
    
    Utils.logAudit('confirmation_email_sent', 'system', { orderNumber: orderNumber });
    return { success: true };
  } catch (error) {
    Logger.log('Email confirmation error: ' + error.message);
    return { success: false, error: error.message };
  }
};
`;
writeFile('google-apps-script/OrdersEnhancements.gs', gasOrderEnhancements);

// ====== 2. UPDATE ROUTER.GS (paste ke Router.gs Anda) ======

const routerAddition = `// TAMBAHKAN CASE INI KE SWITCH DI Router.gs, di bagian public actions:
// case 'getOrderByNumber':
//   return Orders.getByOrderNumber(params.orderNumber);
// 
// JUGA TAMBAHKAN 'getOrderByNumber' KE ARRAY publicActions
`;
writeFile('google-apps-script/ROUTER_UPDATE_NOTE.txt', routerAddition);

// ====== 3. TYPES - ORDER ======

writeFile('lib/types/order.ts', `export type OrderStatus =
  | "Submitted"
  | "Reviewing"
  | "Discussing"
  | "Quotation"
  | "Approved"
  | "In Progress"
  | "Revision"
  | "Completed"
  | "Cancelled";

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  name: string;
  business: string;
  email: string;
  whatsapp: string;
  projectType: string;
  serviceId?: string;
  portfolioId?: string;
  portfolioTitle?: string;
  budget: string;
  deadline: string;
  description: string;
  features: string;
  referenceUrl?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  orderId: string;
  customerId: string;
  projectName: string;
  description: string;
  status: string;
  progress: number;
  startDate?: string;
  deadline?: string;
  completedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectUpdate {
  id: string;
  projectId: string;
  title: string;
  description: string;
  progress: number;
  status: string;
  createdAt: string;
  createdBy: string;
}

export interface OrderTrackingResult {
  order: Order;
  project?: Project;
  updates: ProjectUpdate[];
}

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "Submitted",
  "Reviewing",
  "Discussing",
  "Quotation",
  "Approved",
  "In Progress",
  "Completed",
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  Submitted: "Diterima",
  Reviewing: "Dalam Review",
  Discussing: "Diskusi",
  Quotation: "Penawaran",
  Approved: "Disetujui",
  "In Progress": "Sedang Dikerjakan",
  Revision: "Revisi",
  Completed: "Selesai",
  Cancelled: "Dibatalkan",
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  Submitted: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Reviewing: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  Discussing: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  Quotation: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  Approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "In Progress": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  Revision: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  Completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  Cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};
`);

// ====== 4. GAS CLIENT - tambah helper ======

writeFile('lib/gas-client.ts', `/**
 * Google Apps Script API Client
 * CORS-safe: POST menggunakan Content-Type text/plain
 */

const GAS_URL = process.env.NEXT_PUBLIC_GAS_API_URL || "";

export function isGasConfigured(): boolean {
  return GAS_URL.length > 0;
}

export function getGasUrl(): string {
  return GAS_URL;
}

export interface GasResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function gasGet<T>(
  action: string,
  params: Record<string, string> = {}
): Promise<GasResponse<T>> {
  if (!isGasConfigured()) {
    return { success: false, error: "GAS API belum dikonfigurasi" };
  }
  try {
    const url = new URL(GAS_URL);
    url.searchParams.set("action", action);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    const res = await fetch(url.toString(), { method: "GET" });
    return (await res.json()) as GasResponse<T>;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

export async function gasPost<T>(
  payload: Record<string, unknown>
): Promise<GasResponse<T>> {
  if (!isGasConfigured()) {
    return { success: false, error: "GAS API belum dikonfigurasi" };
  }
  try {
    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    return (await res.json()) as GasResponse<T>;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}
`);

// ====== 5. UPDATE ORDER REPO (tambah getByOrderNumber) ======

writeFile('lib/repositories/order.repo.ts', `import { OrderFormData } from "@/lib/validators/order";
import { getWhatsAppLink } from "@/data/config";
import { gasPost, gasGet, isGasConfigured } from "@/lib/gas-client";
import { OrderTrackingResult } from "@/lib/types/order";

export interface OrderRepository {
  submit(data: OrderFormData): Promise<{
    success: boolean;
    orderNumber?: string;
    whatsappUrl?: string;
    error?: string;
  }>;
  generateOrderNumber(): Promise<string>;
  getByOrderNumber(orderNumber: string): Promise<OrderTrackingResult | null>;
}

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
        } catch (err) {
          console.warn("GAS submit failed, using local number:", err);
        }
      }

      if (!orderNumber) {
        orderNumber = await this.generateOrderNumber();
      }

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

  async getByOrderNumber(orderNumber: string): Promise<OrderTrackingResult | null> {
    if (!isGasConfigured()) return null;
    try {
      const res = await gasGet<OrderTrackingResult>("getOrderByNumber", {
        orderNumber,
      });
      if (res.success && res.data) return res.data;
      return null;
    } catch {
      return null;
    }
  }
}

export const orderRepository = new HybridOrderRepository();
`);

// ====== 6. ORDER SERVICE ======

writeFile('lib/services/order.service.ts', `import { orderRepository } from "@/lib/repositories/order.repo";
import { OrderFormData, validateOrderForm } from "@/lib/validators/order";
import { OrderTrackingResult } from "@/lib/types/order";

export interface SubmitOrderResult {
  success: boolean;
  orderNumber?: string;
  whatsappUrl?: string;
  errors?: Record<string, string>;
  error?: string;
}

export class OrderService {
  static async submit(data: unknown): Promise<SubmitOrderResult> {
    const validation = validateOrderForm(data);
    if (!validation.success) {
      return { success: false, errors: validation.errors };
    }

    // Honeypot
    if ((data as any).website && (data as any).website.length > 0) {
      return { success: false, error: "Spam detected" };
    }

    // Rate limit (client-side only, server-side validated di GAS)
    if (typeof window !== "undefined") {
      const lastSubmit = localStorage.getItem("lastOrderSubmit");
      const now = Date.now();
      if (lastSubmit && now - parseInt(lastSubmit) < 30000) {
        return {
          success: false,
          error: "Terlalu cepat. Silakan tunggu 30 detik.",
        };
      }
    }

    const result = await orderRepository.submit(validation.data!);

    if (result.success && typeof window !== "undefined") {
      localStorage.setItem("lastOrderSubmit", Date.now().toString());
      // Simpan order number terakhir untuk quick access
      if (result.orderNumber) {
        const history = JSON.parse(
          localStorage.getItem("orderHistory") || "[]"
        );
        history.unshift({
          orderNumber: result.orderNumber,
          timestamp: new Date().toISOString(),
          projectType: validation.data!.type,
        });
        localStorage.setItem(
          "orderHistory",
          JSON.stringify(history.slice(0, 10))
        );
      }
    }

    return result;
  }

  static async trackOrder(
    orderNumber: string
  ): Promise<OrderTrackingResult | null> {
    return orderRepository.getByOrderNumber(orderNumber);
  }

  static getOrderHistory(): Array<{
    orderNumber: string;
    timestamp: string;
    projectType: string;
  }> {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("orderHistory") || "[]");
    } catch {
      return [];
    }
  }
}
`);

// ====== 7. ORDER STATUS BADGE COMPONENT ======

writeFile('components/order/OrderStatusBadge.tsx', `import { OrderStatus, STATUS_LABELS, STATUS_COLORS } from "@/lib/types/order";
import { CheckCircle2 } from "lucide-react";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: "sm" | "md" | "lg";
}

export default function OrderStatusBadge({ status, size = "md" }: OrderStatusBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  return (
    <span
      className={\`inline-flex items-center gap-1.5 rounded-full font-semibold \${STATUS_COLORS[status]} \${sizeClasses[size]}\`}
    >
      <CheckCircle2 size={size === "sm" ? 12 : size === "md" ? 14 : 16} />
      {STATUS_LABELS[status]}
    </span>
  );
}
`);

// ====== 8. ORDER TIMELINE COMPONENT ======

writeFile('components/order/OrderTimeline.tsx', `"use client";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { ORDER_STATUS_FLOW, OrderStatus, STATUS_LABELS } from "@/lib/types/order";

interface OrderTimelineProps {
  currentStatus: OrderStatus;
}

export default function OrderTimeline({ currentStatus }: OrderTimelineProps) {
  const currentIndex = ORDER_STATUS_FLOW.indexOf(currentStatus);
  const isCancelled = currentStatus === "Cancelled";

  return (
    <div className="relative">
      {ORDER_STATUS_FLOW.map((status, index) => {
        const isCompleted = !isCancelled && index < currentIndex;
        const isCurrent = !isCancelled && index === currentIndex;
        const isFuture = !isCancelled && index > currentIndex;

        return (
          <motion.div
            key={status}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative flex items-start gap-4 pb-6 last:pb-0"
          >
            {/* Line connector */}
            {index < ORDER_STATUS_FLOW.length - 1 && (
              <div
                className={\`absolute left-4 top-8 bottom-0 w-0.5 \${
                  isCompleted
                    ? "bg-gradient-to-b from-primary-500 to-primary-300"
                    : "bg-slate-200 dark:bg-slate-700"
                }\`}
              />
            )}

            {/* Icon */}
            <div className="relative z-10 flex-shrink-0">
              {isCompleted && (
                <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
                  <CheckCircle2 size={18} className="text-white" />
                </div>
              )}
              {isCurrent && (
                <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-600/40 ring-4 ring-primary-100 dark:ring-primary-900/50">
                  <Loader2 size={16} className="text-white animate-spin" />
                </div>
              )}
              {isFuture && (
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center">
                  <Circle size={12} className="text-slate-400" />
                </div>
              )}
              {isCancelled && (
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Circle size={12} className="text-red-500" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pt-1">
              <h4
                className={\`font-semibold \${
                  isCurrent
                    ? "text-primary-600 dark:text-primary-400"
                    : isCompleted
                    ? "text-slate-900 dark:text-slate-100"
                    : "text-slate-500 dark:text-slate-500"
                }\`}
              >
                {STATUS_LABELS[status]}
                {isCurrent && (
                  <span className="ml-2 text-xs font-normal text-primary-500">
                    (Sedang berlangsung)
                  </span>
                )}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                {getStepDescription(status)}
              </p>
            </div>
          </motion.div>
        );
      })}

      {isCancelled && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
        >
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">
            Order ini telah dibatalkan
          </p>
        </motion.div>
      )}
    </div>
  );
}

function getStepDescription(status: OrderStatus): string {
  const descriptions: Record<OrderStatus, string> = {
    Submitted: "Pesanan Anda telah kami terima dan masuk ke antrian review",
    Reviewing: "Tim kami sedang mempelajari kebutuhan project Anda",
    Discussing: "Sesi konsultasi untuk memperjelas scope project",
    Quotation: "Kami mengirimkan penawaran resmi untuk Anda review",
    Approved: "Project disetujui dan siap dimulai",
    "In Progress": "Tim developer sedang mengerjakan project Anda",
    Revision: "Sedang dalam tahap revisi berdasarkan feedback",
    Completed: "Project telah selesai dan siap digunakan",
    Cancelled: "Order dibatalkan",
  };
  return descriptions[status];
}
`);

// ====== 9. TRACK ORDER PAGE (client) ======

const trackOrderClientCode = `"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Package, Calendar, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { OrderService } from "@/lib/services/order.service";
import { OrderTrackingResult } from "@/lib/types/order";
import OrderStatusBadge from "@/components/order/OrderStatusBadge";
import OrderTimeline from "@/components/order/OrderTimeline";
import { LoadingSpinner } from "@/components/ui";

export default function TrackOrderClient() {
  const [orderNumber, setOrderNumber] = useState("");
  const [result, setResult] = useState<OrderTrackingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);

    const trimmed = orderNumber.trim().toUpperCase();
    if (!/^KAS-\\d{4}-\\d{4}$/.test(trimmed)) {
      setError("Format nomor order tidak valid. Contoh: KAS-2026-0001");
      return;
    }

    setLoading(true);
    try {
      const data = await OrderService.trackOrder(trimmed);
      if (data) {
        setResult(data);
      } else {
        setError("Order tidak ditemukan. Periksa kembali nomor order Anda.");
      }
    } catch (err) {
      setError("Gagal mengambil data. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const history = OrderService.getOrderHistory();

  return (
    <div className="pt-32 pb-20 min-h-screen bg-slate-50 dark:bg-dark-surface/50">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 mb-4"
          >
            <Search size={16} />
            Order Tracking
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Lacak Status Order Anda
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-600 dark:text-slate-400"
          >
            Masukkan nomor order untuk melihat progress project Anda
          </motion.p>
        </div>

        {/* Search Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onSubmit={handleSubmit}
          className="bg-white dark:bg-dark-bg p-6 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                placeholder="KAS-2026-0001"
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-lg tracking-wide"
                maxLength={13}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white px-8 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Search size={20} />
              )}
              Lacak Order
            </button>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm flex items-center gap-2"
              >
                <AlertCircle size={16} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.form>

        {/* Order History (from localStorage) */}
        {!result && history.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-dark-bg p-6 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6"
          >
            <h3 className="font-semibold mb-3 text-slate-700 dark:text-slate-300">
              Order Terakhir Anda (di perangkat ini)
            </h3>
            <div className="space-y-2">
              {history.slice(0, 5).map((item) => (
                <button
                  key={item.orderNumber}
                  onClick={() => setOrderNumber(item.orderNumber)}
                  className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-surface hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between text-left"
                >
                  <div>
                    <div className="font-mono font-semibold text-primary-600">
                      {item.orderNumber}
                    </div>
                    <div className="text-xs text-slate-500">
                      {item.projectType}
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(item.timestamp).toLocaleDateString("id-ID")}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white dark:bg-dark-bg rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              {/* Order Header */}
              <div className="p-6 bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 border-b border-slate-200 dark:border-slate-800">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      Nomor Order
                    </div>
                    <div className="font-mono text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {result.order.orderNumber}
                    </div>
                  </div>
                  <OrderStatusBadge status={result.order.status} size="lg" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                      <Calendar size={12} /> Tanggal Order
                    </div>
                    <div className="text-sm font-medium">
                      {new Date(result.order.createdAt).toLocaleDateString(
                        "id-ID",
                        { day: "numeric", month: "long", year: "numeric" }
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                      <Package size={12} /> Jenis Project
                    </div>
                    <div className="text-sm font-medium">
                      {result.order.projectType}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                      <Clock size={12} /> Deadline
                    </div>
                    <div className="text-sm font-medium">
                      {result.order.deadline || "Fleksibel"}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                      <CheckCircle2 size={12} /> Customer
                    </div>
                    <div className="text-sm font-medium">
                      {result.order.name}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-bold mb-4 text-lg">Detail Order</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Deskripsi</div>
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {result.order.description}
                    </p>
                  </div>
                  {result.order.features && (
                    <div>
                      <div className="text-xs text-slate-500 mb-1">
                        Fitur yang Diminta
                      </div>
                      <p className="text-slate-700 dark:text-slate-300">
                        {result.order.features}
                      </p>
                    </div>
                  )}
                  {result.order.budget && (
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Budget</div>
                      <p className="text-slate-700 dark:text-slate-300">
                        {result.order.budget}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="p-6">
                <h3 className="font-bold mb-6 text-lg">Progress Order</h3>
                <OrderTimeline currentStatus={result.order.status} />
              </div>

              {/* Project Updates (if any) */}
              {result.updates && result.updates.length > 0 && (
                <div className="p-6 border-t border-slate-200 dark:border-slate-800">
                  <h3 className="font-bold mb-4 text-lg">Update Terbaru</h3>
                  <div className="space-y-3">
                    {result.updates.slice(0, 5).map((update) => (
                      <div
                        key={update.id}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-800"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold">{update.title}</h4>
                          <span className="text-xs text-slate-500">
                            {new Date(update.createdAt).toLocaleDateString(
                              "id-ID"
                            )}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {update.description}
                        </p>
                        {update.progress > 0 && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Progress</span>
                              <span className="font-semibold">
                                {update.progress}%
                              </span>
                            </div>
                            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary-500 to-purple-500 transition-all"
                                style={{ width: \`\${update.progress}%\` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
`;
writeFile('components/order/TrackOrderClient.tsx', trackOrderClientCode);

// ====== 10. TRACK ORDER PAGE ROUTE ======

writeFile('app/(public)/order/track/page.tsx', `import { Metadata } from "next";
import { config } from "@/data/config";
import TrackOrderClient from "@/components/order/TrackOrderClient";

export const metadata: Metadata = {
  title: \`Lacak Order | \${config.brand.name}\`,
  description: "Lacak status order dan progress project Anda di Kastriva.",
};

export default function TrackOrderPage() {
  return <TrackOrderClient />;
}
`);

// ====== 11. SUCCESS PAGE CLIENT ======

const successClientCode = `"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, ExternalLink, MessageCircle, Search, Copy, Check } from "lucide-react";
import Link from "next/link";
import { getWhatsAppLink } from "@/data/config";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber") || "";
  const whatsappUrl = searchParams.get("wa") || "";
  const [copied, setCopied] = useState(false);

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    // Auto open WhatsApp jika ada URL
    if (whatsappUrl) {
      const timer = setTimeout(() => {
        window.open(whatsappUrl, "_blank");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [whatsappUrl]);

  return (
    <div className="pt-32 pb-20 min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-green-900/10 dark:to-dark-bg">
      <div className="container mx-auto px-4 md:px-6 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-dark-bg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 md:p-12 text-center"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-6"
          >
            <CheckCircle2 size={48} className="text-green-500" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl md:text-4xl font-bold mb-3"
          >
            Order Berhasil Dikirim! 🎉
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-slate-600 dark:text-slate-400 mb-8"
          >
            Terima kasih! Tim kami akan menghubungi Anda dalam 1x24 jam.
          </motion.p>

          {/* Order Number Card */}
          {orderNumber && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 rounded-2xl p-6 mb-8 border-2 border-primary-200 dark:border-primary-800"
            >
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                Nomor Order Anda
              </div>
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="font-mono text-2xl md:text-3xl font-bold text-primary-600 dark:text-primary-400">
                  {orderNumber}
                </span>
                <button
                  onClick={copyOrderNumber}
                  className="p-2 rounded-lg bg-white dark:bg-dark-bg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Copy order number"
                >
                  {copied ? (
                    <Check size={18} className="text-green-500" />
                  ) : (
                    <Copy size={18} />
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                💡 Simpan nomor ini untuk melacak status order Anda
              </p>
            </motion.div>
          )}

          {/* Info boxes */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="grid md:grid-cols-3 gap-4 mb-8 text-left"
          >
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-surface">
              <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-2">
                <MessageCircle size={16} className="text-green-600" />
              </div>
              <h4 className="font-semibold text-sm mb-1">WhatsApp</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Tab WhatsApp akan terbuka otomatis
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-surface">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2">
                <CheckCircle2 size={16} className="text-blue-600" />
              </div>
              <h4 className="font-semibold text-sm mb-1">Konfirmasi</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Kami balas dalam 1x24 jam kerja
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-surface">
              <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-2">
                <Search size={16} className="text-primary-600" />
              </div>
              <h4 className="font-semibold text-sm mb-1">Tracking</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Pantau progress order kapan saja
              </p>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle size={18} /> Buka WhatsApp
              </a>
            )}
            {orderNumber && (
              <Link
                href={\`/order/track?orderNumber=\${orderNumber}\`}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Search size={18} /> Lacak Order
              </Link>
            )}
            <Link
              href="/"
              className="flex-1 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
            >
              Kembali ke Beranda
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default function SuccessClient() {
  return (
    <Suspense fallback={<div className="pt-32 pb-20 text-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
`;
writeFile('components/order/SuccessClient.tsx', successClientCode);

// ====== 12. SUCCESS PAGE ROUTE ======

writeFile('app/(public)/order/success/page.tsx', `import { Metadata } from "next";
import { config } from "@/data/config";
import SuccessClient from "@/components/order/SuccessClient";

export const metadata: Metadata = {
  title: \`Order Berhasil | \${config.brand.name}\`,
  description: "Pesanan Anda telah berhasil dikirim.",
};

export default function SuccessPage() {
  return <SuccessClient />;
}
`);

// ====== 13. UPDATE SMART ORDER FORM (redirect ke success page) ======

const updatedSmartOrderFormCode = `"use client";
import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, CheckCircle, AlertCircle, Package } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { config } from "@/data/config";
import { useOrder } from "@/lib/hooks/useOrder";
import { trackEvent } from "@/lib/analytics";
import Link from "next/link";

function OrderFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const portfolioId = searchParams.get("portfolio");
  const serviceType = searchParams.get("service");

  const portfolioProject = portfolioId
    ? config.portfolio.find((p) => String(p.id) === portfolioId)
    : null;

  const { submit, submitting, lastResult, reset } = useOrder();
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
    website: "", // Honeypot
  });

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

    if (result.success && result.orderNumber) {
      // Redirect ke success page dengan order number
      const params = new URLSearchParams();
      params.set("orderNumber", result.orderNumber);
      if (result.whatsappUrl) params.set("wa", result.whatsappUrl);
      router.push(\`/order/success?\${params.toString()}\`);
    } else if (result.errors) {
      setFieldErrors(result.errors);
      // Scroll to first error
      const firstErrorField = Object.keys(result.errors)[0];
      const el = document.querySelector(\`[name="\${firstErrorField}"]\`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
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
      {/* Quick Track Link */}
      <div className="flex justify-end mb-4">
        <Link
          href="/order/track"
          className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          <Package size={16} /> Sudah order? Lacak status di sini
        </Link>
      </div>

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
        {lastResult?.error && (
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
              name="name"
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
              name="business"
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
              name="email"
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
              name="whatsapp"
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
              name="type"
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
              name="budget"
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
              name="deadline"
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
            name="description"
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
            name="features"
            type="text"
            className={inputClass("features")}
            placeholder="Contoh: Login, Payment Gateway"
            value={formData.features}
            onChange={(e) => setFormData({ ...formData, features: e.target.value })}
          />
        </div>

        {/* Honeypot */}
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

// ====== 14. UPDATE NAVBAR (tambah menu Track Order) ======

const updatedNavbarCode = `"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Moon, Sun, ArrowRight, Package } from "lucide-react";
import { useTheme } from "next-themes";
import { config } from "@/data/config";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Services", href: "/services" },
    { name: "Portfolio", href: "/portfolio" },
    { name: "Process", href: "/process" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header
      className={\`fixed top-0 left-0 right-0 z-50 transition-all duration-300 \${
        scrolled ? "glass shadow-sm py-3" : "bg-transparent py-5"
      }\`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold tracking-tight text-gradient">
          {config.brand.name}
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={\`text-sm font-medium transition-colors \${
                isActive(link.href)
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400"
              }\`}
            >
              {link.name}
            </Link>
          ))}
          <Link
            href="/order/track"
            className={\`text-sm font-medium transition-colors flex items-center gap-1 \${
              pathname.startsWith("/order/track")
                ? "text-primary-600 dark:text-primary-400"
                : "text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400"
            }\`}
          >
            <Package size={14} /> Lacak Order
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <Link
            href="/order"
            className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-primary-600/20"
          >
            Mulai Project <ArrowRight size={16} />
          </Link>
        </div>

        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-full left-0 right-0 glass border-t border-slate-200 dark:border-dark-border p-4 shadow-xl"
          >
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={\`text-base font-medium py-2 border-b border-slate-100 dark:border-slate-800 \${
                    isActive(link.href) ? "text-primary-600" : ""
                  }\`}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                href="/order/track"
                className={\`text-base font-medium py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 \${
                  pathname.startsWith("/order/track") ? "text-primary-600" : ""
                }\`}
              >
                <Package size={16} /> Lacak Order
              </Link>
              <Link
                href="/order"
                className="bg-primary-600 text-white text-center py-3 rounded-lg font-semibold mt-2"
              >
                Mulai Project
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
`;
writeFile('components/Navbar.tsx', updatedNavbarCode);

// ====== 15. UPDATE FOOTER (tambah Track Order link) ======

const updatedFooterCode = `import { config } from "@/data/config";
import { Instagram, Github, Globe, MessageCircle, Package } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-50 dark:bg-dark-surface border-t border-slate-200 dark:border-slate-800 pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold text-gradient mb-4">{config.brand.name}</h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-sm mb-6">
              {config.brand.tagline}. Fokus pada kualitas kode, desain modern, dan kepuasan klien.
            </p>
            <div className="flex gap-4">
              <a href={config.brand.socials.instagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white dark:bg-dark-bg border border-slate-200 dark:border-slate-700 hover:text-primary-600 transition-colors">
                <Instagram size={20} />
              </a>
              <a href={config.brand.socials.github} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white dark:bg-dark-bg border border-slate-200 dark:border-slate-700 hover:text-primary-600 transition-colors">
                <Github size={20} />
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-4">Navigasi</h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><Link href="/" className="hover:text-primary-600 transition-colors">Home</Link></li>
              <li><Link href="/services" className="hover:text-primary-600 transition-colors">Services</Link></li>
              <li><Link href="/portfolio" className="hover:text-primary-600 transition-colors">Portfolio</Link></li>
              <li><Link href="/about" className="hover:text-primary-600 transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-primary-600 transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Customer</h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/order" className="hover:text-primary-600 transition-colors flex items-center gap-1">
                  Mulai Project
                </Link>
              </li>
              <li>
                <Link href="/order/track" className="hover:text-primary-600 transition-colors flex items-center gap-1">
                  <Package size={14} /> Lacak Order
                </Link>
              </li>
              <li className="flex items-center gap-2 pt-2">
                <MessageCircle size={14} /> {config.brand.whatsapp}
              </li>
              <li className="flex items-center gap-2">
                <Globe size={14} /> {config.brand.email}
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-200 dark:border-slate-800 pt-8 text-center text-sm text-slate-500">
          © 2026 {config.brand.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
`;
writeFile('components/Footer.tsx', updatedFooterCode);

// ====== 16. UPDATE ROUTER.GS (file lokal untuk referensi) ======

const routerFull = `/**
 * Router - Handle all API endpoints (UPDATED)
 */

const Router = {
  handle: function(action, params, body, method) {
    // Public endpoints
    const publicActions = [
      'getPortfolio',
      'getPortfolioBySlug',
      'getPortfolioCategories',
      'getServices',
      'getSettings',
      'createOrder',
      'getOrderByNumber',  // <-- BARU
      'health'
    ];
    
    // Protected endpoints
    const protectedActions = [
      'getOrders', 'getOrder', 'updateOrderStatus',
      'getCustomers', 'getCustomer',
      'getProjects', 'getProject', 'createProjectUpdate',
      'createQuotation', 'getQuotations',
      'createInvoice', 'getInvoices',
      'sendMessage', 'getMessages',
      'uploadFile',
      'getNotifications', 'markNotificationRead'
    ];
    
    if (!publicActions.includes(action) && !protectedActions.includes(action)) {
      return { success: false, error: 'Invalid action: ' + action };
    }
    
    if (protectedActions.includes(action)) {
      const authResult = Auth.verifyToken(params.token || body.token);
      if (!authResult.success) {
        return { success: false, error: 'Unauthorized: ' + authResult.error };
      }
    }
    
    switch(action) {
      case 'health':
        return { success: true, data: { status: 'ok', timestamp: new Date().toISOString() } };
      case 'getPortfolio':
        return Portfolio.getAll(params);
      case 'getPortfolioBySlug':
        return Portfolio.getBySlug(params.slug);
      case 'getPortfolioCategories':
        return Portfolio.getCategories();
      case 'getServices':
        return Services.getAll();
      case 'getSettings':
        return Settings.getAll();
      case 'createOrder':
        return Orders.create(body);
      case 'getOrderByNumber':  // <-- BARU
        return Orders.getByOrderNumber(params.orderNumber);
      // ... (protected endpoints tetap sama)
      default:
        return { success: false, error: 'Action not implemented: ' + action };
    }
  }
};
`;
writeFile('google-apps-script/Router.gs.new', routerFull);

// ====== 17. UPDATE ORDERS.GS (tambah sendConfirmationEmail call) ======

const ordersCreateUpdate = `/**
 * PENTING: Update function Orders.create di file Orders.gs Anda
 * 
 * TAMBAHKAN baris ini SETELAH insert order berhasil:
 * 
 *   Orders.sendConfirmationEmail(orderNumber, data);
 * 
 * Letakkan setelah sheet.appendRow([...])
 */
`;
writeFile('google-apps-script/ORDERS_CREATE_UPDATE.txt', ordersCreateUpdate);

// ====== 18. DEPLOYMENT INSTRUCTIONS ======

writeFile('PHASE7_GAS_UPDATE_GUIDE.md', `# 🚀 Phase 7: Update Google Apps Script

## File Baru yang Perlu Ditambahkan ke Apps Script

### 1️⃣ Tambahkan endpoint baru ke Router.gs

Buka file **Router.gs** di Apps Script, lalu:

**A. Tambahkan ke array publicActions:**
\\\`\\\`\\\`javascript
const publicActions = [
  'getPortfolio',
  'getPortfolioBySlug',
  'getPortfolioCategories',
  'getServices',
  'getSettings',
  'createOrder',
  'getOrderByNumber',  // <-- TAMBAHKAN INI
  'health'
];
\\\`\\\`\\\`

**B. Tambahkan case baru di switch:**
\\\`\\\`\\\`javascript
case 'getOrderByNumber':
  return Orders.getByOrderNumber(params.orderNumber);
\\\`\\\`\\\`

### 2️⃣ Tambahkan 2 function baru ke Orders.gs

Buka file **Orders.gs**, scroll ke paling bawah, lalu paste:

\\\`\\\`\\\`javascript
// Copy isi file google-apps-script/OrdersEnhancements.gs ke sini
// (berisi: Orders.getByOrderNumber dan Orders.sendConfirmationEmail)
\\\`\\\`\\\`

### 3️⃣ Kirim email konfirmasi setelah order dibuat

Di file **Orders.gs**, cari function **Orders.create**, temukan baris:

\\\`\\\`\\\`javascript
sheet.appendRow([...]);
\\\`\\\`\\\`

**TAMBAHKAN** baris ini **setelahnya**:

\\\`\\\`\\\`javascript
// Kirim email konfirmasi ke customer
Orders.sendConfirmationEmail(orderNumber, data);
\\\`\\\`\\\`

### 4️⃣ Save & Test

1. **Save** (Ctrl+S)
2. **Deploy** → **Manage deployments** → Edit (pencil icon) → **Version: New version** → **Deploy**
3. Test endpoint baru di browser:

\\\`\\\`\\\`
{URL}?action=getOrderByNumber&orderNumber=KAS-2026-0001
\\\`\\\`\\\`

Jika ada order dengan nomor tersebut, akan muncul detail lengkap ✅

## Checklist Frontend

Setelah GAS diupdate:

1. Jalankan \`node phase7-setup.js\`
2. \`npm run dev\` (test di local)
3. Test submit order → harus redirect ke \`/order/success\`
4. Test lacak order di \`/order/track\`
5. Commit & push: \`git add . && git commit -m "Phase 7: Order System End-to-End" && git push\`
`);

console.log('\n🎉 Phase 7: Order System End-to-End berhasil dibuat!');
console.log('');
console.log('📁 FILE YANG DIBUAT/UPDATE:');
console.log('');
console.log('🆕 File baru:');
console.log('  - lib/types/order.ts (types lengkap + status flow)');
console.log('  - components/order/OrderStatusBadge.tsx');
console.log('  - components/order/OrderTimeline.tsx (timeline visual)');
console.log('  - components/order/TrackOrderClient.tsx (halaman lacak order)');
console.log('  - components/order/SuccessClient.tsx (halaman sukses)');
console.log('  - app/(public)/order/track/page.tsx');
console.log('  - app/(public)/order/success/page.tsx');
console.log('  - google-apps-script/OrdersEnhancements.gs (paste ke Orders.gs)');
console.log('  - PHASE7_GAS_UPDATE_GUIDE.md (panduan lengkap)');
console.log('');
console.log('🔄 File diupdate:');
console.log('  - lib/gas-client.ts (tambah getGasUrl)');
console.log('  - lib/repositories/order.repo.ts (tambah getByOrderNumber)');
console.log('  - lib/services/order.service.ts (tambah trackOrder, getOrderHistory)');
console.log('  - components/order/SmartOrderForm.tsx (redirect ke success page)');
console.log('  - components/Navbar.tsx (tambah menu Lacak Order)');
console.log('  - components/Footer.tsx (tambah link Lacak Order)');
console.log('');
console.log('📌 LANGKAH SELANJUTNYA:');
console.log('');
console.log('1️⃣  UPDATE GOOGLE APPS SCRIPT (WAJIB):');
console.log('   Baca file PHASE7_GAS_UPDATE_GUIDE.md untuk detail lengkap');
console.log('   Intinya:');
console.log('   - Tambah getOrderByNumber ke Router.gs');
console.log('   - Paste OrdersEnhancements.gs ke Orders.gs');
console.log('   - Tambah Orders.sendConfirmationEmail di Orders.create');
console.log('   - Deploy ulang dengan version baru');
console.log('');
console.log('2️⃣  TEST LOKAL:');
console.log('   npm run dev');
console.log('   - Submit order → redirect ke /order/success?orderNumber=KAS-...');
console.log('   - Cek email customer (email konfirmasi)');
console.log('   - Buka /order/track → masukkan nomor order → lihat timeline');
console.log('   - Cek Google Sheets → Orders sheet harus ada baris baru');
console.log('');
console.log('3️⃣  COMMIT & PUSH:');
console.log('   git add . && git commit -m "Phase 7: Order System End-to-End" && git push');
console.log('');
console.log('✨ FITUR BARU YANG AKTIF:');
console.log('   ✅ Order disimpan ke Google Sheets dengan nomor unik');
console.log('   ✅ Email konfirmasi otomatis ke customer');
console.log('   ✅ Halaman success yang elegan dengan copy order number');
console.log('   ✅ Halaman lacak order dengan timeline visual');
console.log('   ✅ Order history di localStorage (per device)');
console.log('   ✅ Menu "Lacak Order" di navbar & footer');
console.log('   ✅ Auto-open WhatsApp setelah submit');
console.log('');
console.log('🎯 USER FLOW LENGKAP:');
console.log('   Customer → Form Order → Submit → Google Sheets + Email + WhatsApp');
console.log('   → Redirect ke /order/success → Copy nomor order → Lacak di /order/track');