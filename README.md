# Resep Oma Kueh

Next App Router fullstack. Fondasi F01 dan schema/constraints F02 tersedia; storefront, policy role F03, admin, checkout dan Ask Oma belum diimplementasikan.

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

`check` menjalankan lint → typegen/typecheck → Vitest → compiler boundary → unused → format check → build. Playwright menyalakan production server sendiri dan memerlukan build yang baru lulus. Boundary fixture tidak memakai env produksi. `npm run test:db` menjalankan pgTAP dan concurrency harness terhadap stack bakery lokal yang sudah selesai start. Jangan menambahkan argumen remote. Schema, ERD, publish prerequisites dan prosedur replay lokal ada di [database.md](docs/database.md).

DB lokal memerlukan Docker/Supabase bakery. `check` tidak me-reset DB. CI SQL terpisah membuat stack lokal isolated dan replay migrations dengan `--no-seed` sebelum tes; tidak memakai DB produksi. Reset manual lokal menghapus data lokal dan wajib memverifikasi target loopback terlebih dahulu. Seed/generated types F04 serta policy F03 belum selesai.

## Kontrak dan status

- [PRD](docs/prd.md) dan [execution guide](docs/execution-guide.md)
- [Arsitektur aktual](docs/architecture.md)
- [Status dan bukti pengujian](docs/implementation-status.md)
- [Keputusan](docs/decisions.md)
