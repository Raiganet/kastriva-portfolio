"use client";
import { MessageCircle } from "lucide-react";
import { config, getWhatsAppLink } from "@/data/config";

export default function WhatsAppFloat() {
  return (
    <a href={getWhatsAppLink("Halo Kastriva, saya tertarik menggunakan jasa pembuatan website/aplikasi. Saya ingin konsultasi mengenai project saya.")} target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 z-40 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg shadow-green-500/30 transition-all hover:scale-110 flex items-center gap-2 group">
      <MessageCircle size={28} />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap text-sm font-semibold">Chat WhatsApp</span>
    </a>
  );
}
