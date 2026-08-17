export const config = {
  brand: { name: "Kastriva", tagline: "Solusi Digital Modern untuk Bisnis Anda", whatsapp: "6281234567890", email: "hello@kastriva.com", socials: { instagram: "#", tiktok: "#", github: "#", website: "#" } },
  hero: { headline: "Bangun Website & Aplikasi Profesional untuk Mengembangkan Bisnis Anda", subheadline: "Saya membantu bisnis, UMKM, organisasi, dan personal membangun website serta aplikasi custom yang modern, cepat, responsif, dan sesuai kebutuhan.", ctaPrimary: "Mulai Project", ctaSecondary: "Lihat Portfolio", badges: ["Responsive", "Modern Design", "Custom Development", "SEO Friendly", "Fast Performance"] },
  stats: [ { label: "Project Selesai", value: "15+" }, { label: "Website & Web App", value: "20+" }, { label: "Client Puas", value: "12+" }, { label: "Teknologi", value: "15+" } ],
  services: [
    { id: 1, title: "Website Company Profile", desc: "Website profesional untuk membangun kredibilitas perusahaan Anda.", icon: "Building2", features: ["Desain Premium", "SEO Optimized", "Mobile Friendly"] },
    { id: 2, title: "Landing Page", desc: "Halaman tunggal yang dikonversi tinggi untuk kampanye marketing.", icon: "MousePointerClick", features: ["High Conversion", "A/B Testing Ready", "Fast Loading"] },
    { id: 3, title: "Web Application", desc: "Aplikasi berbasis web dengan fungsionalitas kompleks dan skalabel.", icon: "Globe", features: ["Real-time Data", "Secure Authentication", "Scalable Architecture"] },
    { id: 4, title: "Sistem Informasi", desc: "Digitalisasi proses bisnis untuk efisiensi operasional.", icon: "Database", features: ["Custom Workflow", "Role-based Access", "Reporting Dashboard"] },
    { id: 5, title: "Aplikasi Android", desc: "Aplikasi mobile native/hybrid untuk menjangkau pengguna smartphone.", icon: "Smartphone", features: ["Play Store Ready", "Offline Mode", "Push Notification"] },
    { id: 6, title: "Maintenance & Development", desc: "Dukungan teknis berkelanjutan dan penambahan fitur baru.", icon: "Wrench", features: ["Bug Fixing", "Security Updates", "Feature Addition"] }
  ],
  portfolio: [
    { id: 1, title: "Sistem Manajemen Inventaris", category: "Sistem Informasi", description: "Aplikasi web untuk mengelola stok barang, pemasukan, dan pengeluaran secara real-time.", image: "/portfolio/1.png", technologies: ["Next.js", "TypeScript", "PostgreSQL"], demoUrl: "#", year: "2025", status: "Completed", featured: true, problemSolved: "Menggantikan pencatatan manual yang rawan error.", myRole: "Fullstack Developer" },
    { id: 2, title: "Landing Page Produk Skincare", category: "Landing Page", description: "Landing page dengan animasi smooth dan integrasi WhatsApp.", image: "/portfolio/2.png", technologies: ["React", "Framer Motion"], demoUrl: "#", year: "2026", status: "Completed", featured: false, problemSolved: "Meningkatkan konversi penjualan.", myRole: "Frontend Developer" }
  ],
  pricing: [
    { name: "Landing Page", price: "Mulai dari Rp 1.500.000", features: ["1 Halaman", "Desain Custom", "SEO Dasar", "Revisi 2x"] },
    { name: "Company Profile", price: "Mulai dari Rp 3.500.000", features: ["5-7 Halaman", "CMS Sederhana", "SEO Optimized", "Integrasi WhatsApp"] },
    { name: "Web Application", price: "Mulai dari Rp 8.000.000", features: ["Fitur Custom", "Database & API", "Dashboard Admin", "Support 3 Bulan"] },
    { name: "Custom System", price: "Konsultasi", features: ["Analisis Kebutuhan", "Arsitektur Skalabel", "Dedicated Support", "Source Code Full"] }
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
