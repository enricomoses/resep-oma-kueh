export const CHECKOUT_LIMITS = {
  MAX_REQUEST_BYTES: 32 * 1024, // 32 KiB (§8.1 / §15.5)
  MAX_DISTINCT_LINES: 15,
  MAX_QTY_PER_LINE: 99,
  MAX_OPTIONS_PER_LINE: 12,
  MIN_CUSTOMER_NAME_LENGTH: 1,
  MAX_CUSTOMER_NAME_LENGTH: 100,
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
