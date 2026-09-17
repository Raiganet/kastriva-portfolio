"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSiteContent } from "@/components/cms/SiteContentProvider";

export default function FinalCTA() {
  const { cta } = useSiteContent();
  if (!cta.visible) return null;
  return <section className="py-20 bg-primary-600 dark:bg-primary-900 text-white text-center"><div className="container mx-auto px-4"><motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}><h2 className="text-3xl md:text-5xl font-bold mb-6">{cta.title}</h2><p className="text-primary-100 text-lg mb-10 max-w-2xl mx-auto">{cta.subtitle}</p><div className="flex flex-col sm:flex-row justify-center gap-4"><Link href={cta.primaryHref} className="bg-white text-primary-700 px-8 py-4 rounded-full font-bold hover:bg-primary-50 transition-all shadow-lg">{cta.primaryLabel}</Link><Link href={cta.secondaryHref} className="bg-primary-700 text-white border border-primary-500 px-8 py-4 rounded-full font-bold hover:bg-primary-800 transition-all">{cta.secondaryLabel}</Link></div></motion.div></div></section>;
}
