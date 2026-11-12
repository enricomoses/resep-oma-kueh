export const PUBLIC_CMS_KEYS = [
  'business.contacts',
  'home.hero',
  'home.story',
  'home.class_promo',
  'home.custom_business',
  'about.story',
  'about.values',
  'footer.note',
  'legal.privacy',
  'legal.ordering_policy',
  'community.instagram',
] as const;

export const CONTENT_LIMITS = {
  MAX_KEYS_QUERY: 12,
  MAX_FAQS: 60,
  MAX_HOURS: 32,
  READ_TIMEOUT_MS: 5000,
} as const;

export const PAGE_METADATA = {
  ABOUT: {
    title: 'Tentang Oma — Resep Oma Kueh',
    description:
      'Kisah keluarga Resep Oma Kueh asal Surabaya, nilai brand, dan profil tim bakers–food scientist dengan konsep modern old-fashioned recipe.',
  },
  CONTACT: {
    title: 'Kontak & Konsultasi Bisnis — Resep Oma Kueh',
    description:
      'Hubungi WhatsApp cabang Surabaya dan Bintaro, email resmi, Instagram, alamat terkonfirmasi, serta konsultasi custom cake dan bread bisnis.',
  },
  FAQ: {
    title: 'FAQ Pemesanan & Kelas — Resep Oma Kueh',
    description:
      'Pertanyaan umum mengenai konfirmasi pesanan via WhatsApp, ketersediaan stok cabang, penyimpanan produk, dan pendaftaran ROK Baking Class.',
  },
  PRIVACY: {
    title: 'Kebijakan Privasi — Resep Oma Kueh',
    description:
      'Penjelasan penyimpanan preferensi cabang dan keranjang lokal di browser, pemrosesan kutipan checkout sementara di server, dan handoff WhatsApp.',
  },
  ORDERING_POLICY: {
    title: 'Kebijakan Pemesanan — Resep Oma Kueh',
    description:
      'Ketentuan konfirmasi manual stok, ongkos kirim, metode pembayaran, dan total akhir melalui admin WhatsApp cabang Resep Oma Kueh.',
  },
} as const;

export const CONTENT_DEFAULTS = {
  ABOUT_STORY: {
    title: 'Resep Oma Kueh',
    body: 'Resep Oma Kueh adalah usaha kuliner keluarga asal Surabaya di bidang kue dan roti dengan konsep modern old-fashioned recipe yang menghadirkan kehangatan rumah di setiap sajian.',
  },
  ABOUT_VALUES: [
    'Authenticity',
    'Craftsmanship',
    'Warmth',
    'Quality',
    'Tradition',
  ] as const,
  CUSTOM_BUSINESS: {
    title: 'Made for Your Business',
    body: 'Tim Resep Oma Kueh terbuka untuk diskusi custom cake dan bread sesuai kebutuhan kafe, hampers, atau acara bisnis melalui WhatsApp cabang pilihan.',
  },
  FOOTER_NOTE: {
    text: 'Data demo — bukan katalog pemesanan aktif.',
  },
  LEGAL_PRIVACY: {
    title: 'Kebijakan Privasi',
    body: 'Preferensi cabang (selectedBranchId) dan daftar item keranjang tamu (ID varian/produk serta kuantitas) disimpan secara lokal di browser (localStorage) tanpa menyimpan token autentikasi atau data sensitif. Saat Anda menyiapkan checkout atau menggunakan fitur interaksi situs, permintaan kutipan harga/keranjang diproses sementara (transient) di server aplikasi untuk memverifikasi harga cabang dan menyusun pesan pesanan, tanpa menyimpan riwayat transaksi atau mengurangi stok secara otomatis. Pengiriman pesanan ke WhatsApp hanya terjadi atas tindakan langsung Anda ketika membuka tautan wa.me ke nomor cabang terpilih dan selanjutnya tunduk pada kebijakan privasi layanan WhatsApp. Apabila fitur asisten Ask Oma diaktifkan melalui penyedia AI eksternal, hanya pertanyaan yang Anda kirimkan dan konteks katalog publik yang diproses sesuai konfigurasi layanan.',
  },
  LEGAL_ORDERING_POLICY: {
    title: 'Kebijakan Pemesanan',
    body: 'Seluruh pesanan melalui situs Resep Oma Kueh diteruskan ke WhatsApp admin cabang terpilih (Surabaya atau Bintaro) untuk konfirmasi manual. Ketersediaan stok aktual, jadwal produksi/pengambilan, ongkos kirim, metode pembayaran, dan total pembayaran akhir dikonfirmasi langsung oleh admin cabang melalui WhatsApp sebelum pembayaran dilakukan. Situs ini tidak memproses pembayaran otomatis dan tidak menerbitkan status pesanan real-time. Ketentuan batas waktu pemesanan (cutoff time), minimum order khusus, pembatalan, pengembalian dana (refund), maupun penjadwalan ulang (reschedule) yang belum dipublikasikan secara resmi masih menunggu persetujuan owner dan dikonfirmasi langsung bersama admin cabang.',
  },
} as const;

export const CONTENT_COPY = {
  SOURCE_PUBLISHED_BADGE: 'Konten Dipublikasikan Owner',
  SOURCE_TEMPLATE_BADGE: 'Naskah Template · Menunggu Persetujuan Owner',
  SOURCE_TEMPLATE_NOTE:
    'Naskah pada bagian ini masih berstatus template/draft awal sesuai dokumen produk dan menunggu persetujuan publikasi dari owner melalui CMS.',
  RETRY_BUTTON: 'Muat ulang konten',
  UPSTREAM_ERROR_TITLE: 'Layanan data sedang bermasalah',
  UPSTREAM_ERROR_BODY:
    'Sebagian data dari server belum dapat dimuat saat ini. Anda tetap dapat membaca informasi terkonfirmasi atau mencoba memuat ulang.',
  ABOUT_EYEBROW: 'Tentang Kami',
  ABOUT_TEAM_BADGE: 'Profil Dapur · Menunggu Review Owner',
  ABOUT_TEAM_TITLE: 'Bakers & Food Scientist di Dapur Oma',
  ABOUT_TEAM_BODY:
    'Berdasarkan company profile Resep Oma Kueh, tim dapur memadukan pengalaman bakers dan pendekatan food scientist dalam menjaga tekstur serta rasa kue dan roti bergaya modern old-fashioned recipe.',
  ABOUT_TEAM_DISCLAIMER:
    'Catatan transparan: deskripsi profil tim ini bukan klaim sertifikasi medis, gelar akademik spesifik, jaminan bebas alergen universal, maupun klaim kesehatan untuk seluruh produk. Informasi diet dan alergen hanya berlaku per varian yang telah terverifikasi.',
  ABOUT_VALUES_TITLE: 'Nilai Utama Resep Oma Kueh',
  ABOUT_VALUES_SUBTITLE:
    'Lima nilai dari proposal brand yang menjadi pegangan dalam menyiapkan kue, roti, dan layanan di setiap cabang.',
  ABOUT_VALUE_DESCRIPTIONS: {
    Authenticity:
      'Menjaga karakter rasa autentik dari resep keluarga yang jujur dan konsisten.',
    Craftsmanship:
      'Perhatian pada teknik pemanggangan, tekstur adonan, dan detail penyajian.',
    Warmth:
      'Menghadirkan suasana hangat layaknya sajian dari dapur rumah untuk keluarga.',
    Quality:
      'Pemilihan bahan yang terukur demi menjaga mutu rasa di setiap batch produksi.',
    Tradition:
      'Merawat warisan kue dan roti klasik dalam sentuhan penyajian masa kini.',
  },
  ABOUT_EXPLORE_MENU_CTA: 'Telusuri Menu Kue & Roti',
  ABOUT_JOIN_CLASS_CTA: 'Lihat ROK Baking Class',
  ABOUT_CONTACT_CTA: 'Hubungi Cabang Kami',
  CONTACT_EYEBROW: 'Kontak & Cabang',
  CONTACT_HEADING: 'Hubungi Resep Oma Kueh',
  CONTACT_SUBTITLE:
    'Pemesanan produk, pengecekan stok harian, dan pertanyaan jadwal kelas dilayani langsung melalui WhatsApp masing-masing cabang.',
  CONTACT_BRANCHES_TITLE: 'Kontak Cabang Resmi',
  CONTACT_SURABAYA_DESC:
    'Cabang utama Surabaya untuk pemesanan kue, roti, paket Chiffon Mix, dan informasi Baking Class.',
  CONTACT_BINTARO_DESC:
    'Cabang Bintaro untuk pemesanan area Tangerang Selatan/Jakarta sekitarnya melalui konfirmasi WhatsApp admin.',
  CONTACT_WA_CTA_PREFIX: 'Chat WhatsApp',
  CONTACT_ADDRESS_LABEL: 'Alamat Cabang',
  CONTACT_ADDRESS_PENDING:
    'Alamat lengkap cabang Bintaro belum dikonfirmasi untuk publikasi. Silakan hubungi WhatsApp admin Bintaro.',
  CONTACT_MAPS_LABEL: 'Tautan Peta',
  CONTACT_MAPS_CTA: 'Buka Lokasi di Google Maps',
  CONTACT_MAPS_PENDING:
    'Tautan Google Maps terverifikasi belum tersedia; minta titik lokasi melalui WhatsApp cabang.',
  CONTACT_HOURS_LABEL: 'Jam Operasional',
  CONTACT_HOURS_PENDING:
    'Jam operasional harian belum dipublikasikan; konfirmasi waktu layanan melalui WhatsApp cabang.',
  CONTACT_OFFICIAL_CHANNELS_TITLE: 'Kanal Resmi Lainnya',
  CONTACT_EMAIL_LABEL: 'Email Resmi',
  CONTACT_INSTAGRAM_LABEL: 'Instagram Resmi',
  CONTACT_B2B_BADGE: 'Konsultasi B2B & Custom',
  CONTACT_B2B_BRANCH_LABEL: 'Pilih cabang tujuan konsultasi B2B',
  CONTACT_B2B_TOPIC_LABEL: 'Kebutuhan diskusi bisnis (opsional)',
  CONTACT_B2B_TOPIC_PLACEHOLDER:
    'Contoh: suplai kue untuk kafe, hampers perusahaan, atau sajian rapat',
  CONTACT_B2B_NOTE:
    'Tautan ini membuka diskusi langsung di WhatsApp cabang terpilih tanpa menyimpan data prospek (leads) di database dan tanpa mengarang estimasi harga atau minimum order (MOQ).',
  CONTACT_B2B_CTA_PREFIX: 'Konsultasi Bisnis via WhatsApp',
  FAQ_EYEBROW: 'Pusat Bantuan',
  FAQ_HEADING: 'Pertanyaan yang Sering Diajukan (FAQ)',
  FAQ_SUBTITLE:
    'Informasi faktual mengenai alur pemesanan WhatsApp, konfirmasi stok cabang, dan pendaftaran kelas.',
  FAQ_DB_SECTION_TITLE: 'FAQ Terpublikasi',
  FAQ_EMPTY_TITLE: 'Belum ada FAQ tambahan yang dipublikasikan',
  FAQ_EMPTY_BODY:
    'Pertanyaan mengenai kebijakan refund, pembatalan, dan batas waktu pemesanan (cutoff) masih ditahan sebagai draft hingga disetujui owner. Silakan merujuk pada panduan faktual di bawah atau hubungi WhatsApp cabang.',
  FAQ_BASELINE_BADGE: 'Panduan Faktual Sistem',
  FAQ_BASELINE_TITLE: 'Informasi Dasar Pemesanan & Layanan',
  FAQ_BASELINE_NOTICE:
    'Ketentuan pengembalian dana (refund), penjadwalan ulang, dan jam cutoff pemesanan belum disetujui untuk publikasi umum dan masih berstatus draft.',
  FAQ_BASELINE_ITEMS: [
    {
      id: 'faq-baseline-wa-checkout',
      category: 'Pemesanan & Pembayaran',
      question: 'Bagaimana alur pemesanan dan pembayaran di Resep Oma Kueh?',
      answer:
        'Situs ini membantu Anda memilih cabang, menyusun daftar produk, dan menyiapkan ringkasan pesanan untuk dikirimkan ke WhatsApp admin cabang (Surabaya atau Bintaro). Situs tidak memproses pembayaran otomatis; instruksi pembayaran dan total akhir diberikan secara manual oleh admin melalui WhatsApp.',
    },
    {
      id: 'faq-baseline-stock-branch',
      category: 'Stok & Cabang',
      question:
        'Apakah harga dan ketersediaan stok di situs bersifat real-time?',
      answer:
        'Harga dan status ketersediaan mengikuti cabang yang Anda pilih, namun ketersediaan stok akhir, jadwal produksi, serta ongkos kirim tetap dikonfirmasi ulang oleh admin cabang saat Anda menghubungi WhatsApp.',
    },
    {
      id: 'faq-baseline-baking-class',
      category: 'ROK Baking Class',
      question: 'Bagaimana cara mendaftar sesi ROK Baking Class?',
      answer:
        'Anda dapat melihat program dan sesi kelas mendatang pada halaman Baking Class sesuai cabang, lalu melanjutkan pendaftaran dan konfirmasi ketersediaan kursi langsung melalui WhatsApp admin cabang penyelenggara.',
    },
  ],
  PRIVACY_EYEBROW: 'Informasi Privasi & Data',
  PRIVACY_FACTS_TITLE: 'Ringkasan Pemrosesan Data Teknis',
  PRIVACY_FACTS: [
    {
      id: 'privacy-local-storage',
      title: 'Penyimpanan Browser (localStorage)',
      detail:
        'Browser hanya menyimpan ID cabang terpilih (selectedBranchId) serta ID item dan kuantitas keranjang tamu agar pilihan Anda tidak hilang saat berpindah halaman. Tidak ada token rahasia atau kredensial admin yang disimpan di localStorage.',
    },
    {
      id: 'privacy-transient-server',
      title: 'Pemrosesan Sementara (Transient) di Server',
      detail:
        'Situs ini TIDAK mengklaim bahwa tidak ada data yang dikirim ke server. Saat Anda meminta perhitungan harga checkout atau berinteraksi dengan layanan BFF situs, data permintaan diproses secara sementara di server untuk memvalidasi harga cabang dan menghasilkan tautan pesan, tanpa menulis tabel pesanan atau riwayat transaksi pelanggan.',
    },
    {
      id: 'privacy-whatsapp-handoff',
      title: 'Handoff ke WhatsApp atas Inisiatif Pengguna',
      detail:
        'Pengiriman pesan pesanan atau konsultasi ke WhatsApp hanya terjadi ketika Anda menekan tautan wa.me ke cabang Surabaya atau Bintaro. Percakapan di dalam aplikasi WhatsApp tunduk pada kebijakan privasi WhatsApp/Meta.',
    },
    {
      id: 'privacy-optional-provider',
      title: 'Penyedia AI Opsional (Ask Oma)',
      detail:
        'Apabila fitur asisten Ask Oma diaktifkan dengan penyedia model bahasa eksternal, isi pertanyaan yang Anda ketikkan dikirim secara sementara untuk menghasilkan jawaban berbasis data katalog publik tanpa akses ke kredensial admin.',
    },
  ],
  POLICY_EYEBROW: 'Ketentuan Layanan',
  POLICY_FACTS_TITLE: 'Ketentuan Faktual Pemesanan & Status Persetujuan',
  POLICY_FACTS: [
    {
      id: 'policy-manual-wa',
      title: 'Konfirmasi Manual via WhatsApp Cabang',
      detail:
        'Setiap pesanan produk reguler, paket Chiffon Mix, maupun konsultasi custom dikonfirmasi secara manual oleh admin cabang Surabaya atau Bintaro melalui WhatsApp.',
    },
    {
      id: 'policy-stock-shipping-payment',
      title: 'Stok, Ongkos Kirim, dan Pembayaran Akhir',
      detail:
        'Ketersediaan stok harian, biaya pengiriman ke alamat tujuan, metode pembayaran yang tersedia, dan nominal total akhir ditetapkan setelah verifikasi admin cabang.',
    },
    {
      id: 'policy-pending-rules',
      title:
        'Kebijakan Refund, Reschedule & Cutoff (Menunggu Persetujuan Owner)',
      detail:
        'Aturan baku mengenai batas jam pemesanan harian (cutoff), minimum pemesanan khusus, pembatalan, refund, dan penjadwalan ulang belum dipublikasikan dan masih berstatus draft menunggu persetujuan owner.',
    },
  ],
} as const;
