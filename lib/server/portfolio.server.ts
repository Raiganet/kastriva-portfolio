import { cache } from 'react';
import { callGas } from './gas-bridge';
import { config } from '@/data/config';
import { normalizePortfolio } from '@/lib/repositories/normalizer';
import { PortfolioProject } from '@/lib/types/portfolio';
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const getServerPortfolio = cache(async (): Promise<PortfolioProject[]> => {
  const response = await callGas<any[]>('getPortfolio');
  const remote = response.success && Array.isArray(response.data) ? response.data.map(normalizePortfolio) : [];
  // Preserve existing hybrid portfolio behavior; CMS authority changes belong to stage 3.
  return [...remote, ...config.portfolio.filter(p => !remote.some(r => String(r.id) === String(p.id) || slug(r.title) === slug(p.title) || (r.demoUrl && r.demoUrl.replace(/\/$/, '') === p.demoUrl.replace(/\/$/, ''))))].filter(p => p.published);
});
export const getServerPortfolioBySlug = cache(async (value: string): Promise<PortfolioProject | null> => {
  const response = await callGas('getPortfolioBySlug', {}, { slug: value });
  if (response.success && response.data) { const p = normalizePortfolio(response.data); return p.published ? p : null; }
  return (await getServerPortfolio()).find(p => slug(p.title) === value) || null;
});
