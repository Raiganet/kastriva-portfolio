import { WifiOff } from "lucide-react";
import OfflineActions from "@/components/pwa/OfflineActions";

export const metadata = {
  title: "Offline | Kastriva",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-mesh px-4 py-16 flex items-center justify-center">
      <section className="surface-card max-w-lg w-full p-8 md:p-10 text-center">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
          <WifiOff size={30} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Anda sedang offline</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          Halaman yang pernah dibuka masih dapat tersedia dari cache. Sambungkan internet untuk mengambil data terbaru atau mengirim formulir.
        </p>
        <OfflineActions />
      </section>
    </main>
  );
}
