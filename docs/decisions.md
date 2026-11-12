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

## D005 — Fondasi F01 dan baseline setup yang relevan

- **Tanggal:** 12 November 2026 (Asia/Jakarta).
- **Keputusan:** pertahankan seluruh paket M03 owner dan Next/React terpasang. Manifest/lock/.npmrc dimasukkan pada commit fondasi karena dibutuhkan untuk mereproduksi transport, SDK dan tooling; tidak menghapus atau mengganti pilihan paket pengguna yang tidak terkait. Perbaikan hanya types Node 24.19.2, Testing Library DOM 10.4.2 dan Vite 8.3.8 untuk peer yang terbukti hilang/tidak cocok.
- **Konfigurasi:** Node 24.18.0/npm 11.16.x; strict TS, Prettier/Tailwind, named exports/type imports, boundary ESLint, Vitest/Playwright/Knip/CI. Ignore docs dihapus sesuai kontrak F01 dan .env.example dikecualikan dari ignore; .env.local serta konfigurasi Supabase pengguna tidak diubah.
- **Batas:** tidak membuat domain/tabel/endpoint kosong. Paket M03 yang belum digunakan fitur sekarang dipertahankan dengan pengecualian Knip eksplisit. Perubahan class order/quotes pada scaffold/PRD adalah formatter, bukan redesign. Blok Next AGENTS tetap utuh.

## D006 — Env dan Supabase terpisah tanpa klaim RLS prematur

- **Tanggal:** 12 November 2026 (Asia/Jakarta).
- **Keputusan:** env kosong untuk DB boleh pada scaffold sebelum fitur DB; adapter menolak URL/key yang belum valid saat digunakan. Error hanya nama key dan tidak menyertakan nilai/cause, termasuk exception dari custom refinement. Public env memvalidasi format publishable atau role anon legacy, bukan signature.
- **Provider:** F23 belum dipilih, sehingga flag generatif true ditolak secara fail-closed; disabled tidak memerlukan model/key. Tidak menambahkan provider/limiter SDK sekarang.
- **Session:** SSR client per request; cookie bridge menangani seluruh chunk dan header cache argumen kedua setAll pada SDK 0.12.7. Handler wajib mengoper response, RSC read-only tidak menulis cookie. Proxy matcher literal terbatas admin/auth karena static analysis Next; tidak mencakup chat/checkout publik dan tidak menggantikan guard F15.
- **Public reads:** anon client terpisah tanpa cookie/persistence/admin JWT/service-role, no-store/credentials omit. SDK helper saja tidak membuktikan SELECT-only; actual grants/RLS/RPC/Storage/JWT dan generated types menunggu F02–F04. Detail implementasi ada di [architecture.md](architecture.md).

## D007 — Bukti boundary dan risiko tooling residual

- **Tanggal:** 12 November 2026 (Asia/Jakarta).
- **Keputusan:** unit/DOM/server projects Vitest terpisah; alias server-only hanya pada server tests. Compiler Next asli menguji positive control RSC dan negative Client Component memakai modul server proyek. Fixture memakai env bersih, alias sumber eksplisit dan cleanup temp terverifikasi. Playwright hanya smoke scaffold production build, bukan storefront/DB.
- **Advisory aktual:** npm audit melaporkan 7 moderate pada rantai development typescript-eslint → minimatch 10.2.6, [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249). Versi upstream typescript-eslint 8.72.2 masih mensyaratkan minimatch ^10.2.2, sedangkan patch advisory 11.0.1 berada di major lain. Tidak memaksakan override major atau audit fix massal tanpa evaluasi API; catat risiko tooling residual dan pantau upstream. Bukan klaim runtime vulnerability atau audit security PASS.
- **CI:** template foundation memakai checkout/setup-node v7 sesuai dokumentasi resmi yang diperiksa, npm ci/check tanpa secret produksi. SQL dan full domain E2E CI ditambahkan bersama harness terkait; hasil lokal tidak dinyatakan sebagai hasil remote CI.

## D008 — Runner serial dan bukti clean install

- **Tanggal:** 12 November 2026 (Asia/Jakarta).
- **Masalah aktual:** run ulang fork worker gagal memuat konfigurasi ESLint dalam setup deadline dan worker DOM tidak mulai; suite tidak dianggap PASS. Memakai pool threads, satu worker, file serial dan inheritance eksplisit mengatasi startup pada host Windows. Isolation tetap aktif, assertion tidak dihapus, timeout produk tidak diubah. Semua 46 kasus kemudian dijalankan, bukan skipped.
- **Instalasi:** percobaan npm ci biasa dihentikan ketika belum selesai. `npm ci --no-audit --no-fund --prefer-offline` berhasil exit 0 dari lockfile yang sama; audit keamanan dilakukan terpisah dan hasil moderat D007 tetap dicatat. Npm memperingatkan ESLint 9 yang tidak lagi didukung; migrasi major tooling tidak dipaksakan pada F01 tanpa evaluasi kompatibilitas.
- **Diff dependency:** dari snapshot awal F01 hanya versi paket lama @types/node dan undici-types yang berubah; paket baru mengikuti peer DOM/Vite. Pilihan M03 lain tidak hilang. Env lokal dan konfigurasi Supabase pengguna tetap sama secara hash.

- **Hasil final D008:** thread saja belum menghilangkan timeout loader ESLint. Semua 18 kasus config dipindahkan utuh ke script Node dengan assert, terpisah dari 28 tes runtime Vitest; check menjalankan keduanya, tanpa skipped/assertion dihapus. Final check exit 0.

## D009 — Integritas schema F02 tanpa seed bisnis

- **Tanggal:** 12 November 2026 (Asia/Jakarta).
- **Keputusan:** dua migration merupakan sumber tunggal 26 tabel MVP. RLS enable dalam transaksi pembuatan, revoke runtime grants; policy/field isolation/Storage tetap F03. Private helper tidak menjadi RPC publik. Tidak ada tabel fase 2 atau generated Database type buatan.
- **Aggregate:** constraint lokal immediate dan validator lintas tabel deferred memungkinkan save aggregate atomik. BEFORE STATEMENT meng-update satu private guard row untuk serialisasi penulis dan mencegah write skew pada kategori/publication, termasuk snapshot repeatable read. Biaya validator global diterima untuk MVP; optimisasi perlu measurement, bukan menonaktifkan invariant.
- **Kontrak nyata:** metadata approval media/class review, recipe/verification serta slots fixed Cheese/Choco ditambahkan karena publish prerequisites perlu data eksplisit. Product ID mewakili rasa; SKU ukuran/formulasi. Pools boleh overlap tetapi quote F11 wajib memvalidasi selections berbeda; schema hanya menjamin konfigurasi menyediakan pasangan yang valid. GF bundle memerlukan setiap component verified. Detail/ERD/payload CMS aktual pada database.md; PRD diselaraskan.
- **Nominal/identity:** numeric(12,2) untuk discount_value agar batas fixed IDR 1 miliar tidak terpotong numeric(10,2). Unit beserta opsi/override ≤1 miliar, cap/min-spend ≤1 triliun. Slug/SKU/code dan PK immutable runtime; perubahan permalink perlu maintenance migration eksplisit.
- **Batas bukti:** metadata approved bukan verifikasi file/consent nyata, dan schema bukan bukti role isolation. Test fixture DEMO rollback, bukan izin katalog produksi. Config Supabase setup owner dipertahankan tanpa mengubah isinya; disertakan sebagai kebutuhan reproduksi local harness, bukan konfigurasi produksi. Missing seed tidak diganti seed kosong; reset F02 selalu --no-seed.

## D010 — F03 column grants, private read RPC dan Storage boundary

- **Tanggal:** 12 November 2026 (Asia/Jakarta).
- **Keputusan:** tanpa projection view; kolom note/source_note/consent/updated_by tidak memiliki SELECT bagi anon atau shared authenticated. Owner membaca lewat tiga fixed read-only RPC guarded dari profile DB. Satu anon RPC invoker hanya membaca cabang aktif. Definer helper private fixed search_path mencegah rekursi profile/RLS dan tidak menerima arbitrary SQL.
- **Staff:** INSERT/UPDATE own active branch pada public SKU/program, whitelist DB trigger, harga override baru NULL. Existing owner override dipertahankan saat availability berubah. Tidak hard-delete sesi/offer; staff memakai cancel/status/listing. Owner tetap tidak mendapat runtime write admin_profiles.
- **Storage:** percobaan audit menemukan grants managed dari supabase_storage_admin; usaha SET ROLE untuk revoke ditolak pada clean reset. Migration final tidak mengandalkan eskalasi tersebut. Managed grants tetap didokumentasikan; RLS menolak non-owner lewat endpoint nyata. Public bucket hanya approved namespace dengan upload owner; private draft signed preview owner-only. Byte/MIME dibatasi bucket, decode/dimensi/consent F17.
- **Config lokal:** signup false, exposed schemas public saja, auto exposure false. Ini tidak mengubah hosted settings; F26 harus menyelaraskan dan menguji target sebenarnya. Tidak ada auth UI atau endpoint admin/chat yang ditambahkan.
- **Bukti:** fixture Auth acak local-only, JWT sesungguhnya, SQL role-context, direct REST/Storage, actual public SDK dengan owner session, serta business/Storage snapshot. Secrets hanya memori test, bukan env aplikasi. Detail kontrak dan batas bukti pada security.md; hasil command di implementation-status.
- **SKU scope:** active SKU public harus punya own listed offer pada cabang aktif, bukan hanya mewarisi public product. Staff eligibility terpisah mengizinkan relist own unlisted SKU pada parent public; public images/mappings/promotion variant pivots tetap mengikuti visibility SKU. Ini menutup temuan review akhir tanpa menghilangkan whitelist availability staff.
- **Public media path:** namespace public memakai `approved/<random asset UUID>.<ext>` tanpa UUID admin pada URL. Izin tetap owner-only; prefix identitas hanya pada bucket draft privat. Ini menghindari membocorkan actor ID melalui nama aset publik.
