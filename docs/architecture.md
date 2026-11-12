# Arsitektur aktual — F01

Fondasi Next App Router, React 19, Node 24, TypeScript strict. `/` masih scaffold. F01 tidak membuat domain, API endpoint, tabel, admin UI, atau chatbot.

```mermaid
flowchart LR
  UI[Client UI] --> Hook[Hook] --> Service[Browser service] --> Axios[lib/axios]
  Axios --> BFF[Next Route Handler] --> Domain[Server service/repository] --> DB[Supabase dengan grants/RLS]
  RSC[Server page/view] --> Domain
```

Panah adalah kontrak boundary, bukan klaim layer domain sudah diimplementasikan. Service/hook/domain ditambah saat fitur pemakainya dibuat; RSC tidak self-fetch API.

## Modul yang tersedia

| Lokasi                                              | Perilaku aktual                                                                                                                    |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `src/constants`                                     | Home/base API, namespace Query, stale/retry/timeout/limit/error copy; tanpa endpoint fitur palsu                                   |
| `src/types/api.ts`, `src/validations/api.schema.ts` | Envelope success/error, pagination typed, validasi output strict                                                                   |
| `src/config/environment.client.ts`                  | Referensi NEXT_PUBLIC eksplisit untuk substitusi build Next; tanpa provider/server key                                             |
| `src/config/environment.server.ts`                  | server-only; APP_ENV dan provider flag, fail-closed sampai F23 dipilih                                                             |
| `src/config/parse-environment.ts`                   | Error hanya nama key, tanpa input/cause/ZodError/nilai rahasia; termasuk exception custom refinement                               |
| `src/lib/axios`                                     | BFF relatif, timeout, AbortSignal, satu validasi/unwrap; mempertahankan data/requestId/meta/pagination; tanpa toast/log raw config |
| `src/lib/errors.ts`                                 | Error sanitized, retry terbatas; 4xx/abort/invalid response tidak diulang                                                          |
| `src/lib/response.server.ts`                        | JSON no-store, validasi success dan failure generik; belum ada handler domain                                                      |
| `src/lib/query-client.ts`, `src/providers`          | QueryClient per mount, stabil saat rerender; mutation tidak auto-retry; layout tetap RSC                                           |
| `src/utils/cn.ts`                                   | clsx + tailwind-merge, dipakai layout. Provider tanpa DOM hanya menerima children                                                  |
| `tooling/eslint/architecture.mjs`                   | Boundary alias/relative/dynamic import/re-export, UI/hook/service/transport/domain/pure modules dan larangan barrel server         |

Barrel constants/types/utils/config/providers/lib-axios client-safe; server-only diimpor langsung. Type-only imports dan larangan explicit any diperiksa ESLint. Compiler Next tetap menjadi gate transitive client/server, bukan digantikan lint.

## Environment sebelum DB

`.env.example` berisi defaults nonrahasia dan credential kosong. Root scaffold memvalidasi nilai yang terisi; URL/key DB kosong diperbolehkan sebelum fitur DB ada. Adapter Supabase selalu mewajibkan keduanya saat dipanggil; tidak mengganti kegagalan dengan data palsu. Public key hanya menerima format publishable atau legacy JWT role anon dan menolak secret/service-role. Ini bukan verifikasi signature atau bukti RLS.

Boolean hanya string true/false. Provider disabled tidak memerlukan key/model; aktivasi ditolak sampai F23. Belum ada provider SDK/limiter. NEXT_PUBLIC dibundel saat build dan memerlukan rebuild ketika diubah. Server env tidak masuk barrel browser.

## Konteks Supabase dan cookie bridge

- `lib/supabase/client.ts`: SSR browser Auth adapter saja, bukan CRUD bisnis.
- `lib/supabase/server.ts`: client per request dengan await cookies. Tanpa response adalah RSC read-only; Route Handler wajib mengoper NextResponse untuk meneruskan cookie dan header cache SDK, lalu mengembalikan response tersebut atau menyalinnya secara utuh.
- `lib/supabase/proxy.ts` dan `src/proxy.ts`: refresh getClaims, akumulasi semua chunk cookie pada request/response dan header argumen kedua setAll. Matcher literal hanya scope admin/auth; chat/checkout publik tidak ikut refresh. Literal diperlukan static analysis Next. Proxy bukan guard role/profile/revocation F15.
- `lib/supabase/public-read.server.ts`: client anon baru tanpa persistence/refresh/session detection, fetch no-store/credentials omit, cookie dihapus dan apikey/Authorization dipatok ke public key. Tidak menerima request/admin JWT/service-role. Belum ada chat/query domain.

Bridge mengikuti [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client) dan signature SDK terpasang 0.12.7. Client SSR tidak disimpan global. Dengan Cache Components, ikuti docs Next terpasang, bukan konfigurasi route/cache lama. Semua public DB fetch baseline uncached.

Generated Database type baru dibuat setelah schema pada F02/F04; tidak ada placeholder types manual. Helper anon tidak menjamin SELECT-only: actual grants/RLS/RPC/Storage negatif wajib diuji F03 dan regression F22. Tes fetch/cookie yang dimock hanya menguji kontrak adapter.

## Tooling

Vitest memisahkan project unit/DOM/server dengan inheritance eksplisit, pool threads, satu worker, serial file scheduling dan isolation tetap aktif. Ini membatasi beban startup Windows, tanpa mengurangi assertion atau mengubah timeout produk. Hanya project server menunjuk entry kosong asli server-only; alias itu tidak berlaku pada browser/build. `test:boundaries` memakai compiler Next asli (webpack) dan modul environment server proyek: import harus berhasil di RSC dan ditolak di Client Component. Production build aplikasi memakai Turbopack. Fixture memakai env bersih; cleanup hanya pada temp path terverifikasi.

Playwright smoke memakai next start dari production build lokal port 3100 dan memverifikasi scaffold/provider, bukan storefront/DB. `test:db` adalah pgTAP CLI lokal; suite/schema belum tersedia pada F01. Tidak ada passWithNoTests atau tes dummy.

CI dasar memakai npm ci/check tanpa secret/DB produksi; DB/E2E masuk CI ketika harness terkait ada. Knip mengecualikan paket M03 tertentu yang sudah disiapkan owner untuk fitur berikutnya, bukan semua source/export. Hasil aktual dan NOT RUN ada di [implementation-status.md](implementation-status.md).
