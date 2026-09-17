import { MetadataRoute } from "next";
import { getServerPortfolio } from "@/lib/server/portfolio.server";

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://kastriva-portfolio.vercel.app";

  const now = new Date();
  const staticRoutes: Array<{ path: string; priority: number; changeFrequency: "weekly" | "monthly" }> = [
    { path: "", priority: 1.0, changeFrequency: "weekly" },
    { path: "/services", priority: 0.9, changeFrequency: "monthly" },
    { path: "/portfolio", priority: 0.9, changeFrequency: "weekly" },
    { path: "/order", priority: 0.8, changeFrequency: "monthly" },
    { path: "/process", priority: 0.7, changeFrequency: "monthly" },
    { path: "/about", priority: 0.6, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
  ];

  let projects = [] as Awaited<ReturnType<typeof getServerPortfolio>>;
  try {
    projects = await getServerPortfolio();
  } catch {
    // Keep sitemap available even when the Firebase CMS is temporarily unavailable.
  }

  const portfolioRoutes = projects
    .filter((p) => p.published)
    .map((p) => ({
      url: `${baseUrl}/portfolio/${generateSlug(p.title)}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

  return [
    ...staticRoutes.map((r) => ({
      url: `${baseUrl}${r.path}`,
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    })),
    ...portfolioRoutes,
  ];
}
