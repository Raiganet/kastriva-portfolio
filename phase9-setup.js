const fs = require('fs');
const path = require('path');

function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Created: ' + filePath);
}

console.log('\n🚀 Memulai Phase 9: Project Management & Tracking...\n');

// ====== 1. GAS Projects Module ======
writeFile('google-apps-script/Projects.gs', `/**
 * KASTRIVA - Projects Module (Phase 9)
 * Convert order -> project, progress tracking, update timeline
 */

const Projects = {

  /**
   * Convert order menjadi project (admin)
   */
  create: function(data) {
    try {
      if (!data.orderId) {
        return { success: false, error: 'Missing orderId' };
      }

      // Cari order
      const ordersSheet = Config.getSheet('Orders');
      const oData = ordersSheet.getDataRange().getValues();
      var orderRow = -1;
      var order = null;

      for (var i = 1; i < oData.length; i++) {
        if (oData[i][0] === data.orderId) {
          orderRow = i;
          order = {
            id: oData[i][0],
            orderNumber: oData[i][1],
            customerId: oData[i][2],
            name: oData[i][3],
            projectType: oData[i][7],
            deadline: oData[i][12],
            description: oData[i][13]
          };
          break;
        }
      }

      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      // Cek duplikat
      const sheet = Config.getSheet('Projects');
      const pData = sheet.getDataRange().getValues();
      for (var p = 1; p < pData.length; p++) {
        if (pData[p][1] === data.orderId) {
          return { success: false, error: 'Project sudah ada untuk order ini' };
        }
      }

      const projectId = Utils.generateId();
      const now = new Date().toISOString();

      sheet.appendRow([
        projectId,
        order.id,
        order.customerId,
        data.projectName || (order.projectType + ' - ' + order.name),
        data.description || order.description,
        'In Progress',
        0,
        now,
        order.deadline || '',
        '',
        now,
        now
      ]);

      // Sync order status -> In Progress (Q=17, S=19)
      ordersSheet.getRange(orderRow + 1, 17).setValue('In Progress');
      ordersSheet.getRange(orderRow + 1, 19).setValue(now);

      Utils.logAudit('project_created', 'admin', {
        projectId: projectId,
        orderId: order.id
      });

      return { success: true, data: { id: projectId } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Get semua projects (admin)
   */
  getAll: function(params) {
    try {
      const sheet = Config.getSheet('Projects');
      const data = sheet.getDataRange().getValues();
      const headers = data[0];

      var projects = data.slice(1)
        .filter(function(r) { return r[0] !== ''; })
        .map(function(row) {
          var obj = {};
          headers.forEach(function(h, i) { obj[h] = row[i]; });
          return obj;
        });

      projects.sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });

      return { success: true, data: projects };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Get project by id + updates + order info (admin)
   */
  getById: function(id) {
    try {
      const all = this.getAll({});
      if (!all.success) return all;

      const project = all.data.find(function(p) { return p.id === id; });
      if (!project) return { success: false, error: 'Project not found' };

      // Updates
      var updates = [];
      try {
        const uSheet = Config.getSheet('ProjectUpdates');
        const uData = uSheet.getDataRange().getValues();
        const uHeaders = uData[0];
        updates = uData.slice(1)
          .filter(function(r) { return r[1] === id; })
          .map(function(r) {
            var u = {};
            uHeaders.forEach(function(h, i) { u[h] = r[i]; });
            return u;
          })
          .sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
      } catch (e) {}

      // Order info
      var order = null;
      try {
        const oSheet = Config.getSheet('Orders');
        const oData = oSheet.getDataRange().getValues();
        for (var i = 1; i < oData.length; i++) {
          if (oData[i][0] === project.orderId) {
            order = {
              orderNumber: oData[i][1],
              customerName: oData[i][3],
              customerEmail: oData[i][5],
              whatsapp: oData[i][6]
            };
            break;
          }
        }
      } catch (e) {}

      return { success: true, data: { project: project, updates: updates, order: order } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Post update progress (admin)
   * Sync: ProjectUpdates + Projects + Orders + email customer
   */
  createUpdate: function(data) {
    try {
      if (!data.projectId || !data.title) {
        return { success: false, error: 'Missing projectId or title' };
      }

      const progress = Math.max(0, Math.min(100, Number(data.progress) || 0));
      const status = data.status || 'In Progress';

      const sheet = Config.getSheet('Projects');
      const pData = sheet.getDataRange().getValues();
      var projectRow = -1;
      var project = null;

      for (var i = 1; i < pData.length; i++) {
        if (pData[i][0] === data.projectId) {
          projectRow = i;
          project = { id: pData[i][0], orderId: pData[i][1], name: pData[i][3] };
          break;
        }
      }

      if (!project) return { success: false, error: 'Project not found' };

      const now = new Date().toISOString();

      // 1. Insert update timeline
      const uSheet = Config.getSheet('ProjectUpdates');
      uSheet.appendRow([
        Utils.generateId(),
        data.projectId,
        Utils.sanitize(data.title),
        Utils.sanitize(data.description || ''),
        progress,
        status,
        now,
        'admin'
      ]);

      // 2. Update project (F=6 status, G=7 progress, J=10 completed, L=12 updated)
      sheet.getRange(projectRow + 1, 6).setValue(status);
      sheet.getRange(projectRow + 1, 7).setValue(progress);
      if (status === 'Completed') {
        sheet.getRange(projectRow + 1, 10).setValue(now);
      }
      sheet.getRange(projectRow + 1, 12).setValue(now);

      // 3. Sync order status + kirim email customer
      try {
        const oSheet = Config.getSheet('Orders');
        const oData = oSheet.getDataRange().getValues();
        for (var o = 1; o < oData.length; o++) {
          if (oData[o][0] === project.orderId) {
            oSheet.getRange(o + 1, 17).setValue(status);
            oSheet.getRange(o + 1, 19).setValue(now);

            var customerEmail = oData[o][5];
            var customerName = oData[o][3];
            if (customerEmail) {
              var subject = 'Update Project: ' + project.name + ' (' + progress + '%) | ' + Config.APP_NAME;
              var body = [
                'Halo ' + customerName + ',',
                '',
                'Ada update terbaru untuk project Anda:',
                '',
                '📌 ' + data.title,
                data.description || '',
                '',
                'Progress: ' + progress + '%',
                'Status: ' + status,
                '',
                'Lihat timeline lengkap di halaman "Lacak Order" menggunakan nomor order Anda.',
                '',
                'Salam,',
                'Tim ' + Config.APP_NAME
              ].join('\\n');
              Utils.sendEmail(customerEmail, subject, body);
            }
            break;
          }
        }
      } catch (e) {
        Logger.log('order sync / email error: ' + e.message);
      }

      Utils.logAudit('project_update_created', 'admin', {
        projectId: data.projectId,
        progress: progress,
        status: status
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
`);

// ====== 2. Admin Projects Page ======
writeFile('app/admin/projects/page.tsx', `"use client";
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
  "Completed",
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

  // Orders yang belum punya project & belum selesai
  const convertibleOrders = orders.filter(
    (o) =>
      !projects.some((p) => p.orderId === o.id) &&
      o.status !== "Cancelled" &&
      o.status !== "Completed"
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
          description="Convert order yang sudah approved menjadi project untuk mulai tracking."
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
                          max={100}
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
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
`);

// ====== 3. Update AdminSidebar (tambah menu Projects) ======
writeFile('components/admin/AdminSidebar.tsx', `"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Users,
  FolderKanban,
  LogOut,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { AdminAuthService } from "@/lib/services/auth.service";
import { config } from "@/data/config";

const menu = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Orders", href: "/admin/orders", icon: Package },
  { name: "Projects", href: "/admin/projects", icon: FolderKanban },
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

// ====== 4. GAS Update Guide ======
writeFile('PHASE9_GAS_UPDATE_GUIDE.md', `# 🚀 Phase 9: Update Google Apps Script

## 1️⃣ Buat file baru: Projects.gs

1. Apps Script editor → **+** → **Script** → nama: **Projects**
2. Copy seluruh isi \`google-apps-script/Projects.gs\`
3. Save

## 2️⃣ Update Router.gs (2 baris)

**A. Tambahkan ke \`protectedActions\`:**
\`\`\`javascript
'createProject',   // <-- tambahkan
\`\`\`

**B. Tambahkan case di switch (bagian PROTECTED: PROJECTS):**
\`\`\`javascript
case 'createProject':
  return Projects.create(body);
\`\`\`

## 3️⃣ Deploy → New version

## 4️⃣ Test Flow Lengkap

1. Login ke /admin
2. Menu **Projects** → pilih order di "Convert Order → Project" → **Mulai Project**
3. Klik project → **Kirim Update** (judul + progress 30%)
4. Cek: timeline muncul, progress bar berubah
5. Cek email customer → ada email update
6. Buka /order/track (sebagai customer) → progress 30% terlihat!
`);

console.log('\n🎉 Phase 9: Project Management & Tracking berhasil dibuat!');
console.log('');
console.log('📁 FILE BARU:');
console.log('  - google-apps-script/Projects.gs');
console.log('  - app/admin/projects/page.tsx');
console.log('  - components/admin/AdminSidebar.tsx (updated: + menu Projects)');
console.log('  - PHASE9_GAS_UPDATE_GUIDE.md');
console.log('');
console.log('📌 LANGKAH:');
console.log('1. Buat Projects.gs di Apps Script (copy dari folder lokal)');
console.log('2. Router.gs: tambah createProject (2 baris, lihat guide)');
console.log('3. Deploy new version');
console.log('4. npm run dev → /admin → Projects');
console.log('5. Commit & push');