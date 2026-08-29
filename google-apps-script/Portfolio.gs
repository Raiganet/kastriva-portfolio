/**
 * KASTRIVA - Portfolio CMS
 * Public read + admin CRUD for Portfolio and PortfolioImages.
 */

const Portfolio = {
  _toObject: function(headers, row) {
    const obj = {};
    headers.forEach(function(header, i) { obj[header] = row[i]; });
    return obj;
  },

  _getRows: function(sheetName) {
    const sheet = Config.getSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    if (!data.length) return { sheet: sheet, headers: [], rows: [] };
    return { sheet: sheet, headers: data[0], rows: data.slice(1) };
  },

  _normalizeBool: function(value) {
    return value === true || value === 'TRUE' || value === 'true' || value === 1 || value === '1';
  },

  _validate: function(data) {
    if (!data || !String(data.title || '').trim()) return 'Judul project wajib diisi';
    if (!String(data.category || '').trim()) return 'Kategori wajib diisi';
    if (!String(data.description || '').trim()) return 'Deskripsi wajib diisi';
    if (!String(data.image || '').trim()) return 'URL gambar utama wajib diisi';
    return null;
  },

  _parseArray: function(value) {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    try {
      const parsed = JSON.parse(String(value));
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return String(value).split(/[,\n]/).map(function(v){ return v.trim(); }).filter(Boolean);
    }
  },

  _payload: function(data) {
    return {
      title: Utils.sanitize(data.title),
      category: Utils.sanitize(data.category),
      description: Utils.sanitize(data.description),
      shortDescription: Utils.sanitize(data.shortDescription || ''),
      image: String(data.image || '').trim(),
      technologies: Array.isArray(data.technologies) ? data.technologies.map(String).map(function(v){ return v.trim(); }).filter(Boolean) : [],
      demoUrl: String(data.demoUrl || '').trim(),
      githubUrl: String(data.githubUrl || '').trim(),
      year: String(data.year || new Date().getFullYear()),
      status: String(data.status || 'Completed'),
      problemSolved: Utils.sanitize(data.problemSolved || ''),
      solution: Utils.sanitize(data.solution || ''),
      features: Array.isArray(data.features) ? data.features.map(String).map(function(v){ return v.trim(); }).filter(Boolean) : [],
      myRole: Utils.sanitize(data.myRole || ''),
      featured: this._normalizeBool(data.featured),
      published: this._normalizeBool(data.published),
      sortOrder: Math.max(1, Number(data.sortOrder) || 999),
      images: Array.isArray(data.images) ? data.images.map(String).map(function(v){ return v.trim(); }).filter(Boolean) : []
    };
  },

  /** Public: only published projects */
  getAll: function(params) {
    try {
      const result = this._getRows('Portfolio');
      let portfolio = result.rows
        .filter(function(row) { return row[0] !== ''; })
        .map(this._toObject.bind(this, result.headers))
        .filter(function(p) { return Portfolio._normalizeBool(p.published); });

      params = params || {};
      if (params.category && params.category !== 'Semua' && params.category !== 'all') {
        portfolio = portfolio.filter(function(p) { return p.category === params.category; });
      }
      if (params.search) {
        const search = String(params.search).toLowerCase();
        portfolio = portfolio.filter(function(p) {
          return String(p.title || '').toLowerCase().includes(search) ||
            String(p.description || '').toLowerCase().includes(search) ||
            String(p.category || '').toLowerCase().includes(search) ||
            String(p.technologies || '').toLowerCase().includes(search);
        });
      }
      portfolio.sort(function(a, b) { return (Number(a.sortOrder) || 999) - (Number(b.sortOrder) || 999); });
      return { success: true, data: portfolio };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /** Admin: all projects, including drafts/unpublished */
  getAllAdmin: function(params) {
    try {
      const result = this._getRows('Portfolio');
      let portfolio = result.rows
        .filter(function(row) { return row[0] !== ''; })
        .map(this._toObject.bind(this, result.headers));

      params = params || {};
      if (params.search) {
        const search = String(params.search).toLowerCase();
        portfolio = portfolio.filter(function(p) {
          return String(p.title || '').toLowerCase().includes(search) ||
            String(p.category || '').toLowerCase().includes(search);
        });
      }
      portfolio.sort(function(a, b) { return (Number(a.sortOrder) || 999) - (Number(b.sortOrder) || 999); });

      const imagesResult = this._getRows('PortfolioImages');
      const grouped = {};
      imagesResult.rows.filter(function(r){ return r[0] !== ''; }).forEach(function(row) {
        const image = Portfolio._toObject(imagesResult.headers, row);
        if (!grouped[image.portfolioId]) grouped[image.portfolioId] = [];
        if (image.imageUrl) grouped[image.portfolioId].push(image.imageUrl);
      });
      portfolio.forEach(function(p) {
        p.technologies = Portfolio._parseArray(p.technologies);
        p.features = Portfolio._parseArray(p.features);
        p.featured = Portfolio._normalizeBool(p.featured);
        p.published = Portfolio._normalizeBool(p.published);
        p.sortOrder = Number(p.sortOrder) || 999;
        p.images = grouped[p.id] || [];
      });

      return { success: true, data: portfolio };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getBySlug: function(slug) {
    try {
      const result = this.getAll({});
      if (!result.success) return result;
      const project = result.data.find(function(p) { return Utils.generateSlug(p.title) === slug; });
      if (!project) return { success: false, error: 'Portfolio not found' };

      const imagesResult = this._getRows('PortfolioImages');
      project.images = imagesResult.rows
        .filter(function(row) { return row[1] === project.id && row[2]; })
        .sort(function(a,b){ return (Number(a[3])||999) - (Number(b[3])||999); })
        .map(function(row){ return row[2]; });
      return { success: true, data: project };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getCategories: function() {
    try {
      const result = this.getAll({});
      if (!result.success) return result;
      const categoryMap = {};
      result.data.forEach(function(p) { categoryMap[p.category] = (categoryMap[p.category] || 0) + 1; });
      const categories = [{ id: 'all', name: 'Semua', slug: 'all', count: result.data.length }];
      Object.keys(categoryMap).forEach(function(name) {
        categories.push({ id: Utils.generateSlug(name), name: name, slug: Utils.generateSlug(name), count: categoryMap[name] });
      });
      return { success: true, data: categories };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  create: function(data) {
    try {
      const validation = this._validate(data);
      if (validation) return { success: false, error: validation };
      const payload = this._payload(data);
      const sheet = Config.getSheet('Portfolio');
      const id = Utils.generateId();
      const now = new Date().toISOString();

      sheet.appendRow([
        id, Utils.generateSlug(payload.title), payload.title, payload.category, payload.description,
        payload.shortDescription, payload.image, JSON.stringify(payload.technologies), payload.demoUrl,
        payload.githubUrl, payload.year, payload.status, payload.problemSolved, payload.solution,
        JSON.stringify(payload.features), payload.myRole, payload.featured, payload.published,
        payload.sortOrder, now, now
      ]);
      this._replaceImages(id, payload.images);
      Utils.logAudit('portfolio_created', 'admin', { id: id, title: payload.title });
      return { success: true, data: { id: id } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  update: function(data) {
    try {
      if (!data || !data.id) return { success: false, error: 'ID portfolio wajib diisi' };
      const validation = this._validate(data);
      if (validation) return { success: false, error: validation };
      const payload = this._payload(data);
      const sheet = Config.getSheet('Portfolio');
      const values = sheet.getDataRange().getValues();
      const headers = values[0];
      const rowIndex = values.findIndex(function(row, idx) { return idx > 0 && String(row[0]) === String(data.id); });
      if (rowIndex < 1) return { success: false, error: 'Portfolio tidak ditemukan' };

      const now = new Date().toISOString();
      const row = values[rowIndex];
      const map = {};
      headers.forEach(function(h, i){ map[h] = i; });
      row[map.id] = String(data.id);
      row[map.slug] = Utils.generateSlug(payload.title);
      row[map.title] = payload.title;
      row[map.category] = payload.category;
      row[map.description] = payload.description;
      row[map.shortDescription] = payload.shortDescription;
      row[map.image] = payload.image;
      row[map.technologies] = JSON.stringify(payload.technologies);
      row[map.demoUrl] = payload.demoUrl;
      row[map.githubUrl] = payload.githubUrl;
      row[map.year] = payload.year;
      row[map.status] = payload.status;
      row[map.problemSolved] = payload.problemSolved;
      row[map.solution] = payload.solution;
      row[map.features] = JSON.stringify(payload.features);
      row[map.myRole] = payload.myRole;
      row[map.featured] = payload.featured;
      row[map.published] = payload.published;
      row[map.sortOrder] = payload.sortOrder;
      row[map.updatedAt] = now;
      sheet.getRange(rowIndex + 1, 1, 1, headers.length).setValues([row]);

      this._replaceImages(String(data.id), payload.images);
      Utils.logAudit('portfolio_updated', 'admin', { id: data.id, title: payload.title });
      return { success: true, data: { id: data.id } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  remove: function(data) {
    try {
      if (!data || !data.id) return { success: false, error: 'ID portfolio wajib diisi' };
      const sheet = Config.getSheet('Portfolio');
      const values = sheet.getDataRange().getValues();
      const rowIndex = values.findIndex(function(row, idx) { return idx > 0 && String(row[0]) === String(data.id); });
      if (rowIndex < 1) return { success: false, error: 'Portfolio tidak ditemukan' };
      const title = values[rowIndex][2];
      sheet.deleteRow(rowIndex + 1);
      this._deleteImages(String(data.id));
      Utils.logAudit('portfolio_deleted', 'admin', { id: data.id, title: title });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  _deleteImages: function(portfolioId) {
    const sheet = Config.getSheet('PortfolioImages');
    const data = sheet.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
      if (String(data[i][1]) === String(portfolioId)) sheet.deleteRow(i + 1);
    }
  },

  _replaceImages: function(portfolioId, images) {
    this._deleteImages(portfolioId);
    if (!images || !images.length) return;
    const sheet = Config.getSheet('PortfolioImages');
    const now = new Date().toISOString();
    images.forEach(function(url, index) {
      sheet.appendRow([Utils.generateId(), portfolioId, url, index + 1, now]);
    });
  }
};
