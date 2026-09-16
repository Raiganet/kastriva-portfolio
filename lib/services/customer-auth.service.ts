import { gasPost } from '@/lib/gas-client';
import { getSession, setSession, refreshSession, logoutSession, SessionInfo } from './session-client';
export class CustomerAuthService {
  static requestCode(email: string) { return gasPost<{ challengeId: string; expiresAt: number; retryAfter: number }>({ action: 'requestCustomerOtp', email }); }
  static async login(challengeId: string, code: string, remember = true) {
    const res = await gasPost<SessionInfo>({ action: 'verifyCustomerOtp', challengeId, code, remember });
    if (res.success && res.data) setSession('customer', res.data);
    return { success: res.success, error: res.error };
  }
  static getSession() { return getSession('customer'); }
  static getToken() { return this.getSession() ? 'cookie-session' : null; }
  static isLoggedIn() { return !!this.getSession(); }
  static refresh() { return refreshSession('customer'); }
  static logout() { return logoutSession('customer'); }
}
