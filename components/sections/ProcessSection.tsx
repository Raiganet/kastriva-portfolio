"use client";
import { motion } from "framer-motion";
import { useSiteContent } from "@/components/cms/SiteContentProvider";
import { InteractiveCard } from "@/components/ui";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { translateKnown } from "@/components/i18n/translateKnown";

const processTranslations: Record<string, string> = {
  Konsultasi: "Consultation",
  "Analisis Kebutuhan": "Requirements Analysis",
  Perencanaan: "Planning",
  "Desain & Pengembangan": "Design & Development",
  "UI/UX Design": "UI/UX Design",
  Development: "Development",
  Peluncuran: "Launch",
  "Testing & Deployment": "Testing & Deployment",
  "Diskusi kebutuhan, tujuan bisnis, dan fitur yang diinginkan.": "Discuss your needs, business goals, and desired features.",
  "Penyusunan scope of work, timeline, dan penawaran harga.": "Define the project scope, timeline, and quotation.",
  "Pembuatan wireframe dan mockup desain untuk disetujui.": "Create wireframes and design mockups for your approval.",
  "Proses coding dan integrasi sistem sesuai desain yang disetujui.": "Build and integrate the system according to the approved design.",
  "Quality assurance, revisi final, dan peluncuran website.": "Complete quality assurance, final revisions, and website launch.",
};

export default function ProcessSection() {
  const { process } = useSiteContent();
  const { language } = useLanguage();
  const english = language === "en";
  if (!process.visible || process.items.length === 0) return null;
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        <div className="text-center mb-12"><h2 className="text-3xl md:text-4xl font-bold mb-4">{translateKnown(process.title, english, { "Bagaimana Project Anda Dikerjakan?": "How We Work" })}</h2><p className="text-slate-600 dark:text-slate-400">{translateKnown(process.subtitle, english, { "Proses terstruktur untuk hasil terbaik": "A structured process for the best results" })}</p></div>
        <div className="relative"><div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800 md:left-1/2 md:-translate-x-1/2" />
          {process.items.map((step, i) => (
            <motion.div key={`${step.step}-${i}`} initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className={`relative flex items-center mb-12 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}>
              <div className={`flex-1 ${i % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12"} pl-20 md:pl-0`}>
                <InteractiveCard
                  tilt={5}
                  lift={4}
                  entrance={false}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-[border-color,box-shadow] duration-300 hover:border-primary-300 hover:shadow-lg hover:shadow-primary-900/5 dark:border-slate-800 dark:bg-dark-surface"
                >
                  <h3 className="text-xl font-bold mb-2 transition-colors group-hover:text-primary-600 dark:group-hover:text-primary-400">{translateKnown(step.title, english, processTranslations)}</h3>
                  <p className="text-slate-600 dark:text-slate-400">{translateKnown(step.description, english, processTranslations)}</p>
                </InteractiveCard>
              </div>
              <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 w-16 h-16 rounded-full bg-primary-600 text-white font-bold flex items-center justify-center text-lg border-4 border-white dark:border-dark-bg shadow-lg">{step.step}</div>
              <div className="flex-1 hidden md:block" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
