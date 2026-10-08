import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const source = fs.readFileSync(path.join(root, 'apps-script-backend/VercelApi.gs'), 'utf8');
const viewer = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.match(
  source,
  /getWebsiteData:\s*function\s*\(args\)[\s\S]*?return\s+galileaGetWebsiteDataForViewer_\(\);/,
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
assert.match(
  source,
  /const width = Math\.max\(9, Math\.min\(sheet\.getLastColumn\(\), 9\)\);/,
  'Viewer adapter must read the media metadata column.'
);
assert.match(source, /media:\s*media,/, 'Viewer adapter must expose activity media.');
assert.match(viewer, /function activityMediaSlides\(item\)/, 'Viewer must normalize activity photos and media into one journal.');
assert.match(viewer, /class="journal-deck"/, 'Viewer must render the 3D Journal deck.');
assert.match(viewer, /object-fit:contain/, 'Journal media must preserve the original aspect ratio.');
assert.doesNotMatch(viewer, /data-media-finder=|data-reset-activity-filter|mediaDiscoveryHtml/, 'Home and archive must not display media filters.');
assert.match(viewer, /data-share-media/, 'Every journal media item must expose share mode.');
assert.match(viewer, /download aria-label="Download/, 'Every journal media item must expose download mode.');
assert.match(viewer, /function shiftJournalDeck\(wrap,step\)/, 'Journal deck must support navigation and swipe handling.');

console.log('OK - Public News Activities Viewer Reconciliation: 13/13 passed.');
