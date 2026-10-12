# Verifikasi Lagu Sion (Partiture), revisi 34
Status: PASS dalam lingkup menu partitur.
Situs: https://gmahk-galilea.vercel.app/?revision=34#hymnal-scores
Runtime terverifikasi: 8eb2cf1aea89894c3f856107d024b18919c58c21.
Deployment dengan harness responsif: dpl_68YRpF1x2NB45xVaqHEoqvLk65YZ, READY.
Tanggal: 12 Oktober 2026.

## Arah dan batas fitur
Menu baru memakai katalog dan cache Lagu Sion yang sudah ada. Pencarian berdasarkan nomor atau judul, dropdown, dan lagu acak mengikuti pembaca lama. PDF jemaat dipilih sendiri untuk nomor lagu, dibaca berdampingan dengan lirik di desktop, lalu ditumpuk pada layar sempit. Identitas hijau Galilea, tipografi, kontrol, dan pilihan tema lama dipertahankan. Dials: ENERGY 2 / RHYTHM 2 / MOTION 1; fokus pada bacaan, gerakan hanya respons interaksi.

PDF disimpan di IndexedDB browser perangkat ini. File tidak dikirim ke server dan tidak otomatis tersedia di perangkat jemaat lain. Jika penyimpanan tidak tersedia atau penuh, PDF tetap dibaca selama tab terbuka dengan keterangan yang jujur. Belum ada partitur otomatis dari API SDA Media. Tidak ada notasi musik yang dibuat atau ditebak.

## Bukti otomatis
npm run check dan git diff --check lolos. Suite baru mencakup pencarian, isi kosong, header PDF, file kosong, batas 25 MB, penyimpanan/reload, pemisahan per nomor lagu, fallback quota, detach, retry koneksi, pemilihan cepat, pelepasan object URL, dan escaping lirik. Fullscreen yang ditolak memakai portal langsung ke body agar tidak terikat transform halaman; keluar mengembalikan interaksi latar.
Penyimpanan pada tes otomatis memakai mock IndexedDB; ketahanan setelah reload juga diperiksa menggunakan IndexedDB Chrome yang sebenarnya.

## Bukti Chrome produksi
- Katalog aktual menampilkan 525 lagu. Pencarian judul Di Hadapan menghasilkan lagu 1; nomor 525 menghasilkan Masyhurkan Karunia-Nya; pencarian tanpa hasil memberi petunjuk mengganti kata kunci.
- Dropdown lagu 1 membuka empat ayat lirik aktual.
- File PDF uji berlabel jelas sebagai fixture, bukan partitur lagu, dipilih lewat file chooser. PDF tampil dalam viewer Chrome dan tetap tersedia setelah reload.
- Unduh PDF berhasil; byte unduhan identik dengan fixture sumber.
- Buka PDF di tab baru menghasilkan tab blob dengan judul untitled; tab uji ditutup.
- Browser cloud menolak fullscreen sistem. Fallback memenuhi viewport: x=0, y=0, lebar konten 1348, tinggi 936 pada viewport 1363 × 936. Escape dan tombol Keluar berfungsi.
- Viewport iframe 320 × 900: fallback x=0, y=0, lebar konten 305, tinggi 900. PDF dan lirik ditumpuk tanpa overflow horizontal.
- Viewport 420: scrollWidth 405; kolom 385; lirik mulai setelah panel partitur berakhir.
- Viewport 800: scrollWidth 785; kolom 761. Viewport 1366: scrollWidth 1351; kolom 833.562 + 362.438.
- Angka selisih 15 px berasal dari area scrollbar browser. Pengujian iframe memakai ukuran layout nyata dengan transform luar untuk muat pada layar cloud; bukan pengujian ponsel fisik.
- Menu Partiture diakses lewat Buka menu dari pembaca Lagu Sion lama.
- Lagu acak membuka No.106; Buka mode lirik membuka dialog lama; Escape menutupnya. Tema terang dan gelap tetap menampilkan bacaan.
- PDF fixture dilepas dari browser setelah pengujian. Tidak ada contoh partitur fiktif yang ditinggalkan.
- Console aplikasi tidak mempunyai error; log ekstensi Chrome dikecualikan.
- Preview awal kekurangan konfigurasi backend; pemeriksaan interaktif menggunakan lingkungan produksi yang memiliki konfigurasi tersebut.

## Delivery Gate
Lingkup gate adalah menu baru, bukan audit ulang semua bagian website.

### Hard Gate
- R-02 PASS: copy baru menyebut tindakan dan batas penyimpanan secara langsung; tidak menambah em dash.
- R-03 PASS: ukuran layout nyata 320, 420, 800, 1366 diperiksa tanpa overflow horizontal.
- R-17 PASS: angka 525 berasal dari katalog live; hasil pencarian dihitung dari katalog.
- R-18 PASS: tidak menambah testimonial atau nama fiktif.
- R-23 PASS: menu diminta pengguna; tidak membuat logo, gambar, atau partitur baru.
- R-24 PASS: tujuan menu membuka route hymnal-scores yang dijalankan live.
- R-25 PASS: memakai token warna Galilea; suite kontras lolos dan kedua tema terbaca.
- R-26 PASS: pencarian, dropdown, acak, file chooser, mode lirik, fullscreen, buka tab, unduh, dan detach dijalankan.
- R-27 PASS: kondisi belum memilih, PDF belum ditambahkan, pencarian kosong, loading, retry error, file invalid, dan quota ditangani.
- R-28 PASS: tidak menambah FAQ.
- R-32 PASS: Enter mengaktifkan fullscreen; Escape menutup fullscreen dan pembaca; fallback memberi fokus serta menonaktifkan latar.
- R-33 PASS: seluruh fitur ditulis dalam index.html/hymnal-scores.js/hymnal-scores.css melalui patch sumber.
- R-34 PASS: tema terang dan gelap diuji live.
- R-35 PASS: full suite exit 0 dan click-through kontrol menu dicatat di atas.
- R-36 PASS: keterbatasan API, penyimpanan lokal, fixture PDF, fullscreen cloud, dan pengujian iframe dinyatakan.
- R-37 PASS: mengikuti menu, pencarian, dan PDF jemaat yang dipilih pengguna; arah visual Galilea dipertahankan.
- R-38 PASS: lirik berasal dari katalog aktual; PDF berasal dari file yang dipilih, tanpa notasi buatan.

### Purpose Gate
- R-01 PASS: hijau dan netral mengikuti identitas Galilea; tidak menambah glow baru.
- R-04 PASS: ikon file untuk PDF, buku untuk lirik, dan musik untuk lagu memakai sistem lama.
- R-06 PASS: judul lagu dominan untuk memastikan file dipasangkan ke nomor yang benar.
- R-07 PASS: tidak menambah pola latar baru.
- R-08 PASS: chevron pada baris lagu memberi arah membuka bacaan, sama dengan pembaca lama.
- R-09 PASS: jumlah lagu menunjukkan ukuran katalog aktual.
- R-10 PASS: panel PDF/lirik menggunakan permukaan solid, bukan lapisan kaca tambahan.
- R-12 PASS: panel tidak diberi bayangan besar baru.
- R-13 PASS: tidak menambah glow.
- R-14 PASS: area PDF lebih lebar untuk membaca halaman; lirik sebagai kolom pendamping.
- R-19 PASS: tidak ada animasi berulang; pergantian lagu dan fullscreen dipicu pengguna.
- R-22 PASS: tidak ada ilustrasi generik.

### Liveliness
- Dials PASS: ENERGY 2 / RHYTHM 2 / MOTION 1, bacaan utama dengan kontrol tenang.
- Konsistensi PASS: memakai shell dan toolbar pembaca lama.
- Focal point PASS: judul lagu dan halaman PDF menjadi fokus saat dipilih.
- Whitespace PASS: jarak membedakan pencarian, judul, PDF, dan kelompok ayat.
- Accent PASS: tombol utama mengikuti aksen hijau Galilea.
- Identity PASS: tipografi dan motif Galilea dipertahankan.
- Design Read PASS: struktur mengikuti keputusan mencari lagu, memasangkan PDF, lalu membaca.

### Craftsmanship dan Quality Locks
- C-1 PASS: PDF lebar untuk notasi, lirik di samping untuk konteks; layar sempit ditumpuk.
- C-2 PASS: seluruh kontrol baru memiliki perilaku yang diuji.
- C-3 PASS: tidak menambah konten pemasaran atau pengisi.
- C-4 PASS: reload, koneksi gagal, quota, pencarian kosong, pemilihan cepat, kedua tema, dan viewport sempit diuji.
- C-5 PASS: bukti berupa tes, ukuran DOM, file unduhan identik, dan deployment READY.
- R-05 PASS: komposisi dibangun untuk membaca PDF bersama lirik.
- R-11 PASS: panel dan tombol memakai radius berbeda, tanpa kapsul untuk semua elemen.
- R-15 PASS: tindakan diberi label Pilih PDF, Buka mode lirik, Unduh PDF, dan Lepas PDF.
- R-16 PASS: tidak menambah jargon pemasaran.
- R-20 PASS: katalog Lagu Sion dan bacaan jemaat tetap menjadi konteks khusus.
- R-21 PASS: kedua tema tersedia dan diperiksa.
- R-29 PASS: token hijau, netral, dan aksen lama dipakai.
- R-30 PASS: tidak melakukan redesign yang meniru produk lain.
- R-31 PASS: tiap bagian melayani pencarian, pasangan nomor/file, pembacaan, atau pengelolaan lampiran.

