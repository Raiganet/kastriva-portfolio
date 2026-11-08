"use client";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useSiteContent } from "@/components/cms/SiteContentProvider";
import { InteractiveCard } from "@/components/ui";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { translateKnown } from "@/components/i18n/translateKnown";

const benefitTranslations: Record<string, string> = {
  "Desain Modern & Premium": "Modern, Premium Design",
  "100% Responsive": "100% Responsive",
  "Performa Cepat (Core Web Vitals)": "Fast Performance (Core Web Vitals)",
  "Struktur Kode Rapi & Scalable": "Clean, Scalable Code",
  "Konsultasi Gratis Sebelum Mulai": "Free Consultation Before We Start",
  "Support & Maintenance Setelah Project": "Support & Maintenance After Launch",
};
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

export default function WhyChooseSection() {
  const site = useSiteContent();
  const { language } = useLanguage();
  const english = language === "en";
  if (!site.whyChoose.visible) return null;
  const showProcessPreview = site.whyChoose.showProcessPreview && site.process.items.length > 0;
  return (
    <section className="ambient-panel py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className={`grid gap-12 items-center ${showProcessPreview ? "lg:grid-cols-2" : "max-w-4xl mx-auto"}`}>
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">{english ? "Why Choose Kastriva?" : site.whyChoose.title}</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">{english ? "We combine thoughtful design and reliable engineering to deliver digital products that support your goals." : site.whyChoose.description}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {site.whyChoose.items.map((item, i) => (
                <InteractiveCard
                  key={i}
                  delay={i * 0.06}
                  tilt={5}
                  lift={3}
                  entrance={false}
                  className="group flex items-start gap-3 rounded-xl p-3 transition-colors duration-300 hover:bg-white/70 dark:hover:bg-white/5"
                >
                  <div className="mt-1 bg-green-100 dark:bg-green-900/30 p-1 rounded-full transition-transform duration-300 group-hover:scale-110"><CheckCircle2 size={16} className="text-green-600 dark:text-green-400" /></div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{translateKnown(item, english, benefitTranslations)}</span>
                </InteractiveCard>
              ))}
            </div>
          </motion.div>
          {showProcessPreview && (
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-purple-500 rounded-3xl blur-2xl opacity-20" />
              <InteractiveCard tilt={5} lift={4} entrance={false} className="glass p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
                <div className="space-y-6">
                  {site.process.items.map((step, i) => (
                    <div key={i} className="group flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 font-bold flex items-center justify-center text-sm transition-transform duration-300 group-hover:scale-110">{step.step}</div>
                      <div>
                        <h4 className="font-bold mb-1">{translateKnown(step.title, english, processTranslations)}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{translateKnown(step.description, english, processTranslations)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </InteractiveCard>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
