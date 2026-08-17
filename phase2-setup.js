const fs = require('fs');
const path = require('path');

function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content.trim() + '\n', 'utf8');
  console.log(`✅ Created: ${filePath}`);
}

function deleteFile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`🗑️  Deleted: ${filePath}`);
  }
}

console.log(`\n🚀 Memulai Phase 2: Modular Route Structure...\n`);

// 1. Buat Public Layout
writeFile('app/(public)/layout.tsx', `import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
`);

// 2. Homepage - Clean & Fokus
writeFile('app/(public)/page.tsx', `import { Metadata } from "next";
import Hero from "@/components/Hero";
import { config } from "@/data/config";
import Section from "@/components/Section";
import ServicesSection from "@/components/sections/ServicesSection";
import WhyChooseSection from "@/components/sections/WhyChooseSection";
import PricingSection from "@/components/sections/PricingSection";
import FinalCTA from "@/components/sections/FinalCTA";
import StatsSection from "@/components/sections/StatsSection";
import FeaturedProject from "@/components/sections/FeaturedProject";

export const metadata: Metadata = {
  title: \`\${config.brand.name} | Jasa Pembuatan Website & Aplikasi Profesional\`,
  description: config.hero.subheadline,
  keywords: ["jasa pembuatan website", "jasa web app", "web developer Indonesia"],
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsSection />
      <ServicesSection />
      <FeaturedProject />
      <WhyChooseSection />
      <PricingSection />
      <FinalCTA />
    </>
  );
}
`);

// 3. Portfolio Listing Page
writeFile('app/(public)/portfolio/page.tsx', `import { Metadata } from "next";
import Portfolio from "@/components/Portfolio";
import { config } from "@/data/config";

export const metadata: Metadata = {
  title: \`Portfolio | \${config.brand.name}\`,
  description: "Lihat portfolio project website, web app, dan aplikasi yang pernah saya buat.",
};

export default function PortfolioPage() {
  return (
    <div className="pt-32">
      <Portfolio />
    </div>
  );
}
`);

// 4. Portfolio Detail Page dengan Slug
writeFile('app/(public)/portfolio/[slug]/page.tsx', `import { notFound } from "next/navigation";
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
    title: \`\${project.title} | \${config.brand.name} Portfolio\`,
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
                        alt={\`\${project.title} - \${i + 1}\`}
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
`);

// 5. Order Page dengan Smart URL Params
writeFile('app/(public)/order/page.tsx', `import { Metadata } from "next";
import { config } from "@/data/config";
import SmartOrderForm from "@/components/order/SmartOrderForm";

export const metadata: Metadata = {
  title: \`Mulai Project | \${config.brand.name}\`,
  description: "Mulai project website atau aplikasi Anda bersama Kastriva.",
};

export default function OrderPage() {
  return (
    <div className="pt-32 pb-20">
      <SmartOrderForm />
    </div>
  );
}
`);

// 6. Services Page
writeFile('app/(public)/services/page.tsx', `import { Metadata } from "next";
import ServicesSection from "@/components/sections/ServicesSection";
import FinalCTA from "@/components/sections/FinalCTA";
import { config } from "@/data/config";

export const metadata: Metadata = {
  title: \`Layanan | \${config.brand.name}\`,
  description: "Layanan pembuatan website, web app, sistem informasi, dan aplikasi Android profesional.",
};

export default function ServicesPage() {
  return (
    <div className="pt-32">
      <ServicesSection />
      <FinalCTA />
    </div>
  );
}
`);

// 7. Process Page
writeFile('app/(public)/process/page.tsx', `import { Metadata } from "next";
import ProcessSection from "@/components/sections/ProcessSection";
import FinalCTA from "@/components/sections/FinalCTA";
import { config } from "@/data/config";

export const metadata: Metadata = {
  title: \`Proses Kerja | \${config.brand.name}\`,
  description: "Bagaimana project Anda dikerjakan dari konsultasi hingga deployment.",
};

export default function ProcessPage() {
  return (
    <div className="pt-32">
      <ProcessSection />
      <FinalCTA />
    </div>
  );
}
`);

// 8. About Page
writeFile('app/(public)/about/page.tsx', `import { Metadata } from "next";
import { config } from "@/data/config";
import FinalCTA from "@/components/sections/FinalCTA";
import { CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: \`Tentang | \${config.brand.name}\`,
  description: "Tentang Kastriva - Layanan pengembangan website dan aplikasi custom modern.",
};

export default function AboutPage() {
  return (
    <div className="pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Tentang {config.brand.name}</h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
            {config.brand.tagline}. Fokus pada kualitas kode, desain modern, dan kepuasan klien.
          </p>
        </div>

        <div className="prose dark:prose-invert max-w-none mb-12">
          <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
            Kastriva adalah layanan pengembangan website dan aplikasi custom yang berfokus pada solusi digital modern untuk bisnis, UMKM, organisasi, dan personal.
          </p>
          <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
            Saya percaya bahwa setiap bisnis berhak mendapatkan solusi digital yang berkualitas, sesuai kebutuhan, dan dapat berkembang seiring pertumbuhan bisnis.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-dark-surface p-8 rounded-2xl border border-slate-200 dark:border-slate-800 mb-12">
          <h2 className="text-2xl font-bold mb-6">Prinsip Kerja</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              "Kualitas kode adalah prioritas",
              "Desain yang modern dan fungsional",
              "Komunikasi transparan dengan klien",
              "Solusi yang scalable untuk masa depan",
              "Support berkelanjutan setelah project",
              "Tidak ada klaim palsu atau data fiktif"
            ].map((principle, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="text-primary-500 flex-shrink-0 mt-1" size={20} />
                <span className="text-slate-700 dark:text-slate-300">{principle}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <FinalCTA />
    </div>
  );
}
`);

// 9. Contact Page
writeFile('app/(public)/contact/page.tsx', `import { Metadata } from "next";
import { config, getWhatsAppLink } from "@/data/config";
import { MessageCircle, Mail, Instagram, Github } from "lucide-react";

export const metadata: Metadata = {
  title: \`Kontak | \${config.brand.name}\`,
  description: "Hubungi Kastriva untuk konsultasi project Anda.",
};

export default function ContactPage() {
  return (
    <div className="pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Siap Membuat Project Bersama?</h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Pilih cara yang paling nyaman untuk menghubungi saya.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <a 
            href={getWhatsAppLink("Halo Kastriva, saya ingin konsultasi mengenai project.")}
            target="_blank"
            rel="noopener noreferrer"
            className="group p-8 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800 hover:border-green-500 hover:shadow-xl transition-all"
          >
            <div className="w-14 h-14 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <MessageCircle className="text-green-600 dark:text-green-400" size={28} />
            </div>
            <h3 className="text-xl font-bold mb-2">WhatsApp</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-2">Respon cepat, konsultasi langsung</p>
            <p className="text-primary-600 font-medium">{config.brand.whatsapp}</p>
          </a>

          <a 
            href={\`mailto:\${config.brand.email}\`}
            className="group p-8 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800 hover:border-primary-500 hover:shadow-xl transition-all"
          >
            <div className="w-14 h-14 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Mail className="text-primary-600 dark:text-primary-400" size={28} />
            </div>
            <h3 className="text-xl font-bold mb-2">Email</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-2">Untuk diskusi detail project</p>
            <p className="text-primary-600 font-medium">{config.brand.email}</p>
          </a>

          <a 
            href={config.brand.socials.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="group p-8 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800 hover:border-pink-500 hover:shadow-xl transition-all"
          >
            <div className="w-14 h-14 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Instagram className="text-pink-600 dark:text-pink-400" size={28} />
            </div>
            <h3 className="text-xl font-bold mb-2">Instagram</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-2">Follow untuk update terbaru</p>
            <p className="text-primary-600 font-medium">@{config.brand.name.toLowerCase()}</p>
          </a>

          <a 
            href={config.brand.socials.github}
            target="_blank"
            rel="noopener noreferrer"
            className="group p-8 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800 hover:border-slate-900 hover:shadow-xl transition-all"
          >
            <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Github className="text-slate-900 dark:text-slate-100" size={28} />
            </div>
            <h3 className="text-xl font-bold mb-2">GitHub</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-2">Lihat source code project</p>
            <p className="text-primary-600 font-medium">github.com/{config.brand.name.toLowerCase()}</p>
          </a>
        </div>
      </div>
    </div>
  );
}
`);

// 10. Components yang diekstrak dari page.tsx lama
writeFile('components/sections/ServicesSection.tsx', `"use client";
import { motion } from "framer-motion";
import { CheckCircle2, Code2, Layout, Smartphone, Server, Wrench, ArrowRight } from "lucide-react";
import { config, getWhatsAppLink } from "@/data/config";

export default function ServicesSection() {
  const iconMap: Record<string, any> = { 
    Building2: Layout, 
    MousePointerClick: Code2, 
    Globe: Server, 
    Database: Server, 
    Smartphone: Smartphone, 
    Wrench: Wrench 
  };

  return (
    <section id="services" className="py-20">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Layanan Saya</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Solusi digital komprehensif yang disesuaikan dengan skala dan kebutuhan bisnis Anda.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {config.services.map((service) => {
            const Icon = iconMap[service.icon] || Code2;
            return (
              <motion.div 
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group p-6 rounded-2xl bg-white dark:bg-dark-bg border border-slate-200 dark:border-slate-800 hover:border-primary-500/50 hover:shadow-xl hover:shadow-primary-900/5 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-4 group-hover:scale-110 transition-transform">
                  <Icon size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">{service.desc}</p>
                <ul className="space-y-2 mb-6">
                  {service.features.map((f, i) => (
                    <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-green-500" /> {f}
                    </li>
                  ))}
                </ul>
                <a 
                  href={getWhatsAppLink(\`Halo, saya ingin konsultasi mengenai layanan \${service.title}\`)}
                  className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold text-sm hover:gap-3 transition-all"
                >
                  Konsultasikan <ArrowRight size={16} />
                </a>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
`);

writeFile('components/sections/StatsSection.tsx', `"use client";
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
`);

writeFile('components/sections/WhyChooseSection.tsx', `"use client";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { config } from "@/data/config";

export default function WhyChooseSection() {
  return (
    <section className="py-20 bg-slate-50 dark:bg-dark-surface/50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Kenapa Memilih {config.brand.name}?
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              Saya tidak hanya menulis kode, tetapi memberikan solusi bisnis yang berkelanjutan. 
              Setiap project dikerjakan dengan standar profesional tinggi.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                "Desain Modern & Premium",
                "100% Responsive",
                "Performa Cepat (Core Web Vitals)",
                "Struktur Kode Rapi & Scalable",
                "Konsultasi Gratis Sebelum Mulai",
                "Support & Maintenance Setelah Project"
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-1 bg-green-100 dark:bg-green-900/30 p-1 rounded-full">
                    <CheckCircle2 size={16} className="text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-purple-500 rounded-3xl blur-2xl opacity-20" />
            <div className="relative glass p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
              <div className="space-y-6">
                {config.process.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 font-bold flex items-center justify-center text-sm">
                      {step.step}
                    </div>
                    <div>
                      <h4 className="font-bold mb-1">{step.title}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
`);

writeFile('components/sections/PricingSection.tsx', `"use client";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { config } from "@/data/config";

export default function PricingSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Investasi Project</h2>
          <p className="text-slate-600 dark:text-slate-400">
            Harga transparan dan fleksibel sesuai kompleksitas kebutuhan.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {config.pricing.map((pkg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={\`p-6 rounded-2xl border \${
                i === 2 
                  ? "border-primary-500 bg-primary-50/30 dark:bg-primary-900/10 shadow-xl shadow-primary-900/5" 
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-bg"
              } flex flex-col\`}
            >
              <h3 className="text-lg font-bold mb-2">{pkg.name}</h3>
              <div className="text-2xl font-bold text-primary-600 mb-6">{pkg.price}</div>
              <ul className="space-y-3 mb-8 flex-1">
                {pkg.features.map((f, j) => (
                  <li key={j} className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-primary-500" /> {f}
                  </li>
                ))}
              </ul>
              <a 
                href="/order" 
                className={\`w-full text-center py-3 rounded-xl font-semibold transition-all \${
                  i === 2 
                    ? "bg-primary-600 text-white hover:bg-primary-700" 
                    : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white"
                }\`}
              >
                Diskusikan Project
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
`);

writeFile('components/sections/FinalCTA.tsx', `"use client";
import { motion } from "framer-motion";

export default function FinalCTA() {
  return (
    <section className="py-20 bg-primary-600 dark:bg-primary-900 text-white text-center">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Sudah Punya Ide? Mari Wujudkan Menjadi Website.
          </h2>
          <p className="text-primary-100 text-lg mb-10 max-w-2xl mx-auto">
            Ceritakan kebutuhan Anda. Saya akan membantu menentukan solusi digital yang paling sesuai.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a 
              href="/order" 
              className="bg-white text-primary-700 px-8 py-4 rounded-full font-bold hover:bg-primary-50 transition-all shadow-lg"
            >
              Mulai Konsultasi
            </a>
            <a 
              href="/portfolio" 
              className="bg-primary-700 text-white border border-primary-500 px-8 py-4 rounded-full font-bold hover:bg-primary-800 transition-all"
            >
              Lihat Portfolio
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
`);

writeFile('components/sections/ProcessSection.tsx', `"use client";
import { motion } from "framer-motion";
import { config } from "@/data/config";

export default function ProcessSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Bagaimana Project Anda Dikerjakan?</h2>
          <p className="text-slate-600 dark:text-slate-400">Proses terstruktur untuk hasil terbaik</p>
        </div>
        
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800 md:left-1/2 md:-translate-x-1/2" />
          
          {config.process.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={\`relative flex items-center mb-12 \${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}\`}
            >
              <div className={\`flex-1 \${i % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'} pl-20 md:pl-0\`}>
                <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400">{step.desc}</p>
                </div>
              </div>
              
              <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 w-16 h-16 rounded-full bg-primary-600 text-white font-bold flex items-center justify-center text-lg border-4 border-white dark:border-dark-bg shadow-lg">
                {step.step}
              </div>
              
              <div className="flex-1 hidden md:block" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
`);

writeFile('components/sections/FeaturedProject.tsx', `"use client";
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
                  href={\`/portfolio/\${generateSlug(project.title)}\`}
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
`);

// 11. Smart Order Form Component
writeFile('components/order/SmartOrderForm.tsx', `"use client";
import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { config, getWhatsAppLink } from "@/data/config";

function OrderFormContent() {
  const searchParams = useSearchParams();
  const portfolioId = searchParams.get("portfolio");
  const serviceType = searchParams.get("service");
  
  const portfolioProject = portfolioId 
    ? config.portfolio.find(p => String(p.id) === portfolioId)
    : null;

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    business: "",
    email: "",
    whatsapp: "",
    type: serviceType || (portfolioProject ? portfolioProject.category : "Website"),
    budget: "",
    deadline: "",
    description: portfolioProject ? \`Saya tertarik dengan konsep project "\${portfolioProject.title}" dan ingin membuat website serupa.\` : "",
    features: portfolioProject ? portfolioProject.features.join(", ") : "",
    reference: portfolioProject ? portfolioProject.title : "",
  });

  useEffect(() => {
    if (serviceType) {
      setFormData(prev => ({ ...prev, type: serviceType }));
    }
  }, [serviceType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const message = \`Halo Kastriva, saya ingin memesan jasa pembuatan *\${formData.type}*.
    
*Detail Project:*
- Nama: \${formData.name}
- Bisnis: \${formData.business}
- Email: \${formData.email}
- WhatsApp: \${formData.whatsapp}
- Budget: \${formData.budget || "Belum ditentukan"}
- Deadline: \${formData.deadline || "Fleksibel"}
- Referensi: \${formData.reference || "Tidak ada"}
- Deskripsi: \${formData.description}
- Fitur Dibutuhkan: \${formData.features || "-"}\`;
    
    window.open(getWhatsAppLink(message), "_blank");
    
    setLoading(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 5000);
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-white dark:bg-dark-bg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm";

  return (
    <div className="container mx-auto px-4 md:px-6 max-w-4xl">
      {portfolioProject && (
        <div className="mb-6 p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-primary-600 dark:text-primary-400 flex-shrink-0" size={20} />
            <div>
              <p className="text-sm font-semibold text-primary-900 dark:text-primary-100">
                Referensi Project: {portfolioProject.title}
              </p>
              <p className="text-xs text-primary-700 dark:text-primary-300">
                Form sudah diisi otomatis berdasarkan project ini
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Mulai Project Anda</h2>
        <p className="text-slate-600 dark:text-slate-400">
          Isi form di bawah ini untuk mendiskusikan kebutuhan digital Anda.
        </p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="bg-white dark:bg-dark-bg p-6 md:p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 space-y-5"
      >
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-4 rounded-xl flex items-center gap-3 border border-green-200 dark:border-green-800">
            <CheckCircle size={20} /> Data berhasil dikirim! Anda akan diarahkan ke WhatsApp.
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium mb-2">Nama Lengkap *</label>
            <input required type="text" className={inputClass} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Nama Bisnis</label>
            <input type="text" className={inputClass} value={formData.business} onChange={e => setFormData({ ...formData, business: e.target.value })} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium mb-2">Email *</label>
            <input required type="email" className={inputClass} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">WhatsApp *</label>
            <input required type="tel" className={inputClass} value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-medium mb-2">Jenis Project *</label>
            <select required className={inputClass} value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
              {["Website", "Landing Page", "Company Profile", "Web App", "Dashboard", "Sistem Informasi", "Android App", "Custom"].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Budget</label>
            <select className={inputClass} value={formData.budget} onChange={e => setFormData({ ...formData, budget: e.target.value })}>
              <option value="">Pilih Range</option>
              <option value="< 5 Juta">{'<'} 5 Juta</option>
              <option value="5 - 15 Juta">5 - 15 Juta</option>
              <option value="15 - 50 Juta">15 - 50 Juta</option>
              <option value="> 50 Juta">{'>'} 50 Juta</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Deadline</label>
            <input type="text" placeholder="Contoh: 1 bulan" className={inputClass} value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Deskripsi *</label>
          <textarea required rows={4} className={inputClass} placeholder="Jelaskan kebutuhan Anda..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Fitur yang Dibutuhkan</label>
          <input type="text" className={inputClass} placeholder="Contoh: Login, Payment Gateway" value={formData.features} onChange={e => setFormData({ ...formData, features: e.target.value })} />
        </div>

        <button
          disabled={loading}
          type="submit"
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          {loading ? "Mengirim..." : "Kirim Permintaan Project"}
        </button>
      </motion.form>
    </div>
  );
}

export default function SmartOrderForm() {
  return (
    <Suspense fallback={<div className="py-20 text-center">Loading...</div>}>
      <OrderFormContent />
    </Suspense>
  );
}
`);

// 12. Portfolio Detail CTA
writeFile('components/portfolio/PortfolioDetailCTA.tsx', `"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface PortfolioDetailCTAProps {
  portfolioId: string;
  portfolioTitle: string;
  portfolioCategory: string;
}

export default function PortfolioDetailCTA({ 
  portfolioId, 
  portfolioTitle, 
  portfolioCategory 
}: PortfolioDetailCTAProps) {
  return (
    <Link
      href={\`/order?portfolio=\${portfolioId}&service=\${encodeURIComponent(portfolioCategory)}\`}
      className="w-full bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20"
    >
      Saya Ingin Website Seperti Ini <ArrowRight size={18} />
    </Link>
  );
}
`);

// 13. Update Navbar untuk route baru
writeFile('components/Navbar.tsx', `"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Moon, Sun, ArrowRight } from "lucide-react";
import { useTheme } from "next-themes";
import { config, getWhatsAppLink } from "@/data/config";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Services", href: "/services" },
    { name: "Portfolio", href: "/portfolio" },
    { name: "Process", href: "/process" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className={\`fixed top-0 left-0 right-0 z-50 transition-all duration-300 \${scrolled ? "glass shadow-sm py-3" : "bg-transparent py-5"}\`}>
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold tracking-tight text-gradient">
          {config.brand.name}
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={\`text-sm font-medium transition-colors \${
                isActive(link.href)
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400"
              }\`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <Link
            href="/order"
            className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-primary-600/20"
          >
            Mulai Project <ArrowRight size={16} />
          </Link>
        </div>

        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-full left-0 right-0 glass border-t border-slate-200 dark:border-dark-border p-4 shadow-xl"
          >
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={\`text-base font-medium py-2 border-b border-slate-100 dark:border-slate-800 \${
                    isActive(link.href) ? "text-primary-600" : ""
                  }\`}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                href="/order"
                className="bg-primary-600 text-white text-center py-3 rounded-lg font-semibold mt-2"
              >
                Mulai Project
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
`);

// 14. Update Footer
writeFile('components/Footer.tsx', `import { config } from "@/data/config";
import { Instagram, Github, Globe, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-50 dark:bg-dark-surface border-t border-slate-200 dark:border-slate-800 pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold text-gradient mb-4">{config.brand.name}</h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-sm mb-6">
              {config.brand.tagline}. Fokus pada kualitas kode, desain modern, dan kepuasan klien.
            </p>
            <div className="flex gap-4">
              <a href={config.brand.socials.instagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white dark:bg-dark-bg border border-slate-200 dark:border-slate-700 hover:text-primary-600 transition-colors">
                <Instagram size={20} />
              </a>
              <a href={config.brand.socials.github} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white dark:bg-dark-bg border border-slate-200 dark:border-slate-700 hover:text-primary-600 transition-colors">
                <Github size={20} />
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-4">Navigasi</h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><Link href="/" className="hover:text-primary-600 transition-colors">Home</Link></li>
              <li><Link href="/services" className="hover:text-primary-600 transition-colors">Services</Link></li>
              <li><Link href="/portfolio" className="hover:text-primary-600 transition-colors">Portfolio</Link></li>
              <li><Link href="/about" className="hover:text-primary-600 transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-primary-600 transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Kontak</h4>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2"><MessageCircle size={16} /> {config.brand.whatsapp}</li>
              <li className="flex items-center gap-2"><Globe size={16} /> {config.brand.email}</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-200 dark:border-slate-800 pt-8 text-center text-sm text-slate-500">
          © 2026 {config.brand.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
`);

// 15. Update app/page.tsx lama (hapus yang lama)
deleteFile('app/page.tsx');

// 16. Update root layout
writeFile('app/layout.tsx', `import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { config } from "@/data/config";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: {
    default: \`\${config.brand.name} | Jasa Pembuatan Website & Aplikasi Profesional\`,
    template: \`%s | \${config.brand.name}\`,
  },
  description: config.hero.subheadline,
  keywords: [
    "jasa pembuatan website",
    "jasa website profesional",
    "jasa pembuatan web app",
    "web developer Indonesia",
    "jasa pembuatan sistem informasi",
    "jasa website UMKM"
  ],
  openGraph: {
    title: config.brand.name,
    description: config.hero.subheadline,
    type: "website",
    locale: "id_ID",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={\`\${plusJakarta.variable} font-sans antialiased\`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
`);

// 17. Update next.config.js untuk support image dari domain eksternal (jika perlu)
writeFile('next.config.js', `/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};
module.exports = nextConfig;
`);

console.log(`\n🎉 Phase 2: Modular Route Structure berhasil diimplementasikan!`);
console.log(`\n📌 STRUKTUR ROUTE BARU:`);
console.log("/                           → Homepage");
console.log("/services                   → Services");
console.log("/portfolio                  → Portfolio listing");
console.log("/portfolio/[slug]           → Portfolio detail");
console.log("/order                      → Smart order form");
console.log("/process                    → Process");
console.log("/about                      → About");
console.log("/contact                    → Contact");
console.log(`\n📌 LANGKAH SELANJUTNYA:`);
console.log(`1. Install dependency: npm install`);
console.log(`2. Jalankan: npm run dev`);
console.log(`3. Test route: /portfolio, /order?portfolio=1, dll`);
console.log(`4. Commit: git add . && git commit -m "Phase 2: Modular Route Structure"`);
console.log(`5. Push: git push`);
console.log(`\n💡 SMART FEATURES:`);
console.log(`- Portfolio detail page dengan slug SEO-friendly`);
console.log(`- Smart order form (auto-fill dari portfolio)`);
console.log(`- Metadata SEO per halaman`);
console.log(`- Active state navbar`);