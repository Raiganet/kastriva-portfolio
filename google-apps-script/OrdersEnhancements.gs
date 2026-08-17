/**
 * ORDER ENHANCEMENTS (paste ke file Orders.gs Anda, TAMBAHKAN di bawah kode yang sudah ada)
 * 
 * Fitur baru:
 * - getOrderByNumber: ambil order by nomor order (untuk tracking)
 * - sendConfirmationEmail: kirim email ke customer setelah order dibuat
 */

/**
 * Get order by order number (PUBLIC - untuk customer tracking)
 */
Orders.getByOrderNumber = function(orderNumber) {
  try {
    if (!orderNumber || !/^KAS-\d{4}-\d{4}$/.test(orderNumber)) {
      return { success: false, error: 'Format nomor order tidak valid' };
    }
    
    const sheet = Config.getSheet('Orders');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][1] === orderNumber) { // Column B = orderNumber
        const obj = {};
        headers.forEach((header, j) => {
          obj[header] = rows[i][j];
        });
        
        // Get related project if exists
        const projectsSheet = Config.getSheet('Projects');
        const projectsData = projectsSheet.getDataRange().getValues();
        const projectsHeaders = projectsData[0];
        let relatedProject = null;
        
        for (let p = 1; p < projectsData.length; p++) {
          if (projectsData[p][1] === obj.id) { // orderId match
            const proj = {};
            projectsHeaders.forEach((h, j) => {
              proj[h] = projectsData[p][j];
            });
            relatedProject = proj;
            break;
          }
        }
        
        // Get updates if project exists
        let updates = [];
        if (relatedProject) {
          const updatesSheet = Config.getSheet('ProjectUpdates');
          const updatesData = updatesSheet.getDataRange().getValues();
          const updatesHeaders = updatesData[0];
          updates = updatesData.slice(1)
            .filter(row => row[1] === relatedProject.id)
            .map(row => {
              const u = {};
              updatesHeaders.forEach((h, j) => { u[h] = row[j]; });
              return u;
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        
        return {
          success: true,
          data: {
            order: obj,
            project: relatedProject,
            updates: updates
          }
        };
      }
    }
    
    return { success: false, error: 'Order tidak ditemukan' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Send confirmation email ke customer
 */
Orders.sendConfirmationEmail = function(orderNumber, customerData) {
  try {
    const subject = 'Pesanan Anda Diterima - ' + orderNumber + ' | ' + Config.APP_NAME;
    const body = `Halo ${customerData.name}, 👋

Terima kasih telah menghubungi ${Config.APP_NAME}!

Pesanan Anda telah kami terima dengan detail sebagai berikut:

📋 NOMOR ORDER: ${orderNumber}
📌 Jenis Project: ${customerData.type}
💰 Budget: ${customerData.budget || 'Akan didiskusikan'}
⏰ Deadline: ${customerData.deadline || 'Fleksibel'}

📝 DESKRIPSI PROJECT:
${customerData.description}

🔧 FITUR YANG DIMINTA:
${customerData.features || '-'}

━━━━━━━━━━━━━━━━━━━━━━━━

⏭️  LANGKAH SELANJUTNYA:
1. Tim kami akan membalas via WhatsApp/email dalam 1x24 jam (hari kerja)
2. Kami akan menjadwalkan sesi konsultasi untuk membahas detail project
3. Setelah scope disepakati, kami akan mengirimkan penawaran resmi (quotation)

🔗 LACAK STATUS ORDER:
Anda dapat melacak status order kapan saja di website kami menggunakan nomor order di atas.

━━━━━━━━━━━━━━━━━━━━━━━━

Jika ada pertanyaan, silakan balas email ini atau hubungi kami via WhatsApp.

Salam hangat,
Tim ${Config.APP_NAME}
${Config.getSettings ? '' : ''}WhatsApp: ${Config.whatsapp || '-'}
Email: ${Config.email || '-'}`;

    GmailApp.sendEmail(customerData.email, subject, body, {
      name: Config.APP_NAME,
      replyTo: Config.ADMIN_EMAIL
    });
    
    Utils.logAudit('confirmation_email_sent', 'system', { orderNumber: orderNumber });
    return { success: true };
  } catch (error) {
    Logger.log('Email confirmation error: ' + error.message);
    return { success: false, error: error.message };
  }
};
