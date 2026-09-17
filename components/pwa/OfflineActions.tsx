"use client";

import Link from "next/link";
import { Home, RefreshCw } from "lucide-react";

export default function OfflineActions() {
  return (
    <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
      <Link href="/" className="btn-secondary"><Home size={17} /> Beranda</Link>
      <button type="button" onClick={() => window.location.reload()} className="btn-primary">
        <RefreshCw size={17} /> Coba Lagi
      </button>
    </div>
  );
}
