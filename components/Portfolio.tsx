"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ExternalLink, Calendar, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { usePortfolio } from "@/lib/hooks/usePortfolio";
import { PortfolioService } from "@/lib/services/portfolio.service";
import { EmptyState, ErrorState, ImageWithFallback, PortfolioGridSkeleton } from "@/components/ui";
import { PortfolioProject } from "@/lib/types/portfolio";

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function Portfolio() {
  const {
    categories,
    filteredProjects,
    loading,
    error,
    activeCategory,
    searchQuery,
    setCategory,
    setSearchQuery,
    refresh,
  } = usePortfolio();

  const handleProjectClick = (project: PortfolioProject) => {
    PortfolioService.trackView(project.id, project.title);
  };

  const handleDemoClick = (project: PortfolioProject) => {
    PortfolioService.trackDemoClick(project.id, project.title);
  };

  if (loading) {
    return (
      <section id="portfolio" className="py-20 bg-slate-50 dark:bg-dark-surface/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Project yang Pernah Saya Buat</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Beberapa hasil kerja terbaik yang telah membantu klien mencapai tujuan digital mereka.
            </p>
          </div>
          <PortfolioGridSkeleton count={6} />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="portfolio" className="py-20 bg-slate-50 dark:bg-dark-surface/50">
        <div className="container mx-auto px-4 md:px-6">
          <ErrorState message={error} onRetry={refresh} />
        </div>
      </section>
    );
  }

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
                key={cat.id}
                onClick={() => setCategory(cat.name)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.name
                    ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20"
                    : "bg-white dark:bg-dark-bg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
                }`}
              >
                {cat.name} {cat.count > 0 && `(${cat.count})`}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white dark:bg-dark-bg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>
        </div>

        {/* Grid */}
        {filteredProjects.length === 0 ? (
          <EmptyState
            title="Project tidak ditemukan"
            description="Coba ubah filter atau kata kunci pencarian Anda."
            icon={<ImageIcon className="text-slate-400" size={32} />}
            action={{
              label: "Reset Filter",
              onClick: () => {
                setCategory("Semua");
                setSearchQuery("");
              },
            }}
          />
        ) : (
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
                  <Link
                    href={`/portfolio/${generateSlug(project.title)}`}
                    onClick={() => handleProjectClick(project)}
                    className="block relative h-48 bg-slate-200 dark:bg-slate-800 overflow-hidden"
                  >
                    <ImageWithFallback
                      src={project.image}
                      alt={project.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      fallbackIcon={<ImageIcon className="text-slate-400" size={48} />}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {project.featured && (
                      <div className="absolute top-3 right-3 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                        ⭐ Featured
                      </div>
                    )}
                  </Link>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded-md">
                        {project.category}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar size={12} /> {project.year || "Selesai"}
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
                      {project.demoUrl && project.demoUrl !== "#" && (
                        <a
                          href={project.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDemoClick(project);
                          }}
                          className="flex-1 text-center py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                        >
                          <ExternalLink size={16} /> Live Demo
                        </a>
                      )}
                      <Link
                        href={`/portfolio/${generateSlug(project.title)}`}
                        onClick={() => handleProjectClick(project)}
                        className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg text-sm font-medium transition-colors text-center"
                      >
                        Detail
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </section>
  );
}
