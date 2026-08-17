import { config } from "@/data/config";
import { Instagram, Github, Globe, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-50 dark:bg-dark-surface border-t border-slate-200 dark:border-slate-800 pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold text-gradient mb-4">{config.brand.name}</h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-sm mb-6">{config.brand.tagline}. Fokus pada kualitas kode, desain modern, dan kepuasan klien.</p>
            <div className="flex gap-4">
              <a href={config.brand.socials.instagram} className="p-2 rounded-full bg-white dark:bg-dark-bg border border-slate-200 dark:border-slate-700 hover:text-primary-600 transition-colors"><Instagram size={20} /></a>
              <a href={config.brand.socials.github} className="p-2 rounded-full bg-white dark:bg-dark-bg border border-slate-200 dark:border-slate-700 hover:text-primary-600 transition-colors"><Github size={20} /></a>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-4">Navigasi</h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><Link href="#home" className="hover:text-primary-600 transition-colors">Home</Link></li>
              <li><Link href="#services" className="hover:text-primary-600 transition-colors">Services</Link></li>
              <li><Link href="#portfolio" className="hover:text-primary-600 transition-colors">Portfolio</Link></li>
              <li><Link href="#contact" className="hover:text-primary-600 transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Kontak</h4>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2"><MessageCircle size={16} /> {config.brand.whatsapp}</li>
              <li className="flex items-center gap-2"><Globe size={16} /> {config.brand.email}</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-200 dark:border-slate-800 pt-8 text-center text-sm text-slate-500">© 2026 {config.brand.name}. All rights reserved.</div>
      </div>
    </footer>
  );
}
