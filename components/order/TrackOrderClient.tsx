"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Package, Calendar, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { OrderService } from "@/lib/services/order.service";
import { OrderTrackingResult } from "@/lib/types/order";
import OrderStatusBadge from "@/components/order/OrderStatusBadge";
import OrderTimeline from "@/components/order/OrderTimeline";
import { LoadingSpinner } from "@/components/ui";

import Link from "next/link";
import { CustomerAuthService } from "@/lib/services/customer-auth.service";

export default function TrackOrderClient() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    CustomerAuthService.refresh().then(ok => { if (active) setAuthenticated(ok); });
    const expire = () => { setAuthenticated(false); setResult(null); };
    window.addEventListener("kastriva-session-expired", expire);
    setOrderNumber(new URLSearchParams(window.location.search).get("orderNumber") || "");
    return () => { active = false; window.removeEventListener("kastriva-session-expired", expire); };
  }, []);
  const [orderNumber, setOrderNumber] = useState("");
  const [result, setResult] = useState<OrderTrackingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authenticated) return;
    setError("");
    setResult(null);

    const trimmed = orderNumber.trim().toUpperCase();
    if (!/^KAS-\d{4}-\d{4,}$/.test(trimmed)) {
      setError("Format nomor order tidak valid. Contoh: KAS-2026-0001");
      return;
    }

    setLoading(true);
    try {
      const data = await OrderService.trackOrder(trimmed);
      if (data) {
        setResult(data);
      } else {
        setError("Order tidak ditemukan. Periksa kembali nomor order Anda.");
      }
    } catch (err) {
      setError("Gagal mengambil data. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const history = OrderService.getOrderHistory();

  if (authenticated === null) return <div className="pt-32 pb-20 text-center"><LoadingSpinner /></div>;
  if (!authenticated) return <div className="pt-32 pb-20 px-6 text-center"><h1 className="text-2xl font-bold mb-4">Login untuk melacak order</h1><p className="mb-6">Verifikasi email Anda untuk melihat order dan progres proyek dengan aman.</p><Link href="/login?role=customer" className="rounded-xl bg-primary-600 px-6 py-3 text-white">Masuk sebagai pelanggan</Link></div>;
  return (
    <div className="pt-32 pb-20 min-h-screen bg-slate-50 dark:bg-dark-surface/50">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 mb-4"
          >
            <Search size={16} />
            Order Tracking
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Lacak Status Order Anda
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-600 dark:text-slate-400"
          >
            Masukkan nomor order untuk melihat progress project Anda
          </motion.p>
        </div>

        {/* Search Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onSubmit={handleSubmit}
          className="bg-white dark:bg-dark-bg p-6 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                placeholder="KAS-2026-0001"
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-lg tracking-wide"
                maxLength={13}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white px-8 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Search size={20} />
              )}
              Lacak Order
            </button>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm flex items-center gap-2"
              >
                <AlertCircle size={16} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.form>

        {/* Order History (from localStorage) */}
        {!result && history.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-dark-bg p-6 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6"
          >
            <h3 className="font-semibold mb-3 text-slate-700 dark:text-slate-300">
              Order Terakhir Anda (di perangkat ini)
            </h3>
            <div className="space-y-2">
              {history.slice(0, 5).map((item) => (
                <button
                  key={item.orderNumber}
                  onClick={() => setOrderNumber(item.orderNumber)}
                  className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-surface hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between text-left"
                >
                  <div>
                    <div className="font-mono font-semibold text-primary-600">
                      {item.orderNumber}
                    </div>
                    <div className="text-xs text-slate-500">
                      {item.projectType}
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(item.timestamp).toLocaleDateString("id-ID")}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white dark:bg-dark-bg rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              {/* Order Header */}
              <div className="p-6 bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 border-b border-slate-200 dark:border-slate-800">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      Nomor Order
                    </div>
                    <div className="font-mono text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {result.order.orderNumber}
                    </div>
                  </div>
                  <OrderStatusBadge status={result.order.status} size="lg" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                      <Calendar size={12} /> Tanggal Order
                    </div>
                    <div className="text-sm font-medium">
                      {new Date(result.order.createdAt).toLocaleDateString(
                        "id-ID",
                        { day: "numeric", month: "long", year: "numeric" }
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                      <Package size={12} /> Jenis Project
                    </div>
                    <div className="text-sm font-medium">
                      {result.order.projectType}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                      <Clock size={12} /> Deadline
                    </div>
                    <div className="text-sm font-medium">
                      {result.order.deadline || "Fleksibel"}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                      <CheckCircle2 size={12} /> Customer
                    </div>
                    <div className="text-sm font-medium">
                      {result.order.name}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-bold mb-4 text-lg">Detail Order</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Deskripsi</div>
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {result.order.description}
                    </p>
                  </div>
                  {result.order.features && (
                    <div>
                      <div className="text-xs text-slate-500 mb-1">
                        Fitur yang Diminta
                      </div>
                      <p className="text-slate-700 dark:text-slate-300">
                        {result.order.features}
                      </p>
                    </div>
                  )}
                  {result.order.budget && (
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Budget</div>
                      <p className="text-slate-700 dark:text-slate-300">
                        {result.order.budget}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="p-6">
                <h3 className="font-bold mb-6 text-lg">Progress Order</h3>
                <OrderTimeline currentStatus={result.order.status} />
              </div>

              {/* Project Updates (if any) */}
              {result.updates && result.updates.length > 0 && (
                <div className="p-6 border-t border-slate-200 dark:border-slate-800">
                  <h3 className="font-bold mb-4 text-lg">Update Terbaru</h3>
                  <div className="space-y-3">
                    {result.updates.slice(0, 5).map((update) => (
                      <div
                        key={update.id}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-800"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold">{update.title}</h4>
                          <span className="text-xs text-slate-500">
                            {new Date(update.createdAt).toLocaleDateString(
                              "id-ID"
                            )}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {update.description}
                        </p>
                        {update.progress > 0 && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Progress</span>
                              <span className="font-semibold">
                                {update.progress}%
                              </span>
                            </div>
                            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary-500 to-purple-500 transition-all"
                                style={{ width: `${update.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
