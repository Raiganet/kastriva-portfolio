/**
 * KASTRIVA - Stats Module (Phase 8)
 * Statistik untuk admin dashboard
 */

const Stats = {

  getDashboard: function() {
    try {
      var read = function(name) {
        try {
          return Config.getSheet(name).getDataRange().getValues().slice(1)
            .filter(function(r) { return r[0] !== ''; });
        } catch (e) {
          return [];
        }
      };

      var orders = read('Orders');
      var customers = read('Customers');
      var projects = read('Projects');
      var quotations = read('Quotations');

      // Hitung per status (kolom Q = index 16)
      var statusBreakdown = {};
      orders.forEach(function(r) {
        var s = r[16] || 'Unknown';
        statusBreakdown[s] = (statusBreakdown[s] || 0) + 1;
      });

      // 5 order terbaru (kolom R = index 17 = createdAt)
      var recentOrders = orders.slice()
        .sort(function(a, b) { return new Date(b[17]) - new Date(a[17]); })
        .slice(0, 5)
        .map(function(r) {
          return {
            id: r[0],
            orderNumber: r[1],
            name: r[3],
            projectType: r[7],
            status: r[16],
            createdAt: r[17]
          };
        });

      return {
        success: true,
        data: {
          totalOrders: orders.length,
          newOrders: statusBreakdown['Submitted'] || 0,
          activeProjects: projects.filter(function(r) {
            return r[5] !== 'Completed' && r[5] !== 'Cancelled' && r[5] !== '';
          }).length,
          completedProjects: projects.filter(function(r) {
            return r[5] === 'Completed';
          }).length,
          totalCustomers: customers.length,
          pendingQuotations: quotations.filter(function(r) {
            return r[12] === 'pending' || r[12] === 'sent';
          }).length,
          statusBreakdown: statusBreakdown,
          recentOrders: recentOrders
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
