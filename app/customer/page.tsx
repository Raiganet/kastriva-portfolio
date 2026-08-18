"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { gasGet, gasPost } from "@/lib/gas-client";
import { CustomerAuthService } from "@/lib/services/customer-auth.service";
import { LoadingSpinner, ErrorState } from "@/components/ui";
import OrderStatusBadge from "@/components/order/OrderStatusBadge";
import { OrderStatus } from "@/lib/types/order";
import {
  FolderKanban,
  Package,
  CheckCircle2,
  FileText,
  Search,
  Loader2,
} from "lucide-react";

interface MyOrder {
  id: string;
  orderNumber: string;
  projectType: string;
  status: OrderStatus;
  createdAt: string;
}

interface MyUpdate {
  id: string;
  title: string;
  description: string;
  progress: number;
  createdAt: string;
}

interface MyProject {
  id: string;
  projectName: string;
  status: OrderStatus;
  progress: number;
  deadline: string;
  updates: MyUpdate[];
}

interface QuotationItem {
  description: string;
  qty: number;
  price: number;
  total: number;
}

interface MyQuotation {
  id: string;
  quotationNumber: string;
  projectName: string;
  items: QuotationItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes: string;
  validUntil: string;
  status: string;
  createdAt: string;
}

interface MyDashboard {
  orders: MyOrder[];
  projects: MyProject[];
  quotations: MyQuotation[];
}

function rupiah(n: number): string {
  return "Rp " + Number(n || 0).toLocaleString("id-ID");
}

export default function CustomerDashboardPage() {
  const [data, setData] = useState<MyDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [responding, setResponding] = useState("");

  const session = CustomerAuthService.getSession();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const token = CustomerAuthService.getToken();
    const res = await gasGet<MyDashboard>("getMyDashboard", { token: token || "" });
    if (res.success && res.data) setData(res.data);
    else setError(res.error || "Gagal memuat data");
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const respondQuotation = async (quotationId: string, response: "approved" | "rejected") => {
    if (!confirm(response === "approved" ? "Setujui penawaran ini?" : "Tolak penawaran ini?")) return;
    setResponding(quotationId);
    const token = CustomerAuthService.getToken();
    await gasPost({ action: "respondQuotation", token, quotationId, response });
    setResponding("");
    load();
  };

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

  const activeProjects = (data ? data.projects : []).filter(
    (p) => p.status !== "Completed" && p.status !== "Cancelled"
  );
  const pendingQuotations = (data ? data.quotations : []).filter((q) => q.status === "sent");

  const cards = [
    { label: "Order Saya", value: data ? data.orders.length : 0, icon: Package, color: "bg-primary-100 dark:bg-primary-900/30 text-primary-600" },
    { label: "Project Aktif", value: activeProjects.length, icon: FolderKanban, color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600" },
    { label: "Project Selesai", value: (data ? data.projects : []).filter((p) => p.status === "Completed").length, icon: CheckCircle2, color: "bg-green-100 dark:bg-green-900/30 text-green-600" },
    { label: "Menunggu Persetujuan", value: pendingQuotations.length, icon: FileText, color: "bg-orange-100 dark:bg-orange-900/30 text-orange-600" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">
          Halo, {session ? session.name : "Customer"} 👋
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Pantau order, project, dan penawaran Anda di sini.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {cards.map((c, i) => (
          <div key={i} className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className={"inline-flex p-2.5 rounded-xl mb-3 " + c.color}>
              <c.icon size={20} />
            </div>
            <div className="text-3xl font-bold mb-1">{c.value}</div>
            <div className="text-sm text-slate-500">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Quotations */}
      {data && data.quotations.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FileText size={20} className="text-primary-500" /> Penawaran (Quotation)
          </h2>
          <div className="space-y-4">
            {data.quotations.map((q) => (
              <div key={q.id} className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="font-mono font-bold text-primary-600">{q.quotationNumber}</div>
                    <div className="text-sm text-slate-500">{q.projectName}</div>
                  </div>
                  {q.status === "sent" ? (
                    <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-sm font-semibold">Menunggu Persetujuan</span>
                  ) : q.status === "approved" ? (
                    <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-semibold">Disetujui</span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm font-semibold">Ditolak</span>
                  )}
                </div>

                <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/50 text-left text-slate-500">
                        <th className="px-4 py-2 font-medium">Item</th>
                        <th className="px-4 py-2 font-medium">Qty</th>
                        <th className="px-4 py-2 font-medium text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {q.items.map((it, i) => (
                        <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                          <td className="px-4 py-2">{it.description}</td>
                          <td className="px-4 py-2">{it.qty}</td>
                          <td className="px-4 py-2 text-right">{rupiah(it.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col items-end gap-1 text-sm mb-4">
                  <div className="text-slate-500">Subtotal: {rupiah(q.subtotal)}</div>
                  <div className="text-slate-500">Diskon: - {rupiah(q.discount)}</div>
                  <div className="text-slate-500">Pajak: + {rupiah(q.tax)}</div>
                  <div className="text-lg font-bold text-primary-600">Total: {rupiah(q.total)}</div>
                  {q.validUntil && (
                    <div className="text-xs text-slate-400">Berlaku hingga: {q.validUntil}</div>
                  )}
                </div>

                {q.status === "sent" && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => respondQuotation(q.id, "approved")}
                      disabled={responding === q.id}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      {responding === q.id ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                      Setujui Penawaran
                    </button>
                    <button
                      onClick={() => respondQuotation(q.id, "rejected")}
                      disabled={responding === q.id}
                      className="flex-1 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 py-3 rounded-xl font-semibold transition-all"
                    >
                      Tolak
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {data && data.projects.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FolderKanban size={20} className="text-primary-500" /> Project Saya
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {data.projects.map((p) => (
              <div key={p.id} className="bg-white dark:bg-dark-surface p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold">{p.projectName}</h3>
                  <OrderStatusBadge status={p.status} size="sm" />
                </div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Progress</span>
                  <span className="font-semibold text-primary-600">{p.progress}%</span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-gradient-to-r from-primary-500 to-purple-500" style={{ width: p.progress + "%" }} />
                </div>
                {p.updates && p.updates.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-500">UPDATE TERBARU</div>
                    {p.updates.slice(0, 2).map((u) => (
                      <div key={u.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-sm">
                        <div className="font-medium">{u.title}</div>
                        {u.description && <div className="text-slate-500 text-xs mt-0.5">{u.description}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Orders */}
      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Package size={20} className="text-primary-500" /> Order Saya
        </h2>
        <div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-5 py-3 font-medium">Jenis</th>
                  <th className="px-5 py-3 font-medium">Tanggal</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {data && data.orders.map((o) => (
                  <tr key={o.id} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                    <td className="px-5 py-4 font-mono font-semibold text-primary-600">{o.orderNumber}</td>
                    <td className="px-5 py-4">{o.projectType}</td>
                    <td className="px-5 py-4 text-slate-500">{new Date(o.createdAt).toLocaleDateString("id-ID")}</td>
                    <td className="px-5 py-4"><OrderStatusBadge status={o.status} size="sm" /></td>
                    <td className="px-5 py-4">
                      <Link href={"/order/track?orderNumber=" + o.orderNumber} className="text-primary-600 text-xs font-medium flex items-center gap-1">
                        <Search size={12} /> Tracking
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
