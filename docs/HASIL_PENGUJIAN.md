# Hasil Pengujian Galilea Creative Cinema V17.1.0

Tanggal pemeriksaan: 27 Agustus 2026 (Asia/Makassar)

## Lulus

- Viewer memakai build `GALILEA-CREATIVE-CINEMA-17-1-0` dan namespace cache V17.
- JavaScript `index.html`, proxy API, route admin, dan generator PDF berhasil diparse.
- 20 fungsi viewer terhubung ke allowlist Vercel dan dispatcher Apps Script.
- Proxy menolak nama fungsi di luar allowlist dan tidak membocorkan secret ke browser.
- Menu layar penuh per kategori, dialog pembaca, kegiatan, galeri foto, share, dan mode tampilan tetap terhubung melalui event delegation.
- Kegiatan mendukung daftar URL foto, upload beberapa gambar, cover otomatis, detail penuh, dan maksimal 12 foto.
- Migrasi sheet Kegiatan mempertahankan data lama lalu menambahkan kolom `Foto URL` dan `Admin ID` secara aman.
- Renungan Pagi tidak memakai video: bacaan dicocokkan dengan tanggal WITA dan tombol WhatsApp memakai seluruh isi bacaan.
- Cache bootstrap dan spreadsheet diturunkan menjadi 60 detik; cache renungan memakai tanggal sebagai kunci.
- Konfigurasi Vercel, manifest, route `/admin`, metadata Open Graph, serta PDF triwulan valid.
- CSS V17 memuat aturan desktop, tablet, mobile, dark mode, light mode, reduced motion, dan loader sanctuary opening.
- Sembilan pasangan warna utama lulus rasio kontras minimal 4.5:1; hasil terendah adalah 5.20:1 untuk teks samar mode terang.

## Catatan pengujian produksi

Koneksi nyata ke spreadsheet, API Advent, YouTube, Google Drive, login admin, serta deployment Vercel diuji kembali setelah kandidat V17 aktif sebagai preview dan sebelum domain utama dialihkan.
