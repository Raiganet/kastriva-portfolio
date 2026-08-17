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
    title: `${project.title} | ${config.brand.name} Portfolio`,
    description: project.description,
    openGraph: {
      title: project.title,
      description: project.description,
      images: [project.image],
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

  return <PortfolioDetailView project={project} />;
}
