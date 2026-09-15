# Galilea Creative Cinema V17.1.0

Redesign struktural Website GMAHK Galilea Balikpapan. V17 mengganti pola navbar dan tumpukan card lama dengan bab layar penuh, navigasi title-sequence, tipografi editorial, cahaya sanctuary, serta transisi seperti perpindahan adegan. Backend Google Apps Script/Google Sheets dan portal admin V16 tetap kompatibel.

## Arsitektur

```text
Jemaat → Viewer Vercel → /api/gas → Apps Script API → Google Sheets
Admin → /admin → Apps Script Admin → login Google + draft/approval
```

Deployment Apps Script API berjalan sebagai pemilik spreadsheet. Deployment admin berjalan sebagai pengguna yang mengakses agar akun Google dan role dapat dikenali.

## Perubahan utama V17

- Navbar horizontal diganti tombol `Jelajahi` dan menu layar penuh yang terbagi per kategori.
- Menu HP dibagi menjadi Utama, Gereja, Ibadah, Materi Iman, dan Informasi Jemaat.
- Beranda dibangun sebagai lima bab visual: pembuka, jadwal, Renungan Pagi, siaran iman, dan kehidupan jemaat.
- Loader lama diganti animasi `sanctuary opening`: pintu gereja, salib cahaya, lantai cahaya, dan partikel halus.
- Halaman dalam memakai opening chapter dengan nomor bab, bukan header biasa.
- Mode terang dan gelap memakai pasangan warna yang lulus rasio kontras WCAG minimal 4.5:1 untuk teks normal.
- Renungan Pagi dibagikan ke WhatsApp dalam versi lengkap dari `contentHtml`, termasuk tanggal, judul, ayat, seluruh bacaan, sumber, dan tautan.
- Namespace cache viewer dinaikkan ke V17 agar tampilan baru tidak bercampur dengan cache lama.

## Fitur yang tetap dipertahankan

- Profil, pengurus, kontak, kegiatan, pengumuman, galeri, layanan jemaat, FAQ, dan pencarian.
- Berita Jemaat memuat kegiatan yang sudah berlangsung dengan maksimal 12 foto, cover otomatis, galeri, detail penuh, serta template berbagi WhatsApp.
- Agenda dan Pengumuman memuat informasi aktif, masa tampil, prioritas, dan pilihan masuk Warta Jemaat.
- Alkitab, Lagu Sion, dan Lagu Tema memiliki mode layar estetik dengan teks besar untuk ibadah.
- Jadwal ringkas dan lengkap, filter, poster gambar, kalender, WhatsApp, unduhan sesuai hasil pencarian, dan PDF triwulan.
- Renungan Pagi berbentuk teks yang mengikuti tanggal WITA dan bersumber dari bacaan harian Advent berbahasa Indonesia.
- Sekolah Sabat, berita misi, bacaan persembahan, penginjilan perorangan, pembaca materi, dan unduhan.
- AWR Borneo, video pembahasan Sekolah Sabat, tema Advent, Alkitab, Lagu Sion, dan lagu tema.
- Viewer multibahasa, mode terang/gelap, ukuran huruf, reduced motion, serta navigasi berkategori.
- Portal admin cinematic: multi-role, draft, approval/revisi, audit, pengelolaan jadwal, identitas gereja, konten, foto kegiatan, dan layanan.
- Cache bootstrap 60 detik agar perubahan spreadsheet cepat terlihat tanpa membuat website berat.

## Isi paket

- `index.html` — viewer cinematic Vercel.
- `api/` — proxy viewer, route admin, dan generator PDF triwulan.
- `apps-script-backend/Website.gs` — backend publik dan sumber data.
- `apps-script-backend/Admin.gs` — workflow admin multi-role.
- `apps-script-backend/Admins.html` — antarmuka portal admin cinematic.
- `apps-script-backend/VercelApi.gs` — dispatcher aman untuk Vercel.
- `docs/` — folder dokumentasi dan panduan:
  - `docs/PANDUAN_UPDATE_V17.md` — urutan update viewer V17.
  - `docs/HASIL_PENGUJIAN.md` — pemeriksaan build dan integritas.
  - `docs/PANDUAN_PASANG_VERCEL.md` — panduan deployment Vercel.
  - `docs/CATATAN_RELEASE_V17.md` — catatan rilis versi V17.
  - `docs/GALILEA_PROJECT_HANDOFF.md` — dokumen serah terima proyek.

## Pengujian

```bash
npm run check
```

Tes memeriksa sintaks viewer dan fungsi server, allowlist proxy, routing admin, konfigurasi Vercel, metadata Open Graph, generator PDF, share Renungan Pagi penuh, menu kategori, loader baru, detail kegiatan, dan rasio kontras kedua mode.
