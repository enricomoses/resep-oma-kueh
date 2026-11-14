export const HOME_LIMITS = {
  SERIES: 16,
  FEATURED: 8,
  PROMOTIONS: 8,
  CLASSES: 6,
  TESTIMONIALS: 6,
  CONTENT_KEYS: 8,
  READ_TIMEOUT_MS: 5000,
} as const;

export const HOME_SECTION_IDS = {
  HERO: 'home-hero',
  SERIES: 'home-series',
  FEATURED: 'home-featured',
  STORY: 'home-story',
  TREATS: 'home-treats',
  CLASSES: 'home-classes',
  TESTIMONIALS: 'home-testimonials',
  FIND_US: 'home-find-us',
  COMMUNITY: 'home-community',
} as const;

export const HOME_CMS_DEFAULTS = {
  HERO: {
    headline: 'A little taste of home, in every bite.',
    subcopy:
      'Resep klasik penuh kehangatan, dibuat untuk menemani momen manis bersama keluarga.',
    imageUrl: '/images/hero-bakery.webp',
    imageAlt: 'Koleksi kue dan roti hangat dari dapur Resep Oma Kueh.',
  },
  STORY: {
    title: 'Our Little Story',
    body: 'Resep Oma Kueh adalah bisnis keluarga asal Surabaya di bidang kuliner kue dan roti dengan konsep modern old-fashioned recipe yang menghadirkan kehangatan rumah di setiap gigitan.',
    imageUrl: '/images/story-kitchen.webp',
    imageAlt: 'Suasana dapur dan proses pembuatan kue Resep Oma Kueh.',
  },
  CUSTOM_BUSINESS: {
    title: 'Made for Your Business',
    body: 'Tim Resep Oma Kueh terbuka untuk diskusi custom cake dan bread sesuai kebutuhan kafe, hampers, atau acara bisnis melalui WhatsApp cabang pilihan.',
  },
  CLASS_PROMO: {
    title: 'Bake with Oma',
    body: 'ROK Baking Class menghadirkan sesi membuat kue dan roti secara langsung di cabang pilihan.',
  },
  INSTAGRAM: {
    url: 'https://www.instagram.com/resepoma.kueh/',
    handle: '@resepoma.kueh',
  },
} as const;

export const HOME_COPY = {
  HERO_EXPLORE_CTA: 'Explore Menu',
  HERO_CLASS_CTA: 'Join Baking Class',
  SERIES_TITLE: 'Shop by Series',
  SERIES_SUBTITLE:
    'Telusuri seri kue dan roti Resep Oma Kueh, dari Chiffon klasik hingga kreasi roti hangat.',
  SERIES_CTA: 'Lihat seri di Menu',
  SERIES_ALL_CTA: 'Lihat seluruh Menu',
  SERIES_EMPTY: 'Seri menu yang dipublikasikan belum tersedia saat ini.',
  SERIES_ERROR:
    'Daftar seri belum dapat dimuat saat ini. Silakan buka halaman Menu.',
  FEATURED_TITLE: 'Featured Bakes',
  FEATURED_SUBTITLE:
    'Pilihan kreasi unggulan dari dapur Resep Oma Kueh untuk momen hangat di rumah.',
  FEATURED_PRICE_NOTE:
    'Pilih cabang untuk melihat harga cabang final dan ketersediaan.',
  FEATURED_PRICE_FROM_PREFIX: 'Mulai dari',
  FEATURED_CTA: 'Lihat di Menu',
  FEATURED_ALL_CTA: 'Telusuri katalog Menu',
  FEATURED_EMPTY: 'Belum ada produk unggulan yang dipublikasikan saat ini.',
  FEATURED_ERROR:
    'Produk unggulan belum dapat dimuat saat ini. Silakan telusuri halaman Menu.',
  BADGE_FEATURED: 'Pilihan Oma',
  BADGE_BEST_SELLER: 'Best Seller',
  BADGE_NEW: 'Baru',
  BADGE_BUNDLE: 'Paket Mix',
  STORY_VALUES_LABEL: 'Nilai Dapur Oma',
  STORY_VALUES: [
    'Authenticity',
    'Craftsmanship',
    'Warmth',
    'Quality',
    'Tradition',
  ],
  STORY_CTA: 'Baca cerita lengkap',
  CUSTOM_BUSINESS_BADGE: 'B2B & Custom',
  CUSTOM_BUSINESS_CTA: 'Diskusi kebutuhan bisnis',
  TREATS_TITLE: 'Current Treats',
  TREATS_SUBTITLE:
    'Penawaran yang sedang berlangsung sesuai periode aktif dan cabang pilihan.',
  TREATS_BADGE: 'PENAWARAN AKTIF',
  TREATS_ALL_BRANCHES: 'Berlaku di seluruh cabang aktif',
  TREATS_SCOPED_BRANCH: 'Berlaku di cabang terpilih',
  TREATS_EMPTY: 'Belum ada promo aktif pada periode atau cabang ini.',
  TREATS_ERROR:
    'Informasi promo belum dapat dimuat saat ini. Tanyakan penawaran terkini melalui WhatsApp cabang.',
  CLASSES_SUBTITLE:
    'Jadwal kelas mendatang yang masih dibuka untuk pendaftaran.',
  CLASSES_CTA: 'Lihat halaman Baking Class',
  CLASSES_CONTACT_CTA: 'Tanyakan jadwal ke admin',
  CLASSES_EMPTY: 'Tunggu jadwal berikutnya',
  CLASSES_EMPTY_NOTE:
    'Belum ada sesi kelas mendatang yang terbuka pada pilihan cabang ini. Hubungi admin untuk info jadwal berikutnya.',
  CLASSES_ERROR:
    'Jadwal kelas belum dapat dimuat saat ini. Silakan hubungi admin cabang.',
  CLASSES_SEATS_PREFIX: 'Sisa kuota:',
  CLASSES_SEATS_OPEN: 'Pendaftaran dibuka',
  TESTIMONIALS_TITLE: 'What They Say',
  TESTIMONIALS_SUBTITLE:
    'Cerita pelanggan yang telah memberikan izin publikasi.',
  TESTIMONIALS_EMPTY:
    'Ulasan pelanggan hanya ditampilkan setelah persetujuan publikasi terverifikasi.',
  TESTIMONIALS_ERROR: 'Ulasan pelanggan belum dapat dimuat saat ini.',
  FIND_US_TITLE: 'Find Us',
  FIND_US_SUBTITLE:
    'Pilih cabang untuk melihat ketersediaan lokal atau hubungi admin cabang secara langsung melalui WhatsApp.',
  FIND_US_SELECT_CTA: 'Pilih cabang ini',
  FIND_US_SELECTED: 'Cabang aktif terpilih',
  FIND_US_ADDRESS_PENDING:
    'Alamat cabang belum dikonfirmasi; konfirmasi langsung melalui WhatsApp cabang.',
  FIND_US_MAPS_CTA: 'Buka Google Maps',
  FIND_US_HOURS_PENDING: 'Jam operasional dikonfirmasi melalui WhatsApp admin.',
  COMMUNITY_TITLE: 'Instagram & Community',
  COMMUNITY_SUBTITLE:
    'Ikuti kabar terbaru dari dapur Resep Oma Kueh melalui kanal Instagram resmi.',
  COMMUNITY_CTA: 'Kunjungi @resepoma.kueh di Instagram',
  COMMUNITY_CARDS: [
    {
      id: 'community-demo-1',
      imageUrl: '/images/community-1.webp',
      label: 'Chiffon & Kue Klasik',
      caption:
        'Ruang kurasi foto komunitas resmi. Tidak mengambil feed otomatis tanpa izin.',
    },
    {
      id: 'community-demo-2',
      imageUrl: '/images/community-2.webp',
      label: 'Roti Hangat & Seri Baru',
      caption: 'Dokumentasi produk asli diunggah melalui media terverifikasi.',
    },
    {
      id: 'community-demo-3',
      imageUrl: '/images/community-3.webp',
      label: 'Momen ROK Baking Class',
      caption:
        'Foto kegiatan kelas hanya dipublikasikan dengan persetujuan peserta.',
    },
  ],
} as const;
