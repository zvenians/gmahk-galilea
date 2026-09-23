# News System Final Audit

## Source Verification
PASS (Seluruh audit pada 7 blocker telah diterapkan secara langsung ke source code dan divalidasi).

## Client Sanitizer
PASS (Fungsi `cleanHtml` di `index.html` ditulis ulang menggunakan native DOM untuk membersihkan semua tags non-whitelist, merombak struktur ilegal, menolak atribut event, serta men-strip node dan content dari elemen `<script>`, `<style>`, `<iframe>`, `<object>`, `<embed>`, `<form>`).

## Server Sanitizer
PASS (Fungsi `gaSanitizeHtml_` di `Admin.gs` menggunakan whitelist sanitization untuk subset rich text. Tag script/style dihapus. Hanya `<p>`, `<strong>`, `<b>`, `<em>`, `<i>`, `<u>`, `<br>`, `<ul>`, `<ol>`, `<li>`, `<a>` yang lolos. Event handlers dan URL jahat ditolak).

## Primary Photo
PASS (Ekstraktor `PRIMARY:` beroperasi per payload array secara terisolasi via `gwActivityCover_` dan `gwActivityPhotos_`. Mendukung multi-berita tanpa state leakage. Jika kosong, fallback ke index 0 tetap aman).

## WhatsApp
PASS (`htmlToWaText` dipoles ulang untuk kompatibilitas lintas device maksimum: List bullet menggunakan standar `- ` untuk `<ul>` dan `1. ` untuk `<ol>`. Zero-width character `\u200B` atau null dibersihkan).

## Tests
Command `npm run check` benar-benar mengeksekusi `node tests/check-news.mjs` menggunakan runtime VM Node.js.
Output Aktual:
`OK - News System Overhaul Tests: 24/24 passed.`

## CI Root Cause & Fix
Error `exit code 1` sebelumnya di CI Ubuntu disebabkan oleh regex string extraction yang terpengaruh perbedaan LF/CRLF dan spasi indentasi. Ekstraksi kini menggunakan fungsi hitung kurung kurawal (`braceCount`) yang kebal terhadap *line-ending*. Step `npm ci` juga ditambahkan ke workflow agar *devDependencies* (JSDOM) dapat terinstall dengan aman.

## Node Runtime
GitHub Actions sekarang sepenuhnya menggunakan:
- `actions/checkout@v5`
- `actions/setup-node@v5`
- `Node.js 24`

Warning `Node.js 20 deprecated` pada workflow sebelumnya sudah ditangani. (Pembaruan ini tidak diklaim menghilangkan warning dependency minor lainnya, hanya mengatasi deprecated core runtime environment).

## GitHub Actions
Run ID: 35827405790
Job:
- Project & Contrast Checks: SUCCESS
- Apps Script Auto-Sync: SUCCESS

News regression:
24/24 PASS

## Apps Script
Deployment versi baru sukses di-push ke environment Apps Script:
- Admin @72
- API @73

*Catatan: Harap membedakan dengan build marker UI (seperti `GALILEA-ADMIN-PRO-47-0-0`). Deployment Apps Script adalah versi infrastruktur script yang di-push oleh CI (Admin @72 dan API @73).*

## Production Verification
NOT VERIFIED (belum ada manual browser verification terhadap production `/admin` dan belum ada full interactive news smoke test pada production).

## Final Status
PASS untuk source, automated regression tests, CI, dan Apps Script synchronization.
Production UI: NOT VERIFIED.
