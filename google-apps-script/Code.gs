/** All application requests must be signed by the server gateway. */
function doGet() { return securityJson_({ success: false, error: 'Gunakan API website.', code: 'UNAUTHORIZED' }); }
function doPost(e) {
  try {
    const raw = e && e.postData && e.postData.contents;
    if (!raw || raw.length > 120000) return securityJson_({ success: false, error: 'Invalid request' });
    const request = Security.verifyEnvelope(JSON.parse(raw));
    if (!request || !request.action) return securityJson_({ success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' });
    return securityJson_(Router.handle(request.action, request.params || {}, request.body || {}, 'POST'));
  } catch (error) {
    return securityJson_({ success: false, error: 'Layanan sementara tidak tersedia. Periksa konfigurasi atau coba lagi.' });
  }
}
function securityJson_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
