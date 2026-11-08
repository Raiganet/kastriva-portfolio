"use client";

import Image from "next/image";
import { CheckCircle2, UserRound } from "lucide-react";
import FinalCTA from "@/components/sections/FinalCTA";
import { InteractiveCard, Reveal } from "@/components/ui";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import type { SiteContent } from "@/lib/types/site-content";
import { translateKnown } from "@/components/i18n/translateKnown";

const aboutTranslations: Record<string, string> = {
  "Solusi Digital Modern untuk Bisnis Anda. Fokus pada kualitas kode, desain modern, dan kepuasan klien.": "Modern digital solutions for your business. Focused on code quality, contemporary design, and client satisfaction.",
  "Kastriva adalah layanan pengembangan website dan aplikasi custom yang berfokus pada solusi digital modern untuk bisnis, UMKM, organisasi, dan personal.": "Kastriva builds custom websites and applications, delivering modern digital solutions for businesses, small enterprises, organizations, and individuals.",
  "Saya percaya bahwa setiap bisnis berhak mendapatkan solusi digital yang berkualitas, sesuai kebutuhan, dan dapat berkembang seiring pertumbuhan bisnis.": "We believe every business deserves a quality digital solution that fits its needs and can grow alongside the business.",
  "Kualitas kode adalah prioritas": "Code quality comes first",
  "Desain yang modern dan fungsional": "Modern, functional design",
  "Komunikasi transparan dengan klien": "Transparent client communication",
  "Solusi yang scalable untuk masa depan": "Scalable solutions built for the future",
  "Support berkelanjutan setelah project": "Ongoing support after launch",
  "Tidak ada klaim palsu atau data fiktif": "No false claims or fabricated data",
};

export default function AboutContent({ site }: { site: SiteContent }) {
  const { language } = useLanguage();
  const english = language === "en";
  const team = site.team.items.filter((item) => item.active);

  return (
    <div className="pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-6 max-w-5xl">
        <Reveal className="mb-12 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{translateKnown(site.about.title, english, { [`Tentang ${site.brand.name}`]: `About ${site.brand.name}` })}</h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">{translateKnown(site.about.lead, english, aboutTranslations)}</p>
        </Reveal>
        <Reveal className="max-w-4xl mb-12" delay={0.05}>
          {site.about.paragraphs.map((paragraph, i) => <p key={i} className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-6">{translateKnown(paragraph, english, aboutTranslations)}</p>)}
        </Reveal>
        <Reveal delay={0.1}>
          <InteractiveCard tilt={3} lift={3} entrance={false} className="bg-slate-50 dark:bg-dark-surface p-8 rounded-2xl border border-slate-200 dark:border-slate-800 mb-14 max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">{translateKnown(site.about.principlesTitle, english, { "Prinsip Kerja": "Our Principles" })}</h2>
            <div className="grid md:grid-cols-2 gap-4">{site.about.principles.map((principle, i) => <div key={i} className="flex items-start gap-3"><CheckCircle2 className="text-primary-500 flex-shrink-0 mt-1" size={20} /><span className="text-slate-700 dark:text-slate-300">{translateKnown(principle, english, aboutTranslations)}</span></div>)}</div>
          </InteractiveCard>
        </Reveal>
        {site.team.visible && team.length > 0 && (
          <Reveal className="mb-14" delay={0.05}>
            <div className="mb-8"><h2 className="text-3xl font-bold mb-3">{translateKnown(site.team.title, english, { "Tim & Keahlian": "Team & Expertise" })}</h2><p className="text-slate-600 dark:text-slate-400">{translateKnown(site.team.subtitle, english, { "Kenali orang di balik pengerjaan project Kastriva.": "Meet the people behind Kastriva projects." })}</p></div>
            <div className="grid md:grid-cols-2 gap-6">{team.map((member) => <InteractiveCard key={member.id} tilt={5} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-surface p-6"><div className="flex gap-4 items-start">{member.image && member.image !== "#" ? <Image src={member.image} alt={member.name} width={80} height={80} className="h-20 w-20 rounded-2xl object-cover" /> : <div className="h-20 w-20 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center"><UserRound className="text-primary-600" size={32} /></div>}<div><h3 className="text-xl font-bold">{member.name}</h3><p className="text-primary-600 font-medium">{member.role}</p></div></div><p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{member.bio}</p>{member.skills.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{member.skills.map((skill) => <span key={skill} className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium">{skill}</span>)}</div>}</InteractiveCard>)}</div>
          </Reveal>
        )}
      </div>
      <Reveal className="content-auto" delay={0.05}><FinalCTA /></Reveal>
    </div>
  );
}
