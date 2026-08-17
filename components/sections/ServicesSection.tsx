"use client";
import { motion } from "framer-motion";
import { CheckCircle2, Code2, Layout, Smartphone, Server, Wrench, ArrowRight } from "lucide-react";
import { config, getWhatsAppLink } from "@/data/config";

export default function ServicesSection() {
  const iconMap: Record<string, any> = { 
    Building2: Layout, 
    MousePointerClick: Code2, 
    Globe: Server, 
    Database: Server, 
    Smartphone: Smartphone, 
    Wrench: Wrench 
  };

  return (
    <section id="services" className="py-20">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Layanan Saya</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Solusi digital komprehensif yang disesuaikan dengan skala dan kebutuhan bisnis Anda.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {config.services.map((service) => {
            const Icon = iconMap[service.icon] || Code2;
            return (
              <motion.div 
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group p-6 rounded-2xl bg-white dark:bg-dark-bg border border-slate-200 dark:border-slate-800 hover:border-primary-500/50 hover:shadow-xl hover:shadow-primary-900/5 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-4 group-hover:scale-110 transition-transform">
                  <Icon size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">{service.desc}</p>
                <ul className="space-y-2 mb-6">
                  {service.features.map((f, i) => (
                    <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-green-500" /> {f}
                    </li>
                  ))}
                </ul>
                <a 
                  href={getWhatsAppLink(`Halo, saya ingin konsultasi mengenai layanan ${service.title}`)}
                  className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold text-sm hover:gap-3 transition-all"
                >
                  Konsultasikan <ArrowRight size={16} />
                </a>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
