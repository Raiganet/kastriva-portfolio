/**
 * Portfolio Module
 */

const Portfolio = {
  /**
   * Get all portfolio
   */
  getAll: function(params) {
    try {
      const sheet = Config.getSheet('Portfolio');
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const rows = data.slice(1);
      
      let portfolio = rows.map(row => {
        const obj = {};
        headers.forEach((header, i) => {
          obj[header] = row[i];
        });
        return obj;
      });
      
      // Filter published only
      portfolio = portfolio.filter(p => p.published === true || p.published === 'TRUE');
      
      // Filter by category
      if (params.category && params.category !== 'Semua') {
        portfolio = portfolio.filter(p => p.category === params.category);
      }
      
      // Search
      if (params.search) {
        const search = params.search.toLowerCase();
        portfolio = portfolio.filter(p => 
          p.title.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search) ||
          (p.technologies && p.technologies.toLowerCase().includes(search))
        );
      }
      
      // Sort by sortOrder
      portfolio.sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
      
      return { success: true, data: portfolio };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Get portfolio by slug
   */
  getBySlug: function(slug) {
    try {
      const result = this.getAll({});
      if (!result.success) return result;
      
      const project = result.data.find(p => Utils.generateSlug(p.title) === slug);
      
      if (!project) {
        return { success: false, error: 'Portfolio not found' };
      }
      
      // Get images
      const imagesSheet = Config.getSheet('PortfolioImages');
      const imagesData = imagesSheet.getDataRange().getValues();
      const images = imagesData.slice(1)
        .filter(row => row[1] === project.id)
        .map(row => row[2]);
      
      project.images = images;
      
      return { success: true, data: project };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Get categories with count
   */
  getCategories: function() {
    try {
      const result = this.getAll({});
      if (!result.success) return result;
      
      const categoryMap = {};
      result.data.forEach(p => {
        categoryMap[p.category] = (categoryMap[p.category] || 0) + 1;
      });
      
      const categories = [
        { id: 'all', name: 'Semua', slug: 'all', count: result.data.length }
      ];
      
      Object.keys(categoryMap).forEach(name => {
        categories.push({
          id: Utils.generateSlug(name),
          name: name,
          slug: Utils.generateSlug(name),
          count: categoryMap[name]
        });
      });
      
      return { success: true, data: categories };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Create portfolio (admin only)
   */
  create: function(data) {
    try {
      const sheet = Config.getSheet('Portfolio');
      const id = Utils.generateId();
      const now = new Date().toISOString();
      
      sheet.appendRow([
        id,
        Utils.generateSlug(data.title),
        data.title,
        data.category,
        data.description,
        data.shortDescription || '',
        data.image,
        JSON.stringify(data.technologies || []),
        data.demoUrl || '',
        data.githubUrl || '',
        data.year,
        data.status || 'Draft',
        data.problemSolved || '',
        data.solution || '',
        JSON.stringify(data.features || []),
        data.myRole || '',
        data.featured || false,
        data.published || false,
        data.sortOrder || 999,
        now,
        now
      ]);
      
      Utils.logAudit('portfolio_created', 'admin', { id: id, title: data.title });
      
      return { success: true, data: { id: id } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
