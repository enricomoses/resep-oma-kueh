# Resep Oma Kueh

Next App Router fullstack. F01–F04 menyediakan fondasi, schema/izin, seed DEMO lokal dan generated types. Storefront, login/admin UI, checkout dan Ask Oma belum diimplementasikan. Banner DEMO tetap terlihat pada scaffold; desain bakery dimulai F05. Matriks izin ada di [security.md](docs/security.md).

## Development lokal

Gunakan Node dari `.node-version` dan npm 11.16.x. Dari root bakery:

```powershell
npm ci
if (-not (Test-Path -LiteralPath .env.local)) {
  Copy-Item -LiteralPath .env.example -Destination .env.local
}
npm run dev
```

Salin contoh env hanya jika file lokal belum ada; jangan menimpa credential yang sudah diisi. Isi credential lokal sendiri, bukan ke chat/Git. Provider generatif tetap nonaktif. Scaffold bisa dibuka sebelum URL/key DB diisi; adapter DB akan menolak konfigurasi kosong ketika dipakai. Aset/font scaffold belum desain bakery final.

## Pemeriksaan

```powershell
npm run format
npm run check
npx playwright install chromium
npm run test:e2e
```

`check` menjalankan lint → typegen/typecheck → Vitest → compiler boundary → unused → format check → build. Playwright menyalakan production server sendiri dan memerlukan build yang baru lulus. Boundary fixture tidak memakai env produksi. `test:db`/`db:test:policies` membuat stack test disposable sendiri pada 55321/55322 dan membersihkannya; dataset normal 54321/54322 tetap ada. Jangan menambahkan argumen remote.

DB lokal memerlukan Docker/Supabase bakery dengan Auth/REST/Storage. `check` tidak me-reset DB. Workflow data lokal:

```powershell
npm run db:start
# PERINGATAN: menghapus semua data database bakery LOKAL, lalu migration + seed DEMO.
npm run db:reset:local
npm run db:seed:verify
npm run test:db:seed
npm run db:types:local
npm run db:types:local -- --check
npm run db:test:policies
npm run test:db:tooling
```

`db:start` hanya insert-missing pada dataset kosong/DEMO; data non-DEMO yang sudah ada dipertahankan. Scripts memverifikasi project/container/loopback dan menolak argumen target lain. Supabase CLI 3.1 memakai default local; flag `--local` lama tidak dipakai. Generator types menulis UTF-8 temporary file dan mengganti file lama hanya sesudah exit 0. Jangan edit generated types manual. CI memeriksa drift types dari schema aktual.

Seed mempunyai 21 produk: 13 referensi historis draft (semua seri) dan 8 DEMO published, 25 SKU, bundle Regular/GF, placeholder PNG bertuliskan DEMO dan clock tetap **2026-11-11T00:00:00+07:00**. Harga/stock/GF/promo/kelas DEMO bukan fakta bisnis. Seed berulang tidak menimpa edit owner. Promo/sesi boleh kedaluwarsa seiring waktu nyata; clock produksi tidak dimundurkan. Alamat/Maps/jam yang belum terkonfirmasi tidak dikarang. Tidak ada akun/password di seed.

Isi URL dan publishable key **lokal** sendiri pada env aplikasi saat UI mulai membaca DB; jangan kirim secret ke chat. `NEXT_PUBLIC_DEMO_MODE` default true menampilkan banner. Untuk rilis nyata, `APP_ENV=production` menolak demo mode; flag wajib false dan dataset harus lolos audit produksi. Jangan mematikan banner untuk menyamarkan seed.

`npm run db:seed:reference` default **offline dry-run**, hanya manifest kontak/cabang yang telah dikonfirmasi. Tidak ada apply remote pada F04. Target/ref/name, private before/after diff, digest persetujuan, dan allowlist update wajib untuk apply yang kelak diotorisasi. Tidak mengirim seed DEMO ke remote. Prosedur dan batasnya ada di [database.md](docs/database.md).

## Kontrak dan status

- [PRD](docs/prd.md) dan [execution guide](docs/execution-guide.md)
- [Arsitektur aktual](docs/architecture.md)
- [Status dan bukti pengujian](docs/implementation-status.md)
- [Keputusan](docs/decisions.md)
