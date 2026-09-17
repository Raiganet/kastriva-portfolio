"use client";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { ORDER_STATUS_FLOW, OrderStatus, STATUS_LABELS } from "@/lib/types/order";

interface OrderTimelineProps {
  currentStatus: OrderStatus;
}

export default function OrderTimeline({ currentStatus }: OrderTimelineProps) {
  const currentIndex = ORDER_STATUS_FLOW.indexOf(currentStatus);
  const isCancelled = currentStatus === "Cancelled";

  return (
    <div className="relative">
      {ORDER_STATUS_FLOW.map((status, index) => {
        const isCompleted = !isCancelled && index < currentIndex;
        const isCurrent = !isCancelled && index === currentIndex;
        const isFuture = !isCancelled && index > currentIndex;

        return (
          <motion.div
            key={status}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative flex items-start gap-4 pb-6 last:pb-0"
          >
            {/* Line connector */}
            {index < ORDER_STATUS_FLOW.length - 1 && (
              <div
                className={`absolute left-4 top-8 bottom-0 w-0.5 ${
                  isCompleted
                    ? "bg-gradient-to-b from-primary-500 to-primary-300"
                    : "bg-slate-200 dark:bg-slate-700"
                }`}
              />
            )}

            {/* Icon */}
            <div className="relative z-10 flex-shrink-0">
              {isCompleted && (
                <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
                  <CheckCircle2 size={18} className="text-white" />
                </div>
              )}
              {isCurrent && (
                <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-600/40 ring-4 ring-primary-100 dark:ring-primary-900/50">
                  <Loader2 size={16} className="text-white animate-spin" />
                </div>
              )}
              {isFuture && (
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center">
                  <Circle size={12} className="text-slate-400" />
                </div>
              )}
              {isCancelled && (
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Circle size={12} className="text-red-500" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pt-1">
              <h4
                className={`font-semibold ${
                  isCurrent
                    ? "text-primary-600 dark:text-primary-400"
                    : isCompleted
                    ? "text-slate-900 dark:text-slate-100"
                    : "text-slate-500 dark:text-slate-500"
                }`}
              >
                {STATUS_LABELS[status]}
                {isCurrent && (
                  <span className="ml-2 text-xs font-normal text-primary-500">
                    (Sedang berlangsung)
                  </span>
                )}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                {getStepDescription(status)}
              </p>
            </div>
          </motion.div>
        );
      })}

      {isCancelled && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
        >
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">
            Order ini telah dibatalkan
          </p>
        </motion.div>
      )}
    </div>
  );
}

function getStepDescription(status: OrderStatus): string {
  const descriptions: Record<OrderStatus, string> = {
    Submitted: "Pesanan Anda telah kami terima dan masuk ke antrian review",
    Reviewing: "Tim kami sedang mempelajari kebutuhan project Anda",
    Discussing: "Sesi konsultasi untuk memperjelas scope project",
    Quotation: "Kami mengirimkan penawaran resmi untuk Anda review",
    Approved: "Project disetujui dan siap dimulai",
    "In Progress": "Tim developer sedang mengerjakan project Anda",
    Revision: "Sedang dalam tahap revisi berdasarkan feedback",
    Handover: "Hasil project sedang diperiksa dan menunggu penerimaan serah terima",
    Completed: "Project telah selesai dan siap digunakan",
    Cancelled: "Order dibatalkan",
  };
  return descriptions[status];
}
