import fs from 'node:fs';

// Tes lama tetap memeriksa CSS dan JavaScript yang dipakai halaman.
export function readViewerSource() {
  return fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8')
    .replace(/<link rel="stylesheet" href="\/viewer\.css[^\"]*">/, () =>
      '<style>' + fs.readFileSync(new URL('../viewer.css', import.meta.url), 'utf8') + '</style>')
    .replace(/<script src="\/viewer\.js[^\"]*" defer><\/script>/, () =>
      '<script>\n' + fs.readFileSync(new URL('../viewer.js', import.meta.url), 'utf8') + '</script>');
}
