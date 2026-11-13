import { ROUTES } from '@/constants/routes.constant';

export const SEO_DEFAULTS = {
  LOCALE: 'id_ID',
  LANGUAGE: 'id',
  DEFAULT_DESCRIPTION:
    'Resep Oma Kueh menghadirkan kue klasik dengan sentuhan modern di Surabaya dan Bintaro, serta kelas memanggang ROK Baking Class.',
  PREVIEW_HOST_SUFFIXES: ['.vercel.app'],
  PREVIEW_HOST_PREFIXES: [
    'staging.',
    'staging-',
    'preview.',
    'preview-',
    'deploy-preview-',
  ],
} as const;

export const ROBOTS_DISALLOW_PATHS = [
  '/admin/',
  '/auth/',
  '/api/',
  ROUTES.CART,
  ROUTES.CHECKOUT,
] as const;

export const PUBLIC_STATIC_SITEMAP_ENTRIES = [
  { path: ROUTES.HOME, changeFrequency: 'weekly', priority: 1.0 },
  { path: ROUTES.MENU, changeFrequency: 'daily', priority: 0.9 },
  { path: ROUTES.CLASSES, changeFrequency: 'daily', priority: 0.8 },
  { path: ROUTES.ABOUT, changeFrequency: 'monthly', priority: 0.7 },
  { path: ROUTES.CONTACT, changeFrequency: 'monthly', priority: 0.7 },
  { path: ROUTES.FAQ, changeFrequency: 'monthly', priority: 0.7 },
  { path: ROUTES.ORDERING_POLICY, changeFrequency: 'monthly', priority: 0.5 },
  { path: ROUTES.PRIVACY, changeFrequency: 'monthly', priority: 0.5 },
] as const;

export const SITEMAP_LIMITS = {
  MAX_PRODUCTS: 500,
  MAX_CLASSES: 200,
  READ_TIMEOUT_MS: 5000,
} as const;

export const BOUNDARY_COPY = {
  NOT_FOUND_TITLE: 'Halaman tidak ditemukan',
  NOT_FOUND_BODY:
    'Halaman atau produk yang Anda cari belum tersedia atau tautannya sudah berubah.',
  NOT_FOUND_HOME_CTA: 'Kembali ke Beranda',
  NOT_FOUND_MENU_CTA: 'Lihat Menu',
  ERROR_TITLE: 'Layanan sedang mengalami gangguan sementara',
  ERROR_BODY:
    'Sebagian informasi katalog atau halaman belum dapat dimuat dari server. Silakan muat ulang atau hubungi cabang resmi kami lewat WhatsApp atau email.',
  ERROR_RETRY_CTA: 'Coba Muat Ulang',
  ERROR_HOME_CTA: 'Ke Beranda',
  ERROR_CONTACTS_HEADING: 'Kontak resmi yang tetap tersedia',
  LOADING_LABEL: 'Memuat halaman…',
  ADMIN_LOADING_LABEL: 'Memuat area admin…',
} as const;
