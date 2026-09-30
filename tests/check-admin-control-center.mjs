import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const admin = fs.readFileSync(path.join(root, 'apps-script-backend/Admin.gs'), 'utf8');
const html = fs.readFileSync(path.join(root, 'apps-script-backend/Admins.html'), 'utf8');
const bridge = fs.readFileSync(path.join(root, 'apps-script-backend/VercelApi.gs'), 'utf8');

assert.match(admin, /const width = gaEntityWidth_\(definition\);/, 'Daftar entitas harus membaca seluruh kolom, termasuk media.');
assert.match(admin, /else if \(field\.type === 'media'\) \{\s*value = gaSanitizeMedia_\(value, field\.label\);/, 'Media harus memakai sanitizer khusus.');
assert.match(admin, /function adminGetNotifications\(\)/, 'Backend harus menyediakan notifikasi aktual.');
assert.match(admin, /cacheRevision: revision/, 'Hasil publikasi harus menyertakan revisi sinkronisasi viewer.');
assert.match(admin, /function adminUploadMediaChunk\(payload\)/, 'Upload media harus diproksikan melalui Apps Script.');
assert.match(admin, /PropertiesService\.getUserProperties\(\)/, 'Sesi upload harus terisolasi per pengguna.');
assert.match(admin, /'Content-Range': 'bytes '/, 'Backend harus mengirim rentang chunk ke Google Drive.');

const mediaStart = admin.indexOf('function gaSanitizeMedia_(');
const mediaEnd = admin.indexOf('\nfunction gaSheetValue_', mediaStart);
assert.ok(mediaStart >= 0 && mediaEnd > mediaStart, 'Sanitizer media harus dapat ditemukan.');
const sandbox = {
  gwClean_: value => String(value == null ? '' : value).replace(/\s+/g, ' ').trim(),
  gwSafeUrl_: value => /^https:\/\//i.test(String(value || '').trim()) ? String(value).trim() : ''
};
vm.createContext(sandbox);
vm.runInContext(admin.slice(mediaStart, mediaEnd), sandbox);

const manyMedia = Array.from({length: 12}, (_, index) => ({
  id: `FILE_${index}`,
  name: `Dokumentasi kegiatan nomor ${index} ${'panjang '.repeat(12)}`,
  mimeType: index === 0 ? 'image/jpeg' : 'application/pdf',
  size: 1200 + index,
  url: `https://drive.google.com/file/d/FILE_${index}/view`,
  primary: index === 0
}));
const serialized = sandbox.gaSanitizeMedia_(JSON.stringify(manyMedia), 'Media');
assert.ok(serialized.length > 1000, 'Metadata media di atas 1.000 karakter tidak boleh dipotong.');
assert.equal(JSON.parse(serialized).length, 12, 'Seluruh media valid harus dipertahankan.');
assert.throws(() => sandbox.gaSanitizeMedia_('[{"rusak":', 'Media'), /rusak/, 'JSON media rusak harus menghasilkan pesan yang jelas.');

assert.match(html, /id="confirm-dialog"/, 'UI harus memakai dialog konfirmasi bermerek.');
assert.match(html, /id="operation-bar"/, 'UI harus menampilkan status operasi yang persisten.');
assert.match(html, /server\('adminGetNotifications'/, 'UI harus mengambil notifikasi aktual dari backend.');
assert.match(html, /setInterval\(\(\)=>loadNotifications\(false\),60000\)/, 'Notifikasi harus diperbarui berkala.');
assert.match(html, /beforeunload/, 'Editor harus memperingatkan perubahan yang belum disimpan.');
assert.doesNotMatch(html, /\bconfirm\s*\(/, 'UI tidak boleh memakai dialog confirm bawaan browser.');
assert.match(html, /server\('adminUploadMediaChunk'/, 'Browser harus mengirim chunk melalui backend admin.');
assert.match(html, /const sessionId = initRes\.uploadId;/, 'Browser tidak boleh bergantung pada session URL Drive langsung.');

assert.match(bridge, /item\.dateValue <= today/, 'Berita hari ini harus tampil pada viewer.');
assert.match(bridge, /function galileaDirectDriveImageUrl_\(value\)/, 'Viewer harus menormalkan URL gambar Google Drive.');
assert.match(bridge, /const width = Math\.max\(9, Math\.min\(sheet\.getLastColumn\(\), 9\)\);/, 'Adapter viewer harus membaca kolom media.');
assert.match(bridge, /media: media,/, 'Adapter viewer harus meneruskan metadata media.');

console.log('OK - Admin Control Center, workflow media, notifikasi, dan sinkronisasi viewer tervalidasi.');
