import { config } from "@/data/config";
import SmartOrderForm from "@/components/order/SmartOrderForm";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Mulai Project",
  description: "Mulai konsultasi dan order project website atau aplikasi bersama Kastriva.",
  path: "/order",
});

export default function OrderPage() {
  return (
    <div className="pt-32 pb-20">
      <SmartOrderForm />
    </div>
  );
}
