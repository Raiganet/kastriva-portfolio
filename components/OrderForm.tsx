"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, CheckCircle } from "lucide-react";
import { config, getWhatsAppLink } from "@/data/config";
import { OrderStatus } from "@/lib/types/order";

export default function OrderForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "", 
    business: "", 
    email: "", 
    whatsapp: "", 
    type: "Website", 
    budget: "", 
    deadline: "", 
    description: "", 
    features: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulasi proses pengiriman (Ganti dengan API call ke backend Anda nanti)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Format pesan WhatsApp
    const message = `Halo Kastriva, saya ingin memesan jasa pembuatan *${formData.type}*.
    
*Detail Project:*
- Nama: ${formData.name}
- Bisnis: ${formData.business}
- Email: ${formData.email}
- WhatsApp: ${formData.whatsapp}
- Budget: ${formData.budget}
- Deadline: ${formData.deadline}
- Deskripsi: ${formData.description}
- Fitur Dibutuhkan: ${formData.features}`;
    
    // Redirect ke WhatsApp (atau simpan ke database jika sudah ada backend)
    window.open(getWhatsAppLink(message), "_blank");
    
    setLoading(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 5000);
    setFormData({ 
      name: "", 
      business: "", 
      email: "", 
      whatsapp: "", 
      type: "Website", 
      budget: "", 
      deadline: "", 
      description: "", 
      features: "" 
    });
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-white dark:bg-dark-bg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm";

  return (
    <section id="order" className="py-20 bg-slate-50 dark:bg-dark-surface/50">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Mulai Project Anda</h2>
          <p className="text-slate-600 dark:text-slate-400">Isi form di bawah ini untuk mendiskusikan kebutuhan digital Anda.</p>
        </div>

        <motion.form 
          initial={{ opacity: 0, y: 20 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }} 
          onSubmit={handleSubmit} 
          className="bg-white dark:bg-dark-bg p-6 md:p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 space-y-5"
        >
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-4 rounded-xl flex items-center gap-3 border border-green-200 dark:border-green-800">
              <CheckCircle size={20} /> Data berhasil dikirim! Anda akan diarahkan ke WhatsApp.
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-2">Nama Lengkap *</label>
              <input 
                required 
                type="text" 
                className={inputClass} 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nama Bisnis/Organisasi</label>
              <input 
                type="text" 
                className={inputClass} 
                value={formData.business} 
                onChange={e => setFormData({...formData, business: e.target.value})} 
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-2">Email *</label>
              <input 
                required 
                type="email" 
                className={inputClass} 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nomor WhatsApp *</label>
              <input 
                required 
                type="tel" 
                className={inputClass} 
                value={formData.whatsapp} 
                onChange={e => setFormData({...formData, whatsapp: e.target.value})} 
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium mb-2">Jenis Project *</label>
              <select 
                required 
                className={inputClass} 
                value={formData.type} 
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                {["Website", "Landing Page", "Company Profile", "Web App", "Dashboard", "Sistem Informasi", "Android App", "Custom"].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Estimasi Budget</label>
              <select 
                className={inputClass} 
                value={formData.budget} 
                onChange={e => setFormData({...formData, budget: e.target.value})}
              >
                <option value="">Pilih Range</option>
                <option value="< 5 Juta">{'<'} 5 Juta</option>
                <option value="5 - 15 Juta">5 - 15 Juta</option>
                <option value="15 - 50 Juta">15 - 50 Juta</option>
                <option value="> 50 Juta">{'>'} 50 Juta</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Target Deadline</label>
              <input 
                type="text" 
                placeholder="Contoh: 1 bulan" 
                className={inputClass} 
                value={formData.deadline} 
                onChange={e => setFormData({...formData, deadline: e.target.value})} 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Deskripsi Kebutuhan & Referensi</label>
            <textarea 
              required 
              rows={4} 
              className={inputClass} 
              placeholder="Jelaskan secara singkat apa yang Anda butuhkan. Sertakan link referensi website jika ada." 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Fitur Utama yang Dibutuhkan</label>
            <input 
              type="text" 
              className={inputClass} 
              placeholder="Contoh: Login, Payment Gateway, Dashboard Admin" 
              value={formData.features} 
              onChange={e => setFormData({...formData, features: e.target.value})} 
            />
          </div>

          <button 
            disabled={loading} 
            type="submit" 
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            {loading ? "Mengirim..." : "Kirim Permintaan Project"}
          </button>
          
          <p className="text-xs text-center text-slate-500 mt-4">
            *Data Anda aman. Kami akan membalas dalam waktu 1x24 jam pada hari kerja.
          </p>
        </motion.form>
      </div>
    </section>
  );
}
