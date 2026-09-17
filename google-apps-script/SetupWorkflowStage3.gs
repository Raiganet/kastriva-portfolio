/**
 * KASTRIVA - Stage 3 workflow migration
 * Run setupWorkflowStage3() ONCE after copying Stage 3 GAS files.
 * Safe to run repeatedly. Existing rows are preserved.
 */
function setupWorkflowStage3() {
  const result = DataIntegrity.mutate(function() {
    const ss = Config.getSpreadsheet();

    var ensureSheet = function(name, headers) {
      var sheet = ss.getSheetByName(name);
      if (!sheet) {
        sheet = ss.insertSheet(name);
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.setFrozenRows(1);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#6C5CE7').setFontColor('#FFFFFF');
        return sheet;
      }
      var existing = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0].map(String);
      headers.forEach(function(header) {
        if (existing.indexOf(header) < 0) {
          var next = existing.length + 1;
          if (sheet.getMaxColumns() < next) sheet.insertColumnsAfter(sheet.getMaxColumns(), 1);
          sheet.getRange(1, next).setValue(header);
          existing.push(header);
        }
      });
      return sheet;
    };

    ensureSheet('Quotations', [
      'id','quotationNumber','orderId','customerId','projectName','items','subtotal','discount','tax','total','notes','validUntil','status','createdAt','updatedAt',
      'revisionLimit','paymentTerms','customerNote','respondedAt'
    ]);

    ensureSheet('Invoices', [
      'id','invoiceNumber','orderId','customerId','projectName','items','subtotal','discount','tax','total','paymentStatus','dueDate','paymentMethod','createdAt','updatedAt',
      'quotationId','amountPaid','notes','paidAt'
    ]);

    ensureSheet('Revisions', [
      'id','revisionNumber','projectId','orderId','customerId','title','description','status','priority','adminResponse','requestedAt','updatedAt','resolvedAt'
    ]);

    ensureSheet('Handovers', [
      'id','handoverNumber','projectId','orderId','customerId','projectName','deliverables','liveUrl','repositoryUrl','adminUrl','notes','warrantyUntil','status','sentAt','acceptedAt','createdAt','updatedAt'
    ]);

    return { success: true };
  });
  if (!result.success) throw new Error(result.error || 'Migrasi Stage 3 gagal');
  Logger.log('✅ Stage 3 workflow ready. Existing data preserved.');
}
