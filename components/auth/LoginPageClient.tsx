"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Code2,
  Eye,
  EyeOff,
  Home,
  Layers,
  Loader2,
  Lock,
  Mail,
  Package,
  Rocket,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";
import { AdminAuthService } from "@/lib/services/auth.service";
import { CustomerAuthService } from "@/lib/services/customer-auth.service";
import { useSiteContent } from "@/components/cms/SiteContentProvider";
import { buildWhatsAppLink } from "@/lib/contact";
import BrandLogo from "@/components/BrandLogo";

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
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [notice, setNotice] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const site = useSiteContent();

  const isAdmin = role === "admin";

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("role");
    if (requested === "customer" || window.location.pathname === "/customer/login") {
      setRole("customer");
    }
    // Clear legacy browser credentials; a fresh login rotates the server session.
    import("@/lib/services/session-client").then((m) => m.clearLegacyCredentials());
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const switchRole = (r: Role) => {
    setRole(r);
    setError("");
    setNotice("");
    setCode("");
    setChallengeId("");
    setPassword("");
  };

  const requestCode = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Format email tidak valid");
      return;
    }
    setLoading(true);
    setError("");
    const res = await CustomerAuthService.requestCode(email.trim());
    setLoading(false);
    if (res.success && res.data) {
      setChallengeId(res.data.challengeId);
      setCode("");
      setCooldown(res.data.retryAfter);
      setNotice(
        res.message ||
          "Jika email terdaftar, kode telah dikirim. Periksa inbox dan spam. Kode berlaku 10 menit.",
      );
    } else {
      setError(res.error || "Tidak dapat meminta kode.");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!isAdmin && !challengeId) {
      await requestCode();
      return;
    }
    if (!isAdmin && !/^\d{8}$/.test(code)) {
      setError("Masukkan 8 digit kode verifikasi.");
      return;
    }
    if (isAdmin && (!email.trim() || !password)) {
      setError("Email dan password wajib diisi.");
      return;
    }

    setError("");
    setLoading(true);
    const res = isAdmin
      ? await AdminAuthService.login(email.trim(), password, remember)
      : await CustomerAuthService.login(challengeId, code, remember);
    setLoading(false);

    if (res.success) router.push(isAdmin ? "/admin" : "/customer");
    else setError(res.error || "Login gagal");
  };

  const RoleToggle = () => (
    <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-100 p-1 shadow-inner">
      {(["admin", "customer"] as Role[]).map((r) => (
        <button
          key={r}
          type="button"
          disabled={loading}
          onClick={() => switchRole(r)}
          aria-pressed={role === r}
          className={`relative min-w-[118px] rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 sm:min-w-[132px] sm:px-5 ${
            role === r
              ? r === "admin"
                ? "bg-gradient-to-r from-primary-600 to-violet-500 text-white shadow-lg shadow-primary-600/25"
                : "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            {r === "admin" ? <ShieldCheck size={16} /> : <UserCircle2 size={16} />}
            {r === "admin" ? "Admin" : "Customer"}
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070711] px-4 pb-8 pt-28 sm:px-6 lg:px-8 lg:pt-32">
      {/* Login navigation: keeps users inside the site without relying on browser Back. */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#070711]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex min-w-0 items-center" aria-label={`Kembali ke beranda ${site.brand.name}`}>
            <BrandLogo
              alt={`Logo ${site.brand.name}`}
              surface="dark"
              priority
              className="w-[150px] sm:w-[172px] transition duration-300 group-hover:brightness-110"
            />
          </Link>

          <nav className="hidden items-center gap-6 lg:flex" aria-label="Navigasi login">
            <Link href="/services" className="text-sm font-medium text-slate-300 transition hover:text-white">Layanan</Link>
            <Link href="/portfolio" className="text-sm font-medium text-slate-300 transition hover:text-white">Portfolio</Link>
            <Link href="/order/track" className="flex items-center gap-1.5 text-sm font-medium text-slate-300 transition hover:text-white">
              <Package size={15} /> Lacak Order
            </Link>
          </nav>

          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-primary-400/50 hover:bg-primary-600/15 sm:px-4"
          >
            <Home size={16} />
            <span className="hidden sm:inline">Kembali ke Beranda</span>
            <span className="sm:hidden">Beranda</span>
          </Link>
        </div>
      </header>

      <div className="pointer-events-none absolute -left-32 -top-48 h-[520px] w-[520px] rounded-full bg-primary-600/20 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-56 -right-32 h-[560px] w-[560px] rounded-full bg-violet-600/20 blur-[140px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,.07),transparent_35%)]" />

      <section className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-[30px] border border-white/10 bg-white shadow-2xl shadow-black/50 lg:grid lg:grid-cols-[0.95fr_1.05fr]">
        {/* Brand panel */}
        <div
          className={`relative flex min-h-[330px] flex-col justify-between overflow-hidden p-7 transition-colors duration-500 sm:p-10 lg:min-h-[680px] lg:p-12 ${
            isAdmin ? "bg-[#0A0A1A]" : "bg-slate-50"
          }`}
        >
          <div className={`absolute -right-20 -top-20 h-72 w-72 rounded-full blur-3xl ${isAdmin ? "bg-primary-500/15" : "bg-violet-300/25"}`} />
          <div className={`absolute -bottom-28 -left-20 h-80 w-80 rounded-full blur-3xl ${isAdmin ? "bg-cyan-500/10" : "bg-cyan-200/25"}`} />
          <div className="pointer-events-none absolute inset-0 opacity-[0.045] [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] [background-size:32px_32px]" />

          {/* Canonical logo: artwork stays identical; only the contrast variant changes. */}
          <div className="relative z-10">
            <div
              className={`inline-flex rounded-2xl border px-4 py-3 backdrop-blur-md ${
                isAdmin
                  ? "border-white/10 bg-white/[0.045] shadow-lg shadow-black/10"
                  : "border-slate-200/80 bg-white/90 shadow-sm"
              }`}
            >
              <BrandLogo
                alt={`Logo ${site.brand.name}`}
                surface={isAdmin ? "dark" : "light"}
                className="w-[205px] sm:w-[235px]"
              />
            </div>
          </div>

          <div className="relative z-10 mt-10 lg:mt-0">
            <p className={`mb-3 text-xs font-bold uppercase tracking-[.28em] ${isAdmin ? "text-violet-300" : "text-primary-600"}`}>Digital Studio</p>
            <h1 className={`max-w-xl text-4xl font-black leading-[1.05] sm:text-5xl ${isAdmin ? "text-white" : "text-slate-900"}`}>
              Code. Build. <span className="bg-gradient-to-r from-violet-400 via-primary-500 to-cyan-400 bg-clip-text text-transparent">Solution.</span>
            </h1>
            <p className={`mt-5 max-w-lg text-sm leading-7 sm:text-base ${isAdmin ? "text-slate-300" : "text-slate-600"}`}>
              Kelola project, portfolio, dan layanan Kastriva dari satu tempat dengan tampilan yang sederhana dan profesional.
            </p>

            <div className={`mt-8 rounded-2xl border p-4 backdrop-blur ${isAdmin ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"}`}>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-primary-600 to-violet-500 p-3 shadow-lg shadow-primary-600/25">
                  <Code2 size={19} className="text-white" />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${isAdmin ? "text-white" : "text-slate-900"}`}>Modern. Fast. Reliable.</p>
                  <p className={`mt-0.5 text-xs ${isAdmin ? "text-slate-400" : "text-slate-500"}`}>Digital experience yang dibuat dengan detail.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-8 hidden grid-cols-4 gap-3 sm:grid">
            {features.map((f) => (
              <div key={f.label} className="text-center">
                <div className={`mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl border ${isAdmin ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"}`}>
                  <f.icon size={18} className={isAdmin ? "text-violet-300" : "text-primary-600"} />
                </div>
                <span className={`text-[11px] font-medium ${isAdmin ? "text-slate-400" : "text-slate-500"}`}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form panel */}
        <div className="flex flex-col justify-center bg-white px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
          <div className="mb-8 flex flex-col items-center text-center">
            <RoleToggle />
            <motion.div
              key={role}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-7"
            >
              <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${isAdmin ? "bg-primary-50 text-primary-600" : "bg-slate-100 text-slate-700"}`}>
                {isAdmin ? <ShieldCheck size={25} /> : <UserCircle2 size={25} />}
              </div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900">Welcome Back!</h2>
              <p className="mt-2 text-sm text-slate-500">{isAdmin ? `Masuk ke dashboard admin ${site.brand.name}` : "Lacak dan kelola project Anda"}</p>
            </motion.div>
          </div>

          <motion.div
            key={`form-${role}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="mx-auto w-full max-w-md"
          >
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
              <div className={`rounded-xl p-2 ${isAdmin ? "bg-primary-100 text-primary-600" : "bg-slate-200 text-slate-700"}`}>
                {isAdmin ? <ShieldCheck size={18} /> : <UserCircle2 size={18} />}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{isAdmin ? "Admin Login" : "Customer Login"}</p>
                <p className="text-xs text-slate-500">{isAdmin ? "Akses pengelolaan website & CMS" : "Masuk dengan kode verifikasi email"}</p>
              </div>
            </div>

            {notice && <p role="status" className="mb-4 rounded-xl bg-primary-50 p-3 text-sm text-primary-800">{notice}</p>}
            {error && (
              <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    disabled={loading || !!challengeId}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={isAdmin ? "admin@kastriva.com" : "email@anda.com"}
                    className="login-input w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-slate-900 placeholder-slate-400 outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
              </div>

              {isAdmin ? (
                <div>
                  <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700">Password</label>
                  <div className="relative">
                    <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="login-input w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-slate-900 outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>
              ) : challengeId ? (
                <div>
                  <label htmlFor="otp" className="mb-1.5 block text-sm font-semibold text-slate-700">Kode verifikasi email</label>
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={8}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="8 digit kode"
                    className="login-input w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 font-mono text-slate-900 outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
                  />
                  <div className="mt-3 flex justify-between text-xs text-primary-700">
                    <button type="button" disabled={loading || cooldown > 0} onClick={requestCode} className="font-semibold disabled:text-slate-400">
                      {cooldown > 0 ? `Kirim ulang (${cooldown}s)` : "Kirim ulang kode"}
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      className="font-semibold"
                      onClick={() => {
                        setChallengeId("");
                        setCode("");
                        setNotice("");
                        setError("");
                      }}
                    >
                      Ganti email
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-6 text-slate-500">Gunakan email yang digunakan saat memesan. Kode akan dikirim ke email tersebut.</p>
              )}

              <div className="flex items-center justify-between gap-3 pt-1 text-sm">
                <label className="flex cursor-pointer select-none items-center gap-2 text-slate-600">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded accent-primary-600"
                  />
                  Remember me
                </label>
                <a
                  href={buildWhatsAppLink(site.brand.whatsapp, `Halo ${site.brand.name}, saya butuh bantuan untuk login.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-primary-600 transition hover:text-primary-700 hover:underline"
                >
                  Butuh bantuan?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                  isAdmin
                    ? "bg-gradient-to-r from-primary-600 to-violet-500 shadow-lg shadow-primary-600/25 hover:-translate-y-0.5 hover:shadow-primary-600/40"
                    : "bg-slate-900 shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 hover:bg-slate-800"
                }`}
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
                {loading ? "Memverifikasi..." : isAdmin ? "Masuk sebagai Admin" : challengeId ? "Verifikasi & Masuk" : "Kirim kode ke email"}
              </button>
            </form>
          </motion.div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs text-slate-400">
            <span>© {new Date().getFullYear()} {site.brand.name}</span>
            <span aria-hidden="true">·</span>
            <span>Secure Access</span>
            <span aria-hidden="true">·</span>
            <Link href="/" className="font-medium text-slate-500 transition hover:text-primary-600">Kembali ke website</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
