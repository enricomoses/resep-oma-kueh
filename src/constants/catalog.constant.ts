import type { CatalogQueryInput } from '@/types/catalog';

export const CATALOG_SORTS = [
  'featured',
  'newest',
  'price_asc',
  'price_desc',
  'name_asc',
] as const;

export const CATALOG_AVAILABILITY = [
  'available',
  'sold_out',
  'unconfirmed',
] as const;

export const CATALOG_LIMITS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 24,
  MAX_SEARCH_LENGTH: 100,
  DEBOUNCE_MS: 300,
  MAX_CATEGORIES_READ: 64,
  MAX_PRODUCTS_READ: 200,
  MAX_PROMOTIONS_READ: 32,
  READ_TIMEOUT_MS: 5000,
  MAX_UNIT_IDR: 1_000_000_000,
  MAX_CART_GROSS_IDR: 1_000_000_000_000,
} as const;

export const CATALOG_QUERY_PARAMS = {
  BRANCH: 'branch',
  CATEGORY: 'category',
  Q: 'q',
  TAG: 'tag',
  AVAILABILITY: 'availability',
  MIN_PRICE: 'minPriceIdr',
  MAX_PRICE: 'maxPriceIdr',
  SORT: 'sort',
  PAGE: 'page',
  LIMIT: 'limit',
} as const;

export const CATALOG_DIETARY_TAG_OPTIONS = [
  { slug: 'gluten-free', label: 'Gluten-Free (Terverifikasi)' },
  { slug: 'vegan', label: 'Vegan (Terverifikasi)' },
  { slug: 'egg-free', label: 'Egg-Free (Terverifikasi)' },
  { slug: 'dairy-free', label: 'Dairy-Free (Terverifikasi)' },
] as const;

export const CATALOG_SORT_LABELS: Record<
  (typeof CATALOG_SORTS)[number],
  string
> = {
  featured: 'Pilihan Unggulan',
  newest: 'Terbaru',
  price_asc: 'Harga Terendah',
  price_desc: 'Harga Tertinggi',
  name_asc: 'Nama (A–Z)',
};

export const CATALOG_AVAILABILITY_LABELS: Record<
  (typeof CATALOG_AVAILABILITY)[number],
  string
> = {
  available: 'Tersedia',
  unconfirmed: 'Konfirmasi stok via WA',
  sold_out: 'Habis',
};

export const CATALOG_COPY = {
  EYEBROW: 'Katalog Resep Oma Kueh',
  TITLE: 'Menu & Kreasi Kue Hangat',
  SUBTITLE:
    'Telusuri seri Chiffon klasik, kreasi roti, hingga paket mix untuk keluarga. Pilih cabang untuk melihat ketersediaan dan harga cabang final.',
  BRANCH_NOTICE_TITLE: 'Pilih cabang untuk melihat harga & ketersediaan final',
  BRANCH_NOTICE_BODY:
    'Anda tetap dapat menjelajahi seri menu dan label diet terverifikasi. Pilih cabang Surabaya atau Bintaro pada bilah atas untuk menampilkan harga cabang final dan ketersediaan SKU.',
  BRANCH_FILTER_REQUIRES_SELECTION:
    'Filter ketersediaan atau rentang harga membutuhkan cabang aktif. Pilih cabang terlebih dahulu.',
  FILTER_TITLE: 'Filter & Pencarian',
  OPEN_FILTERS_MOBILE: 'Filter & Urutkan',
  CLOSE_FILTERS_MOBILE: 'Terapkan & Tutup',
  RESET_FILTERS: 'Reset filter',
  SEARCH_LABEL: 'Cari menu',
  SEARCH_PLACEHOLDER: 'Contoh: Coffee Chiffon, keju, roti…',
  CATEGORY_LABEL: 'Seri / Kategori',
  CATEGORY_ALL: 'Semua seri',
  TAG_LABEL: 'Diet terverifikasi',
  TAG_ALL: 'Semua label diet',
  AVAILABILITY_LABEL: 'Ketersediaan cabang',
  AVAILABILITY_ALL: 'Semua status',
  MIN_PRICE_LABEL: 'Harga minimum (Rp)',
  MAX_PRICE_LABEL: 'Harga maksimum (Rp)',
  PRICE_PLACEHOLDER_MIN: '0',
  PRICE_PLACEHOLDER_MAX: 'Contoh: 150000',
  APPLY_PRICE_CTA: 'Terapkan harga',
  SORT_LABEL: 'Urutkan',
  RESULT_SUMMARY: (shown: number, total: number) =>
    `Menampilkan ${shown} dari ${total} menu`,
  PRICE_FROM_PREFIX: 'Mulai dari',
  PRICE_ORIGINAL_PREFIX: 'Harga normal',
  PRICE_BRANCH_REQUIRED:
    'Pilih cabang terlebih dahulu untuk melihat harga cabang final.',
  PRICE_SOLD_OUT_NOTE:
    'Seluruh ukuran pada filter ini sedang habis di cabang terpilih.',
  CTA_VIEW_OPTIONS: 'Lihat Pilihan',
  CTA_SELECT_BRANCH_FIRST: 'Pilih cabang dahulu untuk tambah ke keranjang',
  BADGE_FEATURED: 'Pilihan Oma',
  BADGE_BEST_SELLER: 'Best Seller',
  BADGE_NEW: 'Baru',
  BADGE_BUNDLE: 'Paket Mix',
  BADGE_PROMO_APPLIED: 'Promo Aktif',
  BADGE_PROMO_CONDITIONAL: 'Promo Min. Belanja',
  VARIANT_COUNT_SUFFIX: 'pilihan ukuran/varian',
  EMPTY_TITLE: 'Belum ada menu yang cocok dengan filter ini',
  EMPTY_BODY:
    'Coba ubah kata kunci pencarian, pilih seri lain, atau atur ulang batas harga dan filter ketersediaan.',
  ERROR_TITLE: 'Katalog belum dapat dimuat saat ini',
  ERROR_BODY:
    'Terjadi kendala saat membaca data katalog. Silakan muat ulang atau hubungi admin cabang melalui WhatsApp.',
  RETRY_CTA: 'Muat ulang katalog',
  PAGINATION_NAV_LABEL: 'Navigasi halaman katalog',
  PAGINATION_PREV: 'Sebelumnya',
  PAGINATION_NEXT: 'Berikutnya',
  PAGINATION_INDICATOR: (page: number, totalPages: number) =>
    `Halaman ${page} dari ${totalPages}`,
} as const;

export function serializeCatalogQueryKey(params: CatalogQueryInput) {
  return {
    branch: params.branch ?? null,
    category: params.category ?? null,
    q: params.q ?? null,
    tag: params.tag ?? null,
    availability: params.availability ?? null,
    minPriceIdr:
      params.minPriceIdr !== undefined ? Number(params.minPriceIdr) : null,
    maxPriceIdr:
      params.maxPriceIdr !== undefined ? Number(params.maxPriceIdr) : null,
    sort: params.sort ?? 'featured',
    page: params.page !== undefined ? Number(params.page) : 1,
    limit: params.limit !== undefined ? Number(params.limit) : 12,
  };
}
