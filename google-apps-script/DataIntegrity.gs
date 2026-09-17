/** Stage 2. All writers sharing Orders/Customers/Projects must use this script lock. */
const DataIntegrity = {
  mutate: function(fn) {
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) return { success: false, code: 'BUSY', error: 'Server sedang sibuk. Coba kirim kembali dengan permintaan yang sama.' };
    try { return fn(); }
    catch (e) { return { success: false, code: 'RESULT_UNKNOWN', error: 'Hasil penyimpanan belum dapat dikonfirmasi. Coba kirim kembali; jangan membuat permintaan baru.' }; }
    finally { try { SpreadsheetApp.flush(); } finally { lock.releaseLock(); } }
  },
  // Store untrusted text as text, never as a spreadsheet formula.
  text: function(value) {
    const s = String(value == null ? '' : value).trim();
    return /^[=+\-@\t\r\n]/.test(s) ? "'" + s : s;
  },
  orderColumns: ['id','orderNumber','customerId','name','business','email','whatsapp','projectType','serviceId','portfolioId','portfolioTitle','budget','deadline','description','features','referenceUrl','status','createdAt','updatedAt'],
  additions: ['requestId', 'requestHash', 'notifications'],
  headers: function() {
    const rows = Config.getSheet('Orders').getDataRange().getValues();
    const h = rows[0] || [];
    if (this.orderColumns.some(function(name,i) { return h[i] !== name; }) || this.additions.some(function(name) { return h.indexOf(name) < 0; })) throw new Error('Run setupOrderReliabilityStage2');
    return h;
  },
  // Must run while holding the script lock. Never derives a sequence from the last row.
  nextNumber: function(sheetName, prefix) {
    const year = new Date().getFullYear();
    const key = 'sequence_' + prefix + '_' + year;
    const props = PropertiesService.getScriptProperties();
    const stored = Number(props.getProperty(key) || 0);
    var highest = Number.isSafeInteger(stored) && stored >= 0 ? stored : 0;
    const re = new RegExp('^' + prefix + '-' + year + '-(\\d+)$');
    Config.getSheet(sheetName).getDataRange().getValues().slice(1).forEach(function(row) {
      const match = String(row[1]).match(re);
      if (match) highest = Math.max(highest, Number(match[1]));
    });
    const next = highest + 1;
    if (!Number.isSafeInteger(next)) throw new Error('Sequence exhausted');
    props.setProperty(key, String(next));
    return prefix + '-' + year + '-' + String(next).padStart(4, '0');
  },
  validateOrder: function(input) {
    if (!input || typeof input !== 'object') throw new Error('Data tidak valid.');
    const bounds = { name:[2,100],business:[0,100],email:[3,254],whatsapp:[10,20],type:[1,40],budget:[0,100],deadline:[0,100],description:[20,2000],features:[0,500],reference:[0,200],serviceId:[0,100],portfolioId:[0,100],portfolioTitle:[0,200] };
    const data = {};
    Object.keys(bounds).forEach(function(k) {
      const value = input[k] == null ? '' : input[k];
      if (typeof value !== 'string') throw new Error('Format ' + k + ' tidak valid.');
      data[k] = value.trim();
      if (data[k].length < bounds[k][0] || data[k].length > bounds[k][1]) throw new Error('Panjang ' + k + ' tidak valid.');
    });
    data.email = data.email.toLowerCase();
    if (!Utils.isValidEmail(data.email)) throw new Error('Format email tidak valid.');
    if (!/^[0-9+\-\s]+$/.test(data.whatsapp) || data.whatsapp.replace(/\D/g,'').length < 10) throw new Error('Nomor WhatsApp tidak valid.');
    if (['Website','Landing Page','Company Profile','Web App','Dashboard','Sistem Informasi','Android App','Custom'].indexOf(data.type) < 0) throw new Error('Jenis proyek tidak valid.');
    if (input.website) throw new Error('Permintaan tidak valid.');
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(String(input.requestId || ''))) throw new Error('ID permintaan tidak valid. Muat ulang formulir versi terbaru.');
    return data;
  }
};

/** Non-destructive, repeatable migration. Uses the existing spreadsheet. */
function setupOrderReliabilityStage2() {
  const result = DataIntegrity.mutate(function() {
    const sheet = Config.getSheet('Orders');
    const headers = sheet.getDataRange().getValues()[0];
    if (DataIntegrity.orderColumns.some(function(name,i) { return headers[i] !== name; })) throw new Error('Header Orders differs; do not reorder existing columns');
    DataIntegrity.additions.forEach(function(name) {
      if (headers.indexOf(name) < 0) { headers.push(name); if (sheet.getMaxColumns() < headers.length) sheet.insertColumnsAfter(sheet.getMaxColumns(),1); sheet.getRange(1,headers.length).setValue(name); }
    });
    const exists = ScriptApp.getProjectTriggers().some(function(t) { return t.getHandlerFunction() === 'processOrderNotificationsStage2'; });
    if (!exists) ScriptApp.newTrigger('processOrderNotificationsStage2').timeBased().everyMinutes(1).create();
    return { success: true };
  });
  if (!result.success) throw new Error('Migrasi gagal. Periksa header Orders dan izin script sebelum mencoba lagi.');
  Logger.log('Stage 2 ready. Existing orders unchanged.');
}
