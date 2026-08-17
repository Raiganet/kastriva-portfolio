import { OrderFormData } from "@/lib/validators/order";
import { getWhatsAppLink } from "@/data/config";
import { gasPost, isGasConfigured } from "@/lib/gas-client";

export interface OrderRepository {
  submit(data: OrderFormData): Promise<{
    success: boolean;
    orderNumber?: string;
    whatsappUrl?: string;
    error?: string;
  }>;
  generateOrderNumber(): Promise<string>;
}

/**
 * Hybrid Order Repository:
 * 1. Simpan order ke Google Sheets via GAS (jika dikonfigurasi)
 * 2. Tetap buka WhatsApp dengan pesan terformat (order number dari Sheets)
 */
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
        } catch {
          // GAS gagal → lanjut dengan nomor lokal
        }
      }

      // 2. Fallback nomor lokal
      if (!orderNumber) {
        orderNumber = await this.generateOrderNumber();
      }

      // 3. Format pesan WhatsApp
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
}

export const orderRepository = new HybridOrderRepository();
