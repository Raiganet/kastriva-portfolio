"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { gasGet, gasPost } from "@/lib/gas-client";
import { AdminAuthService } from "@/lib/services/auth.service";
import { EmptyState, ErrorState, LoadingSpinner } from "@/components/ui";
import { BadgeDollarSign, CheckCircle2, Plus, RefreshCw, X } from "lucide-react";

interface Item { description: string; qty: number; price: number; total: number; }
interface Quotation { id: string; quotationNumber: string; projectName: string; total: number; status: string; }
interface Invoice {
  id: string; invoiceNumber: string; quotationId: string; projectName: string; items: Item[];
  subtotal: number; discount: number; tax: number; total: number; paymentStatus: string;
  displayStatus?: string; dueDate: string; paymentMethod: string; amountPaid: number; balance?: number;
  notes: string; createdAt: string;
}

const rupiah = (n: number) => "Rp " + Number(n || 0).toLocaleString("id-ID");
const statusClass = (status: string) => {
  if (status === "Paid") return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
  if (status === "Partial") return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
  if (status === "Overdue") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  if (status === "Cancelled") return "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
};

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [quotationId, setQuotationId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Transfer bank / metode yang disepakati");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [paymentStatus, setPaymentStatus] = useState("Unpaid");
  const [amountPaid, setAmountPaid] = useState(0);

  const token = () => AdminAuthService.getToken() || "";
  const load = useCallback(async () => {
    setLoading(true); setError("");
    const [iRes, qRes] = await Promise.all([
      gasGet<Invoice[]>("getInvoices", { token: token() }),
      gasGet<Quotation[]>("getQuotations", { token: token() }),
    ]);
    if (iRes.success && iRes.data) setInvoices(iRes.data);
    else setError(iRes.error || "Gagal memuat invoice");
    if (qRes.success && qRes.data) setQuotations(qRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const available = useMemo(() => quotations.filter(q => q.status === "approved" && !invoices.some(i => i.quotationId === q.id && i.paymentStatus !== "Cancelled")), [quotations, invoices]);
  const paidTotal = invoices.filter(i => i.paymentStatus === "Paid").reduce((s, i) => s + Number(i.total || 0), 0);
  const outstanding = invoices.filter(i => i.paymentStatus !== "Paid" && i.paymentStatus !== "Cancelled").reduce((s, i) => s + Math.max(0, Number(i.total || 0) - Number(i.amountPaid || 0)), 0);

  const createInvoice = async () => {
    if (!quotationId) return alert("Pilih quotation yang sudah disetujui");
    setSaving(true);
    const res = await gasPost({ action: "createInvoice", token: token(), quotationId, dueDate, paymentMethod, notes });
    setSaving(false);
    if (!res.success) return alert(res.error || "Gagal membuat invoice");
    setShowCreate(false); setQuotationId(""); setDueDate(""); setNotes("");
    await load();
  };

  const openPayment = (inv: Invoice) => {
    setEditing(inv); setPaymentStatus(inv.paymentStatus || "Unpaid"); setAmountPaid(Number(inv.amountPaid || 0));
  };

  const savePayment = async () => {
    if (!editing) return;
    setSaving(true);
    const res = await gasPost({ action: "updateInvoicePayment", token: token(), invoiceId: editing.id, paymentStatus, amountPaid });
    setSaving(false);
    if (!res.success) return alert(res.error || "Gagal memperbarui pembayaran");
    setEditing(null); await load();
  };

  return <div>
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-3xl font-bold mb-1">Invoices</h1><p className="text-slate-600 dark:text-slate-400">Terbitkan invoice dari penawaran yang sudah disetujui dan pantau pembayaran.</p></div>
      <div className="flex gap-2">
        <button onClick={load} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700" aria-label="Refresh"><RefreshCw size={18}/></button>
        <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 rounded-xl bg-primary-600 text-white font-semibold text-sm flex items-center gap-2"><Plus size={16}/> Buat Invoice</button>
      </div>
    </div>

    <div className="grid md:grid-cols-3 gap-4 mb-8">
      <div className="p-5 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800"><div className="text-sm text-slate-500">Total Invoice</div><div className="text-2xl font-bold mt-1">{invoices.length}</div></div>
      <div className="p-5 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800"><div className="text-sm text-slate-500">Sudah Dibayar</div><div className="text-2xl font-bold text-green-600 mt-1">{rupiah(paidTotal)}</div></div>
      <div className="p-5 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800"><div className="text-sm text-slate-500">Sisa Tagihan</div><div className="text-2xl font-bold text-orange-600 mt-1">{rupiah(outstanding)}</div></div>
    </div>

    {loading ? <div className="py-24 flex justify-center"><LoadingSpinner size="lg"/></div> : error ? <ErrorState message={error} onRetry={load}/> : invoices.length === 0 ? <EmptyState title="Belum ada invoice" description="Invoice dibuat dari quotation yang telah disetujui customer." icon={<BadgeDollarSign size={32} className="text-slate-400"/>}/> :
      <div className="space-y-4">{invoices.map(inv => <div key={inv.id} className="p-5 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><div className="font-mono font-bold text-primary-600">{inv.invoiceNumber}</div><div className="font-semibold mt-1">{inv.projectName}</div><div className="text-xs text-slate-500 mt-1">Dibuat {new Date(inv.createdAt).toLocaleDateString("id-ID")} • Jatuh tempo {inv.dueDate || "-"}</div></div>
          <div className="text-right"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${statusClass(inv.displayStatus || inv.paymentStatus)}`}>{inv.displayStatus || inv.paymentStatus}</span><div className="text-xl font-bold mt-2">{rupiah(inv.total)}</div></div>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 mt-4 text-sm">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 p-3"><div className="text-slate-500 text-xs">Dibayar</div><div className="font-semibold">{rupiah(inv.amountPaid)}</div></div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 p-3"><div className="text-slate-500 text-xs">Sisa</div><div className="font-semibold">{rupiah(inv.balance ?? Math.max(0, inv.total - inv.amountPaid))}</div></div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 p-3"><div className="text-slate-500 text-xs">Metode</div><div className="font-semibold truncate">{inv.paymentMethod || "-"}</div></div>
        </div>
        <button onClick={() => openPayment(inv)} className="mt-4 px-4 py-2 rounded-xl border border-primary-200 dark:border-primary-800 text-primary-600 text-sm font-semibold">Update Pembayaran</button>
      </div>)}</div>}

    {showCreate && <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"><div className="w-full max-w-xl bg-white dark:bg-dark-bg rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex items-center justify-between mb-5"><h2 className="text-xl font-bold">Buat Invoice</h2><button onClick={() => setShowCreate(false)}><X size={20}/></button></div>
      <div className="space-y-4">
        <div><label className="text-sm font-medium block mb-2">Quotation Disetujui *</label><select value={quotationId} onChange={e => setQuotationId(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700"><option value="">Pilih quotation...</option>{available.map(q => <option key={q.id} value={q.id}>{q.quotationNumber} — {q.projectName} — {rupiah(q.total)}</option>)}</select>{available.length === 0 && <p className="text-xs text-slate-500 mt-2">Tidak ada quotation approved yang belum memiliki invoice aktif.</p>}</div>
        <div><label className="text-sm font-medium block mb-2">Jatuh Tempo</label><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700"/></div>
        <div><label className="text-sm font-medium block mb-2">Metode Pembayaran</label><input value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700"/></div>
        <div><label className="text-sm font-medium block mb-2">Catatan</label><textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700" placeholder="Contoh: DP 50%, pelunasan sebelum serah terima."/></div>
        <button onClick={createInvoice} disabled={saving || !quotationId} className="w-full py-3 rounded-xl bg-primary-600 disabled:bg-primary-400 text-white font-semibold">{saving ? "Menyimpan..." : "Terbitkan Invoice & Kirim Email"}</button>
      </div>
    </div></div>}

    {editing && <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"><div className="w-full max-w-md bg-white dark:bg-dark-bg rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex items-center justify-between mb-5"><div><h2 className="text-xl font-bold">Update Pembayaran</h2><p className="text-sm text-slate-500">{editing.invoiceNumber} • {rupiah(editing.total)}</p></div><button onClick={() => setEditing(null)}><X size={20}/></button></div>
      <div className="space-y-4">
        <div><label className="text-sm font-medium block mb-2">Status</label><select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700"><option>Unpaid</option><option>Partial</option><option>Paid</option><option>Cancelled</option></select></div>
        {paymentStatus === "Partial" && <div><label className="text-sm font-medium block mb-2">Nominal Sudah Dibayar</label><input type="number" min={0} max={editing.total} value={amountPaid} onChange={e => setAmountPaid(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700"/></div>}
        {paymentStatus === "Paid" && <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-sm text-green-700 dark:text-green-300 flex items-center gap-2"><CheckCircle2 size={16}/> Sistem akan menandai nominal lunas sebesar {rupiah(editing.total)}.</div>}
        <button onClick={savePayment} disabled={saving} className="w-full py-3 rounded-xl bg-primary-600 disabled:bg-primary-400 text-white font-semibold">{saving ? "Menyimpan..." : "Simpan Status Pembayaran"}</button>
      </div>
    </div></div>}
  </div>;
}
