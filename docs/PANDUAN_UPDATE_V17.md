# Update Galilea Creative Cinema V17

V17 adalah pembaruan viewer Vercel. Backend Apps Script V16 tetap kompatibel sehingga URL API, URL admin, dan secret lama tidak perlu diganti.

## Paket tertaut ke project produksi

Paket `LINKED_READY` menyertakan tautan project `.vercel/project.json` menuju `gmahk-galilea-v16`, yaitu project yang memiliki domain utama `gmahk-galilea.vercel.app`. Jangan membuat project Vercel baru. Pada Windows, ekstrak paket lalu jalankan `DEPLOY_KE_PRODUKSI.cmd`; deployment akan memakai environment variable yang sudah tersimpan pada project tersebut.

## Deployment

1. Pastikan project Vercel yang ditautkan adalah `gmahk-galilea-v16`.
2. Pertahankan environment variable `GALILEA_APPS_SCRIPT_API_URL`, `GALILEA_APPS_SCRIPT_ADMIN_URL`, dan `GALILEA_API_SECRET`.
3. Jalankan pemeriksaan dengan `npm run check`.
4. Buat deployment preview dan periksa desktop, HP, tema terang, tema gelap, serta seluruh route.
5. Setelah preview lulus, jalankan deployment production.
6. Verifikasi `/api/gas`, `/admin`, `/api/quarterly-pdf`, dan metadata Open Graph.

Perubahan spreadsheet tetap terbaca otomatis dan tidak membutuhkan deployment Vercel baru. Cache bootstrap viewer V17 berlangsung sekitar 60 detik.
