import { config } from "@/data/config";
import {
  Instagram,
  Github,
  Globe,
  MessageCircle,
  Package,
  UserCircle2,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-50 dark:bg-dark-surface border-t border-slate-200 dark:border-slate-800 pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold text-gradient mb-4">{config.brand.name}</h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-sm mb-6">
              {config.brand.tagline}. Fokus pada kualitas kode, desain modern, dan kepuasan klien.
            </p>
            <div className="flex gap-4">
              <a href={config.brand.socials.instagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white dark:bg-dark-bg border border-slate-200 dark:border-slate-700 hover:text-primary-600 transition-colors">
                <Instagram size={20} />
              </a>
              <a href={config.brand.socials.github} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white dark:bg-dark-bg border border-slate-200 dark:border-slate-700 hover:text-primary-600 transition-colors">
                <Github size={20} />
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-4">Navigasi</h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><Link href="/" className="hover:text-primary-600 transition-colors">Home</Link></li>
              <li><Link href="/services" className="hover:text-primary-600 transition-colors">Services</Link></li>
              <li><Link href="/portfolio" className="hover:text-primary-600 transition-colors">Portfolio</Link></li>
              <li><Link href="/about" className="hover:text-primary-600 transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-primary-600 transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Customer & Admin</h4>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/order" className="hover:text-primary-600 transition-colors flex items-center gap-2">
                  <Package size={14} /> Mulai Project
                </Link>
              </li>
              <li>
                <Link href="/order/track" className="hover:text-primary-600 transition-colors flex items-center gap-2">
                  <Package size={14} /> Lacak Order
                </Link>
              </li>
              <li>
                <Link href="/customer/login" className="hover:text-primary-600 transition-colors flex items-center gap-2">
                  <UserCircle2 size={14} /> Login Customer
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-primary-600 transition-colors flex items-center gap-2">
                  <ShieldCheck size={14} /> Login Admin
                </Link>
              </li>
              <li className="flex items-center gap-2 pt-2">
                <MessageCircle size={14} /> 0821-1711-9762
              </li>
              <li className="flex items-center gap-2">
                <Globe size={14} /> {config.brand.email}
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-200 dark:border-slate-800 pt-8 text-center text-sm text-slate-500">
          © 2026 {config.brand.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
