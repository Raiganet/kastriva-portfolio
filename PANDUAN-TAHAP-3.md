# Kastriva Portfolio — Tahap 3

## Fokus
Tahap ini menyempurnakan workflow setelah order masuk: **Penawaran → Invoice → Revisi → Serah Terima**.

## Fitur baru

### 1. Penawaran / Quotation
- Total dihitung ulang di server.
- Satu quotation aktif per order untuk mencegah duplikasi tidak sengaja.
- Kuota revisi disimpan di quotation.
- Ketentuan pembayaran disimpan terpisah.
- Customer dapat memberi catatan saat menyetujui atau menolak.
- Penawaran yang melewati `validUntil` otomatis tampil **Kedaluwarsa** dan tidak dapat disetujui lagi.
- Jika disetujui, order menjadi `Approved`; jika ditolak, kembali ke `Discussing`.

### 2. Invoice
- Invoice hanya dibuat dari quotation berstatus `approved`.
- Nominal invoice mengambil angka quotation server-side sehingga total tidak berbeda.
- Status: `Unpaid`, `Partial`, `Paid`, `Cancelled`; tampilan `Overdue` dihitung otomatis dari jatuh tempo.
- Menyimpan nominal yang sudah dibayar dan sisa tagihan.
- Email customer saat invoice diterbitkan dan saat status pembayaran diperbarui.

### 3. Revisi
- Customer mengajukan revisi dari Customer Dashboard.
- Kuota revisi mengikuti quotation approved.
- Admin mengubah status `Requested → In Progress → Resolved` atau `Rejected`.
- Project/order otomatis berstatus `Revision` selama masih ada revisi terbuka.
- Setelah seluruh revisi selesai, project kembali `In Progress`.

### 4. Serah Terima
- Admin mengirim deliverables, Live URL, Repository URL, Admin URL, catatan, dan periode garansi/support.
- Serah terima baru dapat dibuat setelah progress project minimal 90%.
- Serah terima ditolak sistem jika masih ada revisi terbuka.
- Customer harus menekan **Terima Serah Terima**.
- Setelah diterima, project + order otomatis `Completed` dan progress `100%`.
- Password, API key, private key, dan secret tidak boleh disimpan di data serah terima.

## Perubahan database — WAJIB
Tahap 3 menggunakan sheet/kolom tambahan, tetapi migrasinya **tidak menghapus data lama**.

1. Upload/copy seluruh file `.gs` terbaru ke project Google Apps Script.
2. Pastikan `Workflow.gs`, `Invoices.gs`, `Revisions.gs`, `Handovers.gs`, dan `SetupWorkflowStage3.gs` ikut ditambahkan.
3. Dari editor Apps Script pilih function `setupWorkflowStage3`.
4. Klik **Run** satu kali dan izinkan akses bila diminta.
5. Pastikan log menampilkan: `Stage 3 workflow ready`.
6. Deploy ulang Web App GAS menggunakan deployment terbaru.

`setupWorkflowStage3()` aman dijalankan ulang: sheet lama tidak dihapus dan kolom yang sudah ada tidak dibuat dua kali.

## Sheet yang digunakan
- `Quotations` ditambah: `revisionLimit`, `paymentTerms`, `customerNote`, `respondedAt`.
- `Invoices` ditambah: `quotationId`, `amountPaid`, `notes`, `paidAt`.
- Sheet baru `Revisions`.
- Sheet baru `Handovers`.

## Halaman Admin baru
- `/admin/invoices`
- `/admin/revisions`
- `/admin/handovers`

## Catatan penting
- Project sekarang hanya dapat dibuat setelah quotation disetujui customer.
- Progress manual admin dibatasi sampai 95%. Progress 100% diberikan otomatis setelah customer menerima serah terima.
- Invoice tidak memblokir mulai project secara otomatis, karena pola pembayaran bisa DP/termin/lunas sesuai kesepakatan.
