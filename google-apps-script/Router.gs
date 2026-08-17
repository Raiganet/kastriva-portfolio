/**
 * KASTRIVA - Router
 * Handle semua endpoint API
 * 
 * UPDATE Phase 7:
 * - Tambah endpoint publik: getOrderByNumber (untuk customer tracking)
 * - Tambah endpoint auth: login / logout
 */

const Router = {

  handle: function(action, params, body, method) {

    // ===== ENDPOINT AUTH (tanpa token) =====
    if (action === 'login') {
      return Auth.login(body.email, body.password);
    }
    if (action === 'logout') {
      return Auth.logout(params.token || body.token);
    }

    // ===== PUBLIC ENDPOINTS (tanpa auth) =====
    const publicActions = [
      'getPortfolio',
      'getPortfolioBySlug',
      'getPortfolioCategories',
      'getServices',
      'getSettings',
      'createOrder',
      'getOrderByNumber',
      'health'
    ];

    // ===== PROTECTED ENDPOINTS (wajib token admin) =====
    const protectedActions = [
      'getOrders',
      'getOrder',
      'updateOrderStatus',
      'getCustomers',
      'getCustomer',
      'getProjects',
      'getProject',
      'createProjectUpdate',
      'createQuotation',
      'getQuotations',
      'createInvoice',
      'getInvoices',
      'sendMessage',
      'getMessages',
      'uploadFile',
      'getNotifications',
      'markNotificationRead'
    ];

    // Validasi action
    if (publicActions.indexOf(action) === -1 && protectedActions.indexOf(action) === -1) {
      return { success: false, error: 'Invalid action: ' + action };
    }

    // Cek auth untuk protected endpoints
    if (protectedActions.indexOf(action) !== -1) {
      const authResult = Auth.verifyToken(params.token || body.token);
      if (!authResult.success) {
        return { success: false, error: 'Unauthorized: ' + authResult.error };
      }
    }

    // ===== ROUTING =====
    switch (action) {

      // ---------- PUBLIC ----------
      case 'health':
        return {
          success: true,
          data: {
            status: 'ok',
            timestamp: new Date().toISOString(),
            version: Config.APP_VERSION
          }
        };

      case 'getPortfolio':
        return Portfolio.getAll(params);

      case 'getPortfolioBySlug':
        return Portfolio.getBySlug(params.slug);

      case 'getPortfolioCategories':
        return Portfolio.getCategories();

      case 'getServices':
        return Services.getAll();

      case 'getSettings':
        return Settings.getAll();

      case 'createOrder':
        return Orders.create(body);

      case 'getOrderByNumber':
        return Orders.getByOrderNumber(params.orderNumber);

      // ---------- PROTECTED: ORDERS ----------
      case 'getOrders':
        return Orders.getAll(params);

      case 'getOrder':
        return Orders.getById(params.id);

      case 'updateOrderStatus':
        return Orders.updateStatus(body);

      // ---------- PROTECTED: CUSTOMERS ----------
      case 'getCustomers':
        return Customers.getAll(params);

      case 'getCustomer':
        return Customers.getById(params.id);

      // ---------- PROTECTED: PROJECTS ----------
      case 'getProjects':
        return Projects.getAll(params);

      case 'getProject':
        return Projects.getById(params.id);

      case 'createProjectUpdate':
        return Projects.createUpdate(body);

      // ---------- PROTECTED: QUOTATIONS ----------
      case 'createQuotation':
        return Quotations.create(body);

      case 'getQuotations':
        return Quotations.getAll(params);

      // ---------- PROTECTED: INVOICES ----------
      case 'createInvoice':
        return Invoices.create(body);

      case 'getInvoices':
        return Invoices.getAll(params);

      // ---------- PROTECTED: MESSAGES ----------
      case 'sendMessage':
        return Messages.send(body);

      case 'getMessages':
        return Messages.getAll(params);

      // ---------- PROTECTED: FILES ----------
      case 'uploadFile':
        return Files.upload(body);

      // ---------- PROTECTED: NOTIFICATIONS ----------
      case 'getNotifications':
        return Notifications.getAll(params);

      case 'markNotificationRead':
        return Notifications.markRead(body);

      default:
        return { success: false, error: 'Action not implemented: ' + action };
    }
  }
};