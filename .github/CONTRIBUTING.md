# Panduan kontribusi

## Prinsip kerja
- Lakukan perubahan kecil dengan alasan dan lingkup yang jelas.
- Gunakan struktur HTML semantik, CSS konsisten, serta JavaScript yang mudah ditelusuri.
- Utamakan keterbacaan, akses keyboard, fokus yang terlihat, kontras, dan tampilan ponsel.
- Hormati preferensi pengurangan gerakan dan pastikan halaman tetap dapat digunakan tanpa animasi.
- Sediakan keadaan memuat, kosong, gagal, dan berhasil untuk alur yang relevan.
- Jangan menambahkan konten jemaat, statistik, gambar, atau klaim yang belum terverifikasi.
- Jangan memasukkan data pribadi jemaat, kredensial, maupun kunci API ke Git.

## Pemeriksaan
Gunakan Node.js versi 20 atau lebih baru.

```sh
npm ci
npm run check
npm run build
```

Untuk perubahan tampilan pengunjung, jalankan juga `npm run check:visitor` setelah memasang Chromium Playwright. Periksa tampilan pada layar kecil, navigasi keyboard, dan mode gerakan dikurangi. Jelaskan pemeriksaan yang tidak dapat dilakukan.

## Review dan rilis
Gunakan branch terpisah dan pull request. Sertakan perubahan, dampak terhadap halaman pengunjung/admin, bukti pemeriksaan, dan risiko. Perubahan cache pada `viewer.js` atau CSS perlu mengikuti aturan versi di README. Rilis Apps Script dan Vercel adalah proses yang terpisah; jangan menganggap push kode otomatis memperbarui keduanya.
