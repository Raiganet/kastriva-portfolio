import TrackOrderClient from "@/components/order/TrackOrderClient";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Lacak Order",
  description: "Lacak status order dan progress project Anda di Kastriva.",
  path: "/order/track",
  noIndex: true,
});

export default function TrackOrderPage() {
  return <TrackOrderClient />;
}
