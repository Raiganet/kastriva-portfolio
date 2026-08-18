const fs = require('fs');

console.log('\n🔧 Step 1: Auth Services + Routes + Guards...\n');

// Pastikan folder ada
['lib/services', 'components/auth', 'app/login', 'components/admin', 'components/customer'].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// ===== 1. Auth Service (admin) =====
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
`);
console.log('✅ lib/services/auth.service.ts');

// ===== 2. Customer Auth Service =====
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
`);
console.log('✅ lib/services/customer-auth.service.ts');

// ===== 3. Route /login =====
fs.writeFileSync('app/login/page.tsx', `import { Metadata } from "next";
import LoginPageClient from "@/components/auth/LoginPageClient";

export const metadata: Metadata = {
  title: "Login | Kastriva",
  robots: "noindex, nofollow",
};

export default function LoginPage() {
  return <LoginPageClient />;
}
`);
console.log('✅ app/login/page.tsx');

// ===== 4. Old login -> redirect =====
fs.writeFileSync('app/admin/login/page.tsx', `import { redirect } from "next/navigation";
export default function Page() { redirect("/login"); }
`);

fs.writeFileSync('app/customer/login/page.tsx', `import { redirect } from "next/navigation";
export default function Page() { redirect("/login"); }
`);
console.log('✅ /admin/login & /customer/login redirect ke /login');

// ===== 5. Guards =====
fs.writeFileSync('components/admin/AdminGuard.tsx', `"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AdminAuthService } from "@/lib/services/auth.service";
import { LoadingSpinner } from "@/components/ui";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setChecking(false);
      return;
    }
    if (!AdminAuthService.isLoggedIn()) {
      router.replace("/login");
    } else {
      setChecking(false);
    }
  }, [router, pathname]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-bg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
`);

fs.writeFileSync('components/customer/CustomerGuard.tsx', `"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { CustomerAuthService } from "@/lib/services/customer-auth.service";
import { LoadingSpinner } from "@/components/ui";

export default function CustomerGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (pathname === "/customer/login") {
      setChecking(false);
      return;
    }
    if (!CustomerAuthService.isLoggedIn()) {
      router.replace("/login");
    } else {
      setChecking(false);
    }
  }, [router, pathname]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-bg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
`);
console.log('✅ Guards updated (redirect ke /login)');

console.log('\n🎉 Step 1 selesai!\n');
console.log('📌 Lanjut ke Step 2: buat file LoginPageClient.tsx (lihat respons selanjutnya)');