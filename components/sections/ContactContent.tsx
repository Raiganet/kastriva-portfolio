"use client";
import { MessageCircle, Mail, Instagram, Github } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/contact";
import { InteractiveCard, Reveal } from "@/components/ui";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import type { SiteContent } from "@/lib/types/site-content";

export default function ContactContent({ site }: { site: SiteContent }) {
  const { language } = useLanguage();
  const en = language === "en";
  const instagram = site.brand.socials.instagram;
  const github = site.brand.socials.github;
  return <div className="pt-32 pb-20"><div className="container mx-auto px-4 md:px-6 max-w-4xl">
    <Reveal className="text-center mb-12"><h1 className="text-4xl md:text-5xl font-bold mb-4">{en ? "Contact Us" : site.contact.title}</h1><p className="text-xl text-slate-600 dark:text-slate-400">{en ? "Tell us about your project. We would be happy to discuss it." : site.contact.subtitle}</p></Reveal>
    <Reveal className="grid md:grid-cols-2 gap-6" delay={0.05}>
      {site.brand.whatsapp && <InteractiveCard tilt={6} className="h-full"><a href={buildWhatsAppLink(site.brand.whatsapp, en ? `Hello ${site.brand.name}, I would like to discuss my project.` : `Halo ${site.brand.name}, saya ingin konsultasi mengenai project.`)} target="_blank" rel="noopener noreferrer" className="group block h-full p-8 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800 hover:border-green-500 hover:shadow-xl transition-all"><div className="w-14 h-14 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4"><MessageCircle className="text-green-600 dark:text-green-400" size={28} /></div><h3 className="text-xl font-bold mb-2">{en ? "WhatsApp" : site.contact.whatsappTitle}</h3><p className="text-slate-600 dark:text-slate-400 mb-2">{en ? "Chat with our team about your project." : site.contact.whatsappDescription}</p><p className="text-primary-600 font-medium">{site.brand.whatsapp}</p></a></InteractiveCard>}
      {site.brand.email && <InteractiveCard tilt={6} className="h-full"><a href={`mailto:${site.brand.email}`} className="group block h-full p-8 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800 hover:border-primary-500 hover:shadow-xl transition-all"><Mail className="text-primary-600 mb-4" size={28} /><h3 className="text-xl font-bold mb-2">{en ? "Email" : site.contact.emailTitle}</h3><p className="text-slate-600 dark:text-slate-400 mb-2">{en ? "Send us your questions or project details." : site.contact.emailDescription}</p><p className="text-primary-600 font-medium">{site.brand.email}</p></a></InteractiveCard>}
      {instagram && instagram !== "#" && <InteractiveCard tilt={6} className="h-full"><a href={instagram} target="_blank" rel="noopener noreferrer" className="group block h-full p-8 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800"><Instagram className="text-pink-600 mb-4" size={28} /><h3 className="text-xl font-bold mb-2">{site.contact.instagramTitle}</h3><p>{site.contact.instagramDescription}</p></a></InteractiveCard>}
      {github && github !== "#" && <InteractiveCard tilt={6} className="h-full"><a href={github} target="_blank" rel="noopener noreferrer" className="group block h-full p-8 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800"><Github className="mb-4" size={28} /><h3 className="text-xl font-bold mb-2">{site.contact.githubTitle}</h3><p>{site.contact.githubDescription}</p></a></InteractiveCard>}
    </Reveal>
  </div></div>;
}
