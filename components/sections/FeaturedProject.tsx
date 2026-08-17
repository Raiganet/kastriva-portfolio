"use client";
import { motion } from "framer-motion";
import { ExternalLink, ArrowRight, Star } from "lucide-react";
import Link from "next/link";
import { config } from "@/data/config";
import { ImageWithFallback } from "@/components/ui";
import { PortfolioService } from "@/lib/services/portfolio.service";

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function FeaturedProject() {
  const featuredProjects = config.portfolio.filter((p) => p.featured).slice(0, 2);

  if (featuredProjects.length === 0) return null;

  const handleProjectClick = (project: any) => {
    PortfolioService.trackView(project.id, project.title);
  };

  return (
    <section className="py-20 bg-slate-50 dark:bg-dark-surface/50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold mb-4 shadow-lg"
          >
            <Star size={18} fill="currentColor" />
            Project Unggulan
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Karya Terbaik Kami
          </h2>
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
              className="group bg-white dark:bg-dark-bg rounded-2xl overflow-hidden border-2 border-yellow-400/50 hover:border-yellow-500 hover:shadow-2xl hover:shadow-yellow-500/20 transition-all duration-300"
            >
              <Link
                href={`/portfolio/${generateSlug(project.title)}`}
                onClick={() => handleProjectClick(project)}
                className="block relative h-72 overflow-hidden"
              >
                <ImageWithFallback
                  src={project.image}
                  alt={project.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute top-4 right-4 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-bold rounded-full shadow-xl flex items-center gap-2">
                  <Star size={16} fill="currentColor" />
                  Featured
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="inline-block px-3 py-1 rounded-full bg-white/90 dark:bg-dark-surface/90 text-sm font-semibold mb-2">
                    {project.category}
                  </span>
                  <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-yellow-300 transition-colors">
                    {project.title}
                  </h3>
                </div>
              </Link>
              <div className="p-6">
                <p className="text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.technologies.slice(0, 4).map((tech, j) => (
                    <span
                      key={j}
                      className="text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="flex gap-3">
                  {project.demoUrl && project.demoUrl !== "#" && (
                    <a
                      href={project.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.stopPropagation();
                        PortfolioService.trackDemoClick(project.id, project.title);
                      }}
                      className="flex-1 text-center py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <ExternalLink size={16} /> Live Demo
                    </a>
                  )}
                  <Link
                    href={`/portfolio/${generateSlug(project.title)}`}
                    onClick={() => handleProjectClick(project)}
                    className="flex-1 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    Lihat Detail <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
