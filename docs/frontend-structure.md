# Panduan Lengkap Struktur Folder & Reuse Komponen Frontend (`resep-oma-kueh`)

Dokumen ini adalah panduan resmi arsitektur folder, penempatan komponen, dan aturan pemecahan (_decomposition_) komponen frontend Next.js (App Router) di repository **Resep Oma Kueh**.

---

## 1. Gambaran Umum Struktur Root

```text
resep-oma-kueh/
├── docs/                  # Dokumentasi arsitektur, PRD, struktur frontend, keamanan, & status
├── public/                # Aset statis publik
├── scripts/               # Script utilitas DB, seed, boundary check, & smoke runtime
├── src/                   # Seluruh source code aplikasi
├── supabase/              # Migrations, seed, & tes SQL pgTAP
├── tests/                 # Automated tests (unit, dom, server, e2e, fixtures)
├── tooling/               # Konfigurasi custom ESLint boundaries
├── AGENTS.md              # Kontrak arsitektur & aturan agent
├── DESIGN.md              # Fondasi visual & API primitif UI
├── eslint.config.mjs      # Konfigurasi ESLint
├── knip.jsonc             # Deteksi export/file tidak terpakai
├── next.config.ts         # Konfigurasi Next.js
├── package.json           # Dependencies & npm scripts
└── tsconfig.json          # Konfigurasi TypeScript (path alias `@/*`)
```

---

## 2. Struktur Lengkap `src/`

```text
src/
├── app/                   # Routing, layout, page tipis, BFF API, & komponen lokal (_components)
├── components/            # Komponen UI global & reusable lintas fitur
│   ├── ui/                # Primitif UI bakery kustom (Button, Card, Dialog, Input, dll.)
│   └── common/            # Komponen gabungan/bisnis/layout bersama lintas halaman & modul
├── config/                # Konfigurasi environment client & server (`server-only`)
├── constants/             # Nilai konstan, route, endpoint API, query keys, copy, limit
├── features/              # Domain & repository server-only (RSC & BFF Route Handlers)
├── hooks/                 # Custom React hooks (TanStack Query, controller view/form, & helper mutasi)
├── lib/                   # Transport Axios (`lib/axios/`), Supabase SSR/public-read, logger, error
├── providers/             # React Context Providers (`ReactQueryProvider`, `BranchProvider`)
├── services/              # Layer komunikasi HTTP client ke BFF Route Handlers (`*.service.ts`)
├── stores/                # Global client state (Zustand: `branch.store.ts`, `cart.store.ts`)
├── types/                 # Definisi TypeScript types & interfaces domain + generated DB types
├── utils/                 # Fungsi helper/utility murni (pure functions, `cn.ts`, formatter)
├── validations/           # Schema validasi Zod (form & boundary request/response)
└── proxy.ts               # Proxy helper refresh sesi admin/auth
```

---

## 3. Perbedaan Utama: `src/components/` vs `_components/`

Ini adalah aturan paling penting dalam struktur frontend project ini:

### A. `src/components/` (Global & Reusable)

Digunakan **hanya** untuk komponen yang **dipakai di 2 atau lebih halaman/fitur berbeda** atau komponen layout/shell global, dan **tidak terikat** pada satu route spesifik.

Terbagi menjadi dua subfolder:

1. **`src/components/ui/`**
   - Berisi komponen primitif UI kustom bakery (berbasis token `src/app/globals.css` dan `DESIGN.md`, bukan shadcn/BEM/Fina).
   - **Aturan:** Jangan menaruh logic bisnis, hook domain, atau API call di sini.
   - **Contoh:** `action-link.tsx`, `badge.tsx`, `button.tsx`, `card.tsx`, `dialog.tsx`, `drawer.tsx`, `feedback.tsx`, `form-field.tsx`, `input.tsx`, `modal-surface.tsx`, `quantity.tsx`, `select.tsx`, `textarea.tsx`.

2. **`src/components/common/`**
   - Berisi komponen gabungan, layout bersama, dan blok UI atomik yang dipakai ulang lintas halaman/modul (misalnya antara `(site)` dan `admin`, atau antar beberapa route).
   - **Subfolder terorganisir berdasarkan domain/tanggung jawab:**
     - `branch/` (`branch-selector.tsx`, `branch-status-pill.tsx`, `no-branch-alert.tsx`)
     - `cards/` (`info-card.tsx`, `stat-card.tsx`)
     - `chat/` (`chat-slot.tsx`, `ask-oma-widget.tsx`, `ask-oma-messages.tsx`, `ask-oma-composer.tsx`, `ask-oma-quick-prompts.tsx`, `ask-oma-recommendations.tsx`)
     - `commerce/` (`menu-product-card.tsx`, `menu-product-card-media.tsx`, `price-display.tsx`, `order-totals-summary.tsx`)
     - `content/` (`legal-policy-view.tsx`, `what-they-say-section.tsx`)
     - `feedback/` (`loading-state.tsx`, `empty-state.tsx`, `error-state.tsx`, `error-fallback-panel.tsx`, `confirm-dialog.tsx`)
     - `layout/` (`site-header.tsx`, `site-nav.tsx`, `site-footer.tsx`, `cart-badge.tsx`, `page-header.tsx`, `section-header.tsx`)
     - Utilitas lintas modul di root `common/`: `media-placeholder.tsx`, `structured-data-script.tsx`

### B. `src/app/**/_components/` (Lokal / Route-Specific)

Di Next.js App Router, folder yang diawali underscore (`_components`) **diabaikan oleh sistem routing** (tidak menjadi URL).

Digunakan untuk seluruh komponen yang **hanya dipakai oleh halaman/segmen route tersebut**, termasuk **semua `*-view.tsx`** dan subkomponen hasil pemecahannya.

**Aturan penempatan `_components/`:**

- **Root app:** `src/app/_components/` — komponen khusus root app (`demo-banner.tsx`).
- **Route spesifik (`*-view.tsx` & child components):**
  - `src/app/(site)/_components/` — halaman Home `/` (`home-view.tsx` dan 8 section komponennya)
  - `src/app/(site)/about/_components/` — `about-view.tsx`
  - `src/app/(site)/cart/_components/` — `cart-view.tsx`, `cart-item-card.tsx`, `cart-summary.tsx`, `cart-conflict-badge.tsx`, `cart-bundle-breakdown.tsx`
  - `src/app/(site)/checkout/_components/` — `checkout-view.tsx` dan subkomponen form/summary/quote
  - `src/app/(site)/classes/_components/` — `classes-view.tsx`, `class-program-card.tsx`
  - `src/app/(site)/classes/[slug]/_components/` — `class-detail-view.tsx`, `class-registration-panel.tsx`, dan subkomponen sesi/handoff
  - `src/app/(site)/contact/_components/` — `contact-view.tsx` dan subkomponen cabang/jam/helper WA
  - `src/app/(site)/faq/_components/` — `faq-view.tsx`
  - `src/app/(site)/menu/_components/` — `menu-view.tsx`, `menu-filter-panel.tsx`, `menu-pagination.tsx`, dll.
  - `src/app/(site)/menu/[slug]/_components/` — `product-detail-view.tsx`, `product-gallery.tsx`, `product-variant-picker.tsx`, `product-food-info.tsx`, `bundle-customizer.tsx`
  - `src/app/admin/login/_components/` — `admin-login-view.tsx`
  - `src/app/admin/reset-password/_components/` — `admin-reset-password-view.tsx`
  - `src/app/admin/(dashboard)/_components/` — `admin-shell.tsx`, `admin-forbidden-panel.tsx`, `admin-overview-view.tsx`, `admin-section-header.tsx`
  - `src/app/admin/(dashboard)/<modul>/_components/` — `admin-<modul>-view.tsx` beserta subkomponen dialog/card/form/section modul tersebut (untuk `products/new` dan `products/[id]/edit`, section bersama ditaruh di `products/_components/` sebagai `_components` terdekat yang menaungi keduanya; folder `_components/` murni berisi file `.tsx` sementara mapper/type/hook ditaruh di `src/utils/`, `src/types/`, `src/hooks/`).

**Kapan masuk `_components/` vs `src/components/common/`?**

- Masuk **nearest `_components/`** jika komponen hanya relevan untuk satu route atau satu segmen fitur (misal `CartItemCard`, `CheckoutQuoteReview`, `AdminCategoryFormDialog`).
- Masuk **`src/components/common/`** jika komponen dipakai oleh **2 atau lebih route/modul berbeda lintas segmen** (misal `MenuProductCard`, `PageHeader`, `ConfirmDialog`, `StatCard`, `WhatTheySaySection`).

---

## 4. Aturan Pemecahan & Reuse Komponen (_Frontend Component Reuse_)

Terapkan aturan ini setiap kali membuat atau mengubah kode frontend. Sebelum menulis JSX baru, periksa terlebih dahulu `_components` fitur terkait, `src/components/common/`, dan `src/components/ui/` apakah sudah ada komponen yang cocok.

1. **Pecah hingga bagian terkecil yang bermakna:**
   - Ekstrak UI yang berulang (termasuk pengulangan di dalam satu file yang sama: baris tabel/list, field form, body kartu, header halaman/section, kotak alert/empty/loading/error, tombol aksi, dialog konfirmasi) menjadi komponen kecil dengan satu tanggung jawab yang jelas.
   - Simpan markup, styling class, dan aturan render bersama di satu tempat.
2. **View (`*-view.tsx`) hanya untuk orkestrasi:**
   - `page.tsx` tetap tipis: membaca params/searchParams/data RSC awal lalu merender `*-view.tsx`.
   - `*-view.tsx` hanya menghubungkan data/hooks, state, dan menyusun komposisi komponen-komponen kecil. Hindari menaruh blok HTML/JSX panjang secara inline di dalam `*-view.tsx` jika blok tersebut mewakili sub-bagian UI yang bisa dipisah (seperti header halaman, item kartu, ringkasan, modal konfirmasi, atau form).
3. **Gunakan props bertipe (`interface`) dan `children`:**
   - Satu komponen visual utama per file, memakai named export, `interface <Name>Props`, dan `className?` + `cn(...)`.
   - Gunakan props bertipe untuk variasi (label, ikon, nilai, aksi) dan `children` untuk konten dari parent.
   - Untuk list seragam, lakukan `.map()` data ke komponen item dengan `key` stabil; hindari duplikasi blok kartu/baris secara manual.
4. **Jangan membuat abstraksi berlebihan untuk wrapper insidental:**
   - Jangan mengekstrak wrapper layout satu baris yang hanya dipakai sekali jika justru membuat kode parent lebih sulit diikuti.
5. **Jaga perilaku, aksesibilitas, dan batasan layer:**
   - Refactor wajib mempertahankan seluruh perilaku, atribut aksesibilitas (`role`, `aria-*`, `label`, fokus modal), loading/error/empty state, link cabang (`withBranch`), dan fallback data.
   - Tetap patuhi kontrak arsitektur: `Client UI → hook → browser service → lib/axios → BFF Route Handler → features/*.server.ts → Supabase`. Tidak ada `axios`, `fetch`, atau SDK Supabase langsung di UI/hook.

---

## 5. Checklist Cepat: "File Baru Harus Ditaruh di Mana?"

1. **Halaman baru (URL baru)?** → `src/app/<segmen>/<halaman>/page.tsx`
2. **View utama halaman (`*-view.tsx`)?** → `src/app/<segmen>/<halaman>/_components/<nama>-view.tsx`
3. **Subkomponen UI hanya untuk halaman/fitur itu?** → `src/app/<segmen>/<halaman>/_components/<nama>.tsx`
4. **Komponen UI dipakai bersama di dalam satu segmen parent (misal beberapa sub-route `products/*` atau `admin/(dashboard)/*`)?** → `_components/` terdekat milik parent bersama
5. **Komponen UI dipakai di 2+ halaman/modul berbeda?** → `src/components/common/<nama>.tsx`
6. **Komponen primitif UI dasar?** → `src/components/ui/<nama>.tsx`
7. **Panggil API baru?** → Tambah endpoint di `src/constants/endpoint.constant.ts`, service di `src/services/<modul>.service.ts`, hook di `src/hooks/use-<modul>.ts`
8. **Validasi schema baru?** → `src/validations/<modul>.schema.ts`
9. **Tipe data baru?** → `src/types/<modul>.ts`
10. **Fungsi murni format/kalkulasi?** → `src/utils/<nama>.ts`
11. **Konstanta / copy / route / query keys?** → `src/constants/<modul>.constant.ts`

---

## 6. Aturan Penamaan File & Simbol

- **Folder & File:** Gunakan `kebab-case` (contoh: `cart-item-card.tsx`, `page-header.tsx`, `use-cart.ts`, `cart.service.ts`).
- **Komponen React:** Gunakan `PascalCase` dan **named export** (`export function CartItemCard(...)`), bukan `default export` (kecuali konvensi file Next App Router seperti `page.tsx`, `layout.tsx`, `error.tsx`, `loading.tsx`, `not-found.tsx`).
- **Suffix Konsisten:**
  - View halaman: `*-view.tsx` (di `_components/`)
  - Service browser: `*.service.ts` (di `src/services/`)
  - Domain/repository server: `*.server.ts` (di `src/features/`)
  - Schema validasi Zod: `*.schema.ts` (di `src/validations/`)
  - Konstanta: `*.constant.ts` (di `src/constants/`)
  - Hook: `use-*.ts` (di `src/hooks/`)
  - Store Zustand: `*.store.ts` (di `src/stores/`)
