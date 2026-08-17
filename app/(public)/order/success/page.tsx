import { Metadata } from "next";
import { config } from "@/data/config";
import SuccessClient from "@/components/order/SuccessClient";

export const metadata: Metadata = {
  title: `Order Berhasil | ${config.brand.name}`,
  description: "Pesanan Anda telah berhasil dikirim.",
};

export default function SuccessPage() {
  return <SuccessClient />;
}
