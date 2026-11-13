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

## D015 — F08 halaman brand, kontak B2B, FAQ, dan legal policy dengan pembeda template vs published

- **Tanggal:** 12 November 2026 (Asia/Jakarta).
- **Thin pages & views:** menambahkan 5 route tipis di bawah `(site)`: `/about`, `/contact`, `/faq`, `/privacy`, dan `/ordering-policy` dengan `Metadata` masing-masing dan pembacaan server domain langsung di balik `await connection()` (tanpa self-fetch `/api`). Route dinamis `src/app/(site)/[section]/page.tsx` dipersempit hanya untuk section yang belum diimplementasikan (`/menu`, `/classes`).
- **Allowlisted CMS per-key Zod & BFF refetch:** `src/validations/content.schema.ts` memvalidasi 11 key allowlisted (`business.contacts`, `home.hero`, `home.story`, `home.class_promo`, `home.custom_business`, `about.story`, `about.values`, `footer.note`, `legal.privacy`, `legal.ordering_policy`, `community.instagram`) secara strict per-key dan menolak tag HTML mentah (`/<[^>]*>/`). BFF `GET /api/content` dan `GET /api/faqs` menyediakan pembacaan `Cache-Control: no-store` untuk retry/refetch client via `src/services/content.service.ts` dan `src/hooks/use-content.ts`. Proyeksi `site_content` mengecualikan `updated_by`.
- **Pembeda template vs owner-approved published:** karena `about.story`, `about.values`, `home.custom_business`, `legal.privacy`, dan `legal.ordering_policy` berstatus `draft` pada seed lokal (sehingga disembunyikan dari `anon` oleh RLS F03), domain `getPublicContent` mengembalikan `source: 'template'` dengan naskah baseline PRD §27.1 ketika row belum `published`, dan `source: 'published'` ketika row telah disetujui/dipublikasikan di DB. UI menampilkan badge/banner eksplisit yang membedakan naskah template/draft dari kebijakan yang telah dipublikasikan owner.
- **Kebenaran narasi, kontak B2B, FAQ, dan privasi:** `/about` menampilkan 5 nilai proposal (`Authenticity`, `Craftsmanship`, `Warmth`, `Quality`, `Tradition`) serta profil tim `bakers–food scientist` dengan disclaimer eksplisit bahwa narasi tersebut bukan klaim sertifikasi medis, gelar akademik, bebas alergen universal, atau klaim kesehatan universal. `/contact` menampilkan WA Surabaya (`6281703384308`) dan Bintaro (`6285119785194`) terpisah, Gmail, Instagram, alamat Surabaya terkonfirmasi, serta status pending yang jujur untuk alamat Bintaro, Maps URL, dan jam operasional yang belum terverifikasi. Kartu B2B `Made for Your Business` memilih cabang dan membangun tautan konsultasi `https://wa.me/<nomor>?text=...` tanpa tabel leads dan tanpa mengarang estimasi MOQ/harga. `/faq` merender FAQ published dari DB ditambah panduan faktual pembayaran WA, konfirmasi stok cabang, dan pendaftaran kelas, sembari menahan aturan refund/cutoff yang belum disetujui sebagai draft. `/privacy` menjelaskan penyimpanan `selectedBranchId` dan item/qty keranjang di `localStorage`, pemrosesan kutipan checkout sementara (transient) di server (secara tegas menyatakan tidak mengklaim tidak ada data yang dikirim ke server), handoff `wa.me` atas inisiatif pengguna, dan penyedia AI opsional. CRUD CMS tetap berada pada **F20**.

## D016 — Katalog end-to-end dan kalkulator harga/promo murni bersama (F09, 12 November 2026)

- **Kalkulator harga dan promosi murni (`src/features/catalog/pricing.ts`):** Menerapkan seluruh aturan PRD §27.2 menggunakan aritmetika integer aman (`BigInt`) dan parameter `now: Date` yang dapat diinjeksi untuk pengujian deterministik maupun penggunaan ulang di checkout (F13) dan Ask Oma (F22):
  1. `computeMinRequiredOptionDeltaIdr`: menjumlahkan delta termurah dari pilihan aktif (`isActive`) pada setiap grup opsi wajib (`isRequired` atau `minSelections > 0`); mengembalikan `null` jika grup wajib tidak dapat dipenuhi.
  2. `isPromotionInActiveWindow`: memvalidasi `status === 'published'`, `isEnabled === true`, `!isStackable`, dan batas waktu `startsAt <= now < endsAt` (inklusif pada `startsAt`, eksklusif pada `endsAt`).
  3. `calculateCandidateDiscountIdr`: menggunakan pembulatan half-up basis poin integer `(BigInt(lineGrossIdr) * BigInt(bps) + BigInt(5000)) / BigInt(10000)` untuk `percentage` dan perkalian per unit `BigInt(fixedRupiah) * BigInt(quantity)` untuk `fixed`, kemudian membatasi nilai diskon terhadap `maxDiscountIdr` dan `lineGrossIdr`.
  4. `computeVariantEffectivePrice`: menghitung `basePriceIdr = (priceOverrideIdr ?? variantBasePriceIdr) + minOptionDeltaIdr`, memilih satu promosi tanpa syarat (`minSpendIdr === 0`) terbaik berdasarkan penghematan tertinggi lalu tie-break `priority DESC, id ASC`, dan memisahkan promosi bersyarat (`minSpendIdr > 0`) ke `conditionalPromotion` tanpa memotong `effectivePriceIdr` unit tunggal.
  5. `evaluateCartPromotions`: mengevaluasi `minSpendIdr` terhadap subtotal kotor dari seluruh baris keranjang yang cocok dengan target promosi sebelum diskon, lalu menerapkan satu promosi terbaik per baris tanpa penggabungan (non-stackable).
- **Kueri katalog tanpa N+1, tanpa raw `.or()` PostgREST, dan pra-paginasi (`src/features/catalog/{repository.server,service.server}.ts`):**
  - Proyeksi kolom eksplisit pada `createPublicReadClient()` tidak pernah memilih kolom internal (`variant_dietary_tags.note`, `variant_allergens.source_note`, `site_content.updated_by`, `testimonials.consent_reference`).
  - Parameter `branch` code diselesaikan ke UUID cabang aktif; pencarian literal `q` dinormalisasi dengan NFD accent stripping dan pembersihan tanda baca di domain server tanpa interpolasi string mentah ke `.or()` PostgREST.
  - Klaim diet hanya menyertakan baris yang memiliki `verification_status === 'verified'` dan `verified_at !== null`. Status ketersediaan cabang menormalisasi `stock_quantity <= 0` menjadi `'sold_out'`.
  - Seluruh penyaringan (`category`, `q`, `tag`, `availability`, `minPriceIdr`, `maxPriceIdr`) dan pengurutan (`featured`, `newest`, `price_asc`, `price_desc`, `name_asc` beserta tie-break deterministik `sort_order ASC, name ASC, id ASC`) dieksekusi sebelum pemotongan halaman (`page`, `limit`).
- **BFF, hook React Query, dan UI `/menu` + integrasi Home:**
  - `GET /api/categories` dan `GET /api/catalog` memvalidasi query parameter secara ketat (menolak parameter asing/duplikat/di luar batas dengan `400 INVALID_REQUEST`, mengembalikan `200` untuk hasil kosong, dan `503 UPSTREAM_ERROR` untuk kegagalan DB) dengan `Cache-Control: no-store`.
  - Halaman `/menu` (`src/app/(site)/menu/page.tsx`) meneruskan DTO SSR awal beserta key ternormalisasi (`serializeCatalogQueryKey` di `src/constants/catalog.constant.ts`) ke `<MenuView />` sehingga hidrasi awal tidak memicu double fetch di browser.
  - Tanpa cabang terpilih, `/menu` tetap dapat dijelajahi (seri, deskripsi, label diet terverifikasi) tanpa menampilkan harga cabang final atau aksi tambah ke keranjang.
  - Home (`src/features/home/service.server.ts` & `src/components/home/featured-bakes-section.tsx`) kini menggunakan `getCategories()` untuk `Shop by Series` dan `computeVariantEffectivePrice` untuk menampilkan harga mulai per cabang (`Mulai dari Rp...`) pada `Featured Bakes` ketika cabang dipilih.

## D017 — Halaman detail produk, varian cabang, dan informasi pangan terverifikasi (F10, 12 November 2026)

- **Thin `/menu/[slug]` async page dan metadata tanpa kebocoran draft:**
  - Route `/menu/[slug]` mematuhi Next.js 16 App Router dengan melakukan `await params` dan `await searchParams`.
  - Fungsi `generateMetadata` memanggil `await connection()` dan membaca proyeksi publik ringan `readPublishedProductBySlug(slug)` langsung dari repository server, menghasilkan metadata `title`, `description`, `openGraph`, dan `twitter` berbasis data produk yang dipublikasikan. Jika produk tidak ditemukan atau masih berstatus draft, metadata mengembalikan fallback generik tanpa membocorkan nama/deskripsi produk draft ke crawler atau pencari publik.
  - Halaman RSC memanggil `getProductDetail(...)` langsung tanpa self-fetch `/api`. Upstream database error menampilkan antarmuka kegagalan dengan tombol coba lagi (retry), bukan menyamarkannya menjadi `404 Not Found`. `notFound()` hanya dipicu jika produk berstatus bukan `published` atau tidak ditemukan di database.
- **Varian cabang aktif, kalkulator harga shared, dan status stok jujur:**
  - Detail produk menampilkan opsi ukuran dan varian langsung dari database (`product_variants`), bukan asumsi universal hardcode.
  - Untuk cabang yang dipilih, varian memuat harga dasar, penimpa harga cabang (`price_override_idr`), opsi wajib termurah, serta promosi tanpa syarat aktif melalui kalkulator harga murni bersama (`computeVariantEffectivePrice` dari `src/features/catalog/pricing.ts`).
  - Bila cabang belum dipilih, antarmuka berada dalam mode penjelajahan (browse mode) dengan pemberitahuan ramah bahwa pemilihan cabang diperlukan untuk melihat ketersediaan stok aktual dan menambahkan ke keranjang.
  - Varian yang tidak ditawarkan cabang (`is_offered === false`) disembunyikan dari pilihan cabang tersebut; varian dengan stok habis dinonaktifkan dengan badge `Stok Habis`; varian dengan status `unconfirmed` menampilkan peringatan stok belum terkonfirmasi (`Perlu konfirmasi stok cabang saat checkout`); dan seluruh varian menyertakan catatan ketersediaan cabang (`Stok dapat berubah sewaktu-waktu`).
- **Galeri responsif dan pencocokan foto varian accessible:**
  - `ProductGallery` merender foto produk utama dengan optimasi `next/image` (`sizes="(max-width: 768px) 100vw, 50vw"`, `aspect-ratio: 4/3`, `priority`).
  - Ketika varian dengan `image_url` terpilih dipilih pengguna, galeri otomatis menampilkan foto varian yang sesuai disertai badge `Foto varian terpilih`.
  - Strip thumbnail dapat diakses via keyboard (navigasi tombol, state `aria-current="true"`, dan fokus visual jelas).
- **Informasi pangan terverifikasi dan sanggahan alergen (PRD §15):**
  - Hanya menampilkan klaim diet (`variant_dietary_tags`) yang berstatus `verification_status === 'verified'` dan telah disetujui (`verified_at !== null`).
  - Tidak menampilkan klaim vegan/halal palsu atau spekulatif.
  - Komponen `ProductFoodInfo` secara tegas menyertakan sanggahan alergen (`ALLERGEN_CAVEAT`): ketiadaan label alergen bukan jaminan produk bebas kontaminasi silang (cross-contact), karena seluruh produk diproduksi di dapur bakery bersama.
  - Petunjuk penyimpanan (`storage_instructions`) dan bahan utama (`ingredients_summary`) ditampilkan sesuai data terverifikasi.
- **Kesiapan CTA Keranjang (Wiring F10 menuju F12):**
  - Mengingat persistensi keranjang (`localStorage`, sinkronisasi cabang, drawer) dan penanganan konflik baru diimplementasikan pada **F12** serta bundle rules pada **F11**, tombol CTA `+ Keranjang` memvalidasi dan menyiapkan payload bertipe `PreparedCartLinePayload` (tervalidasi melalui `preparedCartLinePayloadSchema`).
  - Setelah tombol ditekan, pengguna menerima umpan balik visual terstruktur yang merinci varian yang dipilih, jumlah, harga satuan efektif, subtotal, dan catatan integrasi F12. Hal ini memastikan tombol tidak tampak berhasil tanpa melakukan aksi apa pun, sembari tidak mengklaim fitur keranjang penuh telah selesai sebelum F12.

## D018 — Bundle Chiffon Slice Mix terstruktur dan aturan Gluten-Free terverifikasi (F11, 13 November 2026)

- **Invarian Resep & Komposisi 12 Potong Chiffon Slice Mix (PRD §7.4, §13.5, §27.2, §27.4):**
  - Paket 12 potong terdiri dari 2 rasa tetap (Keju 3 potong + Cokelat 3 potong = 6 potong via `fixedComponents`) serta 2 kelompok opsi rasa fleksibel (Group C dan Group D, masing-masing memilih 1 rasa dengan `quantity_per_selection = 3` = 6 potong via `optionGroups` dan `choices`).
  - Aturan 4 rasa berbeda (Four Distinct Flavours): Rasa Pilihan C != Rasa Pilihan D != Keju != Cokelat. Validasi domain menolak konfigurasi jika pilihan menduplikasi rasa tetap paket atau jika pilihan pada kedua grup memilih rasa yang sama. Tidak diizinkan pemilihan 4 rasa bebas tanpa struktur (no arbitrary four-flavour free selection).
  - Validasi total unit: konfigurasi harus menghasilkan tepat 12 potong (`totalUnits === targetUnitsTotal`). Jumlah di bawah atau di atas 12 (misalnya 9, 11, atau 15 potong) ditolak dengan kode `INVALID_TOTAL_UNITS`.
  - Aturan komponen & grup: pilihan harus merupakan anggota sah varian paket (`FOREIGN_CHOICE` ditolak), berstatus aktif (`CHOICE_INACTIVE` ditolak), dan mematuhi batas grup `min_select` dan `max_select` (`GROUP_SELECTION_COUNT_MISMATCH` ditolak).
- **Aturan Gluten-Free (GF) Terverifikasi:**
  - Varian Regular (`DEMO-F04-5`) dan Gluten-Free (`DEMO-F04-6`) dipisahkan secara tegas.
  - Untuk varian berklaim Gluten-Free, seluruh komponen penyusun (baik 2 rasa tetap maupun 2 pilihan rasa) wajib memiliki klaim diet `gluten-free` dengan status terverifikasi (`verification_status === 'verified'` dan `verified_at !== null`). Bila terdapat komponen yang belum terverifikasi GF, konfigurasi ditolak dengan kode `GF_UNVERIFIED_COMPONENT`.
  - Ketersediaan stok cabang: jika komponen varian berstatus `sold_out` atau tidak ditawarkan di cabang terpilih (`isOfferedInBranch === false`), validator mendeteksi dan menolaknya (`COMPONENT_SOLD_OUT` / `COMPONENT_NOT_OFFERED`).
  - Jika aturan riil paket belum diverifikasi oleh pemilik toko di database produksi (`bundle_rules_verified === false`), varian paket tetap berstatus draft dan pemesanan ditolak (`BUNDLE_NOT_VERIFIED`).
- **Penetapan Harga & Komponen Tetap Tanpa Penagihan Ganda:**
  - Harga dasar paket sudah mencakup komponen tetap (Keju 3 + Cokelat 3), sehingga komponen tetap tidak ditagih terpisah (`price_delta_idr: 0`).
  - Delta harga pada pilihan rasa (`price_delta_idr`) ditambahkan ke harga dasar varian: `unitGrossIdr = baseOrOverrideIdr + sum(choice.price_delta_idr)`.
  - Diskon promosi tanpa syarat aktif dipotong dari harga kotor: `effectivePriceIdr = max(0, unitGrossIdr - unconditionalDiscountIdr)`.
  - Seluruh perhitungan menggunakan aritmatika integer IDR aman dengan batas teknis `CATALOG_LIMITS.MAX_UNIT_IDR`.
- **Signature Keranjang Deterministik (Persiapan F12):**
  - Fungsi `generateBundleSignature(variantId, selectedChoiceIds)` menghasilkan signature kanonik berformat `${variantId}:${sortedChoiceIds.join(',')}`. Pengurutan alfabetis ID pilihan memastikan urutan pemilihan oleh pengguna menghasilkan signature yang identik, menjadi dasar penggabungan baris keranjang yang sama pada F12.
- **Arsitektur Modul Bebas Efek Samping (Boundary Client/Server):**
  - Fungsi validasi bundle murni diletakkan di `src/utils/bundle.ts` yang hanya mengimpor modul murni (`src/types/` dan `src/constants/`). Hal ini mematuhi aturan ESLint `bakery/boundaries` sehingga fungsi yang sama dapat digunakan langsung oleh hook client (`useProductConfigurator`), komponen UI (`BundleCustomizer`), maupun repository/service server (`src/features/catalog/service.server.ts`).
  - `src/features/catalog/bundle.ts` mengekspor ulang dari `@/utils/bundle` untuk kenyamanan domain server.
- **Komponen UI `BundleCustomizer` dan Integrasi `ProductVariantPicker`:**
  - UI merender daftar komponen tetap lengkap dengan badge rasa dan jumlah potong, radiogroup pilihan rasa tambahan per kelompok dengan indikator delta harga, penghitung visual progres potong kue (6/12 -> 9/12 -> 12/12), peringatan pilihan yang belum lengkap, serta banner peringatan kegagalan validasi bila terjadi konflik rasa atau stok.
  - Tombol aksi `Siapkan untuk Keranjang` di `<ProductVariantPicker />` terkunci (disabled) selama konfigurasi belum lengkap 12 potong, dan hanya aktif ketika konfigurasi valid 100%. Payload terstruktur yang disiapkan memuat rincian komposisi 12 potong (`bundleBreakdown`) dan signature kanonik untuk dihubungkan ke persistensi keranjang pada F12.

## D019 — Keranjang belanja guest terpersisten dan revalidasi konflik pergantian cabang (F12, 13 November 2026)

- **Zustand Cart Store Terpersisten Berskema Versi (PRD §4.2, §8.1, §12.3, §27.3):**
  - Menggunakan storage key `rok_guest_cart_v1` dengan `version: 1` pada `localStorage`.
  - Persistensi hanya menyimpan identitas non-sensitif: `branchId`, `branchCode`, dan baris keranjang `[{ id, branchId, variantId, choiceIds, quantity, addedAt, updatedAt }]`.
  - Tidak menyimpan nama pelanggan, nomor telepon/WhatsApp, alamat pengiriman, token otentikasi, maupun harga otoritatif di dalam `localStorage`. Seluruh harga dihitung ulang secara otoritatif di server.
  - Hidrasi aman SSR (`hasHydrated`) untuk mencegah hydration mismatch antara RSC dan browser client.
  - Penanganan payload `localStorage` yang korup atau versi yang tidak cocok ditangani secara transparan melalui fungsi migrasi/fallback yang mereset keranjang ke state awal bersih tanpa melempar exception atau memutus rendering UI.
- **Batas Integritas & Signature Kanonik Baris Keranjang:**
  - Membatasi keranjang maksimal 15 baris unik (`MAX_DISTINCT_LINES = 15`), kuantitas maksimal 99 unit per baris (`MAX_QTY_PER_LINE = 99`), dan maksimal 12 pilihan opsi unik per baris (`MAX_OPTIONS_PER_LINE = 12`).
  - Signature kanonik deterministik: `${branchId}:${variantId}:${[...choiceIds].sort().join(',')}`. Baris baru hanya digabungkan kuantitasnya jika cabang, ID varian, dan daftar ID opsi persis sama setelah diurutkan secara leksikografis; jika berbeda, baris baru ditambahkan sebagai baris terpisah.
- **Validasi Sisi Server Otoritatif (`POST /api/cart/validate`):**
  - Endpoint `POST /api/cart/validate` menerima daftar baris keranjang dan ID cabang target, memvalidasi boundary input dengan Zod `cartValidationRequestSchema`.
  - Repository server (`readCartVariantsByIds`) membaca data varian, harga dasar, override cabang, status promosi, dan komponen bundle langsung dari Supabase tanpa self-fetch.
  - Mengidentifikasi 6 kondisi konflik: `none` (aman), `sold_out` (stok habis di cabang), `not_offered` (tidak ditawarkan di cabang), `archived` (varian dinonaktifkan/dihapus), `component_unavailable` (komponen bundle habis/tidak ditawarkan), dan `price_changed` (harga satuan berubah).
  - Mengembalikan DTO bertipe `CartValidationResponse` yang memuat nama produk/varian, foto, rincian bundle, breakdown harga per unit, subtotal, total diskon, serta flag `hasBlockingConflicts`.
- **Alur Konfirmasi Pergantian Cabang (Branch Switch Guard & Conflict Flow):**
  - Jika keranjang tidak kosong saat pengguna mencoba mengganti cabang (baik via `BranchSelector` maupun perubahan query URL):
    - Dialog konfirmasi (`SITE_COPY.SWITCH_TITLE`, `SITE_COPY.SWITCH_BODY`) ditampilkan dan pergantian cabang ditahan sementara.
    - **Batal (Cancel):** Branch selector dikembalikan ke cabang awal, modal ditutup, dan seluruh isi keranjang dipertahankan tanpa perubahan.
    - **Lanjutkan (Confirm):** Cabang resmi dialihkan, keranjang disinkronkan ke cabang baru, dan seluruh item divalidasi ulang terhadap cabang baru melalui `useCart().revalidateCart()`.
    - **Tanpa Penghapusan Diam-diam (Never Silently Delete):** Item yang bermasalah di cabang baru (misal stok habis atau tidak ditawarkan) **tidak pernah dihapus otomatis dari keranjang**. Antarmuka keranjang menampilkan penanda peringatan (badge & border merah) dan pesan penjelasan pada baris terkait, serta menonaktifkan tombol checkout sampai pengguna sendiri yang memutuskan untuk menghapus atau mengganti item tersebut.
- **Antarmuka Keranjang (`/cart`) dan Integrasi Storefront:**
  - Navbar `CartBadge` terhubung ke state live Zustand dan menampilkan badge jumlah item riil dengan tautan yang dapat diakses ke `/cart`.
  - Tombol aksi pada halaman detail varian dan bundle customizer terhubung langsung ke aksi `addLine` pada store keranjang.
  - Halaman `/cart` membedakan dengan jelas antara status pemuatan revalidasi awal (skeleton loading), status keranjang kosong (dengan tombol kembali belanja ke menu cabang), status gagal validasi server (dengan tombol retry), dan status keranjang terisi.
  - Rincian keranjang menyajikan foto produk, nama produk yang dapat diklik ke detail, label varian, breakdown komposisi 12 potong bundle, kontrol kuantitas (+/-), tombol hapus item, rincian estimasi subtotal dan diskon, catatan bahwa konfirmasi akhir stok dan ongkir dilakukan via WhatsApp, serta tautan menuju `/checkout`.

## D020 — Backend kuotasi checkout server otoritatif, verifikasi fingerprint dua langkah, dan handoff WhatsApp (F13, 13 November 2026)

- **Backend Kuotasi Otoritatif Tanpa State Mutasi (`POST /api/checkout/prepare`, PRD §8, §15, §27.2–27.3):**
  - Mengimplementasikan Route Handler `POST /api/checkout/prepare` dengan boundary Zod ketat (`checkoutPrepareRequestSchema`, `checkoutPrepareResponseSchema`).
  - Menegakkan batas ukuran payload 32 KiB (`CHECKOUT_LIMITS.MAX_REQUEST_BYTES = 32 * 1024`). Permintaan yang melebihi batas langsung ditolak dengan HTTP 413 `REQUEST_TOO_LARGE`.
  - Header respons menyertakan `Cache-Control: no-store, no-cache, must-revalidate` untuk mencegah caching perantara.
  - **Jaminan Read-Only Mutlak:** Menolak tegas penulisan baris order, order items, riwayat, atau pengurangan stok di database saat proses prepare. Snapshot tabel bisnis diverifikasi tidak berubah sama sekali sebelum dan sesudah permintaan.
- **Validasi dan Single Source of Truth:**
  - Cabang, nomor WhatsApp admin tujuan (`6281703384308` Surabaya dan `6285119785194` Bintaro), harga dasar, price override cabang, dan ketersediaan stok dibaca langsung dari database Supabase (`readActiveBranches`, `readCartVariantsByIds`, `readComponentVariantsByIds`).
  - Harga, nomor WhatsApp, atau parameter buatan dari sisi client sama sekali tidak diterima sebagai otoritas bisnis.
  - Jika item habis atau stok kurang -> HTTP 409 `STOCK_CHANGED`.
  - Jika item tidak terdaftar/ditawarkan di cabang terpilih -> HTTP 409 `ITEM_UNAVAILABLE`.
  - Jika cabang tidak ditemukan atau tidak aktif -> HTTP 404 `NOT_FOUND`.
  - Jika format JSON rusak -> HTTP 400 `INVALID_REQUEST`.
  - Jika validasi skema gagal (tanggal masa lalu, tanggal > 90 hari, kalender fiktif seperti 29 Februari non-kabisat atau 31 April, alamat delivery kosong) -> HTTP 422 `VALIDATION_ERROR` dengan `fieldErrors` terstruktur.
  - Jika database upstream bermasalah -> HTTP 503 `UPSTREAM_ERROR`.
- **Verifikasi Kuotasi Dua Langkah via SHA-256 Fingerprint Kanonik:**
  - Fungsi server-only `generateQuoteFingerprint` menghasilkan SHA-256 fingerprint 64-karakter hex kanonik dari data bisnis otoritatif: `branchId`, nomor WhatsApp cabang, baris terurut stabil (ID varian, SKU, kuantitas, harga kotor satuan, harga satuan efektif, diskon, total baris, ID opsi terurut leksikografis, dan ID promosi), subtotal, diskon, dan estimasi total.
  - Menyingkirkan secara ketat: `quotedAt`, `expiresAt`, `requestId`, urutan query input yang tidak stabil, serta seluruh PII pengguna (`customerName`, `address`, `note`, `fulfillmentMethod`).
  - Panggilan pertama (`expectedQuoteFingerprint == null`): Menghasilkan kuotasi dengan `requiresReview = true`.
  - Panggilan kedua / reprepare dengan fingerprint yang sama: Menghasilkan `requiresReview = false`.
  - Jika terjadi perubahan harga/stok di tengah jalan: Mengembalikan HTTP 200 dengan fingerprint baru, `requiresReview = true`, dan kode peringatan `PRICE_CHANGED`.
  - Setiap kuotasi memiliki TTL 5 menit (`QUOTE_TTL_MS = 300_000`) dengan timestamp `quotedAt` dan `expiresAt` ISO UTC.
- **Komposisi Pesanan WhatsApp dan Sanitasi Input (PRD §8.3):**
  - Pesanan WhatsApp multiline mengikuti format resmi PRD §8.3 dengan header sapaan, nama cabang, rincian produk (termasuk badge `[Termasuk]` untuk fixed components 12-slice bundle dan delta `(+Rp...)`), subtotal, diskon, estimasi total, label ongkir menunggu konfirmasi admin cabang, serta blok pemesan, metode, tanggal kalender Indonesia, alamat, dan catatan.
  - Sanitasi input ketat terhadap input pengguna: menghilangkan karakter kontrol ASCII dan karakter markup WhatsApp/HTML (`*`, `_`, `~`, '`', `<`, `>`, `\`) untuk mencegah injection pada pesan WhatsApp.
  - Fallback URL panjang: Jika panjang encoded WhatsApp URL melebihi batas 4000 karakter, URL otomatis diarahkan ke `https://wa.me/<number>` tanpa query teks (`requiresCopy = true`), dan teks pesan lengkap tetap disediakan di `messagePreview` untuk disalin manual oleh pengguna.
- **Logging Tanpa PII:**
  - Logging sisi server hanya mencatat metadata non-sensitif: `requestId`, `branchId`, `itemCount`, dan status error/sukses. Nama pelanggan, nomor telepon, alamat, catatan, dan pesan mentah tidak pernah dicetak ke log sistem.

## D021 — Antarmuka checkout quote review, perlindungan data transien, dan handoff WhatsApp (F14, 13 November 2026)

- **Formulir Checkout Transien & Validasi RHF + Zod (PRD §6.5, §8, §27.3):**
  - Mengimplementasikan halaman `/checkout` (`src/app/(site)/checkout/page.tsx`) dan komponen klien `CheckoutView` (`src/components/checkout/checkout-view.tsx`) menggunakan `react-hook-form` dan `@hookform/resolvers/zod` dengan skema `checkoutFormSchema`.
  - Seluruh data pemesan (`customerName` 2–80 karakter, `method`, `requestedDate`, `requestedTimeWindow`, `address` wajib minimal 5 karakter untuk `delivery`, `note`, dan checkbox persetujuan konfirmasi manual `acknowledgedManualConfirmation`) disimpan murni di memori komponen React (transient memory). Data tersebut tidak pernah disimpan ke `localStorage`/`sessionStorage` dan tidak pernah dimasukkan ke parameter URL browser.
  - Menyertakan tautan kebijakan ke `/privacy` dan `/ordering-policy` pada kotak persetujuan konfirmasi manual.
- **Alur Review Dua Langkah & Pembatalan Penerimaan Saat Input Berubah:**
  - **Langkah 1 (`Tinjau Estimasi & Pesan WhatsApp`):** Memanggil `POST /api/checkout/prepare` melalui `useCheckoutPrepare` dengan `expectedQuoteFingerprint: null`. Menampilkan kartu `Tinjauan Estimasi Resmi Server` berisi rincian baris, komposisi bundle 12 potong, harga kotor/diskon/subtotal otoritatif, status ongkos kirim `Menunggu konfirmasi admin`, peringatan server, dan pratinjau pesan WhatsApp read-only tanpa membuka tab WhatsApp.
  - **Langkah 2 (`Lanjut ke WhatsApp`):** Memanggil kembali `POST /api/checkout/prepare` dengan `expectedQuoteFingerprint: reviewedQuote.quoteFingerprint`. Hanya apabila server mengembalikan `requiresReview === false`, antarmuka membuka `whatsappUrl` tepercaya dari respons server terbaru.
  - Apabila harga atau promo berubah di antara langkah 1 dan langkah 2 (`requiresReview === true` disertai peringatan `PRICE_CHANGED`), WhatsApp tidak dibuka; estimasi terbaru ditampilkan dan pengguna wajib meninjau ulang.
  - Setiap perubahan pada isi keranjang, cabang aktif, maupun field formulir secara otomatis membatalkan status penerimaan kuotasi (`reviewedQuote` di-reset).
  - Perlindungan klik ganda (double-submit guard) diterapkan melalui `inFlightRef` sinkron dan state `isPending` / `loading`.
- **Ketahanan Error, Cabang Tanpa Fulfillment, dan Fallback Handoff:**
  - Error `400`, `401`, `404`, `409` (`STOCK_CHANGED`/`ITEM_UNAVAILABLE`), `413`, `422` (`VALIDATION_ERROR`), `429`, `503`, `504`/timeout, maupun gangguan jaringan tidak pernah mengosongkan keranjang belanja. Pada error `409`, revalidasi keranjang dipicu otomatis agar konflik baris terlihat jelas.
  - Jika cabang menonaktifkan baik pickup maupun delivery (`allowPickup === false && allowDelivery === false`), halaman menampilkan kartu konsultasi WhatsApp cabang (`Konsultasi via WhatsApp Cabang`) dan tidak menampilkan pengiriman pesanan terselubung.
  - Menyediakan fallback lengkap pasca-handoff dan saat popup diblokir: tombol `Buka WhatsApp Lagi`, tombol `Salin Detail Pesanan`, serta `<textarea readOnly>` yang otomatis memilih (select/highlight) seluruh teks pesan apabila `navigator.clipboard.writeText` gagal atau ketika panjang URL melebihi batas (`requiresCopy === true`). Tidak menampilkan toast palsu "pesanan terkirim/dibayar", tidak mengirim pesan otomatis, dan tidak menghapus keranjang saat handoff.

## D022 — Autentikasi admin Supabase SSR, pemulihan kata sandi, dan isolasi guard server (F15, 13 November 2026)

- **Scope Ketat Email/Password & Tanpa Signup Publik (PRD §10, §14, §25.3, §27.4):**
  - Portal admin hanya menyediakan alur email/password (`/admin/login`), pemulihan kata sandi (`/admin/reset-password`, `/auth/callback`), logout, dan shell dasbor terproteksi (`/admin`) tanpa CRUD bisnis dulu (disimpan untuk F16–F20).
  - Tidak ada alur pendaftaran publik, OAuth/magic link, password owner hardcoded di source/seed, maupun endpoint runtime yang menulis `admin_profiles`.
- **Per-Request SSR Cookies & Verifikasi Berlapis di Server Entry Point:**
  - `src/proxy.ts` memakai `refreshAuthSession` (`getClaims()`) hanya untuk menyegarkan cookie SSR pada jalur `/admin/:path*`, `/auth/:path*`, dan `/api/admin/:path*`, `/api/auth/:path*` dengan `Cache-Control: private, no-store`.
  - Setiap entry point server (`requireAdminSession` pada RSC `/admin/(dashboard)/layout.tsx` & `page.tsx`, serta `requireApiAdmin` / `/api/auth/update-password` pada Route Handler) tidak pernah mengandalkan proxy atau `getSession()` saja: `verifyAdminAccess` memverifikasi JWT & sesi melalui `getClaims()` dan `getUser()`, lalu membaca `admin_profiles` (`is_active = true`, `role in ('owner', 'branch_admin')`, dan cabang aktif untuk `branch_admin`) pada setiap request.
  - Apabila pengguna terautentikasi di Auth tetapi tidak memiliki `admin_profiles` atau berprofil nonaktif, API mengembalikan `403 FORBIDDEN` (dan `/api/auth/login` / `/auth/callback` langsung melakukan `signOut({ scope: 'local' })` serta menghapus cookie sesi), sedangkan halaman admin mengarahkan pengguna ke `/admin/login?error=profile_missing|profile_inactive`. Kegagalan database pada lookup profil mengembalikan `503 UPSTREAM_ERROR`, tidak disamarkan sebagai `401`/`403`.
- **Keamanan Transport Auth, Redirect Allowlist, CSRF, dan Isolasi Query Cache:**
  - Seluruh mutasi auth (`POST /api/auth/*`) memvalidasi byte limit `16 KiB`, skema Zod ketat, dan perlindungan same-origin CSRF (`assertSameOriginRequest`), serta meneruskan cookie & header SDK dari `createCookieCarrierResponse()` ke respons final dengan `Cache-Control: private, no-store, no-cache, must-revalidate`, `Pragma: no-cache`, `Expires: 0`, dan `Referrer-Policy: no-referrer`.
  - `resolveSafeAdminRedirectPath` mengizinkan hanya path internal `/admin` dan menolak skema eksternal, `//`, backslash, serta karakter kontrol.
  - `POST /api/auth/request-password-reset` menerapkan pembatasan laju per IP dan email hash (`rate-limit.server.ts`, single-instance in-memory baseline) dan selalu mengembalikan respons generik agar keberadaan email tidak dapat dienumeasi.
  - Query key privat admin (`QUERY_KEYS.ADMIN_SESSION`) selalu diikat ke `{ userId, role, branchId }`; `useAdminLogout` dan `useAdminLogin` memanggil `queryClient.removeQueries({ queryKey: QUERY_KEYS.ADMIN_ROOT })` sehingga tidak ada cache privat tersisa saat logout atau berpindah akun.
- **Batasan Recovery Email Lokal vs Produksi (Release Blocker):**
  - Alur email reset password lokal dikonfigurasi untuk Mailpit (`127.0.0.1:54324`) dan `additional_redirect_urls` lokal pada `supabase/config.toml`. Pengujian SMTP/provider email produksi belum dapat dijalankan pada lingkungan lokal sehingga dicatat sebagai **release blocker** menjelang F26.

## D023 — Shell admin terproteksi, ringkasan operasional, kategori CRUD, dan produk draf inti (F16, 13 November 2026)

- **Shell Admin Role-Scoped & Overview DB Nyata:**
  - Mengganti shell sementara F15 dengan `AdminShell` (`src/components/admin/admin-shell.tsx`) di dalam `src/app/admin/(dashboard)/layout.tsx` yang menyediakan sidebar desktop dan `<Drawer>` mobile accessible.
  - Navigasi disaring menurut role: `owner` mengakses Ringkasan, Kategori Menu, dan Produk & Draf (modul F17–F21 ditandai jujur sebagai tahap berikutnya tanpa tombol CRUD palsu); `branch_admin` hanya melihat Ringkasan serta label tahap F18/F21 dan ditolak dengan `AdminForbiddenPanel` serta HTTP `403 FORBIDDEN` bila mengakses `/admin/categories*` atau `/admin/products*`.
  - Ringkasan (`/admin` & `GET /api/admin/overview`) membaca hitungan DB nyata per role: `owner` menerima ringkasan kategori, produk, produk perlu review, cabang aktif, sold-out offers, promo aktif, dan sesi kelas mendatang; `branch_admin` hanya menerima metrik cabang sendiri (`availableOffers`, `soldOutOffers`, `upcomingSessions`) dengan `ownerCounts: null`.
- **Integritas Kategori, Slug Permanen, Soft Archive & Concurrency Optimistik:**
  - `GET,POST /api/admin/categories` dan `GET,PATCH,DELETE /api/admin/categories/[id]` menegakkan guard `owner`, CSRF same-origin, batas payload `32 KiB`, dan `Cache-Control: private, no-store`.
  - Validasi hierarki mencegah self-parenting, siklus induk (`wouldCreateCategoryCycle` + trigger DB `category_cycle`), publikasi di bawah induk non-published (`category_parent_not_published`), serta pengarsipan kategori yang masih memiliki subkategori aktif atau menjadi satu-satunya kategori terpublikasi produk aktif. Slug bersifat permanen setelah dibuat (`SLUG_IMMUTABLE`).
  - Mutasi `PATCH` dan `DELETE` mewajibkan `expectedUpdatedAt` atomik (`eq('updated_at', expectedUpdatedAt)`); 0 baris terpengaruh dibedakan menjadi `404 NOT_FOUND` atau `409 CONFLICT` dan tidak pernah dianggap sukses. Penghapusan menggunakan soft archive (`status = 'archived'`) dengan dialog konfirmasi tanpa cascade delete destruktif.
- **Produk Draf Inti, Pemisahan Harga SKU, dan Syarat Publikasi:**
  - `GET,POST /api/admin/products` dan `GET,PATCH,DELETE /api/admin/products/[id]` mengelola data inti produk (`name`, `slug`, `productType`, `shortDescription`, `description`, `ingredientsInfo`, `storageInstructions`, flags, `needsOwnerReview`, `sortOrder`, `status`). Baris produk tidak memiliki kolom harga; payload yang menyertakan `price_idr`/`priceIdr`/`basePriceIdr` langsung ditolak (`422 VALIDATION_ERROR`). Konfigurasi nested SKU varian, foto Storage, klaim diet/alergen, dan opsi paket menunggu **F17**.
  - Produk baru selalu dibuat sebagai `draft` dan hanya dapat diubah ke `published` apabila memenuhi seluruh syarat (`needsOwnerReview === false`, >=1 kategori terpublikasi, varian SKU aktif sesuai tipe + penawaran cabang aktif, dan >=1 foto disetujui ber-alt-text).
  - Tabel produk menyaring/mencari literal secara aman tanpa raw `.or()` PostgREST dan menurunkan halaman paginasi otomatis (`clampAdminPageAfterRemoval`) ketika item terakhir pada halaman `> 1` diarsipkan. Setiap mutasi admin menginvalidasi seluruh key di bawah `QUERY_KEYS.ADMIN_ROOT`, key katalog publik (`CATEGORIES`, `catalog`, `product-detail`), serta memanggil `revalidatePublicCatalogPaths()`.

## D024 — Editor konfigurasi produk atomik, pipeline media privat ke publik, dan pemilihan sharp (F17, 13 November 2026)

- **Keputusan Library Pemrosesan Gambar (`sharp` 0.35.5):**
  - Dipilih **`sharp`** (`0.35.5`) sebagai dependensi pemrosesan gambar sisi server untuk validasi decode, pemeriksaan dimensi (`<= 6000 × 6000` px dan batas `limitInputPixels: 36.000.000` dengan `failOn: 'error'`), penolakan multi-frame/animasi, serta re-encode ulang tanpa menyimpan metadata EXIF/IPTC/XMP (`rotate()` tanpa `withMetadata()`).
  - **Alasan & Alternatif yang Ditolak:** host Windows x64 + Node 24 serta CI Linux x64 menerima binary prebuilt libvips `@img/sharp-*` secara langsung tanpa compiler C/GTK, mendukung JPEG/PNG/WebP/AVIF penuh secara seragam dengan pipeline optimisasi gambar Next.js, dan terisolasi pada modul `server-only` (`src/features/admin-catalog/media.server.ts`). Alternatif pure-JS `jimp` ditolak karena tidak mendukung AVIF/WebP modern secara optimal, sedangkan `node-canvas` ditolak karena beban dependency native Cairo/Pango pada Windows/CI.
- **Boundary Media Storage & Pembersihan Orphan Terkontrol:**
  - `POST /api/admin/media/upload` berjalan strictly owner-only melalui SSR session (`createServerAuthClient`, tanpa runtime `service_role`), memvalidasi ukuran `<= 5 MiB`, daftar MIME (`image/jpeg`, `image/png`, `image/webp`, `image/avif`), magic bytes biner, penolakan payload `<svg>`/`<?xml` bertopeng MIME gambar, dan menghasilkan path acak UUID di bucket privat `media-drafts` (`<userId>/drafts/<uuid>.<ext>`) beserta signed URL berumur 300 detik.
  - Promosi ke bucket publik `product-images` (`approved/<uuid>.<ext>`) hanya berlangsung di server saat konfigurasi menyimpan foto berstatus `isApproved: true` disertai `altText` wajib (`>= 3` karakter).
  - Jika transaksi DB gagal sesudah promosi media atau foto dilepas dari produk, `cleanupOrphanStorageObjects` hanya menghapus objek spesifik yang dipastikan tidak dirujuk lagi oleh baris `product_images` mana pun (`count === 0`), sehingga aset bersama tidak pernah terhapus.
- **Simpan Konfigurasi Atomik & Invarian Paket/Diet:**
  - `PUT /api/admin/products/[id]/configuration` menggunakan satu transaksi PostgreSQL via RPC `SECURITY INVOKER` `public.save_product_configuration(p_product_id, p_expected_updated_at, p_payload)` yang memeriksa `bakery_private.is_owner()`, row lock + `expectedUpdatedAt` (`409 CONFLICT`), keabadian `sku`/`slug`, larangan menghapus varian yang sudah direferensikan (harus arsip lunak `status = 'archived'`), dan memicu constraint trigger deferrable `bakery_integrity` secara langsung sebelum commit.
  - Klaim diet `verified` mewajibkan bukti tertulis (`dietary_verified_requires_evidence`, `note >= 3` karakter, dibaca kembali hanya oleh owner via `read_owner_variant_evidence`), dan klaim Gluten-Free terverifikasi pada paket ditolak baik oleh validator shared maupun DB jika ada komponen tetap atau pilihan aktif yang belum terverifikasi Gluten-Free.
  - Panel pratinjau di editor memakai langsung `<MenuProductCard />` bersama kalkulator harga murni `computeVariantEffectivePrice` (`src/utils/catalog-pricing.ts`, di-re-export `@/features/catalog/pricing`) tanpa duplikasi rumus harga.

## D025 — Manajemen lokasi cabang, jam mingguan, dan ketersediaan cabang role-scoped (F18, 13 November 2026)

- **Sinkronisasi Langsung Flag Fulfillment Publik & Keamanan Default:**
  - `readActiveBranches()` (`src/features/branches/repository.server.ts`) kini menyeleksi kolom `allow_pickup, allow_delivery` bersama field cabang publik agar keputusan Owner di `/admin/locations` langsung memengaruhi `/api/branches`, halaman `/checkout`, dan quote server `/api/checkout/prepare` tanpa konstanta hardcoded.
  - Pengaktifan `allowPickup` atau `allowDelivery` ditolak kecuali Owner mencentang tinjauan kesiapan produksi (`fulfillmentReviewedForProduction`), dan perubahan nomor WhatsApp mewajibkan normalisasi digit internasional (`normalizeWhatsappDigits`), pratinjau `https://wa.me/<digits>`, serta konfirmasi verifikasi ulang target (`confirmWhatsappChange`).
  - Tautan Maps dibatasi ke allowlist host Google Maps HTTPS (`maps.google.com`, `maps.app.goo.gl`, `google.com/maps*`, `www.google.com/maps*`), sedangkan alamat Bintaro dibiarkan `null`/unresolved kecuali diisi resmi oleh Owner.
- **Jam Operasional Mingguan Atomik & Penolakan Rentang Lintas Tengah Malam:**
  - `PUT /api/admin/branches/[id]/hours` memanggil RPC `SECURITY INVOKER` `public.replace_branch_hours(p_branch_id, p_expected_branch_updated_at, p_hours)` (`supabase/migrations/20261113000200_bakery_branch_hours_offers_rpc.sql`) untuk mengganti 7 hari unik (`0..6`) secara atomik dengan optimistik lock `expectedUpdatedAt` (`409 CONFLICT`).
  - Jam yang belum terverifikasi disimpan sebagai `opensAt = null, closesAt = null, isClosed = false` ("Sesuai konfirmasi"), bukan dianggap 24 jam. Hari terbuka mewajibkan `closesAt > opensAt`; interval lintas tengah malam (mis. `22:00`–`02:00`) ditolak oleh domain maupun constraint database sampai desain multi-interval/overnight disepakati.
- **Ketersediaan Cabang Role-Scoped, RPC Harga Owner, dan Bulk Parsial Jujur:**
  - Owner menggunakan RPC `SECURITY INVOKER` `public.owner_upsert_branch_offer` untuk memperbarui `base_price_idr`, `price_override_idr`, status tampil, ketersediaan, dan stok dalam satu transaksi dengan lock baris varian + penawaran serta evaluasi `SET CONSTRAINTS ALL IMMEDIATE` (termasuk `bundle_component_not_offered` dan batas harga).
  - Staf cabang (`branch_admin`) menulis langsung ke `branch_variant_offers` hanya untuk cabang sendiri dan hanya kolom `is_listed`, `availability_status`, `stock_quantity` sehingga RLS (`can_manage_branch`, `manageable_variant`) serta trigger F03 `enforce_staff_fields()` tetap aktif menegakkan larangan modifikasi `price_override_idr` maupun perpindahan `branch_id`/`variant_id` (`42501` -> HTTP `403`). Nilai `stockQuantity = 0` diwajibkan berstatus `sold_out`, sedangkan `null` menandakan stok tidak dilacak.
  - `POST /api/admin/availability/bulk` memvalidasi dan mengeksekusi setiap baris SKU secara individual dan mengembalikan laporan parsial jujur (`totalCount`, `succeededCount`, `failedCount`, `results`) tanpa pernah melaporkan sukses menyeluruh ketika ada baris yang gagal. Mutasi admin menginvalidasi cache admin maupun cache publik (`branches`, `categories`, `catalog`, `product-detail`, `content`, `cart-validate`) beserta `revalidatePath` untuk route publik terkait.

## D026 — Manajemen promosi owner-only, sinkronisasi target/cabang atomik, dan banner ongkir informasional (F19, 13 November 2026)

- **RPC Promosi Atomik, Target Scope, & Cabang Opsional Kosong:**
  - `POST /api/admin/promotions`, `PATCH /api/admin/promotions/[id]`, dan `DELETE /api/admin/promotions/[id]` mengeksekusi RPC `SECURITY INVOKER` `public.save_admin_promotion` dan `public.archive_admin_promotion` (`supabase/migrations/20261113000300_bakery_promotions_rpc.sql`) di bawah otorisasi `bakery_private.is_owner()` dan RLS.
  - Satu transaksi menyinkronkan baris `promotions` (dengan `is_stackable = false` tetap non-stackable), pivot `promotion_targets` (mewajibkan target yang sesuai untuk `category`/`product`/`variant` dan kosong untuk `all`), serta `promotion_branches` (kosong berarti berlaku untuk seluruh cabang aktif, bukan larangan cabang). Concurrency optimistik memakai `expectedUpdatedAt` (`40900` -> HTTP `409 CONFLICT`), dan seluruh target `archived`/non-published ditolak sebelum commit dengan `SET CONSTRAINTS ALL IMMEDIATE`.
- **Kalkulator Bersama, Status Jam Jakarta, & Batas Fitur Non-Stackable/Ongkir:**
  - `AdminPromotionsView` menghitung pratinjau diskon langsung memakai `calculateCandidateDiscountIdr` (`src/utils/catalog-pricing.ts`) dan `buildPromotionPreviewExamples` (`src/utils/admin-promotions.ts`) tanpa membuat mesin diskon terpisah, kode kupon unik, atau perhitungan ongkos kirim otomatis.
  - `comparePromotionCandidates` menambahkan tie-break deterministik berdasarkan `id` UUID ascending setelah nilai diskon moneter terbaik dan `priority`, dengan nilai `fixed` diterapkan per unit serta `maxDiscountIdr` menjadi batas atas per baris. Status UI (`scheduled`, `active`, `ended`, `disabled`, `archived`) diturunkan terhadap jam server pada zona `Asia/Jakarta` (`endsAt` eksklusif), sedangkan `GET /api/promotions` dan Home hanya menayangkan promo `active` dalam periode berlaku.
- **Media Banner Promosi & Konten Informasional Ongkir Terpisah:**
  - Unggahan gambar banner memakai pipeline owner-only `/api/admin/media/upload` via `useUploadAdminProductMedia` (promosi ke bucket publik saat aktif/terbit serta pembersihan orphan terkontrol yang memeriksa referensi di `product_images` maupun `promotions.banner_image_path`), bukan memakai poster historis hardcoded sebagai promo aktif.
  - Pengumuman biaya kirim (`site_content` key `'promo.shipping_banner'`) dikelola melalui `PUT /api/admin/promotions/shipping-banner` dan ditayangkan sebagai banner informasional di Beranda (`CurrentTreatsSection`) dan checkout tanpa mengubah status biaya kirim `Pending (konfirmasi WhatsApp)` maupun membuat kupon ongkir otomatis. Mutasi promosi menginvalidasi cache admin serta seluruh scope publik (`promotions`, `home`, `catalog`, `product-detail`, `cart-validate`, `content`) beserta `revalidatePath('/', '/menu', '/cart', '/checkout')`.

## D027 — Editor CMS allowlist owner-only, FAQ terstruktur, dan testimoni wajib izin privat (F20, 13 November 2026)

- **Allowlist CMS Terketik & Bucket Publik Terpisah (`brand-assets`):**
  - Editor CMS `/admin/content` dan endpoint `GET /api/admin/content` + `GET,PUT /api/admin/content/[key]` hanya mengizinkan `PUBLIC_CMS_KEYS` (`business.contacts`, `home.hero`, `home.story`, `home.class_promo`, `home.custom_business`, `about.story`, `about.values`, `footer.note`, `legal.privacy`, `legal.ordering_policy`, `community.instagram`, `promo.shipping_banner`), dengan validasi Zod teks polos ketat (`UNSAFE_MARKUP_REGEX`, penolakan skema `javascript:`/`vbscript:`/`data:text/html`) dan penguncian optimistik `expectedUpdatedAt` (`409 CONFLICT`).
  - Media hero, cerita dapur, dan kartu kurasi `community.instagram` dipromosikan oleh server ke bucket `brand-assets/approved/<uuid>.<ext>` menggunakan `promoteDraftMediaToPublicBucket`, dengan cleanup orphan terukur (`cleanupOrphanStorageObjects` untuk reason `'content_save_rollback'` dan `'removed_from_content'`) apabila penyimpanan DB gagal atau path tidak lagi direferensikan.
  - Sumber kebenaran alamat dan nomor WhatsApp cabang tetap tunggal pada tabel `branches`; editor `business.contacts` hanya menyimpan email resmi (`resepoma.kueh2@gmail.com`) dan tautan Instagram resmi, serta menampilkan peringatan rilis untuk klaim pangan alami dan kewajiban signoff owner pada `legal.privacy` / `legal.ordering_policy`.
- **FAQ Admin & Konsistensi Retrieval Chatbot/Publik:**
  - `GET,POST /api/admin/faqs` dan `PATCH,DELETE /api/admin/faqs/[id]` (tampilan `/admin/faqs`) memvalidasi teks polos, menerapkan `expectedUpdatedAt` saat update/arsip, serta melakukan soft-archive (`status='archived'`) tanpa menggeser atau menghapus `sort_order` item saudara. Publik `/faq`, `/api/faqs`, dan chatbot retrieval hanya membaca status `published`.
- **Privasi Bukti Izin Testimoni & Sembunyikan Section Kosong:**
  - Tabel `testimonials` pada query REST admin maupun publik tidak pernah menyeleksi `consent_reference`, `consent_at`, atau `updated_by`; bukti izin privat owner hanya dibaca melalui fungsi DB `read_owner_testimonial_evidence`. Publikasi (`status='published'`) ditolak kecuali kedua `consentAt` dan `consentReference` terisi valid; T01–T04 default berada pada status `draft` dengan `displayName: 'Pelanggan Resep Oma'` dan `rating: null`.
  - Section publik `#home-testimonials` (`WhatTheySaySection`) disembunyikan (`return null`) ketika tidak ada testimoni terpublikasi dan berizin, sedangkan `/admin/testimonials` menampilkan pratinjau kosong secara eksplisit bagi owner dengan `allowEmptyPreview`. CTA B2B merujuk ke `/contact?branch=...#custom-business` sebagai konsultasi WhatsApp cabang tanpa tabel leads baru.

## D028 — Manajemen program/sesi Baking Class role-scoped & pendaftaran WhatsApp manual (F21, 13 November 2026)

- **Role-Scoped Admin Program & Session tanpa Tabel Pendaftaran:**
  - Owner mengelola program (`class_programs`) melalui `GET,POST /api/admin/classes/programs` dan `PATCH,DELETE /api/admin/classes/programs/[id]`, sedangkan Owner maupun Staff cabang (`branch_admin` hanya untuk `branchId` miliknya) mengelola sesi (`class_sessions`) melalui `GET,POST /api/admin/classes/sessions` dan `PATCH,DELETE /api/admin/classes/sessions/[id]` dengan penguncian optimistik `expectedUpdatedAt` (`409 CONFLICT`) dan soft-archive.
  - Tidak ada kolom/tabel pendaftaran peserta maupun pengurangan kuota otomatis: `capacity` dan `seatsLeft` (`seats_left IS NULL` = kuota perkiraan tanpa angka pasti) bersifat catatan manual admin, serta tidak mengumpulkan identitas anak (hanya opsional `adultContactName` wali dewasa yang bersifat sementara dan tidak disimpan ke database).
  - Media cover program kelas memakai ulang pipeline upload privat `POST /api/admin/media/upload` dan promosi server `promoteDraftMediaToPublicBucket` (`ADMIN_MEDIA_BUCKETS.CLASSES` = `class-images`) serta pembersihan orphan terkontrol yang juga mengecek referensi `class_programs.cover_image_path`.
- **Sumber Tunggal Beranda, Katalog `/classes`, & Evaluasi Jam Jakarta:**
  - Halaman publik `/classes` (`src/app/(site)/classes/page.tsx`), `/classes/[slug]` (`src/app/(site)/classes/[slug]/page.tsx`), dan section Beranda `#home-classes` (`BakeWithOmaSection` via `src/features/home/repository.server.ts`) membaca sumber data `class_programs` + `class_sessions` yang sama (`status='published'` + cabang aktif), mengurutkan sesi mendatang terawal secara menaik, dan tetap menyinkronkan waktu UTC dari database ke tampilan `Asia/Jakarta` (`WIB`).
  - Batas ketersediaan konsisten pada server & UI melalui `evaluateClassSessionAvailability`: sesi kedaluwarsa (`deadlineMs < nowMs`), sesi mulai/berlalu (`startsMs <= nowMs`), status `cancelled`/`full`, atau `isRegistrationOpen === false` tidak dapat didaftarkan (`isRegisterable: false`) sambil tetap dapat diakses informatif di halaman detail dan menyediakan CTA cabang `"Tanyakan Jadwal Berikutnya via WhatsApp"` (`buildAskNextClassWhatsAppUrl`) bila belum ada sesi tersedia—tanpa memalsukan poster historis Juni/Juli menjadi jadwal baru.
- **Pendaftaran via `POST /api/classes/prepare-registration` & Isolasi Keranjang Produk:**
  - Endpoint `POST /api/classes/prepare-registration` memvalidasi payload ketat (`sessionId`, `attendeeCount` dalam batas kapasitas/sisa kursi, `adultContactName` opsional), membaca ulang program/sesi/cabang terkini dan `effectivePriceIdr = priceOverrideIdr ?? basePriceIdr` di server, sanitasi teks single-line dari karakter kontrol/zero-width/bidi, serta menyusun tautan `https://wa.me/<digits>?text=...` beserta `requiresCopy` fallback tanpa menyentuh state/API keranjang produk (`/cart`) atau menulis database.
  - Sub-kode konflik domain kelas pada `PublicClassError` dipetakan melalui `err.apiCode` ke kode envelope `API_ERROR_CODES` (`CONFLICT` / `NOT_FOUND` / `VALIDATION_ERROR` / `UPSTREAM_ERROR`) sambil mempertahankan pesan spesifik per kondisi (`SESSION_CANCELLED`, `SESSION_FULL`, `REGISTRATION_CLOSED`, `DEADLINE_PASSED`, `SESSION_ENDED`, `INSUFFICIENT_SEATS`) untuk UI.

## D029 — Asisten Ask Oma deterministik hanya-baca & klien anon terpisah (F22, 13 November 2026)

- **Isolasi Klien Anon & Larangan Mutasi Mutlak (`createChatReadClient`):**
  - `src/lib/supabase/public-read.server.ts` menyediakan `createChatReadClient()` khusus untuk domain asisten (`src/features/ai/*`) yang memblokir penerusan header `cookie`, mengesampingkan otorisasi/session owner yang mungkin aktif di browser yang sama, memaksa header `apikey` + `Authorization: Bearer <publishableKey>`, `credentials: 'omit'`, dan `cache: 'no-store'`.
  - Modul `src/features/ai/*` dan `src/app/api/chat/route.ts` dilarang mengimpor `@/lib/supabase/server`, `next/headers`, `@/features/admin-catalog`, ataupun mengeksekusi `.insert`/`.update`/`.upsert`/`.delete`/`.rpc`/`.storage` mutasi; riwayat percakapan tetap berada di memori client saja (`<= 8` item) tanpa tabel chat ataupun panggilan provider/DB saat halaman dimuat.
- **9 Operasi Allowlisted Deterministik Tanpa Ketergantungan LLM (`CHAT_PROVIDER_ENABLED=false`):**
  - Perencana deterministik `planChatOperation` dan dispatcher `answerAskOmaChat` (`src/features/ai/chat.server.ts`) memvalidasi maksud pengguna lewat `chatPlanSchema` (`search_products`, `recommend_by_budget`, `get_product_detail`, `get_active_promotions`, `get_branches`, `get_upcoming_classes`, `search_faqs`, `clarify`, `refuse`), tanpa SQL dinamis atau nama tabel/RPC dari input.
  - Kalkulasi harga promo cabang dan evaluasi klaim diet terverifikasi (termasuk verifikasi per komponen tetap untuk bundle dan larangan penurunan klaim unverified) menggunakan ulang domain kalkulasi bersama (`computeVariantEffectivePrice`, `evaluateClassSessionAvailability`, `computeEffectiveClassPriceIdr`, `formatIdr`). Pertanyaan harga/budget tanpa `branchId` aktif memicu `clarify` alih-alih mengarang harga default; klaim promo kedaluwarsa, draft, stok habis cabang, dan `needs_owner_review` disaring ketat; teks bebas katalog/FAQ disanitasi dari tag HTML, karakter Bidi/kontrol, serta tautan non-allowlist.
- **Batas Transport `POST /api/chat`, Rate Limit Baseline, & UX Nonmodal/Modal:**
  - `POST /api/chat` (`src/app/api/chat/route.ts`) membaca body secara streaming dengan batas keras `16 KiB` (`413`), memvalidasi payload ketat via `chatRequestSchema` (`400`/`422` menolak role `system`/`tool`/properti liar), menerapkan header `Cache-Control: no-store, no-cache, must-revalidate`, dan membedakan kegagalan `429` (`Retry-After`), `503` (DB outage tanpa respons 200 kosong palsu), dan `504` (timeout query 5s / batas route 15s) serta log terstruktur bebas PII (`[ask-oma-chat]`).
  - Rate limiter in-memory berkapasitas terbatas (`src/features/ai/rate-limit.server.ts`) cukup untuk baseline deterministik F22 tanpa kunci LLM, sementara eksternal edge/Redis rate limiter menjadi prasyarat wajib apabila mode generatif (F23) pernah diaktifkan di produksi multi-instance.
  - Antarmuka `AskOmaWidget` (`src/components/chat/*` via `ChatSlot`) menyajikan panel nonmodal di desktop (`<section>`, tutup lewat `Escape` mengembalikan fokus ke tombol pemicu), drawer modal `<dialog>` via `ModalSurface` di viewport sempit (`< 768px`), penguncian sinkron terhadap kirim ganda (`inFlightRef`), pembatalan melalui `AbortController` + `generationIdRef` agar balasan usang dibuang, penanganan `Enter` vs `Shift+Enter` + komposisi IME, pembersihan konteks otomatis dengan pemberitahuan saat cabang berganti setelah `branchPending` stabil, serta fallback Retry & tautan WhatsApp/Kontak resmi saat DB gangguan.

## D030 — Mode generatif Ask Oma opsional dengan `@google/genai`, limiter terdistribusi fail-closed, & default flag-off (F23, 13 November 2026)

- **Verifikasi SDK Provider & Tanpa Hardcoded Model/Rotasi Key:**
  - Menginstall paket resmi `@google/genai` (`3.3.0`, ter-pin eksak sesuai konvensi `package.json` dan kompatibel dengan Node `>=22.0.0`) sebagai implementasi `createGeminiChatProvider` pada `src/features/ai/generative-provider.server.ts`.
  - Mempertahankan validasi env fail-closed pada `src/config/environment.server.ts` (`CHAT_PROVIDER_ENABLED=false` sebagai default aman); tidak ada nama model Gemini yang di-hardcode maupun mekanisme rotasi API key untuk mengakali kuota. Bila `CHAT_PROVIDER_ENABLED=true`, `GOOGLE_GEN_AI_API_KEY`, `GOOGLE_GEN_AI_CHAT_MODEL`, `CHAT_GENERATIVE_QUOTA_PER_DAY`, `CHAT_LIMITER_STORE_URL` (wajib HTTPS di `production`), dan `CHAT_LIMITER_STORE_TOKEN` wajib tersedia.
- **Arsitektur 2-Langkah Grounded (Planner Terbatas + Verifikasi Pasca-Composer):**
  - **Pre-LLM Guard:** Permintaan mutasi, akses admin/rahasia, atau tracking pesanan ditolak deterministik via `planChatOperation` sebelum menyentuh limiter store eksternal maupun provider LLM.
  - **Planner (`proposeReadPlan`):** LLM hanya mengusulkan satu operasi dari 9 operasi tetap (`CHAT_OPERATIONS`) dalam JSON sesuai `PLAN_RESPONSE_SCHEMA` (`timeout: 4.5s`). Backend memvalidasi ulang via `validateGenerativeProposedPlan` (`chatPlanSchema`), menolak query berpola SQL/mutasi, memaksa klarifikasi cabang bila harga/budget diminta tanpa `branchId`, dan membatasi jumlah item (`<= 10`). Kegagalan/invalid planner jatuh kembali ke perencana deterministik F22 sementara kueri DB hanya-baca (`createChatReadClient`) tetap berjalan.
  - **Composer (`composeGroundedAnswer`):** Menerima DTO terpublikasi yang telah disanitasi (`grounded_catalog_dto`) tanpa klaim unverified maupun data rahasia, dengan batas `maxOutputTokens: 1024`, `timeout: 6.5s`, dan propagasi `AbortSignal`. Output JSON divalidasi lewat `generativeAnswerOutputSchema` dan `verifyAndSanitizeGenerativeAnswer` (menyaring HTML/Bidi, menolak teks kosong, klaim stok pasti/order tercatat, tautan di luar `items[].href`, serta nominal Rupiah di luar kalkulasi server). Setiap pelanggaran atau timeout/kuota provider fallback ke jawaban deterministik F22, sedangkan kegagalan DB tetap mengembalikan error `503`/`504` dan abort klien membatalkan permintaan tanpa jawaban sintetis palsu.
- **Rate Limiter Multi-Instance Eksternal (Metadata TTL, Tanpa Supabase Chat Writes) & Kebijakan Privasi:**
  - `src/features/ai/generative-limiter.server.ts` menggunakan atomicity Lua `EVAL` terhadap store eksternal berbasis Redis REST (`Upstash-compatible`) untuk mengontrol konkurensi global (`INCR`/`DECR` + safety TTL `60s`), RPM per klien & global (`TTL 120s`), dan kuota harian zona Jakarta (`TTL 172800s`).
  - Identitas klien (`clientKey`) di-hash dengan HMAC-SHA256 (`hashChatLimiterClientKey`) memakai Web Crypto sebelum disimpan; store limiter eksternal maupun log `[ask-oma-chat]` tidak pernah menyimpan IP mentah, teks pertanyaan pengguna, maupun riwayat chat. Supabase tidak menerima write apa pun dari fitur chat.
  - Ketika store limiter eksternal tidak terjangkau/gagal merespons, mode generatif gagal tertutup (`ChatLimiterUnavailableError` -> HTTP `503`, nol panggilan Gemini). Karena infrastruktur store Redis eksternal, kredensial/model final, dan anggaran kuota produksi belum diprovisioning oleh owner, `CHAT_PROVIDER_ENABLED` tetap dimatikan (`false`) pada lingkungan produksi/publik sampai prasyarat operasional dipenuhi (smoke live provider berstatus `BLOCKED`).
