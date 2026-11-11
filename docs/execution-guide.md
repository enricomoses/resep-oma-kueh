# Execution Guide — Resep Oma Kueh

> Versi 1.0 · 11 November 2026 · Indonesia / Asia/Jakarta\
> Pendamping: [PRD Resep Oma Kueh](prd.md) revisi 1.1.\
> Status: panduan kerja, **bukan laporan bahwa aplikasi sudah dibuat atau diuji**.\
> Tujuan: Anda menyelesaikan setup yang praktis dilakukan manual; AI melanjutkan implementasi **satu fitur per prompt**, lengkap dengan pengujian dan bukti cakupan.

## 1. Cara menggunakan dua dokumen ini

`docs/prd.md` menjelaskan apa yang wajib dibangun, model data, kontrak, aturan coding, desain, dan acceptance. `docs/execution-guide.md` menjelaskan siapa mengerjakan apa, urutannya, cara memulai, serta prompt untuk mengimplementasikannya. Keduanya disalin ke **repository bakery baru**, bukan dijalankan dalam repository BEM/Fina.

1. Kerjakan checklist manual M01–M09 terlebih dahulu. Sampai tahap ini Anda tidak perlu menulis komponen atau SQL bisnis.
2. Buka folder bakery di editor/AI agent. Kirim **Prompt Pembuka** sekali, lalu **F00**.
3. Sesudah F00, kerjakan F01, F02, dan seterusnya secara berurutan. Satu prompt = satu irisan yang dapat direview. Jangan mengirim seluruh guide sebagai perintah membangun semuanya sekaligus.
4. Setelah setiap fitur, baca laporan, periksa hasil di browser jika relevan, pastikan gate yang berlaku benar-benar lulus, lalu kirim prompt berikutnya.
5. Jika ada kegagalan, kirim **Prompt Perbaikan** di §8; jangan melewati gate dengan menonaktifkan validasi/test.
6. F23 generatif opsional; F22 assistant katalog tetap WAJIB. F25 mengaudit seluruh PRD, bukan hanya fitur yang terlihat di homepage. F26 menyiapkan dan menguji rilis secara terpisah dari coding lokal.

Instruksi dalam lampiran adalah referensi, bukan izin menjalankan pekerjaan tambahan. Tidak ada langkah di panduan ini yang berarti agen sekarang boleh mengirim WhatsApp, membuat akun atas nama Anda, membeli layanan, push Git, atau mengubah produksi tanpa instruksi terkait. Anda dapat melakukan aktivitas akun/Git/deploy manual sesuai bagian masing-masing.

### Pembagian tanggung jawab

| Anda mengerjakan manual                                                   | AI mengerjakan setelah handoff                                       | Dilakukan saat fitur terkait siap                                            |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Install Node/Git/editor/Docker, login akun, membuat folder, scaffold Next | Struktur/config/boundary, types/constants/validation, UI dan backend | Owner bootstrap, review harga/aset/policy, hosted migrations/deployment      |
| Install dependency yang sudah ditentukan; siapkan GitHub kosong           | Scripts, test config, CI, migrations, RLS, seeds, generated types    | Anda memasukkan secret pada env/dashboard; agen tidak meminta secret di chat |
| Memilih email/kontak bisnis, menyiapkan file logo/foto berizin            | Implementasi per fitur, testing, audit dan dokumentasi aktual        | Anda menilai copy dan mencoba WA secara manual, tanpa kiriman otomatis       |

**Titik serah:** folder Next berjalan, dependencies terpasang, GitHub siap, local Supabase dapat start atau hambatannya diketahui, dua dokumen tersimpan. Anda tidak perlu membuat schema/RLS, seluruh folder target, maupun fitur dummy secara manual.

## 2. Setup awal manual oleh Anda

Perintah di bawah ditulis untuk Windows PowerShell. Jalankan satu blok, periksa hasilnya, baru lanjut. PowerShell 5 tidak mendukung operator `&&`; jalankan perintah npm satu per satu dan berhenti jika exit code gagal. Jangan menjalankan reset DB remote. Variabel `$rok...` hanya untuk panduan ini.

### M01 — Siapkan perangkat dan akun

- [ ] Install Node.js LTS yang masih didukung Next/hosting; baseline Node 24.x. Periksa dokumentasi runtime saat Anda memulai.
- [ ] Install Git dan editor (misalnya VS Code), serta browser Chrome/Edge.
- [ ] Install Docker Desktop Windows dan aktifkan backend WSL 2 sesuai installer; buka Docker sampai engine aktif.
- [ ] Buat/login akun GitHub, Supabase, dan Netlify. Gunakan email owner untuk akses usaha; aktifkan MFA akun layanan jika tersedia. Jangan menaruh password/API key pada PRD.
- [ ] Buat folder khusus proyek baru, terpisah dari BEM. Contoh target: `C:\Users\asus\Documents\Code\resep-oma-kueh`.

Verifikasi:

```powershell
node --version
npm --version
git --version
docker version
```

Lulus bila Node/npm/Git tersedia dan `docker version` menampilkan client **serta server**. Jika engine belum aktif, selesaikan Docker sebelum database integration. Bila perangkat tidak mampu menjalankan Docker, lanjut hanya fondasi/UI; catat DB tests BLOCKED dan pilih dev Supabase terpisah bersama agen. Jangan memakai produksi sebagai pengganti test lokal atau menganggap mock membuktikan RLS.

### M02 — Buat folder dan scaffold Next.js sendiri

Jalankan dari folder induk proyek, bukan dari folder `front` BEM:

```powershell
Set-Location -LiteralPath "$env:USERPROFILE\Documents\Code"
if (Test-Path -LiteralPath '.\resep-oma-kueh') { throw 'Folder sudah ada. Periksa isinya sebelum melanjutkan.' }
New-Item -ItemType Directory -Path '.\resep-oma-kueh'
Set-Location -LiteralPath '.\resep-oma-kueh'
npm view next version
npm view create-next-app version
npx create-next-app@latest . --ts --eslint --tailwind --app --src-dir --import-alias "@/*" --use-npm
```

Pilih jika CLI masih menanyakan: TypeScript **Yes**, ESLint, Tailwind **Yes**, `src/` **Yes**, App Router **Yes**, alias `@/*`, AGENTS.md **Yes**, React Compiler **No** untuk baseline sederhana (jika otomatis aktif, F00 mencatat dan memeriksa kompatibilitas; tidak perlu scaffold ulang). Tidak memilih Pages Router, shadcn, atau template e-commerce lain.

Audit penyusunan dokumen ini memeriksa registry pada 11 November 2026: `next` dan `create-next-app` latest adalah **16.4.6**. Saat Anda menjalankan panduan, gunakan stable latest yang terverifikasi, bukan canary; jika major berubah, minta F00 menilai kompatibilitas PRD sebelum coding. Lockfile hasil scaffold adalah acuan berikutnya.

Lulus bila ada `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `package.json`, `package-lock.json`, `tsconfig.json`, ESLint config. Jika folder sudah berisi aplikasi, jangan scaffold di atasnya; jalankan F00 untuk audit existing.

### M03 — Install library yang memang diperlukan

Masih di root bakery:

```powershell
npm config set save-exact true --location project
npm install @supabase/supabase-js @supabase/ssr @tanstack/react-query axios zustand react-hook-form @hookform/resolvers zod clsx tailwind-merge lucide-react server-only
npm install --save-dev supabase prettier prettier-plugin-tailwindcss knip tsx vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom @playwright/test @axe-core/playwright
```

Scaffold sudah menginstall Next, React, TypeScript, Tailwind, PostCSS, ESLint dan tipe dasarnya; jangan install ulang major yang berbeda. Jalankan install groups secara berurutan, bukan bersamaan. Jika peer conflict, hentikan dan serahkan error tersanitasi pada agen; tidak menggunakan `--force`/`--legacy-peer-deps`.

```powershell
npm ls --depth=0
npx supabase --version
npx playwright --version
```

`@google/genai` **belum diinstall**; hanya diperlukan jika F23 dipilih. Tidak perlu Prisma, Express, NextAuth, pgvector, shadcn, GSAP, Lenis, atau paket pembayaran untuk MVP ini. Image reencode server diputuskan F17 sesuai hosting; jangan menginstall tool tambahan hanya karena muncul pada contoh proyek lain.

> Dependency baru memakai `save-exact`; paket scaffold yang memakai rentang tetap direproduksi lewat lockfile. Sesudah repo tersedia, instalasi berikutnya memakai `npm ci`, bukan menghapus lockfile dan menjalankan install tanpa alasan.

### M04 — Jalankan boilerplate sebelum diubah agen

```powershell
npm run dev
```

Buka [localhost](http://localhost:3000), pastikan halaman scaffold tampil tanpa error. Hentikan server dengan Ctrl+C, lalu:

```powershell
npm run lint
npm run build
```

Lulus bila boilerplate dapat berjalan dan build. `format`, `typecheck`, test, dan script DB belum perlu ada; agen membuatnya F01–F04. Jika build gagal sebelum perubahan agen, simpan error dan beri tahu F00 agar baseline failure tidak disalahartikan sebagai regresi fitur.

### M05 — Letakkan dokumen dan siapkan aset bisnis

```powershell
New-Item -ItemType Directory -Path '.\docs' -Force
Copy-Item -LiteralPath "$env:USERPROFILE\Downloads\prd.md" -Destination '.\docs\prd.md'
Copy-Item -LiteralPath "$env:USERPROFILE\Downloads\execution-guide.md" -Destination '.\docs\execution-guide.md'
```

**Dua file ini sudah mandiri**: agen tidak wajib memiliki akses folder Downloads/temp atau chat lama untuk memahami requirement. Jangan membiarkan link file user temp menjadi dependency produksi.

Siapkan logo SVG/PNG transparan, ilustrasi Oma, foto produk/kelas berizin, serta daftar harga terbaru di folder kerja lokal yang tidak ikut push sebelum disetujui. Anda boleh membuat folder `public/brand` untuk logo final yang memang berizin; jangan memasukkan foto chat mentah atau foto anak ke public. Upload media CMS dibuat F17. Bukti consent yang mengandung data pribadi disimpan terpisah dengan akses terbatas, bukan di Git atau bucket publik.

Data yang **sudah diputuskan** dan tidak perlu ditanyakan ulang:

| Informasi       | Nilai                                                                      |
| --------------- | -------------------------------------------------------------------------- |
| Surabaya WA     | `081703384308` → `6281703384308`                                           |
| Bintaro WA      | `085119785194` → `6285119785194`                                           |
| Email website   | `resepoma.kueh2@gmail.com`                                                 |
| Alamat Surabaya | Rungkut Asri Tengah V No. 22, Surabaya                                     |
| Instagram       | `@resepoma.kueh`                                                           |
| Alur pembayaran | Konfirmasi manual via WhatsApp, tanpa payment gateway                      |
| Chatbot         | Membaca data publik, tanpa write database/history                          |
| Desain          | Blueprint bakery krem–burgundy; referensi BEM/Fina hanya arsitektur/coding |

Belum pasti: alamat Bintaro, Maps/hours, kemampuan pickup/delivery, harga/SKU aktif, klaim diet/allergen, izin feedback/foto, jadwal kelas/promo aktif, detail policy. Jangan menebak agar halaman tampak penuh. Lihat PRD §23 dan release gate pada §10 panduan ini.

### M06 — Inisialisasi local Supabase tanpa menulis schema

```powershell
npx supabase init
npx supabase start
npx supabase status
```

Jika CLI bertanya membuat config editor, pilih sesuai editor Anda; bukan requirement bisnis. `init` cukup sekali jika `supabase/config.toml` belum ada. Start pertama dapat lama karena image download. Bila port bentrok dengan proyek lain, hentikan stack lain atau minta agen menetapkan project ID/port bakery terpisah; jangan mengubah data proyek lain.

Buka URL Studio yang dilaporkan CLI. Simpan URL API dan **publishable key** lokal untuk env. Jika CLI lokal memakai label legacy `anon key`, itu boleh dipakai pada variabel public publishable selama SDK mendukung; **jangan menyalin service-role/secret key ke variabel tersebut**. Database bakery masih kosong pada tahap ini; jangan membuat tabel lewat Dashboard. Migrasi/RLS/seed akan dikerjakan agen.

Local development tidak perlu login CLI ke akun hosted. Anda boleh membuat project Supabase hosted kosong bernama bakery-staging nanti; pilih region dekat pengguna (misalnya Singapore bila tersedia), password kuat disimpan password manager. Jangan link project produksi atau menjalankan `db push` sekarang. Produksi terpisah disiapkan F26 setelah migration/seed teruji.

### M07 — Siapkan environment lokal secara manual

Buat `.env.local` di editor dan isi **sendiri** dari local Supabase. Template nilai publik/tanpa secret:

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_CHAT_WIDGET_ENABLED=true
APP_ENV=development
CHAT_PROVIDER_ENABLED=false
GOOGLE_GEN_AI_API_KEY=
GOOGLE_GEN_AI_CHAT_MODEL=
```

`APP_ENV` memisahkan runtime aplikasi; `NODE_ENV` tetap dikelola Next. Flag widget tidak mengaktifkan provider generatif. F01 membuat validasi env dan `.env.example` kosong sesuai PRD. Jangan mengirim isi `.env.local` ke chat. Jangan membuat akun admin/password di file seed. Developer/test setup boleh memakai credential privileged **lokal** melalui harness terpisah saat F03; aplikasi publik/chat tidak memakai key tersebut.

Periksa `.gitignore`: ignore `.env*`, dengan pengecualian `!.env.example`, serta `node_modules`, `.next`, `supabase/.temp`, `supabase/.branches`, Playwright/test result, local backup. **Folder docs harus terlacak Git.** File contoh tidak berisi key asli. Agen menyelaraskan ignore lebih lengkap F01.

### M08 — Setup GitHub sendiri

Di GitHub web, buat repository baru misalnya `resep-oma-kueh` (private untuk development), **tanpa** README/gitignore/license otomatis agar tidak bentrok dengan scaffold lokal. Jangan gunakan repository BEM. Scaffold kadang sudah menjalankan Git init/commit; periksa dahulu:

```powershell
git rev-parse --show-toplevel
git status --short
git remote -v
```

Jika belum menjadi repo Git, jalankan `git init`. Pastikan top-level tepat folder bakery, bukan induk `Documents\Code` atau repo BEM. Jika root salah, hentikan; jangan reset/menghapus `.git` tanpa memahami repositori yang terkena.

```powershell
git branch -M main
```

Tambahkan remote HTTPS dari tombol Code di GitHub bila `origin` belum ada:

```powershell
$rokRepoUrl = Read-Host 'Tempel URL HTTPS repository GitHub bakery tanpa token/password'
git remote add origin $rokRepoUrl
git remote -v
```

Jika `origin` sudah benar, lewati add; jika salah, perbaiki manual sesudah memeriksa URL. Login GitHub melalui Git Credential Manager/browser; tidak menaruh PAT pada URL. Atur `git config user.name`/`user.email` lokal jika Git memintanya.

Untuk commit awal, gunakan Source Control editor: **stage hanya file source/config/lockfile/docs yang sudah Anda cek**, pastikan `.env.local`, token, screenshot chat, backup dan data pribadi tidak ter-stage. Review dengan:

```powershell
git diff --cached --stat
git diff --cached --name-only
git diff --cached
git commit -m "chore: initialize Resep Oma Kueh project"
git push -u origin main
```

Jika tidak ada perubahan staged karena scaffold sudah commit, jangan membuat empty commit. Setup GitHub dan initial commit di atas tetap aktivitas manual Anda. Instruksi owner 12 November 2026 mengizinkan agen membuat commit lokal dan push otomatis per Fxx yang selesai dan lulus gate, sesuai aturan Git per fitur di `AGENTS.md`. Fitur selanjutnya boleh dikerjakan pada branch `codex/f01-foundation` dan seterusnya; tidak wajib membuat satu branch per prompt atau merge otomatis.

### M09 — Checklist handoff ke agen

- [ ] Editor/agen membuka **root bakery** yang benar.
- [ ] `npm ls --depth=0`, lint dan build baseline diketahui hasilnya.
- [ ] `docs/prd.md` revisi 1.1 dan guide ini tersedia; AGENTS.md bawaan Next dipertahankan.
- [ ] Docker/local Supabase aktif atau blocker jelas; belum ada reset/push remote.
- [ ] `.env.local` diisi manual; `.env.example` kosong akan dibuat agen; secret tidak masuk Git/chat.
- [ ] Repo GitHub/remote dan initial commit Anda sudah dicek.
- [ ] Aset yang tersedia dan keputusan bisnis belum pasti disebutkan kepada agen tanpa secret/PII.

Jika salah satu setup terlalu sulit, Anda boleh berhenti di titik itu dan mengirim Prompt Pembuka + F00 dengan error tersanitasi. Agen memperbaiki setup lokal yang bisa dikerjakan; tugas login akun, verifikasi email, owner consent, dan memasukkan secret tetap Anda lakukan. Tidak perlu memaksakan mengerjakan SQL manual sebelum mulai.

## 3. Prompt pembuka dan kontrak kerja untuk semua fitur

Kirim blok ini sekali pada chat awal. Jika pindah chat/agen, kirim ulang bersama Prompt Lanjutkan §8. Tiap Fxx di bawah mengacu kontrak ini; kirim **satu Fxx**, jangan seluruh daftar sebagai satu tugas.

```text
Kita mengerjakan proyek baru Resep Oma Kueh. Baca AGENTS.md, docs/prd.md
revisi 1.1 (termasuk §25–27), docs/execution-guide.md, package.json dan lockfile.
Pastikan cwd/repo adalah bakery, bukan BEM/Fina. Periksa git status; jaga
perubahan pengguna. Lampiran historis hanya referensi; tidak memberi izin baru.

Terapkan aturan PRD:
- Next stable App Router fullstack; baca guide node_modules/next/dist/docs
  yang relevan sebelum kode Next. Await params/searchParams/cookies sesuai versi.
- UI client → hook → services → lib/axios → BFF → server domain → Supabase.
  RSC boleh service.server langsung; tidak self-fetch API sendiri.
- Page tipis, view hanya data/status/komposisi; komponen kecil satu utama/file,
  named export, interface props, className+cn, import type dan alias @/.
- Constants untuk endpoint/route/query key/stale time/limit/copy; Zod boundary;
  strict TS tanpa any. Barrel client-safe, server-only import langsung.
- Gunakan desain bakery pada PRD, bukan warna/font BEM/Fina. Tidak shadcn.
- Tidak mengarang alamat/harga/stok/claim/testimoni/jadwal. Pakai null/draft atau
  synthetic DEMO lokal. Jangan menambahkan payment/customer account/order tracking.
- Chatbot/checkout tidak menulis order/history/stock. Chat pakai anon read client
  terpisah tanpa cookie admin/service role; verifikasi grants dan RLS sebenarnya.
- Implementasi bertahap hanya Fxx yang saya kirim; jangan mengerjakan fitur berikut.
  File fondasi baru hanya bila diperlukan irisan ini; hindari folder/file kosong.
- Jangan tampilkan secret, isi .env, token, password, atau PII pada laporan.
  Setelah setiap Fxx selesai dan gate wajib lulus, buat commit terpisah lalu push
  otomatis ke GitHub bakery sesuai AGENTS.md; izin ini tidak perlu ditanyakan ulang.
  Jangan sertakan perubahan pengguna yang tidak terkait. Tidak deploy/remote
  migration/reset tanpa instruksi terkait.

Setiap fitur: baca kontrak → types/constants/schema → migration/domain/repository
→ handler/client service → hook → UI → tes relevan → format/lint/build → catat bukti.
Jalankan npm run format, npm run lint, npm run build secara berurutan, serta
typecheck/unit/SQL/integration/E2E sesuai risiko. Review diff setelah format.
Jangan mengubah file di luar scope atau memperbaiki failure lama secara luas.
Jika tool/DB tidak tersedia, laporkan NOT RUN/BLOCKED, bukan PASS berdasarkan mock.

Update docs/implementation-status.md per Fxx dan requirement Rxx:
status, file/route, migration, test case/command+exit, bukti UI/SQL, pending data.
Dokumen kontrak aktual boleh dibuat saat relevan, jangan menambah dokumentasi kosong.
Catat keputusan/deviasi di docs/decisions.md dan selaraskan PRD jika kontrak berubah.

Laporan akhir tugas: hasil perilaku; file dibuat/diubah; tes+hasil; risiko/blocker;
requirement Rxx yang terlayani; apakah siap lanjut. Jangan klaim PRD selesai hanya
karena build lulus. Jika gate gagal, selesaikan penyebab dalam scope dahulu.
```

### Arti status yang dipakai

| Status                   | Arti                                                              |
| ------------------------ | ----------------------------------------------------------------- |
| TODO                     | Belum dikerjakan                                                  |
| IN PROGRESS              | Implementasi/test masih berjalan                                  |
| PASS                     | Acceptance fitur lulus dengan bukti yang sesuai                   |
| FAIL                     | Sudah diuji dan hasilnya tidak sesuai                             |
| BLOCKED                  | Requirement membutuhkan dependency/data/akses yang belum tersedia |
| NOT RUN                  | Test belum dijalankan; bukan bukti lulus                          |
| NOT SELECTED             | Hanya untuk opsi yang memang tidak dipilih (misalnya F23)         |
| READY FOR RELEASE REVIEW | Teknikal lulus, paket review siap, belum berarti live             |

Status fitur tidak boleh PASS bila test keamanan wajib masih NOT RUN. Data produksi belum tersedia dapat dipisahkan dari PASS teknikal demo, dengan **release gate tetap BLOCKED** dan sebab eksplisit.

## 4. Peta urutan dan dependensi fitur

| Fitur | Fokus                                      | Harus selesai dahulu           | PRD requirement       |
| ----- | ------------------------------------------ | ------------------------------ | --------------------- |
| F00   | Audit setup dan kontrak                    | Manual M01–M09 sejauh tersedia | R01                   |
| F01   | Fondasi/tooling/env/boundary/transport     | F00                            | R01                   |
| F02   | Schema/constraints/indexes                 | F01                            | R02                   |
| F03   | RLS/grants/auth scope/Storage policy tests | F02                            | R03                   |
| F04   | Seed/types/DB scripts                      | F03                            | R04                   |
| F05   | Design system/UI/form primitives           | F01; F04 untuk integrasi       | R05                   |
| F06   | Navbar/footer/branch selector/shell        | F04,F05                        | R05,R06               |
| F07   | Home data-driven                           | F06                            | R07                   |
| F08   | About/contact/FAQ/privacy/policy           | F07                            | R08                   |
| F09   | Catalog dan shared pricing                 | F04,F06                        | R09,R13               |
| F10   | Product detail dan variant picker          | F09                            | R10                   |
| F11   | Bundle configurator                        | F10                            | R11                   |
| F12   | Guest cart dan branch reconciliation       | F11                            | R06,R12               |
| F13   | Checkout domain/quote/WhatsApp backend     | F12                            | R13,R14               |
| F14   | Checkout UI dan handoff                    | F13                            | R14                   |
| F15   | Admin auth/session/recovery/guards         | F03,F05                        | R15                   |
| F16   | Admin overview/category/product drafts     | F15,F09                        | R16                   |
| F17   | Product editor aggregate/media/diet/bundle | F16,F11                        | R16,R17               |
| F18   | Admin branch/hours/offers                  | F17                            | R06,R18               |
| F19   | Admin promotions                           | F18,F13                        | R13,R19               |
| F20   | CMS/FAQ/testimonials/custom business       | F19,F08                        | R08,R20               |
| F21   | Baking classes admin+public+WA             | F20                            | R21                   |
| F22   | Ask Oma baseline read-only                 | F21                            | R22                   |
| F23   | Gemini opsional dan budget control         | F22 + provider/limiter dipilih | R23 opsional          |
| F24   | Integrasi/SEO/a11y/perf/resilience/CI      | F22; F23 bila dipilih          | R01,R07,R24           |
| F25   | Audit full coverage + owner UAT            | F24                            | R25 dan seluruh R/U/A |
| F26   | Paket rilis/staging/deploy/handover        | F25 + release approvals        | R26                   |

F00–F04 = fondasi. F05–F14 = storefront/commerce. F15–F21 = pengelolaan bisnis. F22–F23 = assistant. F24–F26 = pembuktian dan rilis. Tidak ada estimasi hari pasti sebelum kapasitas developer, data dan aset diketahui.

## 5. Prompt implementasi per fitur

### F00 — Audit kesiapan dan bekukan baseline

```text
Kerjakan F00: audit setup Resep Oma Kueh, jangan implementasikan fitur UI/domain dulu.
Gunakan kontrak kerja §3 guide. Baca PRD §2,12,16,17,25–27.

Periksa cwd/git root/status, scaffold src/App Router/alias/TS strict, scripts,
lockfile, versi Node/Next/React, dependency M03, local docs Next, env key presence
tanpa mencetak nilai, Git ignore docs/secrets, dan Docker/Supabase CLI readiness.
Jalankan baseline lint/build; bedakan pre-existing failure dan dependency missing.
Verifikasi versi stable/compatibility, jangan upgrade massal karena versi referensi.

Buat docs/implementation-status.md dengan F00–F26 dan requirement R01–R26, semua
belum terimplementasi kecuali setup yang dibuktikan. Catat F23 opsional. Buat ADR
awal hanya untuk keputusan nyata; daftar data bisnis pending dari PRD §23 dan
konfirmasi Gmail/alamat Surabaya yang sudah final. Identifikasi assets yang tersedia.
Rencanakan file fondasi F01, jangan membuat ratusan file kosong.

Lulus: root bakery terbukti, baseline diketahui, konflik paket/rules diselesaikan
atau blocker spesifik tercatat, urutan Fxx siap. Laporkan apa yang masih perlu
saya lakukan manual; jangan meminta secret atau mengubah project BEM.
```

### F01 — Fondasi arsitektur, environment, transport, dan tooling

```text
Implementasikan F01 saja setelah audit F00. Requirement R01; PRD §12,15–17,20,27.
Pertahankan scaffold sehat, buat modul hanya yang sekarang digunakan.

Siapkan AGENTS.md bakery sambil mempertahankan blok Next bawaan; ESLint flat config
boundary/type imports, Prettier/Tailwind, strict TS/alias, cn, constants routes/
endpoints/query keys/stale times/limits/copy, DTO envelope/error, Zod env public
terpisah server-only. Tidak menyalin palette/font/larangan proxy BEM ke bakery.
Supabase SSR helpers, anon read client terpisah tanpa cookies/admin JWT, dan
cookie bridge dirancang menurut docs SDK terpasang; runtime belum perlu auth UI.

Axios browser melalui lib/axios/response-handler: satu unwrap yang mempertahankan
typed data+pagination, signal/error/requestId, tanpa toast ganda atau menyamarkan
error. QueryClient stabil, provider boundary client; root layout tetap server.
Implementasikan scripts format/format:check/lint/typecheck/test/test:e2e/test:db/
lint:unused/check sesuai PRD. Pilih Vitest dan Playwright; config alias/server-only
test boundary benar. Tidak membuat test dummy atau passWithNoTests untuk klaim lulus.
Buat .env.example kosong, ignore yang tepat, Node runtime file dan docs architecture
aktual. Template CI dasar menjalankan checks yang benar-benar tersedia; DB/E2E
ditambahkan setelah harness ada, statusnya jangan ditandai lulus sebelumnya.

Verifikasi: env salah ditolak tanpa membocorkan nilai; provider disabled tidak
memerlukan key; client import server-only ditolak; transport sukses/error/abort
teruji secara bermakna. Jalankan format→lint→typecheck→tes relevan→build, laporkan
file serta boundary yang terbukti. Jangan membuat tabel/domain fitur selanjutnya.
```

### F02 — Schema database relasional dan constraints

```text
Implementasikan F02 untuk R02. Baca PRD §4,7,9,13,27.2–27.6; dependency F01.
Buat supabase/migrations sebagai satu-satunya sumber schema. Jangan memakai schema
Dashboard sebagai perubahan tidak terlacak atau membuat tabel finance/BEM.

Implementasikan branches/business_hours/admin_profiles; categories/products/
variants/images/pivots; branch_variant_offers; option_groups/choices/fixed bundle
components; dietary/allergen taxonomy+mapping; promotions dan semua target pivots;
class_programs/sessions termasuk seats_left; testimonials/faqs/site_content.
Jangan membuat orders, registrations, history atau embedding table fase 2.

Lengkapi PK/FK/restrict/check/unique/index/updated_at serta batas IDR safe integer,
one primary/default, category cycle guard, SKU/slug stability, 12-slice/component
integrity, promotion cap/time/status, class time/capacity. quantity_per_selection
wajib kolom nyata, bukan saran terlupakan. Define all publish prerequisites dan
allowlist CMS sesuai §27.1. Tabel exposed di-enable RLS sejak migration pembuatan,
tanpa broad public write; policy lengkap pada F03.

Uji clean LOCAL migration dari database fixture, invalid price/FK/default/time/
bundle/seat ditolak. Periksa migrations valid dari nol dan tidak tergantung data
manual/seed untuk membuat constraint. Tambahkan pgTAP constraints yang bermakna,
database.md ERD aktual, generate types sementara bila diperlukan.
Jika reset lokal diperlukan, verifikasi target loopback dan jelaskan data lokal
terhapus. Tidak reset/push remote. Jalankan gates yang relevan; catat schema saja
belum membuktikan role isolation. Hasil menjadi dependency F03, bukan fitur publik.
```

### F03 — RLS, grants, field restrictions, dan policy Storage

```text
Implementasikan F03 untuk R03; PRD §10,14,27.4,27.7. Dependency F02.
Gunakan migrations grants+RLS deny-by-default untuk semua tabel/view/RPC/Storage.
Anon hanya published/active public records; chain parent visibility di setiap
child/pivot. No draft/admin evidence/private columns exposure lewat direct REST.
Jika memakai projection view, uji security_invoker dan underlying grants/column
access, bukan menganggap view otomatis menutup akses tabel asli.

Owner mengelola global/cabang; branch_admin hanya offers availability whitelist
dan class_sessions own branch. RLS USING+WITH CHECK plus DB trigger menolak
price override/ID change oleh branch admin, termasuk INSERT override baru.
Branches/hours owner-only writes; admin_profiles no runtime write dan helper
auth tidak rekursif. Definer helper fixed search_path, no arbitrary SQL, EXECUTE
terbatas. Chat anon tanpa session tetap tidak dapat mutation/RPC side effects.
Buat policies media-drafts private + approved public buckets, owner upload saja.

Buat harness LOCAL synthetic owner, staff Surabaya/Bintaro, user Auth tanpa
profile; secret test-only tidak masuk aplikasi. SQL/REST tests menggunakan JWT
sesungguhnya untuk anon/owner/staff, bukan SQL Editor sebagai postgres.
Uji unpublished inaccessible, private consent hidden, cross-branch write denied,
self role escalation denied, direct price change denied, read RPC aman dan chat
insert/update/delete/upsert/storage-write denied. Bandingkan business snapshot.

Jalankan policy/constraint suite dan gates; catat grant audit serta expected deny.
Tidak boleh menandai PASS dari teks prompt “read-only” atau mock saja. Hasilnya
fondasi izin; halaman login/CRUD dikerjakan nanti, tanpa membuka signup publik.
```

### F04 — Seed usable demo, reference data, types, dan scripts DB

```text
Implementasikan F04 untuk R04; PRD §18,27.6. Dependency F03.
Buat data-only idempotent seed.sql LOCAL: 2 cabang/WA benar, Surabaya address
terkonfirmasi, Bintaro/maps/hours null; 13 seri, 15–25 contoh representatif,
multi-size/SKU, availability berbeda, price override test, bundle Regular/GF,
FAQ/content/profile brand, promo expired/current/future, kelas clock-controlled.

Pisahkan historical draft needs_owner_review dan synthetic DEMO published yang
membuat browser demo bisa dipakai tanpa memalsukan katalog bisnis. Seed test diet
verified bersifat synthetic, testimonial asli draft anonim tanpa rating/consent
karangan. Demo terlihat jelas dan tidak masuk produksi. Akun/password tidak ada
di seed; harness terpisah dari F03 dipakai ulang. Tentukan fixed reference clock.

Implementasikan scripts db:start/db:reset:local/db:types:local/db:seed:verify/
db:seed:reference (default dry-run), db:test:policies/test:db. CLI command dan flag
diverifikasi versi terpasang. Types generation memakai Node UTF-8 temporary file
dan rename setelah exit0; tidak men-truncate types lama saat CLI gagal.
Production-reviewed manifest awal hanya informasi yang benar-benar terkonfirmasi;
remote apply guarded target/diff/explicit apply, tanpa menjalankannya sekarang.

Uji clean reset→seed→verify→types; jalankan seed dua kali tanpa duplicate/overwrite
keliru; assert harga/12 slice/branch/expired dates/FK/data counts dan sample query
public. Typecheck terhadap schema aktual. Pastikan negative role tests tetap lulus.
Dokumentasikan local commands dan synthetic vs production di database.md/README.
```

### F05 — Design system dan primitive UI/form

```text
Implementasikan F05 untuk R05; PRD §5,16–17. Dependency F01; pakai F04 jika perlu DTO.
Ikuti konsep Modern Old-Fashioned Bakery / Warm Nostalgic Editorial dari blueprint:
cream/burgundy, food photography asli, Fraunces editorial, Plus Jakarta Sans UI,
Barlow Condensed terbatas campaign. Token hex hanya di globals.css, bukan JSX;
warna sementara tidak diklaim logo-identical. Tidak menyalin font/palette BEM/Fina.

Buat button/link/card/badge/input/select/textarea/form-field/dialog/drawer/
quantity/feedback yang memang dipakai tahap berikut, className+cn, named export,
label/error/helper terhubung, variant props typed. Handmade React/Tailwind tanpa
shadcn; modal semantics/focus-trap/return/Escape/scroll cleanup benar. Native
dialog boleh jika diadaptasi dan diuji; jangan membuat aria-modal palsu.
Layout container/grid/type scale fluid, spacing dan responsive sesuai PRD.

Verifikasi mobile 375/768 dan desktop 1280/1440, keyboard, focus visibility,
200% zoom, text contrast, reduced motion. Gunakan komponen pada fondasi halaman
nyata/fixture terbatas; tidak membuat playground publik atau animasi global baru.
Logo/photo tidak tersedia → placeholder hanya DEMO dan catat release blocker.
Jalankan format/lint/typecheck/build dan interaction tests yang relevan;
sertakan screenshot komposisi dasar, jangan mengklaim storefront sudah selesai.
```

### F06 — Public shell dan branch selector

```text
Implementasikan F06 untuk R05/R06; PRD §3–6,12,27.1,27.5. Dependency F04–F05.
Buat layout (site), navbar/footer responsif, nav aktif, cart badge placeholder
state nyata, branch selector dan trusted fallback contact. API GET /branches,
client service+query dengan AbortSignal/key/stale time; server layout read service
langsung. Satu widget chat slot saja, belum memanggil provider.

Default branch belum dipilih; URL branch code valid mengungguli preference,
resolve UUID di domain. Simpan hanya selectedBranchId non-sensitive dengan
SSR-safe hydration. Bila belum memilih, katalog boleh browse tetapi tidak ada
final branch price/Add to Cart. Route/filter navigation mempertahankan branch.
Siapkan callback konflik branch switch untuk integrasi cart F12; jangan diam-diam
mereset cart. Tampilkan dua WA, Gmail, alamat Surabaya benar; Bintaro null jelas.

Uji reload/hydration, URL vs persisted mismatch, invalid/inactive branch, mobile
drawer/Escape/focus return, keyboard/nav/footer links dan API failure fallback.
Tidak ada hardcode harga/stok dari config fallback; fallback hanya approved
contacts. API kosong vs error berbeda. Jalankan gates dan laporkan perilaku.
```

### F07 — Home seluruh section dengan data publik

```text
Implementasikan F07 untuk R07; PRD §5–6,27.1; dependency F06.
Bangun urutan Home lengkap: header/hero, Shop by Series, Featured Bakes, Our Little
Story, Current Treats, Bake with Oma, What They Say, Find Us, Instagram/community,
footer. Section menjadi komponen kecil dan home-view hanya data/status/compose.
Gunakan published DB/content services dengan DTO minimal; RSC tidak self-fetch.

Hero/headline dari blueprint; story dari company profile/proposal yang ada di PRD,
bukan kisah pendiri/tahun karangan. Foto/logo asli bila tersedia, placeholder
DEMO tercatat. Promo expired tidak aktif; sesi lampau bukan upcoming; testimonial
tanpa consent tidak tampil. Custom business teaser boleh mengarah ke kontak.
Pricing card mengikuti shared DTO; jika F09 belum ada gunakan section tanpa harga
final dan CTA Menu, catat integrasi dependency; jangan hardcode fixture harga JSX.

Uji loaded/empty/DB failure per section, branch switch, active time boundary,
consent filtering, keyboard dan screenshot mobile/desktop. Logo/perubahan copy
owner belum lengkap menjadi release blocker terpisah. Format/lint/typecheck/build
dan tests domain/route relevan. Tandai follow-up F09/F21/F24 untuk integrasi data
lanjutan; jangan menyatakan promo/kelas/cart berfungsi sebelum implementasinya ada.
```

### F08 — About, Contact, FAQ, privacy, dan ordering policy

```text
Implementasikan F08 untuk R08; PRD §3,6,19,27.1. Dependency F07.
Buat thin pages/views untuk /about,/contact,/faq,/privacy,/ordering-policy.
CMS allowlisted per-key Zod dan published reads; client refetch lewat GET /content
dan /faqs bila perlu, server pages via service langsung. Brand values dari proposal
dan bakers–food scientist dari profile tanpa klaim sertifikasi/health universal.

Contact menampilkan Surabaya+Bintaro WA terpisah, Gmail dan alamat Surabaya;
Maps/hours/Bintaro address hanya jika verified. Custom product B2B CTA memilih
cabang dan membangun wa.me konsultasi, tanpa leads table/estimasi MOQ/harga.
FAQ pembayaran/stock/WA/class mengikuti fakta; refund/cutoff belum disetujui
ditahan sebagai draft. Privacy menyebut ID/qty localStorage, transient checkout
server, WA handoff dan optional provider; tidak mengklaim tak ada data ke server.

Uji legal content typed/no raw HTML injection, FAQ empty/error, correct contacts,
link safe/keyboard, metadata dan mobile. Naskah policy template dibedakan dengan
owner-approved policy; publikasi produksi gate terpisah. Format/lint/typecheck/
build dan tests relevan. CRUD CMS dilakukan F20, jangan membuat form lain sekarang.
```

### F09 — Catalog end-to-end dan calculator harga bersama

```text
Implementasikan F09 untuk R09/R13; PRD §4,6–7,13,15,27.2,27.5. Dependency F04,F06.
Buat GET /categories dan /catalog, domain repository/service/pure pricing,
typed browser service, query hook, menu view/filter/grid/pagination. Fields URL:
branch/category/q/tag/availability/minPriceIdr/maxPriceIdr/sort/page/limit.
branch code resolve UUID; category slug dari DB; sort enum; literal search aman.

Compute effective branch offered SKU + price delta minimum + unconditional promo,
per-product fromPrice; filter/sort sebelum pagination dan stable tie-break. Jangan
paginate lalu filter browser, terpotong API cap, N+1, raw PostgREST .or input,
atau menampilkan draft/unknown diet badge. Eligibility/promo calculator pure
memakai formula integer §27.2 dan clock injectable untuk checkout/chat nanti.

URL shareable/back-forward, debounce cleanup, reset page filter, branch-aware keys,
initial SSR DTO tanpa double fetch. No branch → browse tanpa final price/CTA add.
Empty HTTP200 bukan DB error; detail404 tidak disamarkan sebagai empty list.
Integrasikan featured/category Home dengan service sama.

Uji price override, sold_out/unconfirmed/not-offered, tag verified, min/max/sort
ties, search accents/punctuation, page2/empty/out-of-range, abort dan DB failure.
Unit calc includes min-spend ambiguity resolved, fixed per-unit, percentage cap,
rounding dan promo date boundaries. Gates+API integration+browser checks wajib.
```

### F10 — Product detail, gallery, variant picker, dan info makanan

```text
Implementasikan F10 untuk R10; PRD §6–7,15,27.5. Dependency F09.
Buat /menu/[slug] thin async page+generateMetadata, detail server service/API,
client service/hook, detail view/gallery/variant-picker/qty/price/related products.
Await params/searchParams sesuai local docs. 404 hanya missing/unpublished;
upstream gagal menjadi error/retry, bukan notFound. Metadata tidak bocor draft.

Hanya active offered SKU cabang terpilih, effective price dari calculator shared,
size dari DB bukan universal hardcode. Foto varian cocok, thumbnails accessible,
next/image sizes/alt/aspect ratio. Alamat cabang tidak memengaruhi global slug.
Diet/allergens per-SKU verified, absence bukan free-from; no false vegan/halal.
Show stock caveat, sold-out disabled, unconfirmed explicit, branch required.
CTA menyiapkan payload typed untuk cart; cart persistence dikerjakan F12 dan
bundle rules F11, jangan meninggalkan tombol tampak sukses tapi tak melakukan apa.

Uji tiga ukuran vs satu SKU, branch switch, archived varian, missing photo,
keyboard gallery/select/quantity, readable long product name mobile, malicious
copy as text. API/RSC/cache boundaries dan gates lulus. Dokumentasikan wiring
CTA yang menunggu F12 agar tidak ditandai full cart completion lebih awal.
```

### F11 — Bundle Chiffon Mix terstruktur

```text
Implementasikan F11 untuk R11; PRD §7.4,13.5,27.2,27.4. Dependency F10.
Bangun pure bundle validation + server integration + use-product-configurator
dan bundle-customizer. 12 slices dengan empat rasa berbeda: Cheese3+Choco3 tetap dan 2 grup masing-masing
1 rasa ×3. Opsi/groups milik bundle variant benar, pilihan active, quantity per
selection nyata. Regular/GF rules terpisah; GF hanya memakai components verified
untuk klaim tersebut. Jika rules real belum verified, production bundle draft.

Validate sum units, min/max/duplicate/group relation/cross-SKU choices, fixed
components, branch availability komponen jika mapped, delta harga dan status.
Cart signature typed/sorted choices stable; message labels tetap terstruktur.
UI menunjukkan fixed+selected breakdown, missing choices dan harga, no arbitrary
four-flavour free selection. Tidak mengurangi component stock saat dipilih.

Uji 11/12/15 units, swapped group/foreign choice, duplicate, removed choice,
sold-out component, GF nonverified, delta and fixed components not double billed.
Bypass client validation tetap ditolak domain/server. Format/lint/typecheck/unit/
integration/build; catat dev synthetic vs actual owner rules pending.
```

### F12 — Guest cart persisted dan perubahan cabang

```text
Implementasikan F12 untuk R06/R12; PRD §4.2,8.1,12.3,27.3. Dependency F11.
Zustand cart versioned schema berisi branch+variant/choice IDs+qty saja; hydrate
SSR-safe, tidak menyimpan nama/alamat/token, harga persisted bukan authority.
Wire Add to Cart nyata di single SKU/detail/bundle, navbar badge dan /cart.
Signature branch/variant/sorted options, merge identical only, limits 15 lines/
qty99/per-SKU/options. Corrupt localStorage/migration ditangani transparan.

Cart menampilkan current fetched names/options/prices/status, update/remove,
loading restore berbeda dari empty. Cabang berubah dengan cart nonempty meminta
konfirmasi; cancel mempertahankan semua; confirm revalidate semua line dan
tampilkan conflicts tanpa menghapus item silently. Variant archived/price
changed/component unavailable tetap ditandai sampai pengguna memutuskan.

Uji refresh/persist/hydration, identical/different options, qty boundaries,
corrupt/version mismatch, multi-tab storage event consistency bila didukung,
branch URL mismatch, sold-out after add, offline/error vs empty. Checkout belum
mengirim pesan; cart tidak dihapus ketika WA ditutup. Gates+unit+mobile browser.
```

### F13 — Checkout server quote dan WhatsApp message

```text
Implementasikan F13 untuk R13/R14; PRD §8,15,27.2–27.3. Dependency F12.
Buat POST /api/checkout/prepare strict DTO, body-byte limit32KiB, timeout,
no-store/log redaction, trusted branch lookup, read latest SKU/options/offers/
promos, safe integer calc shared. No order insert/history/stock update.

Two-step expectedQuoteFingerprint nullable; server canonical quote SHA256,
quotedAt/expiresAt TTL5min/requiresReview. Exclude quotedAt/expiresAt/requestId dari fingerprint; sort lines/options stable.
First call review=true; reprepare
latest same fingerprint false; change returns new preview+PRICE_CHANGED warning
HTTP200 review=true. Invalid/soldout line409, input422/400, DB failure503 distinct.
Jangan menerima harga/nomor WA/model query/table dari client sebagai authority.

Validate fulfillment capability, real Jakarta date/today/90day bound/time policy,
delivery conditional address/name/notes, options uniqueness/12slice/quantity.
Compose multiline WA exact product/variant/choices/qty/gross/discount/subtotal,
shipping pending+manual confirmation. Number server DB digit international,
encodeURIComponent, sanitize control/markup user input. URL >4000 chars fallback
wa.me no text+requiresCopy; full selectable message returned. No PII log/cache.

Uji correct 2 numbers, tampered price/number, branch mismatch, minspend/fixed/cap,
deleted choice, sold-out midflow, fingerprint change, invalid calendar/closed
method, multiline/emoji/longURL, DB outage. Assert business DB snapshot unchanged
before/after prepare. Format/lint/typecheck/unit/integration/build, update API docs.
```

### F14 — Checkout form, review, dan handoff UX

```text
Implementasikan F14 untuk R14; PRD §6.5,8,27.3. Dependency F13.
Buat checkout form RHF+Zod lewat hook/service, quote preview, inline/error summary,
consent manual confirmation, pending/no double submit, return-to-cart dan copy.
Customer data transient memory; jangan persist atau masukkan ke URL aplikasi.

User submit form → first server quote → review displayed; user proceed →
reprepare expected fingerprint; only requiresReview=false opens latest trusted
WA URL. Cart/input/branch edits reset acceptance. New totals require review lagi.
401/422/409/429/timeout/offline tidak mengosongkan cart. Fulfillment disabled
menampilkan konsultasi WA, tidak order terselubung. Popup-blocked/mobile fallback
open again/copy/select text; URL too long instruct copy-paste. Jangan success
toast “pesanan terkirim/dibayar” atau auto-send, jangan clear cart saat handoff.

Uji E2E dua cabang multi-SKU/bundle, refresh restore cart not PII, address error,
price edit between review/continue, stock changed, duplicate click, clipboard
failure, WA cancel/retry. Intercept external WA in tests; tidak kirim pesan asli.
Keyboard/mobile390px, loading states dan reduced-motion. Gates+relevant E2E;
laporkan decoded message vs structured quote dan correct WA destinations.
```

### F15 — Supabase admin Auth, reset password, dan guard

```text
Implementasikan F15 untuk R15; PRD §10,14,27.4. Dependency F03,F05.
Email/password admin login/logout/reset only, no public signup. Supabase SSR
per-request session, src/proxy.ts cookie refresh sesuai local Next/SDK docs,
verified getClaims/getUser+active admin_profiles dalam setiap server entry point.
Proxy bukan satu-satunya authorization. Jangan hardcode fake owner/password.

Routes UI /admin/login,/admin/reset-password; auth endpoints login/logout/
request-password-reset/update-password + /auth/callback bila recovery memerlukan.
Allowlist internal next/redirect, generic reset-request response/rate limit,
no-store/private cached response with cookies, expired recovery/error jelas.
Admin dashboard layout guarded; API401/403 JSON, page UX redirect sesuai status.
Private Query key per identity/role/branch dan clear on logout/account switch.

Dokumentasikan bootstrap user Auth via Dashboard/trusted LOCAL harness, kemudian
admin_profiles maintenance; tidak membuka runtime role-writing endpoint. User
Auth tanpa profile/disabled ditolak. Saya memasukkan credential manual, bukan chat.

Uji anon/owner/staff/profile missing/inactive/session expired/recovery token invalid,
open redirect/CSRF, refresh cookie preserved dan no cross-user cached cookies.
Local recovery via Mailpit; produksi SMTP belum ditest → catat release blocker.
Format/lint/typecheck/integration/browser/build. Tidak membangun CRUD bisnis dulu.
```

### F16 — Admin shell, overview, kategori, dan draft produk

```text
Implementasikan F16 untuk R16; PRD §10,15,27.4. Dependency F15,F09.
Buat admin shell/sidebar/mobile drawer, overview counts real DB, category list/
form/ordering/publish/archive, products table search/filter/page/status dan draft
core create/edit/archive. Owner-only global mutation, staff UI hanya modul izin.
Thin handlers/domain/service/hook/view layer; no Supabase from components.

Parent category self/cycle/collision validation, archiving referenced category
safe, product slug stable dan unique. Product row harga tidak ada, harga di SKU.
No irreversible cascade delete. Soft archive destructive action confirmation.
Concurrent edit expectedUpdatedAt/version atomik, zero affected not success.
Product config lengkap menunggu F17; draft tidak bisa publish bila prerequisites
belum lengkap. Jangan menampilkan tombol CRUD yang belum bekerja sebagai selesai.

Uji draft invisibility public/direct REST, owner create/edit/archive list refresh,
staff403, page after archive last item, long names, stale save409/field errors,
SQL/HTML malicious input, logout clear cache. Update API contract actual dan
invalidation tests; format/lint/typecheck/integration/admin E2E/build.
```

### F17 — Product editor atomik, bundle/diet, dan media

```text
Implementasikan F17 untuk R16/R17; PRD §7,10,13–15,27.4,27.7; dependency F16,F11.
Buat nested editor category assignments/SKU sizes/default/prices/images/
option groups/choices/fixed components/verified diet/allergens. Saved typed schema
via PUT /api/admin/products/[id]/configuration, satu DB transaction/RPC invoker
owner-authorized+RLS. No partial product saved with inconsistent bundle publish.

Publish prerequisites di service dan critical DB constraints/triggers; owner
review/diet evidence bukan checkbox otomatis verified. Concurrent version409;
server fieldErrors per nested row. Soft archive variants dan validate references.
Preview card sama komponen/DTO public, no duplicated calculator rules.

Storage upload server owner-only; private draft preview→approved public paths,
MIME+magic bytes+decode/dimensions/size<=5MiB, random paths, no untrusted SVG/
arbitrary bucket/overwrite. Pilih reencode dependency sesuai host dan catat ADR.
Image metadata saved only approved/trusted path; remove/reference check, do not
delete existing referenced file. Jika upload sukses/config gagal, orphan cleanup
terkontrol terdokumentasi, bukan delete massal.

Uji atomic rollback row2 invalid, duplicate SKU/default/primary, foreign component,
GF forbidden, malformed/oversize/path traversal upload, staff/anon denial,
private draft URL hidden, publish/change photo reflected public and current quote.
Format/lint/typecheck/unit/SQL/integration/admin E2E/build; no service role runtime.
```

### F18 — Admin cabang, jam, availability, dan harga override

```text
Implementasikan F18 untuk R06/R18; PRD §3–4,10,13,15,27.4. Dependency F17.
Owner lokasi/hours/settings, branches GET/PATCH+hours atomic PUT, availability
list/filter/row update. Surabaya address dan Gmail sudah final, Bintaro unresolved.
WA input digit normalized, Maps URL HTTPS allowlist; reverify target if owner
mengubah number. Fulfillment disabled until explicitly reviewed production.

Owner base/branch price override, staff hanya is_listed/status/stock own branch.
RLS+trigger F03 diuji lagi terhadap UI/REST, bukan disabled field saja. Null stock
not tracked; zero=>sold_out/no contradictory available. Unknown hours not 24h;
one interval/day plus closed flag, invalid overnight policy ditolak sampai desain
split/overnight disepakati. Bulk editing bila ada harus per-item validation and
truthful partial result atau atomic transaction; jangan klaim semua sukses.

Invalidate branch scoped public/admin data, cart conflicts on switch, checkout
fresh quote sees new offers. Uji owner/staff Surabaya/Bintaro, direct override
write/ID move denied, disabled fulfillment, stale concurrent edit, save errors,
both WA links and mobile controls. Gates+SQL/integration/E2E, data readiness list.
```

### F19 — Admin promosi dan konsistensi kalkulasi

```text
Implementasikan F19 untuk R13/R19; PRD §4.4,13.7,15,27.2. Dependency F18,F13.
Owner-only promo CRUD title/banner/target all-category-product-variant/branches/
period/percentage/fixed/minSpend/cap/priority; scope pivots atomic dan publish
checks. Empty promotion_branches berarti semua active branches; no stackable.
Fixed per-unit dan cap per-line sesuai PRD; tampilkan preview contoh shared calc,
tidak membuat engine diskon baru/unique coupons/free-shipping fee calculation.

UI status scheduled/active/ended derived clock, ends exclusive, Jakarta display;
API only active. Historical posters tidak jadi promo aktif; informational shipping
banner hanya owner-approved content tanpa mengubah shipping total pending.
Update quote/catalog/Home/search badge dan Query invalidation terkait.

Uji target pivot missing, overlapping best monetary discount, UUID tie-break,
eligible min spend multi-line, percent fractions rounding, qty fixed cap,
begins/ends exact boundaries, branch scope dan disabled flag. Price change after
promo edit triggers checkout review. Staff403/direct RLS enforce. Gates+
unit+integration+admin/public browser+build; no active historical seed in production.
```

### F20 — CMS, FAQ, testimonial consent, dan custom business

```text
Implementasikan F20 untuk R08/R20; PRD §6,10,13.9,15,27.1. Dependency F19,F08.
Owner-only content key editors typed Zod, FAQ CRUD/category/order and testimonial
draft/approve/publish/archive. Allowlist hero/story/values/contacts/class promo/
custom business/community/footer/legal blocks; no arbitrary HTML/script editor.
Confirmed Gmail and branch contacts refer to trusted source, not duplicate copy.

Use company proposal/profile draft copy already in PRD, not invented founder/
certification. Natural/no-preservatives claims owner review, not all-SKU safety.
Testimonials T01–T04 initially anonymous draft, rating null. Publish needs actual
consent_at+private reference; raw WhatsApp screenshot/PII never public or Git.
Public table/view column grants hide private evidence; RLS parent visibility.
What They Say hidden if no consent; empty preview admin may still show drafts.
Custom business CTA branch-aware consultation with no leads table/new workflow.

Uji invalid key/payload/XSS/unsafe external links, consentless publish denied,
private reference direct REST hidden, draft no public/chat, edit refresh public
content+FAQ retrieval, archive order, staff403. Gates+SQL/integration/browser/build.
Owner policy signoff tracked release gate; no generic refund policy invented.
```

### F21 — Baking classes lengkap admin, publik, dan WA

```text
Implementasikan F21 untuk R21; PRD §9,10,13.8,15,27.5. Dependency F20.
Owner class program CRUD; owner/staff own branch sessions CRUD/status/cancel/full/
registration flag/capacity/seatsLeft. Public /classes dan /classes/[slug], Home
next-session teaser memakai DB yang sama. Session starts/ends/deadline UTC,
display Jakarta; program published, branch active, future ordering jelas.

Sesi full/closed/cancelled tidak registerable meski page detail masih informatif;
expired deadline ditolak server. Unknown seats not exact guarantee, capacity
manual bukan reservasi. Program tanpa future session tampil ask-next-class CTA.
Tidak mengubah poster Juni/Juli menjadi tanggal baru palsu.

POST /api/classes/prepare-registration strict sessionId/attendee count/adult
contact optional; read latest eligible session/program/branch/price; generate
trusted host branch WA+preview/copy fallback. No product cart, no registrations
table, no child identity collection, no seat decrement, no signup success claim.

Uji two branches/session scope, price override, past/future/fixed clock,
deadline/start boundaries, cancelled/full during prepare, seatsLeft0, age bounds,
attendee invalid, correct WA target decoded payload, DB snapshot unchanged.
Gates+SQL/integration/E2E public/admin/registration, real photo consent release check.
```

### F22 — Ask Oma baseline hanya-baca

```text
Implementasikan F22 untuk R22; PRD §11,14.5,27.5–27.7. Dependency F21.
Assistant deterministic catalog+FAQ TANPA kebutuhan LLM key. Widget+trigger+
messages/input/recommendation components→hook busy/abort/generation ID→browser
service→POST /api/chat strict Zod/no-store/byte limit16KiB/timeout+abuse limits.
Nonstream baseline, memory-only history, no chat DB writes/provider call on load.

Fixed operations search_products/recommend_by_budget/get_product_detail/
get_active_promotions/get_branches/get_upcoming_classes/search_faqs/clarify/refuse.
Use separate anon public-read client no admin cookies/Authorization/service role;
explicit columns published data, bounded rows<=10, structured price math and
verified diet. Branch required for price; unknown intent clarify+quick prompts.
Results provenance/branch/limits+safe internal links. No arbitrary SQL/table/RPC
names/tool writes; FAQ/product injection treated as text, no privilege effects.

UI desktop nonmodal/mobile modal semantics, keyboard/IME/Shift+Enter, reset pending
aborts stale reply, branch change clears prior branch context with notice. No fake
typing latency unless requested. Answer/byte/deadline constants enforced server.

Uji semua read ops/ambiguity/budget/price/promo date/class, malicious request extra
fields/system/tool role, history limits, DB failure vs empty, XSS/link injection,
double send/reset/abort. Actual anon write-denied insert/update/delete/upsert/
RPC+Storage, same-browser owner-login still anon and business snapshot unchanged.
Gates+unit/SQL/integration/E2E; prompt refusal saja tidak cukup membuktikan read-only.
```

### F23 — Opsional: Gemini terkontrol dengan fallback

**Lewati prompt ini** bila assistant deterministic sudah memenuhi kebutuhan atau belum ada limiter/budget. Catat NOT SELECTED; lanjut F24. Generatif tidak perlu agar MVP baseline lengkap.

```text
Saya memilih F23 generatif. Implementasikan R23 opsional di atas F22, sesuai
PRD §11,20,27.5–27.7. Verifikasi provider model/SDK yang tersedia saat ini;
install @google/genai hanya jika kompatibel, key/model server env saya isi manual.
Jangan menyalin hardcoded model/rotasi API key dari referensi untuk mengakali kuota.

Planner mengusulkan read-plan Zod fixed operation/filter; backend tetap memutuskan
branch/projection, angka hanya shared server calc. Response generation dari DTO
sanitized dengan output schema/policy/safe links; no invented price/stock/claims.
Provider flag off → deterministic; invalid/timeout/quota → fallback jika retrieval
berhasil, DB failure tetap error. Memory history bounded, no embeddings/history DB.

Sebelum public generatif on, limiter efektif multi-instance/global per-minute/day
budget/concurrency+deadline/provider abort+max1024 output tokens. Store limiter
eksternal metadata TTL, bukan Supabase write via chat; privacy documented. Limiter
unavailable fail closed. Jika infrastructure/budget belum dipilih, siapkan flag-off
code yang aman dan catat BLOCKED; jangan aktifkan endpoint biaya publik.

Mock provider untuk tests: invalid plan, injection/data instruction, empty output,
hallucinated price/link redacted, timeout/cancel, quota, store outage and race limit.
Actual DB grants tetap anon after owner login. Live small smoke hanya saat saya
memilih model/key/budget; jangan menghabiskan kuota untuk seluruh test suite.
Gates+read-only regression, report enabled/disabled and exact untested live items.
```

### F24 — Integrasi akhir, SEO, a11y, performance, dan CI

```text
Implementasikan F24 untuk R01/R07/R24; PRD §19,22,27.7. Dependency F22 dan F23
jika dipilih. Audit ulang wiring Home/catalog/cart/admin/promo/classes/chat:
hilangkan placeholder/adapters yang seolah sudah selesai; no production fixture.

Metadata/canonical/OG tiap route, dynamic sitemap only public, robots/noindex
admin/cart/checkout/auth/preview, Product/Event/Bakery schema hanya fakta verified
dan branch pricing akurat; no fake aggregateRating. Test image remote patterns,
hero sizes/font subsets/CLS and minimal client JS; lazy chat only client boundary.
Security headers/CSP workable dengan Next/Supabase/fonts/WA, no token cached;
do not add policy blindly that breaks hydration/auth/images. Correct error/
not-found/loading vs DB outage; transient approved contact fallback only.

Complete CI with npm ci, typecheck/unit/SQL/integration/generate-types diff,
format:check/lint/unused/build, Playwright against production build+local stack.
No production credentials in PR jobs, no automatic remote seed/reset/deploy.
Scripts db local guards/build data requirement documented. Validate docs relative
links/fences/route/env consistency and no leftover TODO/fake success/dead code.

Run one batched mobile375/390/tablet768/desktop1440 browser/a11y review including
keyboard/zoom/reduced motion/errors/offline; batch fixes then confirm. Measure
Lighthouse representative production build and compare PRD targets; report actual
numbers/environment, not guarantee. Unit/DB/E2E and full npm check must pass;
if infra unavailable mark NOT RUN, no pretend security/performance pass.
```

### F25 — Audit menyeluruh PRD, regression, dan owner UAT

```text
Kerjakan F25 untuk R25. Baca ulang seluruh docs/prd.md, bukan hanya progress file.
Gunakan §22 U01–U21/A01–A14 dan §26 R01–R26 sebagai checklist minimum, serta semua
normative detail §27. Dependency F24. F23 opsional boleh NOT SELECTED.

Buat matriks actual requirement→file/route→test→command+result→runtime evidence→
gap. Review source+DB+browser, bukan nama file atau test lulus tanpa assertion
penting. Audit menu variants/bundle/diet, cart branch conflicts, all admin CRUD,
CMS/contacts/legal/B2B, classes, assistant operations, RLS/direct grants/private
evidence/field restrictions, seeds/typegen/CI/backup. Close technical gaps sesuai
scope secara bertahap lalu rerun hanya tests impacted+final complete suite.

Run clean local reset+seed twice, typegen diff, npm ci reproducibility, format→
lint→typecheck→unit/integration→SQL→unused→format:check→build→E2E. Gunakan synthetic
fixtures/intercept WA; external click bukan completed purchase. List FAIL/BLOCKED/
NOT RUN transparan; jangan menurunkan acceptance untuk membuat semua hijau.

Siapkan owner UAT script sederhana: pilih dua cabang, isi cart+bundle, review
WA tanpa kirim otomatis; ubah harga/stock/promo, edit content, jadwalkan/cancel
kelas, recovery akun, tanya Ask Oma termasuk “hapus produk”. Saya mengisi hasil
dan memvalidasi katalog/policy/assets/consent yang nyata. Bedakan TECHNICAL PASS,
BUSINESS DATA READY, dan READY FOR RELEASE REVIEW. R26 deployment belum dianggap
selesai oleh build lokal. Berikan daftar blocker go-live spesifik, bukan klaim
“PRD 100%” jika masih ada required gap atau data komersial pending.
```

### F26 — Paket rilis, staging, deployment, dan handover

```text
Kerjakan F26 untuk R26 setelah F25. Mulai dengan paket rilis yang konkret dan
bisa saya review; jangan mengubah remote/produksi sebelum ada instruksi target.
PRD §20,27.7. Verifikasi terms/kuota host/SDK/adapter sekarang; Netlify kandidat
utama, bukan jaminan free forever. Vercel Hobby bukan default bisnis komersial.

Siapkan deployment.md/README/owner manual: exact build/node/env key names (tanpa
values), staging/prod separate Supabase, allowlisted Auth redirects/recovery/SMTP,
Storage policy/origins, migration order+dry-run+backups/restore, reviewed manifest
diff, dataset/no-demo checks, preview access/noindex, CI results dan runtime smoke.
No demo seed on remote; no reset remote. Production media backup terpisah dari DB.
Rollback code vs forward corrective DB migration dibedakan, RPO/RTO target owner
dan restore rehearsal dicatat. Health check tidak membocorkan secrets/version.

Jika saya belum menginstruksikan deployment, berhenti pada READY FOR RELEASE
REVIEW dengan command/runbook/diff dan gate §10; bukan minta keputusan sebelum
paket konkret siap. Jika saya sudah memberi target/izin deploy, lanjut hanya target
itu: staging migrations+reviewed seed→deploy→runtime smoke; production setelah
gate bisnis dan staging lulus. Jangan mengulang minta izin yang sudah diberikan.

Smoke runtime HTTPS/dynamic product/real DB/branch pricing/cart/prepare WA two
numbers/admin refresh-login-recovery-authorized CRUD/class/chat read-only fallback/
headers/cache/images. Tidak mengirim order/WA real otomatis. Handover cara update
SKU/harga/soldout/nomor WA/hours/promo expired/kelas/consent, recovery/backup/budget
alerts/kill switch AI. Laporkan URL bila benar live, deployment ID, actual tests,
known limits dan owner action; no “deployed” bila baru menulis konfigurasi.
```

## 6. Gate pengujian yang harus benar-benar dijalankan

Perintah final setelah scripts/harness tersedia:

```powershell
npm ci
npm run db:start
npm run db:reset:local
npm run db:seed:verify
npm run db:types:local
npm run format
npm run lint
npm run typecheck
npm test
npm run test:db
npm run db:test:policies
npm run lint:unused
npm run format:check
npm run build
npx playwright install chromium
npm run test:e2e
```

**Jalankan `db:reset:local` hanya pada DB lokal disposable yang telah diverifikasi**; hapus data lokal, bukan langkah harian wajib. Setelah typegen, periksa `git diff -- src/types/database.ts`: perubahan yang semestinya di-commit bukan ditutup dengan edit manual. `test:db` SQL/pgTAP dan `db:test:policies` REST/JWT saling melengkapi; unit suite harus mencakup integration yang dikonfigurasi atau sediakan script `test:integration` terpisah dan catat di status.

Playwright config harus menyalakan/menargetkan **production build** aplikasi lokal dengan dataset test dan menunggu server siap; `npm run test:e2e` bukan asumsi server sudah berjalan. Jangan menjalankan test ke production customer. CI lint/typecheck boleh paralel jika read-only; mutations/reset/seed dan browser tests yang berbagi DB berurutan atau fixture terisolasi. Satu suite PASS tidak membuktikan suite lain sudah dijalankan.

| Jenis verifikasi      | Bukti yang dapat diterima                                                     | Tidak cukup                           |
| --------------------- | ----------------------------------------------------------------------------- | ------------------------------------- |
| Schema/seed           | Clean reset, counts/FK/data invariants, second seed idempotent                | SQL file sudah ada                    |
| RLS/chatbot read-only | JWT anon/staff/owner, direct REST/RPC negative writes, business snapshot      | UI tombol di-hide/AI menjawab menolak |
| Price/discount        | Fixtures exact gross/discount/total, branch/time/cap cases                    | Tampilan Rp benar pada satu produk    |
| Admin aggregate       | Commit sukses dan rollback seluruh edit ketika satu child invalid             | Toast sukses frontend                 |
| Checkout              | Decoded WA message = quote, destination branch benar, reprepare change review | Tombol WA terbuka                     |
| UI/a11y               | Screenshot+interaction keyboard/mobile/error/loading, contrast/labels         | Build lulus                           |
| Runtime deploy        | HTTPS dan flows memakai hosted target yang benar                              | Localhost sukses/host build log hijau |

## 7. Checklist manual Anda di antara fitur

| Sesudah      | Yang Anda coba atau isi                                                                       |
| ------------ | --------------------------------------------------------------------------------------------- |
| F00          | Cek lokasi root bakery dan keputusan paket/desain, selesaikan login/tool blocker              |
| F04          | Jalankan app/Studio, pastikan DEMO jelas, dua cabang dan seed dapat dibaca                    |
| F05–F08      | Review visual cream-burgundy, font/logo/foto, brand story dan kontak                          |
| F09–F12      | Cari/filter, variant/bundle, cabang berbeda, cart refresh dan conflict                        |
| F13–F14      | Preview subtotal/discount/pilihan, WA Surabaya dan Bintaro; jangan otomatis kirim order demo  |
| F15          | Buat owner/test staff lewat workflow protected; uji login/logout/reset sendiri                |
| F16–F20      | Buat draft SKU, upload foto, publish, edit price/stock/promo/CMS/FAQ, consent feedback        |
| F21          | Buat jadwal kelas future dummy lokal, closed/cancelled; review registrasi WA                  |
| F22          | Tanya harga/budget/branch/FAQ; coba perintah “ubah harga” dan lihat bukti DB denial dari agen |
| F23 opsional | Putuskan model/budget/limiter; isi provider key sendiri bila dipilih                          |
| F25          | Lengkapi owner UAT, daftar harga/hours/fulfillment/policy/assets release checklist            |
| F26          | Buat hosted target, env/dashboard/SMTP/domain, review dry-run/backups; pilih tindakan deploy  |

Untuk Git, instruksi owner 12 November 2026 mengizinkan agen membuat satu commit terpisah lalu push otomatis setelah setiap Fxx selesai dan gate wajib lulus, tanpa meminta izin ulang. Ikuti aturan Git per fitur di `AGENTS.md`: review diff setelah format, stage hanya perubahan fitur termasuk dokumentasi/test/migration terkait, pertahankan perubahan pengguna, dan gunakan pesan Conventional Commits dengan scope Fxx. Jangan stage `.env`, local backups, customer chats atau fixture auth secrets. Periksa root bakery, branch, staged diff dan remote tujuan; jangan force-push, amend commit yang sudah di-push, reset, atau merge otomatis. Laporkan hash commit, branch, dan hasil push; kegagalan Git dilaporkan sebagai blocker. Initial setup GitHub tetap manual; izin ini tidak mencakup deployment atau mutation database remote.

## 8. Prompt perbaikan, melanjutkan chat, dan perubahan requirement

### Jika fitur gagal atau belum lengkap

```text
Perbaiki fitur Fxx terakhir yang belum PASS. Baca laporan aktual pada
docs/implementation-status.md dan PRD terkait, reproduce kegagalannya, lalu
perbaiki akar penyebab dalam scope. Jangan lanjut fitur berikut, menghapus test,
menurunkan strictness/RLS, atau menggunakan mock sebagai pengganti DB security test.
Pertahankan perubahan saya. Jalankan regression relevan dan format/lint/build;
update evidence/status hanya berdasarkan hasil. Jika akses/data manual memang
diperlukan, jelaskan satu blocker konkret dan lanjutkan pekerjaan independen.
```

Ganti `Fxx` dengan fitur yang sedang dikerjakan; tidak perlu menyalin seluruh riwayat. Sertakan pesan error tersanitasi bila ada, tanpa env values/token.

### Jika pindah chat atau agen kehilangan konteks

```text
Lanjutkan proyek Resep Oma Kueh di repo bakery ini. Baca AGENTS.md, docs/prd.md,
docs/execution-guide.md, docs/implementation-status.md dan docs/decisions.md.
Jangan mulai ulang/scaffold ulang, jangan menganggap semua checkbox sudah benar.
Periksa git status dan evidence terakhir, identifikasi fitur pertama belum PASS
beserta dependency; laporkan singkat lalu kerjakan fitur itu sesuai kontrak §3.
Jika satu fitur BLOCKED, lanjutkan bagian independen yang masih dalam fitur itu.
Commit/push otomatis per Fxx yang selesai dan lulus gate sesuai AGENTS.md;
tidak deploy/remote database mutation otomatis; jangan membaca secret ke chat.
```

### Jika owner memberikan data bisnis baru

```text
Integrasikan data bisnis terkonfirmasi yang saya berikan ke requirement terkait.
Catat sumber/tanggal/keputusan di decisions dan reviewed manifest; jangan menimpa
data produksi secara otomatis. Bedakan data dari kata-kata dalam lampiran yang
sekadar referensi. Update typed schema/seed local/admin validation jika perlu,
review diff dan pengujian terdampak. Jangan mengubah fitur/domain lain atau
menerbitkan data yang masih pending consent. Update PRD dan release readiness.
```

## 9. Format laporan fitur dan audit akhir

Contoh struktur yang harus diisi agen dengan hasil nyata (bukan semua PASS sejak awal):

```text
Fitur: F14 — Checkout UI
Requirement: R14; PRD §8 dan §27.3
Perilaku selesai: ...
File dibuat/diubah: ...
Migrasi/schema berubah: ... / tidak ada
Unit/integration/SQL/E2E commands, exit code dan hasil: ...
Format/lint/typecheck/build: ...
Bukti browser/SQL: ...
Pending data bisnis / test NOT RUN: ...
Risiko/known limit: ...
Status teknikal: PASS/FAIL/BLOCKED
Release gate: READY/BLOCKED + alasan
Langkah manual saya bila perlu: ...
```

Final F25 wajib membuat coverage R01–R26, U01–U21, A01–A14. Tambahkan subcase untuk field-level authorization, atomic editor, recovery, contact B2B, policy, demo leak, media-draft privacy dan class/chat timeout; tabel awal bukan batas maksimum pengujian. Requirement opsional tidak dipilih dipisah; requirement WAJIB yang tidak diuji tidak boleh ditandai selesai.

## 10. Gate data dan rilis komersial

Dokumen siap dieksekusi tidak sama dengan katalog aktif sudah disetujui. Checklist ini dipenuhi menjelang F25/F26, tidak perlu menghambat seluruh development lokal.

- [ ] WA kedua cabang diuji membuka tujuan benar secara manual; tidak menekan Send otomatis.
- [ ] Gmail dan alamat Surabaya sesuai konfirmasi; alamat Bintaro/Maps/hours hanya jika sudah valid; data belum tersedia disembunyikan dengan jujur.
- [ ] Daftar SKU/harga/foto/stock cabang/bundle rules dan ingredient/diet/allergen reviewed; DEMO/synthetic/needs-review tidak published produksi.
- [ ] Pickup/delivery, cutoff/date rules, shipping manual, minimum order dan policy reschedule/refund disepakati; hanya metode terkonfirmasi aktif.
- [ ] Consent testimonial dan foto, terutama anak, benar; private evidence tidak exposed.
- [ ] Promo/sesi hanya yang masih valid; tidak ada poster historis dianggap current.
- [ ] Owner/staff accounts dan recovery email teruji, no public signup/role escalation.
- [ ] Baseline Ask Oma anon read-only teruji; generatif off kecuali budget+limiter+disclosure siap.
- [ ] All required checks PASS, tidak ada required FAIL/NOT RUN; sumber hasil dan lingkungan test tercatat.
- [ ] Hosted terms/quotas/runtime kompatibel, staging smoke lulus; env/keys/DNS/redirects benar.
- [ ] Backup database+media dan restore rehearsal, rollback code, owner manual dan akses akun siap.
- [ ] Owner UAT dan instruksi publikasi/target deployment jelas; agen tidak menyebut live sebelum runtime terbukti.

Jika alamat Bintaro belum diketahui, website tetap dapat rilis dengan kartu cabang berisi WA tanpa map/alamat, jika owner setuju. Jika fulfillment kedua metode belum dikonfirmasi, cabang itu hanya konsultasi WA, bukan checkout berstruktur. Jika consent testimoni belum ada, section disembunyikan. Jika harga/SKU aktif belum disetujui, **katalog pembelian komersial belum siap** meskipun demo teknis selesai. Catat pengecualian terbatas pada data opsional ini; tidak menghapus kewajiban keamanan atau memalsukan acceptance.

## 11. Referensi teknis dan temuan audit

Analisis kelengkapan PRD yang lebih rinci terdapat pada **PRD §25**. Ringkasannya: fondasi awal sudah baik, revisi memperjelas data perusahaan, formula diskon, review harga, field-level RLS, atomic editor, seed demo/produksi, policy/media privacy, recovery, dan traceability agar agen dapat diuji per fitur. Kesiapan produksi tetap membutuhkan bukti implementasi serta owner review.

Periksa ulang versi/terms saat eksekusi; dokumentasi resmi adalah rujukan API, bukan pengganti keputusan produk:

- [Next.js installation](https://nextjs.org/docs/app/getting-started/installation) dan panduan versi terpasang di `node_modules/next/dist/docs/`.
- [Supabase SSR client](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [functions/grants](https://supabase.com/docs/guides/database/functions).
- [Supabase CLI setup](https://supabase.com/docs/guides/local-development/cli/getting-started), [migrations](https://supabase.com/docs/guides/local-development/database-migrations), [seeding](https://supabase.com/docs/guides/local-development/seeding-your-database).
- [Netlify Next.js support](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/), [Netlify pricing](https://www.netlify.com/pricing/), [Vercel Hobby terms](https://vercel.com/docs/plans/hobby).

Versi registry Next/create-next-app telah dicek saat penulisan panduan, tetapi perintah scaffold/library/install/DB dalam panduan ini **belum dijalankan pada repository bakery baru**. Tidak ada akun/hosting/database produksi yang dibuat oleh tugas penyusunan dokumen ini.
