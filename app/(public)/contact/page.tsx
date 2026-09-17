import { config, getWhatsAppLink } from "@/data/config";
import { MessageCircle, Mail, Instagram, Github } from "lucide-react";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Kontak & Konsultasi Project",
  description: "Hubungi Kastriva untuk konsultasi pembuatan website, web app, sistem informasi, atau aplikasi.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Siap Membuat Project Bersama?</h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Pilih cara yang paling nyaman untuk menghubungi saya.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <a 
            href={getWhatsAppLink("Halo Kastriva, saya ingin konsultasi mengenai project.")}
            target="_blank"
            rel="noopener noreferrer"
            className="group p-8 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800 hover:border-green-500 hover:shadow-xl transition-all"
          >
            <div className="w-14 h-14 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <MessageCircle className="text-green-600 dark:text-green-400" size={28} />
            </div>
            <h3 className="text-xl font-bold mb-2">WhatsApp</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-2">Respon cepat, konsultasi langsung</p>
            <p className="text-primary-600 font-medium">{config.brand.whatsapp}</p>
          </a>

          <a 
            href={`mailto:${config.brand.email}`}
            className="group p-8 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800 hover:border-primary-500 hover:shadow-xl transition-all"
          >
            <div className="w-14 h-14 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Mail className="text-primary-600 dark:text-primary-400" size={28} />
            </div>
            <h3 className="text-xl font-bold mb-2">Email</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-2">Untuk diskusi detail project</p>
            <p className="text-primary-600 font-medium">{config.brand.email}</p>
          </a>

          <a 
            href={config.brand.socials.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="group p-8 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800 hover:border-pink-500 hover:shadow-xl transition-all"
          >
            <div className="w-14 h-14 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Instagram className="text-pink-600 dark:text-pink-400" size={28} />
            </div>
            <h3 className="text-xl font-bold mb-2">Instagram</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-2">Follow untuk update terbaru</p>
            <p className="text-primary-600 font-medium">@{config.brand.name.toLowerCase()}</p>
          </a>

          <a 
            href={config.brand.socials.github}
            target="_blank"
            rel="noopener noreferrer"
            className="group p-8 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800 hover:border-slate-900 hover:shadow-xl transition-all"
          >
            <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Github className="text-slate-900 dark:text-slate-100" size={28} />
            </div>
            <h3 className="text-xl font-bold mb-2">GitHub</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-2">Lihat source code project</p>
            <p className="text-primary-600 font-medium">github.com/{config.brand.name.toLowerCase()}</p>
          </a>
        </div>
      </div>
    </div>
  );
}
