import { MetadataRoute } from "next";
import { getServerPortfolio } from "@/lib/server/portfolio.server";

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  const portfolioRoutes = (await getServerPortfolio())
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
