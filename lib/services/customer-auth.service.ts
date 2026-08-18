import { gasPost } from "@/lib/gas-client";

const TOKEN_KEY = "kastriva_customer_token";

export interface CustomerSession {
  token: string;
  customerId: string;
  name: string;
  expiresAt: number;
}

export class CustomerAuthService {
  static async login(
    email: string,
    orderNumber: string
  ): Promise<{ success: boolean; error?: string }> {
    const res = await gasPost<CustomerSession>({
      action: "customerLogin",
      email,
      orderNumber,
    });

    if (res.success && res.data && res.data.token) {
      if (typeof window !== "undefined") {
        localStorage.setItem(TOKEN_KEY, JSON.stringify(res.data));
      }
      return { success: true };
    }
    return { success: false, error: res.error || "Login gagal" };
  }

  static getSession(): CustomerSession | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(TOKEN_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as CustomerSession;
      if (!session.token || Date.now() > session.expiresAt) {
        localStorage.removeItem(TOKEN_KEY);
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
    if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
  }
}
