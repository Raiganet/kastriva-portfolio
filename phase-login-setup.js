const fs = require('fs');

console.log('\n🎨 Setup Premium Login Page + Navbar Login...\n');

if (!fs.existsSync('public/logo-kastriva.png')) {
  console.log('⚠️  public/logo-kastriva.png belum ada!');
  console.log('   Copy logo horizontal Kastriva Anda ke public/logo-kastriva.png');
  console.log('   (Halaman punya fallback otomatis jika logo tidak ditemukan)\n');
}

// ====== 1. Auth services + Remember me ======
fs.writeFileSync('lib/services/auth.service.ts', `import { gasPost } from "@/lib/gas-client";

const TOKEN_KEY = "kastriva_admin_token";

export interface AdminSession {
  token: string;
  email: string;
  expiresAt: number;
}

function store(key: string, value: string, remember: boolean) {
  if (typeof window === "undefined") return;
  if (remember) window.localStorage.setItem(key, value);
  else window.sessionStorage.setItem(key, value);
}

function read(key: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
}

function clearKey(key: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
  window.sessionStorage.removeItem(key);
}

export class AdminAuthService {
  static async login(
    email: string,
    password: string,
    remember = true
  ): Promise<{ success: boolean; error?: string }> {
    const res = await gasPost<AdminSession>({ action: "login", email, password });
    if (res.success && res.data && res.data.token) {
      store(TOKEN_KEY, JSON.stringify(res.data), remember);
      return { success: true };
    }
    return { success: false, error: res.error || "Email atau password salah" };
  }

  static getSession(): AdminSession | null {
    try {
      const raw = read(TOKEN_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as AdminSession;
      if (!session.token || Date.now() > session.expiresAt) {
        clearKey(TOKEN_KEY);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }

  static getToken(): string | null {
    const s = this.getSession();
    return s ? s.token : null;
  }

  static isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  static logout(): void {
    const token = this.getToken();
    if (token) gasPost({ action: "logout", token }).catch(() => {});
    clearKey(TOKEN_KEY);
  }
}
`, 'utf8');
console.log('✅ Updated: lib/services/auth.service.ts (remember me)');

fs.writeFileSync('lib/services/customer-auth.service.ts', `import { gasPost } from "@/lib/gas-client";

const TOKEN_KEY = "kastriva_customer_token";

export interface CustomerSession {
  token: string;
  customerId: string;
  name: string;
  expiresAt: number;
}

function store(key: string, value: string, remember: boolean) {
  if (typeof window === "undefined") return;
  if (remember) window.localStorage.setItem(key, value);
  else window.sessionStorage.setItem(key, value);
}

function read(key: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
}

function clearKey(key: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
  window.sessionStorage.removeItem(key);
}

export class CustomerAuthService {
  static async login(
    email: string,
    orderNumber: string,
    remember = true
  ): Promise<{ success: boolean; error?: string }> {
    const res = await gasPost<CustomerSession>({
      action: "customerLogin",
      email,
      orderNumber,
    });
    if (res.success && res.data && res.data.token) {
      store(TOKEN_KEY, JSON.stringify(res.data), remember);
      return { success: true };
    }
    return { success: false, error: res.error || "Login gagal" };
  }

  static getSession(): CustomerSession | null {
    try {
      const raw = read(TOKEN_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as CustomerSession;
      if (!session.token || Date.now() > session.expiresAt) {
        clearKey(TOKEN_KEY);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }

  static getToken(): string | null {
    const s = this.getSession();
    return s ? s.token : null;
  }

  static isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  static logout(): void {
    const token = this.getToken();
    if (token) gasPost({ action: "customerLogout", token }).catch(() => {});
    clearKey(TOKEN_KEY);
  }
}
`, 'utf8');
console.log('✅ Updated: lib/services/customer-auth.service.ts (remember me)');

// ====== 2. Login Page Client (Animated Split-Screen) ======
fs.writeFileSync('components/auth/LoginPageClient.tsx', `"use client";
import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  UserCircle2,
  Mail,
  Lock,
  Package,
  Eye,
  EyeOff,
  Code2,
  Rocket,
  Layers,
  Loader2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { AdminAuthService } from "@/lib/services/auth.service";
import { CustomerAuthService } from "@/lib/services/customer-auth.service";
import { getWhatsAppLink } from "@/data/config";

type Role = "admin" | "customer";

const features = [
  { icon: Code2, label: "Clean Code" },
  { icon: Rocket, label: "Performance" },
  { icon: ShieldCheck, label: "Security" },
  { icon: Layers, label: "Scalable" },
];

export default function LoginPageClient() {
  const [role, setRole] = useState<Role>("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const router = useRouter();

  const isAdmin = role === "admin";

  useEffect(() => {
    if (AdminAuthService.isLoggedIn()) router.replace("/admin");
    else if (CustomerAuthService.isLoggedIn()) router.replace("/customer");
  }, [router]);

  const switchRole = (r: Role) => {
    setRole(r);
    setError("");
  };

  const validate = (): string => {
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) return "Format email tidak valid";
    if (isAdmin && password.length < 6) return "Password minimal 6 karakter";
    if (!isAdmin && !/^KAS-\\d{4}-\\d{4}$/.test(orderNumber.trim().toUpperCase()))
      return "Format nomor order: KAS-2026-0001";
    return "";
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError("");
    setLoading(true);
    const res = isAdmin
      ? await AdminAuthService.login(email, password, remember)
      : await CustomerAuthService.login(email, orderNumber.trim().toUpperCase(), remember);
    setLoading(false);
    if (res.success) router.push(isAdmin ? "/admin" : "/customer");
    else setError(res.error || "Login gagal");
  };

  const RoleToggle = ({ floating }: { floating?: boolean }) => (
    <div
      className={
        floating
          ? "hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
          : "flex lg:hidden justify-center mb-8"
      }
    >
      <div className="flex rounded-full p-1.5 bg-white/95 backdrop-blur border border-slate-200 shadow-2xl shadow-black/20">
        {(["admin", "customer"] as Role[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => switchRole(r)}
            aria-pressed={role === r}
            className={\`relative px-6 lg:px-8 py-2.5 rounded-full text-sm font-semibold transition-colors duration-300 \${
              role === r ? "text-white" : "text-slate-500 hover:text-slate-900"
            }\`}
          >
            {role === r && (
              <motion.span
                layoutId={floating ? "pill-float" : "pill-mobile"}
                className={\`absolute inset-0 rounded-full \${
                  r === "admin"
                    ? "bg-gradient-to-r from-[#0066FF] to-[#00D9FF] shadow-lg shadow-blue-500/40"
                    : "bg-slate-900 shadow-lg shadow-slate-900/30"
                }\`}
                transition={{ type: "spring", stiffness: 350, damping: 32 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {r === "admin" ? <ShieldCheck size={16} /> : <UserCircle2 size={16} />}
              {r === "admin" ? "Admin" : "Customer"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#02040A] flex items-center justify-center p-4 lg:p-8 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#0066FF]/15 blur-[140px]" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-[#7C3AED]/15 blur-[140px]" />

      <div className="relative w-full max-w-6xl rounded-[24px] overflow-hidden grid lg:grid-cols-2 shadow-2xl shadow-blue-900/30 border border-white/5">
        <RoleToggle floating />

        {/* ===== LEFT: BRANDING PANEL ===== */}
        <div
          className={\`relative p-8 lg:p-12 flex flex-col gap-8 transition-colors duration-700 \${
            isAdmin ? "bg-[#050B18]" : "bg-[#F5F7FA]"
          }\`}
        >
          <div
            className={\`absolute top-0 left-0 w-72 h-72 rounded-full blur-[110px] transition-opacity duration-700 \${
              isAdmin ? "bg-[#0066FF]/25 opacity-100" : "bg-[#0066FF]/10 opacity-60"
            }\`}
          />
          <div
            className={\`absolute bottom-0 right-0 w-72 h-72 rounded-full blur-[110px] transition-opacity duration-700 \${
              isAdmin ? "bg-[#7C3AED]/20 opacity-100" : "bg-[#7C3AED]/10 opacity-50"
            }\`}
          />

          <pre
            className={\`hidden lg:block absolute right-8 bottom-24 text-[10px] leading-relaxed font-mono select-none pointer-events-none transition-colors duration-700 \${
              isAdmin ? "text-cyan-300/15" : "text-slate-900/10"
            }\`}
          >{`const kastriva = {
  clean: true,
  fast: true,
  secure: true,
};`}</pre>

          {/* Logo */}
          <div className="relative z-10">
            {logoError ? (
              <div className="flex items-center gap-3">
                <img src="/android-chrome-192x192.png" alt="Kastriva" className="w-14 h-14 rounded-2xl" />
                <span className={\`text-2xl font-extrabold tracking-widest \${isAdmin ? "text-white" : "text-slate-900"}\`}>
                  KASTRIVA
                </span>
              </div>
            ) : (
              <img
                src="/logo-kastriva.png"
                alt="Kastriva – Web Developer"
                className="h-16 lg:h-20 w-auto object-contain"
                onError={() => setLogoError(true)}
              />
            )}
          </div>

          <div className="relative z-10 space-y-4">
            <h1 className={\`text-3xl lg:text-4xl font-bold transition-colors duration-700 \${isAdmin ? "text-white" : "text-slate-900"}\`}>
              Code. Build.{" "}
              <span className="bg-gradient-to-r from-[#00D9FF] to-[#7C3AED] bg-clip-text text-transparent">
                Solution.
              </span>
            </h1>
            <p className={\`max-w-md leading-relaxed transition-colors duration-700 \${isAdmin ? "text-slate-400" : "text-slate-600"}\`}>
              Kastriva hadir untuk membantu Anda membangun solusi digital yang modern, cepat, dan terpercaya.
            </p>
          </div>

          <div
            className={\`relative z-10 p-4 rounded-2xl border max-w-sm backdrop-blur transition-colors duration-700 \${
              isAdmin ? "bg-[#0A1428]/80 border-blue-500/20" : "bg-white/80 border-slate-200"
            }\`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#0066FF] to-[#00D9FF] shadow-lg shadow-blue-600/30">
                <Code2 size={18} className="text-white" />
              </div>
              <p className={\`text-sm \${isAdmin ? "text-slate-300" : "text-slate-600"}\`}>
                We craft <span className="text-[#00D9FF] font-semibold">clean code</span> and powerful{" "}
                <span className="text-[#7C3AED] font-semibold">digital experience</span>.
              </p>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-4 gap-3 mt-auto hidden sm:grid">
            {features.map((f) => (
              <div key={f.label} className="flex flex-col items-center gap-2">
                <div
                  className={\`p-3 rounded-2xl border transition-colors duration-700 \${
                    isAdmin ? "bg-[#0A1428]/80 border-blue-500/20" : "bg-white border-slate-200"
                  }\`}
                >
                  <f.icon size={20} className={isAdmin ? "text-[#00D9FF]" : "text-[#0066FF]"} />
                </div>
                <span className={\`text-xs font-medium transition-colors duration-700 \${isAdmin ? "text-slate-400" : "text-slate-600"}\`}>
                  {f.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ===== RIGHT: LOGIN PANEL ===== */}
        <div className="relative bg-white p-8 lg:p-12 flex flex-col justify-center">
          <RoleToggle />

          <div className="text-center mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900">Welcome Back!</h2>
            <p className="text-slate-500 mt-2 text-sm">Login to access your Kastriva dashboard</p>
          </div>

          <motion.div
            key={role}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-md mx-auto"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className={\`p-2.5 rounded-xl transition-colors duration-500 \${isAdmin ? "bg-blue-50 text-[#0066FF]" : "bg-slate-100 text-slate-700"}\`}>
                {isAdmin ? <ShieldCheck size={20} /> : <UserCircle2 size={20} />}
              </div>
              <div>
                <h3 className={\`font-bold transition-colors duration-500 \${isAdmin ? "text-[#0066FF]" : "text-slate-900"}\`}>
                  {isAdmin ? "Admin Login" : "Customer Login"}
                </h3>
                <p className="text-xs text-slate-500">
                  {isAdmin ? "Sign in to continue to the admin dashboard" : "Sign in to continue to your account"}
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={isAdmin ? "admin@kastriva.com" : "email@anda.com"}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-[#F5F7FA]/60 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/60 focus:border-[#0066FF] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {isAdmin ? (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 bg-[#F5F7FA]/60 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/60 focus:border-[#0066FF] focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="orderNumber" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Nomor Order
                  </label>
                  <div className="relative">
                    <Package size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="orderNumber"
                      type="text"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                      placeholder="KAS-2026-0001"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-[#F5F7FA]/60 text-slate-900 placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-[#0066FF]/60 focus:border-[#0066FF] focus:bg-white transition-all"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">Nomor order ada di email konfirmasi Anda.</p>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#0066FF]"
                  />
                  Remember me
                </label>
                <a
                  href={getWhatsAppLink("Halo Kastriva, saya butuh bantuan untuk login.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0066FF] hover:underline font-medium"
                >
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={\`w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all duration-500 disabled:opacity-60 \${
                  isAdmin
                    ? "bg-gradient-to-r from-[#0066FF] to-[#00D9FF] shadow-lg shadow-blue-600/40 hover:shadow-blue-600/60 hover:-translate-y-0.5"
                    : "bg-slate-900 shadow-lg shadow-slate-900/30 hover:bg-slate-800 hover:-translate-y-0.5"
                }\`}
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
                {loading ? "Memverifikasi..." : isAdmin ? "Login as Admin" : "Login as Customer"}
              </button>
            </form>
          </motion.div>

          <p className="text-center text-xs text-slate-400 mt-10">© 2026 Kastriva. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
`, 'utf8');
console.log('✅ Created: components/auth/LoginPageClient.tsx');

// ====== 3. Route /login ======
fs.writeFileSync('app/login/page.tsx', `import { Metadata } from "next";
import LoginPageClient from "@/components/auth/LoginPageClient";

export const metadata: Metadata = {
  title: "Login | Kastriva",
  robots: "noindex, nofollow",
};

export default function LoginPage() {
  return <LoginPageClient />;
}
`, 'utf8');
console.log('✅ Created: app/login/page.tsx');

// ====== 4. Old login pages -> redirect ke /login ======
fs.writeFileSync('app/admin/login/page.tsx', `import { redirect } from "next/navigation";

export default function Page() {
  redirect("/login");
}
`, 'utf8');

fs.writeFileSync('app/customer/login/page.tsx', `import { redirect } from "next/navigation";

export default function Page() {
  redirect("/login");
}
`, 'utf8');
console.log('✅ /admin/login & /customer/login sekarang redirect ke /login');

// ====== 5. Guards redirect ke /login ======
fs.writeFileSync('components/admin/AdminGuard.tsx', `"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AdminAuthService } from "@/lib/services/auth.service";
import { LoadingSpinner } from "@/components/ui";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setChecking(false);
      return;
    }
    if (!AdminAuthService.isLoggedIn()) {
      router.replace("/login");
    } else {
      setChecking(false);
    }
  }, [router, pathname, isLoginPage]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-bg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
`, 'utf8');

fs.writeFileSync('components/customer/CustomerGuard.tsx', `"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { CustomerAuthService } from "@/lib/services/customer-auth.service";
import { LoadingSpinner } from "@/components/ui";

export default function CustomerGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const isLoginPage = pathname === "/customer/login";

  useEffect(() => {
    if (isLoginPage) {
      setChecking(false);
      return;
    }
    if (!CustomerAuthService.isLoggedIn()) {
      router.replace("/login");
    } else {
      setChecking(false);
    }
  }, [router, pathname, isLoginPage]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-bg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
`, 'utf8');
console.log('✅ Guards redirect ke /login');

// ====== 6. Navbar: tombol Login di kanan atas ======
fs.writeFileSync('components/Navbar.tsx', `"use client";
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
import { config } from "@/data/config";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminAuthService } from "@/lib/services/auth.service";
import { CustomerAuthService } from "@/lib/services/customer-auth.service";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [auth, setAuth] = useState<null | { role: "admin" | "customer" }>(null);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    if (AdminAuthService.isLoggedIn()) setAuth({ role: "admin" });
    else if (CustomerAuthService.isLoggedIn()) setAuth({ role: "customer" });
    else setAuth(null);
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

  return (
    <header
      className={\`fixed top-0 left-0 right-0 z-50 transition-all duration-300 \${
        scrolled ? "glass shadow-sm py-3" : "bg-transparent py-5"
      }\`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <img
            src="/android-chrome-192x192.png"
            alt="Logo Kastriva"
            className="w-9 h-9 rounded-xl shadow-lg shadow-primary-600/30"
          />
          <span className="text-xl font-bold tracking-tight text-gradient">
            {config.brand.name}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
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
          <Link
            href="/order/track"
            className={\`text-sm font-medium transition-colors flex items-center gap-1 \${
              pathname.startsWith("/order/track")
                ? "text-primary-600 dark:text-primary-400"
                : "text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400"
            }\`}
          >
            <Package size={14} /> Lacak Order
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
            Mulai Project <ArrowRight size={16} />
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
                  className={\`text-base font-medium py-2 border-b border-slate-100 dark:border-slate-800 \${
                    isActive(link.href) ? "text-primary-600" : ""
                  }\`}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                href="/order/track"
                className="text-base font-medium py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2"
              >
                <Package size={16} /> Lacak Order
              </Link>
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
console.log('✅ Navbar: tombol Login di kanan atas (jadi "Dashboard" jika sudah login)');

console.log('\n🎉 Setup login premium selesai!');
console.log('');
console.log('📌 LANGKAH:');
console.log('1. npm run dev');
console.log('2. Buka http://localhost:3000/login');
console.log('   - Toggle Admin/Customer → tema berubah smooth, tanpa reload');
console.log('   - Login admin: email + password (dari Config.gs)');
console.log('   - Login customer: email + nomor order');
console.log('3. Cek navbar → tombol "Login" di kanan atas');
console.log('4. git add . && git commit -m "Premium split-screen login + navbar login" && git push');