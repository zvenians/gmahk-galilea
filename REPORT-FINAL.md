# REPORT-FINAL: News System Overhaul & Sync Verification

## VERIFICATION (Sync & Admin Production Issue)
1. **GitHub Main Sync**: Pekerjaan Admin Redesign (v46) sudah ada di `main`.
2. **Admin Deployment Version**: Marker build sekarang di-update menjadi `GALILEA-ADMIN-PRO-47-0-0`. Script GitHub Action akan mendeploy ini ke Google Apps Script dan API Vercel akan mengarah ke deployment baru ini. Deployment ID Google Apps Script tidak berubah.

---

## IMPLEMENTATION REPORT: News System Overhaul Bug Fixes
Sesuai audit, masalah utama berasal dari marker `PRIMARY:` yang hilang akibat fungsi sanitization `gwSafeUrl_` serta kurangnya server-side dan client-side sanitization yang aman.

### 1. Perbaikan Bug `PRIMARY:` Marker
- **Admin.gs**: Fungsi `gaSanitizePayload_` sekarang mendeteksi dan mengekstraksi tag `PRIMARY:` *sebelum* memvalidasi URL HTTPS. Marker dipasang kembali secara aman setelah validasi.
- **Website.gs**: `gwActivityCover_` dan `gwActivityPhotos_` membaca `PRIMARY:` dan dengan sempurna memilih cover dan menyusun daftar foto tanpa prefix untuk frontend.
- **index.html**: Logika slideshow (di `openActivity`) sudah secara otomatis memindahkan `coverUrl` ke index 0 dari array foto dan menghapus duplikasi.

### 2. Sanitization (XSS Prevention)
- **Admin.gs (Server-Side)**: Fungsi baru `gaSanitizeHtml_` menggunakan Regex untuk membuang tag `<script>`, `<style>`, `<iframe>`, serta *inline events* seperti `on*` dan `javascript:` secara ketat sebelum ditulis ke Google Sheets.
- **index.html (Client-Side)**: `cleanHtml` ditulis ulang menggunakan DOM Tree Walker yang aman (`document.createElement('div')`). Hanya `p, strong, b, em, i, u, br, ul, ol, li, a` yang diizinkan. Semua atribut berbahaya di-strip, URL wajib `https://`.
- **Bug Regex `<u[^>]*>`**: Ditemukan bug kritis di mana `/<u[^>]*>/gi` yang dimaksudkan untuk tag underline ternyata melakukan stripping terhadap tag `<ul>` (karena `l` bukan `>`). Diperbaiki menjadi `/<u\b[^>]*>/gi`.

### 3. WhatsApp Share Formatting
- **index.html**: `htmlToWaText` ditulis ulang total. 
- *List* (`<ul>`) sekarang secara native dirender sebagai karakter unicode murni `• ` (U+2022).
- *List* (`<ol>`) dirender menggunakan numbering iteratif `1. `, `2. `, dst.
- Teks menggunakan markdown WhatsApp murni (`*bold*`, `_italic_`).
- Tidak ada emoji dan footer promosi.

---

## AUTOMATED TEST CASES (SOURCE VERIFIED)
Uji coba otomasi baru telah ditambahkan ke `npm run check` (melalui eksekusi node `tests/check-news.mjs`). Skrip tersebut mengompilasi Apps Script backend dan `index.html` dalam V8 Virtual Machine (`vm`) untuk divalidasi. 

**TOTAL: PASS 9/9 Automated Regressions**

| Status | Test Case (SOURCE VERIFIED) | Deskripsi Bukti Uji Coba |
|:------:|:--------------------------|:-------------------------|
| ✅ PASS | `htmlToWaText - regression` | Memasukkan HTML kompleks dengan bold, italic, underline, ul, ol, dan anchor. Hasil validasi lolos dengan exact string text WA (`• `, `1. `, dsb). |
| ✅ PASS | `htmlToWaText - character safety` | Memasukkan HTML entities (`&amp;`, `&nbsp;`). Memastikan tag dilucuti dan karakter dirender tanpa cacat/spasi ganda. |
| ✅ PASS | `gaSanitizeHtml_ - XSS removal` | Menyuntikkan `<script>alert(1)</script>` dan `javascript:`. String bersih dari injeksi sebelum masuk ke database Sheet. |
| ✅ PASS | `gaSanitizeHtml_ - allowed tags preserved` | Validasi whitelisting HTML tags dasar (`<ul>`, `<li>`, `<strong>`, `<a>`). Tag lolos seleksi dengan aman. |
| ✅ PASS | `gaSanitizePayload_ - PRIMARY photo` | Menyuntikkan multi-url dengan salah satunya mengandung tag `PRIMARY:`. `Admin.gs` memproses string ini tanpa menghilangkan prefix (Bug lama terpecahkan). |
| ✅ PASS | `gwActivityCover_ - parses PRIMARY` | `Website.gs` mendeteksi prefix dan mengekstrak cover yang benar dari multi-foto. |
| ✅ PASS | `gwActivityPhotos_ - strips PRIMARY prefix` | Array foto yang masuk ke frontend divalidasi tidak akan memiliki teks "PRIMARY:". |
| ✅ PASS | `gwActivityCover_ - fallback to first` | Uji kompatibilitas jika tidak ada foto utama yang dipilih (seperti berita zaman dulu). |
| ✅ PASS | `Multiple News Thumbnails Simulation` | **Uji 3 Berita:** News A (`PRIMARY:` a2.jpg), News B (`PRIMARY:` b3.jpg), News C (`PRIMARY:` c1.jpg). Ketiga modul cover bekerja independen dan tidak conflict / saling timpa. |

---

## PRODUCTION UI VERIFIED: (NOT VERIFIED)
- Saya *belum* membuka web browser untuk melakukan verifikasi di UI live production.
- Saya *belum* menekan tombol share di perangkat iOS/Android.

## NEXT STEPS UNTUK ANDA
1. `git push` ini akan memicu GitHub Actions.
2. Silakan akses `/admin` di environment Live, buat sebuah Berita Jemaat riil menggunakan Rich Text dan 2 foto (pilih foto kedua sebagai Primary).
3. Bagikan berita tersebut melalui perangkat seluler untuk menguji pengalaman `htmlToWaText` secara empiris.
