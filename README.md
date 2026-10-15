# GMAHK Galilea

Website jemaat Galilea di Balikpapan untuk melihat jadwal pelayanan, membaca materi ibadah, mengikuti berita jemaat, dan menghubungi pengurus.

[Buka website](https://gmahk-galilea.vercel.app/) · [Portal pengurus](https://gmahk-galilea.vercel.app/admin)

## Fitur

- Jadwal terdekat, pembagian petugas, kalender, poster, dan PDF triwulan.
- Pusat ibadah serta mode layar untuk Alkitab, Lagu Sion, jadwal, dan pengumuman.
- Renungan pagi, pelajaran Sekolah Sabat, berita misi, dan bacaan persembahan.
- Berita jemaat dengan foto, video, audio, unduhan, dan tombol berbagi.
- Reels Instagram dengan tautan ke profil saat video tidak tersedia.
- Panduan kunjungan, kontak, dan permohonan pelayanan dengan pilihan privasi.
- Pencarian yang membuka berita atau pengumuman yang dipilih.
- Tema terang/gelap, pengaturan ukuran teks, gerakan, dan bahasa.
- Favorit serta cache bacaan di perangkat. Ketersediaan offline bergantung pada data yang sudah berhasil disimpan.

## Cara kerja

Viewer memakai HTML, CSS, dan JavaScript biasa. Vercel menjalankan endpoint pada direktori `api/`; Google Apps Script mengambil data dari Google Sheets dan menjalankan pengelolaan konten.

`GET /admin` mengarahkan pengurus ke deployment Apps Script yang memakai autentikasi Google. Operasi dengan nama `admin*` melalui `POST /api/admin` ditolak dengan HTTP 403. Pengaturan peran dan privasi berada di backend Apps Script.

Paket 525 Lagu Sion disimpan dengan masa cache tiga jam. Video siaran dan renungan memiliki kebijakan pembaruan tersendiri. Bagian video tambahan di beranda baru meminta data ketika dibuka; Reels memakai alur integrasi yang sudah ada.

## Struktur proyek

| Lokasi | Isi |
|---|---|
| `index.html` | Struktur halaman, metadata, navigasi, dan dialog |
| `viewer.css` | Gaya dasar viewer, pembaca, dan presentasi |
| `visitor-ui.css` | Gaya pengunjung, kontrol, dan layout responsif |
| `viewer.js` | Navigasi, render halaman, pencarian, dan interaksi viewer |
| `schedule-clock.js` | Penghitungan ulang jadwal berdasarkan waktu WITA |
| `hymnal-scores.js` / `.css` | Pencarian lirik dan PDF partitur |
| `page-turn.js` / `.css` | Transisi halaman dalam presentasi |
| `sw.js` | Cache halaman dan aset untuk penggunaan offline |
| `api/` | Endpoint Vercel untuk proxy, media, PDF, dan metadata berita |
| `apps-script-backend/` | Sumber backend dan portal pengurus Apps Script |
| `tests/` | Pemeriksaan integrasi, perilaku, dan browser |
| `docs/` | Catatan verifikasi serta panduan operasional |

## Menjalankan dan memeriksa

Gunakan Node.js 20 atau lebih baru.

```bash
npm ci
npm run check
```

`npm run check` memeriksa admin, media, sinkronisasi, jadwal, pembaca, cache, warna kontrol, serta endpoint admin produksi. Pemeriksaan endpoint produksi memerlukan koneksi internet.

Pengujian browser memakai data uji dan server lokal sementara; tidak mengirim permohonan pelayanan ke gereja.

```bash
npx playwright install chromium
npm run check:visitor
```

Untuk menjalankan seluruh endpoint secara lokal, hubungkan proyek Vercel yang sesuai dan jalankan:

```bash
npx vercel dev
```

Pratinjau HTML/CSS saja dapat memakai server statis. Endpoint `api/` tetap memerlukan runtime Vercel.

## Konfigurasi

Variabel berikut hanya berada di server:

| Variabel | Kegunaan |
|---|---|
| `GALILEA_APPS_SCRIPT_API_URL` | URL deployment API publik Apps Script |
| `GALILEA_APPS_SCRIPT_ADMIN_URL` | URL deployment portal pengurus Apps Script |
| `GALILEA_API_SECRET` | Rahasia komunikasi server dengan dispatcher Apps Script |

Gunakan URL deployment yang berakhir `/exec`. Jangan memasukkan rahasia ke viewer, dokumentasi, atau repository.

Identitas, jadwal, berita, dan sebagian besar konten dikelola melalui pengurus dan Google Sheets. Perubahan data tidak memerlukan deployment ulang viewer.

Panduan kunjungan mendukung informasi tambahan dari sheet **Website Setting**. Tambahkan baris dengan kolom `Bagian`, `Kunci`, `Isi Website`, dan `Petunjuk` sesuai struktur sheet. Isi hanya dengan informasi yang telah dikonfirmasi pengurus.

| Kunci opsional | Isi |
|---|---|
| `visitor_entrance_photo_url` | URL foto pintu masuk gereja yang sebenarnya |
| `visitor_parking` | Petunjuk masuk dan posisi parkir |
| `visitor_sabbath_classes` | Kelas Sekolah Sabat dan tempat berkumpul |
| `visitor_children` | Kelas anak dan fasilitas keluarga |
| `visitor_accessibility` | Kondisi akses kursi roda dan bantuan yang tersedia |
| `service_response_time` | Perkiraan waktu balasan yang telah disepakati tim pelayanan |

Jika kosong, halaman memberi penjelasan dan tombol untuk menghubungi pengurus. Foto `church_image_url` digunakan sebagai foto gereja bila foto pintu masuk belum disediakan.

## Deployment dan cache

Repository menggunakan integrasi Git dengan Vercel. Verifikasi commit yang diterbitkan dan URL produksi setelah perubahan masuk ke cabang produksi.

Saat mengubah `viewer.js`, `viewer.css`, `visitor-ui.css`, atau `appearance.css`, perbarui versi URL pada `index.html` dan daftar `SHELL` di `sw.js`, lalu naikkan versi `CACHE`. Versi yang sama pada HTML dan service worker mencegah aset yang tertinggal saat reload atau offline.

Vercel menjalankan `npm run build`. Build menyiapkan aset publik di `public-dist` dan gambar preview 1200 × 630. Hash HTML, CSS, JavaScript, dan aset menentukan URL gambar pada metadata OG, Twitter, dan schema. Warna gambar berasal dari palet resmi pada `appearance.css`; perubahan desain menghasilkan URL baru otomatis. Endpoint preview lama serta metadata berita wajib melakukan revalidasi. Preview berita memiliki versi berdasarkan isi berita, termasuk URL foto dan tanggal pembaruan. Aplikasi berbagi tetap mengendalikan cache preview yang sudah mereka simpan; website tidak dapat memaksa WhatsApp menghapus cache lama.

Jalankan `npm run build && node tests/check-social-preview.mjs` untuk memeriksa hasil build dan metadata. Jangan menyimpan hasil `public-dist` ke Git.

## Warna dan Layar Sambutan

Buka Menu → Alat → Tampilan untuk memilih hijau, merah, biru tua, coklat, ungu, teal, atau abu-abu. Mode Terang, Gelap, dan Sistem berlaku untuk semua palet. Pilihan tersimpan di perangkat, termasuk saat berpindah halaman atau membuka layar ibadah. Kontrol warna dan mode di fullscreen juga mengubah tampilan website.

Menu → Materi Ibadah → Layar Sambutan membuka kerangka fullscreen yang sama dengan Alkitab dan Lagu Sion. Berdasarkan waktu Balikpapan (WITA), Sabtu pukul 00.00 sampai sebelum Minggu 00.00 menampilkan “Selamat Hari Sabat”. Hari lain menampilkan “Selamat Datang”, termasuk Rabu mulai pukul 18.00. Semua sambutan disertai “Selamat berbakti di Jemaat Galilea.” Layar terbuka memeriksa pergantian hari setiap 15 detik dan ketika tab kembali aktif. Menu dapat dipakai dengan data tersimpan saat offline.

`npm run check:appearance` menguji tujuh palet, kedua mode, penyimpanan pilihan, kontras, ukuran layar, foto berita, pembaca fullscreen, proyektor, serta batas waktu sambutan. Pengujian ini membutuhkan Chromium seperti `check:visitor`.

Perubahan di `apps-script-backend/` memerlukan rilis Apps Script tersendiri. Push Git tidak mengganti deployment Apps Script yang aktif.

## Catatan pengujian

- [Verifikasi pembaruan pengunjung](docs/visitor-improvements-verification.md)
- [Verifikasi jadwal](docs/schedule-source-verification.md)
- [Verifikasi partitur](docs/hymnal-scores-verification.md)
- [Panduan pemasangan Vercel](docs/PANDUAN_PASANG_VERCEL.md)

Dokumen rilis lama tetap tersimpan di `docs/` untuk referensi versi sebelumnya.
