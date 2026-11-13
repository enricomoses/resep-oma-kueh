export const CLASS_PROGRAM_STATUSES = [
  'draft',
  'published',
  'archived',
] as const;

export const CLASS_SESSION_STATUSES = [
  'scheduled',
  'full',
  'cancelled',
  'completed',
] as const;

export const CLASSES_LIMITS = {
  MAX_PROGRAMS: 50,
  MAX_SESSIONS: 200,
  MAX_INCLUDED_ITEMS: 50,
  MAX_INCLUDED_ITEM_LENGTH: 160,
  MIN_AGE: 0,
  MAX_AGE: 120,
  MAX_DURATION_MINUTES: 1440,
  MAX_CAPACITY: 200,
  MAX_ATTENDEES_PER_REGISTRATION: 20,
  MAX_ADULT_CONTACT_NAME_LENGTH: 100,
  MAX_REQUEST_BYTES: 32_768,
  MAX_WA_URL_LENGTH: 4000,
  READ_TIMEOUT_MS: 10_000,
} as const;

export const CLASSES_COPY = {
  EYEBROW: 'ROK Baking Class',
  TITLE: 'Baking Class Resep Oma Kueh',
  SUBTITLE:
    'Belajar memanggang kue dan roti langsung di dapur Resep Oma Kueh. Seluruh jadwal ditampilkan dalam waktu Jakarta (WIB); ketersediaan kursi dan harga akhir dikonfirmasi admin melalui WhatsApp.',
  NO_FALSE_DATES_NOTE:
    'Hanya sesi mendatang yang benar-benar dijadwalkan ditampilkan sebagai tersedia. Materi atau poster kegiatan terdahulu tidak pernah diproyeksikan menjadi tanggal baru tanpa konfirmasi admin.',
  CAPACITY_DISCLAIMER:
    'Kapasitas dan sisa kuota bersifat perkiraan manual dan belum menjadi reservasi otomatis.',
  UNKNOWN_SEATS_NOTE:
    'Sisa kuota belum dirinci secara langsung — tanyakan kuota terkini kepada admin cabang sebelum melakukan pembayaran.',
  EMPTY_PROGRAMS_TITLE: 'Belum ada program kelas terpublikasi saat ini',
  EMPTY_PROGRAMS_BODY:
    'Program dan jadwal kelas sedang disiapkan atau dalam review Owner. Hubungi admin cabang untuk menanyakan rencana kelas berikutnya.',
  ERROR_LOAD:
    'Informasi Baking Class belum dapat dimuat saat ini. Silakan muat ulang atau hubungi admin cabang.',
  NO_FUTURE_SESSIONS_TITLE:
    'Belum ada sesi mendatang yang dibuka untuk pendaftaran',
  NO_FUTURE_SESSIONS_BODY:
    'Anda tetap dapat menanyakan perkiraan jadwal gelombang berikutnya langsung kepada admin cabang melalui WhatsApp.',
  ASK_NEXT_CLASS_CTA: 'Tanyakan Jadwal Berikutnya via WhatsApp',
  DETAIL_CTA: 'Lihat detail & jadwal kelas',
  REGISTER_SECTION_TITLE: 'Siapkan Pendaftaran via WhatsApp',
  REGISTER_SUBMIT_CTA: 'Buat Pesan Pendaftaran WhatsApp',
  REGISTER_SUBMITTING: 'Menyiapkan pesan...',
  OPEN_WHATSAPP_CTA: 'Buka WhatsApp Cabang',
  COPY_MESSAGE_CTA: 'Salin Pesan Pendaftaran',
  COPY_SUCCESS: 'Pesan pendaftaran disalin ke clipboard.',
  COPY_FAILURE:
    'Tidak dapat menyalin otomatis ke clipboard. Salin manual dari kotak teks di bawah.',
  URL_TOO_LONG_NOTE:
    'Pesan terlalu panjang untuk tautan langsung WhatsApp. Buka ruang obrolan WhatsApp lalu tempel teks pesan yang disalin.',
  PRIVACY_NO_CHILD_NOTE:
    'Cukup isi jumlah peserta dan nama kontak wali/dewasa (opsional). Data pribadi anak tidak dikumpulkan di situs dan baru dibagikan langsung bila diperlukan saat koordinasi dengan admin.',
  MANUAL_CONFIRM_LABEL:
    'Saya memahami pendaftaran ini membuka WhatsApp untuk konfirmasi kursi & harga akhir bersama admin (belum mengunci kursi atau memotong kuota secara otomatis).',
  STATUS_BADGE: {
    AVAILABLE: 'Pendaftaran Dibuka',
    FULL: 'Kuota Penuh',
    CANCELLED: 'Dibatalkan',
    CLOSED: 'Pendaftaran Ditutup',
    DEADLINE_PASSED: 'Batas Daftar Lewat',
    ENDED: 'Telah Berlalu',
    UNAVAILABLE: 'Tidak Tersedia',
  },
  WA_ERRORS: {
    VALIDATION_ERROR:
      'Periksa jumlah peserta dan pilihan sesi terlebih dahulu.',
    SESSION_NOT_FOUND: 'Sesi kelas tidak ditemukan atau sudah tidak tersedia.',
    SESSION_CANCELLED:
      'Sesi kelas ini telah dibatalkan dan tidak menerima pendaftaran.',
    SESSION_FULL: 'Kuota sesi kelas ini sudah penuh.',
    REGISTRATION_CLOSED: 'Pendaftaran untuk sesi kelas ini sedang ditutup.',
    DEADLINE_PASSED: 'Batas waktu pendaftaran untuk sesi ini telah berakhir.',
    SESSION_ENDED: 'Sesi kelas ini sudah dimulai atau telah berlalu.',
    INSUFFICIENT_SEATS:
      'Jumlah peserta melebihi sisa kuota yang tersedia pada sesi ini.',
    CAPACITY_EXCEEDED: 'Jumlah peserta melebihi perkiraan kapasitas sesi ini.',
    PROGRAM_UNAVAILABLE:
      'Program kelas belum terpublikasi untuk pendaftaran umum.',
    BRANCH_UNAVAILABLE: 'Cabang penyelenggara sesi ini sedang tidak aktif.',
    TOO_LARGE: 'Ukuran payload melebihi batas 32 KiB.',
    INVALID_REQUEST: 'Format permintaan pendaftaran tidak valid.',
    UPSTREAM_ERROR:
      'Terjadi kendala saat membaca data sesi terbaru dari server.',
  },
} as const;
