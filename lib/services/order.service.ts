import { orderRepository } from "@/lib/repositories/order.repo";
import { OrderFormData, validateOrderForm } from "@/lib/validators/order";
import { OrderTrackingResult } from "@/lib/types/order";

export interface SubmitOrderResult {
  success: boolean;
  orderNumber?: string;
  whatsappUrl?: string;
  errors?: Record<string, string>;
  error?: string;
}

export class OrderService {
  static async submit(data: unknown): Promise<SubmitOrderResult> {
    const validation = validateOrderForm(data);
    if (!validation.success) {
      return { success: false, errors: validation.errors };
    }

    // Honeypot
    if ((data as any).website && (data as any).website.length > 0) {
      return { success: false, error: "Spam detected" };
    }

    // Rate limit (client-side only, server-side validated di GAS)
    if (typeof window !== "undefined") {
      const lastSubmit = localStorage.getItem("lastOrderSubmit");
      const now = Date.now();
      if (lastSubmit && now - parseInt(lastSubmit) < 30000) {
        return {
          success: false,
          error: "Terlalu cepat. Silakan tunggu 30 detik.",
        };
      }
    }

    const result = await orderRepository.submit(validation.data!);

    if (result.success && typeof window !== "undefined") {
      localStorage.setItem("lastOrderSubmit", Date.now().toString());
      // Simpan order number terakhir untuk quick access
      if (result.orderNumber) {
        const history = JSON.parse(
          localStorage.getItem("orderHistory") || "[]"
        );
        history.unshift({
          orderNumber: result.orderNumber,
          timestamp: new Date().toISOString(),
          projectType: validation.data!.type,
        });
        localStorage.setItem(
          "orderHistory",
          JSON.stringify(history.slice(0, 10))
        );
      }
    }

    return result;
  }

  static async trackOrder(
    orderNumber: string
  ): Promise<OrderTrackingResult | null> {
    return orderRepository.getByOrderNumber(orderNumber);
  }

  static getOrderHistory(): Array<{
    orderNumber: string;
    timestamp: string;
    projectType: string;
  }> {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("orderHistory") || "[]");
    } catch {
      return [];
    }
  }
}
