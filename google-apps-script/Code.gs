/**
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
