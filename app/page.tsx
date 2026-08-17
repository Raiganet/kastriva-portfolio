import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Portfolio from "@/components/Portfolio";
import OrderForm from "@/components/OrderForm";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { CheckCircle2, Code2, Layout, Smartphone, Server, Wrench, ArrowRight } from "lucide-react";
import { config, getWhatsAppLink } from "@/data/config";

const Section = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <motion.section initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }} className={className}>
    {children}
  </motion.section>
);

export default function Home() {
  const iconMap: Record<string, any> = { Building2: Layout, MousePointerClick: Code2, Globe: Server, Database: Server, Smartphone: Smartphone, Wrench: Wrench };

  return (
    <main className="min-h-screen bg-white dark:bg-dark-bg">
      <Navbar />
      <Hero />
      
      <Section className="py-12 border-y border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-dark-surface/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {config.stats.map((stat, i) => (<div key={i}><div className="text-3xl md:text-4xl font-bold text-primary-600 mb-1">{stat.value}</div><div className="text-sm text-slate-600 dark:text-slate-400 font-medium">{stat.label}</div></div>))}
          </div>
        </div>
      </Section>

      <Section id="services" className="py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Layanan Saya</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Solusi digital komprehensif yang disesuaikan dengan skala dan kebutuhan bisnis Anda.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {config.services.map((service) => {
              const Icon = iconMap[service.icon] || Code2;
              return (
                <div key={service.id} className="group p-6 rounded-2xl bg-white dark:bg-dark-bg border border-slate-200 dark:border-slate-800 hover:border-primary-500/50 hover:shadow-xl hover:shadow-primary-900/5 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-4 group-hover:scale-110 transition-transform"><Icon size={24} /></div>
                  <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">{service.desc}</p>
                  <ul className="space-y-2 mb-6">
                    {service.features.map((f, i) => (<li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2"><CheckCircle2 size={14} className="text-green-500" /> {f}</li>))}
                  </ul>
                  <a href={getWhatsAppLink(`Halo, saya ingin konsultasi mengenai layanan ${service.title}`)} className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold text-sm hover:gap-3 transition-all">Konsultasikan <ArrowRight size={16} /></a>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      <Portfolio />

      <Section className="py-20 bg-slate-50 dark:bg-dark-surface/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Kenapa Memilih {config.brand.name}?</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">Saya tidak hanya menulis kode, tetapi memberikan solusi bisnis yang berkelanjutan. Setiap project dikerjakan dengan standar profesional tinggi.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {["Desain Modern & Premium", "100% Responsive", "Performa Cepat (Core Web Vitals)", "Struktur Kode Rapi & Scalable", "Konsultasi Gratis Sebelum Mulai", "Support & Maintenance Setelah Project"].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1 bg-green-100 dark:bg-green-900/30 p-1 rounded-full"><CheckCircle2 size={16} className="text-green-600 dark:text-green-400" /></div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-purple-500 rounded-3xl blur-2xl opacity-20" />
              <div className="relative glass p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
                <div className="space-y-6">
                  {config.process.map((step, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 font-bold flex items-center justify-center text-sm">{step.step}</div>
                      <div><h4 className="font-bold mb-1">{step.title}</h4><p className="text-sm text-slate-600 dark:text-slate-400">{step.desc}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section className="py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Investasi Project</h2>
            <p className="text-slate-600 dark:text-slate-400">Harga transparan dan fleksibel sesuai kompleksitas kebutuhan.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {config.pricing.map((pkg, i) => (
              <div key={i} className={`p-6 rounded-2xl border ${i === 2 ? "border-primary-500 bg-primary-50/30 dark:bg-primary-900/10 shadow-xl shadow-primary-900/5" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-bg"} flex flex-col`}>
                <h3 className="text-lg font-bold mb-2">{pkg.name}</h3>
                <div className="text-2xl font-bold text-primary-600 mb-6">{pkg.price}</div>
                <ul className="space-y-3 mb-8 flex-1">
                  {pkg.features.map((f, j) => (<li key={j} className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2"><CheckCircle2 size={14} className="text-primary-500" /> {f}</li>))}
                </ul>
                <a href="#contact" className={`w-full text-center py-3 rounded-xl font-semibold transition-all ${i === 2 ? "bg-primary-600 text-white hover:bg-primary-700" : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white"}`}>Diskusikan Project</a>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <OrderForm />

      <Section className="py-20 bg-primary-600 dark:bg-primary-900 text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Sudah Punya Ide? Mari Wujudkan Menjadi Website.</h2>
          <p className="text-primary-100 text-lg mb-10 max-w-2xl mx-auto">Ceritakan kebutuhan Anda. Saya akan membantu menentukan solusi digital yang paling sesuai.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="#contact" className="bg-white text-primary-700 px-8 py-4 rounded-full font-bold hover:bg-primary-50 transition-all shadow-lg">Mulai Konsultasi</a>
            <a href="#portfolio" className="bg-primary-700 text-white border border-primary-500 px-8 py-4 rounded-full font-bold hover:bg-primary-800 transition-all">Lihat Portfolio</a>
          </div>
        </div>
      </Section>

      <Footer />
      <WhatsAppFloat />
    </main>
  );
}
