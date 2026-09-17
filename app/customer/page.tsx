"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { gasGet, gasPost } from "@/lib/gas-client";
import { CustomerAuthService } from "@/lib/services/customer-auth.service";
import { ErrorState, LoadingSpinner } from "@/components/ui";
import OrderStatusBadge from "@/components/order/OrderStatusBadge";
import { OrderStatus } from "@/lib/types/order";
import {
  BadgeDollarSign,
  CheckCircle2,
  ExternalLink,
  FileText,
  FolderKanban,
  Loader2,
  Package,
  PackageCheck,
  RotateCcw,
  Search,
  Send,
  X,
} from "lucide-react";

interface MyOrder { id: string; orderNumber: string; projectType: string; status: OrderStatus; createdAt: string; }
interface MyUpdate { id: string; title: string; description: string; progress: number; createdAt: string; }
interface MyRevision { id: string; revisionNumber: string; projectId: string; title: string; description: string; status: string; priority: string; adminResponse: string; requestedAt: string; }
interface MyProject { id: string; orderId: string; projectName: string; status: OrderStatus; progress: number; deadline: string; updates: MyUpdate[]; revisions: MyRevision[]; revisionLimit: number; revisionUsed: number; }
interface Item { description: string; qty: number; price: number; total: number; }
interface MyQuotation { id: string; quotationNumber: string; projectName: string; items: Item[]; subtotal: number; discount: number; tax: number; total: number; notes: string; validUntil: string; status: string; displayStatus?: string; createdAt: string; revisionLimit: number; paymentTerms: string; customerNote: string; }
interface MyInvoice { id: string; invoiceNumber: string; projectName: string; items: Item[]; total: number; paymentStatus: string; displayStatus: string; dueDate: string; paymentMethod: string; amountPaid: number; balance: number; notes: string; createdAt: string; }
interface Deliverable { name: string; url: string; type: string; }
interface MyHandover { id: string; handoverNumber: string; projectId: string; projectName: string; deliverables: Deliverable[]; liveUrl: string; repositoryUrl: string; adminUrl: string; notes: string; warrantyUntil: string; status: string; sentAt: string; acceptedAt: string; }
interface MyDashboard { orders: MyOrder[]; projects: MyProject[]; quotations: MyQuotation[]; invoices: MyInvoice[]; revisions: MyRevision[]; handovers: MyHandover[]; }

const rupiah = (n: number) => "Rp " + Number(n || 0).toLocaleString("id-ID");
const invoicePill = (status: string) => status === "Paid" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : status === "Overdue" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" : status === "Partial" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";

export default function CustomerDashboardPage() {
  const [data, setData] = useState<MyDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [responding, setResponding] = useState("");
  const [quoteAction, setQuoteAction] = useState<{ q: MyQuotation; response: "approved" | "rejected" } | null>(null);
  const [quoteNote, setQuoteNote] = useState("");
  const [revisionProject, setRevisionProject] = useState<MyProject | null>(null);
  const [revisionTitle, setRevisionTitle] = useState("");
  const [revisionDescription, setRevisionDescription] = useState("");
  const [revisionPriority, setRevisionPriority] = useState("Normal");
  const [revisionSaving, setRevisionSaving] = useState(false);
  const session = CustomerAuthService.getSession();

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const token = CustomerAuthService.getToken();
    const res = await gasGet<MyDashboard>("getMyDashboard", { token: token || "" });
    if (res.success && res.data) setData(res.data); else setError(res.error || "Gagal memuat data");
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const submitQuotationResponse = async () => {
    if (!quoteAction) return;
    setResponding(quoteAction.q.id);
    const res = await gasPost({ action: "respondQuotation", token: CustomerAuthService.getToken(), quotationId: quoteAction.q.id, response: quoteAction.response, customerNote: quoteNote });
    setResponding("");
    if (!res.success) return alert(res.error || "Respons gagal dikirim");
    setQuoteAction(null); setQuoteNote(""); await load();
  };

  const requestRevision = async () => {
    if (!revisionProject || !revisionTitle.trim() || !revisionDescription.trim()) return alert("Judul dan detail revisi wajib diisi");
    setRevisionSaving(true);
    const res = await gasPost({ action: "requestRevision", token: CustomerAuthService.getToken(), projectId: revisionProject.id, title: revisionTitle, description: revisionDescription, priority: revisionPriority });
    setRevisionSaving(false);
    if (!res.success) return alert(res.error || "Gagal mengirim revisi");
    setRevisionProject(null); setRevisionTitle(""); setRevisionDescription(""); setRevisionPriority("Normal"); await load();
  };

  const acceptHandover = async (h: MyHandover) => {
    if (!confirm("Saya sudah memeriksa hasil project dan menerima serah terima ini. Lanjutkan?")) return;
    setResponding(h.id);
    const res = await gasPost({ action: "respondHandover", token: CustomerAuthService.getToken(), handoverId: h.id, response: "Accepted" });
    setResponding("");
    if (!res.success) return alert(res.error || "Gagal menerima serah terima");
    await load();
  };

  if (loading) return <div className="flex items-center justify-center py-32"><LoadingSpinner size="lg" /></div>;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const safe = data || { orders: [], projects: [], quotations: [], invoices: [], revisions: [], handovers: [] };
  const activeProjects = safe.projects.filter(p => p.status !== "Completed" && p.status !== "Cancelled");
  const pendingActions = safe.quotations.filter(q => (q.displayStatus || q.status) === "sent").length + safe.handovers.filter(h => h.status === "Sent").length;
  const unpaid = safe.invoices.filter(i => i.paymentStatus !== "Paid" && i.paymentStatus !== "Cancelled").length;
  const cards = [
    { label: "Order Saya", value: safe.orders.length, icon: Package, color: "bg-primary-100 dark:bg-primary-900/30 text-primary-600" },
    { label: "Project Aktif", value: activeProjects.length, icon: FolderKanban, color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600" },
    { label: "Perlu Tindakan", value: pendingActions, icon: CheckCircle2, color: "bg-orange-100 dark:bg-orange-900/30 text-orange-600" },
    { label: "Invoice Belum Lunas", value: unpaid, icon: BadgeDollarSign, color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600" },
  ];

  return <div>
    <div className="mb-8"><h1 className="text-3xl font-bold mb-1">Halo, {session ? session.name : "Customer"} 👋</h1><p className="text-slate-600 dark:text-slate-400">Pantau penawaran, invoice, revisi, progress, dan serah terima project Anda.</p></div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">{cards.map((c, i) => <div key={i} className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200 dark:border-slate-800"><div className={`inline-flex p-2.5 rounded-xl mb-3 ${c.color}`}><c.icon size={20}/></div><div className="text-3xl font-bold mb-1">{c.value}</div><div className="text-sm text-slate-500">{c.label}</div></div>)}</div>

    {safe.quotations.length > 0 && <section className="mb-10"><h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FileText size={20} className="text-primary-500"/> Penawaran</h2><div className="space-y-4">{safe.quotations.map(q => <div key={q.id} className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4"><div><div className="font-mono font-bold text-primary-600">{q.quotationNumber}</div><div className="font-semibold mt-1">{q.projectName}</div></div>{(q.displayStatus || q.status) === "sent" ? <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 text-sm font-semibold">Menunggu Persetujuan</span> : (q.displayStatus || q.status) === "approved" ? <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-sm font-semibold">Disetujui</span> : (q.displayStatus || q.status) === "expired" ? <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-sm font-semibold">Kedaluwarsa</span> : <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-sm font-semibold">Ditolak</span>}</div>
      <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden mb-4"><table className="w-full text-sm"><thead><tr className="bg-slate-50 dark:bg-slate-900/50 text-left text-slate-500"><th className="px-4 py-2 font-medium">Item</th><th className="px-4 py-2 font-medium">Qty</th><th className="px-4 py-2 font-medium text-right">Total</th></tr></thead><tbody>{q.items.map((it, i) => <tr key={i} className="border-t border-slate-100 dark:border-slate-800"><td className="px-4 py-2">{it.description}</td><td className="px-4 py-2">{it.qty}</td><td className="px-4 py-2 text-right">{rupiah(it.total)}</td></tr>)}</tbody></table></div>
      <div className="grid md:grid-cols-2 gap-3 mb-4 text-sm"><div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50"><div className="text-xs text-slate-500">Kuota Revisi</div><div className="font-semibold">{q.revisionLimit ?? 2} kali</div></div><div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50"><div className="text-xs text-slate-500">Ketentuan Pembayaran</div><div className="font-medium">{q.paymentTerms || "Mengikuti invoice."}</div></div></div>
      {q.notes && <div className="text-sm text-slate-600 dark:text-slate-400 mb-4 whitespace-pre-wrap">{q.notes}</div>}
      <div className="flex flex-col items-end gap-1 text-sm mb-4"><div className="text-slate-500">Subtotal: {rupiah(q.subtotal)}</div><div className="text-slate-500">Diskon: - {rupiah(q.discount)}</div><div className="text-slate-500">Pajak: + {rupiah(q.tax)}</div><div className="text-lg font-bold text-primary-600">Total: {rupiah(q.total)}</div>{q.validUntil && <div className="text-xs text-slate-400">Berlaku hingga: {q.validUntil}</div>}</div>
      {q.customerNote && <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-sm mb-4"><span className="font-medium">Catatan Anda:</span> {q.customerNote}</div>}
      {(q.displayStatus || q.status) === "sent" && <div className="flex flex-col sm:flex-row gap-3"><button onClick={() => { setQuoteAction({ q, response: "approved" }); setQuoteNote(""); }} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"><CheckCircle2 size={16}/> Setujui Penawaran</button><button onClick={() => { setQuoteAction({ q, response: "rejected" }); setQuoteNote(""); }} className="flex-1 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 py-3 rounded-xl font-semibold">Tolak / Minta Penyesuaian</button></div>}
    </div>)}</div></section>}

    {safe.invoices.length > 0 && <section className="mb-10"><h2 className="text-xl font-bold mb-4 flex items-center gap-2"><BadgeDollarSign size={20} className="text-primary-500"/> Invoice</h2><div className="space-y-4">{safe.invoices.map(inv => <div key={inv.id} className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-slate-800 p-6"><div className="flex flex-wrap justify-between gap-3"><div><div className="font-mono font-bold text-primary-600">{inv.invoiceNumber}</div><div className="font-semibold mt-1">{inv.projectName}</div><div className="text-xs text-slate-500 mt-1">Jatuh tempo: {inv.dueDate || "-"}</div></div><div className="text-right"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${invoicePill(inv.displayStatus || inv.paymentStatus)}`}>{inv.displayStatus || inv.paymentStatus}</span><div className="text-xl font-bold mt-2">{rupiah(inv.total)}</div></div></div>{inv.items?.length > 0 && <div className="mt-4 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden"><table className="w-full text-sm"><thead><tr className="bg-slate-50 dark:bg-slate-900/50 text-left text-slate-500"><th className="px-4 py-2 font-medium">Item</th><th className="px-4 py-2 font-medium">Qty</th><th className="px-4 py-2 font-medium text-right">Total</th></tr></thead><tbody>{inv.items.map((it, i) => <tr key={i} className="border-t border-slate-100 dark:border-slate-800"><td className="px-4 py-2">{it.description}</td><td className="px-4 py-2">{it.qty}</td><td className="px-4 py-2 text-right">{rupiah(it.total)}</td></tr>)}</tbody></table></div>}<div className="grid sm:grid-cols-3 gap-3 mt-4 text-sm"><div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50"><div className="text-xs text-slate-500">Sudah Dibayar</div><div className="font-semibold">{rupiah(inv.amountPaid)}</div></div><div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50"><div className="text-xs text-slate-500">Sisa</div><div className="font-semibold">{rupiah(inv.balance)}</div></div><div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50"><div className="text-xs text-slate-500">Metode</div><div className="font-semibold">{inv.paymentMethod || "-"}</div></div></div>{inv.notes && <p className="text-sm text-slate-500 mt-4 whitespace-pre-wrap">{inv.notes}</p>}</div>)}</div></section>}

    {safe.projects.length > 0 && <section className="mb-10"><h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FolderKanban size={20} className="text-primary-500"/> Project & Revisi</h2><div className="grid lg:grid-cols-2 gap-4">{safe.projects.map(p => {
      const canRevise = p.status !== "Completed" && p.status !== "Cancelled" && p.status !== "Handover" && (p.revisionLimit === 0 || p.revisionUsed < p.revisionLimit);
      return <div key={p.id} className="bg-white dark:bg-dark-surface p-6 rounded-2xl border border-slate-200 dark:border-slate-800"><div className="flex items-start justify-between gap-3 mb-3"><h3 className="font-bold">{p.projectName}</h3><OrderStatusBadge status={p.status} size="sm"/></div><div className="flex justify-between text-xs text-slate-500 mb-1"><span>Progress</span><span className="font-semibold text-primary-600">{p.progress}%</span></div><div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-4"><div className="h-full bg-gradient-to-r from-primary-500 to-purple-500" style={{ width: p.progress + "%" }}/></div>
        <div className="flex items-center justify-between gap-3 mb-4"><div className="text-xs text-slate-500">Revisi terpakai: <strong>{p.revisionUsed}</strong>{p.revisionLimit > 0 ? ` / ${p.revisionLimit}` : " / tanpa batas"}</div>{canRevise && <button onClick={() => setRevisionProject(p)} className="px-3 py-2 rounded-xl border border-primary-200 dark:border-primary-800 text-primary-600 text-xs font-semibold flex items-center gap-1"><RotateCcw size={13}/> Ajukan Revisi</button>}</div>
        {p.revisions?.length > 0 && <div className="space-y-2 mb-4">{p.revisions.slice(0, 3).map(r => <div key={r.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-sm"><div className="flex justify-between gap-2"><div className="font-medium">{r.revisionNumber} • {r.title}</div><div className="text-xs text-slate-500">{r.status}</div></div>{r.adminResponse && <div className="text-xs text-slate-500 mt-1">Respons: {r.adminResponse}</div>}</div>)}</div>}
        {p.updates?.length > 0 && <div className="space-y-2"><div className="text-xs font-semibold text-slate-500">UPDATE TERBARU</div>{p.updates.slice(0, 2).map(u => <div key={u.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-sm"><div className="font-medium">{u.title}</div>{u.description && <div className="text-slate-500 text-xs mt-0.5">{u.description}</div>}</div>)}</div>}
      </div>;
    })}</div></section>}

    {safe.handovers.length > 0 && <section className="mb-10"><h2 className="text-xl font-bold mb-4 flex items-center gap-2"><PackageCheck size={20} className="text-primary-500"/> Serah Terima</h2><div className="space-y-4">{safe.handovers.map(h => <div key={h.id} className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-slate-800 p-6"><div className="flex flex-wrap justify-between gap-3 mb-4"><div><div className="font-mono font-bold text-primary-600">{h.handoverNumber}</div><h3 className="font-bold mt-1">{h.projectName}</h3></div>{h.status === "Accepted" ? <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Diterima ✓</span> : <span className="px-3 py-1 rounded-full text-sm font-semibold bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">Perlu Diperiksa</span>}</div>
      {h.deliverables?.length > 0 && <div className="grid sm:grid-cols-2 gap-2 mb-4">{h.deliverables.map((d, i) => <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-sm"><div className="font-medium">{d.name}</div><div className="text-xs text-slate-500">{d.type}</div>{d.url && <a href={d.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary-600 text-xs mt-1">Buka hasil <ExternalLink size={11}/></a>}</div>)}</div>}
      <div className="flex flex-wrap gap-2 mb-4">{h.liveUrl && <a href={h.liveUrl} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm inline-flex gap-1 items-center">Live Website <ExternalLink size={13}/></a>}{h.repositoryUrl && <a href={h.repositoryUrl} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm inline-flex gap-1 items-center">Repository <ExternalLink size={13}/></a>}{h.adminUrl && <a href={h.adminUrl} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm inline-flex gap-1 items-center">Admin <ExternalLink size={13}/></a>}</div>
      {h.notes && <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap mb-3">{h.notes}</p>}{h.warrantyUntil && <p className="text-sm text-slate-500 mb-4">Garansi/support hingga <strong>{h.warrantyUntil}</strong></p>}
      {h.status === "Sent" && <button onClick={() => acceptHandover(h)} disabled={responding === h.id} className="w-full sm:w-auto px-5 py-3 rounded-xl bg-green-600 disabled:bg-green-400 text-white font-semibold flex items-center justify-center gap-2">{responding === h.id ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle2 size={16}/>} Terima Serah Terima</button>}
    </div>)}</div></section>}

    <section><h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Package size={20} className="text-primary-500"/> Order Saya</h2><div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50"><th className="px-5 py-3 font-medium">Order</th><th className="px-5 py-3 font-medium">Jenis</th><th className="px-5 py-3 font-medium">Tanggal</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium"></th></tr></thead><tbody>{safe.orders.map(o => <tr key={o.id} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0"><td className="px-5 py-4 font-mono font-semibold text-primary-600">{o.orderNumber}</td><td className="px-5 py-4">{o.projectType}</td><td className="px-5 py-4 text-slate-500">{new Date(o.createdAt).toLocaleDateString("id-ID")}</td><td className="px-5 py-4"><OrderStatusBadge status={o.status} size="sm"/></td><td className="px-5 py-4"><Link href={`/order/track?orderNumber=${o.orderNumber}`} className="text-primary-600 text-xs font-medium flex items-center gap-1"><Search size={12}/> Tracking</Link></td></tr>)}</tbody></table></div></div></section>

    {quoteAction && <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"><div className="w-full max-w-md bg-white dark:bg-dark-bg rounded-2xl border border-slate-200 dark:border-slate-800 p-6"><div className="flex items-start justify-between gap-3 mb-4"><div><h2 className="text-xl font-bold">{quoteAction.response === "approved" ? "Setujui Penawaran" : "Tolak / Minta Penyesuaian"}</h2><p className="text-sm text-slate-500">{quoteAction.q.quotationNumber} • {rupiah(quoteAction.q.total)}</p></div><button onClick={() => setQuoteAction(null)}><X size={20}/></button></div><p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{quoteAction.response === "approved" ? "Tambahkan catatan bila ada, lalu konfirmasi persetujuan." : "Jelaskan bagian yang perlu disesuaikan agar admin dapat menindaklanjuti dengan jelas."}</p><textarea rows={4} value={quoteNote} onChange={e => setQuoteNote(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700 mb-4" placeholder="Catatan untuk admin (opsional)"/><button onClick={submitQuotationResponse} disabled={responding === quoteAction.q.id} className={`w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 ${quoteAction.response === "approved" ? "bg-green-600" : "bg-red-600"}`}>{responding === quoteAction.q.id ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>} Kirim Respons</button></div></div>}

    {revisionProject && <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"><div className="w-full max-w-lg bg-white dark:bg-dark-bg rounded-2xl border border-slate-200 dark:border-slate-800 p-6"><div className="flex items-start justify-between gap-3 mb-4"><div><h2 className="text-xl font-bold">Ajukan Revisi</h2><p className="text-sm text-slate-500">{revisionProject.projectName} • {revisionProject.revisionUsed}{revisionProject.revisionLimit > 0 ? `/${revisionProject.revisionLimit}` : " revisi"}</p></div><button onClick={() => setRevisionProject(null)}><X size={20}/></button></div><div className="space-y-4"><div><label className="block text-sm font-medium mb-2">Judul *</label><input value={revisionTitle} onChange={e => setRevisionTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700" placeholder="Contoh: Perbaiki layout halaman checkout"/></div><div><label className="block text-sm font-medium mb-2">Detail Revisi *</label><textarea rows={5} value={revisionDescription} onChange={e => setRevisionDescription(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700" placeholder="Jelaskan bagian yang diubah, kondisi sekarang, dan hasil yang diharapkan."/></div><div><label className="block text-sm font-medium mb-2">Prioritas</label><select value={revisionPriority} onChange={e => setRevisionPriority(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700"><option>Low</option><option>Normal</option><option>High</option></select></div><button onClick={requestRevision} disabled={revisionSaving} className="w-full py-3 rounded-xl bg-primary-600 disabled:bg-primary-400 text-white font-semibold flex items-center justify-center gap-2">{revisionSaving ? <Loader2 size={16} className="animate-spin"/> : <RotateCcw size={16}/>} Kirim Permintaan Revisi</button></div></div></div>}
  </div>;
}
