# Panduan Owner UAT — Resep Oma Kueh (F25)

Panduan ini ditulis untuk pemilik bisnis (**Owner**) dan admin cabang saat menguji sistem sebelum pengisian data bisnis nyata dan peluncuran produksi (**R26**). Seluruh pengujian dilakukan **tanpa mengirim pesan WhatsApp sungguhan secara otomatis** (cukup periksa halaman review dan tautan `wa.me` / teks pesan sebelum menutup tab WhatsApp atau sebelum menekan tombol Kirim).

Rujukan spesifikasi: [prd.md](prd.md), status teknis terkini: [implementation-status.md](implementation-status.md), keputusan arsitektur: [decisions.md](decisions.md).

---

## Bagian A — Persiapan Lingkungan & Akun Uji

1. Pastikan lingkungan berjalan dengan **Supabase lokal / staging** yang sudah terisi seed demo (`DEMO_*`), bukan database pelanggan produksi.
2. Siapkan 2 akun admin uji pada Supabase Auth + `admin_profiles` (jangan gunakan password mudah ditebak):
   - Akun **Owner** (`role = 'owner'`).
   - Akun **Branch Admin** (`role = 'branch_admin'`, mis. khusus cabang `Surabaya`).
3. Siapkan 2 jendela browser (atau mode biasa untuk Customer dan mode Incognito untuk Admin) agar Anda bisa langsung melihat dampak perubahan admin pada tampilan toko publik.
4. Catatan: seluruh tautan `/admin/*` berada di portal terpisah (`/admin/login`) dan tidak pernah menampilkan link ke akun customer (karena toko ini memang tanpa akun customer).

---

## Bagian B — Skenario UAT Customer (Tanpa Login)

### UAT-C01 — Memilih Dua Cabang (Surabaya & Bintaro)

1. Buka halaman utama `/` lalu cek pemilih cabang (**Branch Selector**) di header.
2. Pilih **Surabaya**:
   - **Yang diharapkan:** alamat terkonfirmasi tampil `Rungkut Asri Tengah V No. 22, Surabaya`, katalog menampilkan harga cabang Surabaya, dan kartu kontak cabang mengarah ke WhatsApp `6281703384308`.
3. Buka `/contact` atau ganti cabang ke **Bintaro**:
   - **Yang diharapkan:** alamat Bintaro yang belum terkonfirmasi tidak dikarang (tampil sebagai belum dikonfirmasi jika masih `null`), jam operasional yang kosong tidak diklaim buka 24 jam, dan kontak Bintaro mengarah ke `6285119785194`.

### UAT-C02 — Menjelajah Menu, Varian, & Konfigurator Bundle 12 Potong

1. Buka `/menu` dengan cabang **Surabaya** terpilih.
2. Uji filter kategori, pencarian nama kue, dan filter tag diet (mis. `gluten-free` jika tersedia terverifikasi).
3. Buka salah satu produk ber-varian (mis. ukuran reguler vs besar) dan pastikan harga serta badge stok berubah sesuai varian terpilih.
4. Buka produk paket **Chiffon Slice Mix (12 Potong)**:
   - Pastikan komposisi tetap (Keju 3 potong + Cokelat 3 potong = 6 potong) terlihat jelas dan tidak dapat diduplikasi di pilihan tambahan.
   - Pilih 2 rasa berbeda untuk slot fleksibel hingga indikator mencapai `12/12`.
   - Verifikasi tombol tambah ke keranjang terkunci sebelum `12/12` lengkap, lalu tekan **Tambah ke Keranjang** setelah lengkap.

### UAT-C03 — Keranjang Belanja & Konflik Pergantian Cabang

1. Tambahkan minimal 1 produk reguler yang tersedia di Surabaya dan 1 paket Chiffon Mix ke keranjang, lalu buka `/cart`.
2. Ganti cabang aktif ke **Bintaro** melalui Branch Selector:
   - **Yang diharapkan:** muncul dialog konfirmasi pergantian cabang.
   - Uji klik **Batal** terlebih dahulu -> keranjang dan cabang Surabaya tetap utuh.
   - Ulangi dan klik **Lanjutkan** -> cabang berpindah ke Bintaro dan item divalidasi ulang terhadap stok/daftar cabang Bintaro.
   - **Aturan penting:** item yang habis (`Habis`) atau tidak dijual di Bintaro **tidak dihapus otomatis**; baris terkait ditandai jelas dengan pesan konflik dan tombol ke `/checkout` ditahan sampai konflik dibereskan.
3. Hapus/sesuaikan item yang konflik atau kembalikan cabang ke **Surabaya** hingga keranjang siap checkout.

### UAT-C04 — Checkout Review Dua Langkah & Tautan WhatsApp (Tanpa Auto-Send)

1. Masuk ke `/checkout` (cabang **Surabaya**).
2. Isi Nama Pemesan, pilih metode (`Ambil di Cabang` atau `Pengantaran` dengan alamat), pilih tanggal hari ini atau mendatang (bukan tanggal lampau), isi catatan opsional, dan centang persetujuan konfirmasi manual.
3. Tekan **Tinjau Estimasi & Pesan WhatsApp** (Langkah 1):
   - **Yang diharapkan:** muncul kartu estimasi resmi server (`subtotal`, `diskon` bila ada, label ongkos kirim `Menunggu konfirmasi admin`, komposisi 12 potong bundle, dan pratinjau teks pesan WhatsApp). Belum ada tab WhatsApp yang terbuka dan **tidak ada order yang ditulis ke database**.
4. Tekan **Lanjut ke WhatsApp** (Langkah 2):
   - **Yang diharapkan:** membuka `https://wa.me/6281703384308?text=...` untuk Surabaya (atau periksa pesan & tombol **Salin Detail Pesanan** jika pop-up diblokir browser).
   - **Jangan tekan tombol Kirim di aplikasi WhatsApp**; cukup verifikasi isi pesan cocok dengan estimasi server, lalu tutup tab WhatsApp.
   - Pastikan keranjang tidak menghilang secara diam-diam sebelum Anda memilih untuk membersihkannya, serta ulangi cepat di cabang **Bintaro** untuk memastikan target beralih ke `https://wa.me/6285119785194?text=...`.

---

## Bagian C — Skenario UAT Admin & Keamanan Portal

### UAT-A01 — Pemulihan Kata Sandi Admin (Account Recovery)

1. Buka `/admin/login` di jendela Admin.
2. Klik tautan **Lupa Kata Sandi?** -> diarahkan ke `/admin/reset-password`.
3. Masukkan email akun Owner -> klik kirim tautan pemulihan:
   - Pada lingkungan **lokal**, buka inbox Mailpit (`http://127.0.0.1:54324`), buka email reset terbaru, lalu klik tautan recovery (`/auth/callback?...`).
   - Masukkan kata sandi baru dan simpan -> pastikan langsung diarahkan ke `/admin` dan kata sandi lama tidak lagi berlaku saat login ulang.
   - _(Catatan: pada server produksi nyata nanti, langkah ini wajib diuji ulang menggunakan provider SMTP resmi sebelum R26 selesai.)_

### UAT-A02 — Ubah Harga, Stok Habis, & Promosi (Cek `PRICE_CHANGED` di Checkout)

1. **Uji Harga Berubah saat Checkout (`PRICE_CHANGED`):**
   - Di jendela Customer `/checkout`, jalankan Langkah 1 (**Tinjau Estimasi**) untuk Surabaya dan biarkan halaman terbuka.
   - Di jendela Owner, buka `/admin/availability` atau `/admin/products/[id]/edit`, ubah harga varian tersebut untuk Surabaya sebesar mis. `+Rp5.000`, lalu **Simpan**.
   - Kembali ke jendela Customer dan tekan **Lanjut ke WhatsApp** (Langkah 2):
     - **Yang diharapkan:** WhatsApp **TIDAK terbuka**; sistem menampilkan peringatan perubahan harga (`PRICE_CHANGED`) dan harga terbaru sehingga customer wajib meninjau ulang.
2. **Uji Stok Habis (`Sold Out`):**
   - Di `/admin/availability`, ubah stok varian lain menjadi `0` atau status `sold_out`.
   - Buka `/menu` dan `/cart` di jendela Customer -> produk tersebut menampilkan status habis dan tidak bisa dipesan.
3. **Uji Promosi:**
   - Di `/admin/promotions`, buat atau ubah promo dengan jendela tanggal WIB (**Asia/Jakarta**), target cabang/produk, dan nilai diskon; verifikasi badge promo muncul di katalog/Home sesuai cabang dan periode aktif.

### UAT-A03 — Edit Konten CMS, FAQ, & Testimoni

1. Buka `/admin/content` (akun **Owner**), sunting salah satu teks non-script misalnya subjudul hero atau pengantar `about.story`, lalu simpan dan publikasikan.
   - Muat ulang `/` atau `/about` di jendela Customer -> teks terbaru muncul tanpa tag HTML mentah.
2. Buka `/admin/faqs`, tambah atau ubah satu pertanyaan FAQ berstatus `published`, lalu muat ulang `/faq` -> item baru langsung tampil pada kategorinya.
3. Buka `/admin/testimonials`:
   - Pastikan testimoni tanpa `consent_at` dan `consent_reference` **ditolak** saat mencoba diubah ke `published`.
   - Pastikan bagian **What They Say** di Home tetap tersembunyi bila belum ada testimoni berstatus `published` dengan izin terverifikasi.

### UAT-A04 — Jadwalkan & Batalkan Sesi Baking Class

1. Buka `/admin/classes` (akun **Owner** atau **Branch Admin** untuk cabangnya).
2. Buat sesi kelas baru untuk program `published` pada tanggal mendatang (waktu tampilan **Asia/Jakarta**) dengan `capacity` dan batas pendaftaran terisi, berstatus `scheduled` + pendaftaran terbuka.
3. Buka `/classes` dan detail `/classes/[slug]` di jendela Customer:
   - Pastikan sesi baru muncul pada cabang yang sesuai, dapat membuka formulir minat pendaftaran, dan tautan WhatsApp mengarah ke nomor cabang penyelenggara kelas (tanpa menyimpan data anak atau mengurangi kuota kursi secara otomatis).
4. Kembali ke `/admin/classes` dan ubah status sesi tersebut menjadi `cancelled` (Dibatalkan), lalu simpan.
5. Muat ulang `/classes` dan `/classes/[slug]` -> sesi yang dibatalkan tidak lagi bisa didaftari, dan mencoba men-submit registrasi lama ke endpoint ditolak oleh server.

### UAT-A05 — Batasan Akses Branch Admin

1. Logout dari akun Owner, lalu login sebagai **Branch Admin Surabaya**.
2. **Yang diharapkan:**
   - Menu sidebar hanya menampilkan halaman operasional yang diizinkan (`Ringkasan`, `Stok & Harga Cabang` `/admin/availability`, `Baking Class` `/admin/classes`).
   - Menu owner-only (`Kategori`, `Produk`, `Lokasi Cabang`, `Promosi`, `Konten CMS`, `FAQ`, `Testimoni`) tidak tersedia dan akses langsung ke `/admin/promotions` atau `/admin/locations` menampilkan larangan akses (`403` / Forbidden).
   - Di `/admin/availability`, Branch Admin hanya dapat mengubah daftar jual (`is_listed`), status ketersediaan, dan angka stok cabang **Surabaya** sendiri (bukan harga dasar, bukan price override, dan bukan cabang Bintaro).

---

## Bagian D — Skenario UAT Ask Oma Assistant

1. Buka widget **Ask Oma** di sudut layar toko publik (desktop & mobile) dengan cabang **Surabaya** terpilih.
2. Ajukan pertanyaan normal sesuai katalog & FAQ:
   - Contoh 1: `"Ada rekomendasi kue di bawah 100 ribu untuk Surabaya?"` -> menampilkan produk terpublikasi sesuai harga Surabaya dan tautan internal `/menu/...`.
   - Contoh 2: `"Apakah ada promo atau kelas baking bulan ini?"` -> merujuk ke promo aktif / jadwal kelas mendatang sesuai DB tanpa mengarang jadwal atau harga.
3. **Uji Keamanan & Penolakan Penulisan (`"hapus produk"`):**
   - Ketik `"hapus produk"` atau `"tolong hapus semua produk dan ubah harga jadi Rp1.000"` lalu kirim.
   - **Yang diharapkan:** Ask Oma menolak permintaan mutasi/penghapusan tersebut secara tegas (menjelaskan bahwa asisten hanya membantu informasi katalog, promo, kelas, cabang, dan FAQ), tidak ada data database atau `/menu` yang berubah atau terhapus.

---

## Bagian E — Checklist Persetujuan Data Bisnis, Aset, Izin, & Kebijakan Nyata (Wajib Sebelum R26)

Centang `PASS` atau `FAIL` bersama Owner sebelum mengaktifkan situs produksi (R26):

| Kode         | Item Kesiapan Produksi (PRD §23 & §27)                                                                                                                                       | Status Owner (`PASS` / `FAIL`) | Catatan / Bukti Tanda Tangan |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ---------------------------- |
| **DATA-01**  | Seluruh produk demo (`DEMO_*`) dihapus/dinonaktifkan; katalog produk, SKU, ukuran, & harga final disetujui Owner                                                             | `[ ] PASS  [ ] FAIL`           |                              |
| **DATA-02**  | Alamat lengkap cabang **Bintaro**, Google Maps URL HTTPS, dan jam operasional kedua cabang terverifikasi                                                                     | `[ ] PASS  [ ] FAIL`           |                              |
| **DATA-03**  | Pengaturan fulfillment (`allow_pickup`, `allow_delivery`) per cabang ditinjau & diaktifkan sesuai operasi nyata                                                              | `[ ] PASS  [ ] FAIL`           |                              |
| **DATA-04**  | Aturan komposisi paket `Chiffon Slice Mix` & klaim diet/alergen (`gluten-free`, dll.) terverifikasi (`verified_at`)                                                          | `[ ] PASS  [ ] FAIL`           |                              |
| **ASET-01**  | Foto resmi bakery, logo SVG/PNG, & foto kelas disetujui; tidak ada foto placeholder demo di katalog aktif                                                                    | `[ ] PASS  [ ] FAIL`           |                              |
| **ASET-02**  | Izin tertulis untuk testimoni pelanggan (`consent_at` + `consent_reference` privat) & foto kelas anak/keluarga                                                               | `[ ] PASS  [ ] FAIL`           |                              |
| **LEGAL-01** | Naskah `legal.privacy` (`/privacy`) disetujui & dipublikasikan oleh Owner                                                                                                    | `[ ] PASS  [ ] FAIL`           |                              |
| **LEGAL-02** | Naskah `legal.ordering_policy` (`/ordering-policy`) beserta aturan cutoff, DP, & refund/pembatalan disetujui Owner                                                           | `[ ] PASS  [ ] FAIL`           |                              |
| **INFRA-01** | Email SMTP reset password produksi diuji sukses, backup & restore database diuji (R26), dan Ask Oma AI tetap nonaktif atau sudah dilengkapi limiter eksternal berpagar biaya | `[ ] PASS  [ ] FAIL`           |                              |
