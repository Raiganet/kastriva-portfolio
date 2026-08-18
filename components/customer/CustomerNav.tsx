"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, ExternalLink, Home } from "lucide-react";
import { CustomerAuthService } from "@/lib/services/customer-auth.service";
import { config } from "@/data/config";

export default function CustomerNav() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/customer/login") return null;

  const session = CustomerAuthService.getSession();

  const handleLogout = () => {
    CustomerAuthService.logout();
    router.push("/customer/login");
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-dark-surface border-b border-slate-200 dark:border-slate-800 z-40">
      <div className="container mx-auto px-4 md:px-6 h-full flex items-center justify-between">
        <Link href="/customer" className="flex items-center gap-2">
          <img
            src="/android-chrome-192x192.png"
            alt="Logo Kastriva"
            className="w-8 h-8 rounded-lg"
          />
          <div>
            <div className="font-bold text-gradient leading-none">{config.brand.name}</div>
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
