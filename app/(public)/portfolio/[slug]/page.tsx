import { notFound } from "next/navigation";
import { Metadata } from "next";
import { config } from "@/data/config";
import PortfolioDetailView from "@/components/portfolio/PortfolioDetailView";

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

interface PortfolioDetailProps {
  params: { slug: string };
}

// generateMetadata HANYA boleh ada di Server Component
export async function generateMetadata({
  params,
}: PortfolioDetailProps): Promise<Metadata> {
  const project = config.portfolio.find(
    (p) => generateSlug(p.title) === params.slug
  );

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

// Page Component (Server) yang me-render Client Component
export default function PortfolioDetailPage({ params }: PortfolioDetailProps) {
  const project = config.portfolio.find(
    (p) => generateSlug(p.title) === params.slug
  );

  if (!project) {
    notFound();
  }

  return <PortfolioDetailView project={project} />;
}
