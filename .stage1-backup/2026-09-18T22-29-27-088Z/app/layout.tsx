import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import AnalyticsProvider from "@/components/analytics/AnalyticsProvider";
import PWAProvider from "@/components/pwa/PWAProvider";
import { SiteContentProvider } from "@/components/cms/SiteContentProvider";
import { getSiteContent } from "@/lib/server/site-content.server";
import { serializeJsonLd } from "@/lib/seo-jsonld";

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

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteContent();
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: site.seo.siteTitle,
      template: site.seo.titleTemplate,
    },
    description: site.seo.description,
    keywords: site.seo.keywords,
    manifest: "/manifest.webmanifest",
    applicationName: site.brand.name,
    appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: site.brand.name },
    creator: site.brand.name,
    publisher: site.brand.name,
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
      title: site.seo.siteTitle,
      description: site.seo.description,
      type: "website",
      locale: "id_ID",
      url: siteUrl,
      siteName: site.brand.name,
    },
    twitter: {
      card: "summary_large_image",
      title: site.seo.siteTitle,
      description: site.seo.description,
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
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const site = await getSiteContent();
  const socialLinks = Object.values(site.brand.socials).filter((url) => url && url !== "#");
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: site.brand.name,
        url: siteUrl,
        logo: `${siteUrl}/android-chrome-512x512.png`,
        email: site.brand.email,
        ...(site.brand.whatsapp ? { telephone: `+${site.brand.whatsapp.replace(/^\+/, "")}` } : {}),
        ...(site.brand.address ? { address: site.brand.address } : {}),
        ...(socialLinks.length ? { sameAs: socialLinks } : {}),
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: site.brand.name,
        inLanguage: "id-ID",
        publisher: { "@id": `${siteUrl}/#organization` },
      },
      {
        "@type": "ProfessionalService",
        "@id": `${siteUrl}/#service`,
        name: site.brand.name,
        description: site.seo.description,
        url: siteUrl,
        areaServed: site.seo.areaServed,
        priceRange: site.seo.priceRange,
        provider: { "@id": `${siteUrl}/#organization` },
        makesOffer: site.services.items.filter((service) => service.active).map((service) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: service.title,
            description: service.description,
          },
        })),
      },
    ],
  };

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
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
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
          <SiteContentProvider value={site}>
            <AnalyticsProvider />
            <PWAProvider />
            {children}
          </SiteContentProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
