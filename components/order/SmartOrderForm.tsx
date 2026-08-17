"use client";
import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { config } from "@/data/config";
import { useOrder } from "@/lib/hooks/useOrder";
import { OrderFormData } from "@/lib/validators/order";
import { trackEvent } from "@/lib/analytics";

function OrderFormContent() {
  const searchParams = useSearchParams();
  const portfolioId = searchParams.get("portfolio");
  const serviceType = searchParams.get("service");

  const portfolioProject = portfolioId
    ? config.portfolio.find((p) => String(p.id) === portfolioId)
    : null;

  const { submit, submitting, lastResult, reset } = useOrder();
  const [success, setSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: "",
    business: "",
    email: "",
    whatsapp: "",
    type: serviceType || (portfolioProject ? portfolioProject.category : "Website"),
    budget: "",
    deadline: "",
    description: portfolioProject
      ? `Saya tertarik dengan konsep project "${portfolioProject.title}" dan ingin membuat website serupa.`
      : "",
    features: portfolioProject ? portfolioProject.features.join(", ") : "",
    reference: portfolioProject ? portfolioProject.title : "",
    website: "", // Honeypot field
  });

  useEffect(() => {
    if (serviceType) {
      setFormData((prev) => ({ ...prev, type: serviceType }));
    }
  }, [serviceType]);

  useEffect(() => {
    trackEvent("order_started", {
      source: portfolioProject ? "portfolio" : "direct",
      portfolioId: portfolioId || undefined,
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    reset();

    const result = await submit(formData);

    if (result.success && result.whatsappUrl && result.orderNumber) {
      setOrderNumber(result.orderNumber);
      setSuccess(true);
      // Buka WhatsApp di tab baru
      window.open(result.whatsappUrl, "_blank");
      // Reset form setelah 3 detik
      setTimeout(() => {
        setFormData({
          name: "",
          business: "",
          email: "",
          whatsapp: "",
          type: "Website",
          budget: "",
          deadline: "",
          description: "",
          features: "",
          reference: "",
          website: "",
        });
        setSuccess(false);
      }, 5000);
    } else if (result.errors) {
      setFieldErrors(result.errors);
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
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-4 rounded-xl flex items-start gap-3 border border-green-200 dark:border-green-800">
            <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Order berhasil dikirim!</p>
              <p className="text-sm mt-1">
                Nomor Order: <span className="font-mono">{orderNumber}</span>
              </p>
              <p className="text-sm">WhatsApp telah dibuka di tab baru.</p>
            </div>
          </div>
        )}

        {lastResult?.error && !success && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-xl flex items-center gap-3 border border-red-200 dark:border-red-800">
            <AlertCircle size={20} />
            <p>{lastResult.error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium mb-2">Nama Lengkap *</label>
            <input
              required
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
              className={inputClass("type")}
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              {[
                "Website",
                "Landing Page",
                "Company Profile",
                "Web App",
                "Dashboard",
                "Sistem Informasi",
                "Android App",
                "Custom",
              ].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Budget</label>
            <select
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
            type="text"
            className={inputClass("features")}
            placeholder="Contoh: Login, Payment Gateway"
            value={formData.features}
            onChange={(e) => setFormData({ ...formData, features: e.target.value })}
          />
        </div>

        {/* Honeypot - hidden from users, trap for bots */}
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

        <button
          disabled={submitting}
          type="submit"
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20"
        >
          {submitting ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Send size={20} />
          )}
          {submitting ? "Mengirim..." : "Kirim Permintaan Project"}
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
