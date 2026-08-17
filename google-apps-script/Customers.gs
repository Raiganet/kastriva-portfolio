/**
 * Customers Module (simplified)
 */

const Customers = {
  getAll: function(params) {
    try {
      const sheet = Config.getSheet('Customers');
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const rows = data.slice(1);
      
      const customers = rows.map(row => {
        const obj = {};
        headers.forEach((header, i) => {
          obj[header] = row[i];
        });
        return obj;
      });
      
      return { success: true, data: customers };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  getById: function(id) {
    const result = this.getAll({});
    if (!result.success) return result;
    
    const customer = result.data.find(c => c.id === id);
    if (!customer) {
      return { success: false, error: 'Customer not found' };
    }
    
    return { success: true, data: customer };
  }
};
