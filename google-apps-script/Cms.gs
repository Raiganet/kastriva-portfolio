/**
 * KASTRIVA - Full Website CMS (Stage 5)
 * SiteContent stores one JSON document per website section.
 * Public reads are safe; writes require the admin route/session.
 */
const Cms = {
  SHEET: 'SiteContent',
  SECTIONS: [
    'brand','navigation','hero','stats','services','featured','portfolio','whyChoose','pricing','process',
    'testimonials','faq','team','about','contact','cta','footer','seo'
  ],

  getSheet: function() {
    return Config.getSheet(this.SHEET);
  },

  getAll: function() {
    try {
      const sheet = this.getSheet();
      const rows = sheet.getDataRange().getValues().slice(1);
      const data = {};
      rows.forEach(function(row) {
        const section = String(row[0] || '');
        if (Cms.SECTIONS.indexOf(section) === -1 || !row[1]) return;
        try { data[section] = JSON.parse(String(row[1])); } catch (_) {}
      });
      return { success: true, data: data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  sanitize: function(value, key, depth) {
    depth = depth || 0;
    if (depth > 8) throw new Error('Struktur konten terlalu dalam.');
    if (value === null) return null;
    if (Array.isArray(value)) {
      if (value.length > 100) throw new Error('Terlalu banyak item dalam satu bagian.');
      return value.map(function(item) { return Cms.sanitize(item, key, depth + 1); });
    }
    if (typeof value === 'object') {
      const out = {};
      Object.keys(value).slice(0, 100).forEach(function(k) {
        if (!/^[A-Za-z0-9_-]{1,50}$/.test(k)) return;
        out[k] = Cms.sanitize(value[k], k, depth + 1);
      });
      return out;
    }
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    let text = String(value == null ? '' : value).trim();
    if (text.length > 8000) text = text.slice(0, 8000);

    const lowerKey = String(key || '').toLowerCase();
    if (/(href|url|website|instagram|tiktok|github|youtube|image)$/.test(lowerKey) && text) {
      const allowed = text === '#' || text.charAt(0) === '/' || /^https:\/\//i.test(text) || /^mailto:/i.test(text);
      if (!allowed) return '#';
    }
    if (lowerKey === 'whatsapp') text = text.replace(/[^0-9+]/g, '').slice(0, 20);
    return text;
  },

  updateSection: function(body) {
    try {
      const section = String(body.section || '');
      if (this.SECTIONS.indexOf(section) === -1) return { success: false, error: 'Bagian CMS tidak valid.' };
      if (!body.content || typeof body.content !== 'object' || Array.isArray(body.content)) {
        return { success: false, error: 'Konten CMS tidak valid.' };
      }
      const clean = this.sanitize(body.content, section, 0);
      const json = JSON.stringify(clean);
      if (json.length > 45000) return { success: false, error: 'Konten bagian ini terlalu besar. Kurangi jumlah item atau panjang teks.' };

      const sheet = this.getSheet();
      const values = sheet.getDataRange().getValues();
      let row = -1;
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][0]) === section) { row = i + 1; break; }
      }
      const now = new Date().toISOString();
      if (row > 0) sheet.getRange(row, 2, 1, 2).setValues([[json, now]]);
      else sheet.appendRow([section, json, now]);
      SpreadsheetApp.flush();
      return { success: true, data: { section: section, updatedAt: now } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
