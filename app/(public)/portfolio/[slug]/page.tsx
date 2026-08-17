import { notFound } from "next/navigation";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowLeft, 
  ExternalLink, 
  Github, 
  Calendar, 
  CheckCircle2, 
  Code2,
  User
} from "lucide-react";
import { config, getWhatsAppLink } from "@/data/config";
import { PortfolioProject } from "@/lib/types/portfolio";
import PortfolioDetailCTA from "@/components/portfolio/PortfolioDetailCTA";

// Helper: generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface PortfolioDetailProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PortfolioDetailProps): Promise<Metadata> {
  const project = config.portfolio.find(
    (p) => generateSlug(p.title) === params.slug
  );
  
  if (!project) {
    return { title: "Project Not Found" };
  }
  
  return {
    title: `${project.title} | ${config.brand.name} Portfolio`,
    description: project.description,
    openGraph: {
      title: project.title,
      description: project.description,
      images: [project.image],
    },
  };
}

export default function PortfolioDetailPage({ params }: PortfolioDetailProps) {
  const project = config.portfolio.find(
    (p) => generateSlug(p.title) === params.slug
  );

  if (!project) {
    notFound();
  }

  return (
    <div className="pt-24 pb-20 min-h-screen bg-white dark:bg-dark-bg">
      <div className="container mx-auto px-4 md:px-6 max-w-5xl">
        {/* Back Button */}
        <Link 
          href="/portfolio" 
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 mb-8 transition-colors"
        >
          <ArrowLeft size={16} />
          Kembali ke Portfolio
        </Link>

        {/* Hero Image */}
        <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden mb-8 border border-slate-200 dark:border-slate-800 shadow-2xl">
          <Image 
            src={project.image}
            alt={project.title}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 1024px"
            priority
          />
        </div>

        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-semibold">
              {project.category}
            </span>
            <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-semibold flex items-center gap-1">
              <CheckCircle2 size={14} /> {project.status}
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold flex items-center gap-1">
              <Calendar size={14} /> {project.year}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{project.title}</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            {project.description}
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2 space-y-6">
            {/* Problem & Solution */}
            <div className="bg-slate-50 dark:bg-dark-surface p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                <CheckCircle2 className="text-red-500" size={20} />
                Masalah yang Diselesaikan
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {project.problemSolved}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-dark-surface p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                <CheckCircle2 className="text-green-500" size={20} />
                Solusi yang Diberikan
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {project.solution}
              </p>
            </div>

            {/* Features */}
            {project.features && project.features.length > 0 && (
              <div>
                <h3 className="text-xl font-bold mb-4">Fitur Utama</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {project.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-primary-500 flex-shrink-0" />
                      <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gallery */}
            {project.images && project.images.length > 0 && (
              <div>
                <h3 className="text-xl font-bold mb-4">Galeri Project</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {project.images.map((img, i) => (
                    <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                      <Image 
                        src={img}
                        alt={`${project.title} - ${i + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl border border-slate-200 dark:border-slate-800 sticky top-24">
              <h3 className="font-bold mb-4">Informasi Project</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <Code2 size={12} /> Teknologi
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {project.technologies.map((tech, i) => (
                      <span 
                        key={i} 
                        className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <User size={12} /> Peran Saya
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {project.myRole}
                  </p>
                </div>

                <div>
                  <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <Calendar size={12} /> Tahun
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {project.year}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {project.demoUrl && project.demoUrl !== "#" && (
                  <a 
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <ExternalLink size={18} /> Live Demo
                  </a>
                )}
                
                {project.githubUrl && (
                  <a 
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <Github size={18} /> Source Code
                  </a>
                )}

                <PortfolioDetailCTA 
                  portfolioId={String(project.id)}
                  portfolioTitle={project.title}
                  portfolioCategory={project.category}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
