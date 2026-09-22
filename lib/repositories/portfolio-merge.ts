import { projects } from "@/data/projects";
import type { PortfolioProject } from "@/lib/types/portfolio";

export type PortfolioCmsSource = "cms" | "bundled";
export type PortfolioRecord = PortfolioProject & {
  slug?: string;
  shortDescription?: string;
  sortOrder?: number;
  cmsSource?: PortfolioCmsSource;
  deleted?: boolean;
};

export const portfolioSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const urlKey = (url: string) => String(url || "").replace(/\/$/, "");

export const portfolioMatches = (a: Partial<PortfolioRecord>, b: Partial<PortfolioRecord>) =>
  Boolean(a && b) && (
    (a.id !== undefined && b.id !== undefined && String(a.id) === String(b.id)) ||
    Boolean(a.title && b.title && portfolioSlug(String(a.title)) === portfolioSlug(String(b.title))) ||
    Boolean(a.demoUrl && b.demoUrl && urlKey(String(a.demoUrl)) === urlKey(String(b.demoUrl)))
  );

export function findBundledPortfolio(project: Partial<PortfolioRecord>): PortfolioProject | undefined {
  return projects.find((candidate) => portfolioMatches(candidate, project));
}

/**
 * Compatibility layer for records created before the real portfolio items were added.
 * For normal records, CMS fields win while bundled data only fills fields that are absent.
 */
export function applyPortfolioUpdates(project: PortfolioRecord): PortfolioRecord {
  if (portfolioSlug(project.title || "") === "sistem-manajemen-inventaris" ||
      urlKey(project.demoUrl || "") === "https://demo.kastriva.com/inventory") {
    const replacement = projects.find((p) => p.id === "kastriva-smart-kasir")!;
    return {
      ...replacement,
      id: project.id,
      featured: project.featured,
      published: project.published,
      sortOrder: project.sortOrder,
      deleted: project.deleted,
      cmsSource: project.cmsSource,
    };
  }

  const local = findBundledPortfolio(project);
  // IMPORTANT: CMS must be the source of truth. Do not force local thumbnails/content
  // over an edited CMS record. Local values are only fallback defaults.
  return local ? { ...local, ...project, id: project.id } : project;
}

/** Public merge used by the client/server repositories. */
export function mergePortfolio(remote: PortfolioProject[], local = projects): PortfolioProject[] {
  const updated = (remote as PortfolioRecord[]).map(applyPortfolioUpdates);
  const combined = [
    ...updated,
    ...local.filter((p) => !updated.some((r) => portfolioMatches(r, p))),
  ];

  return combined
    .filter((p: PortfolioRecord, index) => !p.deleted && p.published &&
      !combined.slice(0, index).some((previous) => portfolioMatches(previous, p)))
    .sort((a: PortfolioRecord, b: PortfolioRecord) => (Number(a.sortOrder) || 999) - (Number(b.sortOrder) || 999));
}

/**
 * Merge Firestore CMS records with bundled project defaults for the Admin CMS.
 * This makes every project visible/editable in CMS even before it has been persisted.
 * A remote record always overrides the bundled default. A `deleted` remote record acts
 * as a tombstone so a bundled project does not reappear after being deleted in CMS.
 */
export function mergePortfolioForCms(remote: PortfolioRecord[], includeUnpublished = true): PortfolioRecord[] {
  const prepared = remote.map((record) => applyPortfolioUpdates({ ...record, cmsSource: "cms" }));
  const consumed = new Set<number>();
  const merged: PortfolioRecord[] = [];

  projects.forEach((local, index) => {
    const remoteIndex = prepared.findIndex((record, i) => !consumed.has(i) && portfolioMatches(record, local));
    if (remoteIndex >= 0) {
      consumed.add(remoteIndex);
      const record = prepared[remoteIndex];
      if (record.deleted) return;
      merged.push({
        ...local,
        ...record,
        id: record.id || local.id,
        slug: record.slug || portfolioSlug(record.title || local.title),
        sortOrder: Number(record.sortOrder) || index + 1,
        cmsSource: "cms",
      });
      return;
    }

    merged.push({
      ...local,
      slug: portfolioSlug(local.title),
      shortDescription: "",
      sortOrder: index + 1,
      cmsSource: "bundled",
      deleted: false,
    });
  });

  prepared.forEach((record, index) => {
    if (consumed.has(index) || record.deleted) return;
    merged.push({
      ...record,
      slug: record.slug || portfolioSlug(record.title || ""),
      sortOrder: Number(record.sortOrder) || 999,
      cmsSource: "cms",
    });
  });

  return merged
    .filter((record) => includeUnpublished || record.published)
    .sort((a, b) => (Number(a.sortOrder) || 999) - (Number(b.sortOrder) || 999));
}
