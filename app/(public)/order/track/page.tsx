import { Metadata } from "next";
import { config } from "@/data/config";
import TrackOrderClient from "@/components/order/TrackOrderClient";

export const metadata: Metadata = {
  title: `Lacak Order | ${config.brand.name}`,
  description: "Lacak status order dan progress project Anda di Kastriva.",
};

export default function TrackOrderPage() {
  return <TrackOrderClient />;
}
