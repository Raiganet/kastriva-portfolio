/**
 * KASTRIVA - Project Handover (Stage 3)
 * Final delivery is explicitly sent and accepted by the customer.
 */
const Handovers = {
  generateNumber: function() { return DataIntegrity.nextNumber('Handovers', 'HOV'); },

  create: function(data) {
    try {
      if (!data.projectId) return { success: false, error: 'Pilih project' };
      const projectFound = Workflow.projectById(data.projectId);
      if (!projectFound) return { success: false, error: 'Project tidak ditemukan' };
      const project = projectFound.data;
      if (Number(project.progress || 0) < 90) return { success: false, error: 'Progress project minimal 90% sebelum serah terima' };

      const openRevision = Workflow.getAll('Revisions').find(function(r) {
        return String(r.projectId) === String(project.id) && (r.status === 'Requested' || r.status === 'In Progress');
      });
      if (openRevision) return { success: false, error: 'Selesaikan revisi ' + openRevision.revisionNumber + ' sebelum serah terima' };

      const existing = Workflow.getAll('Handovers').find(function(h) {
        return String(h.projectId) === String(project.id) && h.status !== 'Cancelled';
      });
      if (existing) return { success: false, error: 'Serah terima project ini sudah ada: ' + existing.handoverNumber };

      const rawDeliverables = Array.isArray(data.deliverables) ? data.deliverables.slice(0, 20) : [];
      const deliverables = rawDeliverables.map(function(item) {
        const name = Workflow.cleanText(item.name || '', 200);
        if (!name) return null;
        return { name: name, url: item.url ? Workflow.cleanUrl(item.url) : '', type: Workflow.cleanText(item.type || 'Link', 80) };
      }).filter(Boolean);
      if (!deliverables.length && !data.liveUrl && !data.repositoryUrl && !data.adminUrl) {
        return { success: false, error: 'Tambahkan minimal satu hasil serah terima atau URL project' };
      }

      const now = new Date().toISOString();
      const id = Utils.generateId();
      const number = this.generateNumber();
      const liveUrl = data.liveUrl ? Workflow.cleanUrl(data.liveUrl) : '';
      const repositoryUrl = data.repositoryUrl ? Workflow.cleanUrl(data.repositoryUrl) : '';
      const adminUrl = data.adminUrl ? Workflow.cleanUrl(data.adminUrl) : '';
      const notes = Workflow.cleanText(data.notes || '', 1800);

      Workflow.appendObject('Handovers', {
        id: id,
        handoverNumber: number,
        projectId: project.id,
        orderId: project.orderId,
        customerId: project.customerId,
        projectName: project.projectName,
        deliverables: JSON.stringify(deliverables),
        liveUrl: liveUrl,
        repositoryUrl: repositoryUrl,
        adminUrl: adminUrl,
        notes: notes,
        warrantyUntil: String(data.warrantyUntil || ''),
        status: 'Sent',
        sentAt: now,
        acceptedAt: '',
        createdAt: now,
        updatedAt: now
      });

      Workflow.setProjectStatus(project.id, 'Handover', Math.max(95, Number(project.progress || 0)), now);
      Workflow.setOrderStatus(project.orderId, 'Handover', now);

      const orderFound = Workflow.orderById(project.orderId);
      if (orderFound && orderFound.data.email) {
        Utils.sendEmail(orderFound.data.email, 'Serah Terima ' + number + ' | ' + Config.APP_NAME, [
          'Halo ' + orderFound.data.name + ',', '',
          'Project Anda sudah memasuki tahap serah terima.', '',
          'Nomor: ' + number,
          'Project: ' + project.projectName,
          'Garansi/support hingga: ' + (data.warrantyUntil || '-'), '',
          'Silakan periksa hasil project dan tekan "Terima Serah Terima" pada Customer Dashboard setelah semuanya sesuai.', '',
          'Catatan keamanan: password/secret tidak dikirim atau disimpan di dokumen serah terima ini. Gunakan kanal aman terpisah untuk kredensial.', '',
          'Salam,', 'Tim ' + Config.APP_NAME
        ].join('\n'));
      }

      Utils.logAudit('handover_sent', 'admin', { handoverId: id, handoverNumber: number, projectId: project.id });
      return { success: true, data: { id: id, handoverNumber: number } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getAll: function() {
    try {
      const rows = Workflow.getAll('Handovers').map(function(h) {
        h.deliverables = Workflow.parseJsonArray(h.deliverables);
        return h;
      }).sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
      return { success: true, data: rows };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  respond: function(data, customerId) {
    try {
      if (!data.handoverId || data.response !== 'Accepted') return { success: false, error: 'Respons serah terima tidak valid' };
      const found = Workflow.find('Handovers', 'id', data.handoverId);
      if (!found) return { success: false, error: 'Serah terima tidak ditemukan' };
      if (String(found.data.customerId) !== String(customerId)) return { success: false, error: 'Unauthorized' };
      if (found.data.status !== 'Sent') return { success: false, error: 'Serah terima sudah diproses sebelumnya' };

      const now = new Date().toISOString();
      Workflow.setFields(found, { status: 'Accepted', acceptedAt: now, updatedAt: now });
      Workflow.setProjectStatus(found.data.projectId, 'Completed', 100, now);
      Workflow.setOrderStatus(found.data.orderId, 'Completed', now);
      Utils.sendEmail(Config.ADMIN_EMAIL, '✅ Serah terima ' + found.data.handoverNumber + ' diterima', 'Customer telah menerima serah terima project ' + found.data.projectName + '. Project otomatis ditandai selesai.');
      Utils.logAudit('handover_accepted', customerId, { handoverId: data.handoverId, projectId: found.data.projectId });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
