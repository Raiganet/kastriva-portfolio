/**
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
      const emailBody = `
New Order Received!

Order Number: ${orderNumber}
Customer: ${data.name}
Email: ${data.email}
WhatsApp: ${data.whatsapp}
Business: ${data.business || '-'}

Project Type: ${data.type}
Budget: ${data.budget || 'Not specified'}
Deadline: ${data.deadline || 'Flexible'}

Description:
${data.description}

Features:
${data.features || '-'}

Reference: ${data.reference || '-'}

---
View in dashboard: https://script.google.com
      `.trim();
      
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
