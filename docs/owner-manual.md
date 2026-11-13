# Panduan Operasional & Handover Owner — Resep Oma Kueh (F26)

Dokumen ini menjadi pegangan harian **Owner** dan **Branch Admin** dalam mengelola katalog, stok, kontak cabang, promosi, kelas, konten berizin, pemulihan akun, backup, kuota hosting, serta kontrol darurat AI (**Kill Switch**).

Rujukan lanjutan: [panduan UAT F25](uat-f25.md), [deployment runbook](deployment.md), [keamanan portal](security.md).

---

## 1. Operasional Harian Katalog & Cabang (`/admin`)

### A. Menambah atau Memperbarui SKU, Varian, & Harga

- Login sebagai **Owner** melalui `/admin/login` → masuk ke **Produk** (`/admin/products`).
- Untuk produk baru, status awal selalu **Draft** dan memerlukan kategori terpublikasi, minimal 1 varian aktif dengan harga IDR valid, foto approved di bucket publik (`product-images`), serta persetujuan `needs_owner_review = false` sebelum dapat diubah ke **Published**.
- Perubahan harga dasar varian dilakukan dari editor produk; **pengecualian harga per cabang** (`priceOverrideIdr`) dikelola Owner dari tab penawaran cabang atau menu **Stok & Harga Cabang** (`/admin/availability`).

### B. Menandai Produk Habis (`Sold Out`) atau Berhenti Ditawarkan

- **Owner atau Branch Admin** cabang terkait membuka **Stok & Harga Cabang** (`/admin/availability`).
- Setel angka stok ke `0` atau ubah status ke **`Habis` (`sold_out`)** (otomatis mencegah item dibeli pada checkout sambil tetap terlihat sebagai informasi menu jika masih `is_listed = true`).
- Untuk menyembunyikan varian dari cabang tertentu sementara, matikan sakelar **`Ditampilkan` (`is_listed = false`)** — hanya memengaruhi cabang milik admin tersebut.

### C. Mengubah Nomor WhatsApp, Jam Operasional, & Fulfillment Cabang

- Login sebagai **Owner** → buka **Lokasi Cabang** (`/admin/locations`).
- **Nomor WhatsApp:** Masukkan nomor dengan awalan kode negara (`628...`), tanpa `+`, spasi, atau tanda hubung. Setelah menyimpan, **wajib uji ulang link WhatsApp** di `/contact` dan Step-2 `/checkout` tanpa perlu memaksa kirim pesan.
- **Alamat & Google Maps:** Gunakan URL **HTTPS** resmi (`https://...`). Alamat yang belum terkonfirmasi (mis. Bintaro bila belum final) biarkan `null` agar sistem tidak memalsukan lokasi.
- **Jam Operasional:** Atur per hari (WIB) dengan flag tutup bila libur (aturan saat ini mendukung satu interval per hari dengan jam buka `<` jam tutup).
- **Fulfillment (`allow_pickup` / `allow_delivery`):** Aktifkan hanya setelah cabang siap menerima pesanan melalui alur konfirmasi WhatsApp manual.

---

## 2. Promosi Kadaluarsa, Baking Class, & Izin Konten/Testimoni

### A. Promo Kadaluarsa (`Expired`)

- Buka **Promosi** (`/admin/promotions`) sebagai **Owner**.
- Promo dengan tanggal berakhir (`endsAt` WIB, eksklusif) yang sudah lewat otomatis berstatus **`Ended`** pada UI dan tidak lagi dihitung oleh kalkulator API/checkout.
- Untuk merapikan daftar atau menonaktifkan promo lama lebih awal, matikan `is_enabled` atau arsipkan promo melalui tombol **Arsipkan (`Archive`)** agar tidak mengotori histori aktif.

### B. Sesi Baking Class & Penutupan Pendaftaran

- **Owner** mengelola program kelas (`/admin/classes`, termasuk foto cover berizin di `class-images` untuk publikasi program).
- **Owner atau Branch Admin** mengelola **Sesi Kelas** pada cabangnya (`starts_at`, `ends_at`, `registration_deadline_at` dalam tampilan **Asia/Jakarta**, `capacity`, `seats_left`).
- Jika kuota penuh atau kelas dibatalkan mendadak, ubah status sesi menjadi **`full`** atau **`cancelled`** (atau tutup sakelar pendaftaran) — endpoint `/api/classes/prepare-registration` akan langsung menolak pendaftaran baru.
- **Aturan privasi:** Situs tidak mengumpulkan biodata anak ataupun memproses pembayaran kelas secara otomatis; pendaftaran berlanjut lewat WhatsApp cabang penyelenggara kelas.

### C. Publikasi Testimoni & Foto Kelas Ber-Consent

- Pada **Testimoni** (`/admin/testimonials`), draf testimoni hanya bisa diubah ke **`published`** bila Owner mengisi **tanggal izin (`consent_at`)** dan **referensi bukti izin privat (`consent_reference`)** (mis. ID arsip chat internal tanpa menaruh screenshot/data pribadi customer di repo atau bucket publik).
- Bagian **What They Say** di Home otomatis tersembunyi bila belum ada testimoni terpublikasi dengan consent lengkap.
- Untuk foto yang menampilkan wajah anak/peserta Baking Class, pastikan persetujuan tertulis orang tua/wali tercatat sebelum diunggah ke bucket publik `class-images`.

---

## 3. Account Recovery, Backup, & Restore

### A. Pemulihan Akun Admin (`Reset Password`)

1. Buka `/admin/login` → klik **Lupa Kata Sandi?** (`/admin/reset-password`).
2. Masukkan email admin terdaftar; tautan pemulihan dikirim melalui **Custom SMTP** menuju `/auth/callback` → halaman atur kata sandi baru.
3. **Jika admin kehilangan akses email atau akun perlu dinonaktifkan segera:** Owner/Operator masuk ke **Supabase Dashboard → Authentication → Users** dan tabel `public.admin_profiles` untuk menonaktifkan `is_active = false` atau mengganti email/reset akun. Pencabutan profil berlaku langsung pada request server berikutnya.

### B. Prosedur Backup & Restore Rutin

- Karena **Supabase Free tidak menyertakan backup otomatis harian/PITR**, lakukan cadangan berkala (minimal mingguan atau sebelum/sesudah pembaruan katalog besar):
  1. **Backup Database:** Ekspor dump Postgres terenkripsi dari dashboard/CLI maintenance tepercaya dan simpan di penyimpanan privat terenkripsi (di luar Git).
  2. **Backup Media Storage (Terpisah):** Unduh seluruh objek dari 4 bucket (`product-images`, `class-images`, `brand-assets`, `media-drafts`) — **dump DB tidak menyalin file Storage**.
- **Target Pemulihan (PRD §27.7):** **RPO 24 jam** dan **RTO 1 hari kerja** melalui mekanisme restore snapshot + upload ulang media + verifikasi `npm run smoke:runtime`.

---

## 4. Monitoring Kuota, Budget Alerts, & AI Kill Switch

### A. Monitoring Kuota & Peringatan Biaya

- **Netlify Dashboard (Hosting Web):** Pantau pemakaian **300 kredit/bulan** (terutama web bandwidth 20 kredit/GB dan jumlah deploy produksi 15 kredit/deploy). Jika kredit mendekati habis, Free tier melakukan **hard stop** (situs berhenti sementara sampai siklus bulan berikutnya atau upgrade plan) — **tidak ada tagihan kejutan**, tetapi pemilik bisnis harus siap meng-upgrade plan bila trafik melonjak.
- **Supabase Dashboard (DB & Storage):** Pantau ukuran DB (batas 500 MB), Storage (batas 1 GB), dan egress (batas 5 GB standar + 5 GB cached/bulan). Aktifkan notifikasi kuota di pengaturan organisasi Supabase serta cek rutin minimal **seminggu sekali** agar project Free tidak terkena **auto-pause 7 hari inaktivitas**.

### B. Mematikan Fitur AI Generatif (Kill Switch `CHAT_PROVIDER_ENABLED=false`)

Jika mode AI generatif F23 pernah diaktifkan (`CHAT_PROVIDER_ENABLED=true`) dan terjadi lonjakan biaya API Google AI / kuota Redis limiter atau perilaku tidak diinginkan:

1. Buka **Netlify Dashboard → Site configuration → Environment variables** untuk environment produksi.
2. Ubah **`CHAT_PROVIDER_ENABLED`** menjadi **`false`** (opsional: hapus/kosongkan `GOOGLE_GEN_AI_API_KEY` bila ingin memutus akses kunci sepenuhnya).
3. Jalankan **Trigger deploy** (atau _Clear cache and deploy site_) agar fungsi runtime server membaca environment terbaru.
4. **Hasil:** Widget **Ask Oma** tetap hidup di toko memakai mode **F22 deterministik (SELECT-only tanpa panggilan LLM dan tanpa biaya token)**, dan seluruh request tetap aman serta read-only. Jika ingin menyembunyikan seluruh widget chat dari tampilan publik sekaligus, ubah `NEXT_PUBLIC_CHAT_WIDGET_ENABLED` menjadi `false` lalu deploy ulang.
