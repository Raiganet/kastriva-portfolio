import { orderRepository } from "@/lib/repositories/order.repo";
import { OrderFormData, validateOrderForm } from "@/lib/validators/order";

/**
 * Order Service
 * Business logic untuk order system.
 */

export interface SubmitOrderResult {
  success: boolean;
  orderNumber?: string;
  whatsappUrl?: string;
  errors?: Record<string, string>;
  error?: string;
}

export class OrderService {
  /**
   * Submit order dengan validasi
   */
  static async submit(data: unknown): Promise<SubmitOrderResult> {
    // Step 1: Validasi
    const validation = validateOrderForm(data);
    if (!validation.success) {
      return {
        success: false,
        errors: validation.errors,
      };
    }

    // Step 2: Honeypot check (anti-spam)
    if ((data as any).website && (data as any).website.length > 0) {
      return {
        success: false,
        error: "Spam detected",
      };
    }

    // Step 3: Rate limiting (client-side check)
    const lastSubmit = localStorage.getItem("lastOrderSubmit");
    const now = Date.now();
    if (lastSubmit && now - parseInt(lastSubmit) < 30000) {
      return {
        success: false,
        error: "Terlalu cepat. Silakan tunggu 30 detik sebelum mengirim lagi.",
      };
    }

    // Step 4: Submit ke repository
    const result = await orderRepository.submit(validation.data!);
    
    if (result.success) {
      localStorage.setItem("lastOrderSubmit", now.toString());
    }

    return result;
  }

  /**
   * Generate order number preview
   */
  static async previewOrderNumber(): Promise<string> {
    return orderRepository.generateOrderNumber();
  }
}
