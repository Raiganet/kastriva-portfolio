const fs = require('fs');
const path = require('path');

function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Created: ' + filePath);
}

console.log('\n🚀 Memulai Phase 11: Final Polish...\n');

// ====== 1. Content data (FAQ + Testimonials) ======
writeFile('data/content.ts', `/**
 * Konten tambahan website (FAQ & Testimonials)
 * Nantinya dapat diambil dari Google Sheets via CMS (Phase opsional)
 */

export interface Testimonial {
  name: string;
  business: string;
  message: string;
  rating: number;
}

export interface FAQItem {
  q: string;
  a: string;
}

/**
 * JANGAN mengisi testimonial palsu.
 * Biarkan kosong sampai ada testimonial asli dari customer.
 */
export const testimonials: Testimonial[] = [];

export const faq: FAQItem[] = [
  {
    q: "Berapa lama pengerjaan website?",
    a: "Tergantung kompleksitas. Landing page biasanya 3-7 hari, company profile 1-2 minggu, dan web application custom 1-3 bulan.",
  },
  {
    q: "Apakah bisa request desain?",
    a: "Tentu. Anda bisa memberikan referensi desain, atau kami akan membuatkan desain UI/UX custom yang sesuai dengan brand Anda.",
  },
  {
    q: "Apakah website responsive?",
    a: "Ya, semua website yang kami buat dijamin responsive dan optimal di desktop, tablet, maupun mobile.",
  },
  {
    q: "Apakah bisa menggunakan domain sendiri?",
    a: "Bisa. Kami akan membantu proses konfigurasi domain dan hosting Anda sampai website online.",
  },
  {
    q: "Apakah bisa dibuatkan admin dashboard?",
    a: "Bisa. Website company profile, toko online, maupun sistem informasi dapat dilengkapi dashboard admin untuk mengelola konten.",
  },
  {
    q: "Apakah website bisa dikembangkan lagi?",
    a: "Sangat bisa. Kode ditulis dengan struktur rapi dan modular sehingga mudah ditambah fitur di kemudian hari.",
  },
  {
    q: "Apakah tersedia maintenance?",
    a: "Ya, kami menyediakan paket maintenance untuk update keamanan, perbaikan bug, dan penambahan fitur setelah project selesai.",
  },
  {
    q: "Bagaimana cara melakukan pemesanan?",
    a: "Isi form di halaman Mulai Project, atau klik tombol WhatsApp. Anda akan mendapat nomor order untuk konsultasi dan tracking.",
  },
  {
    q: "Apakah bisa konsultasi terlebih dahulu?",
    a: "Tentu, konsultasi awal gratis tanpa komitmen. Kami akan membantu menentukan solusi yang paling sesuai dengan kebutuhan dan budget Anda.",
  },
];
`);

// ====== 2. FAQ Section ======
writeFile('components/sections/FAQSection.tsx', `"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { faq } from "@/data/content";

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);

  if (faq.length === 0) return null;

  return (
    <section className="py-20 bg-slate-50 dark:bg-dark-surface/50">
      <div className="container mx-auto px-4 md:px-6 max-w-3xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 mb-4">
            <HelpCircle size={16} />
            FAQ
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pertanyaan yang Sering Diajukan
          </h2>
        </div>

        <div className="space-y-3">
          {faq.map((item, i) => (
            <div
              key={i}
              className="bg-white dark:bg-dark-bg rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors"
                aria-expanded={open === i}
              >
                <span className="font-semibold pr-4">{item.q}</span>
                <motion.span
                  animate={{ rotate: open === i ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0 text-primary-500"
                >
                  <ChevronDown size={20} />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p className="px-5 pb-5 text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
`);

// ====== 3. Testimonial Section (jujur, placeholder jika kosong) ======
writeFile('components/sections/TestimonialSection.tsx', `import { Star, Quote } from "lucide-react";
import { testimonials } from "@/data/content";

export default function TestimonialSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 md:px-6 max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Apa Kata Customer?
          </h2>
        </div>

        {testimonials.length === 0 ? (
          <div className="p-10 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
            <Quote size={32} className="text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Testimonial customer akan ditampilkan di sini.
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
              Kami hanya menampilkan testimoni asli dari customer yang telah menyelesaikan project.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="bg-white dark:bg-dark-bg p-6 rounded-2xl border border-slate-200 dark:border-slate-800"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      size={16}
                      className={j < t.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-300"}
                    />
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                  "{t.message}"
                </p>
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-sm text-slate-500">{t.business}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
`);

// ====== 4. Update Homepage (tambah FAQ + Testimonial) ======
writeFile('app/(public)/page.tsx', `import { Metadata } from "next";
import Hero from "@/components/Hero";
import { config } from "@/data/config";
import ServicesSection from "@/components/sections/ServicesSection";
import WhyChooseSection from "@/components/sections/WhyChooseSection";
import PricingSection from "@/components/sections/PricingSection";
import FinalCTA from "@/components/sections/FinalCTA";
import StatsSection from "@/components/sections/StatsSection";
import FeaturedProject from "@/components/sections/FeaturedProject";
import TestimonialSection from "@/components/sections/TestimonialSection";
import FAQSection from "@/components/sections/FAQSection";

export const metadata: Metadata = {
  title: \`\${config.brand.name} | Jasa Pembuatan Website & Aplikasi Profesional\`,
  description: config.hero.subheadline,
  keywords: [
    "jasa pembuatan website",
    "jasa website profesional",
    "jasa pembuatan web app",
    "jasa pembuatan aplikasi",
    "web developer Indonesia",
    "jasa pembuatan sistem informasi",
    "jasa website UMKM",
  ],
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
      <TestimonialSection />
      <FAQSection />
      <FinalCTA />
    </>
  );
}
`);

// ====== 5. Sitemap ======
writeFile('app/sitemap.ts', `import { MetadataRoute } from "next";
import { config } from "@/data/config";

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://kastriva-portfolio.vercel.app";

  const staticRoutes: Array<{ path: string; priority: number }> = [
    { path: "", priority: 1.0 },
    { path: "/services", priority: 0.9 },
    { path: "/portfolio", priority: 0.9 },
    { path: "/order", priority: 0.8 },
    { path: "/order/track", priority: 0.7 },
    { path: "/process", priority: 0.7 },
    { path: "/about", priority: 0.6 },
    { path: "/contact", priority: 0.6 },
  ];

  const portfolioRoutes = config.portfolio
    .filter((p) => p.published)
    .map((p) => ({
      url: baseUrl + "/portfolio/" + generateSlug(p.title),
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

  return [
    ...staticRoutes.map((r) => ({
      url: baseUrl + r.path,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: r.priority,
    })),
    ...portfolioRoutes,
  ];
}
`);

// ====== 6. Robots ======
writeFile('app/robots.ts', `import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://kastriva-portfolio.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/customer"],
      },
    ],
    sitemap: baseUrl + "/sitemap.xml",
  };
}
`);

// ====== 7. 404 Page ======
writeFile('app/not-found.tsx', `import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-dark-bg px-4">
      <div className="text-center">
        <div className="inline-flex w-20 h-20 rounded-3xl bg-primary-50 dark:bg-primary-900/30 items-center justify-center mb-6">
          <Compass size={40} className="text-primary-600" />
        </div>
        <div className="text-6xl font-bold text-gradient mb-3">404</div>
        <h1 className="text-2xl font-bold mb-2">Halaman tidak ditemukan</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
          Halaman yang Anda cari mungkin telah dipindahkan atau tidak tersedia.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-semibold transition-all"
          >
            Kembali ke Beranda
          </Link>
          <Link
            href="/portfolio"
            className="border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 px-6 py-3 rounded-xl font-semibold transition-all"
          >
            Lihat Portfolio
          </Link>
        </div>
      </div>
    </div>
  );
}
`);

// ====== 8. Error Page ======
writeFile('app/error.tsx', `"use client";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-dark-bg px-4">
      <div className="text-center">
        <div className="inline-flex w-20 h-20 rounded-3xl bg-red-50 dark:bg-red-900/20 items-center justify-center mb-6">
          <AlertTriangle size={40} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Terjadi kesalahan</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
          Something went wrong. Silakan coba lagi.
        </p>
        <button
          onClick={reset}
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-semibold transition-all"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  );
}
`);

// ====== 9. Security headers (next.config.js) ======
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
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};
module.exports = nextConfig;
`);

// ====== 10. PWA manifest + icon ======
writeFile('public/manifest.webmanifest', `{
  "name": "Kastriva - Jasa Pembuatan Website & Aplikasi",
  "short_name": "Kastriva",
  "description": "Solusi digital modern untuk bisnis Anda. Jasa pembuatan website, web app, dan aplikasi Android profesional.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0A0A0F",
  "theme_color": "#6C5CE7",
  "icons": [
    {
      "src": "/icon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any"
    }
  ]
}
`);

writeFile('public/icon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#6C5CE7"/><text x="50" y="70" font-family="Arial, Helvetica, sans-serif" font-size="56" font-weight="bold" fill="#ffffff" text-anchor="middle">K</text></svg>
`);

// ====== 11. Layout final (JSON-LD + GA4 optional + manifest) ======
writeFile('app/layout.tsx', `import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { config } from "@/data/config";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://kastriva-portfolio.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: \`\${config.brand.name} | Jasa Pembuatan Website & Aplikasi Profesional\`,
    template: \`%s | \${config.brand.name}\`,
  },
  description: config.hero.subheadline,
  keywords: [
    "jasa pembuatan website",
    "jasa website profesional",
    "jasa pembuatan web app",
    "jasa pembuatan aplikasi",
    "web developer Indonesia",
    "jasa pembuatan sistem informasi",
    "jasa website UMKM",
  ],
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
  openGraph: {
    title: config.brand.name,
    description: config.hero.subheadline,
    type: "website",
    locale: "id_ID",
    url: siteUrl,
    siteName: config.brand.name,
  },
  twitter: {
    card: "summary_large_image",
    title: config.brand.name,
    description: config.hero.subheadline,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: config.brand.name,
  description: config.hero.subheadline,
  url: siteUrl,
  email: config.brand.email,
  telephone: "+" + config.brand.whatsapp,
  areaServed: "Indonesia",
  priceRange: "Rp 1.500.000 - Rp 50.000.000",
  makesOffer: config.services.map((s) => ({
    "@type": "Offer",
    itemOffered: { "@type": "Service", name: s.title, description: s.desc },
  })),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="id" suppressHydrationWarning>
      <body className={\`\${plusJakarta.variable} font-sans antialiased\`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {gaId && (
          <>
            <Script
              src={"https://www.googletagmanager.com/gtag/js?id=" + gaId}
              strategy="afterInteractive"
            />
            <Script
              id="ga4-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html:
                  "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','" + gaId + "');",
              }}
            />
          </>
        )}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
`);

// ====== 12. Update .env.example ======
writeFile('.env.example', `# URL Web App Google Apps Script
NEXT_PUBLIC_GAS_API_URL=

# URL publik website (untuk sitemap/SEO)
NEXT_PUBLIC_SITE_URL=https://kastriva-portfolio.vercel.app

# Google Analytics 4 Measurement ID (opsional, contoh: G-XXXXXXX)
NEXT_PUBLIC_GA_MEASUREMENT_ID=
`);

// ====== 13. README FINAL ======
writeFile('README.md', `#  Kastriva — Professional Digital Service Platform

Website portfolio + sistem bisnis lengkap untuk jasa pembuatan website, web app,
sistem informasi, dan aplikasi Android.

## ✨ Fitur

### Public Website
- Landing page premium (dark/light mode, animasi halus)
- Portfolio engine: filter, search, detail page, lightbox gallery
- Order system: validasi Zod, honeypot anti-spam, nomor order unik (KAS-YYYY-NNNN)
- Order tracking publik dengan timeline visual
- FAQ + Testimonial (data-driven, placeholder jujur)
- SEO: sitemap.xml, robots.txt, JSON-LD schema.org, OpenGraph

### Backend (Google Apps Script + Google Sheets)
- 18 sheet database (setup otomatis via setupDatabase())
- API router dengan 3 tier auth: public / admin / customer
- Email otomatis: notifikasi admin, konfirmasi customer, update project, quotation
- Order → Customer auto-create → Project → Updates → Quotation

### Admin Dashboard (/admin)
- Login aman (token session server-side, expire 24 jam)
- Statistik dashboard real-time dari Sheets
- Order management (search, filter, ubah status)
- Project management (convert order, kirim update progress)
- Quotation builder (items, diskon, pajak, total server-side)
- Customer management

### Customer Dashboard (/customer)
- Login dengan Email + Nomor Order
- Pantau orders, projects + timeline progress
- Approve/reject quotation

## 🛠️ Tech Stack
Next.js 14 (App Router) • TypeScript • Tailwind CSS • Framer Motion •
Lucide React • next-themes • Zod • Google Apps Script • Google Sheets

## 📦 Instalasi

\`\`\`bash
npm install
npm run dev
\`\`\`

## ⚙️ Environment Variables

\`\`\`
NEXT_PUBLIC_GAS_API_URL=https://script.google.com/macros/s/XXXX/exec
NEXT_PUBLIC_SITE_URL=https://domain-anda.com
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXX   # opsional
\`\`\`

Set di \`.env.local\` DAN Vercel (Settings → Environment Variables).

## 🔌 Setup Google Apps Script

1. Buat project di [script.google.com](https://script.google.com)
2. Copy semua file \`.gs\` dari folder \`google-apps-script/\`
3. Jalankan \`setupDatabase()\` → copy SPREADSHEET_ID ke \`Config.gs\`
4. Ganti \`ADMIN_PASSWORD\` di \`Config.gs\`
5. Deploy → Web app → Execute as: Me → Who has access: **Anyone**
6. Copy URL \`/exec\` ke env variable

## 🔐 Kredensial

- **Admin**: \`ADMIN_EMAIL\` / \`ADMIN_PASSWORD\` di Config.gs → login di \`/admin\`
- **Customer**: email + nomor order → login di \`/customer\`

## 🗂️ Struktur Data Layer

\`\`\`
UI → Service → Repository → API Client → Google Apps Script → Sheets
\`\`\`

Repository memiliki fallback ke \`data/config.ts\` jika GAS belum dikonfigurasi,
sehingga website tidak pernah blank.

## 📄 Route Map

| Route | Fungsi |
|---|---|
| \`/\` | Homepage |
| \`/portfolio\`, \`/portfolio/[slug]\` | Portfolio + detail |
| \`/order\` | Form order |
| \`/order/track\` | Lacak order |
| \`/order/success\` | Konfirmasi order |
| \`/services\`, \`/process\`, \`/about\`, \`/contact\` | Halaman statis |
| \`/admin\` | Admin dashboard (protected) |
| \`/customer\` | Customer dashboard (protected) |

## 🚀 Deployment (Vercel)

1. Push ke GitHub
2. Import project di Vercel
3. Set environment variables
4. Deploy

## 📝 Mengelola Konten

- **Portfolio/Services/Pricing/FAQ**: edit \`data/config.ts\` & \`data/content.ts\`
  (atau langsung di Google Sheets untuk portfolio setelah GAS aktif)
- **Brand/WhatsApp/Social**: \`data/config.ts\` + sheet Settings

---

© 2026 Kastriva. All rights reserved.
`);

console.log('\n🎉 Phase 11: FINAL POLISH selesai!');
console.log('');
console.log('📁 YANG DITAMBAHKAN:');
console.log('  - data/content.ts (FAQ 9 pertanyaan + testimonials placeholder)');
console.log('  - FAQSection + TestimonialSection (homepage)');
console.log('  - app/sitemap.ts + app/robots.ts (SEO)');
console.log('  - app/not-found.tsx + app/error.tsx (branded)');
console.log('  - next.config.js (security headers)');
console.log('  - public/manifest.webmanifest + icon.svg (PWA-ready)');
console.log('  - app/layout.tsx (JSON-LD schema.org + GA4 opsional)');
console.log('  - README.md final lengkap');
console.log('');
console.log('📌 LANGKAH AKHIR:');
console.log('1. (Opsional) Set NEXT_PUBLIC_SITE_URL di Vercel = domain/URL final Anda');
console.log('2. npm run dev → cek homepage (FAQ + Testimonial placeholder muncul)');
console.log('3. Cek /sitemap.xml dan /robots.txt');
console.log('4. Commit & push → Vercel rebuild');
console.log('');
console.log('🏁 SELAMAT! Platform lengkap sudah LIVE.');