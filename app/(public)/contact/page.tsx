import type { Metadata } from "next";
import { MessageCircle, Mail, Instagram, Github } from "lucide-react";
import { getSiteContent } from "@/lib/server/site-content.server";
import { pageMetadata } from "@/lib/seo-cms";
import { buildWhatsAppLink } from "@/lib/contact";
import { InteractiveCard, Reveal } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteContent();
  return pageMetadata(site, "contact", "/contact", site.contact.title, site.contact.subtitle);
}

export default async function ContactPage() {
  const site = await getSiteContent();
  const instagram = site.brand.socials.instagram;
  const github = site.brand.socials.github;
  return (
    <div className="pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        <Reveal className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{site.contact.title}</h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">{site.contact.subtitle}</p>
        </Reveal>
        <Reveal className="grid md:grid-cols-2 gap-6" delay={0.05}>
          {site.brand.whatsapp && (
            <InteractiveCard tilt={6} className="h-full">
              <a href={buildWhatsAppLink(site.brand.whatsapp, `Halo ${site.brand.name}, saya ingin konsultasi mengenai project.`)} target="_blank" rel="noopener noreferrer" className="group block h-full p-8 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800 hover:border-green-500 hover:shadow-xl transition-all"><div className="w-14 h-14 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"><MessageCircle className="text-green-600 dark:text-green-400" size={28} /></div><h3 className="text-xl font-bold mb-2">{site.contact.whatsappTitle}</h3><p className="text-slate-600 dark:text-slate-400 mb-2">{site.contact.whatsappDescription}</p><p className="text-primary-600 font-medium">{site.brand.whatsapp}</p></a>
            </InteractiveCard>
          )}
          {site.brand.email && (
            <InteractiveCard tilt={6} className="h-full">
              <a href={`mailto:${site.brand.email}`} className="group block h-full p-8 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800 hover:border-primary-500 hover:shadow-xl transition-all"><div className="w-14 h-14 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"><Mail className="text-primary-600 dark:text-primary-400" size={28} /></div><h3 className="text-xl font-bold mb-2">{site.contact.emailTitle}</h3><p className="text-slate-600 dark:text-slate-400 mb-2">{site.contact.emailDescription}</p><p className="text-primary-600 font-medium">{site.brand.email}</p></a>
            </InteractiveCard>
          )}
          {instagram && instagram !== "#" && (
            <InteractiveCard tilt={6} className="h-full">
              <a href={instagram} target="_blank" rel="noopener noreferrer" className="group block h-full p-8 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800 hover:border-pink-500 hover:shadow-xl transition-all"><div className="w-14 h-14 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"><Instagram className="text-pink-600 dark:text-pink-400" size={28} /></div><h3 className="text-xl font-bold mb-2">{site.contact.instagramTitle}</h3><p className="text-slate-600 dark:text-slate-400 mb-2">{site.contact.instagramDescription}</p><p className="text-primary-600 font-medium">Instagram {site.brand.name}</p></a>
            </InteractiveCard>
          )}
          {github && github !== "#" && (
            <InteractiveCard tilt={6} className="h-full">
              <a href={github} target="_blank" rel="noopener noreferrer" className="group block h-full p-8 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800 hover:border-slate-900 hover:shadow-xl transition-all"><div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"><Github className="text-slate-900 dark:text-slate-100" size={28} /></div><h3 className="text-xl font-bold mb-2">{site.contact.githubTitle}</h3><p className="text-slate-600 dark:text-slate-400 mb-2">{site.contact.githubDescription}</p><p className="text-primary-600 font-medium">GitHub {site.brand.name}</p></a>
            </InteractiveCard>
          )}
        </Reveal>
      </div>
    </div>
  );
}
