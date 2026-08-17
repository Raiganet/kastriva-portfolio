"use client";
import { useState, useEffect, useCallback } from "react";
import { PortfolioService } from "@/lib/services/portfolio.service";
import { PortfolioProject, PortfolioCategory } from "@/lib/types/portfolio";

interface UsePortfolioReturn {
  projects: PortfolioProject[];
  categories: PortfolioCategory[];
  filteredProjects: PortfolioProject[];
  loading: boolean;
  error: string | null;
  activeCategory: string;
  searchQuery: string;
  setCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  refresh: () => Promise<void>;
}

export function usePortfolio(): UsePortfolioReturn {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [categories, setCategories] = useState<PortfolioCategory[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [allProjects, allCategories] = await Promise.all([
        PortfolioService.getAll(),
        PortfolioService.getCategories(),
      ]);
      setProjects(allProjects);
      setCategories(allCategories);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat portfolio");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Filter ketika category atau search berubah
  useEffect(() => {
    PortfolioService.filterAndSearch(activeCategory, searchQuery)
      .then(setFilteredProjects)
      .catch(err => setError(err.message));
  }, [activeCategory, searchQuery, projects]);

  const setCategory = useCallback((category: string) => {
    setActiveCategory(category);
  }, []);

  return {
    projects,
    categories,
    filteredProjects,
    loading,
    error,
    activeCategory,
    searchQuery,
    setCategory,
    setSearchQuery,
    refresh,
  };
}
