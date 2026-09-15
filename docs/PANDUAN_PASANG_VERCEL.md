# Cara Pasang Galilea Cinematic V16 ke Vercel

Ikuti urutan ini. Anda tidak perlu mengubah `Code.gs`.

## Bagian A — Sambungkan Apps Script ke Vercel

### 1. Tambahkan satu file baru

Di project Apps Script Galilea yang sekarang:

1. Klik tanda **+** di sebelah Files.
2. Pilih **Script**.
3. Beri nama `VercelApi`.
4. Buka file `apps-script-backend/VercelApi.gs` dari paket ini.
5. Salin seluruh isinya ke file `VercelApi.gs` di Apps Script.
6. Simpan.

Jangan menghapus `Code.gs`, `Website.gs`, `Admin.gs`, `Index.html`, atau `Admins.html`.

### 2. Buat secret penghubung

1. Pada daftar fungsi di bagian atas editor, pilih `generateGalileaVercelSecret`.
2. Klik **Run/Jalankan**.
3. Izinkan akses jika diminta.
4. Buka **Execution log**.
5. Salin teks panjang setelah `GALILEA_API_SECRET=`. Simpan sementara di Notepad.

Secret ini jangan dibagikan ke grup jemaat dan jangan ditulis di `index.html`.

### 3. Buat deployment khusus API

1. Klik **Deploy → New deployment**.
2. Pilih **Web app**.
3. Description: `Galilea API Cinematic V16`.
4. Execute as: **Me**.
5. Who has access: **Anyone**.
6. Klik **Deploy**.
7. Salin URL yang berakhir `/exec`. Ini adalah `GALILEA_APPS_SCRIPT_API_URL`.

Deployment ini aman untuk viewer karena semua fungsi yang diizinkan dibatasi dalam `VercelApi.gs` dan setiap permintaan wajib membawa secret server.

### 4. Buat deployment khusus admin

1. Klik **Deploy → New deployment** lagi.
2. Pilih **Web app**.
3. Description: `Galilea Admin Cinematic V16`.
4. Execute as: **User accessing the web app**.
5. Who has access: pilih pengguna yang memiliki **akun Google** atau organisasi gereja Anda.
6. Klik **Deploy**.
7. Salin URL `/exec` yang kedua. Ini adalah `GALILEA_APPS_SCRIPT_ADMIN_URL`.

Deployment admin harus berbeda dari deployment API. Inilah yang membuat login Gmail, multi-role, draft, approval, revisi, dan audit tetap mengenali pengguna yang benar.

## Bagian B — Deploy folder ke Vercel

### Cara paling mudah melalui terminal

1. Ekstrak paket ini.
2. Buka terminal di dalam folder `galilea-vercel-v16`.
3. Jalankan:

```bash
npx vercel
```

4. Jawab pertanyaan awal:

- Set up and deploy? **Y**
- Link to existing project? **N** untuk project baru
- Project name: `gmahk-galilea-balikpapan`
- Directory: tekan **Enter** karena sudah berada di folder yang benar
- Modify settings? **N**

Deployment pertama boleh belum memuat data karena environment variable belum dimasukkan.

### Tambahkan tiga Environment Variables

Di Dashboard Vercel buka project → **Settings → Environment Variables**, lalu tambahkan:

| Key | Value |
| --- | --- |
| `GALILEA_APPS_SCRIPT_API_URL` | `https://script.google.com/macros/s/DEPLOYMENT_ID/exec` |
| `GALILEA_APPS_SCRIPT_ADMIN_URL` | `https://script.google.com/macros/s/DEPLOYMENT_ID/exec` |
| `GALILEA_API_SECRET` | Secret dari Execution log langkah A2 |

Centang **Production**, **Preview**, dan **Development** untuk ketiganya. Nama key harus persis sama dan secret tidak boleh memakai spasi di depan/belakang.

Environment variable baru hanya berlaku pada deployment baru. Karena itu, setelah menyimpan ketiganya jalankan:

```bash
npx vercel --prod
```

## Bagian C — Tes setelah deploy

Ganti `domain-anda.vercel.app` dengan alamat Vercel Anda.

### 1. Tes jembatan API

Buka:

```text
https://domain-anda.vercel.app/api/gas
```

Hasil yang benar:

```json
{"ok":true,"service":"Galilea Vercel API Bridge","configured":true}
```

Jika `configured:false`, environment variable belum masuk ke deployment terbaru.

### 2. Tes viewer

Buka halaman utama. Loader harus hilang dan data beranda muncul. Coba juga:

- Jadwal → Ringkasan dan Jadwal Lengkap.
- Sekolah Sabat → materi dan pembaca.
- Alkitab → kitab, pasal, dan ayat.
- Lagu Sion → pilih nomor lagu.
- Ganti bahasa serta mode terang/gelap.

### 3. Tes admin

Buka:

```text
https://domain-anda.vercel.app/admin
```

Anda akan diarahkan ke Google Apps Script lalu login dengan Gmail yang terdaftar sebagai admin. Jangan menambahkan kata lain di belakang URL `/admin`.

## Jika data Spreadsheet berubah

Perubahan jadwal, kegiatan, pengumuman, pengurus, dan konten spreadsheet tidak memerlukan deploy Vercel ulang. Viewer mengambil data terbaru dari Apps Script. Cache data utama berlaku sekitar 60 detik; materi harian mempunyai kunci tanggal WITA dan diperbarui saat hari berganti.

## Jika kode Apps Script berubah

1. Simpan perubahan di Apps Script.
2. Buka **Deploy → Manage deployments**.
3. Edit deployment API dan deployment admin.
4. Pilih **New version** lalu deploy keduanya.

URL deployment tidak berubah bila deployment lama diedit. Environment variable Vercel juga tidak perlu diganti.

## Jika kode Vercel berubah

Jalankan kembali:

```bash
npx vercel --prod
```

## Pemecahan masalah singkat

- **Halaman berhenti di loader:** buka `/api/gas`; pastikan `configured:true`, kemudian cek URL API dan secret.
- **Backend mengirim HTML:** `VercelApi.gs` belum ikut dalam versi deployment API terbaru.
- **Admin tidak mengenali Gmail:** Anda memakai URL deployment API untuk admin. Isi `GALILEA_APPS_SCRIPT_ADMIN_URL` dengan deployment yang berjalan sebagai **User accessing the web app**.
- **Perubahan environment variable tidak terbaca:** lakukan redeploy karena perubahan env tidak diterapkan pada deployment lama.
- **Data lama:** muat ulang paksa sekali. Sesudah itu cache V16 memakai nama baru dan tidak bercampur dengan cache V15.
