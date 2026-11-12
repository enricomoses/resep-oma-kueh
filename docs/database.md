# Database — F02

## Data dan tooling F04 (aktual)

`20261112000400_seed_provenance.sql` menambah hanya `bakery_private.seed_state`, marker dataset/versi/clock dengan RLS dan tanpa grants runtime. Tidak ada tabel bisnis/public/RPC baru; 26 tabel public tetap. `supabase/seed.sql` data-only, transaction + INSERT ON CONFLICT DO NOTHING; tidak berisi CREATE/ALTER/policy/function/password. Schema tetap hanya di migrations.

| Dataset              | Isi / publikasi                                                                                                                                                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Confirmed business   | Dua cabang/WA dan alamat Surabaya dari PRD; Bintaro address, Maps null; hours tidak dibuat. Fulfillment tetap false karena belum dikonfirmasi                                                                                            |
| Historical reference | 13 produk draft + needs_owner_review=true, 13 kategori seri draft; SKU/harga hanya jika ada kutipan PRD, harga unknown berarti tidak membuat SKU; tidak offered/published                                                                |
| Synthetic DEMO       | 8 produk published + 13 kategori DEMO published, 16 active SKU (total seluruh dataset 21 produk/25 SKU), 2 bundle Regular/GF, 4 component products dengan SKU Regular/GF, options quantity_per_selection=3                               |
| Dietary / allergens  | Taxonomy empat tags/enam allergens; lima GF mappings verified hanya pada SKU DEMO dengan evidence note SYNTHETIC; bukan klaim komersial                                                                                                  |
| Promotion / classes  | Tiga promo expired/current/future relatif fixed clock, dua program DEMO dan tiga sesi (completed, scheduled/open dengan seats, full/closed)                                                                                              |
| Content / testimony  | Kontak terkonfirmasi, brand/profile/legal/reference FAQ draft, copy DEMO published. Empat quote historis anonim draft, rating/consent NULL; tidak ada fake published review                                                              |
| Media                | PNG teknis code-generated bertuliskan DEMO; bukan foto/logo bisnis. Path deterministic `approved/f0400000-0000-4000-8000-000000000990.png` di tiga bucket public, diupload maintenance lokal sesudah SQL; existing berbeda tidak ditimpa |

**SEED_REFERENCE_DATE = 2026-11-11T00:00:00+07:00.** Promo current berlaku 10–18 November 2026; future mulai 11 Desember; kelas open 11 Desember. Verifier memakai injected fixed clock untuk assertion fixture, tetapi actual anon/RLS menggunakan server clock sekarang. Tidak mengubah now(), memperbarui dates otomatis, atau mengklaim jadwal komersial. Saat tanggal lewat, demo akan menampilkan expired/no upcoming sesuai query berikutnya.

Coffee fixture Slice/Mini/Whole 15k/70k/140k; ROK slice/whole; cabang pertama Coffee Slice sold_out/stock 0, cabang kedua unconfirmed/override 16k (teknis DEMO). Satu bundle = dua fixed slots ×3 + dua groups ×3 =12; GF variant hanya memakai components GF verified sintetis. RLS membatasi public query ke delapan produk DEMO, bukan reference drafts. Root layout tetap server; satu banner F04 “Data demo — bukan katalog pemesanan aktif” tidak mengimplementasikan storefront F05–F10.

Commands dari root bakery (Docker harus sehat):

```powershell
npm run db:start
# DESTRUCTIVE LOCAL ONLY: menghapus data DB bakery lokal lalu mengulang migration + seed.
npm run db:reset:local
npm run db:seed:verify
npm run test:db:seed
npm run db:types:local
npm run db:types:local -- --check
npm run db:test:policies
npm run test:db:tooling
npm run db:seed:reference
```

CLI terpasang 3.1.0: `db reset`, `gen types --lang typescript --schema public` default LOCAL; **tidak memakai --local yang tidak tersedia**. Wrapper menolak flags remote/target tak dikenal, memeriksa project/container/loopback port. db:start insert-missing hanya pada dataset kosong atau marker DEMO; data non-DEMO existing dipertahankan. db:reset:local mengumumkan penghapusan dan hanya mengakses 127.0.0.1:54322. Asset uploader memakai service credential lokal hanya di memori script maintenance, tidak env aplikasi. Seed tidak membuat akun Auth/admin.

Type generator meng-capture stdout sebagai buffer UTF-8, memvalidasi output Database, memformat dengan Prettier, menulis temporary file di direktori yang sama dan rename setelah exit 0. CLI failure/invalid output tidak men-truncate file lama. `test:db:tooling` membuktikan failure CLI nyata, byte/content UTF-8 lama utuh, success rename dan tidak ada partial temporary file. Generated `src/types/database.ts` dipakai generic semua SDK helpers; schema column/RPC typecheck menguji quantity/seats/IDR. CI regeneration --check mendeteksi schema drift; generated file tidak diedit manual.

`test:db:seed` menjalankan seed dua kali dan membandingkan snapshot seluruh tabel bisnis/Storage; owner-edit probe berada dalam transaksi rollback. `db:seed:verify` menguji counts/contacts/null hours/FK/price/offer/12 slice/GF/seats/clock dan public anon sample serta deny insert. `test:db`/`db:test:policies` menggunakan disposable test stack **55321/55322** tanpa seed sehingga fixture F03 tetap clean dan negative owner/staff/anon tests tidak menghapus DEMO atau edit owner pada stack normal. Scope dan caveat JWT di [security.md](security.md).

## Production-reviewed manifest dan guarded reference tool

`supabase/seeds/production-reviewed.json` hanya memuat dua kontak cabang, alamat Surabaya dan Gmail/Instagram yang dikonfirmasi. Bintaro address/Maps/hours, fulfillment, produk/harga/stock/claims/promo/kelas/testimony tidak dimasukkan. Insert memakai defaults aman; existing field owner tidak di-update secara default. `db:seed:reference` tanpa target adalah **offline dry-run**, tidak memerlukan credential atau melakukan request.

Remote read/apply **NOT RUN pada F04**, tidak termasuk otorisasi coding ini. Untuk penggunaan yang nanti diotorisasi: `--project-ref=<ref>` eksplisit dan maintenance PAT di environment terpisah dari aplikasi diperlukan; tool memverifikasi project name/ref lewat Management API dan mengambil read_only snapshot. Before/after diff hanya approved business fields disimpan private di `test-results/reference-review/plan-<ref>.json` (Git-ignored; tidak menulis credential/admin evidence), console hanya field names/digest. Baca file diff sebelum mengizinkan apply. Endpoint [Management API query](https://supabase.com/docs/reference/api/v1-run-a-query) masih beta; kegagalan target/API memblokir operasi, bukan fallback ke target lain.

Apply perlu `--apply --confirm-project-ref=<ref> --approve-digest=<sha256>` dari dry-run terkini. Default hanya insert missing. Update existing perlu `--update-fields=branches.address,...` yang masuk allowlist confirmed fields, diff digest cocok, dan conditional expectedUpdatedAt. Multi-field updates dikelompokkan per row; zero affected/conflict rollback transaksi. Tidak mengubah is_active/fulfillment/SKU/pricing/role. Dataset dengan marker DEMO atau pending published review diblokir. Tidak pernah membaca/mengirim seed.sql ke remote atau reset remote. Tests guard/SQL template lokal bukan bukti apply hosted; rollout/staging/release tetap F26.

`NEXT_PUBLIC_DEMO_MODE` default true; APP_ENV=production menolak true. Rilis nyata wajib explicit false **dan** audit dataset production-reviewed (flag UI bukan izin database). Provider disabled tetap tidak memerlukan key. App env lokal tidak diubah; owner mengisi URL/publishable key lokal secara privat saat UI DB dipakai.

## Snapshot schema F02

Bagian F02 berikut adalah snapshot schema awal. Izin runtime terbaru diterapkan F03 melalui `20261112000300_bakery_permissions.sql`; matriks grants/RLS/RPC/Storage dan bukti JWT nyata ada di [security.md](security.md). Tidak menganggap deny-all F02 masih menjadi konfigurasi terkini.

Sumber schema tunggal: `supabase/migrations/20261112000100_bakery_schema.sql` dan `20261112000200_bakery_integrity.sql`. PostgreSQL lokal 17; schema `public` berisi 26 tabel MVP. Tidak ada seed bisnis, tabel fase 2, RPC aplikasi, atau policy runtime. Seluruh tabel public mengaktifkan RLS dalam transaksi pembuatan dan grants anon/authenticated dicabut. Ini belum membuktikan isolasi owner/staff/anon: F03 wajib menguji JWT/direct REST, column grants, dan Storage.

```mermaid
erDiagram
  AUTH_USERS ||--o| ADMIN_PROFILES : identity
  BRANCHES ||--o{ ADMIN_PROFILES : scope
  BRANCHES ||--o{ BUSINESS_HOURS : hours
  CATEGORIES o|--o{ CATEGORIES : parent
  PRODUCTS ||--o{ PRODUCT_CATEGORIES : categorized
  CATEGORIES ||--o{ PRODUCT_CATEGORIES : includes
  PRODUCTS ||--o{ PRODUCT_VARIANTS : skus
  PRODUCTS ||--o{ PRODUCT_IMAGES : media
  PRODUCT_VARIANTS o|--o{ PRODUCT_IMAGES : optional_sku
  BRANCHES ||--o{ BRANCH_VARIANT_OFFERS : lists
  PRODUCT_VARIANTS ||--o{ BRANCH_VARIANT_OFFERS : offered
  PRODUCT_VARIANTS ||--o{ OPTION_GROUPS : bundle
  OPTION_GROUPS ||--o{ OPTION_CHOICES : selects
  PRODUCT_VARIANTS o|--o{ OPTION_CHOICES : component
  PRODUCT_VARIANTS ||--o{ BUNDLE_FIXED_COMPONENTS : parent_and_component
  PRODUCT_VARIANTS ||--o{ VARIANT_DIETARY_TAGS : claims
  DIETARY_TAGS ||--o{ VARIANT_DIETARY_TAGS : taxonomy
  PRODUCT_VARIANTS ||--o{ VARIANT_ALLERGENS : describes
  ALLERGENS ||--o{ VARIANT_ALLERGENS : taxonomy
  PROMOTIONS ||--o{ PROMOTION_BRANCHES : branches
  BRANCHES ||--o{ PROMOTION_BRANCHES : target
  PROMOTIONS ||--o{ PROMOTION_CATEGORIES : categories
  CATEGORIES ||--o{ PROMOTION_CATEGORIES : target
  PROMOTIONS ||--o{ PROMOTION_PRODUCTS : products
  PRODUCTS ||--o{ PROMOTION_PRODUCTS : target
  PROMOTIONS ||--o{ PROMOTION_VARIANTS : variants
  PRODUCT_VARIANTS ||--o{ PROMOTION_VARIANTS : target
  CLASS_PROGRAMS ||--o{ CLASS_SESSIONS : sessions
  BRANCHES ||--o{ CLASS_SESSIONS : hosts
  AUTH_USERS o|--o{ SITE_CONTENT : updated_by
  TESTIMONIALS { uuid id PK }
  FAQS { uuid id PK }
```

## Kontrak constraint

- UUID PK, FK `RESTRICT`, timestamps dan trigger `updated_at` pada semua tabel termasuk pivots. Semua FK memiliki indeks leading yang sesuai. `created_at`, PK, slug/SKU/code immutable; rename display tidak mengubah permalink. Mengganti slug/SKU perlu migration maintenance yang ditinjau, bukan edit nama. Relasi non-PK tetap dapat diedit sepanjang integritas akhir valid.
- Domain private membatasi label 200 karakter, body 10.000 karakter, slug lowercase URL-safe, internal media path 500 karakter, unit IDR 1–1 miliar, nominal nonnegatif sampai 1 triliun. PostgreSQL menghitung panjang Unicode code points; Zod request boundary berikutnya tetap wajib memakai batas UTF-16/UTF-8 PRD. Kuantitas SKU 1–99. Harga maksimum seluruh konfigurasi opsi dan override juga ≤1 miliar; gross cart dibatasi service F11.
- Partial unique: paling banyak satu kategori primary, satu SKU default, satu gambar primary per produk. Composite FK gambar memastikan variant milik produk yang sama. Kategori menolak self/cycle serta published child dengan parent belum published.
- Offer tanpa row bukan offered. `stock_quantity=0` mewajibkan `sold_out`; null berarti tidak dilacak. Hours nullable berarti belum diketahui; interval parsial/terbalik/overnight ditolak.
- Mapping diet pending tidak menjadi klaim publik; verified mewajibkan timestamp. Tidak ada inferensi bebas alergen dari mapping kosong. `note`, `source_note`, consent dan `updated_by` tetap privat; F03 harus menerapkan column/projection grants sebelum SELECT publik.
- Promo memakai numeric(12,2) agar fixed IDR 1 miliar dapat direpresentasikan; percentage ≤100, fixed integer, cap/min-spend nonnegatif ≤1 triliun, finite interval start<end, stackable selalu false. Scope hanya boleh memakai pivot target yang sesuai; scope all tanpa target. Publish scope spesifik butuh target published/active yang valid. Branch pivot kosong berarti seluruh cabang aktif; eligibility waktu/branch/target dan kalkulator diskon F10–F11.
- Class: harga positif, age 0–120 dan min≤max, duration positif, included_items array string ≤50 dengan payload bounded. Session finite start<end, deadline≤start, capacity>0, seats null atau 0..capacity. Registrasi terbuka hanya scheduled, seats tidak nol, branch aktif dan program published. Closed/full boleh tetap tampil setelah F03.

## Publish prerequisites

Validasi aggregate **deferred sampai akhir transaksi**. Perubahan child/category/offer/claim juga memvalidasi ulang parent yang sudah published; tidak cukup hanya menguji tombol publish. Untuk membuat draft baru, konfigurasi boleh belum lengkap. Editor F17 harus menyimpan aggregate secara atomik, atau men-draft parent terlebih dahulu untuk perubahan yang belum lengkap.

| Entitas       | Syarat                                                                                                                                                                                                                |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Category      | Parent, bila ada, published; graph tanpa cycle                                                                                                                                                                        |
| Product       | Review selesai, minimal satu active SKU (simple tepat satu), minimal satu category published, minimal satu active SKU listed pada branch aktif, minimal satu approved public image dengan alt dan variant null/active |
| Bundle        | Seluruh active SKU published harus recipe verified, 12 slices; parent component published, SKU active, listed di setiap cabang bundle listed; sold-out tetap awareness, belum menjamin bisa dibeli                    |
| Promotion     | Scope/target sesuai; scope spesifik minimal satu target valid published/active; window/cap/status valid; enabled terpisah, bukan bukti sedang berlaku                                                                 |
| Class program | Review selesai, description nonkosong, cover approved di `class-images` beserta path/alt                                                                                                                              |
| Testimonial   | Consent timestamp dan reference nonkosong; rating opsional 1–5                                                                                                                                                        |
| FAQ           | Category/question/answer nonkosong dan bounded; publish status eksplisit                                                                                                                                              |
| CMS           | Key/payload allowlist, field wajib per key, plain text, media approved jika dipakai                                                                                                                                   |

`product_images.storage_bucket/is_approved`, class cover bucket/approval/alt/review, dan variant `bundle_recipe/bundle_rules_verified` adalah metadata prasyarat, **bukan bukti objek Storage/izin nyata**. F17 memvalidasi file/izin dan F03 mengamankan kolom/policy. Tidak ada bucket yang dibuat F02.

## Recipe Chiffon Mix

MVP hanya mendukung `bundle_recipe='chiffon_mix'`. Dua fixed slots `cheese`/`choco` ×3; tepat dua required groups min=max=1 dengan **quantity_per_selection=3**. Setiap group memiliki active choice yang menunjuk real component SKU non-bundle; recursion/self dilarang. Dua fixed products berbeda; pilihan tidak boleh sama dengan fixed flavour. Harus tersedia pasangan pilihan dengan dua product IDs berbeda. Product ID adalah identitas rasa; SKU adalah ukuran/formulasi. Owner memetakan slot Cheese/Choco dan memverifikasi komposisi; schema tidak menebak rasa dari nama.

Pools C/D boleh tumpang tindih; pilihan pelanggan yang sama antargroup **tetap harus ditolak F11**, karena selections tidak dipersistenkan F02. Tidak ada tabel cart/order untuk memaksakan aturan pada data yang belum ada. Verified gluten-free pada bundle memerlukan mapping GF verified pada semua fixed dan active choice components. Quote tidak mengurangi stok komponen.

## CMS payload aktual

Semua key menolak property lain, HTML, tipe salah, dan payload >32 KB. Draft boleh parsial `{}`; published wajib field berikut. String adalah plain text, bukan rich HTML. Path internal dan approval diverifikasi server saat implementasi CMS/media.

| Key                                                                     | Fields (yang wajib ketika published)                                                                  |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `business.contacts`                                                     | `email`, `instagram_url`                                                                              |
| `home.hero`                                                             | `headline`, `subcopy`, `image_path`, `image_alt`, `media_approved=true`                               |
| `home.story`, `home.class_promo`, `home.custom_business`, `about.story` | `title`, `body`; optional `image_path`, `image_alt`, `media_approved` (path published wajib approval) |
| `about.values`                                                          | `items`: nonempty array string ≤200 karakter/item                                                     |
| `footer.note`                                                           | `text`                                                                                                |
| `legal.privacy`, `legal.ordering_policy`                                | `title`, `body`                                                                                       |
| `community.instagram`                                                   | `url`, `items`: nonempty array `{image_path,alt,href,media_approved:true}`                            |

Instagram URLs memakai host `www.instagram.com` HTTPS. Per-key Zod schemas/DTO dan UI mengikuti kontrak ini saat F20, bukan dibuat kosong sekarang. Tidak ada isi kontak/copy bisnis yang diinsert F02.

## Transaksi dan pengujian

`bakery_private.integrity_guard` satu row internal (bukan seed bisnis) di-update pada BEFORE STATEMENT. Semua penulis bakery diserialkan untuk mencegah cycle/publication write skew, termasuk snapshot REPEATABLE READ yang harus retry pada serialization failure. Trigger SECURITY DEFINER memakai search_path kosong, nama tabel qualified, tanpa dynamic input/RPC; EXECUTE dan akses schema private dicabut dari runtime. Validator memeriksa aggregate published global; biaya sesuai katalog MVP, optimisasi terarah baru setelah measurement. Jangan men-disable trigger atau memberi runtime TRUNCATE.

`npm run test:db` menjalankan pgTAP pada **local stack**; `supabase/tests/database/constraints.test.sql` membuat fixture DEMO dalam transaksi dan rollback. Bukan seed atau data owner. Jalankan stack sampai start selesai sebelum migration/reset/test agar tidak berlomba dengan bootstrap. `npx supabase db reset --no-seed` hanya setelah memverifikasi loopback dan mengumumkan penghapusan data lokal. Tidak memakai `--remote`.

Script `scripts/test-db-concurrency.mjs` memverifikasi project/container/port lokal lalu menjalankan dua sesi PostgreSQL nyata. Transaksi kedua mengambil snapshot REPEATABLE READ sebelum transaksi pertama commit; update kategori kedua ditolak 40001 melalui guard row, bukan sekadar asumsi lock. Dua kategori DEMO khusus dihapus dalam cleanup. Script tidak menerima URL hosted atau memerlukan app env. CI menambahkan job SQL yang menjalankan local start → reset tanpa seed → test:db; hasil remote job belum diklaim.

Referensi perilaku deferred constraint: [PostgreSQL 17 triggers](https://www.postgresql.org/docs/17/trigger-definition.html). Runner mengikuti [Supabase database testing](https://supabase.com/docs/guides/database/testing). Hasil command aktual dicatat di implementation-status, bukan disimpulkan dari dokumentasi.
