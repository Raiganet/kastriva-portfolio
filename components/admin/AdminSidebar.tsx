"use client";
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

  if (pathname === "/admin/login") return null;

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    if (!(await AdminAuthService.logout())) { alert("Logout belum berhasil. Periksa koneksi lalu coba lagi."); return; }
    router.push("/admin/login");
  };

  const session = AdminAuthService.getSession();

  return (
    <>
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-white dark:bg-dark-surface border-r border-slate-200 dark:border-slate-800 z-40">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <Link href="/admin" className="flex items-center gap-2">
            <img
              src="/brand/kastriva-mark.png"
              alt={`Logo ${site.brand.name}`}
              className="w-9 h-9 object-contain"
            />
            <div>
              <div className="font-bold text-gradient">{site.brand.name}</div>
              <div className="text-xs text-slate-500">Admin Panel</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <item.icon size={18} />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-1">
          <div className="px-4 py-2 text-xs text-slate-500 truncate">
            {session ? session.email : ""}
          </div>
          <Link href="/" className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ExternalLink size={16} /> Lihat Website
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-dark-surface border-b border-slate-200 dark:border-slate-800 z-40 flex items-center justify-between px-4">
        <Link href="/admin" className="flex items-center gap-2">
          <img
            src="/brand/kastriva-mark.png"
            alt={`Logo ${site.brand.name}`}
            className="w-8 h-8 object-contain"
          />
          <span className="font-bold text-gradient">Admin</span>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto max-w-[75vw]">
          {menu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`p-2 rounded-lg ${isActive(item.href) ? "bg-primary-600 text-white" : "text-slate-600 dark:text-slate-400"}`}
              aria-label={item.name}
            >
              <item.icon size={18} />
            </Link>
          ))}
          <button onClick={handleLogout} className="p-2 rounded-lg text-red-600" aria-label="Logout">
            <LogOut size={18} />
          </button>
        </nav>
      </div>
    </>
  );
}
