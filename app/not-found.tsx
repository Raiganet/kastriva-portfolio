import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-dark-bg px-4">
      <div className="text-center">
        <div className="inline-flex w-20 h-20 rounded-3xl bg-primary-50 dark:bg-primary-900/30 items-center justify-center mb-6">
          <Compass size={40} className="text-primary-600" />
        </div>
        <div className="text-6xl font-bold text-gradient mb-3">404</div>
        <h1 className="text-2xl font-bold mb-2">Halaman tidak ditemukan</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
          Halaman yang Anda cari mungkin telah dipindahkan atau tidak tersedia.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-semibold transition-all"
          >
            Kembali ke Beranda
          </Link>
          <Link
            href="/portfolio"
            className="border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 px-6 py-3 rounded-xl font-semibold transition-all"
          >
            Lihat Portfolio
          </Link>
        </div>
      </div>
    </div>
  );
}
