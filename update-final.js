const fs = require('fs');

console.log('\n Update Kontak, URL, & Menu Login...\n');

// ====== 1. Ganti Nomor WhatsApp (082117119762 -> 6282117119762) ======
const configPath = 'data/config.ts';
if (fs.existsSync(configPath)) {
  let c = fs.readFileSync(configPath, 'utf8');
  if (c.includes('6281234567890')) {
    c = c.replace(/6281234567890/g, '6282117119762');
    fs.writeFileSync(configPath, c, 'utf8');
    console.log('✅ Nomor WhatsApp diganti: 6282117119762 (0821-1711-9762)');
  } else if (c.includes('6282117119762')) {
    console.log('ℹ️  Nomor sudah benar');
  } else {
    console.log('⚠️  Nomor lama tidak ditemukan — cek manual data/config.ts');
  }
}

// ====== 2. Set NEXT_PUBLIC_SITE_URL (tanpa menghapus GAS URL) ======
const envPath = '.env.local';
let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
if (env.includes('NEXT_PUBLIC_SITE_URL')) {
  env = env.replace(/NEXT_PUBLIC_SITE_URL=.*/, 'NEXT_PUBLIC_SITE_URL=https://kastriva-portfolio.vercel.app');
} else {
  env += '\nNEXT_PUBLIC_SITE_URL=https://kastriva-portfolio.vercel.app\n';
}
fs.writeFileSync(envPath, env, 'utf8');
console.log('✅ .env.local: NEXT_PUBLIC_SITE_URL = https://kastriva-portfolio.vercel.app');

// ====== 3. Navbar + menu Customer ======
fs.writeFileSync('components/Navbar.tsx', `"use client";
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
    \`text-sm font-medium transition-colors flex items-center gap-1 \${
      active
        ? "text-primary-600 dark:text-primary-400"
        : "text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400"
    }\`;

  return (
    <header
      className={\`fixed top-0 left-0 right-0 z-50 transition-all duration-300 \${
        scrolled ? "glass shadow-sm py-3" : "bg-transparent py-5"
      }\`}
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
              className={\`text-sm font-medium transition-colors \${
                isActive(link.href)
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400"
              }\`}
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
                  className={\`text-base font-medium py-2 border-b border-slate-100 dark:border-slate-800 \${
                    isActive(link.href) ? "text-primary-600" : ""
                  }\`}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                href="/order/track"
                className={\`text-base font-medium py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 \${
                  pathname.startsWith("/order/track") ? "text-primary-600" : ""
                }\`}
              >
                <Package size={16} /> Lacak Order
              </Link>
              <Link
                href="/customer/login"
                className={\`text-base font-medium py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 \${
                  pathname.startsWith("/customer") ? "text-primary-600" : ""
                }\`}
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
`, 'utf8');
console.log('✅ Navbar: + menu "Customer" (desktop & mobile)');

// ====== 4. Footer + link Login Customer & Login Admin ======
fs.writeFileSync('components/Footer.tsx', `import { config } from "@/data/config";
import {
  Instagram,
  Github,
  Globe,
  MessageCircle,
  Package,
  UserCircle2,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-50 dark:bg-dark-surface border-t border-slate-200 dark:border-slate-800 pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold text-gradient mb-4">{config.brand.name}</h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-sm mb-6">
              {config.brand.tagline}. Fokus pada kualitas kode, desain modern, dan kepuasan klien.
            </p>
            <div className="flex gap-4">
              <a href={config.brand.socials.instagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white dark:bg-dark-bg border border-slate-200 dark:border-slate-700 hover:text-primary-600 transition-colors">
                <Instagram size={20} />
              </a>
              <a href={config.brand.socials.github} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white dark:bg-dark-bg border border-slate-200 dark:border-slate-700 hover:text-primary-600 transition-colors">
                <Github size={20} />
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-4">Navigasi</h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><Link href="/" className="hover:text-primary-600 transition-colors">Home</Link></li>
              <li><Link href="/services" className="hover:text-primary-600 transition-colors">Services</Link></li>
              <li><Link href="/portfolio" className="hover:text-primary-600 transition-colors">Portfolio</Link></li>
              <li><Link href="/about" className="hover:text-primary-600 transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-primary-600 transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Customer & Admin</h4>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/order" className="hover:text-primary-600 transition-colors flex items-center gap-2">
                  <Package size={14} /> Mulai Project
                </Link>
              </li>
              <li>
                <Link href="/order/track" className="hover:text-primary-600 transition-colors flex items-center gap-2">
                  <Package size={14} /> Lacak Order
                </Link>
              </li>
              <li>
                <Link href="/customer/login" className="hover:text-primary-600 transition-colors flex items-center gap-2">
                  <UserCircle2 size={14} /> Login Customer
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-primary-600 transition-colors flex items-center gap-2">
                  <ShieldCheck size={14} /> Login Admin
                </Link>
              </li>
              <li className="flex items-center gap-2 pt-2">
                <MessageCircle size={14} /> 0821-1711-9762
              </li>
              <li className="flex items-center gap-2">
                <Globe size={14} /> {config.brand.email}
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-200 dark:border-slate-800 pt-8 text-center text-sm text-slate-500">
          © 2026 {config.brand.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
`, 'utf8');
console.log('✅ Footer: + link "Login Customer" & "Login Admin"');

console.log('\n🎉 Selesai! Langkah selanjutnya:');
console.log('1. npm run dev → cek navbar ada menu "Customer", footer ada 2 link login');
console.log('2. Klik tombol WhatsApp → harus terbuka wa.me/6282117119762');
console.log('3. Update Google Sheets → sheet Settings → baris "whatsapp" isi: 6282117119762');
console.log('4. Vercel: Settings → Environment Variables → tambah NEXT_PUBLIC_SITE_URL');
console.log('5. git add . && git commit -m "Update kontak, menu login customer & admin" && git push');