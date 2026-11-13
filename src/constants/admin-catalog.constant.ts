import type { AdminRole } from '@/types/auth';

import { ROUTES } from './routes.constant';

export const ADMIN_CATALOG_STATUSES = [
  'draft',
  'published',
  'archived',
] as const;

export const ADMIN_PRODUCT_TYPES = ['simple', 'variants', 'bundle'] as const;

export const ADMIN_VARIANT_STATUSES = ['draft', 'active', 'archived'] as const;

export const ADMIN_DIETARY_VERIFICATION_STATUSES = [
  'pending',
  'verified',
] as const;

export const ADMIN_ALLERGEN_PRESENCES = [
  'contains',
  'may_contain',
  'not_declared',
] as const;

export const ADMIN_BUNDLE_SLOTS = ['cheese', 'choco'] as const;

export const ADMIN_MEDIA_LIMITS = {
  MAX_FILE_BYTES: 5 * 1024 * 1024,
  MAX_DIMENSION_PX: 6000,
  MAX_INPUT_PIXELS: 36_000_000,
  SIGNED_PREVIEW_TTL_SECONDS: 300,
  ALT_TEXT_MIN: 3,
  ALT_TEXT_MAX: 200,
} as const;

export const ADMIN_CATALOG_LIMITS = {
  MAX_BODY_BYTES: 32_768,
  MAX_CONFIGURATION_BODY_BYTES: 131_072,
  MAX_UNIT_PRICE_IDR: 1_000_000_000,
  CHIFFON_TOTAL_UNITS: 12,
  CHIFFON_GROUP_SELECTION_QTY: 3,
  NAME_MIN: 2,
  NAME_MAX: 120,
  SLUG_MIN: 2,
  SLUG_MAX: 100,
  SHORT_DESC_MAX: 240,
  DESC_MAX: 4000,
  NOTES_MAX: 1000,
  SORT_ORDER_MIN: 0,
  SORT_ORDER_MAX: 9999,
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 24,
  MAX_SEARCH_LENGTH: 100,
  MAX_CATEGORIES_LIST: 200,
  MAX_PRODUCTS_SCAN: 500,
  READ_TIMEOUT_MS: 10_000,
  SEARCH_DEBOUNCE_MS: 300,
} as const;

export interface AdminNavItem {
  id: string;
  label: string;
  href: string | null;
  roles: readonly AdminRole[];
  implemented: boolean;
  stageTag?: string;
}

export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  {
    id: 'overview',
    label: 'Ringkasan',
    href: ROUTES.ADMIN,
    roles: ['owner', 'branch_admin'],
    implemented: true,
  },
  {
    id: 'categories',
    label: 'Kategori Menu',
    href: ROUTES.ADMIN_CATEGORIES,
    roles: ['owner'],
    implemented: true,
  },
  {
    id: 'products',
    label: 'Produk & Draf',
    href: ROUTES.ADMIN_PRODUCTS,
    roles: ['owner'],
    implemented: true,
  },
  {
    id: 'availability',
    label: 'Ketersediaan Cabang',
    href: null,
    roles: ['owner', 'branch_admin'],
    implemented: false,
    stageTag: 'F18',
  },
  {
    id: 'promotions',
    label: 'Promosi',
    href: null,
    roles: ['owner'],
    implemented: false,
    stageTag: 'F19',
  },
  {
    id: 'content-locations',
    label: 'Konten & Lokasi',
    href: null,
    roles: ['owner'],
    implemented: false,
    stageTag: 'F20',
  },
  {
    id: 'classes',
    label: 'Kelas Baking',
    href: null,
    roles: ['owner', 'branch_admin'],
    implemented: false,
    stageTag: 'F21',
  },
] as const;

export const ADMIN_CATALOG_COPY = {
  SHELL: {
    BRAND_SUBTITLE: 'Panel Operasional Resep Oma Kueh',
    OPEN_NAV: 'Buka menu admin',
    CLOSE_NAV: 'Tutup menu admin',
    NAV_LABEL: 'Navigasi panel admin',
    UPCOMING_BADGE: 'Tahap berikutnya',
    FORBIDDEN_TITLE: 'Akses terbatas untuk Owner',
    FORBIDDEN_DESC:
      'Akun admin cabang tidak memiliki izin mengelola kategori atau katalog produk global. Gunakan modul izin cabang pada tahap berikutnya.',
    BACK_TO_OVERVIEW: 'Kembali ke Ringkasan',
  },
  OVERVIEW: {
    TITLE: 'Ringkasan Operasional',
    SUBTITLE_OWNER:
      'Data langsung dari basis data untuk memantau kategori, draf produk, serta kesiapan rilis publik.',
    SUBTITLE_STAFF:
      'Ringkasan izin operasional untuk cabang Anda. Modul ketersediaan dan jadwal kelas cabang tersedia pada tahap F18 & F21.',
    REFRESH: 'Muat ulang ringkasan',
    ERROR_LOAD: 'Gagal memuat ringkasan data admin.',
    CARDS: {
      PRODUCTS_PUBLISHED: 'Produk Terpublikasi',
      PRODUCTS_DRAFT: 'Produk Draf',
      PRODUCTS_NEEDS_REVIEW: 'Perlu Review Owner',
      CATEGORIES_PUBLISHED: 'Kategori Terpublikasi',
      BRANCHES_ACTIVE: 'Cabang Aktif',
      OFFERS_SOLD_OUT: 'Penawaran Sold Out',
      PROMOTIONS_ACTIVE: 'Promosi Aktif',
      SESSIONS_UPCOMING: 'Jadwal Kelas Mendatang',
      STAFF_AVAILABLE_OFFERS: 'SKU Tersedia di Cabang',
      STAFF_SOLDOUT_OFFERS: 'SKU Sold Out di Cabang',
      STAFF_UPCOMING_SESSIONS: 'Sesi Kelas Cabang',
    },
    QUICK_ACTIONS_TITLE: 'Akses Cepat Modul Aktif',
    MANAGE_CATEGORIES: 'Kelola Kategori',
    MANAGE_PRODUCTS: 'Kelola Produk & Draf',
    SCOPE_NOTE_OWNER:
      'Konfigurasi SKU harga varian, foto produk, klaim diet/alergen, dan opsi paket penuh akan dibuka pada tahap F17.',
    SCOPE_NOTE_STAFF:
      'Perubahan harga dasar/override, kategori, dan katalog global hanya dapat dilakukan oleh Owner.',
  },
  CATEGORIES: {
    TITLE: 'Kategori Menu',
    SUBTITLE:
      'Atur hierarki induk/sub-kategori, urutan tampil, status publikasi, serta arsip aman tanpa menghapus referensi produk.',
    ADD_BUTTON: 'Tambah Kategori',
    REFRESH: 'Muat ulang',
    EMPTY: 'Belum ada kategori terdaftar.',
    FORM_CREATE_TITLE: 'Buat Kategori Baru',
    FORM_EDIT_TITLE: 'Ubah Kategori',
    NAME_LABEL: 'Nama Kategori',
    SLUG_LABEL: 'Slug URL',
    SLUG_HELP_CREATE: 'Huruf kecil, angka, dan tanda hubung (unik permanen).',
    SLUG_HELP_LOCKED: 'Slug bersifat permanen setelah kategori dibuat.',
    PARENT_LABEL: 'Kategori Induk',
    PARENT_NONE: 'Tanpa Induk (Kategori Utama)',
    SORT_LABEL: 'Urutan Tampil',
    STATUS_LABEL: 'Status',
    DESC_LABEL: 'Deskripsi Singkat',
    SAVE_CREATE: 'Simpan Kategori',
    SAVE_EDIT: 'Simpan Perubahan',
    CANCEL: 'Batal',
    EDIT_BTN: 'Ubah',
    PUBLISH_BTN: 'Publikasikan',
    ARCHIVE_BTN: 'Arsipkan',
    ARCHIVE_CONFIRM_TITLE: 'Arsipkan kategori ini?',
    ARCHIVE_CONFIRM_DESC:
      'Arsip bersifat lunak (status menjadi archived) dan tidak menghapus data produk secara permanen.',
    ARCHIVE_CONFIRM_SUBMIT: 'Ya, Arsipkan Kategori',
    PARENT_PREFIX: 'Induk:',
    REFS_PREFIX: 'Referensi:',
    REFS_NONE: 'Belum dipakai produk/subkategori',
    STATUS_LABELS: {
      draft: 'Draf',
      published: 'Terpublikasi',
      archived: 'Diarsipkan',
    },
    ERRORS: {
      CYCLE:
        'Kategori induk tidak boleh membentuk siklus atau menunjuk dirinya sendiri.',
      PARENT_UNPUBLISHED:
        'Kategori hanya dapat dipublikasikan jika kategori induknya juga berstatus terpublikasi.',
      SLUG_COLLISION: 'Slug kategori sudah digunakan.',
      ARCHIVE_BLOCKED_CHILDREN:
        'Kategori tidak dapat diarsipkan selama masih memiliki subkategori aktif/terpublikasi.',
      ARCHIVE_BLOCKED_PRODUCTS:
        'Kategori masih menjadi satu-satunya kategori terpublikasi untuk produk aktif.',
      STALE_CONFLICT:
        'Kategori ini telah diubah oleh sesi lain. Muat ulang data terbaru sebelum menyimpan ulang.',
      SLUG_IMMUTABLE: 'Slug kategori tidak dapat diubah setelah dibuat.',
    },
  },
  PRODUCTS: {
    TITLE: 'Produk & Draf Inti',
    SUBTITLE:
      'Kelola data inti produk, filter status/kategori, urutan katalog, dan arsip lunak. Harga hanya diatur pada SKU/varian (F17).',
    ADD_BUTTON: 'Tambah Produk Draf',
    REFRESH: 'Muat ulang',
    SEARCH_LABEL: 'Cari produk',
    SEARCH_PLACEHOLDER: 'Cari nama atau slug produk...',
    FILTER_STATUS_LABEL: 'Status',
    FILTER_STATUS_ALL: 'Semua status',
    FILTER_CATEGORY_LABEL: 'Kategori',
    FILTER_CATEGORY_ALL: 'Semua kategori',
    EMPTY: 'Tidak ada produk yang sesuai filter.',
    FORM_CREATE_TITLE: 'Buat Produk Inti (Draf)',
    FORM_EDIT_TITLE: 'Ubah Data Inti Produk',
    NO_PRICE_NOTICE:
      'Baris produk inti tidak menyimpan harga (harga berada di SKU varian). Pengaturan varian, foto, kategori relasi, dan opsi paket menunggu modul F17.',
    PUBLISH_READY_LABEL: 'Syarat Publikasi',
    PUBLISH_READY_OK: 'Lengkap — siap berstatus terpublikasi.',
    PUBLISH_READY_MISSING: 'Belum siap dipublikasikan:',
    NAME_LABEL: 'Nama Produk',
    SLUG_LABEL: 'Slug URL',
    SLUG_HELP_CREATE: 'Unik permanen; dapat dibuat otomatis dari nama produk.',
    SLUG_HELP_LOCKED: 'Slug produk bersifat permanen dan tidak bisa diubah.',
    TYPE_LABEL: 'Tipe Produk',
    TYPE_LABELS: {
      simple: 'Tunggal (1 SKU)',
      variants: 'Multi-Varian / Ukuran',
      bundle: 'Paket / Hampers Bundle',
    },
    STATUS_LABEL: 'Status',
    SORT_LABEL: 'Urutan Tampil',
    SHORT_DESC_LABEL: 'Ringkasan Singkat',
    DESC_LABEL: 'Deskripsi Lengkap',
    INGREDIENTS_LABEL: 'Catatan Bahan (Opsional)',
    STORAGE_LABEL: 'Panduan Penyimpanan (Opsional)',
    REVIEW_CHECKBOX: 'Masih perlu review Owner sebelum tampil ke publik',
    FEATURED_CHECKBOX: 'Tampilkan sebagai produk unggulan (Featured)',
    BEST_SELLER_CHECKBOX: 'Tandai Best Seller',
    NEW_CHECKBOX: 'Tandai Produk Baru',
    SAVE_CREATE: 'Simpan Produk Draf',
    SAVE_EDIT: 'Simpan Perubahan',
    CANCEL: 'Batal',
    EDIT_BTN: 'Ubah Inti',
    ARCHIVE_BTN: 'Arsipkan',
    ARCHIVE_CONFIRM_TITLE: 'Arsipkan produk ini?',
    ARCHIVE_CONFIRM_DESC:
      'Produk akan disembunyikan dari publik (status archived) tanpa menghapus relasi SKU, kategori, atau histori varian.',
    ARCHIVE_CONFIRM_SUBMIT: 'Ya, Arsipkan Produk',
    PAGINATION_PREV: 'Sebelumnya',
    PAGINATION_NEXT: 'Berikutnya',
    STATUS_LABELS: {
      draft: 'Draf',
      published: 'Terpublikasi',
      archived: 'Diarsipkan',
    },
    ERRORS: {
      SLUG_COLLISION: 'Slug produk sudah digunakan.',
      SLUG_IMMUTABLE: 'Slug produk tidak dapat diubah setelah dibuat.',
      STALE_CONFLICT:
        'Produk ini telah diubah oleh sesi lain. Muat ulang data sebelum menyimpan kembali.',
      PUBLISH_NOT_READY:
        'Produk belum memenuhi syarat publikasi (review selesai, >=1 kategori terpublikasi, >=1 varian aktif ditawarkan cabang aktif, dan >=1 foto disetujui).',
      PRICE_NOT_ON_PRODUCT:
        'Data produk inti tidak menerima harga langsung; harga diatur pada varian SKU.',
    },
  },
  PRODUCT_EDITOR: {
    CREATE_PAGE_TITLE: 'Buat Produk Baru (Editor Lengkap)',
    EDIT_PAGE_TITLE: 'Editor Konfigurasi Produk',
    BACK_TO_PRODUCTS: 'Kembali ke Daftar Produk',
    NEW_PRODUCT_BTN: 'Editor Produk Baru',
    OPEN_EDITOR_BTN: 'Editor Lengkap',
    CREATE_STEP_DESC:
      'Langkah 1 membuat draf inti produk tanpa harga langsung. Setelah tersimpan, lanjutkan konfigurasi SKU, foto Storage, kategori, paket, dan klaim diet/alergen dalam satu simpan atomik.',
    SAVE_DRAFT_BTN: 'Simpan Konfigurasi Draf',
    SAVE_PUBLISH_BTN: 'Simpan & Publikasikan',
    CONCURRENCY_CONFLICT_ACTION: 'Muat Ulang Data Terbaru',
    PREVIEW_HEADING: 'Pratinjau Kartu Katalog Publik',
    PREVIEW_SUBTITLE:
      'Menggunakan komponen MenuProductCard dan kalkulator harga resmi yang sama dengan halaman /menu.',
    PREVIEW_NO_BRANCH_NOTE:
      'Harga efektif penuh dan penawaran cabang mengikuti ketersediaan masing-masing cabang pada tahap penawaran.',
    ERRORS: {
      DUPLICATE_CATEGORY: 'Kategori tidak boleh dipilih lebih dari sekali.',
      SINGLE_PRIMARY_CATEGORY:
        'Pilih tepat satu kategori utama bila kategori ditambahkan.',
      MIN_ONE_VARIANT: 'Minimal satu varian SKU wajib tersedia.',
      DUPLICATE_SKU: 'Kode SKU tidak boleh duplikat pada produk ini.',
      SKU_IMMUTABLE:
        'SKU varian yang sudah tersimpan bersifat permanen dan tidak bisa diubah.',
      SINGLE_DEFAULT_VARIANT:
        'Tepat satu varian non-arsip harus ditandai sebagai varian default.',
      SIMPLE_MAX_ACTIVE_VARIANTS:
        'Produk tipe tunggal hanya boleh memiliki 1 varian berstatus aktif.',
      SINGLE_PRIMARY_IMAGE:
        'Maksimal satu foto yang boleh ditandai sebagai foto utama.',
      IMAGE_ALT_REQUIRED_FOR_APPROVAL:
        'Foto yang disetujui wajib memiliki teks alt (minimal 3 karakter).',
      IMAGE_STORAGE_INVALID:
        'Path atau bucket foto tidak valid. Unggah ulang melalui endpoint upload admin.',
      FOREIGN_OR_INVALID_COMPONENT:
        'Komponen paket harus merujuk ke SKU aktif produk non-bundle lain (bukan produk ini sendiri).',
      DUPLICATE_COMPONENT_IN_BUNDLE:
        'Varian komponen yang sama tidak boleh dipakai berulang dalam konfigurasi paket.',
      INVALID_BUNDLE_UNITS:
        'Paket Chiffon Mix harus tepat 12 potong (Cheese 3 + Choco 3 tetap + 2 grup pilihan masing-masing 1 rasa × 3 potong).',
      DIETARY_EVIDENCE_REQUIRED:
        'Klaim diet terverifikasi wajib disertai catatan bukti pemeriksaan (minimal 3 karakter).',
      GF_COMPONENT_UNVERIFIED:
        'Klaim Gluten-Free terverifikasi pada paket membutuhkan seluruh komponen tetap dan pilihan aktif juga terverifikasi Gluten-Free.',
      VARIANT_REFERENCED_BY_BUNDLE:
        'Varian tidak dapat diarsipkan karena masih dirujuk oleh konfigurasi paket aktif lain.',
      VARIANT_ARCHIVE_REQUIRED:
        'Varian yang sudah memiliki referensi tidak boleh dihapus; gunakan arsip lunak.',
    },
  },
  MEDIA: {
    SECTION_TITLE: 'Media Foto Produk (Draft Privat → Publik Terkurasi)',
    UPLOAD_LABEL: 'Unggah Foto Baru (JPG/PNG/WebP/AVIF, maks 5 MiB)',
    UPLOAD_PENDING: 'Memvalidasi dan mengunggah ke bucket privat...',
    DRAFT_BADGE: 'Draf Privat (Signed URL)',
    APPROVED_BADGE: 'Disetujui Publik',
    PROMOTE_LABEL: 'Setujui & Promosikan ke Bucket Publik saat Simpan',
    PRIMARY_LABEL: 'Foto Utama Kartu',
    ALT_LABEL: 'Teks Alt (Aksesibilitas & Publikasi)',
    VARIANT_LINK_LABEL: 'Tautkan ke Varian (Opsional)',
    ALL_VARIANTS_OPTION: 'Umum (Semua Varian)',
    REMOVE_IMAGE_BTN: 'Hapus Foto dari Produk',
    ERRORS: {
      FILE_TOO_LARGE: 'Ukuran berkas melebihi batas maksimal 5 MiB.',
      INVALID_FILE_TYPE:
        'Format berkas tidak valid atau spoofed. Gunakan JPG, PNG, WebP, atau AVIF yang valid (SVG ditolak).',
      DIMENSIONS_EXCEEDED:
        'Dimensi foto tidak boleh melebihi 6000 × 6000 piksel atau berkas rusak.',
      INVALID_STORAGE_PATH: 'Path Storage tidak valid atau tidak aman.',
    },
  },
} as const;
