"use client";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useSiteContent } from "@/components/cms/SiteContentProvider";

export default function WhyChooseSection() {
  const site = useSiteContent();
  if (!site.whyChoose.visible) return null;
  const showProcessPreview = site.whyChoose.showProcessPreview && site.process.items.length > 0;
  return (
    <section className="py-20 bg-slate-50 dark:bg-dark-surface/50">
      <div className="container mx-auto px-4 md:px-6">
        <div className={`grid gap-12 items-center ${showProcessPreview ? "lg:grid-cols-2" : "max-w-4xl mx-auto"}`}>
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">{site.whyChoose.title}</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">{site.whyChoose.description}</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {site.whyChoose.items.map((item, i) => <div key={i} className="flex items-start gap-3"><div className="mt-1 bg-green-100 dark:bg-green-900/30 p-1 rounded-full"><CheckCircle2 size={16} className="text-green-600 dark:text-green-400" /></div><span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item}</span></div>)}
            </div>
          </motion.div>
          {showProcessPreview && (
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-purple-500 rounded-3xl blur-2xl opacity-20" />
              <div className="relative glass p-8 rounded-3xl border border-slate-200 dark:border-slate-800"><div className="space-y-6">{site.process.items.map((step, i) => <div key={i} className="flex gap-4"><div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 font-bold flex items-center justify-center text-sm">{step.step}</div><div><h4 className="font-bold mb-1">{step.title}</h4><p className="text-sm text-slate-600 dark:text-slate-400">{step.description}</p></div></div>)}</div></div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
