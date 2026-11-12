# Fondasi izin F03 — R03

Migration `20261112000300_bakery_permissions.sql` menerapkan izin pada schema F02, bukan halaman login/CRUD. Seluruh 26 tabel public memiliki RLS; grants public/anon/authenticated di-reset dan diberikan eksplisit. Tidak ada view yang membypass RLS. Public schema menolak CREATE dan default grants otomatis untuk objek baru milik postgres dicabut. Local Data API hanya mengekspos `public`, dengan `auto_expose_new_tables=false`. Auth signup publik nonaktif; profil/role tidak dapat ditulis runtime, termasuk owner.

## Matriks aktual

| Resource                   | Anon / Auth tanpa profil                                                                            | Owner aktif                                    | Branch admin aktif                                                                                               |
| -------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Branches / hours           | SELECT cabang aktif                                                                                 | Global CRUD                                    | SELECT publik; tidak menulis                                                                                     |
| Catalog / category / media | SELECT parent published, SKU active, offered pada cabang aktif; image approved                      | Global CRUD                                    | SELECT publik; tidak menulis global                                                                              |
| Offers                     | SELECT listed + public SKU + cabang aktif                                                           | Semua cabang/harga                             | SELECT own unlisted + public; INSERT/UPDATE own active branch, public SKU, hanya availability whitelist          |
| Options / fixed components | SELECT parent bundle public dan component public; choice active                                     | Global CRUD                                    | SELECT publik                                                                                                    |
| Dietary / allergens        | Mapping verified pada SKU public; taxonomy hanya yang terhubung                                     | Global CRUD; evidence melalui RPC owner        | SELECT publik; tidak menulis                                                                                     |
| Promotions / pivots        | Published + enabled + server time window + target/branch public; pivot menyaring target tersembunyi | Global CRUD                                    | SELECT publik                                                                                                    |
| Programs / sessions        | Program published/review selesai/cover approved, cabang aktif; closed/full tetap boleh public       | Global CRUD                                    | INSERT/UPDATE sesi own branch aktif, program published; tanpa override harga atau pindah identity/branch/program |
| Testimonials / FAQ / CMS   | Published; testimony harus consent; kolom evidence tidak diberikan                                  | Global CRUD; private metadata melalui RPC      | SELECT publik                                                                                                    |
| Admin profiles             | DENY anon; Auth hanya own row jika ada                                                              | Own/all profile SELECT, tanpa runtime mutation | Own profile SELECT, tanpa runtime mutation                                                                       |

Owner policy memakai USING dan WITH CHECK. Staff INSERT/UPDATE policies juga mengecek branch dan parent, bukan hanya filter UI. Staff tidak memiliki DELETE; availability diubah lewat status/listing dan sesi ditutup/cancel, bukan hard delete. Future UI menerapkan soft archive sesuai PRD; grant DELETE owner bukan UI hard-delete workflow.

`bakery_private.enforce_staff_fields()` berjalan sebelum trigger timestamps. Offer whitelist: `is_listed`, `availability_status`, `stock_quantity`. Update field lain (termasuk harga/IDs/timestamps) ditolak; INSERT baru mewajibkan override NULL dan timestamps server default. Existing owner override boleh tetap tersimpan saat staff mengubah availability. Sesi whitelist: waktu/deadline/capacity/seats/status/registration flag; harga/branch/program/PK tidak dapat diganti staff. Owner boleh mengelola harga, tetapi PK/slug/SKU/code tetap immutable menurut F02. Maintenance postgres/service role bukan credential runtime aplikasi.

## Kolom privat dan RPC

Visibility SKU mewajibkan offer SKU itu sendiri listed pada minimal satu cabang aktif; active SKU yang belum ditawarkan tidak ikut terbuka hanya karena parent published. Gambar variant-bound, dietary/allergen mapping dan promotion variant pivots mengikuti predicate yang sama. Staff memakai helper eligibility terpisah (active SKU + parent public) bersama branch scope, sehingga bisa mengaktifkan kembali own unlisted offer tanpa membuka SKU itu bagi anon terlebih dahulu.

Tidak ada table-wide SELECT untuk empat tabel berikut, termasuk untuk shared role `authenticated`. Pemanggil wajib memilih kolom public eksplisit; SELECT wildcard atau kolom privat menghasilkan permission denied melalui direct REST.

| Tabel                  | Kolom tanpa runtime SELECT        |
| ---------------------- | --------------------------------- |
| `variant_dietary_tags` | `note`                            |
| `variant_allergens`    | `source_note`                     |
| `testimonials`         | `consent_reference`, `consent_at` |
| `site_content`         | `updated_by`                      |

Satu RPC anon: `read_active_branches()` adalah SQL STABLE SECURITY INVOKER, fixed projection, tanpa mutation. Tiga RPC authenticated adalah SECURITY DEFINER STABLE dengan guard owner dari DB pada setiap panggilan: `read_owner_testimonial_evidence(uuid)`, `read_owner_variant_evidence(uuid)`, `read_owner_content_audit(text)`. Signature/output tetap; tidak menerima nama tabel atau SQL. Staff/unprofiled/revoked owner ditolak. Fungsi ini hanya membaca evidence; tidak memberi privilege SELECT kolom asli.

Helper role di schema private membaca admin_profiles sebagai definer sehingga tidak rekursif. Seluruh definer memakai search_path kosong dan qualified relations; bukan dynamic SQL. `is_owner()` / `can_manage_branch(uuid)` hanya EXECUTE authenticated, helper visibility boolean untuk anon/authenticated, helper trigger/integrity tidak dapat dieksekusi runtime. `valid_cms` hanya pure validator untuk CHECK authenticated. Schema private tidak diekspos Data API. JWT user_metadata/body role diabaikan; profile revocation segera berlaku tanpa menunggu JWT kedaluwarsa.

RPC/table frontend admin belum ada. Saat F15/F17 dibuat, server tetap memverifikasi identitas/profile, Origin/CSRF, input/output Zod dan conditional updated_at. Mutasi owner atas empat tabel privat harus meminta returning kolom yang diizinkan, bukan `select('*')`. Permission SQL bukan pengganti handler boundary.

## Storage aktual dan batasnya

- `media-drafts` private. Owner-only SELECT/sign/INSERT/UPDATE/DELETE. Path upload `<owner UUID>/drafts/<random UUID>.<ext>`.
- `product-images`, `class-images`, `brand-assets` public; download public URL melewati read RLS menurut SDK/layanan Supabase. Hanya owner bisa upload ke `approved/<random UUID>.<ext>`. Memilih bucket public adalah aksi publikasi approved, bukan tempat draft. Owner dapat membaca/membersihkan bucket yang diizinkan; runtime tidak boleh mengubah konfigurasi bucket.
- Buckets membatasi 5 MiB dan MIME JPEG/PNG/WebP/AVIF; SVG ditolak. Validasi magic bytes/decode/dimensi/reencode serta izin aset nyata tetap F17. Policy tidak membuktikan ukuran piksel atau consent nyata, dan public URL tidak bisa dipakai untuk melindungi draft.
- **Grants bawaan managed Storage tetap ada:** `supabase_storage_admin` adalah grantor yang tidak dapat diambil alih role migration postgres. REVOKE sebagai postgres hanya mencabut grants miliknya sendiri. Tidak memakai eskalasi owner/superuser. Karena itu deny mutasi Storage dibuktikan oleh RLS owner-only + tes endpoint nyata, bukan klaim bahwa anon tidak memiliki privilege tabel managed. Bucket/objects RLS tetap enabled; tidak ada policy write anon/public atau bucket mutation runtime. Storage schema bukan exposed REST schema.
- Service-role/privileged credentials hanya untuk fixture maintenance lokal; tidak ada pada aplikasi/chat/admin runtime atau file env contoh. Public helper proyek memakai anon client terpisah, menimpa Authorization ke anon dan menghapus cookie pada transport.

Referensi: [Supabase public/private buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals), [Storage RLS](https://supabase.com/docs/guides/storage/security/access-control), [PostgreSQL column privileges](https://www.postgresql.org/docs/17/ddl-priv.html). Public download berbeda dari izin upload/update/delete; tes menguji keduanya.

## Harness dan bukti

Sejak F04, `test:db`/`db:test:policies` mengorkestrasi stack disposable `resep-oma-kueh-policy-test`, API/DB 55321/55322, di workspace ignored `test-results/f04-policy-stack`. Hanya migrations/tests yang disalin, seed disabled; reset/stop --no-backup menarget project test itu saja. Dataset normal 54321/54322 tidak di-reset. `BAKERY_DB_POLICY_TEST=1` hanya dipasang pada child harness dengan target whitelist tetap. Raw fixture F03 berikut tetap memerlukan database kosong miliknya sendiri; tidak memaksa pengosongan dataset DEMO normal.

`npm run test:db` menjalankan pgTAP constraints/grant audit, dua-session concurrency F02, lalu `test:db:permissions`. Script permission memakai GoTrue admin createUser untuk empat identitas sintetis (owner, staff dua cabang, Auth tanpa profil), login password nyata dan validasi user JWT melalui GoTrue. Credential acak dan local CLI status disimpan hanya dalam memori; tidak mencetak token/password/response pribadi dan tidak menulis env aplikasi. Host/port/project/container diverifikasi lokal. Test menolak business dataset nonkosong; tidak melakukan reset otomatis.

Fixture `scripts/db/permissions-fixture.sql` adalah synthetic DEMO, bukan seed produksi. Dynamic promo/session dates relatif waktu transaksi hanya untuk menguji policy window saat itu; bukan jadwal bisnis atau fixed seed clock F04. Snapshot seluruh 26 tabel bisnis + Storage buckets/objects dibandingkan sebelum/sesudah read RPC dan seluruh expected-deny batch. Fixture cleanup menghapus hanya ID dataset test, file yang baru dibuat, dan Auth users yang baru dibuat; snapshot bisnis awal harus pulih.

REST menguji JWT signature melalui Supabase sesungguhnya. SQL role-context memakai claims JWT terbitan GoTrue yang sudah diverifikasi, SET ROLE anon/authenticated, lalu rollback; **SQL context injection sendiri tidak memverifikasi signature**, sehingga tidak dipakai sebagai satu-satunya bukti auth. pgTAP katalog metadata dijalankan oleh test runner dan juga bukan pengganti negative REST tests.

Actual SDK `createPublicReadClient()` dipakai dalam harness dengan session owner yang sengaja disuntikkan melalui sign-in. SELECT draft tetap kosong, insert/update/delete/upsert DB ditolak, upload/upsert/update/delete/sign Storage ditolak dan read RPC tetap bekerja. Tidak ada mock untuk bukti ini. Halaman/chat endpoint belum diimplementasikan, sehingga static/runtime audit handler final tetap milestone berikutnya.

CI SQL menyalakan stack lokal dengan Auth/REST/Storage dan menjalankan harness; hasil lokal tidak dinyatakan sebagai hasil remote CI. Hosted rollout belum diotorisasi: migration + API exposed schemas/default exposure + disable signup perlu diterapkan dan diuji pada staging/production lewat proses rilis F26. Akses dashboard privileged tetap maintenance terpisah.
