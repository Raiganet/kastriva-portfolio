/**
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
