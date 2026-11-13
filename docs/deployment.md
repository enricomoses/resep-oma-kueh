# Paket Rilis & Deployment Runbook — Resep Oma Kueh (F26 / R26)

Status dokumen saat ini: **`READY FOR RELEASE REVIEW`** — konfigurasi build, health check, smoke verifier, dan runbook sudah siap di repositori untuk ditinjau Owner. **Belum ada mutasi database remote maupun deployment ke hosting yang dieksekusi** sebelum Owner menunjuk target (`staging` lebih dulu, lalu `production`).

Rujukan: [PRD §20 & §27.7](prd.md), [keamanan RLS/Storage](security.md), [database & seed](database.md), [panduan UAT F25](uat-f25.md), [panduan operasional Owner](owner-manual.md).

---

## 1. Verifikasi Terms, Kuota Host, & Kompatibilitas Adapter

Evaluasi platform rilis (diverifikasi untuk stack Next.js `16.4.6` / React `19.3.0` / Node `24.18.0`):

| Komponen                          | Kandidat / Status                | Batas Kuota & Ketentuan Layanan Terverifikasi                                                                                                                                                                                                                                                      | Batasan Teknis & Catatan Operasional                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hosting Web (Utama)**           | **Netlify Free**                 | Mengizinkan situs bisnis komersial. Menggunakan **300 kredit/bulan** (hard stop tanpa overage otomatis: ~15 kredit/deploy produksi, ~20 kredit/GB bandwidth, ~10 kredit/GB-jam compute, ~2 kredit/10.000 request; Deploy Preview gratis). Batas **1 anggota tim**. Bukan jaminan gratis selamanya. | Kompatibel dengan **Node.js 24** (`netlify.toml` + `.node-version` = `24.18.0`) dan Next.js 16 Adapter API lewat `@netlify/plugin-nextjs` (OpenNext, auto-managed Netlify tanpa perlu pin paket manual di `package.json`), mendukung RSC Streaming, `cacheComponents`, `proxy.ts`, dan Image CDN (`sharp`). **Limitasi Free tier:** fitur _Password Protection_ UI Netlify hanya tersedia di plan berbayar (Pro+); karena itu preview PR/staging **dilarang** memakai credential/DB produksi. |
| **Hosting Web (Ditolak Default)** | Vercel Hobby                     | **Melarang keras penggunaan komersial** (_personal or non-commercial use only_), termasuk website toko UMKM maupun MVP bisnis.                                                                                                                                                                     | Tidak boleh menjadi default produksi komersial.                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Database / Auth / Storage**     | **Supabase Free**                | Maksimal **2 proyek aktif** per organisasi (cukup untuk **1 Staging + 1 Production** terpisah). Kuota per proyek: **500 MB** Postgres, **1 GB** Storage, **5 GB** standard egress + **5 GB** cached egress/bulan, **50.000 MAU**.                                                                  | **Auto-pause setelah 7 hari tanpa aktivitas** (data tidak terhapus, namun app offline sampai unpause manual). **Tidak menyertakan automated daily backup / PITR** pada Free tier — wajib backup manual terenkripsi eksternal DB + media Storage.                                                                                                                                                                                                                                              |
| **Auth Email (SMTP)**             | **Custom SMTP (Wajib Produksi)** | Built-in SMTP Supabase dibatasi **2 email/jam** dan **hanya** mengirim ke anggota organisasi proyek Supabase (dev only).                                                                                                                                                                           | Untuk alur pemulihan kata sandi admin (`/admin/reset-password`), aktifkan Custom SMTP (mis. Resend / Brevo / SES + DNS SPF, DKIM, DMARC) sebelum UAT produksi.                                                                                                                                                                                                                                                                                                                                |

---

## 2. Konfigurasi Build, Node, & Environment Keys (Tanpa Nilai Secret)

File konfigurasi Netlify di root repositori: [netlify.toml](../netlify.toml)

- **Node.js & npm:** `.node-version` = `24.18.0`, `package.json` `engines.node >=24.18.0 <25`, `npm >=11.16.0 <12`.
- **Build Command:** `npm run build` (`next build` menggunakan `cacheComponents: true` & `partialPrefetching: true` di [next.config.ts](../next.config.ts)).
- **Next.js Adapter:** Gunakan deteksi otomatis **OpenNext / Netlify Next.js Runtime** (jangan mengunci versi `@netlify/plugin-nextjs` secara manual di `package.json`).

### Daftar Key Environment Aplikasi (Hosting UI)

**Jangan pernah menaruh nilai secret di Git atau log.** Pastikan seluruh key berikut diisi di dashboard lingkungan masing-masing:

| Nama Key                               | Sifat                    | Staging (`APP_ENV=staging`)                                       | Production (`APP_ENV=production`)                                 | Catatan Keamanan                                                                                            |
| -------------------------------------- | ------------------------ | ----------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                 | Publik (Build & Runtime) | URL HTTPS proyek staging (mis. `https://staging-....netlify.app`) | Domain/subdomain HTTPS produksi (mis. `https://resepomakueh.com`) | Dipakai canonical URL, OG metadata, CSP `upgrade-insecure-requests`, dan HSTS.                              |
| `NEXT_PUBLIC_SUPABASE_URL`             | Publik (Build & Runtime) | URL proyek Supabase **Staging**                                   | URL proyek Supabase **Production**                                | Otomatis masuk ke `images.remotePatterns` & CSP `img-src`/`connect-src`.                                    |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publik (Build & Runtime) | Publishable (`sb_publishable_...` / anon) key **Staging**         | Publishable (`sb_publishable_...` / anon) key **Production**      | Tidak pernah menerima `service_role` key; isolasi bergantung pada RLS & grants.                             |
| `NEXT_PUBLIC_CHAT_WIDGET_ENABLED`      | Publik                   | `true`                                                            | `true` atau `false`                                               | Menampilkan/menyembunyikan widget Ask Oma.                                                                  |
| `NEXT_PUBLIC_DEMO_MODE`                | Publik                   | `true` (atau `false` hanya di DB staging bersih non-demo)         | **`false` (WAJIB)**                                               | `getServerEnvironment()` menolak build/runtime jika `APP_ENV=production` dan `NEXT_PUBLIC_DEMO_MODE=true`.  |
| `APP_ENV`                              | Server-only              | `staging`                                                         | `production`                                                      | Divariasikan oleh `serverEnvironmentSchema` ([environment.server.ts](../src/config/environment.server.ts)). |
| `CHAT_PROVIDER_ENABLED`                | Server-only              | `false`                                                           | **`false` (default kill switch)**                                 | Wajib `false` kecuali Redis limiter & kuota biaya F23 telah disediakan.                                     |
| `GOOGLE_GEN_AI_API_KEY`                | Server Secret            | Kosong bila `CHAT_PROVIDER_ENABLED=false`                         | Hanya bila F23 diaktifkan                                         | Disimpan hanya di env server terenkripsi host.                                                              |
| `GOOGLE_GEN_AI_CHAT_MODEL`             | Server-only              | Kosong bila F23 off                                               | Hanya bila F23 diaktifkan                                         | Tanpa hardcoded model/rotasi API key.                                                                       |
| `CHAT_GENERATIVE_QUOTA_PER_DAY`        | Server-only              | Kosong bila F23 off                                               | Batas harian jika F23 on                                          | Gagal-tutup saat kuota habis.                                                                               |
| `CHAT_GENERATIVE_RPM_LIMIT`            | Server-only              | Kosong bila F23 off                                               | Batas per-klien/menit jika F23 on                                 | Memakai store limiter eksternal.                                                                            |
| `CHAT_GENERATIVE_GLOBAL_RPM_LIMIT`     | Server-only              | Kosong bila F23 off                                               | Batas global/menit jika F23 on                                    | Memakai store limiter eksternal.                                                                            |
| `CHAT_GENERATIVE_MAX_CONCURRENCY`      | Server-only              | Kosong bila F23 off                                               | Batas request paralel jika F23 on                                 | Menjaga kuota dan latency.                                                                                  |
| `CHAT_LIMITER_STORE_URL`               | Server-only              | Kosong bila F23 off                                               | URL HTTPS store limiter eksternal                                 | Wajib `https://` saat `APP_ENV=production`.                                                                 |
| `CHAT_LIMITER_STORE_TOKEN`             | Server Secret            | Kosong bila F23 off                                               | Token limiter eksternal                                           | Jangan menulis ke Supabase via `/api/chat`.                                                                 |
| `CHAT_LIMITER_HASH_SALT`               | Server Secret            | Kosong bila F23 off                                               | Salt acak untuk hash IP/klien                                     | Minimal 8 karakter.                                                                                         |

### Key Maintenance CLI Terpisah (TIDAK Masuk Env Runtime Aplikasi)

- `SUPABASE_ACCESS_TOKEN`: Dipakai hanya di terminal operator terisolasi saat menjalankan `npm run db:seed:reference -- --project-ref=<ref>`. **Dilarang keras** memasukkan token manajemen atau `SUPABASE_SECRET_KEY` ke environment aplikasi Next.js/Netlify.

---

## 3. Penyiapan Supabase Terpisah, Auth Allowlist, Storage, & Security Headers

Lakukan langkah berikut secara **terpisah** untuk project **Staging** lalu project **Production**:

1. **Buat Proyek Terpisah:**
   - Staging: `resep-oma-kueh-staging` (region dekat pengguna, mis. `ap-southeast-1` Singapore).
   - Production: `resep-oma-kueh` (region sama, password database kuat di password manager).
2. **Data API & Security Exposure (Dashboard → API Settings):**
   - Exposed schemas: **`public` saja** (`bakery_private` tidak boleh diekspos ke Data API).
   - `auto_expose_new_tables`: **`false`** (matching `supabase/config.toml`).
3. **Auth Allowlist, Signup, & Custom SMTP (Dashboard → Authentication):**
   - Matikan **Allow new users to sign up** (`enable_signup = false`).
   - Isi **Site URL** persis dengan `NEXT_PUBLIC_SITE_URL` target.
   - Isi **Redirect URLs** secara eksplisit:
     - Staging: `https://<staging-host>/auth/callback` dan `https://<staging-host>/admin/reset-password`
     - Production: `https://<prod-domain>/auth/callback` dan `https://<prod-domain>/admin/reset-password`
   - Konfigurasi **Custom SMTP** sebelum mengaktifkan reset password admin di produksi; uji satu kali email recovery dan cek inbox nyata.
   - Bootstrap akun admin lewat Dashboard Users → insert SQL ke `public.admin_profiles` (`role`: `'owner'` atau `'branch_admin'`, `branch_id` untuk `branch_admin`, `is_active = true`).
4. **Storage Policy & Origins:**
   - Migrasi `20261112000300_bakery_permissions.sql` membuat 4 bucket: `media-drafts` (private, owner-only SELECT/sign/upload/delete), serta `product-images`, `class-images`, `brand-assets` (public read, owner-only upload/update/delete, batas `5 MiB`, MIME `image/jpeg`, `image/png`, `image/webp`, `image/avif`; tanpa SVG).
   - Tidak ada bucket public write; validasi server pada `/api/admin/media/upload` melakukan decode/resize/strip EXIF via `sharp`.
   - Origin HTTPS Supabase target dan domain situs otomatis dikonfigurasi dalam CSP (`img-src`, `connect-src`) & `images.remotePatterns`.
5. **Preview Access & `noindex` Lock:**
   - `[context.deploy-preview.environment]` dan `[context.branch-deploy.environment]` pada [netlify.toml](../netlify.toml) mengunci `APP_ENV="staging"`, `NEXT_PUBLIC_DEMO_MODE="true"`, dan `CHAT_PROVIDER_ENABLED="false"`.
   - `isNoIndexDeployment()` (`src/utils/seo.ts`) memaksa `robots.txt` (`Disallow: /`) dan `<meta name="robots" content="noindex, nofollow">` bila `NEXT_PUBLIC_DEMO_MODE=true` atau hostname memakai prefix `staging.`, `staging-`, `preview.`, `preview-`, `deploy-preview-`, atau suffix `.vercel.app`.
   - Rute sensitif (`/admin/:path*`, `/auth/:path*`, `/cart`, `/checkout`, `/api/:path*`) selalu mengirim `X-Robots-Tag: noindex, nofollow` (serta `Cache-Control: no-store...` pada `/admin`, `/auth`, `/cart`, `/checkout`, dan `/api/health`).
6. **Health Check Non-Sensitive (`GET /api/health`):**
   - Route [src/app/api/health/route.ts](../src/app/api/health/route.ts) memeriksa konfigurasi env (`getServerEnvironment()`, akan gagal-tutup `503` jika `APP_ENV=production` masih memiliki `NEXT_PUBLIC_DEMO_MODE=true`) serta query ringan `branches` (`select id limit 1` batas timeout 3s).
   - Mengembalikan hanya `{ ok: true, data: { status: 'ok', checks: { database: 'ok' } }, requestId }` (`200`) atau `UPSTREAM_ERROR` (`503`) dengan `Cache-Control: no-store...`, `X-Robots-Tag: noindex, nofollow`, dan `Referrer-Policy: no-referrer` — **zero secrets, zero env keys, zero software/DB version strings**.

---

## 4. Urutan Migrasi, Dry-Run Manifest, & Dataset / No-Demo Checks

**Aturan Keras:** Jangan pernah menjalankan `supabase db reset` atau menerapkan `supabase/seed.sql` (berisi fixture `DEMO_*`) ke **Staging** maupun **Production**.

### Urutan Migrasi SQL Eksak (`supabase/migrations/`)

1. `20261112000100_bakery_schema.sql` — 26 tabel publik, domain type, enum, & triggers dasar.
2. `20261112000200_bakery_integrity.sql` — Foreign keys, partial unique, constraints integritas, & publish rules.
3. `20261112000300_bakery_permissions.sql` — Grants ketat, RLS 26 tabel, RPC read-only & owner evidence, trigger field staff, & Storage buckets/policies.
4. `20261112000400_seed_provenance.sql` — Tabel `bakery_private.seed_state` (penanda dataset DEMO).
5. `20261113000100_bakery_product_configuration_rpc.sql` — RPC atomik editor konfigurasi produk/varian/bundle (F17).
6. `20261113000200_bakery_branch_hours_offers_rpc.sql` — RPC atomik jam operasional & branch offers (F18).
7. `20261113000300_bakery_promotions_rpc.sql` — RPC atomik promo & target pivots (F19).
8. `20261113000400_bakery_cms_hardening.sql` — Hardening CMS, FAQ, & consent testimoni (F20).

### Langkah Dry-Run & Apply Reviewed Reference Manifest

Manifest terkonfirmasi awal (`Surabaya` + `Bintaro` WA targets, alamat Surabaya, email, Instagram; **tanpa** produk/harga/jam fiktif) berada di [production-reviewed.json](../supabase/seeds/production-reviewed.json).

```powershell
# 1. Offline dry-run (sudah diverifikasi F26 -> exit 0, tanpa jaringan)
npm run db:seed:reference

# 2. Link sementara / dry-run migrasi pada target yang diotorisasi (contoh Staging)
npx supabase link --project-ref <target-project-ref>
npx supabase db push --dry-run
# Periksa daftar 8 migrasi di atas, lalu terapkan bila disetujui:
# npx supabase db push

# 3. Inspeksi snapshot remote + buat diff digest privat (disimpan di test-results/reference-review/plan-<ref>.json, Git-ignored)
$env:SUPABASE_ACCESS_TOKEN = "<maintenance-pat-sementara>"
npm run db:seed:reference -- --dry-run --project-ref=<target-project-ref>

# 4. Setelah file diff dibaca Owner/Operator dan digest cocok, apply eksplisit:
npm run db:seed:reference -- --apply --project-ref=<target-project-ref> --confirm-project-ref=<target-project-ref> --approve-digest=<sha256-digest>
Remove-Item Env:SUPABASE_ACCESS_TOKEN
```

### Query SQL Pemeriksaan Kebersihan Dataset & Larangan Demo (Wajib `0 rows` / `false` Sebelum Go-Live)

Jalankan melalui SQL Editor Supabase Production (atau `read_only` check) sebelum menyalakan domain produksi:

```sql
-- 1. Pastikan TIDAK ada marker DEMO dan TIDAK ada produk DEMO
select count(*) as demo_state_rows from bakery_private.seed_state; -- HARUS 0
select count(*) as demo_products from public.products
where slug like 'demo-%' or name ilike '%DEMO%'; -- HARUS 0

-- 2. Pastikan tidak ada entitas published yang masih pending owner review
select id, slug from public.products where status = 'published' and needs_owner_review = true; -- HARUS 0 rows
select id, slug from public.class_programs where status = 'published' and needs_owner_review = true; -- HARUS 0 rows

-- 3. Pastikan semua testimoni published memiliki izin eksplisit
select id from public.testimonials
where status = 'published' and (consent_at is null or coalesce(trim(consent_reference), '') = ''); -- HARUS 0 rows
```

---

## 5. Backup Terpisah (DB + Media), RPO/RTO, & Strategi Rollback

- **Target Operasional Awal (PRD §27.7, wajib disepakati Owner & dibuktikan rehearsal):**
  - **RPO Katalog & Konten:** Maksimal **24 jam**
  - **RTO Pemulihan Layanan:** Maksimal **1 hari kerja**
  - _(Bukan SLA komersial terjamin selama berjalan di Free tier; dikendalikan oleh disiplin backup + unpause monitoring)._
- **Backup DB dan Media WAJIB Terpisah:**
  - **Database (Schema + Data):** Backup Postgres harian/sebelum perubahan besar memakai `pg_dump` / CLI terautentikasi ke arsip terenkripsi di luar Git publik (`supabase db dump` / `pg_dump --format=custom`). Jangan simpan file dump di repo!
  - **Media Storage (`product-images`, `class-images`, `brand-assets`, `media-drafts`):** Dump Postgres **TIDAK menyertakan file biner Storage**. Unduh seluruh objek dari 4 bucket melalui script/dashboard Storage ke folder terenkripsi terpisah (`offline`/`cloud drive` milik Owner dengan akses terbatas).
- **Perbedaan Rollback Kode vs Forward Corrective DB Migration:**
  - **Rollback Aplikasi Web:** Gunakan **Instant Rollback** ke _Previous Successful Deploy_ di Dashboard Netlify jika terjadi bug frontend/SSR tanpa perubahan skema DB.
  - **Perubahan Database:** **Dilarang** melakukan rollback skema destruktif (`DROP` / `db reset`) terhadap database yang sudah berisi data Owner. Perbaikan schema/RLS setelah migrasi rilis wajib dibuat sebagai **forward corrective SQL migration** baru (`YYYYMMDDHHMMSS_*.sql`) yang diuji di lokal/staging terlebih dahulu sebelum `db push` ke produksi.

### Catatan Restore Rehearsal (`TODO` — Diisi Saat Simulasi Staging)

| Tanggal Rehearsal   | Target Uji | Cakupan Backup (DB Dump + 4 Bucket Media)                          | Durasi Pemulihan Aktual (RTO Terukur) | Hasil Verifikasi Smoke & Integritas                    | Pelaksana        |
| ------------------- | ---------- | ------------------------------------------------------------------ | ------------------------------------- | ------------------------------------------------------ | ---------------- |
| `_Belum dilakukan_` | Staging    | DB + `media-drafts`/`product-images`/`class-images`/`brand-assets` | `_TBD (target <= 1 hari kerja)_`      | `TODO` (`smoke:runtime` + cek foto & consent evidence) | Owner / Operator |

---

## 6. Gate §10, Hasil CI Terkini, & Runtime Smoke Suite

### Gate Minimum Sebelum Rilis (`docs/execution-guide.md` §10)

| Jenis Verifikasi            | Bukti Wajib                                                                                                                         | Status Sebelum Deploy                                                                    |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Schema / Seed**           | Clean local reset + seed 2x idempoten + counts/FK/invariants + no-demo check remote                                                 | **Lokal: `NOT RUN (Docker offline)`** · Offline manifest dry-run: **PASS**               |
| **RLS / Chatbot Read-Only** | Direct JWT/REST negative tests `anon`/`staff`/`owner` (`test:db:permissions`) + `/api/chat` read-only                               | Server/boundary tests: **PASS** · Live Docker JWT script: **`NOT RUN (Docker offline)`** |
| **Price / Discount**        | Unit exact gross/bps/cap + checkout step-1 & step-2 `PRICE_CHANGED`                                                                 | **PASS** (Vitest + server + Playwright)                                                  |
| **Admin Aggregate**         | Commit atomik & rollback child invalid (editor produk, jam, promo)                                                                  | Server/UI tests: **PASS** · Live Docker RPC rerun: **`NOT RUN (Docker offline)`**        |
| **Checkout**                | Decoded WA URL & pesan cocok quote DB + 2 nomor cabang + zero DB order write                                                        | **PASS**                                                                                 |
| **UI / A11y**               | 375/390/768/1440 px, keyboard `Tab`, zoom 200%, `prefers-reduced-motion`, Axe WCAG AA `0 violations`                                | **PASS** (Chromium `48 passed, 2 skipped [BAKERY_SITE_LOCAL]`)                           |
| **Runtime Deploy (Hosted)** | Verifikasi langsung atas URL **HTTPS** staging & produksi yang benar-benar live (`smoke:runtime` + manual auth/WA/admin CRUD smoke) | **`NOT RUN (belum ada target deploy yang diotorisasi)`**                                 |

### Menjalankan Runtime Smoke Setelah Target Staging/Production Live

Begitu Anda memberi instruksi deploy dan target URL HTTPS aktif:

```powershell
# 1. Automated non-mutating HTTPS runtime smoke (tidak mengirim WhatsApp otomatis & tidak menulis order DB)
npm run smoke:runtime -- --url=https://<host-staging-atau-produksi>
```

**Checklist Runtime Smoke Tambahan (Manual via Browser HTTPS pada Target yang Sama):**

1. **HTTPS & Security Headers:** Kunjungi `https://<target>`, cek CSP aktif, sertifikat HTTPS valid, `/api/health` mengembalikan `200 ok` tanpa versi/secret, dan `/cart`, `/checkout`, `/admin/login` mengembalikan `Cache-Control: no-store` + `X-Robots-Tag: noindex, nofollow`.
2. **Dynamic Product, Real DB, & Branch Pricing:** Pilih **Surabaya** → buka `/menu` & `/menu/[slug]`, ganti varian → verifikasi gambar CDN termuat (`200`), pindah ke **Bintaro** → pastikan harga/status mengikuti DB Bintaro.
3. **Cart & Prepare Checkout Dua Nomor WhatsApp (Tanpa Kirim Otomatis):** Tambah produk (termasuk `Chiffon Slice Mix` bila tersedia), uji dialog konflik cabang, jalankan Langkah 1 (`/checkout`), klik Langkah 2 untuk **Surabaya** (`wa.me/6281703384308?text=...`) dan **Bintaro** (`wa.me/6285119785194?text=...`), cek teks & tombol salin fallback lalu tutup tab WhatsApp **tanpa menekan Kirim**.
4. **Admin Refresh, Login, Recovery SMTP, & Authorized CRUD:** Login Owner di `/admin/login` → refresh halaman (verifikasi sesi bertahan tanpa flash error) → uji `/admin/reset-password` menerima email lewat **Custom SMTP** → uji edit harga/stok/content/promo/kelas → login sebagai **Branch Admin** dan verifikasi akses cabang/owner-only terblokir (`403`).
5. **Baking Class & Ask Oma Read-Only Fallback:** Verifikasi `/classes/[slug]` + prepare registrasi mengarah ke WA cabang kelas tanpa write DB; uji Ask Oma (`/api/chat`) dengan pertanyaan harga cabang dan `"hapus produk"` → wajib menolak mutasi secara tegas dengan mode `CHAT_PROVIDER_ENABLED=false`.
