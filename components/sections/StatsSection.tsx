"use client";
import { motion } from "framer-motion";
import { config } from "@/data/config";

export default function StatsSection() {
  return (
    <section className="py-12 border-y border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-dark-surface/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {config.stats.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-1">{stat.value}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
