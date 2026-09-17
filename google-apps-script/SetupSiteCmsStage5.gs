/**
 * Non-destructive migration for Stage 5 Full Website CMS.
 * Run setupSiteCmsStage5() once, then redeploy the GAS web app.
 */
function setupSiteCmsStage5() {
  const result = DataIntegrity.mutate(function() {
    const ss = Config.getSpreadsheet();
    let sheet = ss.getSheetByName('SiteContent');
    if (!sheet) {
      sheet = ss.insertSheet('SiteContent');
      sheet.getRange(1, 1, 1, 3).setValues([['section', 'content', 'updatedAt']]);
      sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#6C5CE7').setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
      sheet.setColumnWidth(1, 180);
      sheet.setColumnWidth(2, 600);
      sheet.setColumnWidth(3, 220);
    } else {
      const headers = sheet.getRange(1, 1, 1, Math.max(3, sheet.getLastColumn())).getValues()[0];
      if (headers[0] !== 'section' || headers[1] !== 'content') throw new Error('Sheet SiteContent sudah ada tetapi format header berbeda. Jangan ditimpa otomatis.');
      if (!headers[2]) sheet.getRange(1, 3).setValue('updatedAt');
    }

    // Preserve existing Settings values as initial partial CMS content, only when section does not exist.
    const existing = {};
    sheet.getDataRange().getValues().slice(1).forEach(function(r) { if (r[0]) existing[String(r[0])] = true; });
    let settings = {};
    try {
      const s = Settings.getAll();
      if (s.success && s.data) settings = s.data;
    } catch (_) {}
    const now = new Date().toISOString();
    if (!existing.brand) {
      sheet.appendRow(['brand', JSON.stringify({
        name: settings.brandName || 'Kastriva',
        tagline: settings.tagline || 'Solusi Digital Modern untuk Bisnis Anda',
        whatsapp: settings.whatsapp || '',
        email: settings.email || '',
        socials: {
          instagram: settings.instagram || '#', tiktok: settings.tiktok || '#',
          github: settings.github || '#', website: settings.website || '#'
        }
      }), now]);
    }
    if (!existing.hero) {
      sheet.appendRow(['hero', JSON.stringify({
        headline: settings.heroHeadline || '', subheadline: settings.heroSubheadline || '',
        ctaPrimary: settings.ctaPrimary || 'Mulai Project', ctaSecondary: settings.ctaSecondary || 'Lihat Portfolio'
      }), now]);
    }
    return { success: true };
  });
  if (!result.success) throw new Error(result.error || 'Migrasi CMS gagal.');
  Logger.log('Stage 5 CMS ready. Existing website/order data unchanged. Redeploy GAS Web App.');
}
