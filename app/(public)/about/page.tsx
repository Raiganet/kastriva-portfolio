import type { Metadata } from "next";
import FinalCTA from "@/components/sections/FinalCTA";
import { CheckCircle2, UserRound } from "lucide-react";
import { getSiteContent } from "@/lib/server/site-content.server";
import { pageMetadata } from "@/lib/seo-cms";
import Image from "next/image";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteContent();
  return pageMetadata(site, "about", "/about", site.about.title, site.about.lead);
}

export default async function AboutPage() {
  const site = await getSiteContent();
  const team = site.team.items.filter((item) => item.active);
  return (
    <div className="pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-6 max-w-5xl">
        <div className="mb-12 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{site.about.title}</h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">{site.about.lead}</p>
        </div>
        <div className="max-w-4xl mb-12">
          {site.about.paragraphs.map((paragraph, i) => <p key={i} className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-6">{paragraph}</p>)}
        </div>
        <div className="bg-slate-50 dark:bg-dark-surface p-8 rounded-2xl border border-slate-200 dark:border-slate-800 mb-14 max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">{site.about.principlesTitle}</h2>
          <div className="grid md:grid-cols-2 gap-4">{site.about.principles.map((principle, i) => <div key={i} className="flex items-start gap-3"><CheckCircle2 className="text-primary-500 flex-shrink-0 mt-1" size={20} /><span className="text-slate-700 dark:text-slate-300">{principle}</span></div>)}</div>
        </div>
        {site.team.visible && team.length > 0 && (
          <section className="mb-14">
            <div className="mb-8"><h2 className="text-3xl font-bold mb-3">{site.team.title}</h2><p className="text-slate-600 dark:text-slate-400">{site.team.subtitle}</p></div>
            <div className="grid md:grid-cols-2 gap-6">{team.map((member) => <article key={member.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-surface p-6"><div className="flex gap-4 items-start">{member.image && member.image !== "#" ? <Image src={member.image} alt={member.name} width={80} height={80} className="h-20 w-20 rounded-2xl object-cover" /> : <div className="h-20 w-20 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center"><UserRound className="text-primary-600" size={32} /></div>}<div><h3 className="text-xl font-bold">{member.name}</h3><p className="text-primary-600 font-medium">{member.role}</p></div></div><p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{member.bio}</p>{member.skills.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{member.skills.map((skill) => <span key={skill} className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium">{skill}</span>)}</div>}</article>)}</div>
          </section>
        )}
      </div>
      <FinalCTA />
    </div>
  );
}
