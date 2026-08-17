/**
 * Services Module
 */

const Services = {
  getAll: function() {
    try {
      const sheet = Config.getSheet('Services');
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const rows = data.slice(1);
      
      const services = rows.map(row => {
        const obj = {};
        headers.forEach((header, i) => {
          obj[header] = row[i];
        });
        return obj;
      }).filter(s => s.isActive === true || s.isActive === 'TRUE');
      
      services.sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
      
      return { success: true, data: services };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
