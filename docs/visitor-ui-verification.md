# Tampilan pengunjung Galilea

Tanggal pemeriksaan: 12 Oktober 2026. Lingkup: perubahan beranda, halaman ibadah, kontrol pengunjung, pembuka, dan UI Reels. Endpoint, sumber data, isi berita jemaat, serta alur pengambilan Reels dipertahankan.

## Arah desain

Portal jemaat untuk pengunjung dan petugas, dengan warna hijau Galilea, latar krem, serta aksen emas pada informasi penting. ENERGY 2 / RHYTHM 2 / MOTION 2.

- Hijau menghubungkan halaman dengan identitas Galilea; warna tombol dipisahkan dari latarnya supaya dapat dibaca.
- Judul lebih kecil memberi ruang bagi jadwal dan tindakan pengunjung.
- Foto memakai berita yang benar-benar terbit, dengan tombol menuju berita tersebut.
- Ikon kalender, Alkitab, lokasi, dan simpan mengikuti tindakan yang diwakilinya.
- Radius 12px untuk tombol dan 18–26px untuk kartu membedakan kontrol dari isi.
- Gerak singkat memberi respons pada tombol dan menu; preferensi pengurangan gerak tetap berlaku.
- Panel operator berada setelah informasi jemaat dan dapat dibuka oleh petugas.
- Reels memakai palet halaman, dengan identitas Instagram pada logonya. Tidak ada video atau jumlah Reels yang dibuat-buat.

## Bukti fungsi dan tampilan

| Pemeriksaan | Hasil |
| --- | --- |
| Beranda menuju ibadah | Rabu 14 Oktober 2026, 19.00 WITA tampil pada kartu dan halaman ibadah yang sama. |
| Kalender | Dialog terbuka; file .ics diunduh dengan DTSTART 20261014T190000 dan zona Asia/Makassar. Escape menutup dialog. |
| Kartu berita pada pembuka | Membuka berita Milka Aruni Lantu beserta isi dan media yang sudah terbit. Escape menutup pembaca. |
| Panduan berkunjung | Tombol menuju halaman Panduan Pengunjung. |
| Panel operator | Ringkasan 1/5 bagian tersedia membuka daftar; tema generik dari jadwal tidak dihitung sebagai tema yang diterbitkan. |
| Uji layar | Membuka mode layar, lalu Escape mengembalikan halaman. |
| Pengaturan ponsel | Menu membuka Tampilan; tema Gelap dan ukuran Sangat besar diterapkan. Preferensi dikembalikan ke Sistem dan Normal setelah pemeriksaan. |
| Reels | Pesan ketika video belum tersedia dan tautan profil tampil; URL profil tetap instagram.com/advent.galilea/. |
| Lebar 320px | Lebar dokumen 320px pada tema terang, 305px dengan scrollbar pada tema gelap. Tidak melampaui viewport. |
| Lebar 420px | Lebar dokumen 405px dengan scrollbar. Reels menumpuk menjadi satu kolom. |
| Lebar 800px | Lebar dokumen 785px dengan scrollbar. |
| Desktop | Lebar dokumen 1348px pada viewport 1363px. Judul dan foto berdampingan. |
| Console | Tidak ditemukan kesalahan dari aplikasi pada alur yang diperiksa. Pesan ekstensi browser terpisah dari aplikasi. |
| Regresi | npm run check lulus: admin editor/interaksi, media, sinkronisasi, berita, partitur, presentasi, cache, jadwal, kontras, banner, dan runtime produksi. |
| Pemeriksaan setelah koreksi warna | check-project, check-contrast, dan git diff --check lulus. |

Pengujian ukuran menggunakan halaman verifikasi viewport bawaan proyek, bukan menambahkan konten uji ke data jemaat. Tautan akun eksternal diperiksa tujuan URL-nya. Pengujian tidak mengirim permohonan doa atau pesan jemaat.

## Delivery Gate antislop

Status berlaku untuk perubahan dalam lingkup di atas, bukan penulisan ulang isi yang diterbitkan jemaat atau seluruh sistem lama.

### Hard Gate

- R-02 PASS: teks baru menggunakan kalimat sederhana tanpa em dash.
- R-03 PASS: viewport 320, 420, 800, dan desktop tidak melampaui lebar layar; tombol baru minimal 44px.
- R-17 PASS: tanggal dan kesiapan berasal dari data jadwal serta materi yang ada.
- R-18 PASS: tidak membuat testimoni atau identitas fiktif.
- R-23 PASS: foto berasal dari berita jemaat yang sudah terbit; pembaruan ikon dan tombol diminta pengguna.
- R-24 PASS: tujuan navigasi baru memakai route visitor, schedule, today, dan berita yang sudah tersedia.
- R-25 PASS: uji token warna tombol terang, gelap, dan kartu hijau menghasilkan rasio teks minimum 8.50:1; batas serta fokus minimum 3:1. Judul kartu ibadah diperiksa melalui computed style dan screenshot.
- R-26 PASS: tindakan baru dan yang diubah diverifikasi lewat tabel pemeriksaan fungsi.
- R-27 PASS: pembuka memiliki indikator memuat dan pesan gagal; Reels memiliki indikator memuat, video, dan pesan ketika video belum tersedia.
- R-28 PASS: tidak menambahkan pertanyaan FAQ generik.
- R-32 PASS: kontrol memakai button/link/details; indikator fokus terlihat dan Escape menutup pembaca serta presentasi.
- R-33 PASS: perubahan ditulis langsung pada sumber melalui patch, tanpa skrip yang menulis ulang CSS.
- R-34 PASS: tema terang dan gelap diperiksa, termasuk pengaturan tulisan sangat besar.
- R-35 PASS: regresi dijalankan dan kontrol yang berubah diperiksa pada deployment produksi; bukti tiap tindakan dicatat di atas.
- R-36 PASS: tidak membuat klaim keamanan, kinerja, atau statistik baru.
- R-37 PASS: arah mempertahankan identitas Galilea dengan dials yang dinyatakan di atas.
- R-38 PASS: foto, berita, petugas, tanggal, dan tautan berasal dari data yang tersedia.

### Purpose-Gate

- R-01 PASS: hijau mempertahankan merek, krem memisahkan tindakan dari latar, emas menandai informasi penting.
- R-04 PASS: ikon kalender, lokasi, bacaan, dan simpan mewakili fungsi masing-masing.
- R-06 PASS: ukuran judul diperbaiki untuk membaca informasi dan menemukan tindakan lebih cepat.
- R-07 PASS: garis kisi pada pembuka dan heading halaman dihilangkan.
- R-08 PASS: panah dipakai pada berita dan tujuan luar; tombol jadwal dan panduan memakai ikon tindakannya.
- R-09 PASS: indikator kesiapan menyatakan materi yang benar-benar tersedia; dot dekoratif kartu ibadah dihilangkan.
- R-10 PASS: panel Reels dan header baru tidak memakai backdrop blur.
- R-12 PASS: tombol dan panel Reels tidak diberi bayangan; header memakai bayangan untuk memisahkannya dari isi saat tetap di atas.
- R-13 PASS: tidak menambahkan glow ke kontrol baru.
- R-14 PASS: foto berita, jadwal ibadah, akses cepat, bacaan, dan Reels memiliki susunan sesuai isinya.
- R-19 PASS: transisi kontrol 0.18s dan menu 0.24s memberi respons; reduced motion mematikannya.
- R-22 PASS: tidak membuat ilustrasi generik atau foto orang baru.

### Liveliness

- Dials PASS: ENERGY 2 / RHYTHM 2 / MOTION 2 mempertahankan karakter halaman dengan kepadatan yang lebih nyaman.
- Focal point PASS: judul dan foto berita mengawali halaman; kartu jadwal menjadi fokus bagian ibadah.
- Whitespace PASS: jarak pembuka dan bagian berita diperkecil agar informasi lebih cepat ditemukan.
- Accent PASS: emas dibatasi pada penanda informasi; tombol memakai warna netral atau hijau.
- Identity PASS: hijau Galilea, foto jemaat, logo, dan tipografi pembuka dipertahankan.
- Design read PASS: tujuan portal jemaat dan arah visual ditetapkan sebelum perubahan.

### Craftsmanship dan quality locks

- C-1 PASS: alasan warna, bentuk, susunan, ikon, serta motion dicatat pada arah desain.
- C-2 PASS: kontrol baru terhubung ke alur nyata; fungsi Reels dipertahankan.
- C-3 PASS: setiap bagian menampilkan informasi atau tindakan jemaat yang sudah tersedia.
- C-4 PASS: state memuat/gagal, tema gelap, viewport sempit, dan dialog diperiksa.
- C-5 PASS: tidak menambahkan angka atau informasi yang tidak berasal dari data.
- R-05 PASS: pembuka, jadwal, berita, bacaan, dan Reels mengikuti kebutuhan isi, bukan menambah bagian template.
- R-11 PASS: tombol dan kartu menggunakan radius berbeda dengan skala tetap.
- R-15 PASS: label seperti Lihat jadwal ibadah, Panduan berkunjung, dan Buka Instagram Galilea menyebut tindakannya.
- R-16 PASS: tidak menambahkan jargon pemasaran pada teks baru.
- R-20 PASS: logo, palet, foto kegiatan, jadwal, dan pelayanan memperjelas identitas Galilea.
- R-21 PASS: pilihan terang, gelap, dan sistem tetap berfungsi.
- R-29 PASS: hijau, krem, dan emas menjadi palet utama; warna logo Instagram mengikuti mereknya.
- R-30 PASS: tidak meniru tampilan produk lain.
- R-31 PASS: setiap keputusan utama memiliki alasan tertulis pada arah desain.
