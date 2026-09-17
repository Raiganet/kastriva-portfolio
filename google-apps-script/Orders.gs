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
  create: function(input) {
    var data;
    try { data = DataIntegrity.validateOrder(input); }
    catch (e) { return { success: false, code: 'VALIDATION', committed: false, error: e.message }; }
    const requestId = input.requestId.toLowerCase();
    const requestHash = Security.hash(JSON.stringify(data));
    return DataIntegrity.mutate(function() {
      const sheet = Config.getSheet('Orders');
      var headers;
      try { headers = DataIntegrity.headers(); }
      catch (e) { return { success: false, code: 'MIGRATION_REQUIRED', error: 'Pembaruan database belum dijalankan. Hubungi admin.' }; }
      const rows = sheet.getDataRange().getValues();
      const keyIndex = headers.indexOf('requestId');
      const hashIndex = headers.indexOf('requestHash');
      const found = rows.slice(1).find(function(row) { return row[keyIndex] === requestId; });
      if (found) {
        if (found[hashIndex] !== requestHash) return { success: false, code: 'IDEMPOTENCY_CONFLICT', error: 'Permintaan ini sudah digunakan dengan isi berbeda. Periksa order sebelumnya.' };
        return { success: true, data: { id: found[0], orderNumber: found[1], status: found[16], replayed: true } };
      }
      // A retry of a committed order is resolved BEFORE rate limiting or any writes.
      if (!Security.consume('order-global',30,3600000) || !Security.consume('order-email:' + data.email,5,3600000))
        return { success: false, code: 'RATE_LIMIT', committed: false, error: 'Terlalu banyak permintaan. Coba kembali setelah batas waktu berakhir.' };
      const customerId = Orders.findOrCreateCustomer(data);
      const orderId = Utils.generateId();
      const orderNumber = DataIntegrity.nextNumber('Orders','KAS');
      const now = new Date().toISOString();
      const values = [orderId,orderNumber,customerId,data.name,data.business,data.email,data.whatsapp,data.type,data.serviceId,data.portfolioId,data.portfolioTitle,data.budget,data.deadline,data.description,data.features,data.reference,'Submitted',now,now];
      const row = new Array(headers.length).fill('');
      values.forEach(function(value,i) { row[i] = i >= 3 && i <= 15 ? DataIntegrity.text(value) : value; });
      row[keyIndex] = requestId; row[hashIndex] = requestHash;
      row[headers.indexOf('notifications')] = JSON.stringify({ admin: { state:'pending',attempts:0 }, customer: { state:'pending',attempts:0 } });
      // Commit order, idempotency identity and email jobs in ONE row write.
      sheet.appendRow(row);
      SpreadsheetApp.flush();
      Utils.logAudit('order_created',customerId,{orderId:orderId,orderNumber:orderNumber});
      return { success: true, data: { id:orderId,orderNumber:orderNumber,status:'Submitted',replayed:false } };
    });
  },

  /**
   * Cari customer berdasarkan email, atau buat baru jika belum ada
   */
  findOrCreateCustomer: function(data) {
    const sheet = Config.getSheet('Customers');
    const values = sheet.getDataRange().getValues();

    for (let i = 1; i < values.length; i++) {
      if (String(values[i][2]).trim().toLowerCase() === String(data.email).trim().toLowerCase()) {
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
      DataIntegrity.text(data.name),
      DataIntegrity.text(data.email),
      DataIntegrity.text(data.whatsapp),
      DataIntegrity.text(data.business || ''),
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

      // Workflow-managed states (Quotation, Approved, In Progress, Revision, Handover, Completed)
      // are written only by their dedicated modules to avoid bypassing approval/handover rules.
      const validStatuses = ['Submitted', 'Reviewing', 'Discussing', 'Cancelled'];
      if (validStatuses.indexOf(data.status) === -1) {
        return { success: false, error: 'Invalid status' };
      }

      const sheet = Config.getSheet('Orders');
      const values = sheet.getDataRange().getValues();

      for (let i = 1; i < values.length; i++) {
        if (values[i][0] === data.id) {
          const existingTime = values[i][18] ? new Date(values[i][18]).toISOString() : '';
          if (typeof data.expectedUpdatedAt !== 'string' || data.expectedUpdatedAt !== existingTime)
            return { success:false,code:'CONFLICT',error:'Order telah diperbarui. Muat ulang sebelum mengubah status.' };
          const updatedAt = new Date(Math.max(Date.now(), (Date.parse(existingTime) || 0) + 1)).toISOString();
          sheet.getRange(i + 1, 17).setValue(data.status);              // Q = status
          sheet.getRange(i + 1, 19).setValue(updatedAt); // S = updatedAt

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
  getByOrderNumber: function(orderNumber, customerId) {
    try {
      if (!customerId || !orderNumber || !/^KAS-\d{4}-\d{4,}$/.test(String(orderNumber))) {
        return { success: false, error: 'Format nomor order tidak valid' };
      }

      const sheet = Config.getSheet('Orders');
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const rows = data.slice(1);

      for (let i = 0; i < rows.length; i++) {
        if (String(rows[i][1]).toUpperCase() === String(orderNumber).toUpperCase() && String(rows[i][2]) === String(customerId)) {

          // Build order object
          const order = {};
          headers.forEach(function(header, j) { if (['requestId','requestHash','notifications'].indexOf(header) === -1) order[header] = rows[i][j]; });

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

      return Utils.sendEmail(Config.ADMIN_EMAIL, subject, body);
    } catch (error) {
      Logger.log('Admin notification error: ' + error.message);
      return { success: false };
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
        'setelah login menggunakan kode verifikasi yang dikirim ke email Anda.',
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