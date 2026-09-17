/**
 * KASTRIVA - Workflow helpers (Stage 3)
 * Shared utilities for quotation, invoice, revision and handover modules.
 */
const Workflow = {
  sheetHeaders: function(sheetName) {
    const sheet = Config.getSheet(sheetName);
    const lastColumn = Math.max(1, sheet.getLastColumn());
    return sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(function(h) { return String(h || '').trim(); });
  },

  rowObject: function(headers, row) {
    const obj = {};
    headers.forEach(function(h, i) { if (h) obj[h] = row[i]; });
    return obj;
  },

  getAll: function(sheetName) {
    const sheet = Config.getSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    const headers = data[0] || [];
    return data.slice(1).filter(function(r) { return r[0] !== ''; }).map(function(r) {
      return Workflow.rowObject(headers, r);
    });
  },

  find: function(sheetName, field, value) {
    const sheet = Config.getSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    const headers = data[0] || [];
    const index = headers.indexOf(field);
    if (index < 0) return null;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][index]) === String(value)) {
        return { sheet: sheet, rowNumber: i + 1, headers: headers, row: data[i], data: Workflow.rowObject(headers, data[i]) };
      }
    }
    return null;
  },

  appendObject: function(sheetName, object) {
    const sheet = Config.getSheet(sheetName);
    const headers = Workflow.sheetHeaders(sheetName);
    const row = headers.map(function(h) {
      const value = Object.prototype.hasOwnProperty.call(object, h) ? object[h] : '';
      return typeof value === 'string' ? DataIntegrity.text(value) : value;
    });
    sheet.appendRow(row);
    return row;
  },

  setFields: function(found, fields) {
    Object.keys(fields).forEach(function(name) {
      const index = found.headers.indexOf(name);
      if (index >= 0) {
        const value = typeof fields[name] === 'string' ? DataIntegrity.text(fields[name]) : fields[name];
        found.sheet.getRange(found.rowNumber, index + 1).setValue(value);
      }
    });
  },

  parseJsonArray: function(value) {
    try {
      const parsed = JSON.parse(value || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  },

  orderById: function(orderId) {
    return Workflow.find('Orders', 'id', orderId);
  },

  projectById: function(projectId) {
    return Workflow.find('Projects', 'id', projectId);
  },

  customerEmailForOrder: function(orderId) {
    const found = Workflow.orderById(orderId);
    return found ? String(found.data.email || '') : '';
  },

  setOrderStatus: function(orderId, status, now) {
    const found = Workflow.orderById(orderId);
    if (!found) return false;
    Workflow.setFields(found, { status: status, updatedAt: now || new Date().toISOString() });
    return true;
  },

  setProjectStatus: function(projectId, status, progress, now) {
    const found = Workflow.projectById(projectId);
    if (!found) return false;
    const fields = { status: status, updatedAt: now || new Date().toISOString() };
    if (progress !== undefined && progress !== null) fields.progress = Math.max(0, Math.min(100, Number(progress) || 0));
    if (status === 'Completed') fields.completedDate = now || new Date().toISOString();
    Workflow.setFields(found, fields);
    return true;
  },

  cleanUrl: function(value) {
    const v = String(value || '').trim();
    if (!v) return '';
    if (!/^https?:\/\//i.test(v)) throw new Error('URL harus diawali http:// atau https://');
    if (v.length > 500) throw new Error('URL terlalu panjang');
    return v;
  },

  cleanText: function(value, max) {
    const v = String(value == null ? '' : value).trim();
    if (v.length > (max || 2000)) throw new Error('Teks terlalu panjang');
    return Utils.sanitize(v);
  }
};
