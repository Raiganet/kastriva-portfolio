"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Users,
  FolderKanban,
  FileText,
  BadgeDollarSign,
  RotateCcw,
  PackageCheck,
  Images,
  LayoutTemplate,
  LogOut,
  ExternalLink,
  Menu as MenuIcon,
  X,
} from "lucide-react";
import { AdminAuthService } from "@/lib/services/auth.service";
import { useSiteContent } from "@/components/cms/SiteContentProvider";

const menu = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Orders", href: "/admin/orders", icon: Package },
  { name: "Projects", href: "/admin/projects", icon: FolderKanban },
  { name: "Quotations", href: "/admin/quotations", icon: FileText },
  { name: "Invoices", href: "/admin/invoices", icon: BadgeDollarSign },
  { name: "Revisi", href: "/admin/revisions", icon: RotateCcw },
  { name: "Serah Terima", href: "/admin/handovers", icon: PackageCheck },
  { name: "Customers", href: "/admin/customers", icon: Users },
  { name: "Portfolio CMS", href: "/admin/portfolio", icon: Images },
  { name: "Website CMS", href: "/admin/cms", icon: LayoutTemplate },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const site = useSiteContent();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const activeItem = useMemo(
    () => menu.find((item) => isActive(item.href)) || menu[0],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pathname]
  );

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  if (pathname === "/admin/login") return null;

  const handleLogout = async () => {
    if (!(await AdminAuthService.logout())) {
      alert("Logout belum berhasil. Periksa koneksi lalu coba lagi.");
      return;
    }
    setMobileOpen(false);
    router.push("/admin/login");
  };

  const session = AdminAuthService.getSession();

  const menuLinks = (mobile = false) => menu.map((item) => (
    <Link
      key={item.href}
      href={item.href}
      onClick={() => mobile && setMobileOpen(false)}
      className={`flex min-h-[48px] items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
        isActive(item.href)
          ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20"
          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
    >
      <item.icon size={19} className="shrink-0" />
      <span className="min-w-0 flex-1 truncate">{item.name}</span>
    </Link>
  ));

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden h-dvh w-64 flex-col overflow-hidden border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-dark-surface lg:flex">
        <div className="shrink-0 border-b border-slate-200 p-6 dark:border-slate-800">
          <Link href="/admin" className="flex items-center gap-2">
            <img
              src="/brand/kastriva-mark.png"
              alt={`Logo ${site.brand.name}`}
              className="h-9 w-9 object-contain"
            />
            <div className="min-w-0">
              <div className="truncate font-bold text-gradient">{site.brand.name}</div>
              <div className="text-xs text-slate-500">Admin Panel</div>
            </div>
          </Link>
        </div>

        <nav
          className="admin-sidebar-scroll flex-1 min-h-0 space-y-1 overflow-y-auto overscroll-contain p-4 [scrollbar-gutter:stable]"
          aria-label="Navigasi admin"
        >
          {menuLinks()}
        </nav>

        <div className="shrink-0 space-y-1 border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-dark-surface">
          <div className="truncate px-4 py-2 text-xs text-slate-500">
            {session ? session.email : ""}
          </div>
          <Link href="/" className="flex min-h-[44px] items-center gap-3 rounded-xl px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
            <ExternalLink size={17} /> Lihat Website
          </Link>
          <button onClick={handleLogout} className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
            <LogOut size={17} /> Logout
          </button>
        </div>
      </aside>

      <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-3 backdrop-blur dark:border-slate-800 dark:bg-dark-surface/95 sm:px-4 lg:hidden">
        <Link href="/admin" className="flex min-w-0 items-center gap-2.5">
          <img
            src="/brand/kastriva-mark.png"
            alt={`Logo ${site.brand.name}`}
            className="h-8 w-8 shrink-0 object-contain"
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-gradient">{site.brand.name} Admin</div>
            <div className="truncate text-[11px] text-slate-500">{activeItem.name}</div>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-dark-bg dark:text-slate-200 dark:hover:bg-slate-800"
          aria-label="Buka menu admin"
          aria-expanded={mobileOpen}
        >
          <MenuIcon size={22} />
        </button>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu admin">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
            aria-label="Tutup menu admin"
          />

          <aside className="absolute inset-y-0 left-0 flex w-[min(88vw,320px)] flex-col overflow-hidden border-r border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-dark-surface">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-800">
              <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex min-w-0 items-center gap-2.5">
                <img src="/brand/kastriva-mark.png" alt="Kastriva" className="h-9 w-9 shrink-0 object-contain" />
                <div className="min-w-0">
                  <div className="truncate font-bold text-gradient">{site.brand.name}</div>
                  <div className="text-xs text-slate-500">Admin Panel</div>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Tutup menu"
              >
                <X size={22} />
              </button>
            </div>

            <nav className="admin-sidebar-scroll flex-1 min-h-0 space-y-1 overflow-y-auto overscroll-contain p-3" aria-label="Navigasi admin mobile">
              {menuLinks(true)}
            </nav>

            <div className="shrink-0 border-t border-slate-200 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-slate-800">
              <div className="mb-1 truncate px-3 py-2 text-xs text-slate-500">{session ? session.email : ""}</div>
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="flex min-h-[48px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ExternalLink size={18} /> Lihat Website
              </Link>
              <button
                onClick={handleLogout}
                className="flex min-h-[48px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <LogOut size={18} /> Logout
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
