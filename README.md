# Resep Oma Kueh

Aplikasi web **Resep Oma Kueh** berbasis Next.js App Router fullstack, TypeScript strict, Tailwind CSS, dan Supabase (PostgreSQL, Auth, Storage) untuk storefront publik (`/`, `/menu`, `/menu/[slug]`, `/about`, `/classes`, `/classes/[slug]`, `/contact`, `/faq`, `/cart`, `/checkout`, `/privacy`, `/ordering-policy`), asisten **Ask Oma** (`/api/chat` deterministik + adapter generatif `CHAT_PROVIDER_ENABLED=false` default), serta panel admin owner/staff (`/admin/**`).

Matriks izin RLS/RBAC terdokumentasi di [security.md](docs/security.md).

## Development lokal

Gunakan Node dari `.node-version` dan npm 11.16.x. Dari root repository bakery:

```powershell
npm ci
if (-not (Test-Path -LiteralPath .env.local)) {
  Copy-Item -LiteralPath .env.example -Destination .env.local
}
npm run dev
```

- Salin `.env.example` hanya jika `.env.local` belum ada; jangan menimpa credential lokal yang sudah diisi.
- Jangan menulis secret, API key, atau data PII ke chat/log/Git.
- `CHAT_PROVIDER_ENABLED` default `false` (asisten berjalan pada mode deterministik `POST /api/chat`). Provider generatif memerlukan key server (`GOOGLE_GEN_AI_API_KEY`, `GOOGLE_GEN_AI_CHAT_MODEL`) dan store limiter eksternal sebelum dapat diaktifkan di lingkungan non-demo.
- App tetap dapat dibangun dan dibuka sebelum DB aktif: page publik memanggil `connection()` saat runtime request dan memiliki error/fallback UI (`APPROVED_CONTACTS` hanya kontak resmi) tanpa mengarang harga, jam operasional yang belum dikonfirmasi, atau stok.

## Syarat data build & pemeriksaan

```powershell
npm run format
npm run check
npx playwright install chromium
npm run test:e2e
```

- `npm run check` menjalankan `lint` -> `typecheck` (`next typegen && tsc --noEmit --noUnusedLocals --noUnusedParameters`) -> `vitest run` (unit & server boundary tests) -> `test:boundaries` (`eslint` + `server-only` AST check) -> `lint:unused` (`knip`) -> `format:check` -> `next build`.
- Production build (`npm run build`) tidak memerlukan koneksi DB produksi; sitemap dinamis dan page publik menggunakan runtime `connection()`.
- Playwright (`npm run test:e2e`) menjalankan server production lokal sendiri di `127.0.0.1:3100` dengan environment uji non-produksi (`NEXT_PUBLIC_DEMO_MODE=true`, `CHAT_PROVIDER_ENABLED=false`).

## Database lokal & guard

Operasi DB lokal memerlukan Docker dengan stack Supabase lokal (`54321`/`54322`) sedangkan test SQL disposable (`npm run test:db` / `npm run db:test:policies`) memakai port terisolasi (`55321`/`55322`) dan membersihkannya otomatis.

```powershell
npm run db:start
# PERINGATAN: menghapus seluruh isi DB LOKAL lalu menjalankan migration + seed DEMO:
npm run db:reset:local
npm run db:seed:verify
npm run test:db:seed
npm run test:db:permissions
npm run db:types:local
npm run db:types:local -- --check
npm run test:db:tooling
```

- Semua script `scripts/db-*.mjs` memverifikasi project root, container, dan loopback host lokal, serta menolak argumen atau URL remote.
- Seed lokal memuat data DEMO bertanda waktu tetap (`2026-11-11T00:00:00+07:00`) yang bukan fakta operasional produksi (`NEXT_PUBLIC_DEMO_MODE=true` menampilkan banner DEMO dan menandai `noindex`).
- Untuk deploy produksi nyata, `APP_ENV=production` menolak `NEXT_PUBLIC_DEMO_MODE=true`; data DEMO wajib diganti/audit sesuai checklist produksi dan `npm run db:seed:reference` tetap default **offline dry-run**. Detail prosedur ada di [database.md](docs/database.md).

## CI workflow

Workflow [.github/workflows/ci.yml](.github/workflows/ci.yml) menjalankan dua job terpisah tanpa credential produksi dan tanpa deploy/seed remote:

- `foundation`: `npm ci` -> `npm run check` -> Playwright Chromium (`npm run test:e2e`) dengan env sintetis non-produksi.
- `database`: `npm ci` -> `test:db` -> `db:start` -> `db:reset:local` -> `db:seed:verify` -> `test:db:seed` -> `test:db:permissions` -> `db:types:local -- --check` -> `test:db:tooling` -> `scripts/test-site-local.mjs`.

## Kontrak dan status

- [PRD](docs/prd.md) dan [execution guide](docs/execution-guide.md)
- [Arsitektur aktual](docs/architecture.md)
- [Fondasi visual dan API komponen](DESIGN.md)
- [Cabang dan pengujian lokal](docs/branches.md)
- [Database dan keamanan seed](docs/database.md)
- [Matriks keamanan dan RLS](docs/security.md)
- [Status dan bukti pengujian](docs/implementation-status.md)
- [Keputusan arsitektur](docs/decisions.md)
