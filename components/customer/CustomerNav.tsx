"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, ExternalLink, Home } from "lucide-react";
import { CustomerAuthService } from "@/lib/services/customer-auth.service";
import { useSiteContent } from "@/components/cms/SiteContentProvider";

export default function CustomerNav() {
  const pathname = usePathname();
  const router = useRouter();
  const site = useSiteContent();

  if (pathname === "/customer/login") return null;

  const session = CustomerAuthService.getSession();

  const handleLogout = async () => {
    if (!(await CustomerAuthService.logout())) { alert("Logout belum berhasil. Periksa koneksi lalu coba lagi."); return; }
    router.push("/customer/login");
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-dark-surface border-b border-slate-200 dark:border-slate-800 z-40">
      <div className="container mx-auto px-4 md:px-6 h-full flex items-center justify-between">
        <Link href="/customer" className="flex items-center gap-2">
          <img
            src="/brand/kastriva-mark.png"
            alt={`Logo ${site.brand.name}`}
            className="w-8 h-8 object-contain"
          />
          <div>
            <div className="font-bold text-gradient leading-none">{site.brand.name}</div>
            <div className="text-xs text-slate-500">Customer Area</div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <span className="hidden sm:block text-sm text-slate-600 dark:text-slate-400 mr-2">
            👋 {session ? session.name : ""}
          </span>
          <Link
            href="/"
            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Ke website"
          >
            <Home size={18} />
          </Link>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            aria-label="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
