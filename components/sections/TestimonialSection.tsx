import { Star, Quote } from "lucide-react";
import { testimonials } from "@/data/content";

export default function TestimonialSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 md:px-6 max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Apa Kata Customer?
          </h2>
        </div>

        {testimonials.length === 0 ? (
          <div className="p-10 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
            <Quote size={32} className="text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Testimonial customer akan ditampilkan di sini.
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
              Kami hanya menampilkan testimoni asli dari customer yang telah menyelesaikan project.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="bg-white dark:bg-dark-bg p-6 rounded-2xl border border-slate-200 dark:border-slate-800"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      size={16}
                      className={j < t.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-300"}
                    />
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                  "{t.message}"
                </p>
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-sm text-slate-500">{t.business}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
