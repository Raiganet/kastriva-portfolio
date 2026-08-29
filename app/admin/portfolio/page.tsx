"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { gasGet, gasPost } from "@/lib/gas-client";
import { AdminAuthService } from "@/lib/services/auth.service";
import { LoadingSpinner, ErrorState, EmptyState, ImageWithFallback } from "@/components/ui";
import { PortfolioProject } from "@/lib/types/portfolio";
import {
  ExternalLink, Eye, EyeOff, Image as ImageIcon, Link2, Pencil,
  Plus, Save, Search, Star, Trash2, X, Github, RefreshCw
} from "lucide-react";

interface CmsProject extends PortfolioProject {
  shortDescription?: string;
  sortOrder?: number;
}

type FormState = {
  id?: string | number;
  title: string;
  category: string;
  description: string;
  shortDescription: string;
  image: string;
  images: string;
  technologies: string;
  demoUrl: string;
  githubUrl: string;
  year: string;
  status: string;
  problemSolved: string;
  solution: string;
  features: string;
  myRole: string;
  featured: boolean;
  published: boolean;
  sortOrder: string;
};

const emptyForm: FormState = {
  title: "", category: "Sistem Informasi", description: "", shortDescription: "", image: "",
  images: "", technologies: "", demoUrl: "", githubUrl: "", year: String(new Date().getFullYear()),
  status: "Completed", problemSolved: "", solution: "", features: "", myRole: "",
  featured: false, published: true, sortOrder: "999",
};

function splitLines(value: string) {
  return value.split(/[\n,]/).map((v) => v.trim()).filter(Boolean);
}

function joinLines(value: unknown) {
  return Array.isArray(value) ? value.join("\n") : "";
}

function asBool(value: unknown) {
  return value === true || value === 1 || value === "1" || value === "TRUE" || value === "true";
}

function projectToForm(p: CmsProject): FormState {
  return {
    id: p.id,
    title: p.title || "",
    category: p.category || "Sistem Informasi",
    description: p.description || "",
    shortDescription: p.shortDescription || "",
    image: p.image || "",
    images: joinLines(p.images),
    technologies: joinLines(p.technologies),
    demoUrl: p.demoUrl || "",
    githubUrl: p.githubUrl || "",
    year: p.year || String(new Date().getFullYear()),
    status: p.status || "Completed",
    problemSolved: p.problemSolved || "",
    solution: p.solution || "",
    features: joinLines(p.features),
    myRole: p.myRole || "",
    featured: asBool(p.featured),
    published: asBool(p.published),
    sortOrder: String(p.sortOrder || 999),
  };
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

const inputClass = "w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-bg px-3.5 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10";

export default function AdminPortfolioPage() {
  const [projects, setProjects] = useState<CmsProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | number | null>(null);

  const token = () => AdminAuthService.getToken() || "";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await gasGet<CmsProject[]>("getPortfolioAdmin", { token: token(), search });
    if (res.success && res.data) setProjects(res.data);
    else setError(res.error || "Gagal memuat portfolio");
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const publishedCount = useMemo(() => projects.filter((p) => p.published).length, [projects]);
  const featuredCount = useMemo(() => projects.filter((p) => p.featured).length, [projects]);

  const openCreate = () => { setForm({ ...emptyForm }); setEditorOpen(true); };
  const openEdit = (p: CmsProject) => { setForm(projectToForm(p)); setEditorOpen(true); };
  const set = (key: keyof FormState, value: string | boolean) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.category.trim() || !form.description.trim() || !form.image.trim()) {
      alert("Judul, kategori, deskripsi, dan URL gambar utama wajib diisi.");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      technologies: splitLines(form.technologies),
      images: splitLines(form.images),
      features: splitLines(form.features),
      sortOrder: Number(form.sortOrder) || 999,
    };
    const res = await gasPost({ action: form.id ? "updatePortfolio" : "createPortfolio", token: token(), ...payload });
    setSaving(false);
    if (!res.success) { alert(res.error || "Gagal menyimpan portfolio"); return; }
    setEditorOpen(false);
    await load();
  };

  const remove = async (p: CmsProject) => {
    if (!window.confirm(`Hapus project “${p.title}”?\n\nData portfolio dan gallery-nya akan dihapus dari Google Sheets.`)) return;
    setDeleting(p.id);
    const res = await gasPost({ action: "deletePortfolio", token: token(), id: p.id });
    setDeleting(null);
    if (!res.success) alert(res.error || "Gagal menghapus portfolio");
    else await load();
  };

  return (
    <div>
      <div className="mb-7 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-primary-600">
            <ImageIcon size={14} /> Content Management System
          </div>
          <h1 className="text-3xl font-black tracking-tight">Portfolio CMS</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">Tambah, edit, publish, dan pasang link demo website tanpa mengubah kode.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-surface px-4 py-2 text-sm"><b>{projects.length}</b> project</div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-surface px-4 py-2 text-sm"><b>{publishedCount}</b> tampil</div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-surface px-4 py-2 text-sm"><b>{featuredCount}</b> featured</div>
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-600/20 hover:bg-primary-700"><Plus size={17} /> Tambah Project</button>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari project atau kategori..." className={`${inputClass} pl-10`} />
        </div>
        <button onClick={load} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-surface px-4 py-3 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"><RefreshCw size={17} /> Refresh</button>
      </div>

      {loading ? <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div> : error ? <ErrorState message={error} onRetry={load} /> : projects.length === 0 ? <EmptyState title="Belum ada portfolio" description="Klik Tambah Project untuk memasukkan website/demo pertama Anda." icon={<ImageIcon className="text-slate-400" size={32} />} /> : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <article key={String(p.id)} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-dark-surface">
              <div className="relative h-48 bg-slate-100 dark:bg-slate-900">
                <ImageWithFallback src={p.image} alt={p.title} fill className="object-cover transition duration-500 group-hover:scale-105" fallbackIcon={<ImageIcon className="text-slate-400" size={42} />} />
                <div className="absolute inset-x-3 top-3 flex justify-between gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold backdrop-blur ${p.published ? "bg-emerald-500 text-white" : "bg-slate-900/80 text-white"}`}>{p.published ? "Published" : "Draft"}</span>
                  {p.featured && <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-bold text-white"><Star size={12} fill="currentColor" /> Featured</span>}
                </div>
              </div>
              <div className="p-5">
                <div className="mb-2 flex items-center justify-between gap-3"><span className="rounded-md bg-primary-50 px-2 py-1 text-[11px] font-bold text-primary-600 dark:bg-primary-900/30 dark:text-primary-300">{p.category}</span><span className="text-xs text-slate-400">{p.year}</span></div>
                <h2 className="line-clamp-1 text-lg font-black">{p.title}</h2>
                <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600 dark:text-slate-400">{p.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">{(p.technologies || []).slice(0, 4).map((t) => <span key={t} className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">{t}</span>)}</div>
                <div className="mt-4 flex items-center gap-2">
                  {p.demoUrl ? <a href={p.demoUrl} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-bold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"><ExternalLink size={14} /> Demo</a> : <span className="flex-1 rounded-lg bg-slate-50 py-2 text-center text-xs text-slate-400 dark:bg-slate-900">Demo belum ada</span>}
                  <button onClick={() => openEdit(p)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-xs font-bold text-white hover:bg-primary-700"><Pencil size={14} /> Edit</button>
                  <button onClick={() => remove(p)} disabled={deleting === p.id} className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:hover:bg-red-950/30" aria-label="Hapus"><Trash2 size={15} /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6">
          <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-dark-bg">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-7">
              <div><p className="text-xs font-bold uppercase tracking-[.18em] text-primary-600">Portfolio CMS</p><h2 className="mt-1 text-xl font-black">{form.id ? "Edit Project" : "Tambah Project Baru"}</h2></div>
              <button onClick={() => setEditorOpen(false)} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={20} /></button>
            </div>
            <form onSubmit={submit} className="overflow-y-auto p-5 sm:p-7">
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="space-y-4">
                  <Field label="Judul Project *"><input className={inputClass} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Contoh: Sistem Informasi RT 32" /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Kategori *"><input className={inputClass} value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="Sistem Informasi" /></Field>
                    <Field label="Tahun"><input className={inputClass} value={form.year} onChange={(e) => set("year", e.target.value)} placeholder="2026" /></Field>
                  </div>
                  <Field label="Deskripsi *"><textarea className={`${inputClass} min-h-28 resize-y`} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Jelaskan project secara singkat..." /></Field>
                  <Field label="Deskripsi Pendek" hint="Dipakai sebagai ringkasan jika diperlukan."><textarea className={`${inputClass} min-h-20 resize-y`} value={form.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} /></Field>
                  <Field label="Gambar Utama *" hint="Bisa URL Vercel/Cloudinary/Google Drive direct image. Contoh: https://.../cover.webp"><input className={inputClass} value={form.image} onChange={(e) => set("image", e.target.value)} placeholder="https://.../cover.webp" /></Field>
                  <Field label="Gallery Images" hint="Satu URL per baris. Gallery akan tampil di halaman detail project."><textarea className={`${inputClass} min-h-24 resize-y`} value={form.images} onChange={(e) => set("images", e.target.value)} placeholder="https://.../screen-1.webp\nhttps://.../screen-2.webp" /></Field>
                  <Field label="Teknologi" hint="Satu item per baris, atau pisahkan dengan koma."><textarea className={`${inputClass} min-h-20 resize-y`} value={form.technologies} onChange={(e) => set("technologies", e.target.value)} placeholder="Next.js\nTypeScript\nPostgreSQL" /></Field>
                </div>

                <div className="space-y-4">
                  <Field label="Live Demo URL" hint="Link tombol Live Demo di website portfolio."><div className="relative"><Link2 className="absolute left-3.5 top-3.5 text-slate-400" size={16} /><input className={`${inputClass} pl-10`} value={form.demoUrl} onChange={(e) => set("demoUrl", e.target.value)} placeholder="https://demo-website.vercel.app" /></div></Field>
                  <Field label="GitHub URL"><div className="relative"><Github className="absolute left-3.5 top-3.5 text-slate-400" size={16} /><input className={`${inputClass} pl-10`} value={form.githubUrl} onChange={(e) => set("githubUrl", e.target.value)} placeholder="https://github.com/..." /></div></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Status"><select className={inputClass} value={form.status} onChange={(e) => set("status", e.target.value)}><option>Completed</option><option>In Progress</option><option>Draft</option><option>Archived</option></select></Field>
                    <Field label="Urutan"><input type="number" min="1" className={inputClass} value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} /></Field>
                  </div>
                  <Field label="Masalah yang Diselesaikan"><textarea className={`${inputClass} min-h-20 resize-y`} value={form.problemSolved} onChange={(e) => set("problemSolved", e.target.value)} /></Field>
                  <Field label="Solusi"><textarea className={`${inputClass} min-h-20 resize-y`} value={form.solution} onChange={(e) => set("solution", e.target.value)} /></Field>
                  <Field label="Fitur"><textarea className={`${inputClass} min-h-20 resize-y`} value={form.features} onChange={(e) => set("features", e.target.value)} placeholder="Dashboard\nLaporan\nAuthentication" /></Field>
                  <Field label="Peran"><input className={inputClass} value={form.myRole} onChange={(e) => set("myRole", e.target.value)} placeholder="Fullstack Developer & UI/UX Designer" /></Field>
                  <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                    <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={form.published} onChange={(e) => set("published", e.target.checked)} className="h-4 w-4 accent-primary-600" /> <span className="flex items-center gap-1.5">{form.published ? <Eye size={15} /> : <EyeOff size={15} />} Tampilkan</span></label>
                    <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="h-4 w-4 accent-amber-500" /> <span className="flex items-center gap-1.5"><Star size={15} /> Featured</span></label>
                  </div>
                </div>
              </div>

              {form.image && <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800"><div className="relative h-44 bg-slate-100 dark:bg-slate-900"><ImageWithFallback src={form.image} alt="Preview" fill className="object-cover" fallbackIcon={<ImageIcon className="text-slate-400" size={36} />} /></div><div className="px-4 py-3 text-xs text-slate-500">Preview gambar utama</div></div>}

              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setEditorOpen(false)} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">Batal</button>
                <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary-600/20 hover:bg-primary-700 disabled:opacity-60">{saving ? <LoadingSpinner size="sm" /> : <Save size={17} />} {saving ? "Menyimpan..." : form.id ? "Simpan Perubahan" : "Tambah Project"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
