# Resep Oma Kueh

Next App Router fullstack. Saat ini hanya fondasi F01; storefront/schema/RLS/admin/checkout/Ask Oma belum diimplementasikan.

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

`check` menjalankan lint → typegen/typecheck → Vitest → compiler boundary → unused → format check → build. Playwright menyalakan production server sendiri dan memerlukan build yang baru lulus. Boundary fixture tidak memakai env produksi. `test:db` adalah pgTAP CLI lokal; belum ada schema/suite F01 dan tidak dihitung PASS. Jangan menambahkan argumen remote.

DB lokal memerlukan Docker/Supabase bakery. Inisialisasi konfigurasi/schema dan workflow DB dilanjutkan sesuai F02–F04; tidak ada reset/migration/deployment otomatis dari check/CI.

## Kontrak dan status

- [PRD](docs/prd.md) dan [execution guide](docs/execution-guide.md)
- [Arsitektur aktual](docs/architecture.md)
- [Status dan bukti pengujian](docs/implementation-status.md)
- [Keputusan](docs/decisions.md)
