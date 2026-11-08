"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { useSiteContent } from "@/components/cms/SiteContentProvider";
import { InteractiveCard } from "@/components/ui";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { translateKnown } from "@/components/i18n/translateKnown";

const faqTranslations: Record<string, string> = {
  "Berapa lama pengerjaan website?": "How long does it take to build a website?",
  "Tergantung kompleksitas. Landing page biasanya 3-7 hari, company profile 1-2 minggu, dan web application custom 1-3 bulan.": "It depends on the scope. A landing page usually takes 3–7 days, a company website 1–2 weeks, and a custom web application 1–3 months.",
  "Apakah bisa request desain?": "Can I request a specific design?",
  "Tentu. Anda bisa memberikan referensi desain, atau kami akan membuatkan desain UI/UX custom yang sesuai dengan brand Anda.": "Yes. You can share design references, or we can create a custom UI/UX design to match your brand.",
  "Apakah website responsive?": "Will the website be responsive?",
  "Ya, semua website yang kami buat dijamin responsive dan optimal di desktop, tablet, maupun mobile.": "Yes. All websites we build are responsive and optimized for desktop, tablet, and mobile.",
  "Apakah bisa menggunakan domain sendiri?": "Can I use my own domain?",
  "Bisa. Kami akan membantu proses konfigurasi domain dan hosting Anda sampai website online.": "Yes. We can help configure your domain and hosting until the website is online.",
  "Apakah bisa dibuatkan admin dashboard?": "Can you build an admin dashboard?",
  "Bisa. Website company profile, toko online, maupun sistem informasi dapat dilengkapi dashboard admin untuk mengelola konten.": "Yes. Company websites, online stores, and information systems can include an admin dashboard for managing content.",
  "Apakah website bisa dikembangkan lagi?": "Can the website be expanded later?",
  "Sangat bisa. Kode ditulis dengan struktur rapi dan modular sehingga mudah ditambah fitur di kemudian hari.": "Absolutely. We use a clean, modular code structure so new features can be added later.",
  "Apakah tersedia maintenance?": "Do you offer maintenance?",
  "Ya, kami menyediakan paket maintenance untuk update keamanan, perbaikan bug, dan penambahan fitur setelah project selesai.": "Yes. Maintenance plans are available for security updates, bug fixes, and feature additions after launch.",
  "Bagaimana cara melakukan pemesanan?": "How do I place an order?",
  "Isi form di halaman Mulai Project, atau klik tombol WhatsApp. Anda akan mendapat nomor order untuk konsultasi dan tracking.": "Submit the form on the Start a Project page or use the WhatsApp button. You will receive an order number for consultation and tracking.",
  "Apakah bisa konsultasi terlebih dahulu?": "Can I book a consultation first?",
  "Tentu, konsultasi awal gratis tanpa komitmen. Kami akan membantu menentukan solusi yang paling sesuai dengan kebutuhan dan budget Anda.": "Yes. The initial consultation is free and comes with no commitment. We can help find a solution that fits your needs and budget.",
};

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);
  const { faq } = useSiteContent();
  const { language } = useLanguage();
  const english = language === "en";
  const items = faq.items.filter((item) => item.published);
  if (!faq.visible || items.length === 0) return null;
  return (
    <section className="ambient-panel py-20">
      <div className="container mx-auto px-4 md:px-6 max-w-3xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 mb-4"><HelpCircle size={16} />{translateKnown(faq.eyebrow, english, { FAQ: "FAQ" })}</div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{translateKnown(faq.title, english, { "Pertanyaan yang Sering Diajukan": "Frequently Asked Questions" })}</h2>
          {faq.subtitle && <p className="text-slate-600 dark:text-slate-400">{translateKnown(faq.subtitle, english, { "Jawaban singkat untuk hal yang paling sering ditanyakan sebelum memulai project.": "Quick answers to common questions before starting a project." })}</p>}
        </div>
        <div className="space-y-3">
          {items.map((item, i) => (
            <InteractiveCard
              key={item.id}
              delay={i * 0.05}
              tilt={3}
              lift={3}
              className="rounded-2xl border border-slate-200 bg-white overflow-hidden transition-[border-color,box-shadow] duration-300 hover:border-primary-300 hover:shadow-lg hover:shadow-primary-900/5 dark:border-slate-800 dark:bg-dark-bg"
            >
              <button onClick={() => setOpen(open === i ? null : i)} className="group w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors" aria-expanded={open === i}>
                <span className="font-semibold pr-4">{translateKnown(item.question, english, faqTranslations)}</span>
                <motion.span animate={{ rotate: open === i ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0 text-primary-500"><ChevronDown size={20} /></motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                    <p className="px-5 pb-5 text-slate-600 dark:text-slate-400 leading-relaxed">{translateKnown(item.answer, english, faqTranslations)}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </InteractiveCard>
          ))}
        </div>
      </div>
    </section>
  );
}
