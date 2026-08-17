"use client";
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
            <div className={`inline-flex p-2.5 rounded-xl mb-3 ${card.color}`}>
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
