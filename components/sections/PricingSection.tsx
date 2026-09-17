"use client";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useSiteContent } from "@/components/cms/SiteContentProvider";

export default function PricingSection() {
  const { pricing } = useSiteContent();
  if (!pricing.visible || pricing.items.length === 0) return null;
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12"><h2 className="text-3xl md:text-4xl font-bold mb-4">{pricing.title}</h2><p className="text-slate-600 dark:text-slate-400">{pricing.subtitle}</p></motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pricing.items.map((pkg, i) => <motion.div key={`${pkg.name}-${i}`} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className={`p-6 rounded-2xl border ${pkg.highlighted ? "border-primary-500 bg-primary-50/30 dark:bg-primary-900/10 shadow-xl shadow-primary-900/5" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-bg"} flex flex-col`}><h3 className="text-lg font-bold mb-2">{pkg.name}</h3><div className="text-2xl font-bold text-primary-600 mb-6">{pkg.price}</div><ul className="space-y-3 mb-8 flex-1">{pkg.features.map((f, j) => <li key={j} className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2"><CheckCircle2 size={14} className="text-primary-500" /> {f}</li>)}</ul><Link href="/order" className={`w-full text-center py-3 rounded-xl font-semibold transition-all ${pkg.highlighted ? "bg-primary-600 text-white hover:bg-primary-700" : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white"}`}>Diskusikan Project</Link></motion.div>)}
        </div>
      </div>
    </section>
  );
}
