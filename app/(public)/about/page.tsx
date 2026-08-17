import { Metadata } from "next";
import { config } from "@/data/config";
import FinalCTA from "@/components/sections/FinalCTA";
import { CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: `Tentang | ${config.brand.name}`,
  description: "Tentang Kastriva - Layanan pengembangan website dan aplikasi custom modern.",
};

export default function AboutPage() {
  return (
    <div className="pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Tentang {config.brand.name}</h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
            {config.brand.tagline}. Fokus pada kualitas kode, desain modern, dan kepuasan klien.
          </p>
        </div>

        <div className="prose dark:prose-invert max-w-none mb-12">
          <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
            Kastriva adalah layanan pengembangan website dan aplikasi custom yang berfokus pada solusi digital modern untuk bisnis, UMKM, organisasi, dan personal.
          </p>
          <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
            Saya percaya bahwa setiap bisnis berhak mendapatkan solusi digital yang berkualitas, sesuai kebutuhan, dan dapat berkembang seiring pertumbuhan bisnis.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-dark-surface p-8 rounded-2xl border border-slate-200 dark:border-slate-800 mb-12">
          <h2 className="text-2xl font-bold mb-6">Prinsip Kerja</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              "Kualitas kode adalah prioritas",
              "Desain yang modern dan fungsional",
              "Komunikasi transparan dengan klien",
              "Solusi yang scalable untuk masa depan",
              "Support berkelanjutan setelah project",
              "Tidak ada klaim palsu atau data fiktif"
            ].map((principle, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="text-primary-500 flex-shrink-0 mt-1" size={20} />
                <span className="text-slate-700 dark:text-slate-300">{principle}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <FinalCTA />
    </div>
  );
}
