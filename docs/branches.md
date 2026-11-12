# Kontrak cabang dan shell — F06

R05/R06, PRD §3–6,12,27.1,27.5. Fondasi F04/F05 dipakai; katalog/cart/checkout/provider chat belum dibuat.

## API dan domain

`GET /api/branches?branch=<stable-code>` adalah endpoint BFF (`/branches` relatif terhadap Axios base `/api`). Query opsional hanya branch; duplicate/unknown query atau syntax tidak valid ditolak 400. Domain menyelesaikan code ke UUID dari rows aktif yang terlihat oleh anon/RLS. Unknown/inactive code menghasilkan resolvedBranchId null, tidak memilih cabang lain. Read tanpa cookie/admin JWT; tidak ada mutation/RPC/Storage calls. Query memilih tujuh kolom publik secara eksplisit, diurutkan sort_order/id, dibatasi 24 rows; overflow gagal validasi, bukan daftar terpotong yang dianggap lengkap. Deadline 5 detik, SDK retry dimatikan untuk request ini; retry UI mengikuti F01.

Success envelope `ok/data/requestId`: data `{items: PublicBranch[], resolvedBranchId: UUID|null}`. List tidak dipaginasi; items kosong tetap 200. DTO item hanya id/code/name/city/whatsappNumber/address/mapsUrl, Zod strict pada input/output. DB/timeout/config/output failure adalah 503 UPSTREAM_ERROR generik, tidak diubah menjadi sukses kosong atau 404; requestId dan Cache-Control:no-store pada semua status. Tidak ada segment config cache lama.

Layout `(site)` tetap server: Suspense → await connection → getInitialBranches langsung (tanpa self-fetch). Error initial berbentuk status error; kontak approved tetap muncul. Hook client menggunakan Query key directory berdasarkan code URL (lookup belum punya resolved UUID), stale time publik 60 detik, AbortSignal ke service/Axios, satu query bersama beberapa observer. Initial directory tanpa query dipakai langsung, tanpa immediate refetch. Lookup URL membutuhkan query tambahan karena layout tidak menerima searchParams; lookup invalid/inactive tidak memakai preference. Query harga/stock fitur berikut wajib keyed resolved UUID, bukan key directory ini.

## Pemilihan dan navigasi

- Default server/browser pertama null. Zustand store dibuat per provider, skipHydration; rehydrate sesudah mount. Hanya selectedBranchId disimpan (dengan metadata version persist), tanpa alamat/pelanggan/cart/otorisasi. Merge Zod menolak field tambahan/UUID rusak; storage gagal tidak merusak pilihan URL.
- URL branch hadir selalu mengungguli preference. Valid → UUID hasil domain; invalid/inactive → null + notice, tidak diam-diam memakai preference. Tanpa URL, stored UUID hanya dipakai jika masih ada di directory aktif. URL yang valid sendiri tidak menulis preference; hanya interaksi selector yang menyimpan.
- Link shell mempertahankan code, termasuk URL lookup yang masih pending/invalid agar tidak tiba-tiba kembali ke preference lama. Helper withBranch mempertahankan filter/query/hash yang diberikan; selector memakai current pathname + semua search params, lalu mengganti branch saja. Unknown query ditolak pada API branches; page query/filter dimiliki fitur halaman berikutnya.
- Belum memilih boleh menjelajah. F06 tidak menampilkan harga final cabang/Add to Cart; fitur katalog wajib memakai selected null sebagai gate. Cart badge saat ini menerima real empty count 0; tidak membuat item, placeholder count palsu, cart persistence atau reset.
- Provider menyediakan cartItemCount/beforeBranchChange untuk F12. Selector dengan count >0 membuka dialog konfirmasi; sebelum callback menyetujui, preference/URL tidak berubah. Callback tidak tersedia/menolak/throw → fail closed. Tidak menghapus/reset item pada kasus mana pun. F12 bertanggung jawab revalidation/conflict item dan external URL/back-forward context changes; tidak boleh menganggap callback UI ini sebagai validasi checkout server.

## Kontak, route dan batas fitur

Footer memakai kontak cabang aktif dari DTO saat tersedia; kekurangan/error memakai approved contacts server-only dari fakta PRD/F04. Gmail/Instagram tetap approved config, bukan CMS draft. Fallback berisi kontak/alamat terkonfirmasi saja, tanpa UUID selectable, is_active, harga, stok, jam, fulfillment atau promo. Alamat Bintaro null dijelaskan terang; tidak membuat Maps/jam tebakan. Tidak mengirim WhatsApp/email, hanya tautan yang diklik user.

Navbar lima tujuan + bantuan footer memakai `(site)/[section]` allowlist untuk halaman persiapan yang jujur. Ini bounded route foundation agar link tidak rusak; tidak mengimplementasikan Home/About/catalog/contact/policy domain berikutnya. Route tak dikenal tetap 404. Cart belum menjadi tujuan aktif. Satu ChatSlot informatif mengikuti widget-enabled flag; belum ada input, provider request, percakapan atau history. Logo/foto masih placeholder DEMO F05, release blocker tetap berlaku.

## Bukti dan menjalankan lokal

`npm run format`, lint, typecheck, unit tests, build dan test:e2e. Suite UI memakai HTTP fixture sintetis ketika stack DB tidak dihubungkan; itu bukan bukti role isolation/API DB. Kasus HTTP DB nyata ditandai skip pada mode ini.

`node scripts/test-site-local.mjs` memverifikasi loopback bakery via harness F03/F04, mengambil anon key hanya di memori, menjalankan production build dan seluruh Playwright dengan koneksi lokal nyata. Tidak mengubah .env, reset/seed, Auth, migration atau remote. Service-role tidak diteruskan ke aplikasi. Business/Storage snapshot sebelum/sesudah harus identik. Docker/local stack harus sudah hidup; failure readiness bukan PASS. Build yang dihasilkan mode ini hanya untuk test lokal dan mengandung public local anon configuration; jangan deploy output itu. Lakukan build konfigurasi target lagi untuk rilis.

Hasil aktual/exit dan screenshot ada di implementation-status.md. R05 masih menunggu aset produksi; R06 masih menunggu cart/checkout F12 dan fulfillment/admin F18. Browser selain Chromium, screen reader manusia, hosted CI dan remote deployment belum terbukti oleh suite ini.
