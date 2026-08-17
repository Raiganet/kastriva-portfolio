import { Metadata } from "next";
import { config } from "@/data/config";
import SmartOrderForm from "@/components/order/SmartOrderForm";

export const metadata: Metadata = {
  title: `Mulai Project | ${config.brand.name}`,
  description: "Mulai project website atau aplikasi Anda bersama Kastriva.",
};

export default function OrderPage() {
  return (
    <div className="pt-32 pb-20">
      <SmartOrderForm />
    </div>
  );
}
