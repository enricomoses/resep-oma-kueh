export const PROMOTION_DISCOUNT_TYPES = ['percentage', 'fixed'] as const;

export const PROMOTION_SCOPES = [
  'all',
  'category',
  'product',
  'variant',
] as const;

export const PROMOTION_STATUSES = ['draft', 'published', 'archived'] as const;

export const PROMOTION_CLOCK_STATES = ['scheduled', 'active', 'ended'] as const;

export const PROMOTION_LIMITS = {
  TITLE_MAX: 200,
  SLUG_MAX: 120,
  DESCRIPTION_MAX: 2000,
  SHIPPING_TITLE_MAX: 200,
  SHIPPING_BODY_MAX: 2000,
  MAX_PRIORITY: 10_000,
  MIN_PRIORITY: -10_000,
  MAX_DISCOUNT_IDR: 1_000_000_000,
  MAX_PERCENTAGE: 100,
  MAX_LIST_LIMIT: 100,
  DEFAULT_LIST_LIMIT: 50,
  MAX_TARGETS: 100,
  MAX_BRANCH_IDS: 24,
  PREVIEW_EXAMPLE_PRICES_IDR: [75_000, 150_000, 320_000] as const,
} as const;

export const PROMOTION_TIMEZONE = 'Asia/Jakarta';
export const PROMOTION_JAKARTA_OFFSET = '+07:00';

export const PROMOTION_COPY = {
  CLOCK_LABELS: {
    scheduled: 'Terjadwal',
    active: 'Aktif Sekarang',
    ended: 'Berakhir',
  },
  SCOPE_LABELS: {
    all: 'Semua Produk Aktif',
    category: 'Kategori Pilihan',
    product: 'Produk Pilihan',
    variant: 'Varian / SKU Pilihan',
  },
  DISCOUNT_TYPE_LABELS: {
    percentage: 'Persentase (%)',
    fixed: 'Nominal Tetap per Unit (Rp)',
  },
  ALL_ACTIVE_BRANCHES_LABEL: 'Semua Cabang Aktif',
  NON_STACKABLE_NOTE:
    'Promo tidak dapat digabung (non-stackable). Sistem otomatis memilih potongan Rupiah terbesar per baris; jika seri, prioritas lebih tinggi dan UUID lebih kecil yang menang.',
  ENDS_EXCLUSIVE_NOTE:
    'Semua tanggal dan jam menggunakan zona waktu WIB (Asia/Jakarta). Waktu mulai bersifat inklusif dan waktu berakhir bersifat eksklusif.',
  SHIPPING_BANNER_SAFETY_NOTE:
    'Banner info pengiriman bersifat informasional saja (hanya tampil ke publik saat berstatus terpublikasi Owner) dan tidak menghitung atau mengubah ongkos kirim checkout.',
  EMPTY_PUBLIC: 'Belum ada promo aktif yang sedang berjalan saat ini.',
} as const;
