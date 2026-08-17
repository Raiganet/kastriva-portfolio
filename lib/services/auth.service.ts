import { gasPost } from "@/lib/gas-client";

const TOKEN_KEY = "kastriva_admin_token";

export interface AdminSession {
  token: string;
  email: string;
  expiresAt: number;
}

/**
 * Admin Auth Service
 * Token diverifikasi SERVER-SIDE oleh GAS di setiap request protected.
 * localStorage hanya menyimpan token (bukan role), sehingga aman.
 */
export class AdminAuthService {
  static async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    const res = await gasPost<AdminSession>({
      action: "login",
      email,
      password,
    });

    if (res.success && res.data && res.data.token) {
      if (typeof window !== "undefined") {
        localStorage.setItem(TOKEN_KEY, JSON.stringify(res.data));
      }
      return { success: true };
    }

    return { success: false, error: res.error || "Email atau password salah" };
  }

  static getSession(): AdminSession | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(TOKEN_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as AdminSession;
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
    const session = this.getSession();
    return session ? session.token : null;
  }

  static isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  static logout(): void {
    const token = this.getToken();
    if (token) {
      gasPost({ action: "logout", token }).catch(() => {});
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
  }
}
