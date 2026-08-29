"use client";
import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShieldCheck, UserCircle2, Mail, Lock, Package,
  Eye, EyeOff, Code2, Rocket, Layers, Loader2,
  AlertCircle, ArrowRight,
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Format email tidak valid";
    if (isAdmin && password.length < 6) return "Password minimal 6 karakter";
    if (!isAdmin && !/^KAS-\d{4}-\d{4}$/.test(orderNumber.trim().toUpperCase()))
      return "Format nomor order: KAS-2026-0001";
    return "";
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (v) { setError(v); return; }
    setError("");
    setLoading(true);
    const res = isAdmin
      ? await AdminAuthService.login(email, password, remember)
      : await CustomerAuthService.login(email, orderNumber.trim().toUpperCase(), remember);
    setLoading(false);
    if (res.success) router.push(isAdmin ? "/admin" : "/customer");
    else setError(res.error || "Login gagal");
  };

  const RoleToggle = () => (
    <div className="inline-flex rounded-2xl bg-slate-100 p-1 border border-slate-200 shadow-inner">
      {(["admin", "customer"] as Role[]).map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => switchRole(r)}
          aria-pressed={role === r}
          className={`relative min-w-[132px] px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
            role === r
              ? r === "admin"
                ? "bg-gradient-to-r from-[#0066FF] to-[#00B8FF] text-white shadow-lg shadow-blue-500/25"
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
    <main className="min-h-screen bg-[#02040A] relative overflow-hidden flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -top-48 -left-32 h-[520px] w-[520px] rounded-full bg-blue-600/20 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-56 -right-32 h-[560px] w-[560px] rounded-full bg-violet-600/20 blur-[140px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,.07),transparent_35%)]" />

      <section className="relative w-full max-w-5xl overflow-hidden rounded-[30px] border border-white/10 bg-white shadow-2xl shadow-black/50 lg:grid lg:grid-cols-[0.95fr_1.05fr]">
        {/* Brand panel */}
        <div className={`relative min-h-[330px] overflow-hidden p-7 sm:p-10 lg:min-h-[700px] lg:p-12 flex flex-col justify-between transition-colors duration-500 ${isAdmin ? "bg-[#061126]" : "bg-slate-50"}`}>
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <img src={isAdmin ? "/logo-dark.png" : "/logo-light.png"} alt="Kastriva" className="h-12 w-auto max-w-[210px] object-contain" onError={() => setLogoError(true)} />
              {logoError && <span className={`text-xl font-black tracking-[.22em] ${isAdmin ? "text-white" : "text-slate-900"}`}>KASTRIVA</span>}
            </div>
          </div>

          <div className="relative z-10 mt-10 lg:mt-0">
            <p className={`mb-3 text-xs font-bold uppercase tracking-[.28em] ${isAdmin ? "text-cyan-300" : "text-blue-600"}`}>Digital Studio</p>
            <h1 className={`max-w-xl text-4xl font-black leading-[1.05] sm:text-5xl ${isAdmin ? "text-white" : "text-slate-900"}`}>
              Code. Build. <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 bg-clip-text text-transparent">Solution.</span>
            </h1>
            <p className={`mt-5 max-w-lg text-sm leading-7 sm:text-base ${isAdmin ? "text-slate-300" : "text-slate-600"}`}>
              Kelola project, portfolio, dan layanan Kastriva dari satu tempat dengan tampilan yang sederhana dan profesional.
            </p>

            <div className={`mt-8 rounded-2xl border p-4 backdrop-blur ${isAdmin ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"}`}>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 p-3 shadow-lg shadow-blue-500/30"><Code2 size={19} className="text-white" /></div>
                <div>
                  <p className={`text-sm font-semibold ${isAdmin ? "text-white" : "text-slate-900"}`}>Modern. Fast. Reliable.</p>
                  <p className={`text-xs mt-0.5 ${isAdmin ? "text-slate-400" : "text-slate-500"}`}>Digital experience yang dibuat dengan detail.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-8 hidden grid-cols-4 gap-3 sm:grid">
            {features.map((f) => (
              <div key={f.label} className="text-center">
                <div className={`mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl border ${isAdmin ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"}`}>
                  <f.icon size={18} className={isAdmin ? "text-cyan-300" : "text-blue-600"} />
                </div>
                <span className={`text-[11px] font-medium ${isAdmin ? "text-slate-400" : "text-slate-500"}`}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form panel */}
        <div className="bg-white px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12 flex flex-col justify-center">
          <div className="mb-8 flex flex-col items-center text-center">
            <RoleToggle />
            <motion.div key={role} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .25 }} className="mt-7">
              <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${isAdmin ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-700"}`}>
                {isAdmin ? <ShieldCheck size={25} /> : <UserCircle2 size={25} />}
              </div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900">Welcome Back!</h2>
              <p className="mt-2 text-sm text-slate-500">{isAdmin ? "Masuk ke dashboard admin Kastriva" : "Lacak dan kelola project Anda"}</p>
            </motion.div>
          </div>

          <motion.div key={`form-${role}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .25 }} className="mx-auto w-full max-w-md">
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
              <div className={`rounded-xl p-2 ${isAdmin ? "bg-blue-100 text-blue-600" : "bg-slate-200 text-slate-700"}`}>{isAdmin ? <ShieldCheck size={18} /> : <UserCircle2 size={18} />}</div>
              <div>
                <p className="text-sm font-bold text-slate-900">{isAdmin ? "Admin Login" : "Customer Login"}</p>
                <p className="text-xs text-slate-500">{isAdmin ? "Akses pengelolaan website & CMS" : "Gunakan email dan nomor order"}</p>
              </div>
            </div>

            {error && <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600"><AlertCircle size={17} className="mt-0.5 shrink-0" />{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={isAdmin ? "admin@kastriva.com" : "email@anda.com"} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10" />
                </div>
              </div>

              {isAdmin ? (
                <div>
                  <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700">Password</label>
                  <div className="relative">
                    <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" aria-label="Toggle password visibility">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="orderNumber" className="mb-1.5 block text-sm font-semibold text-slate-700">Nomor Order</label>
                  <div className="relative">
                    <Package size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input id="orderNumber" type="text" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value.toUpperCase())} placeholder="KAS-2026-0001" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 font-mono text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10" />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-400">Nomor order ada di email konfirmasi Anda.</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-1 text-sm">
                <label className="flex cursor-pointer select-none items-center gap-2 text-slate-600"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded accent-blue-600" /> Remember me</label>
                <a href={getWhatsAppLink("Halo Kastriva, saya butuh bantuan untuk login.")} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">Butuh bantuan?</a>
              </div>

              <button type="submit" disabled={loading} className={`mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-60 ${isAdmin ? "bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/25 hover:-translate-y-0.5 hover:shadow-blue-500/40" : "bg-slate-900 shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 hover:bg-slate-800"}`}>
                {loading ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
                {loading ? "Memverifikasi..." : isAdmin ? "Masuk sebagai Admin" : "Masuk sebagai Customer"}
              </button>
            </form>
          </motion.div>
          <p className="mt-8 text-center text-xs text-slate-400">© 2026 Kastriva · Secure Access</p>
        </div>
      </section>
    </main>
  );
}
