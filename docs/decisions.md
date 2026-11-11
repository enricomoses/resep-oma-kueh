# Keputusan proyek — Resep Oma Kueh

## D001 — Commit dan push otomatis per fitur

- **Tanggal:** 12 November 2026 (Asia/Jakarta).
- **Sumber:** permintaan owner untuk merapikan commit per fitur, dikonfirmasi dengan jawaban “Commit dan push per fitur”.
- **Keputusan:** setelah setiap Fxx yang ditugaskan selesai dan gate wajib lulus, agen membuat satu commit terpisah lalu push ke remote GitHub bakery yang telah diverifikasi, tanpa meminta izin ulang. Aturan lengkap ada di `AGENTS.md`.
- **Batas:** hanya perubahan fitur terkait, termasuk tes/migration/dokumentasi; perubahan pengguna yang tidak terkait tetap dipertahankan. Tidak ada force-push, amend commit yang sudah di-push, reset, perubahan remote, atau merge otomatis. Perbaikan setelah commit memakai commit tambahan dengan scope Fxx yang sama.
- **Bukti:** laporan fitur mencatat hash commit, branch, dan hasil push atau blocker sebenarnya. Gate wajib FAIL/BLOCKED/NOT RUN tidak dianggap fitur selesai.
- **Dampak kontrak:** menggantikan ketentuan commit/push manual per fitur pada PRD dan execution guide. Tidak memberikan izin deployment, pengiriman pesan, atau migration/reset database remote. Perubahan aturan ini sendiri bukan implementasi Fxx.

## D002 — Baseline F00 dipertahankan dan gap setup dipisahkan

- **Tanggal:** 12 November 2026 (Asia/Jakarta).
- **Konteks:** audit F00 pada repo bakery membuktikan Node 24.18.0, Next 16.4.6, React/react-dom 19.3.0, manifest/lock konsisten, serta lint/build/typecheck scaffold lulus. Registry Next/create-next-app latest tetap 16.4.6; React memiliki patch 19.3.1.
- **Keputusan:** tidak scaffold ulang, mengganti UI, menambah domain, atau upgrade paket massal. Cache Components dan Partial Prefetching yang sudah ada dipertahankan karena didukung docs versi terpasang dan build lulus; default public reads tetap uncached sesuai PRD §25.3 saat domain ditambahkan.
- **Gap nyata:** Vite dan Testing Library DOM peer belum terpasang, types Node 20 tidak memenuhi peer Vitest 5; URL/key Supabase kosong, stack lokal belum berjalan, script/harness F01–F04 belum ada. Perbaikannya dijadwalkan pada fitur fondasi terkait. Tidak mengklaim test/DB/RLS PASS dari build atau CLI version.
- **Dampak:** F00 PASS berarti audit lengkap dengan blocker spesifik sesuai acceptance F00, sedangkan R01 lengkap, kesiapan test/DB, dan release tetap belum PASS. Bukti/perintah dan pending data ada di [implementation-status.md](implementation-status.md). Kontrak fitur produk tidak berubah.

## D003 — Commit audit hanya memuat dokumen dan aturan terkait

- **Tanggal:** 12 November 2026 (Asia/Jakarta).
- **Konteks:** .gitignore pengguna meng-ignore `docs`; package/lock/.npmrc dan konfigurasi Supabase setup manual masih berubah di working tree. Stage awal kosong.
- **Keputusan:** pertahankan seluruh file setup pengguna; lacak eksplisit hanya `docs/prd.md`, `docs/execution-guide.md`, `docs/decisions.md`, `docs/implementation-status.md` meski di-ignore, ditambah aturan AGENTS.md dari tugas sebelumnya. Gunakan satu commit F00 pada branch `codex/f00-setup-audit` lalu push sesuai D001, tanpa mengubah main/remote atau merge.
- **Batas:** penambahan dokumen kontrak yang sudah ada bukan bukti implementasi F01–F26. Aturan ignore global docs dan pengecualian .env.example diselaraskan F01. Bukti dependency lokal masih bergantung pada setup pengguna yang belum ikut commit audit; tidak mengklaim clean-clone reproducibility.

## D004 — Konfirmasi kontak publik tidak dibuka ulang

- **Tanggal pencatatan:** 12 November 2026 (Asia/Jakarta).
- **Sumber keputusan bisnis:** konfirmasi owner 11 November 2026 yang sudah dicatat pada PRD §3.1 dan §27.1; F00 tidak menambahkan sumber/izin baru dari lampiran historis.
- **Tetap final:** Gmail publik `resepoma.kueh2@gmail.com` dan alamat publik Surabaya **Rungkut Asri Tengah V No. 22, Surabaya**, beserta dua WhatsApp cabang/Instagram yang ada di PRD.
- **Masih pending:** alamat Bintaro/Maps/hours/fulfillment, SKU/harga/stock/bundle rules, diet/allergen, jadwal/promo, aset/consent, policy serta akun/recovery dan target rilis. Daftar rinci mengikuti PRD §23 dan implementation status. Tidak mengubah pending menjadi harga/claim/jadwal aktif.
