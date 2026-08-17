import { z } from "zod";

/**
 * Zod schema untuk validasi form order
 */
export const orderFormSchema = z.object({
  name: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(100, "Nama maksimal 100 karakter"),
  business: z
    .string()
    .max(100, "Nama bisnis maksimal 100 karakter")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .email("Format email tidak valid"),
  whatsapp: z
    .string()
    .min(10, "Nomor WhatsApp minimal 10 digit")
    .max(20, "Nomor WhatsApp maksimal 20 digit")
    .regex(/^[0-9+\-\s]+$/, "Nomor hanya boleh berisi angka"),
  type: z.enum([
    "Website",
    "Landing Page",
    "Company Profile",
    "Web App",
    "Dashboard",
    "Sistem Informasi",
    "Android App",
    "Custom",
  ], {
    errorMap: () => ({ message: "Pilih jenis project" }),
  }),
  budget: z.string().optional(),
  deadline: z.string().max(100).optional(),
  description: z
    .string()
    .min(20, "Deskripsi minimal 20 karakter agar kami paham kebutuhan Anda")
    .max(2000, "Deskripsi maksimal 2000 karakter"),
  features: z.string().max(500).optional(),
  reference: z.string().max(200).optional(),
  // Honeypot field untuk anti-spam
  website: z.string().max(0, "Spam detected").optional(),
});

export type OrderFormData = z.infer<typeof orderFormSchema>;

/**
 * Validasi data order, kembalikan error jika invalid
 */
export function validateOrderForm(data: unknown): {
  success: boolean;
  data?: OrderFormData;
  errors?: Record<string, string>;
} {
  const result = orderFormSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const field = err.path[0] as string;
    errors[field] = err.message;
  });
  
  return { success: false, errors };
}
