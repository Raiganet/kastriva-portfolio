import { gasPost } from "@/lib/gas-client";

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
