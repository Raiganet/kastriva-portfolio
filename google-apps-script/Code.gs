/**
 * KASTRIVA - Google Apps Script Backend
 * Main entry point
 *
 * FIX Phase 7:
 * - action sekarang dibaca dari URL query (GET) ATAU JSON body (POST)
 */

function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  return handleRequest(e, 'POST');
}

function handleRequest(e, method) {
  try {
    // 1. Parse body DULU (untuk POST)
    let body = {};
    if (method === 'POST' && e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch (parseError) {
        body = {};
      }
    }

    // 2. Action dari query string (GET) atau dari body (POST)
    const action = e.parameter.action || body.action || '';
    const params = e.parameter;

    // 3. Route ke handler
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