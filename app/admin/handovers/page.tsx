"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { gasGet, gasPost } from "@/lib/gas-client";
import { AdminAuthService } from "@/lib/services/auth.service";
import { EmptyState, ErrorState, LoadingSpinner } from "@/components/ui";
import { CheckCircle2, ExternalLink, PackageCheck, Plus, RefreshCw, Trash2, X } from "lucide-react";

interface Project { id: string; projectName: string; status: string; progress: number; }
interface Deliverable { name: string; url: string; type: string; }
interface Handover { id: string; handoverNumber: string; projectId: string; projectName: string; deliverables: Deliverable[]; liveUrl: string; repositoryUrl: string; adminUrl: string; notes: string; warrantyUntil: string; status: string; sentAt: string; acceptedAt: string; createdAt: string; }

export default function AdminHandoversPage() {
  const [rows, setRows] = useState<Handover[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [deliverables, setDeliverables] = useState<Deliverable[]>([{ name: "", url: "", type: "File/Link" }]);
  const [liveUrl, setLiveUrl] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [adminUrl, setAdminUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [warrantyUntil, setWarrantyUntil] = useState("");
  const [saving, setSaving] = useState(false);
  const token = () => AdminAuthService.getToken() || "";

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const [hRes, pRes] = await Promise.all([
      gasGet<Handover[]>("getHandovers", { token: token() }),
      gasGet<Project[]>("getProjects", { token: token() }),
    ]);
    if (hRes.success && hRes.data) setRows(hRes.data); else setError(hRes.error || "Gagal memuat serah terima");
    if (pRes.success && pRes.data) setProjects(pRes.data);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const availableProjects = useMemo(() => projects.filter(p => Number(p.progress || 0) >= 90 && p.status !== "Completed" && !rows.some(h => h.projectId === p.id && h.status !== "Cancelled")), [projects, rows]);
  const updateDeliverable = (i: number, field: keyof Deliverable, value: string) => setDeliverables(current => current.map((d, idx) => idx === i ? { ...d, [field]: value } : d));

  const submit = async () => {
    if (!projectId) return alert("Pilih project");
    const clean = deliverables.filter(d => d.name.trim());
    setSaving(true);
    const res = await gasPost({ action: "createHandover", token: token(), projectId, deliverables: clean, liveUrl, repositoryUrl, adminUrl, notes, warrantyUntil });
    setSaving(false);
    if (!res.success) return alert(res.error || "Gagal membuat serah terima");
    setShowCreate(false); setProjectId(""); setDeliverables([{ name: "", url: "", type: "File/Link" }]); setLiveUrl(""); setRepositoryUrl(""); setAdminUrl(""); setNotes(""); setWarrantyUntil("");
    await load();
  };

  return <div>
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-3xl font-bold mb-1">Serah Terima</h1><p className="text-slate-600 dark:text-slate-400">Kirim hasil final project dan catat penerimaan resmi dari customer.</p></div>
      <div className="flex gap-2"><button onClick={load} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700" aria-label="Refresh"><RefreshCw size={18}/></button><button onClick={() => setShowCreate(true)} className="px-5 py-2.5 rounded-xl bg-primary-600 text-white font-semibold text-sm flex items-center gap-2"><Plus size={16}/> Buat Serah Terima</button></div>
    </div>

    <div className="mb-6 p-4 rounded-2xl border border-cyan-200 dark:border-cyan-900 bg-cyan-50/70 dark:bg-cyan-950/20 text-sm text-cyan-800 dark:text-cyan-200"><strong>Keamanan:</strong> jangan simpan password, API key, private key, atau secret di serah terima. Kirim kredensial lewat kanal aman terpisah.</div>

    {loading ? <div className="py-24 flex justify-center"><LoadingSpinner size="lg"/></div> : error ? <ErrorState message={error} onRetry={load}/> : rows.length === 0 ? <EmptyState title="Belum ada serah terima" description="Kirim hasil final setelah revisi terbuka sudah diselesaikan." icon={<PackageCheck size={32} className="text-slate-400"/>}/> : <div className="space-y-4">{rows.map(h => <div key={h.id} className="p-5 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800">
      <div className="flex flex-wrap justify-between gap-3"><div><div className="font-mono text-sm font-bold text-primary-600">{h.handoverNumber}</div><h3 className="font-bold mt-1">{h.projectName}</h3><div className="text-xs text-slate-500 mt-1">Dikirim {h.sentAt ? new Date(h.sentAt).toLocaleString("id-ID") : "-"}</div></div><div>{h.status === "Accepted" ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"><CheckCircle2 size={13}/> Diterima</span> : <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">Menunggu Customer</span>}</div></div>
      {h.deliverables?.length > 0 && <div className="mt-4 grid sm:grid-cols-2 gap-2">{h.deliverables.map((d, i) => <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-sm"><div className="font-medium">{d.name}</div><div className="text-xs text-slate-500">{d.type}</div>{d.url && <a href={d.url} target="_blank" rel="noreferrer" className="text-xs text-primary-600 inline-flex items-center gap-1 mt-1">Buka <ExternalLink size={11}/></a>}</div>)}</div>}
      {h.warrantyUntil && <div className="mt-4 text-sm text-slate-500">Garansi/support hingga <strong className="text-slate-800 dark:text-slate-200">{h.warrantyUntil}</strong></div>}
    </div>)}</div>}

    {showCreate && <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"><div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-dark-bg rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex items-center justify-between mb-5"><h2 className="text-xl font-bold">Buat Serah Terima</h2><button onClick={() => setShowCreate(false)}><X size={20}/></button></div>
      <div className="space-y-4">
        <div><label className="block text-sm font-medium mb-2">Project *</label><select value={projectId} onChange={e => setProjectId(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700"><option value="">Pilih project...</option>{availableProjects.map(p => <option key={p.id} value={p.id}>{p.projectName} — {p.progress}%</option>)}</select></div>
        <div><div className="flex items-center justify-between mb-2"><label className="text-sm font-medium">Hasil / Deliverables</label><button onClick={() => setDeliverables(d => [...d, { name: "", url: "", type: "File/Link" }])} className="text-sm text-primary-600 font-medium">+ Tambah</button></div><div className="space-y-2">{deliverables.map((d, i) => <div key={i} className="grid grid-cols-12 gap-2"><input value={d.name} onChange={e => updateDeliverable(i, "name", e.target.value)} placeholder="Nama hasil" className="col-span-5 px-3 py-2 rounded-lg bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700 text-sm"/><input value={d.url} onChange={e => updateDeliverable(i, "url", e.target.value)} placeholder="https://... (opsional)" className="col-span-5 px-3 py-2 rounded-lg bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700 text-sm"/><button onClick={() => setDeliverables(x => x.filter((_, idx) => idx !== i))} disabled={deliverables.length === 1} className="col-span-2 flex justify-center items-center text-red-500 disabled:opacity-30"><Trash2 size={16}/></button></div>)}</div></div>
        <div className="grid md:grid-cols-3 gap-3"><div><label className="block text-xs text-slate-500 mb-1">Live URL</label><input value={liveUrl} onChange={e => setLiveUrl(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700 text-sm"/></div><div><label className="block text-xs text-slate-500 mb-1">Repository URL</label><input value={repositoryUrl} onChange={e => setRepositoryUrl(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700 text-sm"/></div><div><label className="block text-xs text-slate-500 mb-1">Admin URL</label><input value={adminUrl} onChange={e => setAdminUrl(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700 text-sm"/></div></div>
        <div><label className="block text-sm font-medium mb-2">Garansi / Support Hingga</label><input type="date" value={warrantyUntil} onChange={e => setWarrantyUntil(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700"/></div>
        <div><label className="block text-sm font-medium mb-2">Catatan Serah Terima</label><textarea rows={4} value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700" placeholder="Dokumentasi, cara deploy, scope garansi, hal yang perlu diketahui customer. Jangan masukkan password/secret."/></div>
        <button onClick={submit} disabled={saving || !projectId} className="w-full py-3 rounded-xl bg-primary-600 disabled:bg-primary-400 text-white font-semibold">{saving ? "Mengirim..." : "Kirim Serah Terima ke Customer"}</button>
      </div>
    </div></div>}
  </div>;
}
