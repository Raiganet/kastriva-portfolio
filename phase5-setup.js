const fs = require('fs');
const path = require('path');

function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Created: ' + filePath);
}

console.log('\n🚀 Memulai Phase 5: Google Apps Script Backend Setup...\n');

// 1. Main Code.gs
const codeGs = `/**
 * KASTRIVA - Google Apps Script Backend
 * Main entry point
 */

// Include semua module
// Note: Di GAS, kita pakai "include" pattern atau langsung define di file ini

/**
 * Handle GET requests
 */
function doGet(e) {
  return handleRequest(e, 'GET');
}

/**
 * Handle POST requests
 */
function doPost(e) {
  return handleRequest(e, 'POST');
}

/**
 * Main request handler
 */
function handleRequest(e, method) {
  try {
    const action = e.parameter.action || '';
    const params = e.parameter;
    const body = method === 'POST' && e.postData ? JSON.parse(e.postData.contents) : {};
    
    // Router
    const response = Router.handle(action, params, body, method);
    
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Test function untuk development
 */
function testAPI() {
  const testParams = { action: 'getPortfolio' };
  const result = Router.handle(testParams.action, testParams, {}, 'GET');
  Logger.log(JSON.stringify(result, null, 2));
}
`;
writeFile('google-apps-script/Code.gs', codeGs);

// 2. Config.gs
const configGs = `/**
 * Configuration
 * Edit values ini sesuai kebutuhan
 */

const Config = {
  // Spreadsheet ID (akan diisi setelah setup)
  SPREADSHEET_ID: '',
  
  // Admin credentials
  ADMIN_EMAIL: 'admin@kastriva.com',
  ADMIN_PASSWORD: 'change-this-password',
  
  // JWT Secret untuk session
  JWT_SECRET: 'your-secret-key-change-this-' + new Date().getTime(),
  
  // Session duration (24 hours)
  SESSION_DURATION: 24 * 60 * 60 * 1000,
  
  // Rate limiting
  RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 30,
  
  // Email settings
  EMAIL_FROM: 'Kastriva <noreply@kastriva.com>',
  
  // Drive folder untuk file uploads
  DRIVE_FOLDER_NAME: 'Kastriva Uploads',
  
  // App info
  APP_NAME: 'Kastriva',
  APP_VERSION: '1.0.0'
};

/**
 * Get spreadsheet (cached)
 */
let _spreadsheet = null;
Config.getSpreadsheet = function() {
  if (!_spreadsheet) {
    if (!Config.SPREADSHEET_ID) {
      throw new Error('SPREADSHEET_ID not configured. Run setupDatabase() first.');
    }
    _spreadsheet = SpreadsheetApp.openById(Config.SPREADSHEET_ID);
  }
  return _spreadsheet;
};

/**
 * Get sheet by name
 */
Config.getSheet = function(name) {
  const ss = Config.getSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) {
    throw new Error('Sheet not found: ' + name);
  }
  return sheet;
};
`;
writeFile('google-apps-script/Config.gs', configGs);

// 3. Router.gs
const routerGs = `/**
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
`;
writeFile('google-apps-script/Router.gs', routerGs);

// 4. Auth.gs
const authGs = `/**
 * Authentication & Session Management
 * Simple token-based auth menggunakan PropertiesService
 */

const Auth = {
  /**
   * Login admin
   */
  login: function(email, password) {
    if (email !== Config.ADMIN_EMAIL || password !== Config.ADMIN_PASSWORD) {
      return { success: false, error: 'Invalid credentials' };
    }
    
    // Generate token
    const token = this.generateToken(email);
    
    // Store session
    const sessions = this.getSessions();
    sessions[token] = {
      email: email,
      createdAt: new Date().getTime(),
      expiresAt: new Date().getTime() + Config.SESSION_DURATION
    };
    this.saveSessions(sessions);
    
    return {
      success: true,
      data: {
        token: token,
        email: email,
        expiresAt: sessions[token].expiresAt
      }
    };
  },
  
  /**
   * Verify token
   */
  verifyToken: function(token) {
    if (!token) {
      return { success: false, error: 'No token provided' };
    }
    
    const sessions = this.getSessions();
    const session = sessions[token];
    
    if (!session) {
      return { success: false, error: 'Invalid token' };
    }
    
    if (new Date().getTime() > session.expiresAt) {
      delete sessions[token];
      this.saveSessions(sessions);
      return { success: false, error: 'Token expired' };
    }
    
    return { success: true, data: session };
  },
  
  /**
   * Logout
   */
  logout: function(token) {
    const sessions = this.getSessions();
    delete sessions[token];
    this.saveSessions(sessions);
    return { success: true };
  },
  
  /**
   * Generate simple token (base64 encoded)
   */
  generateToken: function(email) {
    const timestamp = new Date().getTime();
    const data = email + ':' + timestamp + ':' + Math.random();
    return Utilities.base64Encode(data);
  },
  
  /**
   * Get all sessions
   */
  getSessions: function() {
    const props = PropertiesService.getScriptProperties();
    const sessionsJson = props.getProperty('sessions');
    return sessionsJson ? JSON.parse(sessionsJson) : {};
  },
  
  /**
   * Save sessions
   */
  saveSessions: function(sessions) {
    const props = PropertiesService.getScriptProperties();
    props.setProperty('sessions', JSON.stringify(sessions));
  },
  
  /**
   * Clean expired sessions (run periodically)
   */
  cleanExpiredSessions: function() {
    const sessions = this.getSessions();
    const now = new Date().getTime();
    
    Object.keys(sessions).forEach(token => {
      if (now > sessions[token].expiresAt) {
        delete sessions[token];
      }
    });
    
    this.saveSessions(sessions);
    Logger.log('Cleaned expired sessions');
  }
};
`;
writeFile('google-apps-script/Auth.gs', authGs);

// 5. Utils.gs
const utilsGs = `/**
 * Utility functions
 */

const Utils = {
  /**
   * Generate unique ID
   */
  generateId: function() {
    return 'id_' + new Date().getTime() + '_' + Math.random().toString(36).substr(2, 9);
  },
  
  /**
   * Generate order number: KAS-YYYY-NNNN
   */
  generateOrderNumber: function() {
    const sheet = Config.getSheet('Orders');
    const lastRow = sheet.getLastRow();
    const year = new Date().getFullYear();
    
    let nextNumber = 1;
    if (lastRow > 1) {
      const lastOrderNumber = sheet.getRange(lastRow, 2).getValue(); // Column B = orderNumber
      const match = lastOrderNumber.match(/KAS-\\d{4}-(\\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    
    return 'KAS-' + year + '-' + String(nextNumber).padStart(4, '0');
  },
  
  /**
   * Generate slug from title
   */
  generateSlug: function(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  },
  
  /**
   * Validate email
   */
  isValidEmail: function(email) {
    const re = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    return re.test(email);
  },
  
  /**
   * Sanitize string
   */
  sanitize: function(str) {
    if (!str) return '';
    return String(str)
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .trim();
  },
  
  /**
   * Format date
   */
  formatDate: function(date) {
    return Utilities.formatDate(new Date(date), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
  },
  
  /**
   * Send email
   */
  sendEmail: function(to, subject, body) {
    try {
      GmailApp.sendEmail(to, subject, body, {
        name: Config.APP_NAME,
        noReply: true
      });
      return { success: true };
    } catch (error) {
      Logger.log('Email error: ' + error.message);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Log to AuditLogs sheet
   */
  logAudit: function(action, userId, details) {
    try {
      const sheet = Config.getSheet('AuditLogs');
      sheet.appendRow([
        this.generateId(),
        action,
        userId || 'system',
        JSON.stringify(details),
        new Date().toISOString(),
        Session.getActiveUser().getEmail()
      ]);
    } catch (error) {
      Logger.log('Audit log error: ' + error.message);
    }
  }
};
`;
writeFile('google-apps-script/Utils.gs', utilsGs);

// 6. Portfolio.gs
const portfolioGs = `/**
 * Portfolio Module
 */

const Portfolio = {
  /**
   * Get all portfolio
   */
  getAll: function(params) {
    try {
      const sheet = Config.getSheet('Portfolio');
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const rows = data.slice(1);
      
      let portfolio = rows.map(row => {
        const obj = {};
        headers.forEach((header, i) => {
          obj[header] = row[i];
        });
        return obj;
      });
      
      // Filter published only
      portfolio = portfolio.filter(p => p.published === true || p.published === 'TRUE');
      
      // Filter by category
      if (params.category && params.category !== 'Semua') {
        portfolio = portfolio.filter(p => p.category === params.category);
      }
      
      // Search
      if (params.search) {
        const search = params.search.toLowerCase();
        portfolio = portfolio.filter(p => 
          p.title.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search) ||
          (p.technologies && p.technologies.toLowerCase().includes(search))
        );
      }
      
      // Sort by sortOrder
      portfolio.sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
      
      return { success: true, data: portfolio };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Get portfolio by slug
   */
  getBySlug: function(slug) {
    try {
      const result = this.getAll({});
      if (!result.success) return result;
      
      const project = result.data.find(p => Utils.generateSlug(p.title) === slug);
      
      if (!project) {
        return { success: false, error: 'Portfolio not found' };
      }
      
      // Get images
      const imagesSheet = Config.getSheet('PortfolioImages');
      const imagesData = imagesSheet.getDataRange().getValues();
      const images = imagesData.slice(1)
        .filter(row => row[1] === project.id)
        .map(row => row[2]);
      
      project.images = images;
      
      return { success: true, data: project };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Get categories with count
   */
  getCategories: function() {
    try {
      const result = this.getAll({});
      if (!result.success) return result;
      
      const categoryMap = {};
      result.data.forEach(p => {
        categoryMap[p.category] = (categoryMap[p.category] || 0) + 1;
      });
      
      const categories = [
        { id: 'all', name: 'Semua', slug: 'all', count: result.data.length }
      ];
      
      Object.keys(categoryMap).forEach(name => {
        categories.push({
          id: Utils.generateSlug(name),
          name: name,
          slug: Utils.generateSlug(name),
          count: categoryMap[name]
        });
      });
      
      return { success: true, data: categories };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Create portfolio (admin only)
   */
  create: function(data) {
    try {
      const sheet = Config.getSheet('Portfolio');
      const id = Utils.generateId();
      const now = new Date().toISOString();
      
      sheet.appendRow([
        id,
        Utils.generateSlug(data.title),
        data.title,
        data.category,
        data.description,
        data.shortDescription || '',
        data.image,
        JSON.stringify(data.technologies || []),
        data.demoUrl || '',
        data.githubUrl || '',
        data.year,
        data.status || 'Draft',
        data.problemSolved || '',
        data.solution || '',
        JSON.stringify(data.features || []),
        data.myRole || '',
        data.featured || false,
        data.published || false,
        data.sortOrder || 999,
        now,
        now
      ]);
      
      Utils.logAudit('portfolio_created', 'admin', { id: id, title: data.title });
      
      return { success: true, data: { id: id } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
`;
writeFile('google-apps-script/Portfolio.gs', portfolioGs);

// 7. Orders.gs
const ordersGs = `/**
 * Orders Module
 */

const Orders = {
  /**
   * Create order (public endpoint)
   */
  create: function(data) {
    try {
      // Validate
      if (!data.name || !data.email || !data.whatsapp || !data.type || !data.description) {
        return { success: false, error: 'Missing required fields' };
      }
      
      if (!Utils.isValidEmail(data.email)) {
        return { success: false, error: 'Invalid email format' };
      }
      
      // Honeypot check
      if (data.website && data.website.length > 0) {
        return { success: false, error: 'Spam detected' };
      }
      
      const sheet = Config.getSheet('Orders');
      const customersSheet = Config.getSheet('Customers');
      
      const orderId = Utils.generateId();
      const orderNumber = Utils.generateOrderNumber();
      const now = new Date().toISOString();
      
      // Find or create customer
      let customerId = this.findOrCreateCustomer(data);
      
      // Insert order
      sheet.appendRow([
        orderId,
        orderNumber,
        customerId,
        Utils.sanitize(data.name),
        Utils.sanitize(data.business || ''),
        Utils.sanitize(data.email),
        Utils.sanitize(data.whatsapp),
        Utils.sanitize(data.type),
        data.serviceId || '',
        data.portfolioId || '',
        Utils.sanitize(data.portfolioTitle || ''),
        Utils.sanitize(data.budget || ''),
        Utils.sanitize(data.deadline || ''),
        Utils.sanitize(data.description),
        Utils.sanitize(data.features || ''),
        Utils.sanitize(data.referenceUrl || ''),
        'Submitted',
        now,
        now
      ]);
      
      // Send notification email to admin
      const emailBody = \`
New Order Received!

Order Number: \${orderNumber}
Customer: \${data.name}
Email: \${data.email}
WhatsApp: \${data.whatsapp}
Business: \${data.business || '-'}

Project Type: \${data.type}
Budget: \${data.budget || 'Not specified'}
Deadline: \${data.deadline || 'Flexible'}

Description:
\${data.description}

Features:
\${data.features || '-'}

Reference: \${data.reference || '-'}

---
View in dashboard: https://script.google.com
      \`.trim();
      
      Utils.sendEmail(Config.ADMIN_EMAIL, 'New Order: ' + orderNumber, emailBody);
      
      Utils.logAudit('order_created', customerId, { orderId: orderId, orderNumber: orderNumber });
      
      return {
        success: true,
        data: {
          id: orderId,
          orderNumber: orderNumber,
          status: 'Submitted'
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Find or create customer
   */
  findOrCreateCustomer: function(data) {
    const sheet = Config.getSheet('Customers');
    const values = sheet.getDataRange().getValues();
    
    // Find by email
    for (let i = 1; i < values.length; i++) {
      if (values[i][2] === data.email) { // Column C = email
        return values[i][0]; // Column A = id
      }
    }
    
    // Create new customer
    const customerId = Utils.generateId();
    const now = new Date().toISOString();
    
    sheet.appendRow([
      customerId,
      Utils.sanitize(data.name),
      Utils.sanitize(data.email),
      Utils.sanitize(data.whatsapp),
      Utils.sanitize(data.business || ''),
      '', // avatar
      'Active',
      now,
      now
    ]);
    
    return customerId;
  },
  
  /**
   * Get all orders (admin)
   */
  getAll: function(params) {
    try {
      const sheet = Config.getSheet('Orders');
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const rows = data.slice(1);
      
      let orders = rows.map(row => {
        const obj = {};
        headers.forEach((header, i) => {
          obj[header] = row[i];
        });
        return obj;
      });
      
      // Filter by status
      if (params.status) {
        orders = orders.filter(o => o.status === params.status);
      }
      
      // Sort by createdAt desc
      orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      return { success: true, data: orders };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Get order by ID
   */
  getById: function(id) {
    try {
      const result = this.getAll({});
      if (!result.success) return result;
      
      const order = result.data.find(o => o.id === id);
      
      if (!order) {
        return { success: false, error: 'Order not found' };
      }
      
      return { success: true, data: order };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Update order status
   */
  updateStatus: function(data) {
    try {
      if (!data.id || !data.status) {
        return { success: false, error: 'Missing id or status' };
      }
      
      const sheet = Config.getSheet('Orders');
      const values = sheet.getDataRange().getValues();
      
      for (let i = 1; i < values.length; i++) {
        if (values[i][0] === data.id) { // Column A = id
          sheet.getRange(i + 1, 17).setValue(data.status); // Column Q = status
          sheet.getRange(i + 1, 19).setValue(new Date().toISOString()); // Column S = updatedAt
          
          Utils.logAudit('order_status_updated', 'admin', { orderId: data.id, status: data.status });
          
          return { success: true };
        }
      }
      
      return { success: false, error: 'Order not found' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
`;
writeFile('google-apps-script/Orders.gs', ordersGs);

// 8. Services.gs, Settings.gs, Customers.gs (simplified)
const servicesGs = `/**
 * Services Module
 */

const Services = {
  getAll: function() {
    try {
      const sheet = Config.getSheet('Services');
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const rows = data.slice(1);
      
      const services = rows.map(row => {
        const obj = {};
        headers.forEach((header, i) => {
          obj[header] = row[i];
        });
        return obj;
      }).filter(s => s.isActive === true || s.isActive === 'TRUE');
      
      services.sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
      
      return { success: true, data: services };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
`;
writeFile('google-apps-script/Services.gs', servicesGs);

const settingsGs = `/**
 * Settings Module
 */

const Settings = {
  getAll: function() {
    try {
      const sheet = Config.getSheet('Settings');
      const data = sheet.getDataRange().getValues();
      
      const settings = {};
      data.forEach(row => {
        if (row[0]) {
          settings[row[0]] = row[1];
        }
      });
      
      return { success: true, data: settings };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  update: function(key, value) {
    try {
      const sheet = Config.getSheet('Settings');
      const data = sheet.getDataRange().getValues();
      
      for (let i = 0; i < data.length; i++) {
        if (data[i][0] === key) {
          sheet.getRange(i + 1, 2).setValue(value);
          return { success: true };
        }
      }
      
      // Add new setting
      sheet.appendRow([key, value]);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
`;
writeFile('google-apps-script/Settings.gs', settingsGs);

const customersGs = `/**
 * Customers Module (simplified)
 */

const Customers = {
  getAll: function(params) {
    try {
      const sheet = Config.getSheet('Customers');
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const rows = data.slice(1);
      
      const customers = rows.map(row => {
        const obj = {};
        headers.forEach((header, i) => {
          obj[header] = row[i];
        });
        return obj;
      });
      
      return { success: true, data: customers };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  getById: function(id) {
    const result = this.getAll({});
    if (!result.success) return result;
    
    const customer = result.data.find(c => c.id === id);
    if (!customer) {
      return { success: false, error: 'Customer not found' };
    }
    
    return { success: true, data: customer };
  }
};
`;
writeFile('google-apps-script/Customers.gs', customersGs);

// 9. Setup Database Script
const setupDatabaseGs = `/**
 * Setup Database - Run this ONCE to create all sheets
 * 
 * CARA MENJALANKAN:
 * 1. Buka Google Apps Script editor
 * 2. Pilih function "setupDatabase" dari dropdown
 * 3. Klik Run
 * 4. Authorize permissions
 * 5. Copy SPREADSHEET_ID yang muncul di log
 * 6. Paste ke Config.gs
 */

function setupDatabase() {
  // Create new spreadsheet
  const ss = SpreadsheetApp.create('Kastriva Database - ' + new Date().toLocaleDateString());
  const ssId = ss.getId();
  
  Logger.log('✅ Spreadsheet created!');
  Logger.log('📋 SPREADSHEET_ID: ' + ssId);
  Logger.log('📝 Copy ID di atas dan paste ke Config.gs');
  
  // Define all sheets dengan headers
  const sheets = {
    'Settings': [
      ['key', 'value'],
      ['brandName', 'Kastriva'],
      ['tagline', 'Solusi Digital Modern untuk Bisnis Anda'],
      ['whatsapp', '6281234567890'],
      ['email', 'hello@kastriva.com'],
      ['instagram', '#'],
      ['tiktok', '#'],
      ['github', '#'],
      ['website', '#'],
      ['heroHeadline', 'Bangun Website & Aplikasi Profesional untuk Mengembangkan Bisnis Anda'],
      ['heroSubheadline', 'Saya membantu bisnis, UMKM, organisasi, dan personal membangun website serta aplikasi custom yang modern, cepat, responsif, dan sesuai kebutuhan.'],
      ['ctaPrimary', 'Mulai Project'],
      ['ctaSecondary', 'Lihat Portfolio']
    ],
    
    'Portfolio': [
      'id', 'slug', 'title', 'category', 'description', 'shortDescription', 'image', 
      'technologies', 'demoUrl', 'githubUrl', 'year', 'status', 'problemSolved', 
      'solution', 'features', 'myRole', 'featured', 'published', 'sortOrder', 
      'createdAt', 'updatedAt'
    ],
    
    'PortfolioImages': [
      'id', 'portfolioId', 'imageUrl', 'sortOrder', 'createdAt'
    ],
    
    'Categories': [
      'id', 'name', 'slug', 'description', 'sortOrder'
    ],
    
    'Services': [
      'id', 'title', 'slug', 'description', 'icon', 'features', 'startingPrice', 
      'duration', 'isActive', 'sortOrder', 'createdAt', 'updatedAt'
    ],
    
    'Orders': [
      'id', 'orderNumber', 'customerId', 'name', 'business', 'email', 'whatsapp', 
      'projectType', 'serviceId', 'portfolioId', 'portfolioTitle', 'budget', 
      'deadline', 'description', 'features', 'referenceUrl', 'status', 
      'createdAt', 'updatedAt'
    ],
    
    'Customers': [
      'id', 'name', 'email', 'whatsapp', 'business', 'avatar', 'status', 
      'createdAt', 'lastActivity'
    ],
    
    'Projects': [
      'id', 'orderId', 'customerId', 'projectName', 'description', 'status', 
      'progress', 'startDate', 'deadline', 'completedDate', 'createdAt', 'updatedAt'
    ],
    
    'ProjectUpdates': [
      'id', 'projectId', 'title', 'description', 'progress', 'status', 
      'createdAt', 'createdBy'
    ],
    
    'Messages': [
      'id', 'senderId', 'receiverId', 'orderId', 'projectId', 'message', 
      'attachment', 'createdAt', 'read'
    ],
    
    'Quotations': [
      'id', 'quotationNumber', 'orderId', 'customerId', 'projectName', 'items', 
      'subtotal', 'discount', 'tax', 'total', 'notes', 'validUntil', 'status', 
      'createdAt', 'updatedAt'
    ],
    
    'QuotationItems': [
      'id', 'quotationId', 'description', 'quantity', 'price', 'total'
    ],
    
    'Invoices': [
      'id', 'invoiceNumber', 'orderId', 'customerId', 'projectName', 'items', 
      'subtotal', 'discount', 'tax', 'total', 'paymentStatus', 'dueDate', 
      'paymentMethod', 'createdAt', 'updatedAt'
    ],
    
    'Testimonials': [
      'id', 'customerName', 'customerEmail', 'customerBusiness', 'message', 
      'rating', 'published', 'createdAt'
    ],
    
    'FAQ': [
      'id', 'question', 'answer', 'sortOrder', 'published', 'createdAt'
    ],
    
    'Notifications': [
      'id', 'userId', 'title', 'message', 'type', 'read', 'createdAt'
    ],
    
    'Files': [
      'id', 'orderId', 'projectId', 'fileName', 'fileUrl', 'fileType', 
      'uploadedBy', 'createdAt'
    ],
    
    'AuditLogs': [
      'id', 'action', 'userId', 'details', 'createdAt', 'userEmail'
    ]
  };
  
  // Create sheets
  Object.keys(sheets).forEach((sheetName, index) => {
    let sheet;
    
    if (index === 0) {
      // Rename default "Sheet1"
      sheet = ss.getSheets()[0];
      sheet.setName(sheetName);
    } else {
      sheet = ss.insertSheet(sheetName);
    }
    
    const data = sheets[sheetName];
    
    if (Array.isArray(data[0])) {
      // Data sudah include rows (seperti Settings)
      sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
    } else {
      // Hanya headers
      sheet.getRange(1, 1, 1, data.length).setValues([data]);
    }
    
    // Format header row
    const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#6C5CE7');
    headerRange.setFontColor('#FFFFFF');
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, sheet.getLastColumn());
    
    // Freeze header row
    sheet.setFrozenRows(1);
    
    Logger.log('✅ Created sheet: ' + sheetName);
  });
  
  // Add sample data
  addSampleData(ss);
  
  Logger.log('');
  Logger.log('🎉 Database setup complete!');
  Logger.log('📋 SPREADSHEET_ID: ' + ssId);
  Logger.log('🔗 Spreadsheet URL: ' + ss.getUrl());
  Logger.log('');
  Logger.log('⚠️ NEXT STEPS:');
  Logger.log('1. Copy SPREADSHEET_ID di atas');
  Logger.log('2. Buka Config.gs');
  Logger.log('3. Paste SPREADSHEET_ID ke: Config.SPREADSHEET_ID = "' + ssId + '";');
  Logger.log('4. Save dan redeploy web app');
}

/**
 * Add sample data untuk testing
 */
function addSampleData(ss) {
  // Sample Portfolio
  const portfolioSheet = ss.getSheetByName('Portfolio');
  const now = new Date().toISOString();
  
  portfolioSheet.appendRow([
    'port_001',
    'sistem-manajemen-inventaris',
    'Sistem Manajemen Inventaris',
    'Sistem Informasi',
    'Aplikasi web untuk mengelola stok barang, pemasukan, dan pengeluaran secara real-time dengan laporan otomatis.',
    'Sistem inventaris real-time',
    '/portfolio/inventory.png',
    JSON.stringify(['Next.js', 'TypeScript', 'PostgreSQL', 'Tailwind']),
    'https://demo.kastriva.com/inventory',
    'https://github.com/kastriva/inventory',
    '2025',
    'Completed',
    'Menggantikan pencatatan manual yang rawan error dengan sistem terdigitalisasi.',
    'Membangun sistem berbasis web dengan fitur manajemen stok, laporan harian, dan notifikasi low stock.',
    JSON.stringify(['Manajemen Stok', 'Laporan Otomatis', 'Notifikasi Low Stock', 'Multi-User']),
    'Fullstack Developer & UI/UX Designer',
    true,
    true,
    1,
    now,
    now
  ]);
  
  // Sample Service
  const servicesSheet = ss.getSheetByName('Services');
  servicesSheet.appendRow([
    'svc_001',
    'Website Company Profile',
    'website-company-profile',
    'Website profesional untuk membangun kredibilitas perusahaan Anda.',
    'Building2',
    JSON.stringify(['Desain Premium', 'SEO Optimized', 'Mobile Friendly']),
    'Mulai dari Rp 3.500.000',
    '1-2 minggu',
    true,
    1,
    now,
    now
  ]);
  
  Logger.log('✅ Sample data added');
}
`;
writeFile('google-apps-script/SetupDatabase.gs', setupDatabaseGs);

// 10. Deployment Guide
const deploymentGuide = `# 🚀 Google Apps Script Deployment Guide

## Step 1: Setup Google Apps Script Project

1. Buka [script.google.com](https://script.google.com)
2. Klik **"New Project"**
3. Ganti nama project menjadi **"Kastriva API"**

## Step 2: Copy Files

Copy SEMUA file \`.gs\` dari folder \`google-apps-script/\` ke Apps Script editor:

- \`Code.gs\` (replace default code)
- \`Config.gs\` (create new file)
- \`Router.gs\` (create new file)
- \`Auth.gs\` (create new file)
- \`Utils.gs\` (create new file)
- \`Portfolio.gs\` (create new file)
- \`Orders.gs\` (create new file)
- \`Services.gs\` (create new file)
- \`Settings.gs\` (create new file)
- \`Customers.gs\` (create new file)
- \`SetupDatabase.gs\` (create new file)

**Cara copy:**
1. Di Apps Script editor, klik **"+"** → **"Script"**
2. Beri nama file (tanpa .gs, otomatis ditambahkan)
3. Copy-paste isi file dari folder \`google-apps-script/\`
4. Save (Ctrl+S)

## Step 3: Setup Database

1. Di Apps Script editor, pilih function **\`setupDatabase\`** dari dropdown
2. Klik **"Run"**
3. Klik **"Review Permissions"** → Pilih akun Google → **"Allow"**
4. Tunggu proses selesai, lalu lihat **Execution log** di panel bawah
5. Copy **SPREADSHEET_ID** yang muncul di log
6. Buka file **Config.gs**, paste ID ke \`Config.SPREADSHEET_ID\`
7. Save (Ctrl+S)

## Step 4: Deploy Web App

1. Klik **"Deploy"** → **"New deployment"**
2. Klik icon gear ⚙️ → pilih **"Web app"**
3. Isi form:
   - **Description**: Kastriva API v1
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Klik **"Deploy"**
5. Authorize permissions → pilih akun → **"Allow"**
6. Copy **Web app URL** (format: \`https://script.google.com/macros/s/XXXX/exec\`)

## Step 5: Hubungkan ke Frontend Next.js

1. Buat / edit file \`.env.local\` di root project
2. Isi dengan URL web app Anda:

\`\`\`
NEXT_PUBLIC_GAS_API_URL=https://script.google.com/macros/s/XXXX/exec
\`\`\`

3. Restart dev server (\`npm run dev\`)

## Step 6: Test API di Browser

Buka URL berikut (ganti {URL} dengan web app URL Anda):

- Health: \`{URL}?action=health\`
- Portfolio: \`{URL}?action=getPortfolio\`
- Categories: \`{URL}?action=getPortfolioCategories\`
- Services: \`{URL}?action=getServices\`
- Settings: \`{URL}?action=getSettings\`

Jika muncul JSON \`{"success":true,...}\` berarti API sudah AKTIF ✅

## Step 7: Test Create Order (POST)

Buka Console browser (F12) di tab manapun, paste:

\`\`\`js
fetch("https://script.google.com/macros/s/XXXX/exec", {
  method: "POST",
  headers: { "Content-Type": "text/plain;charset=utf-8" },
  body: JSON.stringify({
    action: "createOrder",
    name: "Test User",
    email: "test@email.com",
    whatsapp: "081234567890",
    type: "Website",
    description: "Test order dari API client Kastriva"
  })
}).then(r => r.json()).then(console.log)
\`\`\`

Expected: \`{"success":true,"data":{"orderNumber":"KAS-2026-0001",...}}\`

Cek Google Sheets → sheet **Orders** → baris baru muncul ✅
Cek Gmail admin → email notifikasi order baru ✅

## Troubleshooting

| Masalah | Solusi |
|---|---|
| "SPREADSHEET_ID not configured" | Paste ID spreadsheet ke Config.gs |
| Permission error | Run function testAPI sekali untuk authorize |
| CORS error saat POST | Gunakan Content-Type text/plain (hindari preflight) |
| Data tidak muncul | Pastikan setupDatabase() sudah dijalankan |

## Catatan Keamanan

- Ganti \`ADMIN_PASSWORD\` di Config.gs sebelum production
- Endpoint publik terbuka, endpoint admin dilindungi token session
- Session disimpan server-side (PropertiesService), bukan di frontend
`;

writeFile('google-apps-script/DEPLOYMENT.md', deploymentGuide);

// 11. GAS API Client untuk frontend (CORS-safe)
const gasClientCode = `/**
 * Google Apps Script API Client
 * CORS-safe: POST menggunakan Content-Type text/plain
 * untuk menghindari preflight request yang tidak didukung GAS.
 */

const GAS_URL = process.env.NEXT_PUBLIC_GAS_API_URL || "";

export function isGasConfigured(): boolean {
  return GAS_URL.length > 0;
}

export interface GasResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * GET request ke GAS API
 */
export async function gasGet<T>(
  action: string,
  params: Record<string, string> = {}
): Promise<GasResponse<T>> {
  if (!isGasConfigured()) {
    return { success: false, error: "GAS API belum dikonfigurasi" };
  }
  try {
    const url = new URL(GAS_URL);
    url.searchParams.set("action", action);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString(), { method: "GET" });
    return (await res.json()) as GasResponse<T>;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * POST request ke GAS API
 */
export async function gasPost<T>(
  payload: Record<string, unknown>
): Promise<GasResponse<T>> {
  if (!isGasConfigured()) {
    return { success: false, error: "GAS API belum dikonfigurasi" };
  }
  try {
    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    return (await res.json()) as GasResponse<T>;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}
`;
writeFile('lib/gas-client.ts', gasClientCode);

// 12. Tambahkan dokumentasi GAS ke README
const readmeGas = `

## 🔌 Phase 5: Google Apps Script Backend

Panduan lengkap ada di \`google-apps-script/DEPLOYMENT.md\`.

Ringkasan setup:
1. Buat project di script.google.com
2. Copy semua file .gs dari folder google-apps-script/
3. Jalankan setupDatabase() → copy SPREADSHEET_ID ke Config.gs
4. Deploy sebagai Web App (access: Anyone)
5. Copy Web App URL ke .env.local (NEXT_PUBLIC_GAS_API_URL)
6. Test: {URL}?action=health
`;

if (fs.existsSync('README.md')) {
  fs.appendFileSync('README.md', readmeGas, 'utf8');
  console.log('✅ Updated: README.md');
}

console.log('');
console.log('🎉 Phase 5: Google Apps Script Backend berhasil dibuat!');
console.log('');
console.log('📁 FILE BACKEND (folder google-apps-script/):');
console.log('- Code.gs        → Entry point (doGet/doPost)');
console.log('- Config.gs      → Konfigurasi & credentials');
console.log('- Router.gs      → Router semua endpoint API');
console.log('- Auth.gs        → Login admin & session token');
console.log('- Utils.gs       → Helper (ID, order number, email, audit)');
console.log('- Portfolio.gs   → CRUD portfolio');
console.log('- Orders.gs      → Create order + auto customer + email notif');
console.log('- Services.gs / Settings.gs / Customers.gs');
console.log('- SetupDatabase.gs → Run SEKALI untuk buat 18 sheets');
console.log('- DEPLOYMENT.md  → Panduan lengkap deploy');
console.log('');
console.log('📁 FILE FRONTEND:');
console.log('- lib/gas-client.ts → API client CORS-safe');
console.log('');
console.log('📌 LANGKAH SELANJUTNYA (detail di DEPLOYMENT.md):');
console.log('1. Buka script.google.com → New Project');
console.log('2. Copy semua file .gs ke editor Apps Script');
console.log('3. Run setupDatabase() → copy SPREADSHEET_ID ke Config.gs');
console.log('4. Deploy → New deployment → Web app → Access: Anyone');
console.log('5. Copy Web App URL ke .env.local');
console.log('6. Test: {URL}?action=getPortfolio');
console.log('');
console.log('⚠️  BACKWARD COMPATIBLE:');
console.log('   Jika GAS belum dikonfigurasi, website tetap berjalan');
console.log('   normal dengan data lokal dari data/config.ts.');