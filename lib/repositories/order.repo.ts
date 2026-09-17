import { OrderFormData } from "@/lib/validators/order";
import { getWhatsAppLink } from "@/data/config";
import { gasPost, gasGet, isGasConfigured } from "@/lib/gas-client";
import { OrderTrackingResult } from "@/lib/types/order";

export interface OrderRepository {
  submit(data: OrderFormData, requestId: string): Promise<{
    success: boolean;
    orderNumber?: string;
    whatsappUrl?: string;
    error?: string;
    code?: string;
    committed?: boolean;
  }>;
  getByOrderNumber(orderNumber: string): Promise<OrderTrackingResult | null>;
}

class HybridOrderRepository implements OrderRepository {
  async submit(data: OrderFormData, requestId: string): Promise<{
    success: boolean;
    orderNumber?: string;
    whatsappUrl?: string;
    error?: string;
    code?: string;
    committed?: boolean;
  }> {
    try {
      let orderNumber = "";

      // 1. Coba simpan ke Google Sheets
      if (isGasConfigured()) {
        try {
          const res = await gasPost<{ orderNumber: string; id: string }>({
            action: "createOrder",
            ...data,
            requestId,
          });
          if (res.success && res.data && res.data.orderNumber) {
            orderNumber = res.data.orderNumber;
          } else {
            return { success: false, error: res.error || "Hasil penyimpanan belum diketahui. Coba kirim kembali dengan permintaan yang sama.", code: res.code, committed: res.committed };
          }
        } catch (err) {
          return { success: false, error: "Hasil penyimpanan belum diketahui. Coba kirim kembali; jangan membuat permintaan baru." };
        }
      }

      if (!orderNumber) {
        return { success: false, error: "Layanan pemesanan belum tersedia." };
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
- Referensi Portfolio: ${data.portfolioTitle || "Tidak ada"}
- Budget: ${data.budget || "Belum ditentukan"}
- Deadline: ${data.deadline || "Fleksibel"}
- Link/Referensi: ${data.reference || "Tidak ada"}

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
