# Fondasi visual Resep Oma Kueh — F05

Kontrak: PRD §5,16–17. Konsep tetap **Modern Old-Fashioned Bakery / Warm Nostalgic Editorial**. Ini fondasi komponen dan komposisi awal, bukan storefront final. Shell navigasi/cabang/footer adalah F06; konten Home adalah F07.

## Token dan tipografi aktual

Satu sumber warna hex adalah `src/app/globals.css`: cream sebagai canvas, burgundy untuk aksi, deep untuk teks/fokus, cocoa untuk teks pendamping, rose untuk bidang DEMO. Sand adalah separator dekoratif; input memakai control-border yang lebih kuat. Status selalu disertai teks/ikon, bukan warna saja. Warna masih perkiraan PRD, **belum logo-identical**.

`next/font/google` menyajikan font sendiri: Plus Jakarta Sans 400/500/600/700 untuk UI, Fraunces untuk heading editorial, Barlow Condensed 600 terbatas penanda campaign/DEMO. Tidak ada font BEM/Fina atau font pengganti logo.

Container maksimum 78rem, gutter 20/24/40px, section spacing fluid 48–112px, heading memakai clamp. Grid 2 kolom pada mobile, 1 di bawah 352px, 3 tablet dan 4 desktop; anak grid wajib min-width:0. Kontrol minimal 44px, form regular 48px; radius kartu/dialog 16px. Tidak ada animasi masuk global. Transisi warna button 160ms dimatikan pada reduced motion.

## API komponen yang tersedia

Impor langsung dari `src/components/ui/*`; tidak ada barrel server/client campuran. Semua visual menerima className + cn, props interface, named export.

| Komponen                  | Kontrak penggunaan                                                                                                                                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button / ActionLink       | Button untuk aksi, Link Next untuk navigasi; primary/secondary/ghost, sm/md/lg. Link juga text. Loading menonaktifkan aksi, aria-busy dan label; tidak mengirim toast.                                                                |
| Card / Badge              | Card article surface/cream; badge neutral/accent/success/danger. Status wajib teks yang menjelaskan.                                                                                                                                  |
| Input / Select / Textarea | Native semantics, ref React 19, regular/compact, disabled dan aria-invalid. Select mempertahankan keyboard native.                                                                                                                    |
| FormField                 | Render child dengan id, required, aria-invalid, aria-describedby; label/helper/error terhubung dan useId mencegah collision. Error bersifat alert. Validasi domain tetap milik fitur/hook berikutnya.                                 |
| Quantity                  | Controlled safe integer min/max, disable batas/disabled; label tiap tombol, output live polite. Tidak mengubah cart/stock.                                                                                                            |
| Feedback                  | info/success/error dengan ikon dan teks; announce opt-in. Tidak ada toast otomatis.                                                                                                                                                   |
| Dialog / Drawer           | Controlled open/onOpenChange, judul wajib, deskripsi opsional, initialFocusRef opsional. Native showModal menyediakan top layer/inert/fokus modal. Escape, close, backdrop; return fokus, scroll lock bertingkat dan cleanup unmount. |

`useModal` hanya efek browser. Tidak memakai aria-modal palsu, polling fokus, timeout, atau plugin modal. Consumer harus menjaga trigger tetap ada untuk return fokus dan menyediakan judul/aksi kontekstual. Native dialog perlu regression test browser saat target dukungan diperluas.

## Komposisi dan aset

Route `/` server menampilkan judul editorial, tautan catatan, dan bidang **DEMO** yang secara eksplisit bukan foto. Tidak ada katalog, harga, stok, cabang terpilih, cart, ataupun klaim bisnis baru. `tests/fixtures/ui` berjalan hanya lewat server Vite loopback milik Playwright; tidak disertakan sebagai route production/playground publik. Fixture menggunakan CSS/font hasil build Next sebenarnya.

Logo resmi, foto makanan/kelas asli berizin, serta sampling warna logo masih **release blocker**. Starter SVG Next tidak dipakai sebagai aset bakery. Tidak mengunduh Instagram, membuat foto sintetis sebagai produk, atau mengarang consent. Ketika aset disetujui, gunakan Next Image dengan ukuran/aspect ratio dan alt sesuai isi nyata.

## Verifikasi dan batas bukti

Kasus dan command aktual ada di `docs/implementation-status.md`: viewport 375/768/1280/1440, axe WCAG A/AA, keyboard, native modal, field errors, quantity, reduced motion dan 200% CSS zoom. CSS zoom Chromium menguji pembesaran/reflow otomatis; bukan bukti pengujian zoom OS, screen reader manusia, Safari/iOS atau Firefox. Screenshot lokal di test-results diabaikan Git agar artefak bukan sumber desain baru.
