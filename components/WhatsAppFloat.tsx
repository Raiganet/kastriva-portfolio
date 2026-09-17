"use client";
import { MessageCircle } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { useSiteContent } from "@/components/cms/SiteContentProvider";
import { buildWhatsAppLink } from "@/lib/contact";

export default function WhatsAppFloat() {
  const site = useSiteContent();
  if (!site.brand.whatsapp) return null;
  return (
    <a onClick={() => trackEvent("whatsapp_click", { placement: "floating_button" })} href={buildWhatsAppLink(site.brand.whatsapp, `Halo ${site.brand.name}, saya tertarik menggunakan jasa pembuatan website/aplikasi. Saya ingin konsultasi mengenai project saya.`)} target="_blank" rel="noopener noreferrer" aria-label="Konsultasi melalui WhatsApp" className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-4 md:right-6 z-40 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg shadow-green-500/30 transition-all hover:scale-110 flex items-center gap-2 group">
      <MessageCircle size={28} />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap text-sm font-semibold">Chat WhatsApp</span>
    </a>
  );
}
