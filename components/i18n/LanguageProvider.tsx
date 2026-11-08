"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Language = "id" | "en";
const LanguageContext = createContext<{ language: Language; setLanguage: (value: Language) => void }>({ language: "id", setLanguage: () => {} });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("id");
  useEffect(() => {
    const saved = localStorage.getItem("kastriva-language");
    if (saved === "id" || saved === "en") setLanguage(saved);
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  const changeLanguage = (value: Language) => {
    localStorage.setItem("kastriva-language", value);
    setLanguage(value);
    document.documentElement.lang = value;
  };
  return <LanguageContext.Provider value={{ language, setLanguage: changeLanguage }}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
