"use client";
import { useCallback, useEffect, useState } from "react";
import { gasGet, gasPost } from "@/lib/gas-client";
import { AdminAuthService } from "@/lib/services/auth.service";
import { EmptyState, ErrorState, LoadingSpinner } from "@/components/ui";
import { RefreshCw, RotateCcw, X } from "lucide-react";

interface ProjectRef { id: string; projectName: string; }
interface Revision {
  id: string; revisionNumber: string; projectId: string; orderId: string; title: string; description: string;
  status: string; priority: string; adminResponse: string; requestedAt: string; updatedAt: string; resolvedAt: string;
}
const pill = (status: string) => status === "Resolved" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : status === "Rejected" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" : status === "In Progress" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";

export default function AdminRevisionsPage() {
  const [rows, setRows] = useState<Revision[]>([]);
  const [projects, setProjects] = useState<ProjectRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Revision | null>(null);
  const [status, setStatus] = useState("Requested");
  const [response, setResponse] = useState("");
  const [saving, setSaving] = useState(false);
  const token = () => AdminAuthService.getToken() || "";

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const [res, pRes] = await Promise.all([
      gasGet<Revision[]>("getRevisions", { token: token() }),
      gasGet<ProjectRef[]>("getProjects", { token: token() }),
    ]);
    if (res.success && res.data) setRows(res.data); else setError(res.error || "Gagal memuat revisi");
    if (pRes.success && pRes.data) setProjects(pRes.data);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const open = (r: Revision) => { setSelected(r); setStatus(r.status); setResponse(r.adminResponse || ""); };
  const save = async () => {
    if (!selected) return;
    setSaving(true);
    const res = await gasPost({ action: "updateRevision", token: token(), revisionId: selected.id, status, adminResponse: response });
    setSaving(false);
    if (!res.success) return alert(res.error || "Gagal update revisi");
    setSelected(null); await load();
  };

  const openCount = rows.filter(r => r.status === "Requested" || r.status === "In Progress").length;
  const resolvedCount = rows.filter(r => r.status === "Resolved").length;

  return <div>
    <div className="mb-8 flex items-center justify-between gap-4">
      <div><h1 className="text-3xl font-bold mb-1">Revisi</h1><p className="text-slate-600 dark:text-slate-400">Kelola feedback customer sebagai tiket revisi yang tercatat.</p></div>
      <button onClick={load} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700" aria-label="Refresh"><RefreshCw size={18}/></button>
    </div>
    <div className="grid sm:grid-cols-3 gap-4 mb-8">
      <div className="p-5 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800"><div className="text-sm text-slate-500">Total Revisi</div><div className="text-2xl font-bold mt-1">{rows.length}</div></div>
      <div className="p-5 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800"><div className="text-sm text-slate-500">Perlu Ditangani</div><div className="text-2xl font-bold text-orange-600 mt-1">{openCount}</div></div>
      <div className="p-5 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800"><div className="text-sm text-slate-500">Selesai</div><div className="text-2xl font-bold text-green-600 mt-1">{resolvedCount}</div></div>
    </div>

    {loading ? <div className="py-24 flex justify-center"><LoadingSpinner size="lg"/></div> : error ? <ErrorState message={error} onRetry={load}/> : rows.length === 0 ? <EmptyState title="Belum ada permintaan revisi" description="Customer dapat mengirim revisi dari dashboard project mereka." icon={<RotateCcw size={32} className="text-slate-400"/>}/> : <div className="space-y-4">
      {rows.map(r => <button key={r.id} onClick={() => open(r)} className="w-full text-left p-5 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800 hover:border-primary-500/50 transition-all">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><div className="font-mono text-sm font-bold text-primary-600">{r.revisionNumber}</div><div className="text-xs text-slate-500 mt-1">{projects.find(p => p.id === r.projectId)?.projectName || "Project"}</div><h3 className="font-bold mt-1">{r.title}</h3><p className="text-sm text-slate-500 mt-1 line-clamp-2">{r.description}</p></div>
          <div className="text-right"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${pill(r.status)}`}>{r.status}</span><div className="text-xs text-slate-500 mt-2">Prioritas: {r.priority || "Normal"}</div></div>
        </div>
        <div className="mt-3 text-xs text-slate-400">Diajukan {new Date(r.requestedAt).toLocaleString("id-ID")}</div>
      </button>)}
    </div>}

    {selected && <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"><div className="w-full max-w-xl bg-white dark:bg-dark-bg rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex items-start justify-between gap-3 mb-5"><div><div className="font-mono text-sm font-bold text-primary-600">{selected.revisionNumber}</div><h2 className="text-xl font-bold">{selected.title}</h2></div><button onClick={() => setSelected(null)}><X size={20}/></button></div>
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-sm whitespace-pre-wrap mb-4">{selected.description}</div>
      <div className="space-y-4">
        <div><label className="block text-sm font-medium mb-2">Status</label><select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700"><option>Requested</option><option>In Progress</option><option>Resolved</option><option>Rejected</option></select></div>
        <div><label className="block text-sm font-medium mb-2">Respons Admin</label><textarea rows={4} value={response} onChange={e => setResponse(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700" placeholder="Jelaskan tindakan, hasil revisi, atau alasan jika ditolak."/></div>
        <p className="text-xs text-slate-500">Saat revisi masih Requested/In Progress, status project otomatis menjadi Revisi. Setelah semua revisi selesai, project kembali ke In Progress.</p>
        <button onClick={save} disabled={saving} className="w-full py-3 rounded-xl bg-primary-600 disabled:bg-primary-400 text-white font-semibold">{saving ? "Menyimpan..." : "Simpan & Kirim Email Customer"}</button>
      </div>
    </div></div>}
  </div>;
}
