"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Moon, Sun, ArrowRight, Package, UserCircle2 } from "lucide-react";
import { useTheme } from "next-themes";
import { config } from "@/data/config";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Services", href: "/services" },
    { name: "Portfolio", href: "/portfolio" },
    { name: "Process", href: "/process" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const linkClass = (active: boolean) =>
    `text-sm font-medium transition-colors flex items-center gap-1 ${
      active
        ? "text-primary-600 dark:text-primary-400"
        : "text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400"
    }`;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass shadow-sm py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold tracking-tight text-gradient">
          {config.brand.name}
        </Link>

        <nav className="hidden md:flex items-center gap-5">
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
          <Link href="/order/track" className={linkClass(pathname.startsWith("/order/track"))}>
            <Package size={14} /> Lacak Order
          </Link>
          <Link href="/customer/login" className={linkClass(pathname.startsWith("/customer"))}>
            <UserCircle2 size={14} /> Customer
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <Link
            href="/order"
            className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-primary-600/20"
          >
            Mulai Project <ArrowRight size={16} />
          </Link>
        </div>

        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2"
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
                className={`text-base font-medium py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 ${
                  pathname.startsWith("/order/track") ? "text-primary-600" : ""
                }`}
              >
                <Package size={16} /> Lacak Order
              </Link>
              <Link
                href="/customer/login"
                className={`text-base font-medium py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 ${
                  pathname.startsWith("/customer") ? "text-primary-600" : ""
                }`}
              >
                <UserCircle2 size={16} /> Login Customer
              </Link>
              <Link
                href="/order"
                className="bg-primary-600 text-white text-center py-3 rounded-lg font-semibold mt-2"
              >
                Mulai Project
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
