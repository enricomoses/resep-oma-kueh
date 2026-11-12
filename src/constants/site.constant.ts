import { ROUTES } from './routes.constant';

export const SITE_NAV = [
  { href: ROUTES.HOME, label: 'Beranda' },
  { href: ROUTES.MENU, label: 'Menu' },
  { href: ROUTES.ABOUT, label: 'Tentang Oma' },
  { href: ROUTES.CLASSES, label: 'Baking Class' },
  { href: ROUTES.CONTACT, label: 'Kontak' },
] as const;
export const SITE_HELP = [
  { href: ROUTES.FAQ, label: 'FAQ' },
  { href: ROUTES.PRIVACY, label: 'Privasi' },
  { href: ROUTES.ORDERING_POLICY, label: 'Kebijakan pemesanan' },
] as const;
export const BRANCH = {
  PARAM: 'branch',
  STORAGE_KEY: 'rok-branch',
  MAX_CODE_LENGTH: 64,
  MAX_RECORDS: 24,
  READ_TIMEOUT_MS: 5000,
} as const;
export const SITE_COPY = {
  NAV: 'Navigasi utama',
  MOBILE_NAV: 'Menu navigasi',
  OPEN_NAV: 'Buka navigasi',
  SKIP: 'Lewati ke konten',
  MAIN_ID: 'konten',
  SELECT_BRANCH: 'Pilih cabang',
  UNSELECTED: 'Cabang belum dipilih',
  HYDRATING: 'Memuat preferensi cabang…',
  LOADING_BRANCHES: 'Memuat cabang…',
  BRANCH_HELP:
    'Boleh menjelajah tanpa cabang. Pilih cabang untuk harga cabang dan menambah produk ke keranjang saat katalog tersedia.',
  BRANCH_ERROR:
    'Cabang tidak dapat dimuat. Kontak terkonfirmasi tetap tersedia di bawah.',
  BRANCH_EMPTY: 'Belum ada cabang aktif yang dapat dipilih.',
  BRANCH_INVALID:
    'Cabang pada URL tidak valid atau sudah tidak aktif. Pilih cabang kembali.',
  PREFERENCE_INVALID:
    'Preferensi cabang tidak lagi aktif. Pilih cabang kembali.',
  RETRY: 'Coba muat cabang lagi',
  CONTACTS: 'Hubungi Resep Oma Kueh',
  CONTACT_FALLBACK:
    'Kontak terkonfirmasi; status cabang saat ini belum dapat diverifikasi.',
  ADDRESS_PENDING: 'Alamat belum dikonfirmasi. Hubungi admin cabang.',
  EMAIL: 'Email resmi',
  INSTAGRAM: 'Instagram resmi',
  CART_EMPTY: 'Keranjang kosong · 0 item',
  CART_PENDING: 'Keranjang tersedia pada tahap berikutnya.',
  CHAT: 'Ask Oma',
  CHAT_PENDING: 'Ask Oma belum tersedia. Silakan hubungi admin cabang.',
  PREPARING: 'Halaman sedang disiapkan',
  PREPARING_BODY:
    'Navigasi ini sudah tersedia. Konten dan layanan halaman ini belum diaktifkan.',
  BACK_HOME: 'Kembali ke beranda',
  SWITCH_TITLE: 'Periksa perubahan cabang',
  SWITCH_BODY: 'Harga/ketersediaan mungkin berbeda. Periksa ulang keranjang?',
  SWITCH_BLOCKED:
    'Pilihan belum berubah. Pemeriksaan keranjang harus selesai sebelum berganti cabang.',
  SWITCH_CONTINUE: 'Periksa dan lanjutkan',
  CANCEL: 'Tetap di cabang ini',
  STORAGE_UNAVAILABLE:
    'Preferensi tidak dapat disimpan di browser ini. Pilihan pada URL tetap dapat digunakan.',
} as const;
