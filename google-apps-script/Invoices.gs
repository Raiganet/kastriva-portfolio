/**
 * KASTRIVA - Invoices Module (Stage 3)
 * Invoice is generated from an APPROVED quotation so commercial totals cannot drift.
 */
const Invoices = {
  generateNumber: function() { return DataIntegrity.nextNumber('Invoices', 'INV'); },

  create: function(data) {
    try {
      if (!data.quotationId) return { success: false, error: 'Pilih penawaran yang sudah disetujui' };
      const quotationFound = Workflow.find('Quotations', 'id', data.quotationId);
      if (!quotationFound) return { success: false, error: 'Penawaran tidak ditemukan' };
      const q = quotationFound.data;
      if (q.status !== 'approved') return { success: false, error: 'Invoice hanya dapat dibuat dari penawaran yang disetujui' };

      const duplicate = Workflow.getAll('Invoices').find(function(inv) {
        return String(inv.quotationId) === String(data.quotationId) && inv.paymentStatus !== 'Cancelled';
      });
      if (duplicate) return { success: false, error: 'Invoice untuk penawaran ini sudah ada: ' + duplicate.invoiceNumber };

      const orderFound = Workflow.orderById(q.orderId);
      if (!orderFound) return { success: false, error: 'Order terkait tidak ditemukan' };
      const order = orderFound.data;
      const items = Workflow.parseJsonArray(q.items);
      const now = new Date().toISOString();
      const id = Utils.generateId();
      const number = this.generateNumber();
      const paymentMethod = Workflow.cleanText(data.paymentMethod || 'Transfer bank / metode yang disepakati', 500);
      const notes = Workflow.cleanText(data.notes || '', 1200);

      Workflow.appendObject('Invoices', {
        id: id,
        invoiceNumber: number,
        orderId: q.orderId,
        customerId: q.customerId,
        projectName: q.projectName,
        items: JSON.stringify(items),
        subtotal: Number(q.subtotal || 0),
        discount: Number(q.discount || 0),
        tax: Number(q.tax || 0),
        total: Number(q.total || 0),
        paymentStatus: 'Unpaid',
        dueDate: String(data.dueDate || ''),
        paymentMethod: paymentMethod,
        createdAt: now,
        updatedAt: now,
        quotationId: q.id,
        amountPaid: 0,
        notes: notes,
        paidAt: ''
      });

      if (order.email) {
        Utils.sendEmail(order.email, 'Invoice ' + number + ' | ' + Config.APP_NAME, [
          'Halo ' + order.name + ',', '',
          'Invoice untuk project Anda telah diterbitkan.', '',
          '🧾 Nomor: ' + number,
          '📌 Project: ' + q.projectName,
          '💰 Total: Rp ' + Number(q.total || 0).toLocaleString('id-ID'),
          '📅 Jatuh tempo: ' + (data.dueDate || '-'),
          '💳 Metode pembayaran: ' + paymentMethod, '',
          notes, '',
          'Detail invoice dapat dilihat pada Customer Dashboard.', '',
          'Salam,', 'Tim ' + Config.APP_NAME
        ].join('\n'));
      }

      Utils.logAudit('invoice_created', 'admin', { invoiceId: id, invoiceNumber: number, quotationId: q.id, total: Number(q.total || 0) });
      return { success: true, data: { id: id, invoiceNumber: number, total: Number(q.total || 0) } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getAll: function() {
    try {
      const now = new Date();
      const rows = Workflow.getAll('Invoices').map(function(inv) {
        inv.items = Workflow.parseJsonArray(inv.items);
        inv.total = Number(inv.total || 0);
        inv.amountPaid = Number(inv.amountPaid || 0);
        inv.balance = Math.max(0, inv.total - inv.amountPaid);
        inv.displayStatus = inv.paymentStatus;
        if (inv.paymentStatus !== 'Paid' && inv.paymentStatus !== 'Cancelled' && inv.dueDate) {
          const due = new Date(inv.dueDate);
          if (!isNaN(due.getTime()) && due < now) inv.displayStatus = 'Overdue';
        }
        return inv;
      }).sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
      return { success: true, data: rows };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  updatePayment: function(data) {
    try {
      if (!data.invoiceId || ['Unpaid','Partial','Paid','Cancelled'].indexOf(data.paymentStatus) < 0) {
        return { success: false, error: 'Status pembayaran tidak valid' };
      }
      const found = Workflow.find('Invoices', 'id', data.invoiceId);
      if (!found) return { success: false, error: 'Invoice tidak ditemukan' };
      if (found.data.paymentStatus === 'Cancelled' && data.paymentStatus !== 'Cancelled') {
        return { success: false, error: 'Invoice yang dibatalkan tidak dapat diaktifkan kembali' };
      }

      const total = Number(found.data.total || 0);
      var amountPaid = Math.max(0, Math.min(total, Number(data.amountPaid) || 0));
      if (data.paymentStatus === 'Paid') amountPaid = total;
      if (data.paymentStatus === 'Unpaid') amountPaid = 0;
      if (data.paymentStatus === 'Partial' && (amountPaid <= 0 || amountPaid >= total)) {
        return { success: false, error: 'Nominal pembayaran sebagian harus lebih dari 0 dan kurang dari total invoice' };
      }

      const now = new Date().toISOString();
      Workflow.setFields(found, {
        paymentStatus: data.paymentStatus,
        amountPaid: amountPaid,
        paidAt: data.paymentStatus === 'Paid' ? now : '',
        updatedAt: now
      });

      const orderFound = Workflow.orderById(found.data.orderId);
      if (orderFound && orderFound.data.email) {
        Utils.sendEmail(orderFound.data.email, 'Update pembayaran ' + found.data.invoiceNumber + ' | ' + Config.APP_NAME, [
          'Halo ' + orderFound.data.name + ',', '',
          'Status pembayaran invoice Anda telah diperbarui.', '',
          'Invoice: ' + found.data.invoiceNumber,
          'Status: ' + data.paymentStatus,
          'Dibayar: Rp ' + amountPaid.toLocaleString('id-ID'),
          'Sisa: Rp ' + Math.max(0, total - amountPaid).toLocaleString('id-ID'), '',
          'Salam,', 'Tim ' + Config.APP_NAME
        ].join('\n'));
      }

      Utils.logAudit('invoice_payment_updated', 'admin', { invoiceId: data.invoiceId, status: data.paymentStatus, amountPaid: amountPaid });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
