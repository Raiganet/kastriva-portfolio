import { OrderFormData } from "@/lib/validators/order";
import { getWhatsAppLink } from "@/data/config";
import { gasPost, gasGet, isGasConfigured } from "@/lib/gas-client";
import { OrderTrackingResult } from "@/lib/types/order";

export interface OrderRepository {
  submit(data: OrderFormData): Promise<{
    success: boolean;
    orderNumber?: string;
    whatsappUrl?: string;
    error?: string;
  }>;
  generateOrderNumber(): Promise<string>;
  getByOrderNumber(orderNumber: string): Promise<OrderTrackingResult | null>;
}

class HybridOrderRepository implements OrderRepository {
  async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-4);
    return `KAS-${year}-${timestamp}`;
  }

  async submit(data: OrderFormData): Promise<{
    success: boolean;
    orderNumber?: string;
    whatsappUrl?: string;
    error?: string;
  }> {
    try {
      let orderNumber = "";

      // 1. Coba simpan ke Google Sheets
      if (isGasConfigured()) {
        try {
          const res = await gasPost<{ orderNumber: string; id: string }>({
            action: "createOrder",
            ...data,
          });
          if (res.success && res.data && res.data.orderNumber) {
            orderNumber = res.data.orderNumber;
          }
        } catch (err) {
          console.warn("GAS submit failed, using local number:", err);
        }
      }

      if (!orderNumber) {
        orderNumber = await this.generateOrderNumber();
      }

      const message = `Halo Kastriva 👋

Saya ingin berkonsultasi mengenai project.

*Order:* ${orderNumber}

*Detail:*
- Nama: ${data.name}
- Bisnis: ${data.business || "-"}
- Email: ${data.email}
- WhatsApp: ${data.whatsapp}
- Jenis Project: ${data.type}
- Budget: ${data.budget || "Belum ditentukan"}
- Deadline: ${data.deadline || "Fleksibel"}
- Referensi: ${data.reference || "Tidak ada"}

*Deskripsi:*
${data.description}

*Fitur Dibutuhkan:*
${data.features || "-"}

Terima kasih.`;

      return {
        success: true,
        orderNumber,
        whatsappUrl: getWhatsAppLink(message),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Gagal mengirim order",
      };
    }
  }

  async getByOrderNumber(orderNumber: string): Promise<OrderTrackingResult | null> {
    if (!isGasConfigured()) return null;
    try {
      const res = await gasGet<OrderTrackingResult>("getOrderByNumber", {
        orderNumber,
      });
      if (res.success && res.data) return res.data;
      return null;
    } catch {
      return null;
    }
  }
}

export const orderRepository = new HybridOrderRepository();
