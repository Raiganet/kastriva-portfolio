const fs = require('fs');
const path = require('path');

// Helper function to create directory and write file
function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content.trim() + '\n', 'utf8');
  console.log(`✅ Created: ${filePath}`);
}

console.log(`\n🚀 Memulai Phase 1: TypeScript Foundation...\n`);

// 1. Create lib/types/portfolio.ts
writeFile('lib/types/portfolio.ts', `/**
 * Interface untuk data project portfolio
 * Sesuaikan dengan struktur data di Google Sheets nantinya
 */
export interface PortfolioProject {
  id: number;
  title: string;
  category: string;
  description: string;
  image: string;
  images?: string[];
  technologies: string[];
  demoUrl: string;
  githubUrl?: string;
  year: string;
  status: string;
  featured: boolean;
  problemSolved: string;
  solution: string;
  features: string[];
  myRole: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface untuk kategori portfolio
 */
export interface PortfolioCategory {
  id: string;
  name: string;
  slug: string;
  count: number;
}

/**
 * Interface untuk statistik dashboard
 */
export interface DashboardStats {
  totalPortfolio: number;
  completedProjects: number;
  activeProjects: number;
  totalCustomers: number;
}
`);

// 2. Create lib/types/order.ts
writeFile('lib/types/order.ts', `/**
 * Interface untuk data order
 */
export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  name: string;
  business: string;
  email: string;
  whatsapp: string;
  projectType: string;
  serviceId: string;
  portfolioId?: string;
  portfolioTitle?: string;
  budget: string;
  deadline: string;
  description: string;
  features: string;
  referenceUrl?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface untuk status order
 */
export type OrderStatus = 
  | 'Submitted'
  | 'Reviewing'
  | 'Discussing'
  | 'Quotation'
  | 'Approved'
  | 'In Progress'
  | 'Revision'
  | 'Completed'
  | 'Cancelled';

/**
 * Interface untuk data customer
 */
export interface Customer {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  business: string;
  avatar?: string;
  status: string;
  createdAt: string;
  lastActivity: string;
}
`);

// 3. Update data/config.ts with proper typing
writeFile('data/config.ts', `import { PortfolioProject, PortfolioCategory, DashboardStats } from "@/lib/types/portfolio";
import { OrderStatus } from "@/lib/types/order";

export const config = {
  brand: {
    name: "Kastriva",
    tagline: "Solusi Digital Modern untuk Bisnis Anda",
    whatsapp: "6281234567890",
    email: "hello@kastriva.com",
    socials: {
      instagram: "#",
      tiktok: "#",
      github: "#",
      website: "#"
    }
  },
  hero: {
    headline: "Bangun Website & Aplikasi Profesional untuk Mengembangkan Bisnis Anda",
    subheadline: "Saya membantu bisnis, UMKM, organisasi, dan personal membangun website serta aplikasi custom yang modern, cepat, responsif, dan sesuai kebutuhan.",
    ctaPrimary: "Mulai Project",
    ctaSecondary: "Lihat Portfolio",
    badges: ["Responsive", "Modern Design", "Custom Development", "SEO Friendly", "Fast Performance"]
  },
  stats: [
    { label: "Project Selesai", value: "0" },
    { label: "Website & Web App", value: "0" },
    { label: "Client", value: "0" },
    { label: "Teknologi", value: "0" }
  ] as { label: string; value: string }[],
  services: [
    { 
      id: 1, 
      title: "Website Company Profile", 
      desc: "Website profesional untuk membangun kredibilitas perusahaan Anda.", 
      icon: "Building2", 
      features: ["Desain Premium", "SEO Optimized", "Mobile Friendly"],
      startingPrice: "Mulai dari Rp 3.500.000",
      duration: "1-2 minggu",
      isActive: true,
      sortOrder: 1
    },
    { 
      id: 2, 
      title: "Landing Page", 
      desc: "Halaman tunggal yang dikonversi tinggi untuk kampanye marketing.", 
      icon: "MousePointerClick", 
      features: ["High Conversion", "A/B Testing Ready", "Fast Loading"],
      startingPrice: "Mulai dari Rp 1.500.000",
      duration: "3-7 hari",
      isActive: true,
      sortOrder: 2
    },
    { 
      id: 3, 
      title: "Web Application", 
      desc: "Aplikasi berbasis web dengan fungsionalitas kompleks dan skalabel.", 
      icon: "Globe", 
      features: ["Real-time Data", "Secure Authentication", "Scalable Architecture"],
      startingPrice: "Mulai dari Rp 8.000.000",
      duration: "1-3 bulan",
      isActive: true,
      sortOrder: 3
    }
  ] as {
    id: number;
    title: string;
    desc: string;
    icon: string;
    features: string[];
    startingPrice: string;
    duration: string;
    isActive: boolean;
    sortOrder: number;
  }[],
  portfolio: [
    {
      id: 1,
      title: "Sistem Manajemen Inventaris",
      category: "Sistem Informasi",
      description: "Aplikasi web untuk mengelola stok barang, pemasukan, dan pengeluaran secara real-time dengan laporan otomatis.",
      image: "/portfolio/inventory.png",
      images: [
        "/portfolio/inventory-1.png",
        "/portfolio/inventory-2.png",
        "/portfolio/inventory-3.png"
      ],
      technologies: ["Next.js", "TypeScript", "PostgreSQL", "Tailwind"],
      demoUrl: "https://demo.kastriva.com/inventory",
      githubUrl: "https://github.com/kastriva/inventory",
      year: "2025",
      status: "Completed",
      featured: true,
      problemSolved: "Menggantikan pencatatan manual yang rawan error dengan sistem terdigitalisasi.",
      solution: "Membangun sistem berbasis web dengan fitur manajemen stok, laporan harian, dan notifikasi low stock.",
      features: ["Manajemen Stok", "Laporan Otomatis", "Notifikasi Low Stock", "Multi-User"],
      myRole: "Fullstack Developer & UI/UX Designer",
      published: true,
      createdAt: "2025-01-15",
      updatedAt: "2025-03-10"
    },
    {
      id: 2,
      title: "Landing Page Produk Skincare",
      category: "Landing Page",
      description: "Landing page dengan animasi smooth dan integrasi WhatsApp untuk meningkatkan konversi penjualan.",
      image: "/portfolio/skincare.png",
      images: [
        "/portfolio/skincare-1.png",
        "/portfolio/skincare-2.png"
      ],
      technologies: ["React", "Framer Motion", "Vercel"],
      demoUrl: "https://demo.kastriva.com/skincare",
      year: "2026",
      status: "Completed",
      featured: false,
      problemSolved: "Meningkatkan tingkat konversi pengunjung menjadi pembeli sebesar 40%.",
      solution: "Membangun landing page dengan CTA yang strategis dan integrasi WhatsApp untuk konversi tinggi.",
      features: ["Animasi Smooth", "WhatsApp Integration", "Mobile Optimized", "A/B Testing Ready"],
      myRole: "Frontend Developer",
      published: true,
      createdAt: "2026-01-05",
      updatedAt: "2026-01-20"
    }
  ] as PortfolioProject[],
  pricing: [
    { 
      name: "Landing Page", 
      price: "Mulai dari Rp 1.500.000", 
      features: ["1 Halaman", "Desain Custom", "SEO Dasar", "Revisi 2x", "Gratis Domain 1 Tahun"] 
    },
    { 
      name: "Company Profile", 
      price: "Mulai dari Rp 3.500.000", 
      features: ["5-7 Halaman", "CMS Sederhana", "SEO Optimized", "Integrasi WhatsApp", "Gratis Hosting 1 Tahun"] 
    },
    { 
      name: "Web Application", 
      price: "Mulai dari Rp 8.000.000", 
      features: ["Fitur Custom", "Database & API", "Dashboard Admin", "Security Audit", "Support 3 Bulan"] 
    },
    { 
      name: "Custom System", 
      price: "Konsultasi", 
      features: ["Analisis Kebutuhan", "Arsitektur Skalabel", "Dedicated Support", "Source Code Full", "SLA Guarantee"] 
    }
  ],
  process: [
    { step: "01", title: "Konsultasi", desc: "Diskusi kebutuhan, tujuan bisnis, dan fitur yang diinginkan." },
    { step: "02", title: "Analisis Kebutuhan", desc: "Penyusunan scope of work, timeline, dan penawaran harga." },
    { step: "03", title: "UI/UX Design", desc: "Pembuatan wireframe dan mockup desain untuk disetujui." },
    { step: "04", title: "Development", desc: "Proses coding dan integrasi sistem sesuai desain yang disetujui." },
    { step: "05", title: "Testing & Deployment", desc: "Quality assurance, revisi final, dan peluncuran website." }
  ]
};

export const getWhatsAppLink = (message: string) => \`https://wa.me/\${config.brand.whatsapp}?text=\${encodeURIComponent(message)}\`;
`);

// 4. Update components/Portfolio.tsx with proper typing
writeFile('components/Portfolio.tsx', `"use client";
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
                className={\`px-4 py-2 rounded-full text-sm font-medium transition-all \${filter === cat ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20" : "bg-white dark:bg-dark-bg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"}\`}
              >
                {cat} {categoryCounts[cat] > 0 && \`(\${categoryCounts[cat]})\`}
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
                      href={getWhatsAppLink(\`Halo Kastriva, saya tertarik membuat website seperti project "\${selectedProject.title}". Bisa konsultasi?\`)}
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
`);

// 5. Update components/OrderForm.tsx with proper typing
writeFile('components/OrderForm.tsx', `"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, CheckCircle } from "lucide-react";
import { config, getWhatsAppLink } from "@/data/config";
import { OrderStatus } from "@/lib/types/order";

export default function OrderForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "", 
    business: "", 
    email: "", 
    whatsapp: "", 
    type: "Website", 
    budget: "", 
    deadline: "", 
    description: "", 
    features: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulasi proses pengiriman (Ganti dengan API call ke backend Anda nanti)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Format pesan WhatsApp
    const message = \`Halo Kastriva, saya ingin memesan jasa pembuatan *\${formData.type}*.
    
*Detail Project:*
- Nama: \${formData.name}
- Bisnis: \${formData.business}
- Email: \${formData.email}
- WhatsApp: \${formData.whatsapp}
- Budget: \${formData.budget}
- Deadline: \${formData.deadline}
- Deskripsi: \${formData.description}
- Fitur Dibutuhkan: \${formData.features}\`;
    
    // Redirect ke WhatsApp (atau simpan ke database jika sudah ada backend)
    window.open(getWhatsAppLink(message), "_blank");
    
    setLoading(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 5000);
    setFormData({ 
      name: "", 
      business: "", 
      email: "", 
      whatsapp: "", 
      type: "Website", 
      budget: "", 
      deadline: "", 
      description: "", 
      features: "" 
    });
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-white dark:bg-dark-bg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm";

  return (
    <section id="order" className="py-20 bg-slate-50 dark:bg-dark-surface/50">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Mulai Project Anda</h2>
          <p className="text-slate-600 dark:text-slate-400">Isi form di bawah ini untuk mendiskusikan kebutuhan digital Anda.</p>
        </div>

        <motion.form 
          initial={{ opacity: 0, y: 20 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }} 
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
              <input 
                required 
                type="text" 
                className={inputClass} 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nama Bisnis/Organisasi</label>
              <input 
                type="text" 
                className={inputClass} 
                value={formData.business} 
                onChange={e => setFormData({...formData, business: e.target.value})} 
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-2">Email *</label>
              <input 
                required 
                type="email" 
                className={inputClass} 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nomor WhatsApp *</label>
              <input 
                required 
                type="tel" 
                className={inputClass} 
                value={formData.whatsapp} 
                onChange={e => setFormData({...formData, whatsapp: e.target.value})} 
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium mb-2">Jenis Project *</label>
              <select 
                required 
                className={inputClass} 
                value={formData.type} 
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                {["Website", "Landing Page", "Company Profile", "Web App", "Dashboard", "Sistem Informasi", "Android App", "Custom"].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Estimasi Budget</label>
              <select 
                className={inputClass} 
                value={formData.budget} 
                onChange={e => setFormData({...formData, budget: e.target.value})}
              >
                <option value="">Pilih Range</option>
                <option value="< 5 Juta">{'<'} 5 Juta</option>
                <option value="5 - 15 Juta">5 - 15 Juta</option>
                <option value="15 - 50 Juta">15 - 50 Juta</option>
                <option value="> 50 Juta">{'>'} 50 Juta</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Target Deadline</label>
              <input 
                type="text" 
                placeholder="Contoh: 1 bulan" 
                className={inputClass} 
                value={formData.deadline} 
                onChange={e => setFormData({...formData, deadline: e.target.value})} 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Deskripsi Kebutuhan & Referensi</label>
            <textarea 
              required 
              rows={4} 
              className={inputClass} 
              placeholder="Jelaskan secara singkat apa yang Anda butuhkan. Sertakan link referensi website jika ada." 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Fitur Utama yang Dibutuhkan</label>
            <input 
              type="text" 
              className={inputClass} 
              placeholder="Contoh: Login, Payment Gateway, Dashboard Admin" 
              value={formData.features} 
              onChange={e => setFormData({...formData, features: e.target.value})} 
            />
          </div>

          <button 
            disabled={loading} 
            type="submit" 
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            {loading ? "Mengirim..." : "Kirim Permintaan Project"}
          </button>
          
          <p className="text-xs text-center text-slate-500 mt-4">
            *Data Anda aman. Kami akan membalas dalam waktu 1x24 jam pada hari kerja.
          </p>
        </motion.form>
      </div>
    </section>
  );
}
`);

// 6. Create lib/types/index.ts
writeFile('lib/types/index.ts', `export * from './portfolio';
export * from './order';`);

console.log(`\n🎉 Phase 1: TypeScript Foundation berhasil diimplementasikan!`);
console.log(`\n📌 LANGKAH SELANJUTNYA:`);
console.log(`1. Jalankan: node phase1-setup.js`);
console.log(`2. Commit perubahan: git add . && git commit -m "Phase 1: TypeScript Foundation"`);
console.log(`3. Push ke GitHub: git push`);
console.log(`\n💡 TIP: File yang diubah:\n- lib/types/\n- data/config.ts\n- components/Portfolio.tsx\n- components/OrderForm.tsx`);