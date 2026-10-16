# Palet warna, 16 Oktober 2026

Arah dari pengguna: panel popover dua kolom, bulatan warna, nama Inggris, centang pilihan aktif, tutup setelah memilih atau klik di luar, gerakan halus, mengikuti tema. Berlaku di Pengaturan dan layar ibadah.

ENERGY 2 / RHYTHM 1 / MOTION 1. Daftar dibuat seragam agar warna mudah dibandingkan. Warna aktif menjadi fokus. Bulatan menggunakan warna yang sudah ada; nama dan centang memastikan pilihan tidak hanya dibedakan lewat warna. Font mengikuti antarmuka Galilea. Jarak dan target 44 px menjaga kenyamanan sentuh. Bayangan hanya menandai panel di atas konten. Transisi singkat memperjelas buka/tutup dan menghormati pengaturan gerakan.

## Bukti pengujian

- `npm run check`: lulus.
- `npm run build`: lulus, termasuk pemeriksaan ringkasan Sekolah Sabat.
- `npm run check:sabbath`: lulus, termasuk fullscreen, navigasi dan tampilan ponsel.
- `npm run check:appearance`: lulus untuk 13 warna, kontras kedua tema, penyimpanan pilihan, halaman pada lebar 320/390/768/1440, presentasi lagu/Alkitab, reset, serta mode sistem.
- `node tests/check-appearance.mjs --palette-only`: lulus pada 320×640, 844×390 dan 1440×900, kedua tema. Dijalankan kembali setelah merapikan perataan nama di fullscreen.
- Pemeriksaan gambar: panel Pengaturan 320 px, panel fullscreen 320 px gelap dan 844 px terang. Layar pendek menggunakan gulir vertikal, tanpa keluar dari viewport.
- Tombol warna membuka panel; pilihan mengubah tema dan menutup panel; fokus kembali ke tombol. Enter, tombol panah, Home/End, Escape, dan klik luar berfungsi. Escape menutup panel lebih dahulu, bukan jendela induk. Tidak ada error JavaScript browser.

## Delivery gate

- R-02 PASS: teks baru tanpa em dash.
- R-03 PASS: pemeriksaan batas viewport dan overflow pada ukuran ponsel, landscape, tablet, desktop.
- R-17 PASS: tidak menambahkan statistik.
- R-18 PASS: tidak menambahkan testimoni.
- R-23 PASS: menggunakan ikon dan warna yang sudah ada, sesuai persetujuan desain pengguna.
- R-24 PASS: tidak mengubah navigasi.
- R-25 PASS: kontras teks semua palet dan kedua tema diperiksa oleh pengujian appearance.
- R-26 PASS: pemilihan, reset, buka/tutup dan penyimpanan warna berfungsi.
- R-27 PASS: pilihan lokal selalu tersedia; fallback tetap Galilea Green.
- R-28 PASS: tidak menambahkan FAQ.
- R-32 PASS: keyboard, fokus terlihat, Escape dan pemulihan fokus diperiksa.
- R-33 PASS: perubahan ditulis langsung di berkas sumber.
- R-34 PASS: tema terang/gelap diuji.
- R-35 PASS: build, pengujian browser, pemeriksaan gambar dan alur klik tercatat di atas.
- R-36 PASS: tidak menambahkan klaim produk.
- R-37 PASS: mengikuti konsep popover yang disetujui pengguna.
- R-38 PASS: semua pilihan berasal dari palet aplikasi yang sudah ada.
- R-01 PASS: bulatan menunjukkan warna sebenarnya; tidak ada gradien baru.
- R-04 PASS: ikon centang untuk pilihan dan chevron untuk buka/tutup.
- R-06 PASS: memakai font antarmuka yang ada dengan nama singkat dan terbaca.
- R-07 PASS: tanpa pola latar baru.
- R-08 PASS: chevron hanya pada tombol pembuka panel.
- R-09 PASS: tanpa badge tambahan.
- R-10 PASS: tanpa efek kaca baru.
- R-12 PASS: bayangan hanya pada panel popover.
- R-13 PASS: tanpa glow.
- R-14 PASS: opsi berupa daftar warna, bukan kartu fitur.
- R-19 PASS: transisi 180 ms untuk buka/tutup; reduced motion diperiksa.
- R-22 PASS: tanpa ilustrasi tambahan.
- Liveliness PASS: dials, fokus warna aktif, jarak antarkolom, aksen dan motif bulatan mengikuti arah yang disetujui.
- C-1 PASS: alasan visual tercatat di atas.
- C-2 PASS: seluruh interaksi palet diperiksa lewat browser.
- C-3 PASS: panel hanya memuat pilihan warna yang diperlukan.
- C-4 PASS: diuji dengan keyboard, kedua tema dan beberapa ukuran viewport.
- C-5 PASS: bukti berasal dari pengujian dan gambar aktual.
- R-05 PASS: dua kolom sesuai daftar pilihan warna.
- R-11 PASS: radius panel, opsi, dan bulatan mengikuti fungsi masing-masing.
- R-15 PASS: tombol dan label menyebut tindakan pemilihan warna.
- R-16 PASS: tanpa jargon pemasaran.
- R-20 PASS: identitas warna Galilea dan font aplikasi dipertahankan.
- R-21 PASS: pilihan terang, gelap dan sistem tetap berfungsi.
- R-29 PASS: setiap tema tetap memakai satu keluarga warna; bulatan menjadi pratinjau alternatif.
- R-30 PASS: tidak meniru produk lain.
- R-31 PASS: alasan layout, warna, tipografi, jarak dan gerakan tercatat.

CI juga menjalankan pemeriksaan palet terarah sebelum penggabungan berikutnya.
