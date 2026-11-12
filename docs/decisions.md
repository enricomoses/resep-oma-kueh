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

## D011 — Seed F04, isolasi regresi dan generated types aktual

- **Tanggal:** 12 November 2026 (Asia/Jakarta).
- **Corpus:** 21 produk = 13 reference drafts (satu setiap seri) + 8 published DEMO termasuk empat component products. Ada 25 SKU, Coffee tiga ukuran, ROK dua ukuran, bundle Regular/GF; kategori reference draft dan DEMO published terpisah (26 rows/13 seri). Unknown historical price berarti tanpa SKU, bukan mengisi harga tebakan. Semua komposisi/stock/verified diet/jadwal/harga synthetic memakai marker DEMO, tidak menyatakan owner review bisnis. Testimony asli tetap draft anonim tanpa rating/consent.
- **Clock/idempotency:** fixed 2026-11-11T00:00:00+07:00, private seed_state RLS sebagai dataset marker; seed.sql data-only INSERT missing, tidak menimpa edits atau mengganti tanggal dengan now. Live queries tetap clock server. Blank hours/Maps/Bintaro address dan fulfillment false melindungi data yang belum disetujui.
- **Assets/UI:** placeholder PNG code-generated bertuliskan DEMO diupload maintenance lokal; tidak memakai foto bisnis tanpa izin. Satu banner server pada root memenuhi disclosure F04, bukan storefront/design F05. NEXT_PUBLIC_DEMO_MODE default true; APP_ENV production menuntut explicit false. Flag bukan izin membawa seed ke produksi; reference preflight juga menolak dataset DEMO.
- **Tooling:** CLI 3.1 default local, tidak memakai --local yang sudah tidak tersedia. Wrappers pinned project/container/ports dan reject remote flags. Type generator buffer UTF-8 + format + same-directory temp + rename setelah exit 0; Database types asli dipakai seluruh SDK helpers. Generated file saja dikecualikan Knip pruning; tidak diedit manual. F01 mock table fiktif diganti products setelah typed client menolaknya, bukan melemahkan TS.
- **Checkout:** generated types memakai atribut Git LF agar schema regeneration --check tetap stabil pada Windows/Linux; file lama tetap utuh saat generator gagal. Tidak mengubah kebijakan line endings seluruh repository.
- **Policy suite:** F03 raw fixture tetap clean. Outer runner memakai disposable project/ports 55321/55322, copy migrations/tests tanpa seed, dan membersihkan hanya stack test. Normal DEMO/edit owner 54321/54322 dipertahankan; tidak sementara menghapus/mengembalikan dataset user untuk mendapat PASS.
- **Production reference:** manifest awal hanya confirmed branches/contact facts. Default offline dry-run; remote read/apply tidak dijalankan. Future explicit target/name check, private before/after review file, digest/ref confirmation dan update-field allowlist + expectedUpdatedAt/atomic rollback diperlukan. Existing owner status/fulfillment/pricing/role tidak masuk update allowlist.

## D012 — F05 fondasi visual terbatas dan native modal

- **Tanggal:** 12 November 2026 (Asia/Jakarta).
- **Identitas:** menerapkan konsep yang sudah dipatok PRD, bukan memilih ulang brand. Hex hanya globals.css; cream/burgundy sementara belum logo-identical. Next font self-host Plus Jakarta Sans, Fraunces dan Barlow Condensed terbatas campaign/DEMO. Tidak menambah paket/shadcn atau memakai aset BEM/Fina.
- **Scope:** root RSC tetap server dan page tipis; hanya komposisi pratinjau. Komponen digunakan root atau fixture test-only Vite loopback, tanpa route playground produksi. Tidak membuat navigasi/cabang F06 atau katalog/Home domain F07. Container query menjaga kolom editorial turun ketika ruang efektif menyempit pada zoom.
- **Modal:** native showModal untuk top layer/inert dan semantics browser; explicit endpoint wrap Tab melengkapi browser yang mengalihkan fokus ke chrome. Hook mengembalikan fokus, menyimpan overflow sebelumnya, memakai reference-counted locks untuk panel bertumpuk dan cleanup unmount. Tidak meniru aria-modal atau memakai timeout animasi.
- **Aset:** karena logo/foto asli berizin belum ada, root memakai bidang berlabel DEMO secara eksplisit, bukan foto sintetis. Release tetap membutuhkan aset dan owner review. Tidak ada klaim harga/stok/cerita/testimoni baru.
- **Bukti:** browser Chromium production root + fixture dengan CSS/font build nyata, DOM unit tests dan axe. CSS zoom 200% bukan pengujian OS/native toolbar zoom atau screen reader manusia. CI kini menjalankan harness browser yang tersedia; hasil hosted CI belum diketahui. Tidak ada perubahan kontrak PRD, migration, DB, auth, transport atau lockfile.

## D013 — F06 konteks cabang, shell dan fallback terbatas

- **Tanggal:** 12 November 2026 (Asia/Jakarta).
- **Domain:** directory endpoint `/api/branches` memakai data.items + resolvedBranchId untuk menyelesaikan stable code ke UUID aktif pada server; list kosong 200 terpisah dari 503. Request-time RSC dengan connection/Suspense dan initial status, no-store anon reads, tanpa self-fetch/admin session. SDK read retry dimatikan pada query ini agar deadline 5 detik dan retry UI tidak bertumpuk.
- **State:** Zustand per provider dengan skipHydration dan whitelist selectedBranchId. URL lebih kuat daripada preference, invalid/inactive tidak diam-diam fallback. URL sendiri tidak menulis storage. Directory lookup key code berbeda dari future pricing key yang wajib resolved UUID. Helper URL mempertahankan filter/hash.
- **Cart:** hanya empty summary count 0 pada shell, bukan cart feature. Provider menyiapkan callback conflict/revalidation F12, selector fail closed untuk nonempty cart tanpa approval callback; tidak ada reset item. F12 tetap wajib menangani perubahan URL eksternal dan validasi checkout server.
- **Shell:** nav/footer aktif, drawer native F05, skip link, allowlisted preparation routes agar tautan belum-domain tetap jujur. Satu slot chat informatif, tanpa provider/input/history. Tidak membuat katalog/Home/About/contact/policy domain.
- **Kontak:** DB active public contacts saat tersedia, approved server-only fallback dari PRD/F04 saat unavailable; fallback tidak memberikan is_active/UUID/harga/stock/fulfillment. Aset dan data bisnis release masih pending, tidak menebak Bintaro/Maps/hours.
- **Bukti:** synthetic browser/transport tests dibedakan dari local production HTTP nyata. Harness lokal hanya menyuntikkan anon key memori untuk build/start, menjaga snapshot DB/Storage dan .env. Tidak ada migration/reset/remote atau perubahan lockfile. Kontrak aktual pada branches.md; PRD tidak diubah.

## D014 — F07 Home data-driven seluruh section, isolasi per section, dan batas follow-up F09/F21/F24

- **Tanggal:** 12 November 2026 (Asia/Jakarta).
- **Komposisi dan urutan:** `src/app/(site)/page.tsx` tipis memanggil `getHomeData()` langsung di RSC (di balik `await connection()`, tanpa self-fetch `/api`). `HomeView` hanya mengelola data/status/komposisi 9 section utama secara berurutan di antara Header dan Footer `(site)`: Hero (`#home-hero`), Shop by Series (`#home-series`), Featured Bakes (`#home-featured`), Our Little Story + Custom Business B2B teaser (`#home-story`), Current Treats (`#home-treats`), Bake with Oma (`#home-classes`), What They Say (`#home-testimonials`), Find Us (`#home-find-us`), dan Instagram/Community (`#home-community`).
- **Isolasi per section & privasi kolom:** `getHomeData` membungkus 6 pembaca domain (`site_content`, `categories`, `products`, `promotions`, `class_sessions`, `testimonials`) secara independen dengan `{ status: 'success', data } | { status: 'error' }`, deadline 5 detik, dan `retry(false)`. Kegagalan satu query hanya menampilkan feedback error pada section tersebut tanpa meruntuhkan halaman. Proyeksi kolom mematuhi grant kolom F03 (`site_content` tanpa `updated_by`; `testimonials` tanpa `consent_reference`/`consent_at`).
- **Kebenaran waktu, consent, dan narasi:** domain menyaring ulang `promotions` (`starts_at <= now < ends_at`, `status = 'published'`, `is_enabled = true`) dan `class_sessions` (`starts_at > now`, `status = 'scheduled'`, `is_registration_open = true`, deadline belum lewat, `seats_left > 0` atau `null`, program `published`, cabang aktif) dengan clock yang dapat diinjeksi pada unit test. Sesi lampau/penuh dan promo kedaluwarsa/mendatang tidak pernah tampil sebagai aktif/upcoming. Testimonial tanpa consent tetap draft di DB dan menghasilkan state kosong yang jujur tanpa ulasan rekayasa. Narasi brand memakai company profile/proposal pada PRD §27.1 tanpa mengarang nama pendiri atau tahun berdiri.
- **Batas integrasi lanjutan (F09/F21/F24):** karena kalkulator harga cabang shared baru dibangun pada **F09**, kartu Featured Bakes menampilkan badge, kategori seri utama, deskripsi, catatan eksplisit bahwa harga cabang final terhubung pada F09, serta CTA ke `/menu` yang mempertahankan parameter `branch` (tanpa hardcode angka harga fixture di JSX). Kartu Current Treats dan Bake with Oma merespons pilihan cabang aktif dari `useBranches()`, namun alur katalog penuh (`F09`), pendaftaran kelas WhatsApp (`F21`), dan penyempurnaan SEO/a11y/performa lintas halaman (`F24`) tetap berada pada fitur masing-masing.
