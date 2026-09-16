import { gasPost } from '@/lib/gas-client';
import { getSession, setSession, refreshSession, logoutSession, SessionInfo } from './session-client';
export class AdminAuthService {
  static async login(email: string, password: string, remember = true) {
    const res = await gasPost<SessionInfo>({ action: 'login', email, password, remember });
    if (res.success && res.data) setSession('admin', res.data);
    return { success: res.success, error: res.error };
  }
  static getSession() { return getSession('admin'); }
  // Compatibility marker only. Actual credentials stay inside HttpOnly cookies.
  static getToken() { return this.getSession() ? 'cookie-session' : null; }
  static isLoggedIn() { return !!this.getSession(); }
  static refresh() { return refreshSession('admin'); }
  static logout() { return logoutSession('admin'); }
}
