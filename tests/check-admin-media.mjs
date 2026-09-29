import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const source = fs.readFileSync(path.join(root, 'apps-script-backend/Admins.html'), 'utf8');
const marker = '/* NEW MEDIA UPLOAD ENGINE (Resumable Upload)';
const markerIndex = source.indexOf(marker);
const scriptStart = source.lastIndexOf('<script>', markerIndex) + '<script>'.length;
const scriptEnd = source.indexOf('</script>', markerIndex);

assert.ok(markerIndex >= 0 && scriptStart >= '<script>'.length && scriptEnd > scriptStart, 'Blok mesin media harus ditemukan.');
assert.ok(source.lastIndexOf('</html>') > scriptEnd, 'Mesin media harus berada di dalam dokumen HTML.');
assert.match(source, /window\.GALILEA_ADMIN_RUNTIME=Object\.freeze\(/, 'Runtime admin utama harus diekspos ke mesin media.');

const dom = new JSDOM(`<!doctype html><html><body>
  <textarea name="media">[{"name":"Foto","mimeType":"image/jpeg","url":"https://drive.google.com/uc?export=view&id=FILE_123","primary":true}]</textarea>
  <input name="photos" value="https://drive.google.com/uc?export=view&id=FILE_123">
  <div id="media-manager-media"></div>
</body></html>`, {runScripts: 'outside-only'});

const {window} = dom;
window.CSS.escape = window.CSS.escape || (value => String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&'));
const escapeHtml = value => String(value == null ? '' : value).replace(/[&<>\"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
window.GALILEA_ADMIN_RUNTIME = Object.freeze({
  query: (selector, context) => (context || window.document).querySelector(selector),
  queryAll: (selector, context) => Array.from((context || window.document).querySelectorAll(selector)),
  escapeText: escapeHtml,
  escapeAttribute: escapeHtml,
  server: async () => { throw new Error('Server tidak digunakan dalam tes render.'); },
  cleanError: value => String(value || '')
});

vm.runInContext(source.slice(scriptStart, scriptEnd), dom.getInternalVMContext());

assert.equal(
  window.normalizeDriveUrl('https://drive.google.com/file/d/FILE_456/view?usp=sharing'),
  'https://lh3.googleusercontent.com/d/FILE_456=w800'
);
assert.equal(
  window.normalizeDriveUrl('https://lh3.googleusercontent.com/d/FILE_789=w800'),
  'https://lh3.googleusercontent.com/d/FILE_789=w800'
);

window.renderMediaManager('media');
const preview = window.document.querySelector('#media-manager-media img');
assert.ok(preview, 'Thumbnail media harus dirender ketika berita diedit.');
assert.equal(preview.getAttribute('src'), 'https://lh3.googleusercontent.com/d/FILE_123=w800');

console.log('OK - Admin media runtime dan thumbnail Google Drive berfungsi.');
