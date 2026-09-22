"use client";
import {
  Instagram,
  Github,
  Youtube,
  Music2,
  Globe,
  MessageCircle,
  Mail,
  MapPin,
  Package,
  UserCircle2,
  ShieldCheck,
  BadgeCheck,
} from "lucide-react";
import Link from "next/link";
import { useSiteContent } from "@/components/cms/SiteContentProvider";
import BrandLogo from "@/components/BrandLogo";

export default function Footer() {
  const site = useSiteContent();
  const socials = [
    { href: site.brand.socials.instagram, label: "Instagram", Icon: Instagram },
    { href: site.brand.socials.tiktok, label: "TikTok", Icon: Music2 },
    { href: site.brand.socials.github, label: "GitHub", Icon: Github },
    { href: site.brand.socials.youtube, label: "YouTube", Icon: Youtube },
    { href: site.brand.socials.website, label: "Website", Icon: Globe },
  ].filter((item) => item.href && item.href !== "#");

  return (
    <footer className="bg-slate-50 dark:bg-dark-surface border-t border-slate-200 dark:border-slate-800 pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="mb-5 inline-flex items-center" aria-label={`Beranda ${site.brand.name}`}>
              <BrandLogo alt={`Logo ${site.brand.name}`} className="w-[190px] sm:w-[215px]" />
            </Link>
            <p className="text-slate-600 dark:text-slate-400 max-w-sm mb-6">{site.footer.description}</p>
            {socials.length > 0 && <div className="flex flex-wrap gap-3">{socials.map(({ href, label, Icon }) => <a key={label} aria-label={`${label} ${site.brand.name}`} href={href} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full bg-white dark:bg-dark-bg border border-slate-200 dark:border-slate-700 hover:-translate-y-0.5 hover:text-primary-600 transition-all"><Icon size={19} /></a>)}</div>}
          </div>
          <div>
            <h4 className="font-bold mb-4">{site.footer.navigationTitle}</h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              {site.navigation.links.map((link) => <li key={`${link.href}-${link.label}`}><Link href={link.href} className="hover:text-primary-600 transition-colors">{link.label}</Link></li>)}
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">{site.footer.accountTitle}</h4>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <li><Link href="/order" className="hover:text-primary-600 transition-colors flex items-center gap-2"><Package size={14} /> {site.navigation.startProjectLabel}</Link></li>
              <li><Link href="/order/track" className="hover:text-primary-600 transition-colors flex items-center gap-2"><Package size={14} /> {site.navigation.trackOrderLabel}</Link></li>
              {site.footer.showCustomerLogin && <li><Link href="/customer/login" className="hover:text-primary-600 transition-colors flex items-center gap-2"><UserCircle2 size={14} /> Login Customer</Link></li>}
              {site.footer.showAdminLogin && <li><Link href="/admin/login" className="hover:text-primary-600 transition-colors flex items-center gap-2"><ShieldCheck size={14} /> Login Admin</Link></li>}
              {site.brand.whatsapp && <li className="flex items-center gap-2 pt-2"><MessageCircle size={14} /> {site.brand.whatsapp}</li>}
              {site.brand.email && <li className="flex items-center gap-2"><Mail size={14} /> <a href={`mailto:${site.brand.email}`} className="hover:text-primary-600 transition-colors">{site.brand.email}</a></li>}
              {site.brand.address && <li className="flex items-start gap-2"><MapPin size={14} className="mt-0.5 shrink-0" /> <span>{site.brand.address}</span></li>}
            </ul>
          </div>
        </div>
        {site.footer.showLegalIdentity && site.footer.nib && (
          <div className="mb-8 rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  <BadgeCheck size={23} aria-hidden="true" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-slate-900 dark:text-white">{site.footer.legalTitle}</h4>
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:border-emerald-900 dark:bg-dark-bg/70 dark:text-emerald-300">
                      <ShieldCheck size={12} /> Terdaftar OSS
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{site.footer.legalDescription}</p>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left dark:border-slate-700 dark:bg-dark-bg sm:text-right">
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Nomor Induk Berusaha</div>
                <div className="mt-1 font-mono text-sm font-bold tracking-wider text-slate-900 dark:text-white sm:text-base">NIB {site.footer.nib}</div>
              </div>
            </div>
          </div>
        )}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-8 text-center text-sm text-slate-500">
          {site.footer.copyright.replace("{year}", String(new Date().getFullYear()))}
        </div>
      </div>
    </footer>
  );
}
