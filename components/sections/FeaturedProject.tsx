"use client";
import { motion } from "framer-motion";
import { ExternalLink, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { config } from "@/data/config";

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function FeaturedProject() {
  const featuredProjects = config.portfolio
    .filter(p => p.featured)
    .slice(0, 2);

  if (featuredProjects.length === 0) return null;

  return (
    <section className="py-20 bg-slate-50 dark:bg-dark-surface/50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Project Unggulan</h2>
          <p className="text-slate-600 dark:text-slate-400">
            Beberapa project terbaik yang pernah saya kerjakan
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {featuredProjects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group bg-white dark:bg-dark-bg rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:shadow-2xl transition-all duration-300"
            >
              <div className="relative h-64 overflow-hidden">
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="inline-block px-3 py-1 rounded-full bg-white/90 dark:bg-dark-surface/90 text-sm font-semibold mb-2">
                    {project.category}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-3 group-hover:text-primary-600 transition-colors">
                  {project.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.technologies.slice(0, 3).map((tech, j) => (
                    <span 
                      key={j} 
                      className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <Link
                  href={`/portfolio/${generateSlug(project.title)}`}
                  className="inline-flex items-center gap-2 text-primary-600 font-semibold hover:gap-3 transition-all"
                >
                  Lihat Detail <ArrowRight size={16} />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
