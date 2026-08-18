"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { UserCircle2, Loader2, AlertCircle, Package } from "lucide-react";
import { CustomerAuthService } from "@/lib/services/customer-auth.service";
import { config } from "@/data/config";

export default function CustomerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (CustomerAuthService.isLoggedIn()) router.replace("/customer");
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await CustomerAuthService.login(email, orderNumber.toUpperCase());
    setLoading(false);
    if (res.success) router.push("/customer");
    else setError(res.error || "Login gagal");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-bg px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-dark-bg rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-primary-600 items-center justify-center mb-4 shadow-lg shadow-primary-600/30">
              <UserCircle2 size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold">Customer Area</h1>
            <p className="text-sm text-slate-500 mt-1">
              Masuk dengan email & nomor order Anda
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                placeholder="email@anda.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nomor Order</label>
              <input
                type="text"
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-mono"
                placeholder="KAS-2026-0001"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <UserCircle2 size={18} />}
              {loading ? "Memverifikasi..." : "Masuk"}
            </button>
          </form>

          <p className="text-xs text-center text-slate-400 mt-6 flex items-center justify-center gap-1">
            <Package size={12} /> Nomor order ada di email konfirmasi Anda
          </p>
        </div>
      </motion.div>
    </div>
  );
}
