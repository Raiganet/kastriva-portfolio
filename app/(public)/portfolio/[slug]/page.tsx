import { notFound } from "next/navigation";
import { Metadata } from "next";
import { config } from "@/data/config";
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
  const project = await getServerPortfolioBySlug(params.slug);

  if (!project) {
    return { title: "Project Not Found" };
  }

  return {
    title: `${project.title} - Portfolio`,
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
  const project = await getServerPortfolioBySlug(params.slug);

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
    creator: { "@type": "Organization", name: config.brand.name },
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
