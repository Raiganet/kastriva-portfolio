/**
 * Konten tambahan website (FAQ & Testimonials)
 * Nantinya dapat diambil dari Google Sheets via CMS (Phase opsional)
 */

export interface Testimonial {
  name: string;
  business: string;
  message: string;
  rating: number;
}

export interface FAQItem {
  q: string;
  a: string;
}

/**
 * JANGAN mengisi testimonial palsu.
 * Biarkan kosong sampai ada testimonial asli dari customer.
 */
export const testimonials: Testimonial[] = [];

export const faq: FAQItem[] = [
  {
    q: "Berapa lama pengerjaan website?",
    a: "Tergantung kompleksitas. Landing page biasanya 3-7 hari, company profile 1-2 minggu, dan web application custom 1-3 bulan.",
  },
  {
    q: "Apakah bisa request desain?",
    a: "Tentu. Anda bisa memberikan referensi desain, atau kami akan membuatkan desain UI/UX custom yang sesuai dengan brand Anda.",
  },
  {
    q: "Apakah website responsive?",
    a: "Ya, semua website yang kami buat dijamin responsive dan optimal di desktop, tablet, maupun mobile.",
  },
  {
    q: "Apakah bisa menggunakan domain sendiri?",
    a: "Bisa. Kami akan membantu proses konfigurasi domain dan hosting Anda sampai website online.",
  },
  {
    q: "Apakah bisa dibuatkan admin dashboard?",
    a: "Bisa. Website company profile, toko online, maupun sistem informasi dapat dilengkapi dashboard admin untuk mengelola konten.",
  },
  {
    q: "Apakah website bisa dikembangkan lagi?",
    a: "Sangat bisa. Kode ditulis dengan struktur rapi dan modular sehingga mudah ditambah fitur di kemudian hari.",
  },
  {
    q: "Apakah tersedia maintenance?",
    a: "Ya, kami menyediakan paket maintenance untuk update keamanan, perbaikan bug, dan penambahan fitur setelah project selesai.",
  },
  {
    q: "Bagaimana cara melakukan pemesanan?",
    a: "Isi form di halaman Mulai Project, atau klik tombol WhatsApp. Anda akan mendapat nomor order untuk konsultasi dan tracking.",
  },
  {
    q: "Apakah bisa konsultasi terlebih dahulu?",
    a: "Tentu, konsultasi awal gratis tanpa komitmen. Kami akan membantu menentukan solusi yang paling sesuai dengan kebutuhan dan budget Anda.",
  },
];
