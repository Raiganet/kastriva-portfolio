/**
 * KASTRIVA - Customer Authentication (Phase 10)
 * Login dengan Email + Nomor Order (pair credential yang hanya dimiliki customer)
 */

const CustomerAuth = {

  login: function(email, orderNumber) {
    try {
      if (!email || !orderNumber) {
        return { success: false, error: 'Email dan nomor order wajib diisi' };
      }

      const sheet = Config.getSheet('Orders');
      const data = sheet.getDataRange().getValues();

      for (var i = 1; i < data.length; i++) {
        if (String(data[i][1]).toUpperCase() === String(orderNumber).toUpperCase()) {
          const orderEmail = String(data[i][5]).toLowerCase();

          if (orderEmail !== String(email).toLowerCase()) {
            return { success: false, error: 'Email tidak cocok dengan order ini' };
          }

          const customerId = data[i][2];
          const customerName = data[i][3];
          const token = Utilities.base64Encode('cust:' + customerId + ':' + Date.now() + ':' + Math.random());

          const sessions = this.getSessions();
          sessions[token] = {
            customerId: customerId,
            email: orderEmail,
            name: customerName,
            createdAt: Date.now(),
            expiresAt: Date.now() + Config.SESSION_DURATION
          };
          this.saveSessions(sessions);

          Utils.logAudit('customer_login', customerId, { orderNumber: orderNumber });

          return {
            success: true,
            data: { token: token, customerId: customerId, name: customerName }
          };
        }
      }

      return { success: false, error: 'Order tidak ditemukan' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  verify: function(token) {
    if (!token) return { success: false, error: 'No token provided' };

    const sessions = this.getSessions();
    const session = sessions[token];

    if (!session) return { success: false, error: 'Invalid token' };

    if (Date.now() > session.expiresAt) {
      delete sessions[token];
      this.saveSessions(sessions);
      return { success: false, error: 'Token expired' };
    }

    return { success: true, data: session };
  },

  logout: function(token) {
    const sessions = this.getSessions();
    delete sessions[token];
    this.saveSessions(sessions);
    return { success: true };
  },

  getSessions: function() {
    const props = PropertiesService.getScriptProperties();
    const json = props.getProperty('customerSessions');
    return json ? JSON.parse(json) : {};
  },

  saveSessions: function(sessions) {
    const props = PropertiesService.getScriptProperties();
    props.setProperty('customerSessions', JSON.stringify(sessions));
  }
};
