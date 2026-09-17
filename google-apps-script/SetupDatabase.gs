/**
 * Setup Database - Run this ONCE to create all sheets
 * 
 * CARA MENJALANKAN:
 * 1. Buka Google Apps Script editor
 * 2. Pilih function "setupDatabase" dari dropdown
 * 3. Klik Run
 * 4. Authorize permissions
 * 5. Copy SPREADSHEET_ID yang muncul di log
 * 6. Paste ke Config.gs
 */

function setupDatabase() {
  // Create new spreadsheet
  const ss = SpreadsheetApp.create('Kastriva Database - ' + new Date().toLocaleDateString());
  const ssId = ss.getId();
  
  Logger.log('✅ Spreadsheet created!');
  Logger.log('📋 SPREADSHEET_ID: ' + ssId);
  Logger.log('📝 Copy ID di atas dan paste ke Config.gs');
  
  // Define all sheets dengan headers
  const sheets = {
    'Settings': [
      ['key', 'value'],
      ['brandName', 'Kastriva'],
      ['tagline', 'Solusi Digital Modern untuk Bisnis Anda'],
      ['whatsapp', '6281234567890'],
      ['email', 'hello@kastriva.com'],
      ['instagram', '#'],
      ['tiktok', '#'],
      ['github', '#'],
      ['website', '#'],
      ['heroHeadline', 'Bangun Website & Aplikasi Profesional untuk Mengembangkan Bisnis Anda'],
      ['heroSubheadline', 'Saya membantu bisnis, UMKM, organisasi, dan personal membangun website serta aplikasi custom yang modern, cepat, responsif, dan sesuai kebutuhan.'],
      ['ctaPrimary', 'Mulai Project'],
      ['ctaSecondary', 'Lihat Portfolio']
    ],
    
    'Portfolio': [
      'id', 'slug', 'title', 'category', 'description', 'shortDescription', 'image', 
      'technologies', 'demoUrl', 'githubUrl', 'year', 'status', 'problemSolved', 
      'solution', 'features', 'myRole', 'featured', 'published', 'sortOrder', 
      'createdAt', 'updatedAt'
    ],
    
    'PortfolioImages': [
      'id', 'portfolioId', 'imageUrl', 'sortOrder', 'createdAt'
    ],
    
    'Categories': [
      'id', 'name', 'slug', 'description', 'sortOrder'
    ],
    
    'Services': [
      'id', 'title', 'slug', 'description', 'icon', 'features', 'startingPrice', 
      'duration', 'isActive', 'sortOrder', 'createdAt', 'updatedAt'
    ],
    
    'Orders': [
      'id', 'orderNumber', 'customerId', 'name', 'business', 'email', 'whatsapp', 
      'projectType', 'serviceId', 'portfolioId', 'portfolioTitle', 'budget', 
      'deadline', 'description', 'features', 'referenceUrl', 'status', 
      'createdAt', 'updatedAt'
    ],
    
    'Customers': [
      'id', 'name', 'email', 'whatsapp', 'business', 'avatar', 'status', 
      'createdAt', 'lastActivity'
    ],
    
    'Projects': [
      'id', 'orderId', 'customerId', 'projectName', 'description', 'status', 
      'progress', 'startDate', 'deadline', 'completedDate', 'createdAt', 'updatedAt'
    ],
    
    'ProjectUpdates': [
      'id', 'projectId', 'title', 'description', 'progress', 'status', 
      'createdAt', 'createdBy'
    ],
    
    'Messages': [
      'id', 'senderId', 'receiverId', 'orderId', 'projectId', 'message', 
      'attachment', 'createdAt', 'read'
    ],
    
    'Quotations': [
      'id', 'quotationNumber', 'orderId', 'customerId', 'projectName', 'items', 
      'subtotal', 'discount', 'tax', 'total', 'notes', 'validUntil', 'status', 
      'createdAt', 'updatedAt', 'revisionLimit', 'paymentTerms', 'customerNote', 'respondedAt'
    ],
    
    'QuotationItems': [
      'id', 'quotationId', 'description', 'quantity', 'price', 'total'
    ],
    
    'Invoices': [
      'id', 'invoiceNumber', 'orderId', 'customerId', 'projectName', 'items', 
      'subtotal', 'discount', 'tax', 'total', 'paymentStatus', 'dueDate', 
      'paymentMethod', 'createdAt', 'updatedAt', 'quotationId', 'amountPaid', 'notes', 'paidAt'
    ],

    'Revisions': [
      'id', 'revisionNumber', 'projectId', 'orderId', 'customerId', 'title', 'description',
      'status', 'priority', 'adminResponse', 'requestedAt', 'updatedAt', 'resolvedAt'
    ],

    'Handovers': [
      'id', 'handoverNumber', 'projectId', 'orderId', 'customerId', 'projectName', 'deliverables',
      'liveUrl', 'repositoryUrl', 'adminUrl', 'notes', 'warrantyUntil', 'status', 'sentAt',
      'acceptedAt', 'createdAt', 'updatedAt'
    ],
    
    'Testimonials': [
      'id', 'customerName', 'customerEmail', 'customerBusiness', 'message', 
      'rating', 'published', 'createdAt'
    ],
    
    'FAQ': [
      'id', 'question', 'answer', 'sortOrder', 'published', 'createdAt'
    ],
    
    'Notifications': [
      'id', 'userId', 'title', 'message', 'type', 'read', 'createdAt'
    ],
    
    'Files': [
      'id', 'orderId', 'projectId', 'fileName', 'fileUrl', 'fileType', 
      'uploadedBy', 'createdAt'
    ],
    
    'AuditLogs': [
      'id', 'action', 'userId', 'details', 'createdAt', 'userEmail'
    ]
  };
  
  // Create sheets
  Object.keys(sheets).forEach((sheetName, index) => {
    let sheet;
    
    if (index === 0) {
      // Rename default "Sheet1"
      sheet = ss.getSheets()[0];
      sheet.setName(sheetName);
    } else {
      sheet = ss.insertSheet(sheetName);
    }
    
    const data = sheets[sheetName];
    
    if (Array.isArray(data[0])) {
      // Data sudah include rows (seperti Settings)
      sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
    } else {
      // Hanya headers
      sheet.getRange(1, 1, 1, data.length).setValues([data]);
    }
    
    // Format header row
    const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#6C5CE7');
    headerRange.setFontColor('#FFFFFF');
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, sheet.getLastColumn());
    
    // Freeze header row
    sheet.setFrozenRows(1);
    
    Logger.log('✅ Created sheet: ' + sheetName);
  });
  
  // Add sample data
  addSampleData(ss);
  
  Logger.log('');
  Logger.log('🎉 Database setup complete!');
  Logger.log('📋 SPREADSHEET_ID: ' + ssId);
  Logger.log('🔗 Spreadsheet URL: ' + ss.getUrl());
  Logger.log('');
  Logger.log('⚠️ NEXT STEPS:');
  Logger.log('1. Copy SPREADSHEET_ID di atas');
  Logger.log('2. Buka Config.gs');
  Logger.log('3. Paste SPREADSHEET_ID ke: Config.SPREADSHEET_ID = "' + ssId + '";');
  Logger.log('4. Save dan redeploy web app');
}

/**
 * Add sample data untuk testing
 */
function addSampleData(ss) {
  // Sample Portfolio
  const portfolioSheet = ss.getSheetByName('Portfolio');
  const now = new Date().toISOString();
  
  portfolioSheet.appendRow([
    'port_001',
    'sistem-manajemen-inventaris',
    'Sistem Manajemen Inventaris',
    'Sistem Informasi',
    'Aplikasi web untuk mengelola stok barang, pemasukan, dan pengeluaran secara real-time dengan laporan otomatis.',
    'Sistem inventaris real-time',
    '/portfolio/inventory.png',
    JSON.stringify(['Next.js', 'TypeScript', 'PostgreSQL', 'Tailwind']),
    'https://demo.kastriva.com/inventory',
    'https://github.com/kastriva/inventory',
    '2025',
    'Completed',
    'Menggantikan pencatatan manual yang rawan error dengan sistem terdigitalisasi.',
    'Membangun sistem berbasis web dengan fitur manajemen stok, laporan harian, dan notifikasi low stock.',
    JSON.stringify(['Manajemen Stok', 'Laporan Otomatis', 'Notifikasi Low Stock', 'Multi-User']),
    'Fullstack Developer & UI/UX Designer',
    true,
    true,
    1,
    now,
    now
  ]);
  
  // Sample Service
  const servicesSheet = ss.getSheetByName('Services');
  servicesSheet.appendRow([
    'svc_001',
    'Website Company Profile',
    'website-company-profile',
    'Website profesional untuk membangun kredibilitas perusahaan Anda.',
    'Building2',
    JSON.stringify(['Desain Premium', 'SEO Optimized', 'Mobile Friendly']),
    'Mulai dari Rp 3.500.000',
    '1-2 minggu',
    true,
    1,
    now,
    now
  ]);
  
  Logger.log('✅ Sample data added');
}
