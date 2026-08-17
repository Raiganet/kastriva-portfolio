"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  ExternalLink, 
  Github, 
  X, 
  Code2, 
  Calendar, 
  CheckCircle2 
} from "lucide-react";
import { PortfolioProject } from "@/lib/types/portfolio";
import { config, getWhatsAppLink } from "@/data/config";
import Image from "next/image";

const categories = ["Semua", "Website", "Web App", "Dashboard", "Sistem Informasi", "Android", "Landing Page", "Lainnya"];

export default function Portfolio() {
  const [filter, setFilter] = useState("Semua");
  const [search, setSearch] = useState("");
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null);

  const filteredProjects = config.portfolio.filter((p) => {
    const matchesCategory = filter === "Semua" || p.category === filter;
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                         p.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate category counts
  const categoryCounts = categories.reduce((acc, category) => {
    if (category === "Semua") {
      acc[category] = config.portfolio.length;
      return acc;
    }
    acc[category] = config.portfolio.filter(p => p.category === category).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <section id="portfolio" className="py-20 bg-slate-50 dark:bg-dark-surface/50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Project yang Pernah Saya Buat</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Beberapa hasil kerja terbaik yang telah membantu klien mencapai tujuan digital mereka.
          </p>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button 
                key={cat} 
                onClick={() => setFilter(cat)} 
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === cat ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20" : "bg-white dark:bg-dark-bg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"}`}
              >
                {cat} {categoryCounts[cat] > 0 && `(${categoryCounts[cat]})`}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari project..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white dark:bg-dark-bg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" 
            />
          </div>
        </div>

        {/* Grid */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredProjects.map((project) => (
              <motion.div 
                key={project.id} 
                layout
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.9 }} 
                transition={{ duration: 0.3 }} 
                className="group bg-white dark:bg-dark-bg rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:shadow-primary-900/5 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative h-48 bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <Image 
                    src={project.image} 
                    alt={project.title} 
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button 
                      onClick={() => setSelectedProject(project)} 
                      className="bg-white text-slate-900 px-4 py-2 rounded-full text-sm font-semibold hover:bg-primary-50 transition-colors"
                    >
                      Lihat Detail
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded-md">
                      {project.category}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar size={12} /> {project.year}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary-600 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.technologies.slice(0, 3).map((tech, i) => (
                      <span 
                        key={i} 
                        className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    {project.demoUrl !== "#" && (
                      <a 
                        href={project.demoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex-1 text-center py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                      >
                        <ExternalLink size={16} /> Live Demo
                      </a>
                    )}
                    <button 
                      onClick={() => setSelectedProject(project)} 
                      className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Detail
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Modal Detail */}
        <AnimatePresence>
          {selectedProject && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" 
              onClick={() => setSelectedProject(null)}
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                exit={{ scale: 0.9, opacity: 0 }} 
                className="bg-white dark:bg-dark-bg w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800" 
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative h-64">
                  <Image 
                    src={selectedProject.image} 
                    alt={selectedProject.title} 
                    fill
                    className="object-cover rounded-t-2xl"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <button 
                    onClick={() => setSelectedProject(null)} 
                    className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="p-8">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-semibold">
                      {selectedProject.category}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-semibold flex items-center gap-1">
                      <CheckCircle2 size={14} /> {selectedProject.status}
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold mb-4">{selectedProject.title}</h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                    {selectedProject.description}
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Code2 size={18} className="text-primary-500" /> Teknologi
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedProject.technologies.map((t, i) => (
                          <span 
                            key={i} 
                            className="text-sm px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-md"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Peran Saya</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {selectedProject.myRole}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl mb-6 border border-slate-200 dark:border-slate-800">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-green-500" /> Masalah yang Diselesaikan
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {selectedProject.problemSolved}
                    </p>
                    <h4 className="font-semibold mt-4 mb-2 flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-blue-500" /> Solusi yang Diberikan
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {selectedProject.solution}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    {selectedProject.demoUrl !== "#" && (
                      <a 
                        href={selectedProject.demoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex-1 bg-primary-600 hover:bg-primary-700 text-white text-center py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                      >
                        <ExternalLink size={18} /> Lihat Live Demo
                      </a>
                    )}
                    <a 
                      href={getWhatsAppLink(`Halo Kastriva, saya tertarik membuat website seperti project "${selectedProject.title}". Bisa konsultasi?`)}
                      className="flex-1 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-center py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      Saya Ingin Website Seperti Ini
                    </a>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
