import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { config } from "@/data/config";
import AnalyticsProvider from "@/components/analytics/AnalyticsProvider";
import PWAProvider from "@/components/pwa/PWAProvider";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://kastriva-portfolio.vercel.app";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0F" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${config.brand.name} | Jasa Pembuatan Website & Aplikasi Profesional`,
    template: `%s | ${config.brand.name}`,
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
  applicationName: config.brand.name,
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: config.brand.name },
  creator: config.brand.name,
  publisher: config.brand.name,
  category: "technology",
  formatDetection: { email: false, address: false, telephone: false },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
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
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

const socialLinks = Object.values(config.brand.socials).filter((url) => url && url !== "#");
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: config.brand.name,
      url: siteUrl,
      logo: `${siteUrl}/android-chrome-512x512.png`,
      email: config.brand.email,
      telephone: "+" + config.brand.whatsapp,
      ...(socialLinks.length ? { sameAs: socialLinks } : {}),
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: config.brand.name,
      inLanguage: "id-ID",
      publisher: { "@id": `${siteUrl}/#organization` },
    },
    {
      "@type": "ProfessionalService",
      "@id": `${siteUrl}/#service`,
      name: config.brand.name,
      description: config.hero.subheadline,
      url: siteUrl,
      areaServed: "Indonesia",
      priceRange: "Rp 1.500.000 - Rp 50.000.000",
      provider: { "@id": `${siteUrl}/#organization` },
      makesOffer: config.services.map((service) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: service.title,
          description: service.desc,
        },
      })),
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${plusJakarta.variable} font-sans antialiased`}>
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
                  "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','" + gaId + "',{send_page_view:false,anonymize_ip:true});",
              }}
            />
          </>
        )}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AnalyticsProvider />
          <PWAProvider />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
