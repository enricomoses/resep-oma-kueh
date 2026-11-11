<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Git per fitur — Resep Oma Kueh

Instruksi owner pada 12 November 2026 mengizinkan commit lokal dan push ke GitHub secara otomatis per fitur. Aturan ini menggantikan ketentuan commit/push manual pada PRD dan execution guide; tidak perlu meminta izin ulang untuk setiap Fxx.

- Selesaikan hanya Fxx yang ditugaskan, jalankan gate yang relevan, review diff setelah format, dan perbarui bukti implementasi sebelum commit. Fitur dengan gate wajib FAIL/BLOCKED/NOT RUN belum boleh di-commit sebagai fitur selesai.
- Buat satu commit terpisah untuk setiap fitur yang selesai, termasuk kode, migration, tes, dan dokumentasi yang terkait. Gunakan pesan Conventional Commits dengan scope Fxx, misalnya `feat(F09): add branch-aware catalog` atau `chore(F01): configure project tooling`. Jangan menggabungkan beberapa fitur atau membuat empty commit.
- Periksa root bakery, branch aktif, staged diff, dan tujuan remote sebelum commit/push. Stage file atau hunk fitur secara selektif; jangan memakai `git add .` atau memasukkan perubahan pengguna yang tidak terkait. Jangan stage secret, isi env, credential fixture, PII, backup, atau artefak lokal. Jika perubahan dalam file yang sama tidak dapat dipisahkan dengan aman, laporkan blocker tanpa menimpa pekerjaan pengguna.
- Setelah commit fitur berhasil, push branch fitur tersebut ke remote GitHub bakery yang telah diverifikasi. Tidak perlu meminta izin ulang. Jangan force-push, amend commit yang sudah di-push, reset, mengubah remote, atau merge otomatis. Perbaikan sesudah commit dibuat sebagai commit tambahan dengan scope Fxx yang sama.
- Jika commit/push gagal karena autentikasi, remote, konflik, atau koneksi, laporkan tahap dan blocker yang sebenarnya; jangan mengklaim sudah tersimpan di GitHub. Laporan akhir menyertakan hash commit, branch, dan hasil push tanpa secret.
- Otorisasi ini hanya untuk commit/push fitur; deployment, pengiriman pesan, dan migration/reset database remote tetap memerlukan instruksi terkait. Perubahan aturan/dokumentasi di luar Fxx tidak otomatis dianggap implementasi fitur.
