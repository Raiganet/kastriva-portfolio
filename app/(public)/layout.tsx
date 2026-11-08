import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import NeonCursorTrail from "@/components/ui/NeonCursorTrail";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import SkipToContent from "@/components/i18n/SkipToContent";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider><div className="neon-cursor-enabled min-h-screen flex flex-col">
      <SkipToContent />
      <Navbar />
      <main id="main-content" className="public-canvas flex-1">{children}</main>
      <Footer />
      <WhatsAppFloat />
      <NeonCursorTrail />
    </div></LanguageProvider>
  );
}
