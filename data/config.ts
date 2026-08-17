import { PortfolioProject, PortfolioCategory, DashboardStats } from "@/lib/types/portfolio";
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

export const getWhatsAppLink = (message: string) => `https://wa.me/${config.brand.whatsapp}?text=${encodeURIComponent(message)}`;
