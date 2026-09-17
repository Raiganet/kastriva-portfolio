/**
 * API Client Abstraction
 * Layer ini memungkinkan swap dari local config ke Firebase backend
 * tanpa mengubah UI code.
 */

import { config } from "@/data/config";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export interface ApiClientConfig {
  baseUrl: string;
  useLocalStorage?: boolean;
  timeout?: number;
}

class ApiClient {
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = config;
  }

  /**
   * GET request
   * Saat ini fallback ke local, nanti bisa diganti dengan fetch ke Firebase
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      // TODO: Replace dengan fetch ke Firebase backend
      // const url = new URL(this.config.baseUrl + endpoint);
      // if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
      // const response = await fetch(url.toString(), { signal: AbortSignal.timeout(this.config.timeout || 10000) });
      // return await response.json();

      // Fallback: return mock success
      return {
        success: true,
        data: undefined as unknown as T,
        meta: { timestamp: new Date().toISOString() },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        meta: { timestamp: new Date().toISOString() },
      };
    }
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    try {
      // TODO: Replace dengan fetch POST ke Firebase backend
      // const response = await fetch(this.config.baseUrl + endpoint, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(body),
      //   signal: AbortSignal.timeout(this.config.timeout || 10000),
      // });
      // return await response.json();

      // Fallback: simulate success
      return {
        success: true,
        data: undefined as unknown as T,
        meta: { timestamp: new Date().toISOString() },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        meta: { timestamp: new Date().toISOString() },
      };
    }
  }

  /**
   * Check if API is available
   * Digunakan untuk fallback ke local config
   */
  async isAvailable(): Promise<boolean> {
    // Untuk sekarang, selalu false karena kita masih pakai local config
    // Nantinya akan check ke Firebase endpoint
    return false;
  }
}

// Singleton instance
export const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL || "/api/backend",
  useLocalStorage: true,
  timeout: 10000,
});
