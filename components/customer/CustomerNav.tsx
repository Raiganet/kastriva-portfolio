"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, ExternalLink, Home } from "lucide-react";
import { CustomerAuthService } from "@/lib/services/customer-auth.service";
import { useSiteContent } from "@/components/cms/SiteContentProvider";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export default function CustomerNav() {
  const pathname = usePathname();
  const router = useRouter();
  const site = useSiteContent();
  const { language, setLanguage } = useLanguage();
  const english = language === "en";

  if (pathname === "/customer/login") return null;

  const session = CustomerAuthService.getSession();

  const handleLogout = async () => {
    if (!(await CustomerAuthService.logout())) { alert(english ? "Could not log out. Check your connection and try again." : "Logout belum berhasil. Periksa koneksi lalu coba lagi."); return; }
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
            <div className="text-xs text-slate-500">{english ? "Customer Area" : "Area Customer"}</div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 text-xs font-semibold" aria-label={english ? "Select language" : "Pilih bahasa"}>
            <button type="button" onClick={() => setLanguage("id")} aria-pressed={language === "id"} className={`rounded-md px-2 py-1 ${language === "id" ? "bg-primary-600 text-white" : "text-slate-500"}`}>ID</button>
            <button type="button" onClick={() => setLanguage("en")} aria-pressed={language === "en"} className={`rounded-md px-2 py-1 ${language === "en" ? "bg-primary-600 text-white" : "text-slate-500"}`}>EN</button>
          </div>
          <span className="hidden sm:block text-sm text-slate-600 dark:text-slate-400 mr-2">
            👋 {session ? session.name : ""}
          </span>
          <Link
            href="/"
            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label={english ? "Go to website" : "Ke website"}
          >
            <Home size={18} />
          </Link>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            aria-label={english ? "Log out" : "Logout"}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
