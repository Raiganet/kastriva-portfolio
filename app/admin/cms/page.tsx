"use client";

import { useEffect, useMemo, useState } from "react";
import { gasGet, gasPost } from "@/lib/gas-client";
import { defaultSiteContent } from "@/data/site-content";
import type { SiteContent, SiteContentSection } from "@/lib/types/site-content";
import {
  LayoutTemplate, Home, BriefcaseBusiness, ListChecks, MessageSquareQuote, CircleHelp,
  Users, Contact, Megaphone, PanelBottom, Search, Save, RefreshCw, Plus, Trash2,
  Eye, ExternalLink, CheckCircle2, AlertCircle, Images
} from "lucide-react";
import Link from "next/link";

const groups = [
  { id: "general", label: "Umum", icon: LayoutTemplate, sections: ["brand", "navigation"] as SiteContentSection[] },
  { id: "home", label: "Beranda", icon: Home, sections: ["hero", "stats", "featured", "whyChoose"] as SiteContentSection[] },
  { id: "services", label: "Layanan & Harga", icon: BriefcaseBusiness, sections: ["services", "pricing"] as SiteContentSection[] },
  { id: "portfolio", label: "Portfolio", icon: Images, sections: ["portfolio"] as SiteContentSection[] },
  { id: "process", label: "Cara Kerja", icon: ListChecks, sections: ["process"] as SiteContentSection[] },
  { id: "testimonials", label: "Testimonial", icon: MessageSquareQuote, sections: ["testimonials"] as SiteContentSection[] },
  { id: "faq", label: "FAQ", icon: CircleHelp, sections: ["faq"] as SiteContentSection[] },
  { id: "about", label: "Tentang & Tim", icon: Users, sections: ["about", "team"] as SiteContentSection[] },
  { id: "contact", label: "Kontak & CTA", icon: Contact, sections: ["contact", "cta"] as SiteContentSection[] },
  { id: "footer", label: "Footer", icon: PanelBottom, sections: ["footer"] as SiteContentSection[] },
  { id: "seo", label: "SEO", icon: Search, sections: ["seo"] as SiteContentSection[] },
] as const;

type GroupId = typeof groups[number]["id"];

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-dark-bg";
const cardClass = "rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-dark-surface";

function mergeKnown<T>(fallback: T, incoming: unknown): T {
  if (Array.isArray(fallback)) return (Array.isArray(incoming) ? incoming : fallback) as T;
  if (fallback && typeof fallback === "object") {
    if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) return fallback;
    const out = { ...(fallback as Record<string, unknown>) };
    for (const key of Object.keys(out)) out[key] = mergeKnown(out[key], (incoming as Record<string, unknown>)[key]);
    return out as T;
  }
  return typeof incoming === typeof fallback ? (incoming as T) : fallback;
}

function Field({ label, value, onChange, placeholder = "", type = "text", hint }: {
  label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; hint?: string;
}) {
  return <label className="block">
    <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputClass} />
    {hint && <span className="mt-1.5 block text-xs text-slate-400">{hint}</span>}
  </label>;
}

function TextArea({ label, value, onChange, rows = 4, hint }: {
  label: string; value: string; onChange: (value: string) => void; rows?: number; hint?: string;
}) {
  return <label className="block">
    <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
    <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className={`${inputClass} resize-y`} />
    {hint && <span className="mt-1.5 block text-xs text-slate-400">{hint}</span>}
  </label>;
}

function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (value: boolean) => void; hint?: string }) {
  return <button type="button" onClick={() => onChange(!checked)} className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${checked ? "border-primary-300 bg-primary-50/60 dark:border-primary-800 dark:bg-primary-950/20" : "border-slate-200 bg-white dark:border-slate-700 dark:bg-dark-bg"}`}>
    <span><span className="block text-sm font-semibold">{label}</span>{hint && <span className="mt-0.5 block text-xs text-slate-400">{hint}</span>}</span>
    <span className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-primary-600" : "bg-slate-300 dark:bg-slate-700"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${checked ? "left-6" : "left-1"}`} /></span>
  </button>;
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return <div className="mb-5"><h2 className="text-xl font-black">{title}</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p></div>;
}

const lines = (value: string) => value.split("\n").map((v) => v.trim()).filter(Boolean);
const lineText = (value: string[]) => value.join("\n");
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export default function AdminCmsPage() {
  const [site, setSite] = useState<SiteContent>(defaultSiteContent);
  const [active, setActive] = useState<GroupId>("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const group = useMemo(() => groups.find((g) => g.id === active) || groups[0], [active]);

  const load = async () => {
    setLoading(true); setMessage(null);
    const res = await gasGet<Record<string, unknown>>("getSiteContentAdmin");
    if (res.success && res.data) setSite(mergeKnown(defaultSiteContent, res.data));
    else setMessage({ type: "error", text: res.error || "Gagal memuat CMS. Pastikan GAS Stage 5 sudah dideploy." });
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const setSection = <K extends SiteContentSection>(section: K, value: SiteContent[K]) => setSite((prev) => ({ ...prev, [section]: value }));

  const saveCurrent = async () => {
    setSaving(true); setMessage(null);
    for (const section of group.sections) {
      const res = await gasPost({ action: "updateSiteContentSection", section, content: site[section] as unknown as Record<string, unknown> });
      if (!res.success) {
        setSaving(false);
        setMessage({ type: "error", text: `${section}: ${res.error || "Gagal menyimpan"}` });
        return;
      }
    }
    try {
      await fetch("/api/cms/revalidate", { method: "POST", credentials: "same-origin" });
    } catch {}
    setSaving(false);
    setMessage({ type: "ok", text: `Bagian “${group.label}” berhasil disimpan dan cache website diperbarui.` });
  };

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>;

  return <div className="pb-24">
    <div className="mb-7 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-primary-600"><LayoutTemplate size={14} /> Full Website CMS</div>
        <h1 className="text-3xl font-black tracking-tight">CMS Seluruh Website</h1>
        <p className="mt-1 max-w-3xl text-slate-600 dark:text-slate-400">Kelola seluruh konten halaman publik tanpa mengedit source code. Judul dan tampilan Portfolio diatur di sini, sedangkan item project, gambar, dan detailnya dikelola dari menu Portfolio CMS.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/" target="_blank" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:bg-dark-surface dark:hover:bg-slate-800"><Eye size={17} /> Preview Website <ExternalLink size={14} /></Link>
        <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:bg-dark-surface dark:hover:bg-slate-800"><RefreshCw size={17} /> Muat Ulang</button>
      </div>
    </div>

    {message && <div className={`mb-5 flex items-start gap-3 rounded-xl border p-4 text-sm ${message.type === "ok" ? "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/20 dark:text-green-300" : "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300"}`}>{message.type === "ok" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}<span>{message.text}</span></div>}

    <div className="mb-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-dark-surface">
      <div className="flex min-w-max gap-1">
        {groups.map((g) => <button key={g.id} onClick={() => setActive(g.id)} className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${active === g.id ? "bg-primary-600 text-white shadow-md shadow-primary-600/20" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}><g.icon size={16} /> {g.label}</button>)}
      </div>
    </div>

    <div className="space-y-6">
      {active === "general" && <>
        <section className={cardClass}><SectionHeader title="Identitas Brand" description="Nama, kontak, alamat, dan akun sosial yang digunakan di seluruh website." />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nama Brand" value={site.brand.name} onChange={(v) => setSection("brand", { ...site.brand, name: v })} />
            <Field label="Tagline" value={site.brand.tagline} onChange={(v) => setSection("brand", { ...site.brand, tagline: v })} />
            <Field label="WhatsApp" value={site.brand.whatsapp} onChange={(v) => setSection("brand", { ...site.brand, whatsapp: v })} hint="Gunakan format internasional, contoh 62812..." />
            <Field label="Email" value={site.brand.email} onChange={(v) => setSection("brand", { ...site.brand, email: v })} type="email" />
            <div className="md:col-span-2"><Field label="Alamat / Area Layanan" value={site.brand.address} onChange={(v) => setSection("brand", { ...site.brand, address: v })} /></div>
            {(["instagram", "tiktok", "github", "website", "youtube"] as const).map((key) => <Field key={key} label={`URL ${key[0].toUpperCase() + key.slice(1)}`} value={site.brand.socials[key]} onChange={(v) => setSection("brand", { ...site.brand, socials: { ...site.brand.socials, [key]: v } })} placeholder="https://... atau # untuk sembunyikan" />)}
          </div>
        </section>
        <section className={cardClass}><SectionHeader title="Navigasi Website" description="Atur menu utama. Gunakan path internal seperti /services atau URL HTTPS." />
          <div className="space-y-3">
            {site.navigation.links.map((link, i) => <div key={`${i}-${link.href}`} className="grid gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800 md:grid-cols-[1fr_1.5fr_auto]">
              <input className={inputClass} value={link.label} onChange={(e) => { const next = [...site.navigation.links]; next[i] = { ...link, label: e.target.value }; setSection("navigation", { ...site.navigation, links: next }); }} placeholder="Label" />
              <input className={inputClass} value={link.href} onChange={(e) => { const next = [...site.navigation.links]; next[i] = { ...link, href: e.target.value }; setSection("navigation", { ...site.navigation, links: next }); }} placeholder="/halaman" />
              <button onClick={() => setSection("navigation", { ...site.navigation, links: site.navigation.links.filter((_, x) => x !== i) })} className="rounded-xl p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"><Trash2 size={18} /></button>
            </div>)}
            <button onClick={() => setSection("navigation", { ...site.navigation, links: [...site.navigation.links, { label: "Menu Baru", href: "/" }] })} className="inline-flex items-center gap-2 rounded-xl border border-dashed border-primary-300 px-4 py-2.5 text-sm font-semibold text-primary-600"><Plus size={16} /> Tambah Menu</button>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2"><Field label="Label Lacak Order" value={site.navigation.trackOrderLabel} onChange={(v) => setSection("navigation", { ...site.navigation, trackOrderLabel: v })} /><Field label="Label Tombol Utama" value={site.navigation.startProjectLabel} onChange={(v) => setSection("navigation", { ...site.navigation, startProjectLabel: v })} /></div>
        </section>
      </>}

      {active === "home" && <>
        <section className={cardClass}><SectionHeader title="Hero" description="Konten pertama yang dilihat pengunjung di halaman utama." />
          <div className="space-y-4"><Toggle label="Tampilkan Hero" checked={site.hero.visible} onChange={(v) => setSection("hero", { ...site.hero, visible: v })} />
            <Field label="Label Kecil / Eyebrow" value={site.hero.eyebrow} onChange={(v) => setSection("hero", { ...site.hero, eyebrow: v })} />
            <Field label="Headline" value={site.hero.headline} onChange={(v) => setSection("hero", { ...site.hero, headline: v })} />
            <TextArea label="Subheadline" value={site.hero.subheadline} onChange={(v) => setSection("hero", { ...site.hero, subheadline: v })} />
            <div className="grid gap-4 md:grid-cols-2"><Field label="CTA Utama" value={site.hero.ctaPrimary} onChange={(v) => setSection("hero", { ...site.hero, ctaPrimary: v })} /><Field label="Link CTA Utama" value={site.hero.ctaPrimaryHref} onChange={(v) => setSection("hero", { ...site.hero, ctaPrimaryHref: v })} /><Field label="CTA Kedua" value={site.hero.ctaSecondary} onChange={(v) => setSection("hero", { ...site.hero, ctaSecondary: v })} /><Field label="Link CTA Kedua" value={site.hero.ctaSecondaryHref} onChange={(v) => setSection("hero", { ...site.hero, ctaSecondaryHref: v })} /></div>
            <TextArea label="Badge Hero" value={lineText(site.hero.badges)} onChange={(v) => setSection("hero", { ...site.hero, badges: lines(v) })} hint="Satu badge per baris." />
          </div>
        </section>
        <section className={cardClass}><SectionHeader title="Statistik" description="Angka ringkas di bawah Hero." /><Toggle label="Tampilkan Statistik" checked={site.stats.visible} onChange={(v) => setSection("stats", { ...site.stats, visible: v })} />
          <div className="mt-4 grid gap-3 md:grid-cols-2">{site.stats.items.map((item, i) => <div key={i} className="grid grid-cols-[1fr_120px_auto] gap-2"><input className={inputClass} value={item.label} onChange={(e) => { const a = [...site.stats.items]; a[i] = { ...item, label: e.target.value }; setSection("stats", { ...site.stats, items: a }); }} /><input className={inputClass} value={item.value} onChange={(e) => { const a = [...site.stats.items]; a[i] = { ...item, value: e.target.value }; setSection("stats", { ...site.stats, items: a }); }} /><button onClick={() => setSection("stats", { ...site.stats, items: site.stats.items.filter((_, x) => x !== i) })} className="p-3 text-red-500"><Trash2 size={17} /></button></div>)}</div>
          <button onClick={() => setSection("stats", { ...site.stats, items: [...site.stats.items, { label: "Statistik Baru", value: "0" }] })} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary-600"><Plus size={16} /> Tambah Statistik</button>
        </section>
        <section className={cardClass}><SectionHeader title="Project Unggulan" description="Judul section yang mengambil data dari Portfolio CMS bertanda featured." /><Toggle label="Tampilkan Project Unggulan" checked={site.featured.visible} onChange={(v) => setSection("featured", { ...site.featured, visible: v })} /><div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Badge" value={site.featured.badge} onChange={(v) => setSection("featured", { ...site.featured, badge: v })} /><Field label="Judul" value={site.featured.title} onChange={(v) => setSection("featured", { ...site.featured, title: v })} /><div className="md:col-span-2"><Field label="Subjudul" value={site.featured.subtitle} onChange={(v) => setSection("featured", { ...site.featured, subtitle: v })} /></div></div></section>
        <section className={cardClass}><SectionHeader title="Keunggulan" description="Alasan pengunjung memilih layanan Anda." /><Toggle label="Tampilkan Keunggulan" checked={site.whyChoose.visible} onChange={(v) => setSection("whyChoose", { ...site.whyChoose, visible: v })} /><div className="mt-4 space-y-4"><Field label="Judul" value={site.whyChoose.title} onChange={(v) => setSection("whyChoose", { ...site.whyChoose, title: v })} /><TextArea label="Deskripsi" value={site.whyChoose.description} onChange={(v) => setSection("whyChoose", { ...site.whyChoose, description: v })} /><TextArea label="Daftar Keunggulan" value={lineText(site.whyChoose.items)} onChange={(v) => setSection("whyChoose", { ...site.whyChoose, items: lines(v) })} hint="Satu keunggulan per baris." /><Toggle label="Tampilkan preview proses di sisi kanan" checked={site.whyChoose.showProcessPreview} onChange={(v) => setSection("whyChoose", { ...site.whyChoose, showProcessPreview: v })} /></div></section>
      </>}

      {active === "services" && <>
        <section className={cardClass}><SectionHeader title="Layanan" description="Tambah, edit, urutkan secara manual, atau nonaktifkan layanan yang tampil." /><Toggle label="Tampilkan Section Layanan" checked={site.services.visible} onChange={(v) => setSection("services", { ...site.services, visible: v })} /><div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Judul Section" value={site.services.title} onChange={(v) => setSection("services", { ...site.services, title: v })} /><Field label="Subjudul" value={site.services.subtitle} onChange={(v) => setSection("services", { ...site.services, subtitle: v })} /></div>
          <div className="mt-5 space-y-4">{site.services.items.map((item, i) => <div key={item.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"><div className="mb-3 flex items-center justify-between"><b>Layanan {i + 1}</b><button onClick={() => setSection("services", { ...site.services, items: site.services.items.filter((_, x) => x !== i) })} className="p-2 text-red-500"><Trash2 size={17} /></button></div><div className="grid gap-3 md:grid-cols-2"><Field label="Judul" value={item.title} onChange={(v) => { const a=[...site.services.items]; a[i]={...item,title:v}; setSection("services",{...site.services,items:a}); }} /><Field label="Icon" value={item.icon} onChange={(v) => { const a=[...site.services.items]; a[i]={...item,icon:v}; setSection("services",{...site.services,items:a}); }} hint="Contoh: Building2, Globe, Smartphone, Wrench" /><div className="md:col-span-2"><TextArea label="Deskripsi" value={item.description} onChange={(v) => { const a=[...site.services.items]; a[i]={...item,description:v}; setSection("services",{...site.services,items:a}); }} rows={3} /></div><Field label="Harga Mulai" value={item.startingPrice} onChange={(v) => { const a=[...site.services.items]; a[i]={...item,startingPrice:v}; setSection("services",{...site.services,items:a}); }} /><Field label="Durasi" value={item.duration} onChange={(v) => { const a=[...site.services.items]; a[i]={...item,duration:v}; setSection("services",{...site.services,items:a}); }} /><div className="md:col-span-2"><TextArea label="Fitur" value={lineText(item.features)} onChange={(v) => { const a=[...site.services.items]; a[i]={...item,features:lines(v)}; setSection("services",{...site.services,items:a}); }} hint="Satu fitur per baris." /></div><div className="md:col-span-2"><Toggle label="Aktif" checked={item.active} onChange={(v) => { const a=[...site.services.items]; a[i]={...item,active:v}; setSection("services",{...site.services,items:a}); }} /></div></div></div>)}</div>
          <button onClick={() => setSection("services", { ...site.services, items: [...site.services.items, { id: uid("svc"), title: "Layanan Baru", description: "", icon: "Globe", features: [], startingPrice: "Konsultasi", duration: "", active: true }] })} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-dashed border-primary-300 px-4 py-2.5 text-sm font-semibold text-primary-600"><Plus size={16} /> Tambah Layanan</button>
        </section>
        <section className={cardClass}><SectionHeader title="Paket Harga" description="Paket estimasi yang tampil di halaman utama." /><Toggle label="Tampilkan Harga" checked={site.pricing.visible} onChange={(v) => setSection("pricing", { ...site.pricing, visible: v })} /><div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Judul" value={site.pricing.title} onChange={(v) => setSection("pricing", { ...site.pricing, title: v })} /><Field label="Subjudul" value={site.pricing.subtitle} onChange={(v) => setSection("pricing", { ...site.pricing, subtitle: v })} /></div>
          <div className="mt-5 grid gap-4 xl:grid-cols-2">{site.pricing.items.map((item, i) => <div key={i} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"><div className="mb-3 flex justify-between"><b>Paket {i + 1}</b><button onClick={() => setSection("pricing", { ...site.pricing, items: site.pricing.items.filter((_, x) => x !== i) })} className="text-red-500"><Trash2 size={17} /></button></div><div className="space-y-3"><Field label="Nama" value={item.name} onChange={(v)=>{const a=[...site.pricing.items];a[i]={...item,name:v};setSection("pricing",{...site.pricing,items:a});}}/><Field label="Harga" value={item.price} onChange={(v)=>{const a=[...site.pricing.items];a[i]={...item,price:v};setSection("pricing",{...site.pricing,items:a});}}/><TextArea label="Fitur" value={lineText(item.features)} onChange={(v)=>{const a=[...site.pricing.items];a[i]={...item,features:lines(v)};setSection("pricing",{...site.pricing,items:a});}}/><Toggle label="Highlight paket ini" checked={!!item.highlighted} onChange={(v)=>{const a=[...site.pricing.items];a[i]={...item,highlighted:v};setSection("pricing",{...site.pricing,items:a});}}/></div></div>)}</div>
          <button onClick={() => setSection("pricing", { ...site.pricing, items: [...site.pricing.items, { name: "Paket Baru", price: "Konsultasi", features: [], highlighted: false }] })} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary-600"><Plus size={16} /> Tambah Paket</button>
        </section>
      </>}

      {active === "portfolio" && <section className={cardClass}><SectionHeader title="Tampilan Portfolio" description="Atur judul, pencarian, empty state, dan label tombol. Isi project tetap dikelola dari Portfolio CMS." /><Toggle label="Tampilkan Section Portfolio" checked={site.portfolio.visible} onChange={(v)=>setSection("portfolio",{...site.portfolio,visible:v})}/><div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Judul" value={site.portfolio.title} onChange={(v)=>setSection("portfolio",{...site.portfolio,title:v})}/><Field label="Subjudul" value={site.portfolio.subtitle} onChange={(v)=>setSection("portfolio",{...site.portfolio,subtitle:v})}/><Field label="Placeholder Pencarian" value={site.portfolio.searchPlaceholder} onChange={(v)=>setSection("portfolio",{...site.portfolio,searchPlaceholder:v})}/><Field label="Label Featured" value={site.portfolio.featuredLabel} onChange={(v)=>setSection("portfolio",{...site.portfolio,featuredLabel:v})}/><Field label="Judul Saat Kosong" value={site.portfolio.emptyTitle} onChange={(v)=>setSection("portfolio",{...site.portfolio,emptyTitle:v})}/><Field label="Penjelasan Saat Kosong" value={site.portfolio.emptyText} onChange={(v)=>setSection("portfolio",{...site.portfolio,emptyText:v})}/><Field label="Label Reset Filter" value={site.portfolio.resetLabel} onChange={(v)=>setSection("portfolio",{...site.portfolio,resetLabel:v})}/><Field label="Label Live Demo" value={site.portfolio.demoLabel} onChange={(v)=>setSection("portfolio",{...site.portfolio,demoLabel:v})}/><Field label="Label Detail" value={site.portfolio.detailLabel} onChange={(v)=>setSection("portfolio",{...site.portfolio,detailLabel:v})}/><Field label="Label Order Serupa" value={site.portfolio.orderLabel} onChange={(v)=>setSection("portfolio",{...site.portfolio,orderLabel:v})}/><Field label="Label Kembali" value={site.portfolio.backLabel} onChange={(v)=>setSection("portfolio",{...site.portfolio,backLabel:v})}/><Field label="Label Fullscreen" value={site.portfolio.fullscreenLabel} onChange={(v)=>setSection("portfolio",{...site.portfolio,fullscreenLabel:v})}/></div><div className="mt-5"><Link href="/admin/portfolio" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-slate-900"><Images size={16}/> Kelola Item Portfolio</Link></div></section>}

      {active === "process" && <section className={cardClass}><SectionHeader title="Cara Kerja" description="Tahapan proses yang digunakan di halaman utama dan halaman Proses." /><Toggle label="Tampilkan Section Proses" checked={site.process.visible} onChange={(v) => setSection("process", { ...site.process, visible: v })} /><div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Judul" value={site.process.title} onChange={(v) => setSection("process", { ...site.process, title: v })} /><Field label="Subjudul" value={site.process.subtitle} onChange={(v) => setSection("process", { ...site.process, subtitle: v })} /></div><div className="mt-5 space-y-3">{site.process.items.map((item,i)=><div key={i} className="grid gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800 md:grid-cols-[100px_1fr_2fr_auto]"><input className={inputClass} value={item.step} onChange={(e)=>{const a=[...site.process.items];a[i]={...item,step:e.target.value};setSection("process",{...site.process,items:a});}}/><input className={inputClass} value={item.title} onChange={(e)=>{const a=[...site.process.items];a[i]={...item,title:e.target.value};setSection("process",{...site.process,items:a});}}/><input className={inputClass} value={item.description} onChange={(e)=>{const a=[...site.process.items];a[i]={...item,description:e.target.value};setSection("process",{...site.process,items:a});}}/><button onClick={()=>setSection("process",{...site.process,items:site.process.items.filter((_,x)=>x!==i)})} className="p-3 text-red-500"><Trash2 size={17}/></button></div>)}</div><button onClick={()=>setSection("process",{...site.process,items:[...site.process.items,{step:String(site.process.items.length+1).padStart(2,"0"),title:"Tahap Baru",description:""}]})} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary-600"><Plus size={16}/> Tambah Tahap</button></section>}

      {active === "testimonials" && <section className={cardClass}><SectionHeader title="Testimonial" description="Hanya masukkan testimoni asli. Item berstatus nonaktif tidak ditampilkan ke publik." /><Toggle label="Tampilkan Section Testimonial" checked={site.testimonials.visible} onChange={(v)=>setSection("testimonials",{...site.testimonials,visible:v})}/><div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Judul" value={site.testimonials.title} onChange={(v)=>setSection("testimonials",{...site.testimonials,title:v})}/><Field label="Subjudul" value={site.testimonials.subtitle} onChange={(v)=>setSection("testimonials",{...site.testimonials,subtitle:v})}/><Field label="Judul Saat Kosong" value={site.testimonials.emptyTitle} onChange={(v)=>setSection("testimonials",{...site.testimonials,emptyTitle:v})}/><Field label="Penjelasan Saat Kosong" value={site.testimonials.emptyText} onChange={(v)=>setSection("testimonials",{...site.testimonials,emptyText:v})}/></div><div className="mt-5 grid gap-4 xl:grid-cols-2">{site.testimonials.items.map((item,i)=><div key={item.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"><div className="mb-3 flex justify-between"><b>Testimonial {i+1}</b><button onClick={()=>setSection("testimonials",{...site.testimonials,items:site.testimonials.items.filter((_,x)=>x!==i)})} className="text-red-500"><Trash2 size={17}/></button></div><div className="space-y-3"><Field label="Nama Customer" value={item.name} onChange={(v)=>{const a=[...site.testimonials.items];a[i]={...item,name:v};setSection("testimonials",{...site.testimonials,items:a});}}/><Field label="Bisnis / Instansi" value={item.business} onChange={(v)=>{const a=[...site.testimonials.items];a[i]={...item,business:v};setSection("testimonials",{...site.testimonials,items:a});}}/><TextArea label="Testimoni" value={item.message} onChange={(v)=>{const a=[...site.testimonials.items];a[i]={...item,message:v};setSection("testimonials",{...site.testimonials,items:a});}}/><Field label="Rating (1-5)" value={String(item.rating)} onChange={(v)=>{const a=[...site.testimonials.items];a[i]={...item,rating:Math.min(5,Math.max(1,Number(v)||5))};setSection("testimonials",{...site.testimonials,items:a});}} type="number"/><Toggle label="Publish" checked={item.published} onChange={(v)=>{const a=[...site.testimonials.items];a[i]={...item,published:v};setSection("testimonials",{...site.testimonials,items:a});}}/></div></div>)}</div><button onClick={()=>setSection("testimonials",{...site.testimonials,items:[...site.testimonials.items,{id:uid("testi"),name:"",business:"",message:"",rating:5,published:false}]})} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-dashed border-primary-300 px-4 py-2.5 text-sm font-semibold text-primary-600"><Plus size={16}/> Tambah Testimonial</button></section>}

      {active === "faq" && <section className={cardClass}><SectionHeader title="FAQ" description="Kelola pertanyaan yang sering diajukan dan urutannya." /><Toggle label="Tampilkan FAQ" checked={site.faq.visible} onChange={(v)=>setSection("faq",{...site.faq,visible:v})}/><div className="mt-4 grid gap-4 md:grid-cols-3"><Field label="Eyebrow" value={site.faq.eyebrow} onChange={(v)=>setSection("faq",{...site.faq,eyebrow:v})}/><Field label="Judul" value={site.faq.title} onChange={(v)=>setSection("faq",{...site.faq,title:v})}/><Field label="Subjudul" value={site.faq.subtitle} onChange={(v)=>setSection("faq",{...site.faq,subtitle:v})}/></div><div className="mt-5 space-y-4">{site.faq.items.map((item,i)=><div key={item.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"><div className="grid gap-3 md:grid-cols-[1fr_auto]"><div className="space-y-3"><Field label={`Pertanyaan ${i+1}`} value={item.question} onChange={(v)=>{const a=[...site.faq.items];a[i]={...item,question:v};setSection("faq",{...site.faq,items:a});}}/><TextArea label="Jawaban" value={item.answer} onChange={(v)=>{const a=[...site.faq.items];a[i]={...item,answer:v};setSection("faq",{...site.faq,items:a});}}/><Toggle label="Publish" checked={item.published} onChange={(v)=>{const a=[...site.faq.items];a[i]={...item,published:v};setSection("faq",{...site.faq,items:a});}}/></div><button onClick={()=>setSection("faq",{...site.faq,items:site.faq.items.filter((_,x)=>x!==i)})} className="self-start p-2 text-red-500"><Trash2 size={17}/></button></div></div>)}</div><button onClick={()=>setSection("faq",{...site.faq,items:[...site.faq.items,{id:uid("faq"),question:"Pertanyaan baru",answer:"",published:true}]})} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary-600"><Plus size={16}/> Tambah FAQ</button></section>}

      {active === "about" && <>
        <section className={cardClass}><SectionHeader title="Halaman Tentang" description="Konten utama halaman /about." /><div className="space-y-4"><Field label="Judul" value={site.about.title} onChange={(v)=>setSection("about",{...site.about,title:v})}/><TextArea label="Lead" value={site.about.lead} onChange={(v)=>setSection("about",{...site.about,lead:v})}/><TextArea label="Paragraf Tentang" value={lineText(site.about.paragraphs)} onChange={(v)=>setSection("about",{...site.about,paragraphs:lines(v)})} hint="Satu paragraf per baris."/><Field label="Judul Prinsip" value={site.about.principlesTitle} onChange={(v)=>setSection("about",{...site.about,principlesTitle:v})}/><TextArea label="Daftar Prinsip" value={lineText(site.about.principles)} onChange={(v)=>setSection("about",{...site.about,principles:lines(v)})} hint="Satu prinsip per baris."/></div></section>
        <section className={cardClass}><SectionHeader title="Tim / Profil" description="Section opsional. Aktifkan jika ingin menampilkan anggota tim atau profil developer." /><Toggle label="Tampilkan Tim" checked={site.team.visible} onChange={(v)=>setSection("team",{...site.team,visible:v})}/><div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Judul" value={site.team.title} onChange={(v)=>setSection("team",{...site.team,title:v})}/><Field label="Subjudul" value={site.team.subtitle} onChange={(v)=>setSection("team",{...site.team,subtitle:v})}/></div><div className="mt-5 grid gap-4 xl:grid-cols-2">{site.team.items.map((item,i)=><div key={item.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"><div className="mb-3 flex justify-between"><b>Profil {i+1}</b><button onClick={()=>setSection("team",{...site.team,items:site.team.items.filter((_,x)=>x!==i)})} className="text-red-500"><Trash2 size={17}/></button></div><div className="space-y-3"><Field label="Nama" value={item.name} onChange={(v)=>{const a=[...site.team.items];a[i]={...item,name:v};setSection("team",{...site.team,items:a});}}/><Field label="Peran" value={item.role} onChange={(v)=>{const a=[...site.team.items];a[i]={...item,role:v};setSection("team",{...site.team,items:a});}}/><TextArea label="Bio" value={item.bio} onChange={(v)=>{const a=[...site.team.items];a[i]={...item,bio:v};setSection("team",{...site.team,items:a});}}/><Field label="URL Foto" value={item.image} onChange={(v)=>{const a=[...site.team.items];a[i]={...item,image:v};setSection("team",{...site.team,items:a});}}/><TextArea label="Keahlian" value={lineText(item.skills)} onChange={(v)=>{const a=[...site.team.items];a[i]={...item,skills:lines(v)};setSection("team",{...site.team,items:a});}}/><Toggle label="Aktif" checked={item.active} onChange={(v)=>{const a=[...site.team.items];a[i]={...item,active:v};setSection("team",{...site.team,items:a});}}/></div></div>)}</div><button onClick={()=>setSection("team",{...site.team,items:[...site.team.items,{id:uid("team"),name:"",role:"",bio:"",image:"",skills:[],active:true}]})} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary-600"><Plus size={16}/> Tambah Profil</button></section>
      </>}

      {active === "contact" && <>
        <section className={cardClass}><SectionHeader title="Halaman Kontak" description="Judul dan deskripsi kartu kontak. Nomor/email/link mengambil dari Identitas Brand." /><div className="grid gap-4 md:grid-cols-2"><Field label="Judul Halaman" value={site.contact.title} onChange={(v)=>setSection("contact",{...site.contact,title:v})}/><Field label="Subjudul" value={site.contact.subtitle} onChange={(v)=>setSection("contact",{...site.contact,subtitle:v})}/><Field label="Judul WhatsApp" value={site.contact.whatsappTitle} onChange={(v)=>setSection("contact",{...site.contact,whatsappTitle:v})}/><Field label="Deskripsi WhatsApp" value={site.contact.whatsappDescription} onChange={(v)=>setSection("contact",{...site.contact,whatsappDescription:v})}/><Field label="Judul Email" value={site.contact.emailTitle} onChange={(v)=>setSection("contact",{...site.contact,emailTitle:v})}/><Field label="Deskripsi Email" value={site.contact.emailDescription} onChange={(v)=>setSection("contact",{...site.contact,emailDescription:v})}/><Field label="Judul Instagram" value={site.contact.instagramTitle} onChange={(v)=>setSection("contact",{...site.contact,instagramTitle:v})}/><Field label="Deskripsi Instagram" value={site.contact.instagramDescription} onChange={(v)=>setSection("contact",{...site.contact,instagramDescription:v})}/><Field label="Judul GitHub" value={site.contact.githubTitle} onChange={(v)=>setSection("contact",{...site.contact,githubTitle:v})}/><Field label="Deskripsi GitHub" value={site.contact.githubDescription} onChange={(v)=>setSection("contact",{...site.contact,githubDescription:v})}/></div></section>
        <section className={cardClass}><SectionHeader title="CTA Global" description="Ajakan bertindak di bagian bawah halaman." /><Toggle label="Tampilkan CTA" checked={site.cta.visible} onChange={(v)=>setSection("cta",{...site.cta,visible:v})}/><div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Judul" value={site.cta.title} onChange={(v)=>setSection("cta",{...site.cta,title:v})}/><Field label="Subjudul" value={site.cta.subtitle} onChange={(v)=>setSection("cta",{...site.cta,subtitle:v})}/><Field label="Tombol Utama" value={site.cta.primaryLabel} onChange={(v)=>setSection("cta",{...site.cta,primaryLabel:v})}/><Field label="Link Tombol Utama" value={site.cta.primaryHref} onChange={(v)=>setSection("cta",{...site.cta,primaryHref:v})}/><Field label="Tombol Kedua" value={site.cta.secondaryLabel} onChange={(v)=>setSection("cta",{...site.cta,secondaryLabel:v})}/><Field label="Link Tombol Kedua" value={site.cta.secondaryHref} onChange={(v)=>setSection("cta",{...site.cta,secondaryHref:v})}/></div></section>
      </>}

      {active === "footer" && <section className={cardClass}><SectionHeader title="Footer" description="Konten bagian paling bawah website." /><div className="space-y-4"><TextArea label="Deskripsi Brand" value={site.footer.description} onChange={(v)=>setSection("footer",{...site.footer,description:v})}/><Field label="Copyright" value={site.footer.copyright} onChange={(v)=>setSection("footer",{...site.footer,copyright:v})} hint="Gunakan {year} untuk tahun otomatis."/><div className="grid gap-4 md:grid-cols-2"><Field label="Judul Kolom Navigasi" value={site.footer.navigationTitle} onChange={(v)=>setSection("footer",{...site.footer,navigationTitle:v})}/><Field label="Judul Kolom Akun" value={site.footer.accountTitle} onChange={(v)=>setSection("footer",{...site.footer,accountTitle:v})}/></div><Toggle label="Tampilkan Login Customer" checked={site.footer.showCustomerLogin} onChange={(v)=>setSection("footer",{...site.footer,showCustomerLogin:v})}/><Toggle label="Tampilkan Login Admin" checked={site.footer.showAdminLogin} onChange={(v)=>setSection("footer",{...site.footer,showAdminLogin:v})}/></div></section>}

      {active === "seo" && <section className={cardClass}><SectionHeader title="SEO Website" description="Metadata utama dan per halaman. Perubahan SEO dapat membutuhkan waktu sebelum terlihat di Google." /><div className="space-y-4"><Field label="Site Title" value={site.seo.siteTitle} onChange={(v)=>setSection("seo",{...site.seo,siteTitle:v})}/><Field label="Template Title" value={site.seo.titleTemplate} onChange={(v)=>setSection("seo",{...site.seo,titleTemplate:v})} hint="Gunakan %s sebagai judul halaman."/><TextArea label="Meta Description Global" value={site.seo.description} onChange={(v)=>setSection("seo",{...site.seo,description:v})}/><TextArea label="Keywords" value={lineText(site.seo.keywords)} onChange={(v)=>setSection("seo",{...site.seo,keywords:lines(v)})} hint="Satu keyword per baris."/><div className="grid gap-4 md:grid-cols-2"><Field label="Area Layanan" value={site.seo.areaServed} onChange={(v)=>setSection("seo",{...site.seo,areaServed:v})}/><Field label="Price Range" value={site.seo.priceRange} onChange={(v)=>setSection("seo",{...site.seo,priceRange:v})}/></div><div className="pt-3"><h3 className="mb-3 font-bold">Metadata Per Halaman</h3><div className="space-y-4">{Object.entries(site.seo.pages).map(([key,item])=><div key={key} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"><div className="mb-3 text-xs font-black uppercase tracking-widest text-primary-600">{key}</div><div className="grid gap-3 md:grid-cols-2"><Field label="Title" value={item.title} onChange={(v)=>setSection("seo",{...site.seo,pages:{...site.seo.pages,[key]:{...item,title:v}}})}/><Field label="Description" value={item.description} onChange={(v)=>setSection("seo",{...site.seo,pages:{...site.seo.pages,[key]:{...item,description:v}}})}/></div></div>)}</div></div></div></section>}
    </div>

    <div className="fixed bottom-4 left-4 right-4 z-30 flex justify-end lg:left-72">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-dark-surface/95">
        <span className="hidden text-sm text-slate-500 sm:block">Menyimpan: <b className="text-slate-900 dark:text-white">{group.label}</b></span>
        <button onClick={() => void saveCurrent()} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary-600/20 hover:bg-primary-700 disabled:opacity-60">{saving ? <RefreshCw size={17} className="animate-spin"/> : <Save size={17}/>} {saving ? "Menyimpan..." : "Simpan Perubahan"}</button>
      </div>
    </div>
  </div>;
}
