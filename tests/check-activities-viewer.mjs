import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const source = fs.readFileSync(path.join(root, 'apps-script-backend/VercelApi.gs'), 'utf8');

assert.match(
  source,
  /getWebsiteData:\s*function\s*\(args\)\s*\{\s*return\s+galileaGetWebsiteDataForViewer_\(\);/,
  'Public getWebsiteData handler must use the viewer reconciliation adapter.'
);
assert.match(
  source,
  /item\.status\s*===\s*'publish'\s*&&\s*item\.title\s*&&\s*item\.dateValue\s*<=\s*today/,
  'Viewer activity reconciliation must include published activities dated today.'
);
assert.match(
  source,
  /data\.activities\s*=\s*raw\.map\(function\s*\(row,\s*index\)/,
  'Viewer adapter must rebuild activities from the same Website Kegiatan sheet.'
);
assert.match(
  source,
  /\.slice\(0,\s*24\)/,
  'Viewer activity result must retain the existing public 24-item cap.'
);

console.log('OK - Public News Activities Viewer Reconciliation: 4/4 passed.');
