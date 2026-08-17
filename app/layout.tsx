import type { Metadata } from "next";
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
    default: `${config.brand.name} | Jasa Pembuatan Website & Aplikasi Profesional`,
    template: `%s | ${config.brand.name}`,
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
      <body className={`${plusJakarta.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
