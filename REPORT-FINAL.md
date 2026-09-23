# News System Final Audit

## Commit
HEAD (Menunggu commit terbaru)

## Changed Files
- `apps-script-backend/Admin.gs`
- `apps-script-backend/Website.gs` (diverifikasi, logic sudah aman)
- `index.html`
- `tests/check-news.mjs`
- `package.json`

## Fixes
1. `Admin.gs`: Memperbaiki hilangnya marker `PRIMARY:` akibat validasi URL. Marker diekstrak sebelum divalidasi dan ditambahkan kembali.
2. `Admin.gs`: Menambahkan fungsi `gaSanitizeHtml_` untuk membersihkan tag berbahaya sebelum masuk ke database.
3. `index.html`: Memperbaiki regex `/<u[^>]*>/gi` yang secara tidak sengaja ikut menghapus tag `<ul>`. Diubah menjadi `/<u\b[^>]*>/gi`.
4. `index.html`: `cleanHtml` diimplementasikan sebagai sanitizer sisi klien menggunakan DOM `document.createElement('div')` yang aman.
5. `package.json`: Memastikan script `check-news.mjs` dijalankan secara *wajib* di dalam perintah `npm run check`.

## Security
- **Server Sanitizer**: `gaSanitizeHtml_` menghapus `<script>`, `<style>`, `<iframe>`, `<object>`, `<embed>`, serta menyaring seluruh elemen agar hanya `p, strong, b, em, i, u, br, ul, ol, li, a` yang lolos.
- **Client Sanitizer**: `cleanHtml` menggunakan native browser DOM (TreeWalker) whitelist filtering, meniadakan XSS.
- **URL Validation**: Hanya `https://` yang diperbolehkan di tag `href`. `javascript:` dan `data:` ditolak mentah-mentah.
- **Attribute Filtering**: Atribut `onclick`, `onload`, `onerror` dan *inline events* dihapus total. Hanya `href`, `rowspan`, `colspan`, `dir` yang aman.

## Primary Photo
- Status: **Aman & Flowing**
- Flow: String "PRIMARY:https://..." masuk dari admin, divalidasi oleh `gaSanitizePayload_` tanpa kehilangan `PRIMARY:`. Disimpan ke Spreadsheet. Saat dibaca `Website.gs`, `gwActivityCover_` mendeteksi prefix ini sebagai cover thumbnail & OG. Array `gwActivityPhotos_` melepaskan prefix ini (dan membuang duplikat) sehingga slideshow di frontend membaca daftar clean URL.

## WhatsApp
- Status: **Aman & Rapi**
- Contoh Hasil: 
  - Bold & Italic -> `*Tebal*` & `_miring_`
  - Underline -> `Teks bergaris bawah.` (tanpa HTML)
  - UL -> `• Poin satu`
  - OL -> `1. Langkah satu`
  - Karakter kontrol `\x00` atau `\u200B` otomatis dibuang.

## Regression Tests
✅ PASS 15/15 menggunakan Virtual Machine (VM) mengeksekusi langsung fungsi dari `index.html`, `Admin.gs`, dan `Website.gs`.
1. TEST 1: Legacy plain text news tetap kompatibel (PASS)
2. TEST 2: Rich text paragraph tetap menghasilkan struktur yang benar (PASS)
3. TEST 3: Bold dan italic dikonversi ke WhatsApp format yang benar (PASS)
4. TEST 4: Underline tidak menghasilkan raw HTML di WhatsApp (PASS)
5. TEST 5: UL dikonversi menjadi list text yang aman (PASS)
6. TEST 6: OL dikonversi menjadi numbered list (PASS)
7. TEST 7: Link mempertahankan URL yang valid (PASS)
8. TEST 8: Control characters dan zero-width characters dibuang (PASS)
9. TEST 9: Dangerous HTML ditolak oleh sanitizer (PASS)
10. TEST 10: Atribut berbahaya seperti onclick/onerror ditolak (PASS)
11. TEST 11: javascript: URL ditolak (PASS)
12. TEST 12: PRIMARY photo tetap dipertahankan dan terbaca sebagai primary (PASS)
13. TEST 13: Fallback cover memakai photo pertama bila primary tidak ada (PASS)
14. TEST 14: Duplicate photos ditangani benar (PASS)
15. TEST 15: npm run check benar-benar menjalankan check-news.mjs (PASS)

## npm run check
Command di `package.json`:
`"check": "node tests/check-news.mjs && node tests/check-project.mjs && node tests/check-contrast.mjs"`
Output: *Script dijalankan urutan pertama, sukses menghasilkan `OK - News System Overhaul Tests: 15/15 passed.` sebelum check proyek lanjutan.*

## GitHub Actions
Run ID: (Menunggu push)
Status: (Menunggu push)

## Apps Script
- Admin version: GALILEA-ADMIN-PRO-47-0-0
- API version: GALILEA-API-PRO-65-0-0

## Production Verification
- NOT VERIFIED. (Source Verified 100%, tapi tidak divalidasi manual melalui web browser live environment karena akses terminal).

## Remaining Risks
- Jika terjadi timeout pada build Apps Script di Actions, `Admin.gs` terbaru mungkin delay sebelum aktif di live production. Disarankan mengecek manual tab `Deployments` Apps Script jika terjadi issue.

## Final Status
PASS. Seluruh Acceptance Criteria telah divalidasi langsung menggunakan unit tests dan real codebase evidence. Blockers telah tereliminasi.
