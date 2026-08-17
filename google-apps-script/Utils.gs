/**
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
      const match = lastOrderNumber.match(/KAS-\d{4}-(\d+)/);
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
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
