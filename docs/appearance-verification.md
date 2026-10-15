# Verifikasi warna, sambutan, dan thumbnail

## Revisi navbar dan sambutan, 15 Oktober 2026

Cakupan setelah `1bbb9b7`: menu menyatu dengan navbar, kisi pilihan warna, penekanan nama jemaat, dan panel fullscreen yang masih hijau.

- Menu sekarang berada dalam satu bingkai navbar dan membuka ke bawah. Lebar dan tepinya sama dengan baris navbar; isi menu dapat digulir tanpa melepas bingkai. Menu tertutup memakai `inert` dan `aria-hidden`, dan animasi menghormati preferensi kurangi gerakan.
- Pengaturan dan pemilih fullscreen menampilkan 13 kartu palet dengan contoh nuansa gelap, utama, dan terang. Pemilih fullscreen tetap diawali tombol tulisan tanpa latar. Escape menutup pilihan warna terlebih dahulu, lalu fullscreen pada penekanan berikutnya.
- Sambutan memakai satu baris salam, pengantar kecil, dan nama **Jemaat Galilea** dalam serif tebal dengan ukuran terbesar. Tata letak ponsel, desktop, dan proyektor tetap diuji.
- Panel Pengingat Ibadah, informasi koneksi, bidang jadwal, dan hitung mundur memakai token warna layar. Semua slide ringkasan jadwal diperiksa dalam coklat terang dan gelap; tidak ada latar hijau tetap yang tersisa pada panel tersebut.

Hasil: `check:appearance`, `check:visitor` (100 kombinasi), pemeriksaan proyek/presentasi, build, dan preview sosial lulus. Pemeriksaan tambahan memverifikasi pertemuan tepi navbar/menu, popover warna, Escape, dan seluruh slide jadwal. Tampilan menu desktop/ponsel, kisi warna, sambutan, serta panel pengingat dirender dan diperiksa. Versi preview desain: `601a961d7d4c5a66`.

Delivery Gate untuk cakupan revisi: R-03/R-06/R-14 PASS (hierarki dan empat lebar); R-10/R-11/R-29 PASS (kartu palet konsisten); R-19/R-32 PASS (gerakan terbatas, fokus dan Escape); R-21/R-25/R-34 PASS (terang/gelap dan kontras); R-26/R-27/R-35 PASS (alur dijalankan di browser); R-33 PASS (perubahan sumber melalui patch). ENERGY 2 / RHYTHM 2 / MOTION 2 tetap; nama jemaat menjadi fokus sambutan. Gate sebelumnya berlaku untuk bagian yang tidak berubah.

## Pembaruan 15 Oktober 2026

Cakupan setelah `1318bad`: tipografi sambutan, pengingat perangkat, kontrol fullscreen, dan konsistensi palet. Seluruh 133 file terlacak masih tersedia saat pemeriksaan awal; perubahan pengunjung dan thumbnail sebelumnya dipertahankan.

- Sambutan memakai serif Georgia dengan kata pembuka miring, judul utama, nama jemaat, tanggal, dan pengingat: “Mohon senyapkan ponsel dan perangkat elektronik selama ibadah.” Pengingat berlaku setiap hari dan tetap terlihat ketika kontrol menghilang.
- Palet bertambah menjadi 13: hijau, merah, biru tua, coklat, ungu, teal, abu-abu, pink, oranye, emas, zaitun, biru langit, dan nila. Setiap palet memiliki mode terang dan gelap.
- Pemilih warna fullscreen memakai tulisan tanpa kotak latar. Kontrol menghilang setelah 4 detik tanpa interaksi pointer, muncul kembali ketika disentuh/digerakkan, dan mempertahankan fokus pengguna keyboard. Pemilih native yang masih terbuka tidak disembunyikan.
- Warna tetap pada overlay pembaca Lagu Sion, kutipan beranda, label menu, footer, kartu gereja, dan panel presentasi diganti dengan token palet. Kartu terang di dalam bagian gelap memiliki warna teks sendiri agar tetap terbaca.
- Bingkai sambutan 16:9 menggunakan ukuran relatif terhadap bingkai, termasuk pratinjau proyektor pada ponsel. Judul dan pengingat tidak keluar dari bingkai.

Pengujian `check:appearance` lulus untuk 13 palet × 2 mode, persistensi, reset, Sistem, kontras, empat lebar layar (320/390/768/1440), pembaca Lagu Sion, Alkitab, auto-hide pointer, fokus keyboard, pergantian Sabat WITA, serta batas teks proyektor ponsel. Audit permukaan pada 19 menu dan footer tidak menemukan latar hijau lama ketika biru tua aktif. Warna logo, identitas layanan WhatsApp, dan contoh warna identitas pada halaman Tentang Website dipertahankan.

`npm run check` dan `check:visitor` lulus selama pengerjaan; alur pengunjung mencakup 100 kombinasi halaman/mode/lebar, formulir, pencarian, dan offline. Setelah perbaikan akhir, build, pemeriksaan preview sosial, proyek, dan presentasi kembali lulus. Preview tautan memakai versi desain `0cc31cb2339af514`. Cache aplikasi penerima tautan tetap di luar kendali website.

### Delivery Gate tambahan

Gate sebelumnya tetap berlaku pada bagian yang tidak diubah. Arah tetap ENERGY 2 / RHYTHM 2 / MOTION 2, dengan fokus pada keterbacaan saat ibadah.

| Item terkait | Hasil pemeriksaan pada perubahan ini |
|---|---|
| R-03, R-06, R-14 | PASS: hierarki serif sambutan, tata letak ponsel, desktop, dan bingkai proyektor diperiksa setelah render |
| R-10, R-11 | PASS: pemilih warna fullscreen transparan; area sentuh dan penanda fokus tetap tersedia |
| R-15, R-16 | PASS: pengingat perangkat memakai bahasa langsung dan sopan untuk seluruh hari |
| R-19, R-32 | PASS: kontrol pointer otomatis menghilang; navigasi keyboard mempertahankan fokus; pengingat tetap tampil |
| R-21, R-25, R-29, R-34 | PASS: 13 skala warna, kontras teks/kontrol ≥ 4,5:1, judul sambutan ≥ 7:1, mode terang/gelap/Sistem diuji |
| R-26, R-27, R-35 | PASS: perubahan palet, mode, proyektor, keluar layar, persistensi, dan regresi pengunjung dijalankan di browser |
| R-33 | PASS: sumber UI diubah melalui patch; script build hanya menghasilkan aset publik |
| Liveliness, C-1–C-5 | PASS: hierarki sambutan menjadi fokus; warna dan kontrol memiliki fungsi; tidak menambah konten pengisi; data uji tidak diterbitkan |

---

14 Oktober 2026. Cakupan: perubahan setelah commit `5ea6545`, tanpa mengulang perbaikan pengunjung yang sudah diterbitkan.

## Hasil

- Thumbnail berita memakai area foto terpisah dari judul dan ringkasan. Tiga foto berita publik asli berhasil dimuat pada lebar 1440 dan 390 px, masing-masing memiliki lebar intrinsik 800 px. Foto tidak ditutup panel teks.
- Tujuh palet berlaku pada token halaman, navbar, kontrol, tulisan, panel gelap, dan fullscreen. Mode terang/gelap, pilihan Sistem, reset, status pilihan, dan penyimpanan perangkat diperiksa.
- Menu Layar Sambutan memakai dialog presentasi, kontrol ukuran teks, proyektor, fullscreen, dan mekanisme keluar yang sudah tersedia. Aturan waktu memakai `Asia/Makassar`.
- Sambutan Sabat berlaku Sabtu 00.00 sampai sebelum Minggu 00.00 WITA. Rabu mulai 18.00 dan hari lainnya memakai Selamat Datang. Peralihan saat layar tetap terbuka diuji melewati tengah malam WITA.
- Build membuat PNG preview dan mengubah metadata hasil build menggunakan hash desain. Warna preview membaca palet resmi CSS. Metadata berita memberi versi gambar berdasarkan konten berita. Tidak ada cache setahun pada endpoint preview.
- Pemeriksaan produksi menemukan respons kosong dari adapter streaming endpoint preview lama. Endpoint tersebut diperbaiki untuk mengirim PNG hasil build sebagai buffer dengan panjang respons yang eksplisit; GET, HEAD, dan metode yang ditolak diuji.
- Preview berita asli menghasilkan PNG yang valid. Header cache renderer dinormalisasi menjadi huruf kecil agar mengganti default `immutable`, bukan menambahkan kebijakan cache yang bertentangan.
- Tema pribadi tersimpan pada perangkat; preview tautan umum mengikuti desain resmi yang diterbitkan. Cache aplikasi penerima tidak dapat dipaksa diperbarui oleh website.

## Pengujian yang dijalankan

| Pemeriksaan | Bukti |
|---|---|
| Regresi proyek | `npm run check` lulus: admin, media, pembaca, sinkronisasi, cache, jadwal, kontras, dan endpoint admin produksi |
| Alur pengunjung | `npm run check:visitor` lulus: 100 kombinasi halaman/mode/lebar, formulir, pencarian, konten kosong/panjang, teks terbesar, menu, dan offline |
| Warna dan sambutan | `npm run check:appearance` lulus: 7 palet × 2 mode, kontras normal ≥ 4,5:1 dan judul sambutan ≥ 7:1, persistensi, reset, Sistem, 4 lebar, mode layar Alkitab/Lagu Sion, proyektor, fokus keyboard, dan pergantian Sabat |
| Preview tautan | `npm run build && node tests/check-social-preview.mjs` lulus: PNG 1200 × 630, empat metadata memakai versi desain yang sama, revalidasi, perubahan foto berita menghasilkan URL baru |
| Foto publik | Pemeriksaan browser lokal menggunakan data publik `getWebsiteData`; tiga JPEG asli tampil, area foto berakhir sebelum panel teks; tidak ada pengiriman data ke gereja |
| Pemeriksaan visual | Pengaturan 390 px, sambutan 320/390 px, Alkitab gelap, Lagu Sion terang, berita asli desktop/ponsel, dan PNG preview dilihat setelah render |

Chromium pengujian dipilih melalui `PLAYWRIGHT_CHROMIUM_EXECUTABLE`. Fixture hanya digunakan pada pengujian otomatis; data uji tidak diterbitkan ke halaman website.

## Delivery Gate antislop

Arah mengikuti halaman jemaat yang sudah ada: foto tetap menjadi bukti kegiatan, pilihan warna memberi kendali pengguna, dan sambutan menjadi fokus tunggal layar ibadah. ENERGY 2 / RHYTHM 2 / MOTION 2. Lingkup gate ini hanya bagian yang ditambah atau diubah.

| Item | Status dan bukti |
|---|---|
| R-01 | PASS: lapisan gradasi fullscreen menyesuaikan palet sambil menjaga keterbacaan di atas latar ibadah yang sudah ada |
| R-02 | PASS: teks UI baru memakai kalimat sederhana tanpa em dash |
| R-03 | PASS: alur pengunjung dan tema diuji tanpa overflow pada lebar 320, 390, 768, dan desktop |
| R-04 | PASS: ikon gereja mewakili sambutan; centang menandai warna aktif; ikon lama dipertahankan |
| R-05 | PASS: susunan halaman lama dipertahankan; foto dan teks berita dipisahkan sesuai kebutuhan konten |
| R-06 | PASS: tipografi website dipertahankan; ukuran sambutan besar untuk dibaca saat ibadah |
| R-07 | PASS: tidak menambah pola grid atau blueprint |
| R-08 | PASS: tidak menambah panah dekoratif pada pemilih warna |
| R-09 | PASS: tidak menambah badge promosi; status hanya menunjukkan pilihan aktif |
| R-10 | PASS: panel pemilih warna dan toolbar memakai permukaan berwarna solid |
| R-11 | PASS: swatch bulat membedakan warna, tombol pilihan beradius 10 px, kontrol layar mengikuti sistem lama |
| R-12 | PASS: elevasi singkat pada hover kartu menunjukkan bahwa kartu dapat dibuka |
| R-13 | PASS: tidak menambah glow |
| R-14 | PASS: pilihan warna setara memakai ukuran sama; berita utama mempertahankan hierarki lama |
| R-15 | PASS: label “Kembali ke Hijau Galilea”, “Warna layar”, dan “Layar Sambutan” menyebut tindakan atau fungsi |
| R-16 | PASS: copy menyebut warna, perangkat, halaman, dan ibadah secara langsung |
| R-17 | PASS: tidak menambah statistik publik |
| R-18 | PASS: tidak menambah testimonial atau identitas rekaan |
| R-19 | PASS: hover 180 ms hanya pada perangkat yang mendukung hover; pilihan kurangi gerakan tetap dihormati |
| R-20 | PASS: identitas memakai logo resmi dan struktur halaman Galilea yang sudah tersedia |
| R-21 | PASS: mode gelap diuji pada tujuh palet, halaman, dan fullscreen dengan teks tetap terbaca |
| R-22 | PASS: tidak menambah ilustrasi generik |
| R-23 | PASS: menu, tema, dan pembaruan preview diminta pengguna; logo dan foto menggunakan sumber yang sudah diterbitkan |
| R-24 | PASS: menu baru membuka dialog sambutan; navigasi halaman lama lulus pengujian |
| R-25 | PASS: warna teks/kontrol diperiksa pada tujuh palet dan kedua mode; teks sambutan diperiksa terhadap latarnya |
| R-26 | PASS: pemilih warna, mode, reset, proyektor, dan keluar fullscreen benar-benar dijalankan di browser |
| R-27 | PASS: state kosong, loading, error, dan offline lama tetap lulus regresi pengunjung |
| R-28 | PASS: tidak menambah atau mengubah FAQ |
| R-29 | PASS: setiap palet memiliki skala terang sampai gelap; pilihan warna mengikuti permintaan pengguna dan diuji kontrasnya |
| R-30 | PASS: komposisi melanjutkan website Galilea; tidak menyalin desain produk lain |
| R-31 | PASS: fungsi baru memakai nama sesuai tugas; tidak menambah komentar dekoratif atau narasi per baris |
| R-32 | PASS: pilihan native select menerima keyboard; auto-hide tidak mengambil fokus; Escape menutup dialog |
| R-33 | PASS: perubahan UI/CSS ditulis langsung melalui patch; build hanya menyiapkan aset publik dan metadata preview, tidak menulis ulang sumber UI |
| R-34 | PASS: terang/gelap berlaku pada ketujuh palet serta fullscreen; Sistem mengikuti perubahan preferensi OS |
| R-35 | PASS: build dan tiga rangkaian pemeriksaan dijalankan; pembaca, menu, dan kontrol baru diperiksa di browser tanpa exception |
| R-36 | PASS: tidak menambah klaim pelanggan, performa, keamanan, atau kepatuhan |
| R-37 | PASS: arah melanjutkan gaya Galilea, dengan palet dan sambutan sesuai permintaan pengguna; dial tetap 2/2/2 |
| R-38 | PASS: foto valid berasal dari berita publik; fixture pengujian diberi penanda uji dan tidak dipakai dalam build publik |
| Liveliness: dials | PASS: ENERGY 2 / RHYTHM 2 / MOTION 2, dengan feedback singkat dan tanpa animasi otomatis tambahan |
| Liveliness: konsistensi | PASS: bentuk kontrol, skala huruf, dan hierarki halaman lama dipertahankan |
| Liveliness: fokus | PASS: swatch aktif menjadi fokus pengaturan; pesan sambutan menjadi fokus fullscreen |
| Liveliness: ruang | PASS: ruang memisahkan pilihan, pratinjau, dan pengaturan mode; sambutan dipusatkan dalam area layar |
| Liveliness: aksen | PASS: warna aktif menjadi aksen; foto dan logo tidak dikenai filter warna |
| Liveliness: identitas | PASS: logo resmi, nama Galilea, dan motif latar ibadah tetap dipakai |
| Liveliness: design read | PASS: arah visual pengunjung yang sudah disepakati dilanjutkan pada pengaturan dan layar ibadah |
| C-1 | PASS: warna, area foto, dan pemusatan pesan memiliki fungsi yang disebutkan dalam hasil di atas |
| C-2 | PASS: kontrol baru menjalankan perubahan state dan bisa dikembalikan ke pilihan awal |
| C-3 | PASS: tidak menambah bagian promosi atau konten pengisi |
| C-4 | PASS: tes mencakup mode, lebar, keyboard, penyimpanan, data kosong, dan jaringan offline |
| C-5 | PASS: hasil pengujian terpisah dari data publik dan batas cache pihak ketiga dinyatakan jelas |
