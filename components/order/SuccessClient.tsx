"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, ExternalLink, MessageCircle, Search, Copy, Check } from "lucide-react";
import Link from "next/link";
import { getWhatsAppLink } from "@/data/config";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber") || "";
  const whatsappUrl = searchParams.get("wa") || "";
  const [copied, setCopied] = useState(false);

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    // Auto open WhatsApp jika ada URL
    if (whatsappUrl) {
      const timer = setTimeout(() => {
        window.open(whatsappUrl, "_blank");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [whatsappUrl]);

  return (
    <div className="pt-32 pb-20 min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-green-900/10 dark:to-dark-bg">
      <div className="container mx-auto px-4 md:px-6 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-dark-bg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 md:p-12 text-center"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-6"
          >
            <CheckCircle2 size={48} className="text-green-500" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl md:text-4xl font-bold mb-3"
          >
            Order Berhasil Dikirim! 🎉
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-slate-600 dark:text-slate-400 mb-8"
          >
            Terima kasih! Tim kami akan menghubungi Anda dalam 1x24 jam.
          </motion.p>

          {/* Order Number Card */}
          {orderNumber && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 rounded-2xl p-6 mb-8 border-2 border-primary-200 dark:border-primary-800"
            >
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                Nomor Order Anda
              </div>
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="font-mono text-2xl md:text-3xl font-bold text-primary-600 dark:text-primary-400">
                  {orderNumber}
                </span>
                <button
                  onClick={copyOrderNumber}
                  className="p-2 rounded-lg bg-white dark:bg-dark-bg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Copy order number"
                >
                  {copied ? (
                    <Check size={18} className="text-green-500" />
                  ) : (
                    <Copy size={18} />
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                💡 Simpan nomor ini untuk melacak status order Anda
              </p>
            </motion.div>
          )}

          {/* Info boxes */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="grid md:grid-cols-3 gap-4 mb-8 text-left"
          >
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-surface">
              <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-2">
                <MessageCircle size={16} className="text-green-600" />
              </div>
              <h4 className="font-semibold text-sm mb-1">WhatsApp</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Tab WhatsApp akan terbuka otomatis
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-surface">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2">
                <CheckCircle2 size={16} className="text-blue-600" />
              </div>
              <h4 className="font-semibold text-sm mb-1">Konfirmasi</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Kami balas dalam 1x24 jam kerja
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-surface">
              <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-2">
                <Search size={16} className="text-primary-600" />
              </div>
              <h4 className="font-semibold text-sm mb-1">Tracking</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Pantau progress order kapan saja
              </p>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle size={18} /> Buka WhatsApp
              </a>
            )}
            {orderNumber && (
              <Link
                href={`/order/track?orderNumber=${orderNumber}`}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Search size={18} /> Lacak Order
              </Link>
            )}
            <Link
              href="/"
              className="flex-1 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
            >
              Kembali ke Beranda
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default function SuccessClient() {
  return (
    <Suspense fallback={<div className="pt-32 pb-20 text-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
