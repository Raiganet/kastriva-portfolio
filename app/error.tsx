"use client";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-dark-bg px-4">
      <div className="text-center">
        <div className="inline-flex w-20 h-20 rounded-3xl bg-red-50 dark:bg-red-900/20 items-center justify-center mb-6">
          <AlertTriangle size={40} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Terjadi kesalahan</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
          Something went wrong. Silakan coba lagi.
        </p>
        <button
          onClick={reset}
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-semibold transition-all"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  );
}
