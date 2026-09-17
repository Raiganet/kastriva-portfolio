/**
 * KASTRIVA - Quotations Module (Stage 3)
 * Professional quotation flow: server-side totals, revision quota, payment terms,
 * customer response note, idempotent active quotation protection.
 */
const Quotations = {
  generateNumber: function() { return DataIntegrity.nextNumber('Quotations', 'QTN'); },

  isExpired: function(q) {
    if (!q || !q.validUntil) return false;
    const due = new Date(String(q.validUntil) + 'T23:59:59');
    return !isNaN(due.getTime()) && due.getTime() < Date.now();
  },

  create: function(data) {
    try {
      if (!data.orderId || !Array.isArray(data.items) || data.items.length === 0) {
        return { success: false, error: 'Order dan items wajib diisi' };
      }

      const orderFound = Workflow.orderById(data.orderId);
      if (!orderFound) return { success: false, error: 'Order tidak ditemukan' };
      const order = orderFound.data;

      // Prevent accidental duplicate active quotations for the same order.
      const active = Workflow.getAll('Quotations').find(function(q) {
        return String(q.orderId) === String(data.orderId) && (q.status === 'approved' || (q.status === 'sent' && !Quotations.isExpired(q)));
      });
      if (active) {
        return { success: false, error: 'Order ini masih memiliki penawaran aktif: ' + active.quotationNumber };
      }

      var subtotal = 0;
      var cleanItems = [];
      data.items.slice(0, 30).forEach(function(it) {
        const description = Workflow.cleanText(it.description || '', 300);
        const qty = Math.max(1, Math.min(999, Number(it.qty) || 1));
        const price = Math.max(0, Math.min(999999999999, Number(it.price) || 0));
        if (!description || price <= 0) return;
        const total = qty * price;
        subtotal += total;
        cleanItems.push({ description: description, qty: qty, price: price, total: total });
      });
      if (!cleanItems.length) return { success: false, error: 'Minimal satu item penawaran harus valid' };

      const discount = Math.max(0, Math.min(subtotal, Number(data.discount) || 0));
      const taxPercent = Math.max(0, Math.min(100, Number(data.tax) || 0));
      const taxAmount = Math.round((subtotal - discount) * taxPercent / 100);
      const total = subtotal - discount + taxAmount;
      const revisionRaw = Number(data.revisionLimit);
      const revisionLimit = isFinite(revisionRaw) ? Math.max(0, Math.min(20, Math.floor(revisionRaw))) : 2;
      const paymentTerms = Workflow.cleanText(data.paymentTerms || 'Pembayaran mengikuti invoice yang diterbitkan setelah penawaran disetujui.', 1000);
      const notes = Workflow.cleanText(data.notes || '', 1500);
      const projectName = Workflow.cleanText(data.projectName || (order.projectType + ' - ' + order.name), 200);
      const now = new Date().toISOString();
      const id = Utils.generateId();
      const number = this.generateNumber();

      Workflow.appendObject('Quotations', {
        id: id,
        quotationNumber: number,
        orderId: order.id,
        customerId: order.customerId,
        projectName: projectName,
        items: JSON.stringify(cleanItems),
        subtotal: subtotal,
        discount: discount,
        tax: taxAmount,
        total: total,
        notes: notes,
        validUntil: String(data.validUntil || ''),
        status: 'sent',
        createdAt: now,
        updatedAt: now,
        revisionLimit: revisionLimit,
        paymentTerms: paymentTerms,
        customerNote: '',
        respondedAt: ''
      });

      Workflow.setFields(orderFound, { status: 'Quotation', updatedAt: now });

      var lines = cleanItems.map(function(x) {
        return '- ' + x.description + ' (x' + x.qty + ') = Rp ' + Number(x.total).toLocaleString('id-ID');
      });
      var body = [
        'Halo ' + order.name + ',', '',
        'Berikut penawaran resmi untuk project Anda:', '',
        '📄 Nomor: ' + number,
        '📌 Project: ' + projectName, '',
        'RINCIAN:', lines.join('\n'), '',
        'Subtotal: Rp ' + subtotal.toLocaleString('id-ID'),
        'Diskon: - Rp ' + discount.toLocaleString('id-ID'),
        'Pajak: + Rp ' + taxAmount.toLocaleString('id-ID'),
        '💰 TOTAL: Rp ' + total.toLocaleString('id-ID'), '',
        'Revisi termasuk: ' + revisionLimit + ' kali',
        'Ketentuan pembayaran: ' + paymentTerms,
        'Berlaku hingga: ' + (data.validUntil || '-'), '',
        notes, '',
        'Silakan login ke Customer Dashboard untuk menyetujui atau menolak penawaran.', '',
        'Salam,', 'Tim ' + Config.APP_NAME
      ].join('\n');
      if (order.email) Utils.sendEmail(order.email, 'Penawaran ' + number + ' | ' + Config.APP_NAME, body);

      Utils.logAudit('quotation_created', 'admin', { quotationId: id, orderNumber: order.orderNumber, total: total });
      return { success: true, data: { id: id, quotationNumber: number, total: total } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getAll: function() {
    try {
      const rows = Workflow.getAll('Quotations').map(function(q) {
        q.items = Workflow.parseJsonArray(q.items);
        q.revisionLimit = q.revisionLimit === '' || q.revisionLimit == null ? 2 : Number(q.revisionLimit);
        q.displayStatus = q.status === 'sent' && Quotations.isExpired(q) ? 'expired' : q.status;
        return q;
      }).sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
      return { success: true, data: rows };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  respond: function(data, customerId) {
    try {
      if (!data.quotationId || ['approved', 'rejected'].indexOf(data.response) < 0) {
        return { success: false, error: 'Respons penawaran tidak valid' };
      }
      const found = Workflow.find('Quotations', 'id', data.quotationId);
      if (!found) return { success: false, error: 'Penawaran tidak ditemukan' };
      if (String(found.data.customerId) !== String(customerId)) return { success: false, error: 'Unauthorized' };
      if (found.data.status !== 'sent') return { success: false, error: 'Penawaran sudah direspons sebelumnya' };
      if (this.isExpired(found.data)) return { success: false, error: 'Masa berlaku penawaran sudah berakhir. Hubungi admin untuk penawaran terbaru.' };

      const now = new Date().toISOString();
      const customerNote = Workflow.cleanText(data.customerNote || '', 1000);
      Workflow.setFields(found, {
        status: data.response,
        customerNote: customerNote,
        respondedAt: now,
        updatedAt: now
      });

      if (data.response === 'approved') {
        Workflow.setOrderStatus(found.data.orderId, 'Approved', now);
        Utils.sendEmail(
          Config.ADMIN_EMAIL,
          '✅ Penawaran ' + found.data.quotationNumber + ' disetujui',
          'Customer menyetujui penawaran ' + found.data.quotationNumber + '.\nTotal: Rp ' + Number(found.data.total || 0).toLocaleString('id-ID') + (customerNote ? '\nCatatan: ' + customerNote : '') + '\n\nLangkah berikutnya: terbitkan invoice dari Admin Dashboard.'
        );
      } else {
        Workflow.setOrderStatus(found.data.orderId, 'Discussing', now);
        Utils.sendEmail(
          Config.ADMIN_EMAIL,
          '❌ Penawaran ' + found.data.quotationNumber + ' ditolak',
          'Customer menolak penawaran ' + found.data.quotationNumber + '.' + (customerNote ? '\nAlasan/catatan: ' + customerNote : '') + '\nSilakan diskusikan ulang dan buat penawaran baru setelah penawaran ini ditutup.'
        );
      }

      Utils.logAudit('quotation_responded', customerId, { quotationId: data.quotationId, response: data.response });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
