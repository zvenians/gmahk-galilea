# Pembaruan pengunjung, 14 Oktober 2026

## Perubahan

- HTML utama dipisahkan dari `viewer.css` dan `viewer.js`. Isi hasil pemindahan diperiksa sama persis sebelum perubahan fungsi dilakukan.
- Jadwal terdekat beserta tanggal dan jam muncul pada bagian pembuka beranda.
- Navigasi dikelompokkan menjadi akses cepat, Informasi Gereja, Materi Ibadah, dan Pelayanan.
- Label jadwal doa diganti menjadi Ibadah Rabu Malam. Jenis layanan Permohonan Doa tetap tersedia pada formulir.
- Pencarian lokal tersedia lebih dahulu dan membuka ID berita atau pengumuman yang dipilih. Hasil lokal tetap dapat dipakai ketika pencarian tambahan gagal.
- Permohonan pelayanan menampilkan nomor, langkah berikutnya, dan tautan WhatsApp untuk menanyakan tindak lanjut. Pengiriman ganda diabaikan; isi formulir tetap tersedia saat gagal.
- Panduan kunjungan menyediakan tempat untuk foto dan informasi yang dikonfirmasi pengurus. Informasi yang belum tersedia dijelaskan tanpa mengarang kondisi fasilitas.
- Video tambahan serta tema tahunan baru dimuat ketika bagian masing-masing dibuka. Reels memakai endpoint dan fungsi yang sama.
- Kartu berita, galeri, pengumuman, kontak, dan formulir menyesuaikan teks panjang serta jumlah konten. Foto yang gagal dimuat mendapat pesan pengganti.
- Service worker menyimpan aset baru, membatasi cache navigasi ke viewer, dan mengabaikan admin serta halaman berita server.
- README menjelaskan autentikasi admin yang berlaku dan membedakan rilis Vercel dari rilis Apps Script.

## Arah visual

Halaman informasi gereja untuk jemaat dan pengunjung baru, memakai hijau Galilea, gading, serta emas sebagai penanda tindakan dan informasi ibadah. ENERGY 2 / RHYTHM 2 / MOTION 2.

| Keputusan | Alasan |
|---|---|
| Hijau pada pembuka dan footer | Menjaga identitas Galilea dan membedakan pengantar dari bacaan |
| Jadwal dalam panel pembuka | Pengunjung segera menemukan waktu ibadah |
| Berita dengan foto dari pengurus | Menampilkan kehidupan jemaat melalui konten yang benar-benar diterbitkan |
| Radius tombol 12 px dan kartu 22 px | Membedakan kontrol dari wadah konten |
| Bayangan pada foto pembuka dan Reels | Memberi kedalaman pada konten visual utama |
| Kartu berita dapat bertambah tinggi | Judul panjang tetap terbaca tanpa menutupi tombol |
| Jarak mengikuti lebar layar | Ponsel mendapat susunan yang lebih padat, desktop tetap memiliki ruang baca |
| Gerakan singkat saat masuk dan berinteraksi | Memberi umpan balik tanpa menunggu efek blur; mode kurangi gerakan tetap tersedia |

## Bukti tampilan

Pratinjau memakai data publik dari website. Foto berita diambil dari URL yang diterbitkan backend.

- [Desktop](visitor-immersive-desktop.png)
- [Ponsel](visitor-immersive-mobile.png)
- [Panduan kunjungan](visitor-immersive-guide.png)

## Pengujian

`npm run check` memeriksa integrasi admin, media, jadwal, pustaka lagu, pembaca, presentasi, cache, kontrol warna, dan endpoint admin produksi.

`npm run check:visitor` memakai Chromium serta data uji. Permohonan pelayanan tidak dikirim ke server gereja.

| Alur | Hasil |
|---|---|
| Beranda | PASS: tanggal dan jam muncul di panel pembuka |
| Video tambahan | PASS: tidak ada permintaan video ketika bagian tertutup; membuka bagian memuat data |
| Pencarian berita | PASS: hasil API lama yang tidak memiliki ID tetap membuka berita yang benar |
| Pencarian pengumuman | PASS: membuka isi item yang dipilih |
| Pencarian saat server gagal | PASS: hasil lokal tetap dapat dibuka |
| Dialog | PASS: Escape menutup pembaca dan pencarian |
| Formulir kosong | PASS: validasi mencegah permintaan ke server |
| Pengiriman ganda | PASS: dua submit berdekatan menghasilkan satu permintaan |
| Formulir berhasil | PASS: nomor permohonan dan tautan tindak lanjut ditampilkan |
| Formulir gagal | PASS: isian dipertahankan dan tombol dapat dipakai kembali |
| Layout | PASS: 100 kombinasi, yaitu 10 halaman pada 320, 390, 768, 1024, dan 1440 px dalam dua tema |
| Jumlah konten | PASS: 0, 1, 2, 3, dan 25 item pada berita, galeri, pengumuman, dan beranda |
| Teks panjang | PASS: judul, alamat, nama petugas, dan caption tidak membuat halaman bergeser horizontal |
| Ukuran tulisan | PASS: pengaturan tulisan terbesar pada 320 px di panduan, layanan, dan berita |
| Menu ponsel | PASS: membuka menu, memilih panduan, dan menutup menu setelah navigasi |
| Mode offline | PASS: service worker menyimpan CSS/JS terpisah; reload dan pembukaan berita tersimpan berfungsi |
| Console browser | PASS: tidak ada exception pada alur yang diuji |

## Delivery gate antislop

Gate ini mencatat perubahan dalam rilis ini. Isi bacaan dan konten yang dikelola pengurus tetap mengikuti sumbernya.

- R-02 PASS: teks baru memakai kalimat sederhana dan tanda baca biasa.
- R-03 PASS: pemeriksaan layout lima lebar layar dan dua tema tidak menemukan overflow horizontal.
- R-17, R-18 PASS: tidak ada angka penggunaan, testimoni, atau identitas fiktif pada viewer.
- R-23, R-24 PASS: navigasi mengikuti perbaikan yang diminta; tujuan berasal dari route yang sudah ada.
- R-25 PASS: pasangan warna kontrol diuji dengan perhitungan rasio; panel baru memakai pasangan hijau/gading yang terverifikasi.
- R-26 PASS: pencarian, menu, dialog, tombol baca, dan form diuji melalui browser; kontrol presentasi tetap melewati suite yang ada.
- R-27 PASS: hasil kosong, pemuatan, pencarian gagal, form gagal, foto tidak tersedia, dan fallback Reels mempunyai penjelasan.
- R-28 PASS: FAQ menggunakan pertanyaan dari data gereja.
- R-32 PASS: dialog menerima Escape; fokus kontrol terlihat; slide media yang tidak aktif memakai `inert`.
- R-33 PASS: perubahan UI ditulis pada sumber. Skrip pemindahan hanya mengekstrak blok yang sama tanpa mengubah isinya.
- R-34, R-35 PASS: kedua tema dijalankan; hasil browser dan suite integrasi dicatat di atas.
- R-36, R-38 PASS: informasi fasilitas dan waktu balasan yang belum disepakati tidak dibuat-buat.
- R-37 PASS: arah visual berasal dari permintaan pengguna dan identitas website yang sudah ada.
- R-01, R-04, R-06, R-07, R-08, R-09 PASS: warna, ikon, tipografi, motif, dan penanda mengikuti identitas dan fungsi informasi gereja.
- R-10, R-12, R-13, R-14, R-19, R-22 PASS: kedalaman dan gerakan dibatasi pada tujuan yang dicatat; tidak ada aset ilustrasi tambahan.
- Liveliness PASS: pembuka menjadi fokus, susunan materi berbeda menurut kebutuhan, ruang baca serta aksen menjaga hierarki.
- C-1 sampai C-5 PASS: keputusan memiliki alasan, alur perubahan berfungsi, konten berasal dari data nyata, dan keadaan gagal diuji.
- R-05, R-11, R-15, R-16, R-20, R-21, R-29, R-30, R-31 PASS: susunan mengikuti kebutuhan gereja, tombol menyebut tindakan, dan identitas memakai warna serta aset Galilea.

## Batas informasi

Data publik yang diperiksa belum menyertakan foto pintu masuk, detail parkir, kelas anak, kondisi kursi roda, atau waktu balasan yang disepakati. Viewer siap menampilkannya melalui kunci opsional yang tercantum pada README. Sementara itu pengunjung mendapat tombol untuk menghubungi pengurus.

Pemecahan HTML mengurangi ukuran dokumen utama dari 683.981 byte menjadi sekitar 27 KB. Angka ini tidak berarti seluruh transfer awal berkurang sebesar itu: CSS dan JavaScript tetap diperlukan saat kunjungan pertama, lalu dapat disimpan secara terpisah.
