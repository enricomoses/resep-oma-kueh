export const CHAT_LIMITS = {
  MAX_REQUEST_BYTES: 16 * 1024,
  MAX_MESSAGE_LENGTH: 1000,
  MAX_HISTORY_ENTRIES: 8,
  MAX_ANSWER_LENGTH: 4000,
  MAX_ITEMS: 10,
  MAX_SEARCH_CHARS: 100,
  QUERY_DEADLINE_MS: 5_000,
  TOTAL_CHAT_DEADLINE_MS: 15_000,
  GENERATIVE_PLANNER_TIMEOUT_MS: 4_500,
  GENERATIVE_COMPOSER_TIMEOUT_MS: 6_500,
  GENERATIVE_MAX_OUTPUT_TOKENS: 1024,
  GENERATIVE_DEFAULT_RPM_LIMIT: 10,
  GENERATIVE_DEFAULT_GLOBAL_RPM_LIMIT: 30,
  GENERATIVE_DEFAULT_MAX_CONCURRENCY: 5,
  LIMITER_STORE_TIMEOUT_MS: 2_500,
  LIMITER_RPM_TTL_SECONDS: 120,
  LIMITER_DAILY_TTL_SECONDS: 172_800,
  LIMITER_CONCURRENCY_TTL_SECONDS: 60,
  RATE_LIMIT_WINDOW_MS: 60_000,
  RATE_LIMIT_MAX_REQUESTS: 15,
  MAX_RATE_LIMIT_BUCKETS: 2048,
} as const;

export const CHAT_OPERATIONS = [
  'search_products',
  'recommend_by_budget',
  'get_product_detail',
  'get_active_promotions',
  'get_branches',
  'get_upcoming_classes',
  'search_faqs',
  'clarify',
  'refuse',
] as const;

export const CHAT_SOURCE_TYPES = [
  'catalog',
  'promotions',
  'branches',
  'classes',
  'faqs',
  'policy',
  'clarification',
] as const;

export const CHAT_QUICK_PROMPTS = [
  'Chiffon apa di bawah Rp 20.000?',
  'Ada promo aktif apa sekarang?',
  'Lokasi & WhatsApp cabang Surabaya dan Bintaro?',
  'Jadwal Baking Class terdekat kapan?',
  'Menu Gluten-Free yang sudah terverifikasi apa saja?',
  'Bagaimana cara pemesanan & konfirmasi stok?',
] as const;

export const CHAT_COPY = {
  TRIGGER_OPEN: 'Ask Oma',
  TRIGGER_CLOSE: 'Tutup Ask Oma',
  PANEL_LABEL: 'Asisten Katalog Ask Oma',
  MOBILE_TITLE: 'Ask Oma',
  MOBILE_DESCRIPTION:
    'Tanya produk, harga cabang, promo aktif, lokasi, jadwal kelas, atau FAQ.',
  SUBTITLE: 'Asisten katalog & FAQ resmi (hanya baca)',
  WELCOME:
    'Halo! Saya Ask Oma. Tanyakan tentang menu Resep Oma Kueh, rekomendasi budget, promo aktif, alamat & WhatsApp cabang, jadwal Baking Class, atau FAQ pemesanan.',
  COMPOSER_LABEL: 'Tulis pertanyaan Anda untuk Ask Oma',
  COMPOSER_PLACEHOLDER: 'Tanyakan Pertanyaan Anda disini...',
  COMPOSER_HINT: 'AI can make mistakes. Verify important information.',
  SEND_CTA: 'Kirim',
  SENDING_CTA: 'Memproses…',
  STOP_CTA: 'Hentikan',
  RESET_CTA: 'Reset chat',
  RETRY_CTA: 'Coba lagi',
  NO_BRANCH_BADGE: 'Belum pilih cabang',
  NO_BRANCH_NOTICE:
    'Cabang belum dipilih. Pilih cabang Surabaya atau Bintaro untuk melihat harga dan ketersediaan cabang.',
  BRANCH_PRICE_REQUIRED:
    'Untuk melihat harga pasti atau rekomendasi sesuai budget, silakan pilih cabang Surabaya atau Bintaro terlebih dahulu melalui pemilih cabang.',
  DEFAULT_CATALOG_NOTICE:
    'Harga berasal dari katalog cabang terpilih; ketersediaan stok akhir perlu dikonfirmasi admin via WhatsApp.',
  PROMO_NOTICE:
    'Promo aktif mengikuti tanggal dan jam Jakarta (WIB) saat ini pada cabang berlaku.',
  CLASSES_NOTICE:
    'Jadwal kelas menggunakan waktu Jakarta (WIB). Kuota dan pendaftaran final dikonfirmasi admin cabang via WhatsApp.',
  BRANCHES_NOTICE:
    'Alamat Bintaro dan jam operasional yang belum dikonfirmasi tetap mengikuti informasi admin cabang via WhatsApp.',
  FAQ_NOTICE: 'Jawaban merujuk pada FAQ terpublikasi Resep Oma Kueh.',
  CLARIFY_NOTICE:
    'Ask Oma menggunakan pencocokan katalog & FAQ deterministik (tanpa LLM). Pilih salah satu topik atau perjelas pertanyaan Anda.',
  GENERATIVE_QUOTA_FALLBACK_NOTICE:
    'Kuota asisten AI hari ini telah terpenuhi; jawaban disusun dari katalog & FAQ deterministik resmi.',
  GENERATIVE_FALLBACK_NOTICE:
    'Asisten katalog menampilkan ringkasan deterministik resmi setelah verifikasi data.',
  GENERATIVE_LIMITER_UNAVAILABLE_MESSAGE:
    'Layanan asisten AI sementara dinonaktifkan untuk menjaga kuota dan keamanan. Silakan gunakan pencarian katalog atau hubungi admin cabang via WhatsApp.',
  REFUSE_NOTICE:
    'Ask Oma hanya melayani pencarian data publik (hanya-baca) tanpa akses transaksi, admin, atau perubahan database.',
  REFUSE_MESSAGE:
    'Maaf, Ask Oma hanya dapat membantu mencari informasi produk, harga katalog, promo aktif, lokasi cabang, jadwal Baking Class, dan FAQ publik (hanya-baca). Saya tidak dapat mengubah data/harga, mengakses akun admin, melacak status pesanan/pembayaran pribadi, atau membagikan resep dapur internal.',
  CLARIFY_MESSAGE:
    'Saya belum yakin maksud pertanyaan Anda. Coba sebutkan nama produk, budget (mis. "di bawah 25 ribu"), kategori diet terverifikasi, promo aktif, lokasi cabang, jadwal Baking Class, atau pilih pertanyaan cepat berikut.',
  OUTAGE_MESSAGE:
    'Layanan data Ask Oma sedang mengalami gangguan sementara. Silakan coba lagi atau hubungi admin cabang langsung melalui WhatsApp.',
  TIMEOUT_MESSAGE:
    'Permintaan Ask Oma melebihi batas waktu. Coba perpendek pertanyaan atau hubungi admin cabang via WhatsApp.',
  RATE_LIMIT_MESSAGE:
    'Terlalu banyak pertanyaan dalam waktu singkat. Mohon tunggu sebentar lalu kirim ulang.',
  CANCELED_NOTE: 'Permintaan sebelumnya dihentikan.',
  BRANCH_CHANGED_NOTICE: (branchLabel: string) =>
    `Cabang beralih ke ${branchLabel}. Konteks percakapan cabang sebelumnya dibersihkan agar harga tetap akurat.`,
  BRANCH_CLEARED_NOTICE:
    'Pilihan cabang dihapus. Konteks percakapan cabang sebelumnya dibersihkan.',
} as const;
