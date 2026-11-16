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
  'promo.shipping_banner',
] as const;

export const CONTENT_LIMITS = {
  MAX_KEYS_QUERY: 12,
  MAX_FAQS: 60,
  MAX_HOURS: 32,
  READ_TIMEOUT_MS: 5000,
} as const;

export const PAGE_METADATA = {
  ABOUT: {
    title: 'Tentang Oma | Resep Oma Kueh',
    description:
      'Kisah keluarga Resep Oma Kueh asal Surabaya, nilai brand, dan profil tim bakers–food scientist dengan konsep modern old-fashioned recipe.',
  },
  CONTACT: {
    title: 'Contact | Resep Oma Kueh',
    description:
      'Hubungi WhatsApp cabang Surabaya dan Bintaro, email resmi, Instagram, alamat terkonfirmasi, serta konsultasi custom cake dan bread bisnis.',
  },
  FAQ: {
    title: 'FAQ Pemesanan & Kelas | Resep Oma Kueh',
    description:
      'Pertanyaan umum mengenai konfirmasi pesanan via WhatsApp, ketersediaan stok cabang, penyimpanan produk, dan pendaftaran ROK Baking Class.',
  },
  PRIVACY: {
    title: 'Kebijakan Privasi | Resep Oma Kueh',
    description:
      'Penjelasan penyimpanan preferensi cabang dan keranjang lokal di browser, pemrosesan kutipan checkout sementara di server, dan handoff WhatsApp.',
  },
  ORDERING_POLICY: {
    title: 'Kebijakan Pemesanan | Resep Oma Kueh',
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
    text: 'Kue klasik dengan sentuhan modern dari dapur Surabaya & Bintaro. Konfirmasi pesanan melalui WhatsApp cabang resmi.',
  },
  LEGAL_PRIVACY: {
    title: 'Kebijakan Privasi',
    body: 'Untuk menjaga kenyamanan Anda selama menjelajahi katalog, Resep Oma Kueh hanya menyimpan pilihan cabang serta daftar item keranjang belanja Anda di penyimpanan peramban (localStorage) perangkat Anda—tanpa menyimpan kata sandi, akun, maupun data pembayaran.\n\nSaat Anda melanjutkan ke halaman checkout atau memeriksa estimasi pesanan, data permintaan diproses sementara (transient) di server kami semata-mata untuk memastikan harga cabang terbaru dan menyusun draf pesan pesanan, tanpa mencatat riwayat transaksi ataupun mengurangi stok secara otomatis.\n\nPengiriman pesanan ke WhatsApp hanya terjadi atas tindakan langsung Anda ketika membuka tautan wa.me ke admin cabang pilihan Anda, sehingga percakapan selanjutnya mengikuti kebijakan privasi layanan WhatsApp. Apabila asisten Ask Oma digunakan, hanya pertanyaan Anda dan informasi katalog publik yang diproses untuk menjawab kebutuhan Anda.',
  },
  LEGAL_ORDERING_POLICY: {
    title: 'Kebijakan Pemesanan',
    body: 'Seluruh pesanan melalui situs Resep Oma Kueh diteruskan ke WhatsApp admin cabang terpilih (Surabaya atau Bintaro) untuk konfirmasi manual.\n\nKetersediaan stok aktual, jadwal produksi atau pengambilan, ongkos kirim, metode pembayaran, serta total pembayaran akhir akan dikonfirmasi langsung oleh admin cabang melalui WhatsApp sebelum pembayaran dilakukan. Situs ini tidak memproses pembayaran otomatis dan tidak menerbitkan status pesanan real-time.\n\nKetentuan batas waktu pemesanan (cutoff time), minimum order khusus, pembatalan, pengembalian dana (refund), maupun penjadwalan ulang (reschedule) yang belum dipublikasikan secara resmi masih menunggu persetujuan owner dan dikonfirmasi langsung bersama admin cabang.',
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
  CONTACT_B2B_BRANCH_LABEL: 'Cabang tujuan konsultasi',
  CONTACT_B2B_TOPIC_LABEL: 'Kebutuhan diskusi bisnis',
  CONTACT_B2B_TOPIC_PLACEHOLDER:
    'Contoh: suplai kue kafe, hampers perusahaan, atau sajian rapat',
  CONTACT_B2B_NOTE:
    'Pesan langsung diteruskan ke WhatsApp admin cabang tanpa menyimpan data Anda di situs.',
  CONTACT_B2B_CTA_PREFIX: 'Konsultasi Bisnis via WhatsApp',
  FAQ_HEADING: 'Pertanyaan yang Sering Diajukan (FAQ)',
  FAQ_SUBTITLE:
    'Informasi faktual mengenai alur pemesanan WhatsApp, konfirmasi stok cabang, dan pendaftaran kelas.',
  FAQ_EMPTY_TITLE: 'Belum ada FAQ tambahan yang dipublikasikan',
  FAQ_EMPTY_BODY:
    'Pertanyaan mengenai kebijakan refund, pembatalan, dan batas waktu pemesanan (cutoff) masih ditahan sebagai draft hingga disetujui owner. Silakan merujuk pada panduan faktual di bawah atau hubungi WhatsApp cabang.',
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
  PRIVACY_SUBTITLE:
    'Penjelasan singkat mengenai penyimpanan preferensi belanja di perangkat Anda dan cara pesanan diteruskan ke cabang kami.',
  PRIVACY_FACTS_TITLE: 'Bagaimana Data Anda Dikelola',
  PRIVACY_FACTS: [
    {
      id: 'privacy-local-storage',
      title: 'Penyimpanan Lokal di Browser',
      detail:
        'Browser hanya menyimpan pilihan cabang serta daftar item dan jumlah keranjang Anda di localStorage agar tidak hilang saat berpindah halaman. Tidak ada kata sandi, token autentikasi, atau data sensitif yang disimpan.',
    },
    {
      id: 'privacy-transient-server',
      title: 'Pemrosesan Sementara di Server',
      detail:
        'Saat Anda memeriksa estimasi checkout atau menggunakan fitur interaksi situs, permintaan Anda diproses sementara di server untuk memastikan harga cabang terbaru dan menyusun draf pesan, tanpa mencatat riwayat transaksi maupun mengurangi stok secara otomatis.',
    },
    {
      id: 'privacy-whatsapp-handoff',
      title: 'Konfirmasi Langsung via WhatsApp',
      detail:
        'Pesan pesanan maupun konsultasi baru terkirim ke admin cabang Surabaya atau Bintaro saat Anda membuka tautan WhatsApp (wa.me). Percakapan di aplikasi WhatsApp sepenuhnya mengikuti kebijakan privasi WhatsApp/Meta.',
    },
    {
      id: 'privacy-optional-provider',
      title: 'Asisten Tanya Jawab Ask Oma',
      detail:
        'Jika asisten Ask Oma diaktifkan, hanya pertanyaan yang Anda ketikkan dan informasi katalog publik yang diproses sementara untuk membantu menjawab pertanyaan seputar produk dan jam operasional cabang.',
    },
  ],
  POLICY_SUBTITLE:
    'Panduan proses pemesanan, konfirmasi manual via WhatsApp admin cabang, serta ketentuan layanan Resep Oma Kueh.',
  POLICY_FACTS_TITLE: 'Ketentuan Pemesanan & Status Persetujuan',
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
