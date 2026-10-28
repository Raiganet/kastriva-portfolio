"use client";
import { motion } from "framer-motion";
import { CheckCircle2, Code2, Layout, Smartphone, Server, Wrench, ArrowRight, Database, Globe, MousePointerClick, Building2, type LucideIcon } from "lucide-react";
import { useSiteContent } from "@/components/cms/SiteContentProvider";
import { buildWhatsAppLink } from "@/lib/contact";
import { InteractiveCard } from "@/components/ui";

export default function ServicesSection() {
  const site = useSiteContent();
  const iconMap: Record<string, LucideIcon> = { Building2, MousePointerClick, Globe, Database, Smartphone, Wrench, Layout, Code2, Server };
  const services = site.services.items.filter((item) => item.active);
  if (!site.services.visible) return null;
  return (
    <section id="services" className="py-20">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{site.services.title}</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">{site.services.subtitle}</p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => {
            const Icon = iconMap[service.icon] || Code2;
            return (
              <InteractiveCard
                key={service.id}
                delay={i * 0.08}
                tilt={7}
                className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-[border-color,box-shadow] duration-300 hover:border-primary-500/50 hover:shadow-xl hover:shadow-primary-900/5 dark:border-slate-800 dark:bg-dark-bg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 dark:bg-primary-900/30 dark:text-primary-400">
                  <Icon size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2 transition-colors group-hover:text-primary-600 dark:group-hover:text-primary-400">{service.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">{service.description}</p>
                <ul className="space-y-2 mb-4">
                  {service.features.map((feature, j) => <li key={j} className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2"><CheckCircle2 size={14} className="text-green-500" /> {feature}</li>)}
                </ul>
                <div className="mb-5 text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                  {service.startingPrice && <span>Mulai {service.startingPrice}</span>}
                  {service.duration && <span>Estimasi {service.duration}</span>}
                </div>
                <a href={buildWhatsAppLink(site.brand.whatsapp, `Halo ${site.brand.name}, saya ingin konsultasi mengenai layanan ${service.title}`)} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold text-sm transition-all hover:gap-3">Konsultasikan <ArrowRight size={16} /></a>
              </InteractiveCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
