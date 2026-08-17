import { OrderFormData } from "@/lib/validators/order";
import { getWhatsAppLink } from "@/data/config";

/**
 * Order Repository
 * Menangani submission order.
 * Saat ini kirim ke WhatsApp, nantinya bisa simpan ke Google Sheets via GAS.
 */

export interface OrderRepository {
  submit(data: OrderFormData): Promise<{
    success: boolean;
    orderNumber?: string;
    whatsappUrl?: string;
    error?: string;
  }>;
  generateOrderNumber(): Promise<string>;
}

class LocalOrderRepository implements OrderRepository {
  /**
   * Generate order number dengan format: KAS-YYYY-NNNN
   * Saat ini pakai timestamp, nantinya auto-increment dari Google Sheets
   */
  async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-4);
    return `KAS-${year}-${timestamp}`;
  }

  /**
   * Submit order
   * Saat ini: format pesan WhatsApp
   * Nantinya: POST ke Google Apps Script + kirim WhatsApp
   */
  async submit(data: OrderFormData): Promise<{
    success: boolean;
    orderNumber?: string;
    whatsappUrl?: string;
    error?: string;
  }> {
    try {
      const orderNumber = await this.generateOrderNumber();
      
      // TODO: Nantinya POST ke GAS
      // const response = await apiClient.post("/orders", { ...data, orderNumber });
      // if (!response.success) throw new Error(response.error);

      // Format pesan WhatsApp
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

      const whatsappUrl = getWhatsAppLink(message);

      // Track event (siap untuk Google Analytics)
      if (typeof window !== "undefined" && (window as any).trackEvent) {
        (window as any).trackEvent("order_submitted", {
          orderNumber,
          projectType: data.type,
          budget: data.budget,
        });
      }

      return {
        success: true,
        orderNumber,
        whatsappUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Gagal mengirim order",
      };
    }
  }
}

export const orderRepository = new LocalOrderRepository();
