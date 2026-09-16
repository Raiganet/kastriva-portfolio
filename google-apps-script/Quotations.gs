/**
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
      const m = last.match(/QTN-\d{4}-(\d+)/);
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
        lines.join('\n'),
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
        'Anda dapat MENYETUJUI atau MENOLAK penawaran ini melalui Customer Dashboard di website kami (menu Customer → login dengan kode verifikasi email).',
        '',
        'Salam,',
        'Tim ' + Config.APP_NAME
      ].join('\n');

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
              'Customer telah menyetujui quotation ' + quotationNumber + '.\nSegera convert order menjadi project di Admin Dashboard.'
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
