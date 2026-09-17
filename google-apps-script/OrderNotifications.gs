/** Persistent per-recipient outbox. Gmail delivery is not transactional with Sheets. */
const OrderNotifications = {
  claim: function() {
    return DataIntegrity.mutate(function() {
      const sheet = Config.getSheet('Orders'); const rows = sheet.getDataRange().getValues();
      const index = DataIntegrity.headers().indexOf('notifications');
      for (var i=1;i<rows.length;i++) {
        if (!rows[i][index]) continue; // Existing pre-migration orders are not emailed again.
        var jobs; try { jobs = JSON.parse(rows[i][index]); } catch(e) { continue; }
        for (var j=0;j<2;j++) {
          const recipient = j===0?'admin':'customer'; const job=jobs[recipient];
          if (!job) continue;
          if (job.state==='sending' && Date.now()-job.updatedAt>10*60000) {
            job.state='uncertain'; sheet.getRange(i+1,index+1).setValue(JSON.stringify(jobs));
            continue; // Do not blindly resend after a crash during delivery.
          }
          if (job.state!=='pending') continue;
          job.state='sending';job.attempts++;job.updatedAt=Date.now();job.claimId=Utilities.getUuid();
          sheet.getRange(i+1,index+1).setValue(JSON.stringify(jobs));
          SpreadsheetApp.flush();
          return { success:true, data:{ id:rows[i][0],orderNumber:rows[i][1],recipient:recipient,claimId:job.claimId,
            payload:{ name:rows[i][3],business:rows[i][4],email:rows[i][5],whatsapp:rows[i][6],type:rows[i][7],budget:rows[i][11],deadline:rows[i][12],description:rows[i][13],features:rows[i][14],reference:rows[i][15] } } };
        }
      }
      return {success:true};
    });
  },
  finish: function(work, success) {
    return DataIntegrity.mutate(function() {
      const sheet=Config.getSheet('Orders');const rows=sheet.getDataRange().getValues();const index=DataIntegrity.headers().indexOf('notifications');
      for(var i=1;i<rows.length;i++) if(rows[i][0]===work.id) {
        const jobs=JSON.parse(rows[i][index]);const job=jobs[work.recipient];
        if(job.state!=='sending' || job.claimId!==work.claimId) return {success:false};
        job.state=success?'sent':'failed';job.updatedAt=Date.now();
        sheet.getRange(i+1,index+1).setValue(JSON.stringify(jobs));return {success:true};
      }
      return {success:false};
    });
  }
};
function processOrderNotificationsStage2() {
  // At most 10 messages per run. Claims are persisted under lock, sends happen outside it.
  for(var count=0;count<10;count++) {
    const next=OrderNotifications.claim();if(!next.success || !next.data) return;
    const w=next.data;var sent=false;
    try {
      const r=w.recipient==='admin'?Orders.sendAdminNotification(w.orderNumber,w.payload):Orders.sendConfirmationEmail(w.orderNumber,w.payload);
      sent=!!(r && r.success);
    } catch(e) { Logger.log('Order notification delivery failed'); }
    OrderNotifications.finish(w,sent);
  }
}

/** Manual recovery only after checking Gmail Sent. Not exposed through Router. */
function retryOrderNotificationStage2(orderNumber, recipient) {
  if (!/^KAS-\d{4}-\d{4,}$/.test(String(orderNumber)) || ['admin','customer'].indexOf(recipient)<0) throw new Error('Provide exact order number and admin/customer recipient.');
  return DataIntegrity.mutate(function() {
    const sheet=Config.getSheet('Orders');const rows=sheet.getDataRange().getValues();const index=DataIntegrity.headers().indexOf('notifications');
    for(var i=1;i<rows.length;i++) if(rows[i][1]===orderNumber) {
      const jobs=JSON.parse(rows[i][index] || '{}');const job=jobs[recipient];
      if(!job || ['failed','uncertain'].indexOf(job.state)<0) return {success:false,error:'Only failed or uncertain notifications may be retried.'};
      job.state='pending';job.updatedAt=Date.now();
      sheet.getRange(i+1,index+1).setValue(JSON.stringify(jobs));
      Utils.logAudit('order_email_manual_retry','admin',{orderNumber:orderNumber,recipient:recipient});
      return {success:true};
    }
    return {success:false,error:'Order not found'};
  });
}
