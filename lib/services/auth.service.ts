import { gasPost } from "@/lib/gas-client";

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
