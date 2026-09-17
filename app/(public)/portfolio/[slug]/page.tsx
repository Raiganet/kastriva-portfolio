import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getSiteContent } from "@/lib/server/site-content.server";
import PortfolioDetailView from "@/components/portfolio/PortfolioDetailView";
import { getServerPortfolioBySlug } from "@/lib/server/portfolio.server";

// Revalidasi tiap 60 detik agar data Sheets tidak stale
export const revalidate = 60;

interface PortfolioDetailProps {
  params: { slug: string };
}

export async function generateMetadata({
  params,
}: PortfolioDetailProps): Promise<Metadata> {
  const [project, site] = await Promise.all([getServerPortfolioBySlug(params.slug), getSiteContent()]);

  if (!project) {
    return { title: "Project Not Found" };
  }

  return {
    title: `${project.title} - ${site.brand.name}`,
    description: project.description,
    alternates: { canonical: `/portfolio/${params.slug}` },
    openGraph: {
      title: project.title,
      description: project.description,
      url: `/portfolio/${params.slug}`,
      type: "article",
      images: project.image ? [{ url: project.image, alt: project.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description: project.description,
      images: project.image ? [project.image] : undefined,
    },
  };
}

export default async function PortfolioDetailPage({
  params,
}: PortfolioDetailProps) {
  const [project, site] = await Promise.all([getServerPortfolioBySlug(params.slug), getSiteContent()]);

  if (!project) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kastriva-portfolio.vercel.app";
  const portfolioJsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.description,
    image: project.image,
    url: `${siteUrl}/portfolio/${params.slug}`,
    creator: { "@type": "Organization", name: site.brand.name },
    keywords: project.technologies.join(", "),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(portfolioJsonLd) }}
      />
      <PortfolioDetailView project={project} />
    </>
  );
}
