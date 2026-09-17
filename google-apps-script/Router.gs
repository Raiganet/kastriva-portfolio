/**
 * KASTRIVA - Router v3 (Phase 10)
 * 3 tier: public / admin-protected / customer-protected
 */

const Router = {

  handle: function(action, params, body, method) {

    // ===== AUTH ENDPOINTS =====
    if (action === '__adminAttempt') return Auth.attempt();
    if (action === 'login') return Auth.login(body);
    if (action === 'adminSession') return Auth.verifyToken(body.token);
    if (action === 'customerSession') return CustomerAuth.verify(body.token);
    if (action === 'logout') return Auth.logout(params.token || body.token);
    if (action === 'requestCustomerOtp') return CustomerAuth.request(body.email);
    if (action === 'verifyCustomerOtp') return CustomerAuth.verifyCode(body);
    if (action === 'customerLogout') return CustomerAuth.logout(params.token || body.token);

    // ===== PUBLIC =====
    const publicActions = [
      'getPortfolio', 'getPortfolioBySlug', 'getPortfolioCategories',
      'getServices', 'getSettings', 'createOrder', 'health'
    ];

    // ===== ADMIN PROTECTED =====
    const adminActions = [
      'getDashboardStats', 'getOrders', 'getOrder', 'updateOrderStatus',
      'getCustomers', 'getCustomer',
      'getProjects', 'getProject', 'createProject', 'createProjectUpdate',
      'getPortfolioAdmin', 'createPortfolio', 'updatePortfolio', 'deletePortfolio',
      'createQuotation', 'getQuotations',
      'createInvoice', 'getInvoices', 'updateInvoicePayment',
      'getRevisions', 'updateRevision',
      'createHandover', 'getHandovers',
      'sendMessage', 'getMessages', 'uploadFile',
      'getNotifications', 'markNotificationRead'
    ];

    // ===== CUSTOMER PROTECTED =====
    const customerActions = ['getMyDashboard', 'respondQuotation', 'getOrderByNumber', 'requestRevision', 'respondHandover'];

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
      case 'getOrderByNumber': return Orders.getByOrderNumber(params.orderNumber, customerSession.customerId);

      // ADMIN
      case 'getDashboardStats': return Stats.getDashboard();
      case 'getOrders': return Orders.getAll(params);
      case 'getOrder': return Orders.getById(params.id);
      case 'updateOrderStatus': return DataIntegrity.mutate(function() { return Orders.updateStatus(body); });
      case 'getCustomers': return Customers.getAll(params);
      case 'getCustomer': return Customers.getById(params.id);
      case 'getProjects': return Projects.getAll(params);
      case 'getProject': return Projects.getById(params.id);
      case 'createProject': return DataIntegrity.mutate(function() { return Projects.create(body); });
      case 'createProjectUpdate': return DataIntegrity.mutate(function() { return Projects.createUpdate(body); });
      case 'getPortfolioAdmin': return Portfolio.getAllAdmin(params);
      case 'createPortfolio': return Portfolio.create(body);
      case 'updatePortfolio': return Portfolio.update(body);
      case 'deletePortfolio': return Portfolio.remove(body);
      case 'createQuotation': return DataIntegrity.mutate(function() { return Quotations.create(body); });
      case 'getQuotations': return Quotations.getAll(params);
      case 'createInvoice': return DataIntegrity.mutate(function() { return Invoices.create(body); });
      case 'getInvoices': return Invoices.getAll(params);
      case 'updateInvoicePayment': return DataIntegrity.mutate(function() { return Invoices.updatePayment(body); });
      case 'getRevisions': return Revisions.getAll(params);
      case 'updateRevision': return DataIntegrity.mutate(function() { return Revisions.update(body); });
      case 'createHandover': return DataIntegrity.mutate(function() { return Handovers.create(body); });
      case 'getHandovers': return Handovers.getAll(params);

      // CUSTOMER
      case 'getMyDashboard': return CustomerPortal.getDashboard(customerSession.customerId);
      case 'respondQuotation': return DataIntegrity.mutate(function() { return Quotations.respond(body, customerSession.customerId); });
      case 'requestRevision': return DataIntegrity.mutate(function() { return Revisions.request(body, customerSession.customerId); });
      case 'respondHandover': return DataIntegrity.mutate(function() { return Handovers.respond(body, customerSession.customerId); });

      default:
        return { success: false, error: 'Action not implemented: ' + action };
    }
  }
};
