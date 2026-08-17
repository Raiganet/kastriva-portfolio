/**
 * Router - Handle all API endpoints
 */

const Router = {
  /**
   * Main router handler
   */
  handle: function(action, params, body, method) {
    // Public endpoints (no auth required)
    const publicActions = [
      'getPortfolio',
      'getPortfolioBySlug',
      'getPortfolioCategories',
      'getServices',
      'getSettings',
      'createOrder',
      'health'
    ];
    
    // Protected endpoints (auth required)
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
    
    // Check if action exists
    if (!publicActions.includes(action) && !protectedActions.includes(action)) {
      return { success: false, error: 'Invalid action: ' + action };
    }
    
    // Check auth for protected actions
    if (protectedActions.includes(action)) {
      const authResult = Auth.verifyToken(params.token || body.token);
      if (!authResult.success) {
        return { success: false, error: 'Unauthorized: ' + authResult.error };
      }
    }
    
    // Route to handler
    switch(action) {
      // Public
      case 'health':
        return { success: true, data: { status: 'ok', timestamp: new Date().toISOString() } };
      
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
      
      // Protected - Orders
      case 'getOrders':
        return Orders.getAll(params);
      
      case 'getOrder':
        return Orders.getById(params.id);
      
      case 'updateOrderStatus':
        return Orders.updateStatus(body);
      
      // Protected - Customers
      case 'getCustomers':
        return Customers.getAll(params);
      
      case 'getCustomer':
        return Customers.getById(params.id);
      
      // Protected - Projects
      case 'getProjects':
        return Projects.getAll(params);
      
      case 'getProject':
        return Projects.getById(params.id);
      
      case 'createProjectUpdate':
        return Projects.createUpdate(body);
      
      // Protected - Quotations
      case 'createQuotation':
        return Quotations.create(body);
      
      case 'getQuotations':
        return Quotations.getAll(params);
      
      // Protected - Invoices
      case 'createInvoice':
        return Invoices.create(body);
      
      case 'getInvoices':
        return Invoices.getAll(params);
      
      // Protected - Messages
      case 'sendMessage':
        return Messages.send(body);
      
      case 'getMessages':
        return Messages.getAll(params);
      
      // Protected - Files
      case 'uploadFile':
        return Files.upload(body);
      
      // Protected - Notifications
      case 'getNotifications':
        return Notifications.getAll(params);
      
      case 'markNotificationRead':
        return Notifications.markRead(body);
      
      default:
        return { success: false, error: 'Action not implemented: ' + action };
    }
  }
};
