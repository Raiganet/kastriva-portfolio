/**
 * KASTRIVA - Revision Requests (Stage 3)
 * Customer feedback becomes a traceable request instead of an informal chat only.
 */
const Revisions = {
  generateNumber: function() { return DataIntegrity.nextNumber('Revisions', 'REV'); },

  quotaForOrder: function(orderId) {
    const approved = Workflow.getAll('Quotations').filter(function(q) {
      return String(q.orderId) === String(orderId) && q.status === 'approved';
    }).sort(function(a, b) { return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt); })[0];
    return approved ? Math.max(0, Number(approved.revisionLimit || 2)) : 2;
  },

  request: function(data, customerId) {
    try {
      if (!data.projectId || !String(data.title || '').trim() || !String(data.description || '').trim()) {
        return { success: false, error: 'Project, judul, dan detail revisi wajib diisi' };
      }
      const projectFound = Workflow.projectById(data.projectId);
      if (!projectFound) return { success: false, error: 'Project tidak ditemukan' };
      const project = projectFound.data;
      if (String(project.customerId) !== String(customerId)) return { success: false, error: 'Unauthorized' };
      if (project.status === 'Completed') return { success: false, error: 'Project sudah selesai dan serah terima telah diterima' };
      if (project.status === 'Handover') return { success: false, error: 'Project sedang dalam tahap serah terima. Hubungi admin bila masih ada koreksi.' };

      const handoverAccepted = Workflow.getAll('Handovers').some(function(h) {
        return String(h.projectId) === String(data.projectId) && h.status === 'Accepted';
      });
      if (handoverAccepted) return { success: false, error: 'Serah terima project sudah diterima' };

      const allForProject = Workflow.getAll('Revisions').filter(function(r) { return String(r.projectId) === String(data.projectId); });
      const quota = this.quotaForOrder(project.orderId);
      const used = allForProject.filter(function(r) { return r.status !== 'Rejected'; }).length;
      if (quota > 0 && used >= quota) {
        return { success: false, code: 'REVISION_LIMIT', error: 'Kuota revisi pada penawaran sudah digunakan (' + used + '/' + quota + '). Hubungi admin untuk perubahan scope tambahan.' };
      }

      const now = new Date().toISOString();
      const id = Utils.generateId();
      const number = this.generateNumber();
      const priority = ['Low','Normal','High'].indexOf(data.priority) >= 0 ? data.priority : 'Normal';
      Workflow.appendObject('Revisions', {
        id: id,
        revisionNumber: number,
        projectId: project.id,
        orderId: project.orderId,
        customerId: customerId,
        title: Workflow.cleanText(data.title, 200),
        description: Workflow.cleanText(data.description, 2000),
        status: 'Requested',
        priority: priority,
        adminResponse: '',
        requestedAt: now,
        updatedAt: now,
        resolvedAt: ''
      });

      Workflow.setProjectStatus(project.id, 'Revision', project.progress, now);
      Workflow.setOrderStatus(project.orderId, 'Revision', now);
      Utils.sendEmail(Config.ADMIN_EMAIL, '🔁 Permintaan revisi ' + number + ' | ' + project.projectName, 'Customer mengirim revisi baru:\n\n' + data.title + '\n' + data.description + '\n\nBuka Admin → Revisi untuk menindaklanjuti.');
      Utils.logAudit('revision_requested', customerId, { revisionId: id, projectId: project.id, revisionNumber: number });
      return { success: true, data: { id: id, revisionNumber: number, used: used + 1, limit: quota } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getAll: function() {
    try {
      const rows = Workflow.getAll('Revisions').sort(function(a, b) { return new Date(b.requestedAt) - new Date(a.requestedAt); });
      return { success: true, data: rows };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  update: function(data) {
    try {
      if (!data.revisionId || ['Requested','In Progress','Resolved','Rejected'].indexOf(data.status) < 0) {
        return { success: false, error: 'Status revisi tidak valid' };
      }
      const found = Workflow.find('Revisions', 'id', data.revisionId);
      if (!found) return { success: false, error: 'Revisi tidak ditemukan' };
      const now = new Date().toISOString();
      const response = Workflow.cleanText(data.adminResponse || '', 1600);
      Workflow.setFields(found, {
        status: data.status,
        adminResponse: response,
        updatedAt: now,
        resolvedAt: data.status === 'Resolved' || data.status === 'Rejected' ? now : ''
      });

      const projectFound = Workflow.projectById(found.data.projectId);
      if (projectFound) {
        const open = Workflow.getAll('Revisions').some(function(r) {
          return String(r.projectId) === String(found.data.projectId) && String(r.id) !== String(data.revisionId) && (r.status === 'Requested' || r.status === 'In Progress');
        });
        if (data.status === 'Requested' || data.status === 'In Progress' || open) {
          Workflow.setProjectStatus(projectFound.data.id, 'Revision', projectFound.data.progress, now);
          Workflow.setOrderStatus(projectFound.data.orderId, 'Revision', now);
        } else if (projectFound.data.status !== 'Completed') {
          Workflow.setProjectStatus(projectFound.data.id, 'In Progress', projectFound.data.progress, now);
          Workflow.setOrderStatus(projectFound.data.orderId, 'In Progress', now);
        }
      }

      const orderFound = Workflow.orderById(found.data.orderId);
      if (orderFound && orderFound.data.email) {
        Utils.sendEmail(orderFound.data.email, 'Update revisi ' + found.data.revisionNumber + ' | ' + Config.APP_NAME, [
          'Halo ' + orderFound.data.name + ',', '',
          'Permintaan revisi Anda telah diperbarui.', '',
          'Nomor: ' + found.data.revisionNumber,
          'Status: ' + data.status,
          response ? 'Respons admin: ' + response : '', '',
          'Detail lengkap tersedia di Customer Dashboard.', '',
          'Salam,', 'Tim ' + Config.APP_NAME
        ].join('\n'));
      }
      Utils.logAudit('revision_updated', 'admin', { revisionId: data.revisionId, status: data.status });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
