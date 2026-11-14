export const CART_LIMITS = {
  MAX_DISTINCT_LINES: 15,
  MAX_QTY_PER_LINE: 99,
  MAX_OPTIONS_PER_LINE: 12,
  MAX_STORAGE_KEY_LENGTH: 64,
  MAX_REQUEST_BYTES: 32 * 1024,
} as const;

export const CART_STORAGE = {
  KEY: 'rok_guest_cart_v1',
  VERSION: 1,
} as const;

export const CART_CONFLICTS = {
  NONE: 'none',
  SOLD_OUT: 'sold_out',
  NOT_OFFERED: 'not_offered',
  PRICE_CHANGED: 'price_changed',
  COMPONENT_UNAVAILABLE: 'component_unavailable',
  ARCHIVED: 'archived',
} as const;

export const CART_COPY = {
  PAGE_TITLE: 'Keranjang Belanja',
  PAGE_DESCRIPTION:
    'Periksa pesanan kue tradisional dan modern Resep Oma Kueh Anda.',
  EMPTY_TITLE: 'Keranjang Anda masih kosong',
  EMPTY_BODY:
    'Temukan pilihan chiffon lembut, roti klasik, kue basah, dan parcel istimewa dari resep otentik Oma.',
  CTA_BROWSE_MENU: 'Lihat Menu Lengkap',
  LOADING_RESTORE: 'Memulihkan isi keranjang Anda…',
  ERROR_REVALIDATE:
    'Gagal memverifikasi status produk dan harga terbaru. Silakan coba lagi.',
  RETRY: 'Coba Lagi',
  SUMMARY_TITLE: 'Ringkasan Pesanan',
  SUBTOTAL: 'Subtotal Produk',
  DISCOUNT: 'Diskon Promosi',
  TOTAL_ESTIMATE: 'Estimasi Total',
  PRICE_CAVEAT_NOTE:
    'Harga dan ketersediaan adalah estimasi. Total final dan ongkos kirim akan dikonfirmasi oleh admin cabang via WhatsApp.',
  BRANCH_LABEL: 'Cabang Pemesanan',
  NO_BRANCH_WARNING:
    'Pilih cabang terlebih dahulu untuk melihat ketersediaan stok aktual dan melanjutkan pemesanan.',
  CTA_CHECKOUT: 'Lanjut ke Pemesanan',
  CTA_CHECKOUT_DISABLED_CONFLICTS:
    'Selesaikan kendala produk sebelum melanjutkan',
  ITEM_REMOVED: 'Item berhasil dihapus dari keranjang.',
  ITEM_UPDATED: 'Jumlah pesanan berhasil diperbarui.',
  ITEM_ADDED: 'Produk berhasil ditambahkan ke keranjang.',
  VIEW_CART: 'Lihat Keranjang',
  REMOVE_ITEM: 'Hapus',
  CLEAR_CART: 'Kosongkan Keranjang',
  CLEAR_CART_CONFIRM: 'Apakah Anda yakin ingin mengosongkan keranjang belanja?',
  CONFLICT_SOLD_OUT: 'Stok varian ini habis di cabang terpilih.',
  CONFLICT_NOT_OFFERED: 'Varian produk ini tidak tersedia di cabang terpilih.',
  CONFLICT_PRICE_CHANGED: 'Harga telah diperbarui sesuai cabang terpilih.',
  CONFLICT_COMPONENT_UNAVAILABLE:
    'Satu atau lebih rasa/komponen bundel tidak tersedia di cabang ini.',
  CONFLICT_ARCHIVED: 'Produk ini sudah tidak aktif di katalog.',
  LIMIT_LINES_EXCEEDED: 'Keranjang mencapai batas maksimal 15 jenis produk.',
  LIMIT_QTY_EXCEEDED: 'Maksimal 99 unit per item pesanan.',
} as const;
