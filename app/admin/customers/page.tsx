"use client";
import { useEffect, useState, useCallback } from "react";
import { gasGet } from "@/lib/gas-client";
import { AdminAuthService } from "@/lib/services/auth.service";
import { LoadingSpinner, ErrorState, EmptyState } from "@/components/ui";
import { MessageCircle, Mail, RefreshCw } from "lucide-react";

interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  business: string;
  status: string;
  createdAt: string;
  lastActivity: string;
}

function waLink(number: string): string {
  let n = String(number).replace(/[^0-9]/g, "");
  if (n.startsWith("0")) n = "62" + n.slice(1);
  return "https://wa.me/" + n;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const token = AdminAuthService.getToken();
    const res = await gasGet<AdminCustomer[]>("getCustomers", {
      token: token || "",
    });
    if (res.success && res.data) {
      setCustomers(res.data);
    } else {
      setError(res.error || "Gagal memuat customers");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Customers</h1>
          <p className="text-slate-600 dark:text-slate-400">
            {customers.length} customer terdaftar
          </p>
        </div>
        <button
          onClick={load}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Refresh"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : customers.length === 0 ? (
          <EmptyState
            title="Belum ada customer"
            description="Customer akan otomatis terdaftar saat membuat order pertama."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                  <th className="px-5 py-3 font-medium">Nama</th>
                  <th className="px-5 py-3 font-medium">Kontak</th>
                  <th className="px-5 py-3 font-medium">Bisnis</th>
                  <th className="px-5 py-3 font-medium">Terdaftar</th>
                  <th className="px-5 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/30"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold">
                          {c.name ? c.name.charAt(0).toUpperCase() : "?"}
                        </div>
                        <div className="font-medium">{c.name}</div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <Mail size={12} /> {c.email}
                        </span>
                        <span className="text-slate-500 text-xs">{c.whatsapp}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">{c.business || "-"}</td>
                    <td className="px-5 py-4 text-slate-500">
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleDateString("id-ID")
                        : "-"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <a
                          href={waLink(c.whatsapp)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 transition-colors"
                          aria-label="Chat WhatsApp"
                        >
                          <MessageCircle size={16} />
                        </a>
                        <a
                          href={"mailto:" + c.email}
                          className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors"
                          aria-label="Kirim email"
                        >
                          <Mail size={16} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
