const fs = require('fs');
const path = require('path');

function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Created: ' + filePath);
}

console.log('\n🚀 Memulai Phase 8: Admin Dashboard...\n');

// ====== 1. AUTH SERVICE ======
writeFile('lib/services/auth.service.ts', `import { gasPost } from "@/lib/gas-client";

const TOKEN_KEY = "kastriva_admin_token";

export interface AdminSession {
  token: string;
  email: string;
  expiresAt: number;
}

/**
 * Admin Auth Service
 * Token diverifikasi SERVER-SIDE oleh GAS di setiap request protected.
 * localStorage hanya menyimpan token (bukan role), sehingga aman.
 */
export class AdminAuthService {
  static async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    const res = await gasPost<AdminSession>({
      action: "login",
      email,
      password,
    });

    if (res.success && res.data && res.data.token) {
      if (typeof window !== "undefined") {
        localStorage.setItem(TOKEN_KEY, JSON.stringify(res.data));
      }
      return { success: true };
    }

    return { success: false, error: res.error || "Email atau password salah" };
  }

  static getSession(): AdminSession | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(TOKEN_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as AdminSession;
      if (!session.token || Date.now() > session.expiresAt) {
        localStorage.removeItem(TOKEN_KEY);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }

  static getToken(): string | null {
    const session = this.getSession();
    return session ? session.token : null;
  }

  static isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  static logout(): void {
    const token = this.getToken();
    if (token) {
      gasPost({ action: "logout", token }).catch(() => {});
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
  }
}
`);

// ====== 2. ADMIN GUARD ======
writeFile('components/admin/AdminGuard.tsx', `"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AdminAuthService } from "@/lib/services/auth.service";
import { LoadingSpinner } from "@/components/ui";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setChecking(false);
      return;
    }
    if (!AdminAuthService.isLoggedIn()) {
      router.replace("/admin/login");
    } else {
      setChecking(false);
    }
  }, [router, pathname, isLoginPage]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-bg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
`);

// ====== 3. ADMIN SIDEBAR ======
writeFile('components/admin/AdminSidebar.tsx', `"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Users,
  LogOut,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { AdminAuthService } from "@/lib/services/auth.service";
import { config } from "@/data/config";

const menu = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Orders", href: "/admin/orders", icon: Package },
  { name: "Customers", href: "/admin/customers", icon: Users },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") return null;

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    AdminAuthService.logout();
    router.push("/admin/login");
  };

  const session = AdminAuthService.getSession();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-white dark:bg-dark-surface border-r border-slate-200 dark:border-slate-800 z-40">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-gradient">{config.brand.name}</div>
              <div className="text-xs text-slate-500">Admin Panel</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={\`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors \${
                isActive(item.href)
                  ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }\`}
            >
              <item.icon size={18} />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-1">
          <div className="px-4 py-2 text-xs text-slate-500 truncate">
            {session ? session.email : ""}
          </div>
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ExternalLink size={16} /> Lihat Website
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-dark-surface border-b border-slate-200 dark:border-slate-800 z-40 flex items-center justify-between px-4">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <ShieldCheck size={16} className="text-white" />
          </div>
          <span className="font-bold text-gradient">Admin</span>
        </Link>
        <nav className="flex items-center gap-1">
          {menu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={\`p-2 rounded-lg \${
                isActive(item.href)
                  ? "bg-primary-600 text-white"
                  : "text-slate-600 dark:text-slate-400"
              }\`}
              aria-label={item.name}
            >
              <item.icon size={18} />
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-red-600"
            aria-label="Logout"
          >
            <LogOut size={18} />
          </button>
        </nav>
      </div>
    </>
  );
}
`);

// ====== 4. ADMIN LAYOUT ======
writeFile('app/admin/layout.tsx', `import AdminGuard from "@/components/admin/AdminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata = {
  title: "Admin | Kastriva",
  description: "Admin panel Kastriva",
  robots: "noindex, nofollow",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-slate-50 dark:bg-dark-bg">
        <AdminSidebar />
        <main className="lg:pl-64 pt-16 lg:pt-0">
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </div>
    </AdminGuard>
  );
}
`);

// ====== 5. LOGIN PAGE ======
writeFile('app/admin/login/page.tsx', `"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { AdminAuthService } from "@/lib/services/auth.service";
import { config } from "@/data/config";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (AdminAuthService.isLoggedIn()) {
      router.replace("/admin");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await AdminAuthService.login(email, password);

    setLoading(false);
    if (res.success) {
      router.push("/admin");
    } else {
      setError(res.error || "Email atau password salah");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-bg px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-dark-bg rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-primary-600 items-center justify-center mb-4 shadow-lg shadow-primary-600/30">
              <ShieldCheck size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold">Admin {config.brand.name}</h1>
            <p className="text-sm text-slate-500 mt-1">
              Masuk untuk mengelola dashboard
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                placeholder="admin@kastriva.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
              {loading ? "Memverifikasi..." : "Masuk"}
            </button>
          </form>

          <p className="text-xs text-center text-slate-400 mt-6">
            🔒 Session diverifikasi server-side. Akses tanpa token akan ditolak.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
`);

// ====== 6. DASHBOARD PAGE ======
writeFile('app/admin/page.tsx', `"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { gasGet } from "@/lib/gas-client";
import { AdminAuthService } from "@/lib/services/auth.service";
import { LoadingSpinner, ErrorState } from "@/components/ui";
import OrderStatusBadge from "@/components/order/OrderStatusBadge";
import { OrderStatus } from "@/lib/types/order";
import {
  Package,
  Users,
  Inbox,
  FolderKanban,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

interface DashboardStats {
  totalOrders: number;
  newOrders: number;
  activeProjects: number;
  completedProjects: number;
  totalCustomers: number;
  pendingQuotations: number;
  statusBreakdown: Record<string, number>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    name: string;
    projectType: string;
    status: OrderStatus;
    createdAt: string;
  }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const token = AdminAuthService.getToken();
    const res = await gasGet<DashboardStats>("getDashboardStats", {
      token: token || "",
    });
    if (res.success && res.data) {
      setStats(res.data);
    } else {
      setError(res.error || "Gagal memuat statistik");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  const cards = [
    {
      label: "Total Orders",
      value: stats ? stats.totalOrders : 0,
      icon: Inbox,
      color: "bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400",
    },
    {
      label: "Order Baru",
      value: stats ? stats.newOrders : 0,
      icon: Package,
      color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    },
    {
      label: "Active Projects",
      value: stats ? stats.activeProjects : 0,
      icon: FolderKanban,
      color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
    },
    {
      label: "Customers",
      value: stats ? stats.totalCustomers : 0,
      icon: Users,
      color: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Ringkasan aktivitas bisnis Anda
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card, i) => (
          <div
            key={i}
            className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200 dark:border-slate-800"
          >
            <div className={\`inline-flex p-2.5 rounded-xl mb-3 \${card.color}\`}>
              <card.icon size={20} />
            </div>
            <div className="text-3xl font-bold mb-1">{card.value}</div>
            <div className="text-sm text-slate-500">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-lg">Order Terbaru</h2>
          <Link
            href="/admin/orders"
            className="text-sm text-primary-600 font-medium flex items-center gap-1 hover:gap-2 transition-all"
          >
            Lihat Semua <ArrowRight size={14} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Jenis</th>
                <th className="px-5 py-3 font-medium">Tanggal</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {stats && stats.recentOrders.length > 0 ? (
                stats.recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-slate-100 dark:border-slate-800/50 last:border-0"
                  >
                    <td className="px-5 py-4 font-mono font-semibold text-primary-600">
                      {order.orderNumber}
                    </td>
                    <td className="px-5 py-4">{order.name}</td>
                    <td className="px-5 py-4">{order.projectType}</td>
                    <td className="px-5 py-4 text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-5 py-4">
                      <OrderStatusBadge status={order.status} size="sm" />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                    Belum ada order masuk. Bagikan website Anda untuk mendapatkan customer pertama! 🚀
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
`);

// ====== 7. ORDERS MANAGEMENT PAGE ======
writeFile('app/admin/orders/page.tsx', `"use client";
import { useEffect, useState, useCallback } from "react";
import { gasGet, gasPost } from "@/lib/gas-client";
import { AdminAuthService } from "@/lib/services/auth.service";
import OrderStatusBadge from "@/components/order/OrderStatusBadge";
import { OrderStatus } from "@/lib/types/order";
import { LoadingSpinner, ErrorState, EmptyState } from "@/components/ui";
import { Search, RefreshCw, MessageCircle, Loader2 } from "lucide-react";

const ALL_STATUSES: OrderStatus[] = [
  "Submitted",
  "Reviewing",
  "Discussing",
  "Quotation",
  "Approved",
  "In Progress",
  "Revision",
  "Completed",
  "Cancelled",
];

interface AdminOrder {
  id: string;
  orderNumber: string;
  name: string;
  business: string;
  email: string;
  whatsapp: string;
  projectType: string;
  budget: string;
  deadline: string;
  description: string;
  status: OrderStatus;
  createdAt: string;
}

function waLink(number: string): string {
  let n = String(number).replace(/[^0-9]/g, "");
  if (n.startsWith("0")) n = "62" + n.slice(1);
  return "https://wa.me/" + n;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const token = AdminAuthService.getToken();
    const params: Record<string, string> = { token: token || "" };
    if (statusFilter) params.status = statusFilter;
    if (search) params.search = search;

    const res = await gasGet<AdminOrder[]>("getOrders", params);
    if (res.success && res.data) {
      setOrders(res.data);
    } else {
      setError(res.error || "Gagal memuat orders");
    }
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => load(), search ? 400 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const changeStatus = async (id: string, status: OrderStatus) => {
    setUpdatingId(id);
    const token = AdminAuthService.getToken();
    const res = await gasPost({ action: "updateOrderStatus", token, id, status });
    setUpdatingId("");
    if (res.success) {
      load();
    } else {
      alert(res.error || "Gagal update status");
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Orders</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Kelola semua pesanan customer
          </p>
        </div>
        <button
          onClick={load}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Refresh"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama / nomor order / email..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 rounded-xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Semua Status</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : orders.length === 0 ? (
          <EmptyState
            title="Tidak ada order"
            description="Belum ada order yang cocok dengan filter Anda."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Jenis</th>
                  <th className="px-5 py-3 font-medium">Budget</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/30"
                  >
                    <td className="px-5 py-4">
                      <div className="font-mono font-semibold text-primary-600">
                        {order.orderNumber}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString("id-ID")}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium">{order.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {order.business || order.email}
                      </div>
                    </td>
                    <td className="px-5 py-4">{order.projectType}</td>
                    <td className="px-5 py-4 text-slate-500">
                      {order.budget || "-"}
                    </td>
                    <td className="px-5 py-4">
                      <OrderStatusBadge status={order.status} size="sm" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <select
                            value={order.status}
                            disabled={updatingId === order.id}
                            onChange={(e) =>
                              changeStatus(order.id, e.target.value as OrderStatus)
                            }
                            className="px-3 py-2 pr-8 rounded-lg bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                          >
                            {ALL_STATUSES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          {updatingId === order.id && (
                            <Loader2
                              size={14}
                              className="animate-spin absolute right-2 top-1/2 -translate-y-1/2 text-primary-500"
                            />
                          )}
                        </div>
                        <a
                          href={waLink(order.whatsapp)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 transition-colors"
                          aria-label="Chat WhatsApp"
                        >
                          <MessageCircle size={16} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500 mt-4">
        💡 Mengubah status di sini akan langsung terlihat oleh customer di halaman Lacak Order.
      </p>
    </div>
  );
}
`);

// ====== 8. CUSTOMERS PAGE ======
writeFile('app/admin/customers/page.tsx', `"use client";
import { useEffect, useState, useCallback } from "react";
import { gasGet } from "@/lib/gas-client";
import { AdminAuthService } from "@/lib/services/auth.service";
import { LoadingSpinner, ErrorState, EmptyState } from "@/components/ui";
import { MessageCircle, Mail, RefreshCw } from "lucide-react";

interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  business: string;
  status: string;
  createdAt: string;
  lastActivity: string;
}

function waLink(number: string): string {
  let n = String(number).replace(/[^0-9]/g, "");
  if (n.startsWith("0")) n = "62" + n.slice(1);
  return "https://wa.me/" + n;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const token = AdminAuthService.getToken();
    const res = await gasGet<AdminCustomer[]>("getCustomers", {
      token: token || "",
    });
    if (res.success && res.data) {
      setCustomers(res.data);
    } else {
      setError(res.error || "Gagal memuat customers");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Customers</h1>
          <p className="text-slate-600 dark:text-slate-400">
            {customers.length} customer terdaftar
          </p>
        </div>
        <button
          onClick={load}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Refresh"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : customers.length === 0 ? (
          <EmptyState
            title="Belum ada customer"
            description="Customer akan otomatis terdaftar saat membuat order pertama."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                  <th className="px-5 py-3 font-medium">Nama</th>
                  <th className="px-5 py-3 font-medium">Kontak</th>
                  <th className="px-5 py-3 font-medium">Bisnis</th>
                  <th className="px-5 py-3 font-medium">Terdaftar</th>
                  <th className="px-5 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/30"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold">
                          {c.name ? c.name.charAt(0).toUpperCase() : "?"}
                        </div>
                        <div className="font-medium">{c.name}</div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <Mail size={12} /> {c.email}
                        </span>
                        <span className="text-slate-500 text-xs">{c.whatsapp}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">{c.business || "-"}</td>
                    <td className="px-5 py-4 text-slate-500">
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleDateString("id-ID")
                        : "-"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <a
                          href={waLink(c.whatsapp)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 transition-colors"
                          aria-label="Chat WhatsApp"
                        >
                          <MessageCircle size={16} />
                        </a>
                        <a
                          href={"mailto:" + c.email}
                          className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors"
                          aria-label="Kirim email"
                        >
                          <Mail size={16} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
`);

// ====== 9. GAS Stats Module ======
writeFile('google-apps-script/Stats.gs', `/**
 * KASTRIVA - Stats Module (Phase 8)
 * Statistik untuk admin dashboard
 */

const Stats = {

  getDashboard: function() {
    try {
      var read = function(name) {
        try {
          return Config.getSheet(name).getDataRange().getValues().slice(1)
            .filter(function(r) { return r[0] !== ''; });
        } catch (e) {
          return [];
        }
      };

      var orders = read('Orders');
      var customers = read('Customers');
      var projects = read('Projects');
      var quotations = read('Quotations');

      // Hitung per status (kolom Q = index 16)
      var statusBreakdown = {};
      orders.forEach(function(r) {
        var s = r[16] || 'Unknown';
        statusBreakdown[s] = (statusBreakdown[s] || 0) + 1;
      });

      // 5 order terbaru (kolom R = index 17 = createdAt)
      var recentOrders = orders.slice()
        .sort(function(a, b) { return new Date(b[17]) - new Date(a[17]); })
        .slice(0, 5)
        .map(function(r) {
          return {
            id: r[0],
            orderNumber: r[1],
            name: r[3],
            projectType: r[7],
            status: r[16],
            createdAt: r[17]
          };
        });

      return {
        success: true,
        data: {
          totalOrders: orders.length,
          newOrders: statusBreakdown['Submitted'] || 0,
          activeProjects: projects.filter(function(r) {
            return r[5] !== 'Completed' && r[5] !== 'Cancelled' && r[5] !== '';
          }).length,
          completedProjects: projects.filter(function(r) {
            return r[5] === 'Completed';
          }).length,
          totalCustomers: customers.length,
          pendingQuotations: quotations.filter(function(r) {
            return r[12] === 'pending' || r[12] === 'sent';
          }).length,
          statusBreakdown: statusBreakdown,
          recentOrders: recentOrders
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
`);

// ====== 10. GAS Update Guide ======
writeFile('PHASE8_GAS_UPDATE_GUIDE.md', `# 🚀 Phase 8: Update Google Apps Script

## 1️⃣ Buat file baru: Stats.gs

1. Di Apps Script editor, klik **+** → **Script**
2. Beri nama: **Stats**
3. Copy seluruh isi file \`google-apps-script/Stats.gs\` (dari project lokal Anda)
4. Save (Ctrl+S)

## 2️⃣ Update Router.gs (2 perubahan kecil)

**A. Tambahkan ke array \`protectedActions\`:**

\`\`\`javascript
'getDashboardStats',   // <-- tambahkan di daftar protectedActions
\`\`\`

**B. Tambahkan case baru di switch (bagian PROTECTED):**

\`\`\`javascript
case 'getDashboardStats':
  return Stats.getDashboard();
\`\`\`

## 3️⃣ Deploy New Version

Deploy → Manage deployments → ✏️ Edit → Version: **New version** → Deploy

## 4️⃣ (PENTING) Ganti Password Admin

Buka **Config.gs**, ganti:

\`\`\`javascript
ADMIN_PASSWORD: 'change-this-password',
\`\`\`

menjadi password kuat pilihan Anda. Save + deploy new version lagi.

## Kredensial Default

- Email: \`admin@kastriva.com\` (ubah ADMIN_EMAIL jika perlu)
- Password: sesuai Config.gs
`);

console.log('\n🎉 Phase 8: Admin Dashboard berhasil dibuat!');
console.log('');
console.log('📁 FILE FRONTEND BARU:');
console.log('  - lib/services/auth.service.ts');
console.log('  - components/admin/AdminGuard.tsx');
console.log('  - components/admin/AdminSidebar.tsx');
console.log('  - app/admin/layout.tsx');
console.log('  - app/admin/login/page.tsx');
console.log('  - app/admin/page.tsx (dashboard statistik)');
console.log('  - app/admin/orders/page.tsx (order management)');
console.log('  - app/admin/customers/page.tsx');
console.log('');
console.log('📁 FILE GAS BARU:');
console.log('  - google-apps-script/Stats.gs');
console.log('  - PHASE8_GAS_UPDATE_GUIDE.md');
console.log('');
console.log('📌 LANGKAH SELANJUTNYA:');
console.log('1. Baca PHASE8_GAS_UPDATE_GUIDE.md');
console.log('2. Buat Stats.gs di Apps Script + update Router.gs (2 baris)');
console.log('3. GANTI ADMIN_PASSWORD di Config.gs!');
console.log('4. Deploy new version');
console.log('5. npm run dev → buka /admin/login → login');
console.log('6. Commit & push');