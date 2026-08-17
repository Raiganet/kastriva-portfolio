/**
 * Settings Module
 */

const Settings = {
  getAll: function() {
    try {
      const sheet = Config.getSheet('Settings');
      const data = sheet.getDataRange().getValues();
      
      const settings = {};
      data.forEach(row => {
        if (row[0]) {
          settings[row[0]] = row[1];
        }
      });
      
      return { success: true, data: settings };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  update: function(key, value) {
    try {
      const sheet = Config.getSheet('Settings');
      const data = sheet.getDataRange().getValues();
      
      for (let i = 0; i < data.length; i++) {
        if (data[i][0] === key) {
          sheet.getRange(i + 1, 2).setValue(value);
          return { success: true };
        }
      }
      
      // Add new setting
      sheet.appendRow([key, value]);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
