/**
 * KASTRIVA - Projects Module (Phase 9)
 * Convert order -> project, progress tracking, update timeline
 */

const Projects = {

  /**
   * Convert order menjadi project (admin)
   */
  create: function(data) {
    try {
      if (!data.orderId) {
        return { success: false, error: 'Missing orderId' };
      }

      // Cari order
      const ordersSheet = Config.getSheet('Orders');
      const oData = ordersSheet.getDataRange().getValues();
      var orderRow = -1;
      var order = null;

      for (var i = 1; i < oData.length; i++) {
        if (oData[i][0] === data.orderId) {
          orderRow = i;
          order = {
            id: oData[i][0],
            orderNumber: oData[i][1],
            customerId: oData[i][2],
            name: oData[i][3],
            projectType: oData[i][7],
            deadline: oData[i][12],
            description: oData[i][13]
          };
          break;
        }
      }

      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      // Cek duplikat
      const sheet = Config.getSheet('Projects');
      const pData = sheet.getDataRange().getValues();
      for (var p = 1; p < pData.length; p++) {
        if (pData[p][1] === data.orderId) {
          return { success: false, error: 'Project sudah ada untuk order ini' };
        }
      }

      const projectId = Utils.generateId();
      const now = new Date().toISOString();

      sheet.appendRow([
        projectId,
        order.id,
        order.customerId,
        data.projectName || (order.projectType + ' - ' + order.name),
        data.description || order.description,
        'In Progress',
        0,
        now,
        order.deadline || '',
        '',
        now,
        now
      ]);

      // Sync order status -> In Progress (Q=17, S=19)
      ordersSheet.getRange(orderRow + 1, 17).setValue('In Progress');
      ordersSheet.getRange(orderRow + 1, 19).setValue(now);

      Utils.logAudit('project_created', 'admin', {
        projectId: projectId,
        orderId: order.id
      });

      return { success: true, data: { id: projectId } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Get semua projects (admin)
   */
  getAll: function(params) {
    try {
      const sheet = Config.getSheet('Projects');
      const data = sheet.getDataRange().getValues();
      const headers = data[0];

      var projects = data.slice(1)
        .filter(function(r) { return r[0] !== ''; })
        .map(function(row) {
          var obj = {};
          headers.forEach(function(h, i) { obj[h] = row[i]; });
          return obj;
        });

      projects.sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });

      return { success: true, data: projects };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Get project by id + updates + order info (admin)
   */
  getById: function(id) {
    try {
      const all = this.getAll({});
      if (!all.success) return all;

      const project = all.data.find(function(p) { return p.id === id; });
      if (!project) return { success: false, error: 'Project not found' };

      // Updates
      var updates = [];
      try {
        const uSheet = Config.getSheet('ProjectUpdates');
        const uData = uSheet.getDataRange().getValues();
        const uHeaders = uData[0];
        updates = uData.slice(1)
          .filter(function(r) { return r[1] === id; })
          .map(function(r) {
            var u = {};
            uHeaders.forEach(function(h, i) { u[h] = r[i]; });
            return u;
          })
          .sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
      } catch (e) {}

      // Order info
      var order = null;
      try {
        const oSheet = Config.getSheet('Orders');
        const oData = oSheet.getDataRange().getValues();
        for (var i = 1; i < oData.length; i++) {
          if (oData[i][0] === project.orderId) {
            order = {
              orderNumber: oData[i][1],
              customerName: oData[i][3],
              customerEmail: oData[i][5],
              whatsapp: oData[i][6]
            };
            break;
          }
        }
      } catch (e) {}

      return { success: true, data: { project: project, updates: updates, order: order } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Post update progress (admin)
   * Sync: ProjectUpdates + Projects + Orders + email customer
   */
  createUpdate: function(data) {
    try {
      if (!data.projectId || !data.title) {
        return { success: false, error: 'Missing projectId or title' };
      }

      const progress = Math.max(0, Math.min(100, Number(data.progress) || 0));
      const status = data.status || 'In Progress';

      const sheet = Config.getSheet('Projects');
      const pData = sheet.getDataRange().getValues();
      var projectRow = -1;
      var project = null;

      for (var i = 1; i < pData.length; i++) {
        if (pData[i][0] === data.projectId) {
          projectRow = i;
          project = { id: pData[i][0], orderId: pData[i][1], name: pData[i][3] };
          break;
        }
      }

      if (!project) return { success: false, error: 'Project not found' };

      const now = new Date().toISOString();

      // 1. Insert update timeline
      const uSheet = Config.getSheet('ProjectUpdates');
      uSheet.appendRow([
        Utils.generateId(),
        data.projectId,
        Utils.sanitize(data.title),
        Utils.sanitize(data.description || ''),
        progress,
        status,
        now,
        'admin'
      ]);

      // 2. Update project (F=6 status, G=7 progress, J=10 completed, L=12 updated)
      sheet.getRange(projectRow + 1, 6).setValue(status);
      sheet.getRange(projectRow + 1, 7).setValue(progress);
      if (status === 'Completed') {
        sheet.getRange(projectRow + 1, 10).setValue(now);
      }
      sheet.getRange(projectRow + 1, 12).setValue(now);

      // 3. Sync order status + kirim email customer
      try {
        const oSheet = Config.getSheet('Orders');
        const oData = oSheet.getDataRange().getValues();
        for (var o = 1; o < oData.length; o++) {
          if (oData[o][0] === project.orderId) {
            oSheet.getRange(o + 1, 17).setValue(status);
            oSheet.getRange(o + 1, 19).setValue(now);

            var customerEmail = oData[o][5];
            var customerName = oData[o][3];
            if (customerEmail) {
              var subject = 'Update Project: ' + project.name + ' (' + progress + '%) | ' + Config.APP_NAME;
              var body = [
                'Halo ' + customerName + ',',
                '',
                'Ada update terbaru untuk project Anda:',
                '',
                '📌 ' + data.title,
                data.description || '',
                '',
                'Progress: ' + progress + '%',
                'Status: ' + status,
                '',
                'Lihat timeline lengkap di halaman "Lacak Order" menggunakan nomor order Anda.',
                '',
                'Salam,',
                'Tim ' + Config.APP_NAME
              ].join('\n');
              Utils.sendEmail(customerEmail, subject, body);
            }
            break;
          }
        }
      } catch (e) {
        Logger.log('order sync / email error: ' + e.message);
      }

      Utils.logAudit('project_update_created', 'admin', {
        projectId: data.projectId,
        progress: progress,
        status: status
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
