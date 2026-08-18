"use client";
import { useEffect, useState, useCallback } from "react";
import { gasGet, gasPost } from "@/lib/gas-client";
import { AdminAuthService } from "@/lib/services/auth.service";
import { LoadingSpinner, ErrorState, EmptyState } from "@/components/ui";
import { FileText, Plus, X, Trash2, Send, RefreshCw } from "lucide-react";

interface QuotationItem {
  description: string;
  qty: number;
  price: number;
  total: number;
}

interface AdminQuotation {
  id: string;
  quotationNumber: string;
  orderId: string;
  projectName: string;
  items: QuotationItem[];
  total: number;
  status: string;
  validUntil: string;
  createdAt: string;
}

interface AdminOrder {
  id: string;
  orderNumber: string;
  name: string;
  projectType: string;
}

function rupiah(n: number): string {
  return "Rp " + Number(n || 0).toLocaleString("id-ID");
}

export default function AdminQuotationsPage() {
  const [quotations, setQuotations] = useState<AdminQuotation[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  // Create form
  const [orderId, setOrderId] = useState("");
  const [items, setItems] = useState<Array<{ description: string; qty: number; price: number }>>([
    { description: "", qty: 1, price: 0 },
  ]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [notes, setNotes] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [sending, setSending] = useState(false);

  const token = () => AdminAuthService.getToken() || "";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [qRes, oRes] = await Promise.all([
      gasGet<AdminQuotation[]>("getQuotations", { token: token() }),
      gasGet<AdminOrder[]>("getOrders", { token: token() }),
    ]);
    if (qRes.success && qRes.data) setQuotations(qRes.data);
    if (oRes.success && oRes.data) setOrders(oRes.data);
    if (!qRes.success) setError(qRes.error || "Gagal memuat quotations");
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const subtotal = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
  const taxAmount = Math.round((subtotal - discount) * (tax / 100));
  const total = subtotal - discount + taxAmount;

  const updateItem = (i: number, field: string, value: string | number) => {
    const next = [...items];
    (next[i] as any)[field] = value;
    setItems(next);
  };

  const submit = async () => {
    const cleanItems = items.filter((it) => it.description.trim() && Number(it.price) > 0);
    if (!orderId || cleanItems.length === 0) {
      alert("Pilih order dan isi minimal 1 item dengan harga");
      return;
    }
    setSending(true);
    const res = await gasPost({
      action: "createQuotation",
      token: token(),
      orderId,
      items: cleanItems,
      discount,
      tax,
      notes,
      validUntil,
    });
    setSending(false);
    if (res.success) {
      setShowCreate(false);
      setOrderId("");
      setItems([{ description: "", qty: 1, price: 0 }]);
      setDiscount(0);
      setTax(0);
      setNotes("");
      setValidUntil("");
      load();
    } else {
      alert(res.error || "Gagal membuat quotation");
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Quotations</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Buat & kelola penawaran untuk customer
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Refresh">
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2"
          >
            <Plus size={16} /> Buat Quotation
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><LoadingSpinner size="lg" /></div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : quotations.length === 0 ? (
        <EmptyState title="Belum ada quotation" description="Buat penawaran pertama Anda untuk customer." icon={<FileText className="text-slate-400" size={32} />} />
      ) : (
        <div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <th className="px-5 py-3 font-medium">Nomor</th>
                <th className="px-5 py-3 font-medium">Project</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Berlaku</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((q) => (
                <tr key={q.id} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                  <td className="px-5 py-4 font-mono font-semibold text-primary-600">{q.quotationNumber}</td>
                  <td className="px-5 py-4">{q.projectName}</td>
                  <td className="px-5 py-4 font-semibold">{rupiah(q.total)}</td>
                  <td className="px-5 py-4 text-slate-500">{q.validUntil || "-"}</td>
                  <td className="px-5 py-4">
                    {q.status === "sent" ? (
                      <span className="px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-semibold">Menunggu</span>
                    ) : q.status === "approved" ? (
                      <span className="px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-semibold">Disetujui ✅</span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-semibold">Ditolak</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-bg w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Buat Quotation</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Order *</label>
                <select
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700 text-sm"
                >
                  <option value="">Pilih order...</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>{o.orderNumber} — {o.name} ({o.projectType})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Items *</label>
                <div className="space-y-2">
                  {items.map((it, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2">
                      <input
                        type="text"
                        placeholder="Deskripsi item"
                        value={it.description}
                        onChange={(e) => updateItem(i, "description", e.target.value)}
                        className="col-span-6 px-3 py-2 rounded-lg bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700 text-sm"
                      />
                      <input
                        type="number"
                        min={1}
                        value={it.qty}
                        onChange={(e) => updateItem(i, "qty", Number(e.target.value))}
                        className="col-span-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700 text-sm"
                      />
                      <input
                        type="number"
                        min={0}
                        placeholder="Harga"
                        value={it.price}
                        onChange={(e) => updateItem(i, "price", Number(e.target.value))}
                        className="col-span-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700 text-sm"
                      />
                      <button
                        onClick={() => setItems(items.filter((_, j) => j !== i))}
                        disabled={items.length === 1}
                        className="col-span-1 text-red-500 disabled:opacity-30"
                        aria-label="Hapus item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setItems([...items, { description: "", qty: 1, price: 0 }])}
                  className="mt-2 text-sm text-primary-600 font-medium flex items-center gap-1"
                >
                  <Plus size={14} /> Tambah Item
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Diskon (Rp)</label>
                  <input type="number" min={0} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Pajak (%)</label>
                  <input type="number" min={0} max={100} value={tax} onChange={(e) => setTax(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Berlaku Hingga</label>
                  <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Catatan</label>
                <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700 text-sm" placeholder="Termasuk revisi 2x, gratis domain 1 tahun, dll" />
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-sm space-y-1">
                <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{rupiah(subtotal)}</span></div>
                <div className="flex justify-between text-slate-500"><span>Diskon</span><span>- {rupiah(discount)}</span></div>
                <div className="flex justify-between text-slate-500"><span>Pajak</span><span>+ {rupiah(taxAmount)}</span></div>
                <div className="flex justify-between font-bold text-primary-600 text-base"><span>TOTAL</span><span>{rupiah(total)}</span></div>
              </div>

              <button
                onClick={submit}
                disabled={sending}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Send size={16} />
                {sending ? "Mengirim..." : "Kirim Quotation (email customer otomatis)"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
