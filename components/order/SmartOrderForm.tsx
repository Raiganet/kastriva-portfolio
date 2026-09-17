"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, CheckCircle, AlertCircle, Package } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { config } from "@/data/config";
import { useOrder } from "@/lib/hooks/useOrder";
import { trackEvent } from "@/lib/analytics";
import Link from "next/link";
import { readOrderDraft, saveOrderDraft, startNewOrder, isOrderDraftStorageEvent, OrderDraft } from "@/lib/order/draft";
import { PortfolioService } from "@/lib/services/portfolio.service";
import type { PortfolioProject } from "@/lib/types/portfolio";
import {
  PROJECT_TYPES,
  getPortfolioReference,
  inferPortfolioProjectType,
} from "@/lib/order/portfolio-reference";

function OrderFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const portfolioId = searchParams.get("portfolio");
  const serviceType = searchParams.get("service");
  const serviceId = searchParams.get("serviceId") || "";

  const localPortfolioProject = portfolioId
    ? config.portfolio.find((p) => String(p.id) === portfolioId) || null
    : null;
  const [portfolioProject, setPortfolioProject] = useState<PortfolioProject | null>(
    localPortfolioProject
  );
  const [portfolioLoading, setPortfolioLoading] = useState(
    Boolean(portfolioId && !localPortfolioProject)
  );
  const [portfolioLoadError, setPortfolioLoadError] = useState("");

  const { submit, submitting, lastResult, reset } = useOrder();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const defaults = {
    name: "",
    business: "",
    email: "",
    whatsapp: "",
    type: inferPortfolioProjectType(portfolioProject, serviceType),
    budget: "",
    deadline: "",
    description: portfolioProject
      ? `Saya tertarik dengan konsep project "${portfolioProject.title}" dan ingin membuat project serupa.`
      : "",
    features: portfolioProject ? portfolioProject.features.join(", ") : "",
    reference: portfolioProject ? getPortfolioReference(portfolioProject) : "",
    serviceId,
    portfolioId: portfolioProject ? String(portfolioProject.id) : portfolioId || "",
    portfolioTitle: portfolioProject ? portfolioProject.title : "",
    website: "", // Honeypot
  };
  const [formData,setFormData] = useState(defaults);
  const [draft,setDraft] = useState<OrderDraft|null>(null);
  const [ready,setReady] = useState(false);
  const [draftError,setDraftError] = useState("");
  const [online,setOnline] = useState(true);
  const [persisted,setPersisted] = useState(true);
  const submitted = useRef(false);
  const locked = !!draft?.pending && !draft?.receipt;

  useEffect(() => {
    if (!portfolioId) {
      setPortfolioProject(null);
      setPortfolioLoading(false);
      setPortfolioLoadError("");
      return;
    }

    let active = true;
    setPortfolioLoading(!localPortfolioProject);
    setPortfolioLoadError("");

    PortfolioService.getById(portfolioId)
      .then((project) => {
        if (!active) return;
        if (project) {
          setPortfolioProject(project);
        } else if (!localPortfolioProject) {
          setPortfolioLoadError(
            "Referensi portfolio tidak ditemukan. Form tetap bisa digunakan sebagai order umum."
          );
        }
      })
      .catch(() => {
        if (active && !localPortfolioProject) {
          setPortfolioLoadError(
            "Referensi portfolio belum dapat dimuat. Form tetap bisa digunakan sebagai order umum."
          );
        }
      })
      .finally(() => {
        if (active) setPortfolioLoading(false);
      });

    return () => {
      active = false;
    };
  }, [portfolioId]);

  const restore = () => {
    try { const saved=readOrderDraft();setDraft(saved);if(saved) setFormData({...defaults,...saved.data}); }
    catch(e) {setDraftError(e instanceof Error?e.message:"Draf tidak dapat dibaca.");}
  };
  useEffect(()=>{
    restore();setReady(true);setOnline(navigator.onLine);
    const connection=()=>setOnline(navigator.onLine);
    const sync=(e:StorageEvent)=>{if(isOrderDraftStorageEvent(e))restore();};
    window.addEventListener("online",connection);window.addEventListener("offline",connection);window.addEventListener("storage",sync);
    return ()=>{window.removeEventListener("online",connection);window.removeEventListener("offline",connection);window.removeEventListener("storage",sync);};
  },[]);

  // Saat datang dari portfolio CMS/GAS, tempelkan identitas project ke draf order.
  // Data kontak/budget yang sudah diketik tetap dipertahankan.
  useEffect(() => {
    if (!ready || !portfolioProject || draft?.pending || draft?.receipt) return;

    setFormData((current) => {
      const nextPortfolioId = String(portfolioProject.id);
      const alreadyLinked =
        current.portfolioId === nextPortfolioId &&
        current.portfolioTitle === portfolioProject.title;

      if (alreadyLinked && current.type === inferPortfolioProjectType(portfolioProject, serviceType)) {
        return current;
      }

      const descriptionIsAuto =
        !current.description.trim() ||
        current.description.startsWith('Saya tertarik dengan konsep project "');
      const featuresAreAuto = !current.features.trim() || Boolean(current.portfolioId);

      return {
        ...current,
        type: inferPortfolioProjectType(portfolioProject, serviceType),
        serviceId,
        portfolioId: nextPortfolioId,
        portfolioTitle: portfolioProject.title,
        reference: getPortfolioReference(portfolioProject),
        description: descriptionIsAuto
          ? `Saya tertarik dengan konsep project "${portfolioProject.title}" dan ingin membuat project serupa.`
          : current.description,
        features: featuresAreAuto
          ? portfolioProject.features.join(", ")
          : current.features,
      };
    });
  }, [portfolioProject, ready, draft?.pending, draft?.receipt, serviceType, serviceId]);
  useEffect(()=>{
    if(!ready || draftError || submitted.current) return;
    let active=true;
    saveOrderDraft(formData).then(({draft,persisted})=>{if(active){setDraft(draft);setPersisted(persisted);if(draft.pending || draft.receipt){const restored={...defaults,...draft.data};setFormData(current=>JSON.stringify(current)===JSON.stringify(restored)?current:restored);}}}).catch(e=>{if(active)setDraftError(e.message);});
    return ()=>{active=false;};
  },[formData,ready,draftError]);

  useEffect(() => {
    trackEvent("order_started", {
      source: portfolioId ? "portfolio" : "direct",
      portfolioId: portfolioId || undefined,
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || submitting || draftError) return;
    submitted.current=true;
    setFieldErrors({});
    reset();

    const result = await submit(formData);
    restore();
    submitted.current=false;

    if (result.success && result.orderNumber) {
      trackEvent("order_submitted", {
        order_number: result.orderNumber,
        project_type: formData.type,
        source: portfolioId ? "portfolio" : "direct",
        portfolio_id: portfolioId || undefined,
      });
      // Redirect ke success page dengan order number
      const params = new URLSearchParams();
      params.set("orderNumber", result.orderNumber);
      if (result.whatsappUrl) params.set("wa", result.whatsappUrl);
      router.push(`/order/success?${params.toString()}`);
    } else if (result.errors) {
      setFieldErrors(result.errors);
      // Scroll to first error
      const firstErrorField = Object.keys(result.errors)[0];
      const el = document.querySelector(`[name="${firstErrorField}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-3 rounded-xl bg-white dark:bg-dark-bg border ${
      fieldErrors[field]
        ? "border-red-500 focus:ring-red-500"
        : "border-slate-200 dark:border-slate-700 focus:ring-primary-500"
    } focus:outline-none focus:ring-2 transition-all text-sm`;

  return (
    <div className="container mx-auto px-4 md:px-6 max-w-4xl">
      {!ready && <p role="status">Memuat draf...</p>}
      {draftError && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-red-700">{draftError}</p>}
      {!online && <p role="status" className="mb-4 rounded-xl bg-amber-50 p-4 text-amber-900">Anda sedang offline. Isian tetap disimpan; pengiriman dapat dilanjutkan setelah online.</p>}
      {ready && !draftError && <div className="mb-4 rounded-xl border p-4 text-sm">
        {draft?.receipt ? <><p>Order <b>{draft.receipt.orderNumber}</b> sudah tersimpan.</p><Link className="mr-4 text-primary-600" href={`/order/success?orderNumber=${encodeURIComponent(draft.receipt.orderNumber)}`}>Lihat konfirmasi</Link><button type="button" disabled={submitting} onClick={async()=>{try{const d=await startNewOrder(defaults);setDraft(d);setFormData(defaults);reset();}catch{restore();}}}>Buat permintaan baru</button></>
        : locked ? <p>Permintaan sebelumnya belum dikonfirmasi. Gunakan tombol coba lagi untuk memeriksa atau menyimpan permintaan yang sama. Isian dikunci agar tidak membuat order berbeda.</p>
        : <><p>{persisted ? "Draf disimpan di browser ini. Draf yang belum dikirim berlaku 7 hari." : "Penyimpanan browser tidak tersedia. Jangan tutup halaman; aktifkan penyimpanan situs sebelum mengirim."}</p><button type="button" className="mt-2 text-primary-600" disabled={submitting} onClick={async()=>{try{const d=await startNewOrder(defaults);setDraft(d);setFormData(defaults);reset();}catch{restore();}}}>Hapus draf</button></>}
      </div>}
      {/* Quick Track Link */}
      <div className="flex justify-end mb-4">
        <Link
          href="/order/track"
          className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          <Package size={16} /> Sudah order? Lacak status di sini
        </Link>
      </div>

      {portfolioLoading && (
        <div className="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
          <Loader2 className="animate-spin" size={18} /> Memuat referensi portfolio...
        </div>
      )}

      {portfolioLoadError && !portfolioProject && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-200">
          {portfolioLoadError}
        </div>
      )}

      {portfolioProject && (
        <div className="mb-6 p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-primary-600 dark:text-primary-400 flex-shrink-0" size={20} />
            <div>
              <p className="text-sm font-semibold text-primary-900 dark:text-primary-100">
                Referensi Project: {portfolioProject.title}
              </p>
              <p className="text-xs text-primary-700 dark:text-primary-300">
                Form sudah diisi otomatis berdasarkan project ini
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Mulai Project Anda</h2>
        <p className="text-slate-600 dark:text-slate-400">
          Isi form di bawah ini untuk mendiskusikan kebutuhan digital Anda.
        </p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="bg-white dark:bg-dark-bg p-6 md:p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 space-y-5"
      >
        {lastResult?.error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-xl flex items-center gap-3 border border-red-200 dark:border-red-800">
            <AlertCircle size={20} />
            <p>{lastResult.error}</p>
          </div>
        )}

        <fieldset disabled={submitting || locked || !!draft?.receipt || !ready || !!draftError} className="space-y-5">
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium mb-2">Nama Lengkap *</label>
            <input
              required
              name="name"
              type="text"
              className={inputClass("name")}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            {fieldErrors.name && (
              <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Nama Bisnis</label>
            <input
              name="business"
              type="text"
              className={inputClass("business")}
              value={formData.business}
              onChange={(e) => setFormData({ ...formData, business: e.target.value })}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium mb-2">Email *</label>
            <input
              required
              name="email"
              type="email"
              className={inputClass("email")}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            {fieldErrors.email && (
              <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">WhatsApp *</label>
            <input
              required
              name="whatsapp"
              type="tel"
              className={inputClass("whatsapp")}
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
            />
            {fieldErrors.whatsapp && (
              <p className="text-xs text-red-500 mt-1">{fieldErrors.whatsapp}</p>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-medium mb-2">Jenis Project *</label>
            <select
              required
              name="type"
              className={inputClass("type")}
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              {PROJECT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Budget</label>
            <select
              name="budget"
              className={inputClass("budget")}
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            >
              <option value="">Pilih Range</option>
              <option value="< 5 Juta">{"<"} 5 Juta</option>
              <option value="5 - 15 Juta">5 - 15 Juta</option>
              <option value="15 - 50 Juta">15 - 50 Juta</option>
              <option value="> 50 Juta">{">"} 50 Juta</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Deadline</label>
            <input
              name="deadline"
              type="text"
              placeholder="Contoh: 1 bulan"
              className={inputClass("deadline")}
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Deskripsi *</label>
          <textarea
            required
            name="description"
            rows={4}
            className={inputClass("description")}
            placeholder="Jelaskan kebutuhan Anda (minimal 20 karakter)..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          {fieldErrors.description && (
            <p className="text-xs text-red-500 mt-1">{fieldErrors.description}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Fitur yang Dibutuhkan</label>
          <input
            name="features"
            type="text"
            className={inputClass("features")}
            placeholder="Contoh: Login, Payment Gateway"
            value={formData.features}
            onChange={(e) => setFormData({ ...formData, features: e.target.value })}
          />
        </div>

        {/* Honeypot */}
        <div style={{ display: "none" }} aria-hidden="true">
          <label>Website</label>
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          />
        </div>

        </fieldset>
        <button
          disabled={submitting || !ready || !online || !!draft?.receipt || !!draftError}
          type="submit"
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20"
        >
          {submitting ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Send size={20} />
          )}
          {submitting ? "Memastikan order tersimpan..." : locked ? "Coba kirim kembali dengan aman" : "Kirim Permintaan Project"}
        </button>

        <p className="text-xs text-center text-slate-500 mt-4">
          *Data Anda aman. Kami akan membalas dalam waktu 1x24 jam pada hari kerja.
        </p>
      </motion.form>
    </div>
  );
}

export default function SmartOrderForm() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center">
          <Loader2 className="animate-spin mx-auto" size={32} />
        </div>
      }
    >
      <OrderFormContent />
    </Suspense>
  );
}
