/**
 * KASTRIVA - Customer Portal (Stage 3)
 * Customer data is always filtered by customerId from the verified session.
 */
const CustomerPortal = {
  getDashboard: function(customerId) {
    try {
      var mapRows = function(name, filterFn) {
        try {
          const sheet = Config.getSheet(name);
          const data = sheet.getDataRange().getValues();
          const headers = data[0] || [];
          return data.slice(1)
            .filter(function(r) { return r[0] !== ''; })
            .filter(filterFn)
            .map(function(r) {
              var o = {};
              headers.forEach(function(h, i) {
                if (['requestId','requestHash','notifications'].indexOf(h) === -1) o[h] = r[i];
              });
              return o;
            });
        } catch (e) { return []; }
      };

      var orders = mapRows('Orders', function(r) { return String(r[2]) === String(customerId); })
        .sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });

      var revisions = mapRows('Revisions', function(r) { return String(r[4]) === String(customerId); })
        .sort(function(a, b) { return new Date(b.requestedAt) - new Date(a.requestedAt); });

      var projects = mapRows('Projects', function(r) { return String(r[2]) === String(customerId); });
      projects.forEach(function(pr) {
        pr.updates = mapRows('ProjectUpdates', function(r) { return String(r[1]) === String(pr.id); })
          .sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
        pr.revisions = revisions.filter(function(r) { return String(r.projectId) === String(pr.id); });
        pr.revisionLimit = Revisions.quotaForOrder(pr.orderId);
        pr.revisionUsed = pr.revisions.filter(function(r) { return r.status !== 'Rejected'; }).length;
      });

      var quotations = mapRows('Quotations', function(r) { return String(r[3]) === String(customerId); })
        .map(function(q) {
          q.items = Workflow.parseJsonArray(q.items);
          q.revisionLimit = q.revisionLimit === '' || q.revisionLimit == null ? 2 : Number(q.revisionLimit);
          q.displayStatus = q.status === 'sent' && Quotations.isExpired(q) ? 'expired' : q.status;
          return q;
        })
        .sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });

      var invoices = mapRows('Invoices', function(r) { return String(r[3]) === String(customerId); })
        .map(function(inv) {
          inv.items = Workflow.parseJsonArray(inv.items);
          inv.total = Number(inv.total || 0);
          inv.amountPaid = Number(inv.amountPaid || 0);
          inv.balance = Math.max(0, inv.total - inv.amountPaid);
          inv.displayStatus = inv.paymentStatus;
          if (inv.paymentStatus !== 'Paid' && inv.paymentStatus !== 'Cancelled' && inv.dueDate) {
            var due = new Date(inv.dueDate);
            if (!isNaN(due.getTime()) && due < new Date()) inv.displayStatus = 'Overdue';
          }
          return inv;
        })
        .sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });

      var handovers = mapRows('Handovers', function(r) { return String(r[4]) === String(customerId); })
        .map(function(h) { h.deliverables = Workflow.parseJsonArray(h.deliverables); return h; })
        .sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });

      return {
        success: true,
        data: {
          orders: orders,
          projects: projects,
          quotations: quotations,
          invoices: invoices,
          revisions: revisions,
          handovers: handovers
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
