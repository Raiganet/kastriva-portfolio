import { orderRepository } from "@/lib/repositories/order.repo";
import { OrderFormData, validateOrderForm } from "@/lib/validators/order";
import { prepareOrder, completeOrder, rejectOrder } from "@/lib/order/draft";
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

    if (typeof navigator !== "undefined" && !navigator.onLine) return { success:false,error:"Anda sedang offline. Draf tetap tersimpan; kirim kembali setelah online." };
    const draft = await prepareOrder(validation.data!);
    if (draft.receipt) return { success:true,...draft.receipt };
    const pending = draft.pending!;
    const result = await orderRepository.submit(pending.data,pending.requestId);
    if (result.success && result.orderNumber) {
      // Local history failures must never turn a committed order into a failed submission.
      try { await completeOrder(pending.requestId,{orderNumber:result.orderNumber,whatsappUrl:result.whatsappUrl}); } catch { /* Same request ID remains retryable. */ }
      try {
        const history = this.getOrderHistory().filter(x=>x.orderNumber!==result.orderNumber);
        history.unshift({orderNumber:result.orderNumber,timestamp:new Date().toISOString(),projectType:pending.data.type});
        localStorage.setItem("orderHistory",JSON.stringify(history.slice(0,10)));
      } catch { /* Optional history only. */ }
    } else if (result.committed === false) {
      await rejectOrder(pending.requestId);
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
      const value = JSON.parse(localStorage.getItem("orderHistory") || "[]");
      return Array.isArray(value) ? value.filter(x=>x && typeof x.orderNumber==="string").slice(0,10) : [];
    } catch {
      return [];
    }
  }
}
