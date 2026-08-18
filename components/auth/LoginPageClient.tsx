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
            className={`relative px-6 lg:px-8 py-2.5 rounded-full text-sm font-semibold transition-colors duration-300 ${
              role === r ? "text-white" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {role === r && (
              <motion.span
                layoutId={floating ? "pill-float" : "pill-mobile"}
                className={`absolute inset-0 rounded-full ${
                  r === "admin"
                    ? "bg-gradient-to-r from-[#0066FF] to-[#00D9FF] shadow-lg shadow-blue-500/40"
                    : "bg-slate-900 shadow-lg shadow-slate-900/30"
                }`}
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
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#0066FF]/15 blur-[140px]" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-[#7C3AED]/15 blur-[140px]" />

      <div className="relative w-full max-w-6xl rounded-[24px] overflow-hidden grid lg:grid-cols-2 shadow-2xl shadow-blue-900/30 border border-white/5">
        <RoleToggle floating />

        {/* LEFT PANEL */}
        <div
          className={`relative p-8 lg:p-12 flex flex-col gap-8 transition-colors duration-700 ${
            isAdmin ? "bg-[#050B18]" : "bg-[#F5F7FA]"
          }`}
        >
          <div
            className={`absolute top-0 left-0 w-72 h-72 rounded-full blur-[110px] transition-opacity duration-700 ${
              isAdmin ? "bg-[#0066FF]/25 opacity-100" : "bg-[#0066FF]/10 opacity-60"
            }`}
          />
          <div
            className={`absolute bottom-0 right-0 w-72 h-72 rounded-full blur-[110px] transition-opacity duration-700 ${
              isAdmin ? "bg-[#7C3AED]/20 opacity-100" : "bg-[#7C3AED]/10 opacity-50"
            }`}
          />

          {/* Logo */}
          <div className="relative z-10">
            <div
              className={`inline-block p-4 lg:p-5 rounded-2xl backdrop-blur-xl transition-all duration-700 ${
                isAdmin
                  ? "bg-white/5 border border-[#00D9FF]/25 shadow-[0_0_35px_rgba(0,102,255,0.25)]"
                  : "bg-[#050B18]/70 border border-[#00D9FF]/40 shadow-[0_0_45px_rgba(0,217,255,0.35)]"
              }`}
            >
              {logoError ? (
                <div className="flex items-center gap-3">
                  <img
                    src="/android-chrome-192x192.png"
                    alt="Kastriva"
                    className="w-12 h-12 rounded-xl"
                  />
                  <span className="text-2xl font-extrabold tracking-widest text-white">
                    KASTRIVA
                  </span>
                </div>
              ) : (
                <img
                  src="/logo-kastriva.png"
                  alt="Kastriva – Web Developer"
                  className="h-12 lg:h-16 w-auto object-contain"
                  onError={() => setLogoError(true)}
                />
              )}
            </div>
          </div>

          <div className="relative z-10 space-y-4">
            <h1 className={`text-3xl lg:text-4xl font-bold transition-colors duration-700 ${isAdmin ? "text-white" : "text-slate-900"}`}>
              Code. Build.{" "}
              <span className="bg-gradient-to-r from-[#00D9FF] to-[#7C3AED] bg-clip-text text-transparent">
                Solution.
              </span>
            </h1>
            <p className={`max-w-md leading-relaxed transition-colors duration-700 ${isAdmin ? "text-slate-400" : "text-slate-600"}`}>
              Kastriva hadir untuk membantu Anda membangun solusi digital yang modern, cepat, dan terpercaya.
            </p>
          </div>

          <div
            className={`relative z-10 p-4 rounded-2xl border max-w-sm backdrop-blur transition-colors duration-700 ${
              isAdmin ? "bg-[#0A1428]/80 border-blue-500/20" : "bg-white/80 border-slate-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#0066FF] to-[#00D9FF] shadow-lg shadow-blue-600/30">
                <Code2 size={18} className="text-white" />
              </div>
              <p className={`text-sm ${isAdmin ? "text-slate-300" : "text-slate-600"}`}>
                We craft <span className="text-[#00D9FF] font-semibold">clean code</span> and powerful{" "}
                <span className="text-[#7C3AED] font-semibold">digital experience</span>.
              </p>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-4 gap-3 mt-auto hidden sm:grid">
            {features.map((f) => (
              <div key={f.label} className="flex flex-col items-center gap-2">
                <div
                  className={`p-3 rounded-2xl border transition-colors duration-700 ${
                    isAdmin ? "bg-[#0A1428]/80 border-blue-500/20" : "bg-white border-slate-200"
                  }`}
                >
                  <f.icon size={20} className={isAdmin ? "text-[#00D9FF]" : "text-[#0066FF]"} />
                </div>
                <span className={`text-xs font-medium transition-colors duration-700 ${isAdmin ? "text-slate-400" : "text-slate-600"}`}>
                  {f.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
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
              <div className={`p-2.5 rounded-xl transition-colors duration-500 ${isAdmin ? "bg-blue-50 text-[#0066FF]" : "bg-slate-100 text-slate-700"}`}>
                {isAdmin ? <ShieldCheck size={20} /> : <UserCircle2 size={20} />}
              </div>
              <div>
                <h3 className={`font-bold transition-colors duration-500 ${isAdmin ? "text-[#0066FF]" : "text-slate-900"}`}>
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
                className={`w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all duration-500 disabled:opacity-60 ${
                  isAdmin
                    ? "bg-gradient-to-r from-[#0066FF] to-[#00D9FF] shadow-lg shadow-blue-600/40 hover:shadow-blue-600/60 hover:-translate-y-0.5"
                    : "bg-slate-900 shadow-lg shadow-slate-900/30 hover:bg-slate-800 hover:-translate-y-0.5"
                }`}
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