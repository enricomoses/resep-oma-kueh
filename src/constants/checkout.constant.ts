export const CHECKOUT_LIMITS = {
  MAX_REQUEST_BYTES: 32 * 1024, // 32 KiB (§8.1 / §15.5)
  MAX_DISTINCT_LINES: 15,
  MAX_QTY_PER_LINE: 99,
  MAX_OPTIONS_PER_LINE: 12,
  MIN_CUSTOMER_NAME_LENGTH: 2,
  MAX_CUSTOMER_NAME_LENGTH: 80,
  MIN_ADDRESS_LENGTH: 5,
  MAX_ADDRESS_LENGTH: 500,
  MAX_NOTE_LENGTH: 500,
  MAX_TIME_WINDOW_LENGTH: 100,
  MAX_URL_LENGTH: 4000, // §27.3 UX limit for WhatsApp URL fallback
  QUOTE_TTL_MS: 5 * 60 * 1000, // 5 minutes TTL
  MAX_DAYS_IN_ADVANCE: 90, // Real Jakarta calendar date bound (§27.3)
} as const;

export const FULFILLMENT_METHODS = ['delivery', 'pickup'] as const;

export const CHECKOUT_WARNING_CODES = {
  MANUAL_CONFIRMATION_REQUIRED: 'MANUAL_CONFIRMATION_REQUIRED',
  PRICE_CHANGED: 'PRICE_CHANGED',
  UNCONFIRMED_STOCK: 'UNCONFIRMED_STOCK',
} as const;

export const CHECKOUT_COPY = {
  PAGE_TITLE: 'Checkout via WhatsApp',
  PAGE_DESCRIPTION:
    'Tinjau estimasi pesanan Anda dan lanjutkan konfirmasi dengan admin cabang Resep Oma Kueh melalui WhatsApp.',
  FORM_SECTION_TITLE: 'Data Pemesan & Pengiriman',
  FORM_SECTION_DESC:
    'Data pemesan hanya digunakan sementara untuk menyusun pesan WhatsApp dan tidak disimpan di perangkat Anda.',
  FIELD_CUSTOMER_NAME_LABEL: 'Nama Pemesan',
  FIELD_CUSTOMER_NAME_PLACEHOLDER: 'Contoh: Ibu Ratna',
  FIELD_CUSTOMER_NAME_HELPER: 'Masukkan 2 hingga 80 karakter.',
  FIELD_METHOD_LABEL: 'Metode Penerimaan',
  FIELD_DATE_LABEL: 'Tanggal Diinginkan',
  FIELD_DATE_HELPER: 'Pilih tanggal hari ini hingga 90 hari ke depan (WIB).',
  FIELD_TIME_WINDOW_LABEL: 'Preferensi Waktu (Opsional)',
  FIELD_TIME_WINDOW_PLACEHOLDER: 'Contoh: Pagi (09:00 - 12:00)',
  FIELD_ADDRESS_LABEL: 'Alamat Pengiriman Lengkap',
  FIELD_ADDRESS_PLACEHOLDER:
    'Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan, dan patokan lokasi',
  FIELD_ADDRESS_HELPER:
    'Wajib diisi untuk metode Delivery (minimal 5 karakter).',
  FIELD_NOTE_LABEL: 'Catatan Pesanan (Opsional)',
  FIELD_NOTE_PLACEHOLDER:
    'Contoh: Tulisan kartu ucapan atau instruksi khusus kurir',
  CONSENT_LABEL:
    'Saya memahami pesanan dan biaya akhir harus dikonfirmasi admin melalui WhatsApp.',
  CONSENT_POLICY_NOTE_PREFIX: 'Dengan melanjutkan, Anda memahami ',
  CONSENT_PRIVACY_LINK: 'Kebijakan Privasi',
  CONSENT_ORDERING_LINK: 'Kebijakan Pemesanan',
  CTA_PREPARE_QUOTE: 'Tinjau Estimasi & Pesan WhatsApp',
  CTA_PREPARING_QUOTE: 'Menyiapkan Estimasi...',
  CTA_PROCEED_WHATSAPP: 'Lanjut ke WhatsApp',
  CTA_PROCEEDING_WHATSAPP: 'Memverifikasi Estimasi...',
  CTA_REOPEN_WHATSAPP: 'Buka WhatsApp Lagi',
  CTA_COPY_MESSAGE: 'Salin Detail Pesanan',
  CTA_COPIED_MESSAGE: 'Detail Pesanan Tersalin',
  CTA_BACK_TO_CART: 'Kembali ke Keranjang',
  CTA_CONSULT_WHATSAPP: 'Konsultasi via WhatsApp Cabang',
  QUOTE_REVIEW_TITLE: 'Tinjauan Estimasi Resmi Server',
  QUOTE_REVIEW_SUBTITLE:
    'Periksa rincian harga terbaru dari server sebelum membuka WhatsApp.',
  QUOTE_PREVIEW_MESSAGE_LABEL: 'Pratinjau Pesan WhatsApp',
  HANDOFF_READY_TITLE: 'Pesan Siap Dikirim di WhatsApp',
  HANDOFF_READY_DESC:
    'Pesanan Anda belum otomatis terkirim. Silakan kirim pesan yang telah disiapkan di aplikasi WhatsApp untuk dikonfirmasi admin cabang.',
  HANDOFF_POPUP_BLOCKED_NOTE:
    'Jika jendela WhatsApp belum terbuka otomatis, gunakan tombol Buka WhatsApp Lagi atau salin teks pesanan di bawah.',
  HANDOFF_LONG_URL_TITLE: 'Pesan Cukup Panjang — Salin & Tempel Manual',
  HANDOFF_LONG_URL_DESC:
    'Rincian pesanan melebihi batas panjang tautan otomatis. Silakan klik Salin Detail Pesanan, lalu klik Buka WhatsApp Lagi dan tempel (paste) pesan di chat admin.',
  COPY_SUCCESS_NOTE:
    'Teks pesanan berhasil disalin ke clipboard. Silakan tempel di chat WhatsApp admin cabang.',
  COPY_FALLBACK_NOTE:
    'Gagal menyalin otomatis. Teks pesanan di bawah telah dipilih—tekan Ctrl+C ( atau tahan lalu pilih Salin) secara manual.',
  FULFILLMENT_DISABLED_TITLE:
    'Pemesanan Mandiri Belum Tersedia untuk Cabang Ini',
  FULFILLMENT_DISABLED_BODY:
    'Saat ini baik metode Pickup maupun Delivery belum diaktifkan untuk pemesanan langsung di cabang ini. Silakan konsultasikan kebutuhan pesanan Anda langsung bersama admin cabang melalui WhatsApp.',
  WARNING_MANUAL_CONFIRMATION:
    'Ketersediaan stok, ongkos kirim, dan total akhir akan dikonfirmasi oleh admin cabang.',
  WARNING_PRICE_CHANGED:
    'Harga atau ketersediaan produk telah berubah. Silakan tinjau kembali pesanan Anda.',
  WARNING_UNCONFIRMED_STOCK:
    'Beberapa produk memerlukan konfirmasi stok cabang saat checkout.',
  SHIPPING_PENDING_LABEL: 'Menunggu konfirmasi admin',
  METHOD_DELIVERY_LABEL: 'Delivery',
  METHOD_PICKUP_LABEL: 'Pickup',
  GREETING: 'Halo Resep Oma Kueh! 👋',
  INTRO: 'Saya ingin memesan dari website Resep Oma.',
  CLOSING:
    'Mohon konfirmasi ketersediaan, ongkos kirim,\ntotal akhir, dan instruksi pembayaran. Terima kasih!',
  ERROR_FORM_SUMMARY_TITLE: 'Mohon periksa kembali isian formulir Anda',
  ERROR_CUSTOMER_NAME_REQUIRED:
    'Nama pemesan wajib diisi (2 hingga 80 karakter).',
  ERROR_FULFILLMENT_METHOD_UNAVAILABLE:
    'Metode penerimaan yang dipilih tidak tersedia di cabang ini.',
  ERROR_TOO_LARGE: 'Ukuran payload melebihi batas 32 KiB.',
  ERROR_INVALID_REQUEST: 'Permintaan checkout tidak valid.',
  ERROR_BRANCH_NOT_FOUND: 'Cabang tidak ditemukan atau tidak aktif.',
  ERROR_INVALID_DATE:
    'Tanggal pemesanan tidak valid untuk zona waktu Jakarta (hari ini hingga 90 hari ke depan).',
  ERROR_DELIVERY_ADDRESS_REQUIRED:
    'Alamat pengiriman wajib diisi untuk metode delivery (minimal 5 karakter).',
  ERROR_MANUAL_CONFIRMATION_REQUIRED:
    'Persetujuan konfirmasi manual wajib disetujui.',
  ERROR_EMPTY_ITEMS: 'Keranjang belanja tidak boleh kosong.',
  ERROR_ITEM_SOLDOUT: 'Produk telah habis atau stok tidak mencukupi.',
  ERROR_ITEM_NOT_OFFERED: 'Produk tidak ditawarkan di cabang yang dipilih.',
  ERROR_BUNDLE_INVALID:
    'Konfigurasi paket tidak memenuhi syarat 12 potong atau pilihan rasa tidak valid.',
  ERROR_UPSTREAM: 'Terjadi kendala saat menghubungi server data cabang.',
} as const;
