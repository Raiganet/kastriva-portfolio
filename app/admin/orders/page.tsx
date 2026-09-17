"use client";
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
  "Handover",
  "Completed",
  "Cancelled",
];

const MANUAL_STATUSES: OrderStatus[] = ["Submitted", "Reviewing", "Discussing", "Cancelled"];

interface AdminOrder {
  id: string;
  orderNumber: string;
  name: string;
  business: string;
  email: string;
  whatsapp: string;
  projectType: string;
  portfolioId?: string;
  portfolioTitle?: string;
  budget: string;
  deadline: string;
  description: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
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
    const current = orders.find(order=>order.id===id);
    const res = await gasPost({ action: "updateOrderStatus", token, id, status, expectedUpdatedAt: current?.updatedAt || "" });
    setUpdatingId("");
    if (res.success) {
      load();
    } else {
      alert(res.error || "Gagal update status");
      if (res.code === "CONFLICT") load();
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
                    <td className="px-5 py-4">
                      <div>{order.projectType}</div>
                      {order.portfolioTitle && (
                        <div className="mt-1 text-xs font-medium text-primary-600 dark:text-primary-400">
                          Ref: {order.portfolioTitle}
                        </div>
                      )}
                    </td>
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
                            {Array.from(new Set([order.status, ...MANUAL_STATUSES])).map((s) => (
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
