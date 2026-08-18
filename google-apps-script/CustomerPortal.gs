/**
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
