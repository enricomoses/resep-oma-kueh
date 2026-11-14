<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Kontrak bakery dan arsitektur

- Baca `docs/prd.md` revisi 1.1 dan `docs/execution-guide.md`; implementasikan hanya Fxx yang diminta. Bukti aktual ada di `docs/implementation-status.md`, keputusan di `docs/decisions.md`.
- Client UI → hook → browser service → `lib/axios` → BFF Route Handler → server domain/repository → Supabase. RSC boleh memanggil `features/*/service.server.ts` langsung tanpa self-fetch. Proxy hanya refresh, bukan otorisasi final.
- Page tipis (`page.tsx`), view tipis (`*-view.tsx` hanya data/status/komposisi). Sebelum membuat JSX atau komponen baru, cek komponen existing di `src/components/ui/`, `src/components/common/`, dan `_components/` terdekat untuk reuse.
- Penempatan komponen (`docs/frontend-structure.md` & `docs/prd.md` §16.3): hanya 2 folder di `src/components/` — `ui/` (primitif UI murni tanpa logic bisnis/API, termasuk kontrol form) dan `common/` (layout global & blok reusable lintas 2+ halaman/modul). Seluruh `*-view.tsx` dan komponen spesifik route wajib berada di `src/app/**/_components/` terdekat (atau `_components/` parent terdekat bila dibagi sub-route dalam satu modul); promosikan dari `_components/` ke `src/components/common/` jika mulai dipakai 2+ modul.
- Pecah UI berulang atau non-trivial (header halaman/section, branch pill/alert, stat/info card, dialog konfirmasi, filter bar, baris daftar, kartu, bagian form, loading/empty/error state) sampai unit terkecil yang single-responsibility; parent/view hanya menyusun komposisi dan mengoper props bertipe + `children`. Satu komponen visual utama/file (`kebab-case.tsx`, export `PascalCase`), `interface` props, `className?` + `cn`; provider tanpa DOM tidak membutuhkan `className`. Default export hanya untuk konvensi Next/tooling.
- Alias `@/`, `import type`, TypeScript strict tanpa `any`/`@ts-ignore`. Utamakan impor langsung per file; hindari barrel `index.ts` tak terpakai (`knip`) dan barrel yang melintasi batas client/server (`server-only` selalu impor langsung). Tidak ada Axios/SDK/fetch pada UI/hook atau SDK Supabase pada browser service.
- Constants untuk route/endpoint/query key/stale time/limit/copy; tambah hanya yang digunakan. Input dan output boundary memakai Zod. Transport mempertahankan envelope, requestId dan pagination; tidak menyamarkan error/abort atau memunculkan toast sendiri.
- Server env dan helper Supabase session per request diberi `server-only`. Public read client tidak menerima cookie/admin JWT/service-role; actual grants/RLS diuji F03, bukan dibuktikan oleh nama helper. Route Handler Auth harus mengoper response ke `createServerAuthClient(response)` agar cookies dan header cache SDK tidak hilang.
- Public reads baseline uncached. Ikuti Cache Components versi terpasang; jangan menyalin segment config Next lama. Matcher Proxy memakai literal karena static analysis Next; jangan memasukkan jalur chat/checkout publik.
- Bakery krem/burgundy, Plus Jakarta Sans/Fraunces/Barlow Condensed sesuai PRD pada F05; scaffold belum desain final. Tidak shadcn, warna/font BEM/Fina, payment, akun customer, order tracking, atau data bisnis karangan. Checkout/chat tidak menulis order/history/stock.
- Format: 2 spasi, single quotes, semicolon, trailing comma all, arrow parentheses; jalankan format → lint → typecheck/tes relevan → build, review diff dan update evidence. Jangan menulis secret/nilai env/PII ke log/response/laporan.

## Git per fitur — Resep Oma Kueh

Instruksi owner pada 12 November 2026 mengizinkan commit lokal dan push ke GitHub secara otomatis per fitur. Aturan ini menggantikan ketentuan commit/push manual pada PRD dan execution guide; tidak perlu meminta izin ulang untuk setiap Fxx.

- Selesaikan hanya Fxx yang ditugaskan, jalankan gate yang relevan, review diff setelah format, dan perbarui bukti implementasi sebelum commit. Fitur dengan gate wajib FAIL/BLOCKED/NOT RUN belum boleh di-commit sebagai fitur selesai.
- Buat satu commit terpisah untuk setiap fitur yang selesai, termasuk kode, migration, tes, dan dokumentasi yang terkait. Gunakan pesan Conventional Commits dengan scope Fxx, misalnya `feat(F09): add branch-aware catalog` atau `chore(F01): configure project tooling`. Jangan menggabungkan beberapa fitur atau membuat empty commit.
- Periksa root bakery, branch aktif, staged diff, dan tujuan remote sebelum commit/push. Stage file atau hunk fitur secara selektif; jangan memakai `git add .` atau memasukkan perubahan pengguna yang tidak terkait. Jangan stage secret, isi env, credential fixture, PII, backup, atau artefak lokal. Jika perubahan dalam file yang sama tidak dapat dipisahkan dengan aman, laporkan blocker tanpa menimpa pekerjaan pengguna.
- Setelah commit fitur berhasil, push branch fitur tersebut ke remote GitHub bakery yang telah diverifikasi. Tidak perlu meminta izin ulang. Jangan force-push, amend commit yang sudah di-push, reset, mengubah remote, atau merge otomatis. Perbaikan sesudah commit dibuat sebagai commit tambahan dengan scope Fxx yang sama.
- Jika commit/push gagal karena autentikasi, remote, konflik, atau koneksi, laporkan tahap dan blocker yang sebenarnya; jangan mengklaim sudah tersimpan di GitHub. Laporan akhir menyertakan hash commit, branch, dan hasil push tanpa secret.
- Otorisasi ini hanya untuk commit/push fitur; deployment, pengiriman pesan, dan migration/reset database remote tetap memerlukan instruksi terkait. Perubahan aturan/dokumentasi di luar Fxx tidak otomatis dianggap implementasi fitur.
