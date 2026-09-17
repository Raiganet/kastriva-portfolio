"use client";
import { useEffect, useState, useCallback } from "react";
import { gasGet, gasPost } from "@/lib/gas-client";
import { AdminAuthService } from "@/lib/services/auth.service";
import { LoadingSpinner, ErrorState, EmptyState } from "@/components/ui";
import OrderStatusBadge from "@/components/order/OrderStatusBadge";
import { OrderStatus } from "@/lib/types/order";
import {
  FolderKanban,
  RefreshCw,
  X,
  Send,
  Plus,
  Clock,
  ChevronRight,
} from "lucide-react";

interface AdminProject {
  id: string;
  orderId: string;
  projectName: string;
  status: OrderStatus;
  progress: number;
  deadline: string;
  createdAt: string;
}

interface AdminOrder {
  id: string;
  orderNumber: string;
  name: string;
  projectType: string;
  status: OrderStatus;
}

interface UpdateItem {
  id: string;
  title: string;
  description: string;
  progress: number;
  status: string;
  createdAt: string;
}

interface ProjectDetail {
  project: AdminProject;
  updates: UpdateItem[];
  order: {
    orderNumber: string;
    customerName: string;
    customerEmail: string;
  } | null;
}

const UPDATE_STATUSES: OrderStatus[] = [
  "In Progress",
  "Revision",
];

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Convert form
  const [convertOrderId, setConvertOrderId] = useState("");
  const [converting, setConverting] = useState(false);

  // Detail modal
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Update form
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateDesc, setUpdateDesc] = useState("");
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateStatus, setUpdateStatus] = useState<OrderStatus>("In Progress");
  const [sendingUpdate, setSendingUpdate] = useState(false);

  const token = () => AdminAuthService.getToken() || "";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [pRes, oRes] = await Promise.all([
      gasGet<AdminProject[]>("getProjects", { token: token() }),
      gasGet<AdminOrder[]>("getOrders", { token: token() }),
    ]);
    if (pRes.success && pRes.data) setProjects(pRes.data);
    if (oRes.success && oRes.data) setOrders(oRes.data);
    if (!pRes.success) setError(pRes.error || "Gagal memuat projects");
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Project hanya dimulai setelah quotation disetujui customer.
  const convertibleOrders = orders.filter(
    (o) => !projects.some((p) => p.orderId === o.id) && o.status === "Approved"
  );

  const convert = async () => {
    if (!convertOrderId) return;
    setConverting(true);
    const res = await gasPost({
      action: "createProject",
      token: token(),
      orderId: convertOrderId,
    });
    setConverting(false);
    if (res.success) {
      setConvertOrderId("");
      load();
    } else {
      alert(res.error || "Gagal convert order");
    }
  };

  const openDetail = async (id: string) => {
    setLoadingDetail(true);
    setDetail(null);
    const res = await gasGet<ProjectDetail>("getProject", {
      token: token(),
      id,
    });
    if (res.success && res.data) {
      setDetail(res.data);
      setUpdateProgress(res.data.project.progress || 0);
      setUpdateStatus(res.data.project.status || "In Progress");
    }
    setLoadingDetail(false);
  };

  const submitUpdate = async () => {
    if (!detail || !updateTitle.trim()) {
      alert("Judul update wajib diisi");
      return;
    }
    setSendingUpdate(true);
    const res = await gasPost({
      action: "createProjectUpdate",
      token: token(),
      projectId: detail.project.id,
      title: updateTitle,
      description: updateDesc,
      progress: updateProgress,
      status: updateStatus,
    });
    setSendingUpdate(false);
    if (res.success) {
      setUpdateTitle("");
      setUpdateDesc("");
      openDetail(detail.project.id);
      load();
    } else {
      alert(res.error || "Gagal mengirim update");
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Projects</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Kelola project aktif & update progress
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

      {/* Convert Order -> Project */}
      {convertibleOrders.length > 0 && (
        <div className="mb-8 p-5 rounded-2xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <Plus size={18} className="text-primary-600" />
            Convert Order → Project
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={convertOrderId}
              onChange={(e) => setConvertOrderId(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-dark-bg border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Pilih order yang siap dimulai...</option>
              {convertibleOrders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderNumber} — {o.name} ({o.projectType})
                </option>
              ))}
            </select>
            <button
              onClick={convert}
              disabled={!convertOrderId || converting}
              className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              <FolderKanban size={16} />
              {converting ? "Membuat..." : "Mulai Project"}
            </button>
          </div>
        </div>
      )}

      {/* Projects List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : projects.length === 0 ? (
        <EmptyState
          title="Belum ada project"
          description="Project baru dapat dimulai setelah quotation disetujui customer."
          icon={<FolderKanban className="text-slate-400" size={32} />}
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => openDetail(p.id)}
              className="text-left bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-primary-500/50 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold">{p.projectName}</h3>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Clock size={12} />
                    Deadline: {p.deadline || "Fleksibel"}
                  </div>
                </div>
                <OrderStatusBadge status={p.status} size="sm" />
              </div>

              <div className="mb-2 flex justify-between text-xs text-slate-500">
                <span>Progress</span>
                <span className="font-semibold text-primary-600">
                  {p.progress}%
                </span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-purple-500 transition-all"
                  style={{ width: p.progress + "%" }}
                />
              </div>

              <div className="mt-3 text-xs text-primary-600 flex items-center gap-1">
                Kelola & Update <ChevronRight size={12} />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {(loadingDetail || detail) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-bg w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800">
            {loadingDetail ? (
              <div className="flex items-center justify-center py-24">
                <LoadingSpinner size="lg" />
              </div>
            ) : detail ? (
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold">{detail.project.projectName}</h2>
                    {detail.order && (
                      <p className="text-sm text-slate-500 mt-1">
                        {detail.order.orderNumber} • {detail.order.customerName}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setDetail(null)}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label="Close"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Update Timeline */}
                <h3 className="font-bold mb-3">Timeline Update</h3>
                <div className="space-y-3 mb-6 max-h-64 overflow-y-auto pr-2">
                  {detail.updates.length === 0 ? (
                    <p className="text-sm text-slate-500 py-4 text-center">
                      Belum ada update. Kirim update pertama di bawah.
                    </p>
                  ) : (
                    detail.updates.map((u) => (
                      <div
                        key={u.id}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-800"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-semibold text-sm">{u.title}</h4>
                          <span className="text-xs text-slate-500">
                            {new Date(u.createdAt).toLocaleDateString("id-ID")}
                          </span>
                        </div>
                        {u.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {u.description}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-500"
                              style={{ width: u.progress + "%" }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-primary-600">
                            {u.progress}%
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Update Form */}
                {detail.project.status !== "Handover" && detail.project.status !== "Completed" ? (
                <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
                  <h3 className="font-bold mb-3">Kirim Update Baru</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={updateTitle}
                      onChange={(e) => setUpdateTitle(e.target.value)}
                      placeholder="Judul update (contoh: Desain homepage selesai)"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                    <textarea
                      value={updateDesc}
                      onChange={(e) => setUpdateDesc(e.target.value)}
                      placeholder="Deskripsi (opsional)"
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">
                          Progress: {updateProgress}%
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={95}
                          step={5}
                          value={updateProgress}
                          onChange={(e) => setUpdateProgress(Number(e.target.value))}
                          className="w-full accent-primary-600"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">
                          Status
                        </label>
                        <select
                          value={updateStatus}
                          onChange={(e) => setUpdateStatus(e.target.value as OrderStatus)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700 text-sm"
                        >
                          {UPDATE_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={submitUpdate}
                      disabled={sendingUpdate}
                      className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                    >
                      <Send size={16} />
                      {sendingUpdate ? "Mengirim..." : "Kirim Update (email customer otomatis)"}
                    </button>
                  </div>
                </div>
                ) : (
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-5 text-sm text-slate-500">
                    Progress final dikelola melalui menu Serah Terima. Project menjadi 100% setelah customer menerima serah terima.
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
