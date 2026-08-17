/**
 * KASTRIVA - Orders Module
 * FULL VERSION - Phase 7
 * 
 * Fitur:
 * - create: simpan order + auto-create customer + email admin + email konfirmasi
 * - getAll / getById / updateStatus (admin)
 * - getByOrderNumber (publik, untuk customer tracking)
 * - sendAdminNotification / sendConfirmationEmail
 */

const Orders = {

  /**
   * Create order (endpoint publik)
   */
  create: function(data) {
    try {
      // ===== SERVER-SIDE VALIDATION (WAJIB) =====
      if (!data.name || !data.email || !data.whatsapp || !data.type || !data.description) {
        return { success: false, error: 'Missing required fields' };
      }
      if (!Utils.isValidEmail(data.email)) {
        return { success: false, error: 'Invalid email format' };
      }
      if (String(data.name).length < 2) {
        return { success: false, error: 'Nama minimal 2 karakter' };
      }
      if (String(data.whatsapp).length < 10) {
        return { success: false, error: 'Nomor WhatsApp minimal 10 digit' };
      }
      if (String(data.description).length < 20) {
        return { success: false, error: 'Deskripsi minimal 20 karakter' };
      }
      // Honeypot anti-spam
      if (data.website && String(data.website).length > 0) {
        return { success: false, error: 'Spam detected' };
      }

      const sheet = Config.getSheet('Orders');
      const orderId = Utils.generateId();
      const orderNumber = Utils.generateOrderNumber();
      const now = new Date().toISOString();

      // Find or create customer
      const customerId = this.findOrCreateCustomer(data);

      // Insert order (urutan kolom sesuai header sheet Orders)
      sheet.appendRow([
        orderId,                                   // A  id
        orderNumber,                               // B  orderNumber
        customerId,                                // C  customerId
        Utils.sanitize(data.name),                 // D  name
        Utils.sanitize(data.business || ''),       // E  business
        Utils.sanitize(data.email),                // F  email
        Utils.sanitize(data.whatsapp),             // G  whatsapp
        Utils.sanitize(data.type),                 // H  projectType
        data.serviceId || '',                      // I  serviceId
        data.portfolioId || '',                    // J  portfolioId
        Utils.sanitize(data.portfolioTitle || ''), // K  portfolioTitle
        Utils.sanitize(data.budget || ''),         // L  budget
        Utils.sanitize(data.deadline || ''),       // M  deadline
        Utils.sanitize(data.description),          // N  description
        Utils.sanitize(data.features || ''),       // O  features
        Utils.sanitize(data.referenceUrl || ''),   // P  referenceUrl
        'Submitted',                               // Q  status
        now,                                       // R  createdAt
        now                                        // S  updatedAt
      ]);

      // ===== EMAIL NOTIFICATIONS =====
      this.sendAdminNotification(orderNumber, data);
      this.sendConfirmationEmail(orderNumber, data);

      Utils.logAudit('order_created', customerId, {
        orderId: orderId,
        orderNumber: orderNumber
      });

      return {
        success: true,
        data: {
          id: orderId,
          orderNumber: orderNumber,
          status: 'Submitted'
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Cari customer berdasarkan email, atau buat baru jika belum ada
   */
  findOrCreateCustomer: function(data) {
    const sheet = Config.getSheet('Customers');
    const values = sheet.getDataRange().getValues();

    for (let i = 1; i < values.length; i++) {
      if (String(values[i][2]).toLowerCase() === String(data.email).toLowerCase()) {
        // Customer sudah ada → update lastActivity (kolom I)
        sheet.getRange(i + 1, 9).setValue(new Date().toISOString());
        return values[i][0];
      }
    }

    // Customer baru
    const customerId = Utils.generateId();
    const now = new Date().toISOString();

    sheet.appendRow([
      customerId,
      Utils.sanitize(data.name),
      Utils.sanitize(data.email),
      Utils.sanitize(data.whatsapp),
      Utils.sanitize(data.business || ''),
      '',          // avatar
      'Active',    // status
      now,         // createdAt
      now          // lastActivity
    ]);

    return customerId;
  },

  /**
   * Get semua orders (admin)
   */
  getAll: function(params) {
    try {
      const sheet = Config.getSheet('Orders');
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const rows = data.slice(1);

      let orders = rows
        .filter(function(row) { return row[0] !== ''; })
        .map(function(row) {
          const obj = {};
          headers.forEach(function(header, i) { obj[header] = row[i]; });
          return obj;
        });

      // Filter status
      if (params.status) {
        orders = orders.filter(function(o) { return o.status === params.status; });
      }

      // Search by name / orderNumber / email
      if (params.search) {
        const q = String(params.search).toLowerCase();
        orders = orders.filter(function(o) {
          return String(o.name).toLowerCase().indexOf(q) !== -1 ||
                 String(o.orderNumber).toLowerCase().indexOf(q) !== -1 ||
                 String(o.email).toLowerCase().indexOf(q) !== -1;
        });
      }

      // Sort terbaru dulu
      orders.sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });

      return { success: true, data: orders };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Get order by internal id (admin)
   */
  getById: function(id) {
    try {
      const result = this.getAll({});
      if (!result.success) return result;

      const order = result.data.find(function(o) { return o.id === id; });
      if (!order) return { success: false, error: 'Order not found' };

      return { success: true, data: order };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Update status order (admin)
   */
  updateStatus: function(data) {
    try {
      if (!data.id || !data.status) {
        return { success: false, error: 'Missing id or status' };
      }

      const validStatuses = ['Submitted', 'Reviewing', 'Discussing', 'Quotation', 'Approved', 'In Progress', 'Revision', 'Completed', 'Cancelled'];
      if (validStatuses.indexOf(data.status) === -1) {
        return { success: false, error: 'Invalid status' };
      }

      const sheet = Config.getSheet('Orders');
      const values = sheet.getDataRange().getValues();

      for (let i = 1; i < values.length; i++) {
        if (values[i][0] === data.id) {
          sheet.getRange(i + 1, 17).setValue(data.status);              // Q = status
          sheet.getRange(i + 1, 19).setValue(new Date().toISOString()); // S = updatedAt

          Utils.logAudit('order_status_updated', 'admin', {
            orderId: data.id,
            status: data.status
          });

          return { success: true, data: { id: data.id, status: data.status } };
        }
      }

      return { success: false, error: 'Order not found' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Get order by NOMOR ORDER (PUBLIK - untuk customer tracking)
   * Include: order + project terkait + update timeline
   */
  getByOrderNumber: function(orderNumber) {
    try {
      if (!orderNumber || !/^KAS-\d{4}-\d{4}$/.test(String(orderNumber))) {
        return { success: false, error: 'Format nomor order tidak valid' };
      }

      const sheet = Config.getSheet('Orders');
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const rows = data.slice(1);

      for (let i = 0; i < rows.length; i++) {
        if (String(rows[i][1]).toUpperCase() === String(orderNumber).toUpperCase()) {

          // Build order object
          const order = {};
          headers.forEach(function(header, j) { order[header] = rows[i][j]; });

          // Cari project terkait (kolom B Projects = orderId)
          let relatedProject = null;
          try {
            const pSheet = Config.getSheet('Projects');
            const pData = pSheet.getDataRange().getValues();
            const pHeaders = pData[0];
            for (let p = 1; p < pData.length; p++) {
              if (pData[p][1] === order.id) {
                relatedProject = {};
                pHeaders.forEach(function(h, j) { relatedProject[h] = pData[p][j]; });
                break;
              }
            }
          } catch (e) { /* sheet Projects kosong */ }

          // Cari update timeline project
          let updates = [];
          if (relatedProject) {
            try {
              const uSheet = Config.getSheet('ProjectUpdates');
              const uData = uSheet.getDataRange().getValues();
              const uHeaders = uData[0];
              updates = uData.slice(1)
                .filter(function(row) { return row[1] === relatedProject.id; })
                .map(function(row) {
                  const u = {};
                  uHeaders.forEach(function(h, j) { u[h] = row[j]; });
                  return u;
                })
                .sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
            } catch (e) { /* ignore */ }
          }

          return {
            success: true,
            data: {
              order: order,
              project: relatedProject,
              updates: updates
            }
          };
        }
      }

      return { success: false, error: 'Order tidak ditemukan' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Email notifikasi ke ADMIN saat order baru masuk
   */
  sendAdminNotification: function(orderNumber, data) {
    try {
      const subject = '🔔 New Order: ' + orderNumber + ' | ' + Config.APP_NAME;
      const body = [
        'New Order Received!',
        '',
        'Order Number: ' + orderNumber,
        'Customer: ' + data.name,
        'Email: ' + data.email,
        'WhatsApp: ' + data.whatsapp,
        'Business: ' + (data.business || '-'),
        '',
        'Project Type: ' + data.type,
        'Budget: ' + (data.budget || 'Not specified'),
        'Deadline: ' + (data.deadline || 'Flexible'),
        'Reference: ' + (data.reference || '-'),
        '',
        'Description:',
        data.description,
        '',
        'Features:',
        data.features || '-'
      ].join('\n');

      Utils.sendEmail(Config.ADMIN_EMAIL, subject, body);
    } catch (error) {
      Logger.log('Admin notification error: ' + error.message);
    }
  },

  /**
   * Email KONFIRMASI ke CUSTOMER setelah order dibuat
   */
  sendConfirmationEmail: function(orderNumber, customerData) {
    try {
      // Ambil info kontak dari Settings sheet
      let waNumber = '-';
      let contactEmail = Config.ADMIN_EMAIL;
      try {
        const sSheet = Config.getSheet('Settings');
        const sData = sSheet.getDataRange().getValues();
        for (let i = 0; i < sData.length; i++) {
          if (sData[i][0] === 'whatsapp') waNumber = sData[i][1];
          if (sData[i][0] === 'email') contactEmail = sData[i][1];
        }
      } catch (e) { /* pakai default */ }

      const subject = 'Pesanan Anda Diterima - ' + orderNumber + ' | ' + Config.APP_NAME;
      const body = [
        'Halo ' + customerData.name + ', 👋',
        '',
        'Terima kasih telah menghubungi ' + Config.APP_NAME + '!',
        'Pesanan Anda telah kami terima dengan detail sebagai berikut:',
        '',
        '📋 NOMOR ORDER: ' + orderNumber,
        '📌 Jenis Project: ' + customerData.type,
        '💰 Budget: ' + (customerData.budget || 'Akan didiskusikan'),
        '⏰ Deadline: ' + (customerData.deadline || 'Fleksibel'),
        '',
        '📝 DESKRIPSI PROJECT:',
        customerData.description,
        '',
        '🔧 FITUR YANG DIMINTA:',
        customerData.features || '-',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        '⏭️ LANGKAH SELANJUTNYA:',
        '1. Tim kami akan membalas via WhatsApp/email dalam 1x24 jam (hari kerja)',
        '2. Kami akan menjadwalkan sesi konsultasi untuk membahas detail project',
        '3. Setelah scope disepakati, kami akan mengirimkan penawaran resmi (quotation)',
        '',
        '🔗 LACAK STATUS ORDER:',
        'Anda dapat melacak status order kapan saja di website kami',
        'menggunakan nomor order di atas.',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        'Jika ada pertanyaan, silakan balas email ini atau hubungi kami.',
        '',
        'Salam hangat,',
        'Tim ' + Config.APP_NAME,
        'WhatsApp: ' + waNumber,
        'Email: ' + contactEmail
      ].join('\n');

      GmailApp.sendEmail(customerData.email, subject, body, {
        name: Config.APP_NAME,
        replyTo: Config.ADMIN_EMAIL
      });

      Utils.logAudit('confirmation_email_sent', 'system', { orderNumber: orderNumber });
      return { success: true };
    } catch (error) {
      Logger.log('Confirmation email error: ' + error.message);
      return { success: false, error: error.message };
    }
  }
};