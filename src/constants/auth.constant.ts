export const AUTH_LIMITS = {
  MAX_REQUEST_BYTES: 16 * 1024,
  EMAIL_MAX_LENGTH: 254,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  LOGIN_RATE_LIMIT_MAX: 10,
  LOGIN_RATE_LIMIT_WINDOW_MS: 5 * 60 * 1000,
  RESET_RATE_LIMIT_MAX: 5,
  RESET_RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
} as const;

export const ADMIN_ROLES = ['owner', 'branch_admin'] as const;

export const AUTH_ERROR_REASONS = [
  'session_expired',
  'profile_missing',
  'profile_inactive',
  'recovery_expired',
  'recovery_invalid',
  'unauthenticated',
] as const;

export const AUTH_COPY = {
  LOGIN_META_TITLE: 'Masuk Admin — Resep Oma Kueh',
  RESET_META_TITLE: 'Atur Ulang Kata Sandi Admin — Resep Oma Kueh',
  ADMIN_META_TITLE: 'Dasbor Admin — Resep Oma Kueh',
  LOGIN_HEADING: 'Portal Admin Resep Oma Kueh',
  LOGIN_SUBTITLE:
    'Masuk dengan email dan kata sandi admin yang telah didaftarkan.',
  NO_PUBLIC_SIGNUP_NOTE:
    'Akun admin dibuat oleh pemilik toko melalui maintenance internal. Pendaftaran publik tidak tersedia.',
  EMAIL_LABEL: 'Email admin',
  EMAIL_PLACEHOLDER: 'admin@contoh.invalid',
  PASSWORD_LABEL: 'Kata sandi',
  PASSWORD_CONFIRM_LABEL: 'Konfirmasi kata sandi baru',
  NEW_PASSWORD_LABEL: 'Kata sandi baru',
  NEW_PASSWORD_HELPER: 'Minimal 8 karakter.',
  SUBMIT_LOGIN: 'Masuk ke Dasbor',
  SUBMITTING_LOGIN: 'Memeriksa sesi…',
  FORGOT_PASSWORD_TOGGLE: 'Lupa kata sandi?',
  BACK_TO_LOGIN: 'Kembali ke form masuk',
  RESET_REQUEST_HEADING: 'Minta Tautan Atur Ulang Kata Sandi',
  RESET_REQUEST_SUBTITLE:
    'Masukkan email admin terdaftar. Jika akun valid, tautan pemulihan akan dikirim ke email Anda.',
  SUBMIT_RESET_REQUEST: 'Kirim Tautan Pemulihan',
  SUBMITTING_RESET_REQUEST: 'Mengirim permintaan…',
  GENERIC_RESET_RESPONSE:
    'Jika email tersebut terdaftar sebagai admin aktif, tautan pemulihan kata sandi telah dikirim.',
  RESET_PAGE_HEADING: 'Atur Ulang Kata Sandi Admin',
  RESET_PAGE_SUBTITLE:
    'Masukkan kata sandi baru untuk menyelesaikan pemulihan akses admin Anda.',
  SUBMIT_UPDATE_PASSWORD: 'Simpan Kata Sandi Baru',
  SUBMITTING_UPDATE_PASSWORD: 'Menyimpan kata sandi…',
  UPDATE_PASSWORD_SUCCESS:
    'Kata sandi admin berhasil diperbarui. Anda dapat melanjutkan ke dasbor.',
  RECOVERY_REQUIRED_TITLE: 'Sesi pemulihan tidak ditemukan atau kedaluwarsa',
  RECOVERY_REQUIRED_BODY:
    'Tautan atur ulang kata sandi hanya berlaku satu kali dan memiliki batas waktu. Silakan minta tautan baru dari halaman masuk.',
  LOGIN_ERROR_BANNERS: {
    session_expired: {
      title: 'Sesi admin telah berakhir',
      body: 'Silakan masuk kembali untuk melanjutkan pekerjaan Anda.',
    },
    profile_missing: {
      title: 'Profil admin tidak terdaftar',
      body: 'Akun autentikasi ini belum memiliki profil admin aktif. Hubungi pemilik toko untuk maintenance profil.',
    },
    profile_inactive: {
      title: 'Akun admin dinonaktifkan',
      body: 'Akses admin Anda sedang nonaktif. Hubungi pemilik toko bila diperlukan aktivasi ulang.',
    },
    recovery_expired: {
      title: 'Tautan pemulihan kedaluwarsa atau tidak valid',
      body: 'Minta tautan atur ulang kata sandi baru melalui menu Lupa kata sandi.',
    },
    recovery_invalid: {
      title: 'Tautan pemulihan tidak valid',
      body: 'Pastikan Anda membuka tautan lengkap dari email pemulihan atau minta tautan baru.',
    },
    unauthenticated: {
      title: 'Autentikasi diperlukan',
      body: 'Masuk terlebih dahulu untuk membuka area admin.',
    },
  },
  VALIDATION: {
    EMAIL_REQUIRED: 'Email wajib diisi.',
    EMAIL_INVALID: 'Format email tidak valid.',
    PASSWORD_REQUIRED: 'Kata sandi wajib diisi.',
    PASSWORD_MIN: 'Kata sandi baru minimal 8 karakter.',
    PASSWORD_MAX: 'Kata sandi maksimal 128 karakter.',
    PASSWORD_MISMATCH: 'Konfirmasi kata sandi tidak cocok.',
  },
  ERROR_INVALID_CREDENTIALS: 'Email atau kata sandi tidak sesuai.',
  ERROR_PROFILE_FORBIDDEN:
    'Akun autentikasi ini tidak memiliki profil admin aktif yang diizinkan.',
  ERROR_TOO_LARGE: 'Ukuran permintaan melebihi batas.',
  ERROR_INVALID_REQUEST: 'Permintaan tidak valid.',
  ERROR_CSRF_FORBIDDEN: 'Permintaan lintas origin tidak diizinkan.',
  ERROR_RECOVERY_SESSION:
    'Sesi pemulihan kata sandi tidak valid atau telah kedaluwarsa.',
  SHELL: {
    EYEBROW: 'Area Terproteksi · F15 Auth Baseline',
    HEADING: 'Dasbor Admin Resep Oma Kueh',
    SUBTITLE:
      'Sesi server dan peran admin telah terverifikasi. Modul CRUD bisnis diaktifkan pada tahap F16–F20.',
    ROLE_OWNER: 'Owner (Akses Global)',
    ROLE_BRANCH_ADMIN: 'Admin Cabang',
    BRANCH_ALL: 'Semua cabang (Surabaya & Bintaro)',
    LOGOUT_BUTTON: 'Keluar',
    LOGGING_OUT: 'Mengakhiri sesi…',
    BACK_TO_STOREFRONT: 'Lihat Toko Publik',
  },
} as const;
