import SuccessClient from "@/components/order/SuccessClient";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Order Berhasil",
  description: "Pesanan Anda telah berhasil dikirim.",
  path: "/order/success",
  noIndex: true,
});

export default function SuccessPage() {
  return <SuccessClient />;
}
