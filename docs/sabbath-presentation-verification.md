# Presentasi Sekolah Sabat

Buka Sekolah Sabat, pilih pelajaran, lalu tekan **Mode layar**. Presentasi dimulai dari judul pelajaran. Pilihan hari membuka halaman pertama hari tersebut. Panah, PageUp/PageDown, spasi, dan gestur geser memakai kontrol presentasi yang sudah ada.

Materi memakai hasil `getSabbathLessonDetail` yang sudah dimuat. API dan Apps Script tidak berubah. Paragraf pendek dipindahkan utuh jika memungkinkan; paragraf panjang dibagi berdasarkan ukuran ruang bacaan. Saat ukuran teks atau layar berubah, posisi dipertahankan berdasarkan hari, blok, dan kata awal halaman. Beberapa kata dari halaman sebelumnya dapat terlihat kembali agar tidak ada bagian yang terlewat.

Presentasi memakai palet, tema, logo, transisi, dan kontrol Galilea. Judul hari menjadi titik utama; serif dipakai untuk bacaan panjang, sedangkan label dan kontrol memakai tipografi situs. ENERGY 1 / RHYTHM 2 / MOTION 1: bacaan tenang, judul dan isi dibedakan jelas, transisi mengikuti pengaturan pengurangan gerakan situs.

## Verifikasi

- PASS: `npm run build` menghasilkan paket situs beserta modul, stylesheet, dan cache service worker yang diperbarui.
- PASS: `node tests/check-presentation.mjs` menjaga fungsi presentasi Alkitab dan Lagu Sion.
- PASS: `node tests/check-page-turn.mjs` menjaga animasi halaman Alkitab dan Lagu Sion.
- PASS: `npm run check:sabbath` menguji browser dengan respons API lokal sesuai kontrak backend. Tidak ada data uji yang dikirim ke server gereja.
- PASS: Seluruh teks dari bacaan panjang dibandingkan dengan gabungan slide, termasuk setelah perubahan ukuran teks, rasio layar, dan viewport.
- PASS: Native fullscreen, fallback penolakan fullscreen, pembuka, pilihan hari, bacaan kosong, navigasi keyboard, kontrol otomatis hilang, serta kembali ke dialog bacaan.
- PASS: Batas bacaan diuji pada desktop 1440×900, ponsel 390×844, lanskap 844×390, serta mode proyektor 16:9. Screenshot desktop dan ponsel diperiksa secara visual.
- PASS: Tema terang/gelap dan pilihan palet pink diuji; teks bacaan mengikuti warna foreground presentasi.
- PASS: Membuka ulang presentasi tidak meminta ulang detail pelajaran. Tidak ada error JavaScript selama pengujian browser.

## Pemeriksaan desain

- Hard Gate PASS: Kontrol mempunyai tindakan, label keyboard tersedia, bacaan kosong mempunyai pesan, dan pemeriksaan browser tidak menemukan teks melewati batas pada ukuran yang diuji.
- Purpose Gate PASS: Palet dan logo memakai identitas Galilea; serif membedakan bacaan, tanggal menandai posisi hari, panah memindahkan slide, dan kontrol memakai tampilan presentasi yang ada.
- Liveliness PASS: Judul menjadi fokus, jarak memisahkan tanggal/judul/isi, serta transisi mengikuti pengaturan gerakan situs. Tidak ada aset baru.
- Craftsmanship PASS: Isi mengikuti data pelajaran, ukuran halaman dihitung dari ruang yang tersedia, dan pergantian ukuran mempertahankan lokasi bacaan.

Pengujian ini mencakup kode lokal dan respons backend yang disimulasikan. Deployment produksi serta ketersediaan sumber Adventech saat runtime tidak diuji pada perubahan ini.
