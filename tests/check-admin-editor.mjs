import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

const source = fs.readFileSync(
  new URL('../apps-script-backend/Admins.html', import.meta.url),
  'utf8',
);
const backend = fs.readFileSync(
  new URL('../apps-script-backend/Admin.gs', import.meta.url),
  'utf8',
);
const dom = new JSDOM('<!doctype html><body><form id="editor-form"></form></body>', {
  url: 'https://galilea.test/admin',
  runScripts: 'outside-only',
});
const w = dom.window;
w.CSS.escape = (value) => String(value);
vm.runInContext(
  "const $=(s,c)=>(c||document).querySelector(s);const esc=value=>String(value??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));const attr=esc;",
  dom.getInternalVMContext(),
);
vm.runInContext(
  source.slice(
    source.indexOf('    function legacyToHtml('),
    source.indexOf('    function photoManagerHtml('),
  ),
  dom.getInternalVMContext(),
);
const serverContext = vm.createContext({});
vm.runInContext(
  backend.slice(
    backend.indexOf('function gaSanitizeHtml_('),
    backend.indexOf(
      '/* -------------------------------------------------------------------------- */',
      backend.indexOf('function gaSanitizeHtml_('),
    ),
  ),
  serverContext,
);

const formatted =
  '<p><b>Tebal</b> <i>Miring</i> <u>Garis</u></p><ul><li>Poin</li></ul><ol><li>Nomor</li></ol><p><a href="https://example.com/">Tautan</a></p>';
assert.equal(
  serverContext.gaSanitizeHtml_(w.sanitizeHtml(formatted)),
  formatted,
  'Format harus lolos sanitizer backend yang tetap digunakan.',
);
assert.equal(
  w.sanitizeHtml('<div>Satu</div><div>Dua</div>'),
  '<p>Satu</p><p>Dua</p>',
  'Baris Chrome tidak boleh menyatu setelah disimpan.',
);
assert.equal(
  w.sanitizeHtml(
    '<section><img src=x onerror=alert(1)><strong onclick="x()">A</strong><script>evil</script></section>',
  ),
  '<strong>A</strong>',
);
assert.equal(w.sanitizeHtml('<a href="java\nscript:alert(1)">X</a>'), '<a>X</a>');
assert.equal(
  w.safeEditorLink('http://example.com'),
  '',
  'Tolak protokol yang akan dibuang backend.',
);
assert.equal(w.safeEditorLink('https://example.com'), 'https://example.com/');

w.document.querySelector('form').innerHTML = w.richEditorHtml(
  { key: 'description', label: 'Isi Berita', required: true },
  'Pelayanan bersama',
);
const editor = w.document.querySelector('[contenteditable]'),
  textarea = w.document.querySelector('textarea');
let inputEvents = 0;
textarea.addEventListener('input', () => inputEvents++);
const calls = [];
w.document.queryCommandState = () => false;
w.document.execCommand = (command, _, value) => {
  calls.push({
    command,
    value,
    selection: w.getSelection().toString(),
    focused: w.document.activeElement === editor,
  });
  if (command === 'bold') editor.innerHTML = '<p><b>Pelayanan</b> bersama</p>';
  return true;
};
w.initRichEditor('description');
const range = w.document.createRange();
range.setStart(editor.firstChild.firstChild, 0);
range.setEnd(editor.firstChild.firstChild, 9);
w.getSelection().removeAllRanges();
w.getSelection().addRange(range);
editor.dispatchEvent(new w.MouseEvent('mouseup', { bubbles: true }));
const bold = w.document.querySelector('[data-command="bold"]');
bold.focus();
bold.click();
assert.equal(
  calls.at(-1).selection,
  'Pelayanan',
  'Klik toolbar lewat keyboard harus memulihkan seleksi.',
);
assert.equal(calls.at(-1).focused, true);
assert.equal(
  textarea.value,
  '<p><b>Pelayanan</b> bersama</p>',
  'Perintah harus langsung menyinkronkan data form.',
);
assert.ok(inputEvents >= 2, 'Form harus menerima perubahan dan mendeteksi draf belum tersimpan.');
assert.equal(new w.FormData(w.document.querySelector('form')).get('description'), textarea.value);

for (const command of [
  'italic',
  'underline',
  'insertUnorderedList',
  'insertOrderedList',
  'unlink',
  'removeFormat',
  'undo',
  'redo',
]) {
  w.document.querySelector('[data-command="' + command + '"]').click();
  assert.equal(calls.at(-1).command, command);
  assert.equal(calls.at(-1).focused, true);
}
w.document.querySelector('[data-command="createLink"]').click();
assert.equal(w.document.querySelector('.rich-link-panel').hidden, false);
w.document.querySelector('[data-link-url]').value = 'javascript:alert(1)';
w.document.querySelector('[data-link-apply]').click();
assert.match(w.document.querySelector('[data-link-error]').textContent, /HTTPS/);
w.document.querySelector('[data-link-cancel]').click();
assert.equal(w.document.querySelector('.rich-link-panel').hidden, true);
editor.innerHTML = '<p><br></p>';
editor.dispatchEvent(new w.Event('input', { bubbles: true }));
assert.equal(textarea.value, '', 'Kolom wajib tidak boleh dianggap terisi oleh paragraf kosong.');
const eventCount = inputEvents;
editor.dispatchEvent(new w.Event('blur'));
assert.equal(inputEvents, eventCount, 'Fokus tanpa perubahan tidak boleh menandai draf berubah.');
for (const script of source.matchAll(/<script>([\s\S]*?)<\/script>/g))
  new vm.Script(script[1].replace(/<\?!= JSON\.stringify\(appUrl \|\| ''\) \?>/, "''"));
assert.doesNotMatch(
  source,
  /id="content" data-route|\$\('#content'\)\.dataset\.route/,
  'Main content tidak boleh tertangkap sebagai tombol navigasi saat textbox diklik.',
);
console.log(
  'Admin editor PASS: selection restoration, all command dispatches, dirty state, form serialization, empty validation, unsafe links, and existing backend formatting parity.',
);
