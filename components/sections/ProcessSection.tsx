"use client";
import { motion } from "framer-motion";
import { useSiteContent } from "@/components/cms/SiteContentProvider";

export default function ProcessSection() {
  const { process } = useSiteContent();
  if (!process.visible || process.items.length === 0) return null;
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        <div className="text-center mb-12"><h2 className="text-3xl md:text-4xl font-bold mb-4">{process.title}</h2><p className="text-slate-600 dark:text-slate-400">{process.subtitle}</p></div>
        <div className="relative"><div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800 md:left-1/2 md:-translate-x-1/2" />
          {process.items.map((step, i) => <motion.div key={`${step.step}-${i}`} initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className={`relative flex items-center mb-12 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}><div className={`flex-1 ${i % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12"} pl-20 md:pl-0`}><div className="bg-white dark:bg-dark-surface p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"><h3 className="text-xl font-bold mb-2">{step.title}</h3><p className="text-slate-600 dark:text-slate-400">{step.description}</p></div></div><div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 w-16 h-16 rounded-full bg-primary-600 text-white font-bold flex items-center justify-center text-lg border-4 border-white dark:border-dark-bg shadow-lg">{step.step}</div><div className="flex-1 hidden md:block" /></motion.div>)}
        </div>
      </div>
    </section>
  );
}
