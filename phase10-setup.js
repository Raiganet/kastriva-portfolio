const fs = require('fs');
const path = require('path');

function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Created: ' + filePath);
}

console.log('\n🚀 Memulai Phase 10: Customer Dashboard + Quotation...\n');

// ====== 1. GAS: CustomerAuth ======
writeFile('google-apps-script/CustomerAuth.gs', `/**
 * KASTRIVA - Customer Authentication (Phase 10)
 * Login dengan Email + Nomor Order (pair credential yang hanya dimiliki customer)
 */

const CustomerAuth = {

  login: function(email, orderNumber) {
    try {
      if (!email || !orderNumber) {
        return { success: false, error: 'Email dan nomor order wajib diisi' };
      }

      const sheet = Config.getSheet('Orders');
      const data = sheet.getDataRange().getValues();

      for (var i = 1; i < data.length; i++) {
        if (String(data[i][1]).toUpperCase() === String(orderNumber).toUpperCase()) {
          const orderEmail = String(data[i][5]).toLowerCase();

          if (orderEmail !== String(email).toLowerCase()) {
            return { success: false, error: 'Email tidak cocok dengan order ini' };
          }

          const customerId = data[i][2];
          const customerName = data[i][3];
          const token = Utilities.base64Encode('cust:' + customerId + ':' + Date.now() + ':' + Math.random());

          const sessions = this.getSessions();
          sessions[token] = {
            customerId: customerId,
            email: orderEmail,
            name: customerName,
            createdAt: Date.now(),
            expiresAt: Date.now() + Config.SESSION_DURATION
          };
          this.saveSessions(sessions);

          Utils.logAudit('customer_login', customerId, { orderNumber: orderNumber });

          return {
            success: true,
            data: { token: token, customerId: customerId, name: customerName }
          };
        }
      }

      return { success: false, error: 'Order tidak ditemukan' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  verify: function(token) {
    if (!token) return { success: false, error: 'No token provided' };

    const sessions = this.getSessions();
    const session = sessions[token];

    if (!session) return { success: false, error: 'Invalid token' };

    if (Date.now() > session.expiresAt) {
      delete sessions[token];
      this.saveSessions(sessions);
      return { success: false, error: 'Token expired' };
    }

    return { success: true, data: session };
  },

  logout: function(token) {
    const sessions = this.getSessions();
    delete sessions[token];
    this.saveSessions(sessions);
    return { success: true };
  },

  getSessions: function() {
    const props = PropertiesService.getScriptProperties();
    const json = props.getProperty('customerSessions');
    return json ? JSON.parse(json) : {};
  },

  saveSessions: function(sessions) {
    const props = PropertiesService.getScriptProperties();
    props.setProperty('customerSessions', JSON.stringify(sessions));
  }
};
`);

// ====== 2. GAS: Quotations ======
writeFile('google-apps-script/Quotations.gs', `/**
 * KASTRIVA - Quotations Module (Phase 10)
 */

const Quotations = {

  generateNumber: function() {
    const sheet = Config.getSheet('Quotations');
    const lastRow = sheet.getLastRow();
    const year = new Date().getFullYear();
    var next = 1;
    if (lastRow > 1) {
      const last = String(sheet.getRange(lastRow, 2).getValue());
      const m = last.match(/QTN-\\d{4}-(\\d+)/);
      if (m) next = parseInt(m[1], 10) + 1;
    }
    return 'QTN-' + year + '-' + ('000' + next).slice(-4);
  },

  /**
   * Create quotation (ADMIN)
   * Total dihitung SERVER-SIDE (jangan percaya client)
   */
  create: function(data) {
    try {
      if (!data.orderId || !data.items || data.items.length === 0) {
        return { success: false, error: 'Order dan items wajib diisi' };
      }

      // Cari order
      const oSheet = Config.getSheet('Orders');
      const oData = oSheet.getDataRange().getValues();
      var order = null;
      var orderRow = -1;
      for (var i = 1; i < oData.length; i++) {
        if (oData[i][0] === data.orderId) {
          orderRow = i;
          order = {
            id: oData[i][0],
            orderNumber: oData[i][1],
            customerId: oData[i][2],
            name: oData[i][3],
            email: oData[i][5],
            type: oData[i][7]
          };
          break;
        }
      }
      if (!order) return { success: false, error: 'Order not found' };

      // Hitung server-side
      var subtotal = 0;
      var cleanItems = [];
      for (var j = 0; j < data.items.length; j++) {
        var it = data.items[j];
        var qty = Math.max(1, Number(it.qty) || 1);
        var price = Math.max(0, Number(it.price) || 0);
        var lineTotal = qty * price;
        subtotal += lineTotal;
        cleanItems.push({
          description: String(it.description || 'Item'),
          qty: qty,
          price: price,
          total: lineTotal
        });
      }

      var discount = Math.max(0, Math.min(subtotal, Number(data.discount) || 0));
      var taxPercent = Math.max(0, Math.min(100, Number(data.tax) || 0));
      var taxAmount = Math.round((subtotal - discount) * taxPercent / 100);
      var total = subtotal - discount + taxAmount;

      const qSheet = Config.getSheet('Quotations');
      const qId = Utils.generateId();
      const qNumber = this.generateNumber();
      const now = new Date().toISOString();

      qSheet.appendRow([
        qId,
        qNumber,
        order.id,
        order.customerId,
        data.projectName || (order.type + ' - ' + order.name),
        JSON.stringify(cleanItems),
        subtotal,
        discount,
        taxAmount,
        total,
        Utils.sanitize(data.notes || ''),
        data.validUntil || '',
        'sent',
        now,
        now
      ]);

      // Order status -> Quotation (Q=17, S=19)
      oSheet.getRange(orderRow + 1, 17).setValue('Quotation');
      oSheet.getRange(orderRow + 1, 19).setValue(now);

      // Email customer
      var lines = cleanItems.map(function(x) {
        return '- ' + x.description + ' (x' + x.qty + ') = Rp ' + Number(x.total).toLocaleString('id-ID');
      });
      var body = [
        'Halo ' + order.name + ',',
        '',
        'Berikut penawaran resmi untuk project Anda:',
        '',
        '📄 Nomor: ' + qNumber,
        '📌 Project: ' + (data.projectName || order.type),
        '',
        'RINCIAN:',
        lines.join('\\n'),
        '',
        'Subtotal: Rp ' + subtotal.toLocaleString('id-ID'),
        'Diskon: - Rp ' + discount.toLocaleString('id-ID'),
        'Pajak: + Rp ' + taxAmount.toLocaleString('id-ID'),
        '💰 TOTAL: Rp ' + total.toLocaleString('id-ID'),
        '',
        'Berlaku hingga: ' + (data.validUntil || '-'),
        '',
        data.notes || '',
        '',
        'Anda dapat MENYETUJUI atau MENOLAK penawaran ini melalui Customer Dashboard di website kami (menu Customer → login dengan email & nomor order).',
        '',
        'Salam,',
        'Tim ' + Config.APP_NAME
      ].join('\\n');

      Utils.sendEmail(order.email, 'Penawaran ' + qNumber + ' | ' + Config.APP_NAME, body);

      Utils.logAudit('quotation_created', 'admin', {
        quotationId: qId,
        orderNumber: order.orderNumber,
        total: total
      });

      return { success: true, data: { id: qId, quotationNumber: qNumber, total: total } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * List semua quotation (ADMIN)
   */
  getAll: function(params) {
    try {
      const sheet = Config.getSheet('Quotations');
      const data = sheet.getDataRange().getValues();
      const headers = data[0];

      var rows = data.slice(1)
        .filter(function(r) { return r[0] !== ''; })
        .map(function(r) {
          var o = {};
          headers.forEach(function(h, i) { o[h] = r[i]; });
          try { o.items = JSON.parse(o.items); } catch (e) { o.items = []; }
          return o;
        });

      rows.sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
      return { success: true, data: rows };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Customer respond: approved / rejected
   * Ownership diverifikasi server-side
   */
  respond: function(data, customerId) {
    try {
      if (!data.quotationId || !data.response) {
        return { success: false, error: 'Missing quotationId or response' };
      }
      if (data.response !== 'approved' && data.response !== 'rejected') {
        return { success: false, error: 'Invalid response' };
      }

      const sheet = Config.getSheet('Quotations');
      const values = sheet.getDataRange().getValues();

      for (var i = 1; i < values.length; i++) {
        if (values[i][0] === data.quotationId) {
          // Ownership check
          if (values[i][3] !== customerId) {
            return { success: false, error: 'Unauthorized' };
          }
          if (values[i][12] !== 'sent') {
            return { success: false, error: 'Quotation sudah direspons sebelumnya' };
          }

          const now = new Date().toISOString();
          sheet.getRange(i + 1, 13).setValue(data.response);
          sheet.getRange(i + 1, 15).setValue(now);

          const quotationNumber = values[i][1];
          const orderId = values[i][2];
          const total = values[i][9];

          // Jika approved -> order status Approved + email admin
          if (data.response === 'approved') {
            try {
              const oSheet = Config.getSheet('Orders');
              const oData = oSheet.getDataRange().getValues();
              for (var o = 1; o < oData.length; o++) {
                if (oData[o][0] === orderId) {
                  oSheet.getRange(o + 1, 17).setValue('Approved');
                  oSheet.getRange(o + 1, 19).setValue(now);
                  break;
                }
              }
            } catch (e) {}

            Utils.sendEmail(
              Config.ADMIN_EMAIL,
              '✅ Quotation ' + quotationNumber + ' DISETUJUI (Rp ' + Number(total).toLocaleString('id-ID') + ')',
              'Customer telah menyetujui quotation ' + quotationNumber + '.\\nSegera convert order menjadi project di Admin Dashboard.'
            );
          } else {
            Utils.sendEmail(
              Config.ADMIN_EMAIL,
              '❌ Quotation ' + quotationNumber + ' ditolak',
              'Customer menolak quotation ' + quotationNumber + '. Silakan diskusikan ulang.'
            );
          }

          Utils.logAudit('quotation_responded', customerId, {
            quotationId: data.quotationId,
            response: data.response
          });

          return { success: true };
        }
      }

      return { success: false, error: 'Quotation not found' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
`);

// ====== 3. GAS: CustomerPortal ======
writeFile('google-apps-script/CustomerPortal.gs', `/**
 * KASTRIVA - Customer Portal (Phase 10)
 * Data dashboard customer (orders, projects, quotations)
 * Semua difilter by customerId dari session (server-side authorization)
 */

const CustomerPortal = {

  getDashboard: function(customerId) {
    try {
      var mapRows = function(name, filterFn) {
        try {
          const sheet = Config.getSheet(name);
          const data = sheet.getDataRange().getValues();
          const headers = data[0];
          return data.slice(1)
            .filter(function(r) { return r[0] !== ''; })
            .filter(filterFn)
            .map(function(r) {
              var o = {};
              headers.forEach(function(h, i) { o[h] = r[i]; });
              return o;
            });
        } catch (e) {
          return [];
        }
      };

      var orders = mapRows('Orders', function(r) { return r[2] === customerId; })
        .sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });

      var projects = mapRows('Projects', function(r) { return r[2] === customerId; });
      projects.forEach(function(pr) {
        pr.updates = mapRows('ProjectUpdates', function(r) { return r[1] === pr.id; })
          .sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
      });

      var quotations = mapRows('Quotations', function(r) { return r[3] === customerId; })
        .map(function(q) {
          try { q.items = JSON.parse(q.items); } catch (e) { q.items = []; }
          return q;
        })
        .sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });

      return {
        success: true,
        data: { orders: orders, projects: projects, quotations: quotations }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
`);

// ====== 4. GAS: Router v3 (FULL - 3 tier auth) ======
writeFile('google-apps-script/Router.gs', `/**
 * KASTRIVA - Router v3 (Phase 10)
 * 3 tier: public / admin-protected / customer-protected
 */

const Router = {

  handle: function(action, params, body, method) {

    // ===== AUTH ENDPOINTS =====
    if (action === 'login') return Auth.login(body.email, body.password);
    if (action === 'logout') return Auth.logout(params.token || body.token);
    if (action === 'customerLogin') return CustomerAuth.login(body.email, body.orderNumber);
    if (action === 'customerLogout') return CustomerAuth.logout(params.token || body.token);

    // ===== PUBLIC =====
    const publicActions = [
      'getPortfolio', 'getPortfolioBySlug', 'getPortfolioCategories',
      'getServices', 'getSettings', 'createOrder', 'getOrderByNumber', 'health'
    ];

    // ===== ADMIN PROTECTED =====
    const adminActions = [
      'getDashboardStats', 'getOrders', 'getOrder', 'updateOrderStatus',
      'getCustomers', 'getCustomer',
      'getProjects', 'getProject', 'createProject', 'createProjectUpdate',
      'createQuotation', 'getQuotations',
      'createInvoice', 'getInvoices',
      'sendMessage', 'getMessages', 'uploadFile',
      'getNotifications', 'markNotificationRead'
    ];

    // ===== CUSTOMER PROTECTED =====
    const customerActions = ['getMyDashboard', 'respondQuotation'];

    if (publicActions.indexOf(action) === -1 &&
        adminActions.indexOf(action) === -1 &&
        customerActions.indexOf(action) === -1) {
      return { success: false, error: 'Invalid action: ' + action };
    }

    var adminSession = null;
    var customerSession = null;

    if (adminActions.indexOf(action) !== -1) {
      const r = Auth.verifyToken(params.token || body.token);
      if (!r.success) return { success: false, error: 'Unauthorized: ' + r.error };
      adminSession = r.data;
    }

    if (customerActions.indexOf(action) !== -1) {
      const r = CustomerAuth.verify(params.token || body.token);
      if (!r.success) return { success: false, error: 'Unauthorized: ' + r.error };
      customerSession = r.data;
    }

    switch (action) {
      // PUBLIC
      case 'health':
        return { success: true, data: { status: 'ok', timestamp: new Date().toISOString(), version: Config.APP_VERSION } };
      case 'getPortfolio': return Portfolio.getAll(params);
      case 'getPortfolioBySlug': return Portfolio.getBySlug(params.slug);
      case 'getPortfolioCategories': return Portfolio.getCategories();
      case 'getServices': return Services.getAll();
      case 'getSettings': return Settings.getAll();
      case 'createOrder': return Orders.create(body);
      case 'getOrderByNumber': return Orders.getByOrderNumber(params.orderNumber);

      // ADMIN
      case 'getDashboardStats': return Stats.getDashboard();
      case 'getOrders': return Orders.getAll(params);
      case 'getOrder': return Orders.getById(params.id);
      case 'updateOrderStatus': return Orders.updateStatus(body);
      case 'getCustomers': return Customers.getAll(params);
      case 'getCustomer': return Customers.getById(params.id);
      case 'getProjects': return Projects.getAll(params);
      case 'getProject': return Projects.getById(params.id);
      case 'createProject': return Projects.create(body);
      case 'createProjectUpdate': return Projects.createUpdate(body);
      case 'createQuotation': return Quotations.create(body);
      case 'getQuotations': return Quotations.getAll(params);

      // CUSTOMER
      case 'getMyDashboard': return CustomerPortal.getDashboard(customerSession.customerId);
      case 'respondQuotation': return Quotations.respond(body, customerSession.customerId);

      default:
        return { success: false, error: 'Action not implemented: ' + action };
    }
  }
};
`);

// ====== 5. Frontend: Customer Auth Service ======
writeFile('lib/services/customer-auth.service.ts', `import { gasPost } from "@/lib/gas-client";

const TOKEN_KEY = "kastriva_customer_token";

export interface CustomerSession {
  token: string;
  customerId: string;
  name: string;
  expiresAt: number;
}

export class CustomerAuthService {
  static async login(
    email: string,
    orderNumber: string
  ): Promise<{ success: boolean; error?: string }> {
    const res = await gasPost<CustomerSession>({
      action: "customerLogin",
      email,
      orderNumber,
    });

    if (res.success && res.data && res.data.token) {
      if (typeof window !== "undefined") {
        localStorage.setItem(TOKEN_KEY, JSON.stringify(res.data));
      }
      return { success: true };
    }
    return { success: false, error: res.error || "Login gagal" };
  }

  static getSession(): CustomerSession | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(TOKEN_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as CustomerSession;
      if (!session.token || Date.now() > session.expiresAt) {
        localStorage.removeItem(TOKEN_KEY);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }

  static getToken(): string | null {
    const s = this.getSession();
    return s ? s.token : null;
  }

  static isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  static logout(): void {
    const token = this.getToken();
    if (token) gasPost({ action: "customerLogout", token }).catch(() => {});
    if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
  }
}
`);

// ====== 6. Customer Guard ======
writeFile('components/customer/CustomerGuard.tsx', `"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { CustomerAuthService } from "@/lib/services/customer-auth.service";
import { LoadingSpinner } from "@/components/ui";

export default function CustomerGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const isLoginPage = pathname === "/customer/login";

  useEffect(() => {
    if (isLoginPage) {
      setChecking(false);
      return;
    }
    if (!CustomerAuthService.isLoggedIn()) {
      router.replace("/customer/login");
    } else {
      setChecking(false);
    }
  }, [router, pathname, isLoginPage]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-bg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
`);

// ====== 7. Customer Layout ======
writeFile('app/customer/layout.tsx', `import CustomerGuard from "@/components/customer/CustomerGuard";
import CustomerNav from "@/components/customer/CustomerNav";

export const metadata = {
  title: "Customer Dashboard | Kastriva",
  robots: "noindex, nofollow",
};

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CustomerGuard>
      <div className="min-h-screen bg-slate-50 dark:bg-dark-bg">
        <CustomerNav />
        <main className="pt-16">
          <div className="container mx-auto px-4 md:px-6 py-8">{children}</div>
        </main>
      </div>
    </CustomerGuard>
  );
}
`);

// ====== 8. Customer Nav ======
writeFile('components/customer/CustomerNav.tsx', `"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserCircle2, LogOut, ExternalLink, Home } from "lucide-react";
import { CustomerAuthService } from "@/lib/services/customer-auth.service";
import { config } from "@/data/config";

export default function CustomerNav() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/customer/login") return null;

  const session = CustomerAuthService.getSession();

  const handleLogout = () => {
    CustomerAuthService.logout();
    router.push("/customer/login");
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-dark-surface border-b border-slate-200 dark:border-slate-800 z-40">
      <div className="container mx-auto px-4 md:px-6 h-full flex items-center justify-between">
        <Link href="/customer" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <UserCircle2 size={18} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-gradient leading-none">{config.brand.name}</div>
            <div className="text-xs text-slate-500">Customer Area</div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <span className="hidden sm:block text-sm text-slate-600 dark:text-slate-400 mr-2">
            👋 {session ? session.name : ""}
          </span>
          <Link
            href="/"
            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Ke website"
          >
            <Home size={18} />
          </Link>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            aria-label="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
`);

// ====== 9. Customer Login ======
writeFile('app/customer/login/page.tsx', `"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { UserCircle2, Loader2, AlertCircle, Package } from "lucide-react";
import { CustomerAuthService } from "@/lib/services/customer-auth.service";
import { config } from "@/data/config";

export default function CustomerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (CustomerAuthService.isLoggedIn()) router.replace("/customer");
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await CustomerAuthService.login(email, orderNumber.toUpperCase());
    setLoading(false);
    if (res.success) router.push("/customer");
    else setError(res.error || "Login gagal");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-bg px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-dark-bg rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-primary-600 items-center justify-center mb-4 shadow-lg shadow-primary-600/30">
              <UserCircle2 size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold">Customer Area</h1>
            <p className="text-sm text-slate-500 mt-1">
              Masuk dengan email & nomor order Anda
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                placeholder="email@anda.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nomor Order</label>
              <input
                type="text"
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-mono"
                placeholder="KAS-2026-0001"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <UserCircle2 size={18} />}
              {loading ? "Memverifikasi..." : "Masuk"}
            </button>
          </form>

          <p className="text-xs text-center text-slate-400 mt-6 flex items-center justify-center gap-1">
            <Package size={12} /> Nomor order ada di email konfirmasi Anda
          </p>
        </div>
      </motion.div>
    </div>
  );
}
`);

// ====== 10. Customer Dashboard ======
writeFile('app/customer/page.tsx', `"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { gasGet, gasPost } from "@/lib/gas-client";
import { CustomerAuthService } from "@/lib/services/customer-auth.service";
import { LoadingSpinner, ErrorState } from "@/components/ui";
import OrderStatusBadge from "@/components/order/OrderStatusBadge";
import { OrderStatus } from "@/lib/types/order";
import {
  FolderKanban,
  Package,
  CheckCircle2,
  FileText,
  Search,
  Loader2,
} from "lucide-react";

interface MyOrder {
  id: string;
  orderNumber: string;
  projectType: string;
  status: OrderStatus;
  createdAt: string;
}

interface MyUpdate {
  id: string;
  title: string;
  description: string;
  progress: number;
  createdAt: string;
}

interface MyProject {
  id: string;
  projectName: string;
  status: OrderStatus;
  progress: number;
  deadline: string;
  updates: MyUpdate[];
}

interface QuotationItem {
  description: string;
  qty: number;
  price: number;
  total: number;
}

interface MyQuotation {
  id: string;
  quotationNumber: string;
  projectName: string;
  items: QuotationItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes: string;
  validUntil: string;
  status: string;
  createdAt: string;
}

interface MyDashboard {
  orders: MyOrder[];
  projects: MyProject[];
  quotations: MyQuotation[];
}

function rupiah(n: number): string {
  return "Rp " + Number(n || 0).toLocaleString("id-ID");
}

export default function CustomerDashboardPage() {
  const [data, setData] = useState<MyDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [responding, setResponding] = useState("");

  const session = CustomerAuthService.getSession();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const token = CustomerAuthService.getToken();
    const res = await gasGet<MyDashboard>("getMyDashboard", { token: token || "" });
    if (res.success && res.data) setData(res.data);
    else setError(res.error || "Gagal memuat data");
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const respondQuotation = async (quotationId: string, response: "approved" | "rejected") => {
    if (!confirm(response === "approved" ? "Setujui penawaran ini?" : "Tolak penawaran ini?")) return;
    setResponding(quotationId);
    const token = CustomerAuthService.getToken();
    await gasPost({ action: "respondQuotation", token, quotationId, response });
    setResponding("");
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  const activeProjects = (data ? data.projects : []).filter(
    (p) => p.status !== "Completed" && p.status !== "Cancelled"
  );
  const pendingQuotations = (data ? data.quotations : []).filter((q) => q.status === "sent");

  const cards = [
    { label: "Order Saya", value: data ? data.orders.length : 0, icon: Package, color: "bg-primary-100 dark:bg-primary-900/30 text-primary-600" },
    { label: "Project Aktif", value: activeProjects.length, icon: FolderKanban, color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600" },
    { label: "Project Selesai", value: (data ? data.projects : []).filter((p) => p.status === "Completed").length, icon: CheckCircle2, color: "bg-green-100 dark:bg-green-900/30 text-green-600" },
    { label: "Menunggu Persetujuan", value: pendingQuotations.length, icon: FileText, color: "bg-orange-100 dark:bg-orange-900/30 text-orange-600" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">
          Halo, {session ? session.name : "Customer"} 👋
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Pantau order, project, dan penawaran Anda di sini.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {cards.map((c, i) => (
          <div key={i} className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className={"inline-flex p-2.5 rounded-xl mb-3 " + c.color}>
              <c.icon size={20} />
            </div>
            <div className="text-3xl font-bold mb-1">{c.value}</div>
            <div className="text-sm text-slate-500">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Quotations */}
      {data && data.quotations.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FileText size={20} className="text-primary-500" /> Penawaran (Quotation)
          </h2>
          <div className="space-y-4">
            {data.quotations.map((q) => (
              <div key={q.id} className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="font-mono font-bold text-primary-600">{q.quotationNumber}</div>
                    <div className="text-sm text-slate-500">{q.projectName}</div>
                  </div>
                  {q.status === "sent" ? (
                    <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-sm font-semibold">Menunggu Persetujuan</span>
                  ) : q.status === "approved" ? (
                    <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-semibold">Disetujui</span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm font-semibold">Ditolak</span>
                  )}
                </div>

                <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/50 text-left text-slate-500">
                        <th className="px-4 py-2 font-medium">Item</th>
                        <th className="px-4 py-2 font-medium">Qty</th>
                        <th className="px-4 py-2 font-medium text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {q.items.map((it, i) => (
                        <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                          <td className="px-4 py-2">{it.description}</td>
                          <td className="px-4 py-2">{it.qty}</td>
                          <td className="px-4 py-2 text-right">{rupiah(it.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col items-end gap-1 text-sm mb-4">
                  <div className="text-slate-500">Subtotal: {rupiah(q.subtotal)}</div>
                  <div className="text-slate-500">Diskon: - {rupiah(q.discount)}</div>
                  <div className="text-slate-500">Pajak: + {rupiah(q.tax)}</div>
                  <div className="text-lg font-bold text-primary-600">Total: {rupiah(q.total)}</div>
                  {q.validUntil && (
                    <div className="text-xs text-slate-400">Berlaku hingga: {q.validUntil}</div>
                  )}
                </div>

                {q.status === "sent" && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => respondQuotation(q.id, "approved")}
                      disabled={responding === q.id}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      {responding === q.id ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                      Setujui Penawaran
                    </button>
                    <button
                      onClick={() => respondQuotation(q.id, "rejected")}
                      disabled={responding === q.id}
                      className="flex-1 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 py-3 rounded-xl font-semibold transition-all"
                    >
                      Tolak
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {data && data.projects.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FolderKanban size={20} className="text-primary-500" /> Project Saya
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {data.projects.map((p) => (
              <div key={p.id} className="bg-white dark:bg-dark-surface p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold">{p.projectName}</h3>
                  <OrderStatusBadge status={p.status} size="sm" />
                </div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Progress</span>
                  <span className="font-semibold text-primary-600">{p.progress}%</span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-gradient-to-r from-primary-500 to-purple-500" style={{ width: p.progress + "%" }} />
                </div>
                {p.updates && p.updates.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-500">UPDATE TERBARU</div>
                    {p.updates.slice(0, 2).map((u) => (
                      <div key={u.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-sm">
                        <div className="font-medium">{u.title}</div>
                        {u.description && <div className="text-slate-500 text-xs mt-0.5">{u.description}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Orders */}
      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Package size={20} className="text-primary-500" /> Order Saya
        </h2>
        <div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-5 py-3 font-medium">Jenis</th>
                  <th className="px-5 py-3 font-medium">Tanggal</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {data && data.orders.map((o) => (
                  <tr key={o.id} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                    <td className="px-5 py-4 font-mono font-semibold text-primary-600">{o.orderNumber}</td>
                    <td className="px-5 py-4">{o.projectType}</td>
                    <td className="px-5 py-4 text-slate-500">{new Date(o.createdAt).toLocaleDateString("id-ID")}</td>
                    <td className="px-5 py-4"><OrderStatusBadge status={o.status} size="sm" /></td>
                    <td className="px-5 py-4">
                      <Link href={"/order/track?orderNumber=" + o.orderNumber} className="text-primary-600 text-xs font-medium flex items-center gap-1">
                        <Search size={12} /> Tracking
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
`);

// ====== 11. Admin Quotations Page ======
writeFile('app/admin/quotations/page.tsx', `"use client";
import { useEffect, useState, useCallback } from "react";
import { gasGet, gasPost } from "@/lib/gas-client";
import { AdminAuthService } from "@/lib/services/auth.service";
import { LoadingSpinner, ErrorState, EmptyState } from "@/components/ui";
import { FileText, Plus, X, Trash2, Send, RefreshCw } from "lucide-react";

interface QuotationItem {
  description: string;
  qty: number;
  price: number;
  total: number;
}

interface AdminQuotation {
  id: string;
  quotationNumber: string;
  orderId: string;
  projectName: string;
  items: QuotationItem[];
  total: number;
  status: string;
  validUntil: string;
  createdAt: string;
}

interface AdminOrder {
  id: string;
  orderNumber: string;
  name: string;
  projectType: string;
}

function rupiah(n: number): string {
  return "Rp " + Number(n || 0).toLocaleString("id-ID");
}

export default function AdminQuotationsPage() {
  const [quotations, setQuotations] = useState<AdminQuotation[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  // Create form
  const [orderId, setOrderId] = useState("");
  const [items, setItems] = useState<Array<{ description: string; qty: number; price: number }>>([
    { description: "", qty: 1, price: 0 },
  ]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [notes, setNotes] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [sending, setSending] = useState(false);

  const token = () => AdminAuthService.getToken() || "";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [qRes, oRes] = await Promise.all([
      gasGet<AdminQuotation[]>("getQuotations", { token: token() }),
      gasGet<AdminOrder[]>("getOrders", { token: token() }),
    ]);
    if (qRes.success && qRes.data) setQuotations(qRes.data);
    if (oRes.success && oRes.data) setOrders(oRes.data);
    if (!qRes.success) setError(qRes.error || "Gagal memuat quotations");
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const subtotal = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
  const taxAmount = Math.round((subtotal - discount) * (tax / 100));
  const total = subtotal - discount + taxAmount;

  const updateItem = (i: number, field: string, value: string | number) => {
    const next = [...items];
    (next[i] as any)[field] = value;
    setItems(next);
  };

  const submit = async () => {
    const cleanItems = items.filter((it) => it.description.trim() && Number(it.price) > 0);
    if (!orderId || cleanItems.length === 0) {
      alert("Pilih order dan isi minimal 1 item dengan harga");
      return;
    }
    setSending(true);
    const res = await gasPost({
      action: "createQuotation",
      token: token(),
      orderId,
      items: cleanItems,
      discount,
      tax,
      notes,
      validUntil,
    });
    setSending(false);
    if (res.success) {
      setShowCreate(false);
      setOrderId("");
      setItems([{ description: "", qty: 1, price: 0 }]);
      setDiscount(0);
      setTax(0);
      setNotes("");
      setValidUntil("");
      load();
    } else {
      alert(res.error || "Gagal membuat quotation");
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Quotations</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Buat & kelola penawaran untuk customer
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Refresh">
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2"
          >
            <Plus size={16} /> Buat Quotation
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><LoadingSpinner size="lg" /></div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : quotations.length === 0 ? (
        <EmptyState title="Belum ada quotation" description="Buat penawaran pertama Anda untuk customer." icon={<FileText className="text-slate-400" size={32} />} />
      ) : (
        <div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <th className="px-5 py-3 font-medium">Nomor</th>
                <th className="px-5 py-3 font-medium">Project</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Berlaku</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((q) => (
                <tr key={q.id} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                  <td className="px-5 py-4 font-mono font-semibold text-primary-600">{q.quotationNumber}</td>
                  <td className="px-5 py-4">{q.projectName}</td>
                  <td className="px-5 py-4 font-semibold">{rupiah(q.total)}</td>
                  <td className="px-5 py-4 text-slate-500">{q.validUntil || "-"}</td>
                  <td className="px-5 py-4">
                    {q.status === "sent" ? (
                      <span className="px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-semibold">Menunggu</span>
                    ) : q.status === "approved" ? (
                      <span className="px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-semibold">Disetujui ✅</span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-semibold">Ditolak</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-bg w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Buat Quotation</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Order *</label>
                <select
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700 text-sm"
                >
                  <option value="">Pilih order...</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>{o.orderNumber} — {o.name} ({o.projectType})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Items *</label>
                <div className="space-y-2">
                  {items.map((it, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2">
                      <input
                        type="text"
                        placeholder="Deskripsi item"
                        value={it.description}
                        onChange={(e) => updateItem(i, "description", e.target.value)}
                        className="col-span-6 px-3 py-2 rounded-lg bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700 text-sm"
                      />
                      <input
                        type="number"
                        min={1}
                        value={it.qty}
                        onChange={(e) => updateItem(i, "qty", Number(e.target.value))}
                        className="col-span-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700 text-sm"
                      />
                      <input
                        type="number"
                        min={0}
                        placeholder="Harga"
                        value={it.price}
                        onChange={(e) => updateItem(i, "price", Number(e.target.value))}
                        className="col-span-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700 text-sm"
                      />
                      <button
                        onClick={() => setItems(items.filter((_, j) => j !== i))}
                        disabled={items.length === 1}
                        className="col-span-1 text-red-500 disabled:opacity-30"
                        aria-label="Hapus item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setItems([...items, { description: "", qty: 1, price: 0 }])}
                  className="mt-2 text-sm text-primary-600 font-medium flex items-center gap-1"
                >
                  <Plus size={14} /> Tambah Item
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Diskon (Rp)</label>
                  <input type="number" min={0} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Pajak (%)</label>
                  <input type="number" min={0} max={100} value={tax} onChange={(e) => setTax(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Berlaku Hingga</label>
                  <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Catatan</label>
                <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-slate-700 text-sm" placeholder="Termasuk revisi 2x, gratis domain 1 tahun, dll" />
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-sm space-y-1">
                <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{rupiah(subtotal)}</span></div>
                <div className="flex justify-between text-slate-500"><span>Diskon</span><span>- {rupiah(discount)}</span></div>
                <div className="flex justify-between text-slate-500"><span>Pajak</span><span>+ {rupiah(taxAmount)}</span></div>
                <div className="flex justify-between font-bold text-primary-600 text-base"><span>TOTAL</span><span>{rupiah(total)}</span></div>
              </div>

              <button
                onClick={submit}
                disabled={sending}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Send size={16} />
                {sending ? "Mengirim..." : "Kirim Quotation (email customer otomatis)"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`);

// ====== 12. AdminSidebar v3 (tambah Quotations) ======
writeFile('components/admin/AdminSidebar.tsx', `"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Users,
  FolderKanban,
  FileText,
  LogOut,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { AdminAuthService } from "@/lib/services/auth.service";
import { config } from "@/data/config";

const menu = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Orders", href: "/admin/orders", icon: Package },
  { name: "Projects", href: "/admin/projects", icon: FolderKanban },
  { name: "Quotations", href: "/admin/quotations", icon: FileText },
  { name: "Customers", href: "/admin/customers", icon: Users },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") return null;

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    AdminAuthService.logout();
    router.push("/admin/login");
  };

  const session = AdminAuthService.getSession();

  return (
    <>
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-white dark:bg-dark-surface border-r border-slate-200 dark:border-slate-800 z-40">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-gradient">{config.brand.name}</div>
              <div className="text-xs text-slate-500">Admin Panel</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={\`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors \${
                isActive(item.href)
                  ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }\`}
            >
              <item.icon size={18} />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-1">
          <div className="px-4 py-2 text-xs text-slate-500 truncate">
            {session ? session.email : ""}
          </div>
          <Link href="/" className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ExternalLink size={16} /> Lihat Website
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-dark-surface border-b border-slate-200 dark:border-slate-800 z-40 flex items-center justify-between px-4">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <ShieldCheck size={16} className="text-white" />
          </div>
          <span className="font-bold text-gradient">Admin</span>
        </Link>
        <nav className="flex items-center gap-1">
          {menu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={\`p-2 rounded-lg \${isActive(item.href) ? "bg-primary-600 text-white" : "text-slate-600 dark:text-slate-400"}\`}
              aria-label={item.name}
            >
              <item.icon size={18} />
            </Link>
          ))}
          <button onClick={handleLogout} className="p-2 rounded-lg text-red-600" aria-label="Logout">
            <LogOut size={18} />
          </button>
        </nav>
      </div>
    </>
  );
}
`);

// ====== 13. Footer: tambah link Customer Area ======
const footerPatch = `

<!-- Tambahkan manual di Footer (opsional): link Customer Area -->
`;

// ====== 14. GAS Update Guide ======
writeFile('PHASE10_GAS_UPDATE_GUIDE.md', `# 🚀 Phase 10: Update Google Apps Script

## File BARU (buat di Apps Script):
1. **CustomerAuth.gs** ← copy dari google-apps-script/CustomerAuth.gs
2. **Quotations.gs** ← copy dari google-apps-script/Quotations.gs
3. **CustomerPortal.gs** ← copy dari google-apps-script/CustomerPortal.gs

## File REPLACE (ganti seluruh isi):
4. **Router.gs** ← copy dari google-apps-script/Router.gs (versi v3)

## Deploy → New version

## Test Flow Quotation Lengkap:
1. Admin → Quotations → Buat Quotation → pilih order → isi items → kirim
2. Cek email customer → ada penawaran + total
3. Buka /customer/login → login (email customer + nomor order)
4. Dashboard customer → quotation muncul → klik "Setujui Penawaran"
5. Cek email admin → notifikasi "DISETUJUI"
6. Admin → Orders → status order otomatis "Approved" ✅
`);

console.log('\n🎉 Phase 10: Customer Dashboard + Quotation berhasil dibuat!');
console.log('');
console.log('📁 FRONTEND BARU:');
console.log('  - lib/services/customer-auth.service.ts');
console.log('  - components/customer/CustomerGuard.tsx, CustomerNav.tsx');
console.log('  - app/customer/layout.tsx, login/page.tsx, page.tsx');
console.log('  - app/admin/quotations/page.tsx');
console.log('  - components/admin/AdminSidebar.tsx (v3: + Quotations)');
console.log('');
console.log('📁 GAS BARU:');
console.log('  - CustomerAuth.gs, Quotations.gs, CustomerPortal.gs');
console.log('  - Router.gs v3 (REPLACE seluruhnya)');
console.log('');
console.log('📌 LANGKAH:');
console.log('1. GAS: buat 3 file baru + replace Router.gs → deploy new version');
console.log('2. npm run dev → test flow lengkap (lihat PHASE10_GAS_UPDATE_GUIDE.md)');
console.log('3. Commit & push');