# Portfolio CMS — Source of Truth

Mulai versi ini, halaman **Admin > Portfolio CMS** selalu menampilkan seluruh portfolio bawaan dari `data/projects.ts`, walaupun koleksi Firestore `portfolio` masih kosong.

## Alur awal setelah deploy
1. Login Admin.
2. Buka **Portfolio CMS**.
3. Pastikan project bawaan tampil dengan badge **Bawaan**.
4. Klik **Sinkronkan ke CMS** satu kali untuk menyimpan project bawaan yang belum ada ke Firebase.
5. Setelah sinkron, badge berubah menjadi **CMS**.

## Setelah sinkron
Gunakan Portfolio CMS untuk perubahan berikut:
- judul dan kategori;
- deskripsi dan deskripsi pendek;
- thumbnail/gambar utama;
- gallery;
- teknologi;
- URL demo/GitHub;
- tahun/status;
- masalah, solusi, fitur, peran;
- featured/published;
- urutan tampilan.

Data CMS/Firebase selalu mengalahkan data fallback di source code. Dengan demikian perubahan tidak perlu lagi dilakukan di `data/projects.ts` untuk pekerjaan normal sehari-hari.

## Project bawaan
Project bawaan tetap menjadi fallback jika Firestore belum tersedia. Menghapus project bawaan melalui CMS membuat tombstone di Firebase agar project tersebut tidak muncul kembali dari fallback.
