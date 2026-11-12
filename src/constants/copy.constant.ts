export const API_ERROR_CODES = [
  'INVALID_REQUEST',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'VALIDATION_ERROR',
  'REQUEST_TOO_LARGE',
  'RATE_LIMITED',
  'UPSTREAM_ERROR',
  'UNAVAILABLE',
  'TIMEOUT',
  'INTERNAL_ERROR',
  'INVALID_RESPONSE',
  'NETWORK_ERROR',
  'CANCELED',
] as const;

export const ERROR_COPY = {
  INVALID_REQUEST: 'Permintaan tidak valid.',
  UNAUTHENTICATED: 'Silakan masuk terlebih dahulu.',
  FORBIDDEN: 'Akses tidak diizinkan.',
  NOT_FOUND: 'Data tidak ditemukan.',
  CONFLICT: 'Data telah berubah. Periksa kembali.',
  VALIDATION_ERROR: 'Periksa isian Anda.',
  REQUEST_TOO_LARGE: 'Permintaan terlalu besar.',
  RATE_LIMITED: 'Terlalu banyak permintaan. Coba lagi nanti.',
  UPSTREAM_ERROR: 'Layanan data sedang bermasalah.',
  UNAVAILABLE: 'Layanan belum tersedia.',
  TIMEOUT: 'Permintaan melewati batas waktu.',
  INTERNAL_ERROR: 'Terjadi kesalahan. Silakan coba lagi.',
  INVALID_RESPONSE: 'Respons layanan tidak valid.',
  NETWORK_ERROR: 'Tidak dapat terhubung ke layanan.',
  CANCELED: 'Permintaan dibatalkan.',
} as const satisfies Record<(typeof API_ERROR_CODES)[number], string>;

export const CONFIGURATION_COPY = 'Konfigurasi environment tidak valid';

export const DEMO_COPY = {
  LABEL: 'Mode demo lokal',
  MESSAGE: 'Data demo — bukan katalog pemesanan aktif',
} as const;
