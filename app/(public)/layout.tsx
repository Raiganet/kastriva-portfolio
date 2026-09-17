import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main-content" className="fixed left-4 top-2 z-[100] -translate-y-20 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition focus:translate-y-0">
        Lewati ke konten
      </a>
      <Navbar />
      <main id="main-content" className="flex-1">{children}</main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
