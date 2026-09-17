"use client";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Code2 } from "lucide-react";
import { useSiteContent } from "@/components/cms/SiteContentProvider";
import Link from "next/link";

export default function Hero() {
  const { hero } = useSiteContent();
  if (!hero.visible) return null;
  return (
    <section id="home" className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]" />
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-6 border border-primary-100 dark:border-primary-800">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span></span>
              {hero.eyebrow}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">{hero.headline}</h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-8 leading-relaxed max-w-xl">{hero.subheadline}</p>
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link href={hero.ctaPrimaryHref} className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-full font-semibold flex items-center justify-center gap-2 transition-all hover:shadow-xl hover:shadow-primary-600/20 hover:-translate-y-1">{hero.ctaPrimary} <ArrowRight size={20} /></Link>
              <Link href={hero.ctaSecondaryHref} className="glass hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white px-8 py-4 rounded-full font-semibold flex items-center justify-center gap-2 transition-all border border-slate-200 dark:border-slate-700">{hero.ctaSecondary}</Link>
            </div>
            <div className="flex flex-wrap gap-4 md:gap-6">
              {hero.badges.map((badge, i) => (<div key={i} className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400"><CheckCircle2 size={16} className="text-primary-500" /> {badge}</div>))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl shadow-primary-900/10 animate-float bg-slate-900">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border-b border-slate-700">
                <div className="w-3 h-3 rounded-full bg-red-500" /><div className="w-3 h-3 rounded-full bg-yellow-500" /><div className="w-3 h-3 rounded-full bg-green-500" />
                <div className="ml-4 text-xs text-slate-400 font-mono">kastriva-dashboard.tsx</div>
              </div>
              <div className="p-6 font-mono text-sm text-slate-300 space-y-2">
                <div><span className="text-purple-400">import</span> <span className="text-yellow-300">{'{'} Success {'}'}</span> <span className="text-purple-400">from</span> <span className="text-green-400">'@/components'</span>;</div>
                <div><span className="text-purple-400">export default function</span> <span className="text-blue-400">Dashboard</span>() {'{'}</div>
                <div className="pl-4"><span className="text-purple-400">return</span> (</div>
                <div className="pl-8"><span className="text-slate-500">&lt;!-- Premium Kastriva Interface --&gt;</span></div>
                <div className="pl-8"><span className="text-blue-400">&lt;Success</span> <span className="text-sky-300">message</span>=<span className="text-green-400">"Project Siap Digunakan"</span> <span className="text-blue-400">/&gt;</span></div>
                <div className="pl-4">);</div><div>{'}'}</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
