/**
 * Configuration
 * Edit values ini sesuai kebutuhan
 */

const Config = {
  // Spreadsheet ID (akan diisi setelah setup)
  SPREADSHEET_ID: PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || '',
  
  // Notification email only; login credentials live in server environment variables.
  ADMIN_EMAIL: PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL') || '',

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
