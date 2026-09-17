"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Moon,
  Sun,
  ArrowRight,
  Package,
  LogIn,
  LayoutDashboard,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useSiteContent } from "@/components/cms/SiteContentProvider";
import Link from "next/link";
import Image from "next/image";
import InstallPWAButton from "@/components/pwa/InstallPWAButton";
import { usePathname } from "next/navigation";
import { AdminAuthService } from "@/lib/services/auth.service";
import { CustomerAuthService } from "@/lib/services/customer-auth.service";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [auth, setAuth] = useState<null | { role: "admin" | "customer" }>(null);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const site = useSiteContent();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    let active = true;
    (async () => {
      const admin = await AdminAuthService.refresh();
      const customer = admin ? false : await CustomerAuthService.refresh();
      if (active) setAuth(admin ? { role: "admin" } : customer ? { role: "customer" } : null);
    })();
    return () => { active = false; };
  }, [pathname]);

  const navLinks = site.navigation.links.map((link) => ({ name: link.label, href: link.href }));

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass shadow-sm py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/android-chrome-192x192.png"
            alt={`Logo ${site.brand.name}`}
            width={36}
            height={36}
            priority
            className="w-9 h-9 rounded-xl shadow-lg shadow-primary-600/30"
          />
          <span className="text-xl font-bold tracking-tight text-gradient">
            {site.brand.name}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400"
              }`}
            >
              {link.name}
            </Link>
          ))}
          <Link
            href="/order/track"
            className={`text-sm font-medium transition-colors flex items-center gap-1 ${
              pathname.startsWith("/order/track")
                ? "text-primary-600 dark:text-primary-400"
                : "text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400"
            }`}
          >
            <Package size={14} /> {site.navigation.trackOrderLabel}
          </Link>
        </nav>

        {/* ===== KANAN ATAS: Login selalu terlihat ===== */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <InstallPWAButton />

          {auth ? (
            <Link
              href={auth.role === "admin" ? "/admin" : "/customer"}
              className="border border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 px-4 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
            >
              <LayoutDashboard size={16} /> Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-all"
            >
              <LogIn size={16} /> Login
            </Link>
          )}

          <Link
            href="/order"
            className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-primary-600/20"
          >
            {site.navigation.startProjectLabel} <ArrowRight size={16} />
          </Link>
        </div>

        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-full left-0 right-0 glass border-t border-slate-200 dark:border-dark-border p-4 shadow-xl"
          >
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-base font-medium py-2 border-b border-slate-100 dark:border-slate-800 ${
                    isActive(link.href) ? "text-primary-600" : ""
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                href="/order/track"
                className="text-base font-medium py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2"
              >
                <Package size={16} /> {site.navigation.trackOrderLabel}
              </Link>
              <InstallPWAButton compact />
              {auth ? (
                <Link
                  href={auth.role === "admin" ? "/admin" : "/customer"}
                  className="text-base font-medium py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 text-primary-600"
                >
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="text-base font-medium py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2"
                >
                  <LogIn size={16} /> Login
                </Link>
              )}
              <Link
                href="/order"
                className="bg-primary-600 text-white text-center py-3 rounded-lg font-semibold mt-2"
              >
                {site.navigation.startProjectLabel}
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
