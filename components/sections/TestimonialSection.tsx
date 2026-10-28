"use client";
import { Star, Quote } from "lucide-react";
import { useSiteContent } from "@/components/cms/SiteContentProvider";
import { InteractiveCard } from "@/components/ui";

export default function TestimonialSection() {
  const { testimonials } = useSiteContent();
  if (!testimonials.visible) return null;
  const items = testimonials.items.filter((item) => item.published);
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 md:px-6 max-w-5xl">
        <div className="text-center mb-12"><h2 className="text-3xl md:text-4xl font-bold mb-4">{testimonials.title}</h2>{testimonials.subtitle && <p className="text-slate-600 dark:text-slate-400">{testimonials.subtitle}</p>}</div>
        {items.length === 0 ? <div className="p-10 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center"><Quote size={32} className="text-slate-300 dark:text-slate-700 mx-auto mb-4" /><p className="text-slate-500 dark:text-slate-400 font-medium">{testimonials.emptyTitle}</p><p className="text-sm text-slate-400 dark:text-slate-500 mt-2">{testimonials.emptyText}</p></div> : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((t, i) => (
              <InteractiveCard
                key={t.id}
                delay={i * 0.08}
                tilt={6}
                spotlightColor="234, 179, 8"
                className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-[border-color,box-shadow] duration-300 hover:border-yellow-300 hover:shadow-xl hover:shadow-yellow-500/10 dark:border-slate-800 dark:bg-dark-bg"
              >
                <div className="mb-4 flex gap-1 origin-left transition-transform duration-300 group-hover:scale-105">
                  {Array.from({ length: 5 }).map((_, j) => <Star key={j} size={16} className={j < t.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-300"} />)}
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">“{t.message}”</p>
                <div className="mt-auto">
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-sm text-slate-500">{t.business}</div>
                </div>
              </InteractiveCard>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
