/**
 * KASTRIVA - Router v3 (Phase 10)
 * 3 tier: public / admin-protected / customer-protected
 */

const Router = {

  handle: function(action, params, body, method) {

    // ===== AUTH ENDPOINTS =====
    if (action === 'login') return Auth.login(body.email, body.password);
    if (action === 'logout') return Auth.logout(params.token || body.token);
    if (action === 'customerLogin') return CustomerAuth.login(body.email, body.orderNumber);
    if (action === 'customerLogout') return CustomerAuth.logout(params.token || body.token);

    // ===== PUBLIC =====
    const publicActions = [
      'getPortfolio', 'getPortfolioBySlug', 'getPortfolioCategories',
      'getServices', 'getSettings', 'createOrder', 'getOrderByNumber', 'health'
    ];

    // ===== ADMIN PROTECTED =====
    const adminActions = [
      'getDashboardStats', 'getOrders', 'getOrder', 'updateOrderStatus',
      'getCustomers', 'getCustomer',
      'getProjects', 'getProject', 'createProject', 'createProjectUpdate',
      'createQuotation', 'getQuotations',
      'createInvoice', 'getInvoices',
      'sendMessage', 'getMessages', 'uploadFile',
      'getNotifications', 'markNotificationRead'
    ];

    // ===== CUSTOMER PROTECTED =====
    const customerActions = ['getMyDashboard', 'respondQuotation'];

    if (publicActions.indexOf(action) === -1 &&
        adminActions.indexOf(action) === -1 &&
        customerActions.indexOf(action) === -1) {
      return { success: false, error: 'Invalid action: ' + action };
    }

    var adminSession = null;
    var customerSession = null;

    if (adminActions.indexOf(action) !== -1) {
      const r = Auth.verifyToken(params.token || body.token);
      if (!r.success) return { success: false, error: 'Unauthorized: ' + r.error };
      adminSession = r.data;
    }

    if (customerActions.indexOf(action) !== -1) {
      const r = CustomerAuth.verify(params.token || body.token);
      if (!r.success) return { success: false, error: 'Unauthorized: ' + r.error };
      customerSession = r.data;
    }

    switch (action) {
      // PUBLIC
      case 'health':
        return { success: true, data: { status: 'ok', timestamp: new Date().toISOString(), version: Config.APP_VERSION } };
      case 'getPortfolio': return Portfolio.getAll(params);
      case 'getPortfolioBySlug': return Portfolio.getBySlug(params.slug);
      case 'getPortfolioCategories': return Portfolio.getCategories();
      case 'getServices': return Services.getAll();
      case 'getSettings': return Settings.getAll();
      case 'createOrder': return Orders.create(body);
      case 'getOrderByNumber': return Orders.getByOrderNumber(params.orderNumber);

      // ADMIN
      case 'getDashboardStats': return Stats.getDashboard();
      case 'getOrders': return Orders.getAll(params);
      case 'getOrder': return Orders.getById(params.id);
      case 'updateOrderStatus': return Orders.updateStatus(body);
      case 'getCustomers': return Customers.getAll(params);
      case 'getCustomer': return Customers.getById(params.id);
      case 'getProjects': return Projects.getAll(params);
      case 'getProject': return Projects.getById(params.id);
      case 'createProject': return Projects.create(body);
      case 'createProjectUpdate': return Projects.createUpdate(body);
      case 'createQuotation': return Quotations.create(body);
      case 'getQuotations': return Quotations.getAll(params);

      // CUSTOMER
      case 'getMyDashboard': return CustomerPortal.getDashboard(customerSession.customerId);
      case 'respondQuotation': return Quotations.respond(body, customerSession.customerId);

      default:
        return { success: false, error: 'Action not implemented: ' + action };
    }
  }
};
