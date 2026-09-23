import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const websiteCode = read('apps-script-backend/Website.gs');
const adminCode = read('apps-script-backend/Admin.gs');
const indexHtml = read('index.html');

let htmlToWaTextStr = indexHtml.match(/function htmlToWaText\([\s\S]*?^      }/m)[0];

const context = vm.createContext({ console, String, RegExp, Date, Number, Array });

vm.runInContext(`
  function gaEntityDefinitions_() {
    return {
      activities: {
        fields: [
          { key: 'date', type: 'text', required: true },
          { key: 'title', type: 'text', required: true },
          { key: 'description', type: 'textarea' },
          { key: 'photos', type: 'images' }
        ]
      }
    };
  }
  
  function gwClean_(str) { return String(str || '').trim(); }
  function gwSafeUrl_(url) { return /^https:\\/\\//i.test(url) ? url : ''; }
  
  ${websiteCode.replace(/function gwClean_[\s\S]*?\n\}/, '').replace(/function gwSafeUrl_[\s\S]*?\n\}/, '')}
  ${adminCode}
  
  globalThis.gaSanitizePayload_ = gaSanitizePayload_;
  globalThis.gwActivityCover_ = gwActivityCover_;
  globalThis.gwActivityPhotos_ = gwActivityPhotos_;
  globalThis.gaSanitizeHtml_ = gaSanitizeHtml_;
  
  ${htmlToWaTextStr}
  globalThis.htmlToWaText = htmlToWaText;
`, context);

let passed = 0;
let total = 0;

function runTest(name, fn) {
  total++;
  try {
    fn();
    passed++;
  } catch (e) {
    console.error('FAIL: ' + name);
    console.error(e);
  }
}

// 1. WhatsApp Text Converter Tests
runTest('htmlToWaText - regression', () => {
  const input = '<p>Paragraf pertama.</p>\n<p>Paragraf kedua dengan <strong>bold</strong>.</p>\n<p><em>Italic</em> dan <u>underline</u>.</p>\n<ul>\n<li>Poin satu</li>\n<li>Poin dua</li>\n</ul>\n<ol>\n<li>Langkah satu</li>\n<li>Langkah dua</li>\n</ol>\n<a href="https://example.com">Website</a>';
  const expected = 'Paragraf pertama.\n\nParagraf kedua dengan *bold*.\n\n_Italic_ dan underline.\n\n* Poin satu\n* Poin dua\n\n1. Langkah satu\n2. Langkah dua\n\nWebsite (https://example.com)';
  const result = context.htmlToWaText(input);
  assert.equal(result, expected);
});

runTest('htmlToWaText - character safety', () => {
  const input = '<p>Test &amp; test &nbsp; </p>';
  const result = context.htmlToWaText(input);
  assert.doesNotMatch(result, /<p>/);
  assert.doesNotMatch(result, /&amp;/);
  assert.doesNotMatch(result, /&nbsp;/);
  assert.equal(result, 'Test & test');
});

// 2. Server-Side HTML Sanitization (gaSanitizeHtml_)
runTest('gaSanitizeHtml_ - XSS removal', () => {
  const input = '<p>Hello <script>alert(1)</script><a href="javascript:alert(1)">X</a></p>';
  const result = context.gaSanitizeHtml_(input);
  assert.doesNotMatch(result, /script/i);
  assert.doesNotMatch(result, /javascript:/i);
  assert.equal(result, '<p>Hello <a>X</a></p>');
});

runTest('gaSanitizeHtml_ - allowed tags preserved', () => {
  const input = '<ul><li><strong>Bold</strong> <a href="https://example.com">Link</a></li></ul>';
  const result = context.gaSanitizeHtml_(input);
  assert.equal(result, input);
});

// 3. Primary Photo Storage logic
runTest('gaSanitizePayload_ - PRIMARY photo preservation', () => {
  const payload = {
    title: 'Test',
    date: '2026-01-01',
    description: 'Test',
    photos: 'https://example.com/a.jpg\nPRIMARY:https://example.com/b.jpg\nhttps://example.com/c.jpg'
  };
  const result = context.gaSanitizePayload_('activities', payload);
  const expected = 'https://example.com/a.jpg\nPRIMARY:https://example.com/b.jpg\nhttps://example.com/c.jpg';
  assert.equal(result.photos, expected);
});

// 4. Primary Photo Extractor (gwActivityCover_ and gwActivityPhotos_)
runTest('gwActivityCover_ - parses PRIMARY', () => {
  const input = 'https://example.com/a.jpg\nPRIMARY:https://example.com/b.jpg\nhttps://example.com/c.jpg';
  const cover = context.gwActivityCover_(input);
  assert.equal(cover, 'https://example.com/b.jpg');
});

runTest('gwActivityPhotos_ - strips PRIMARY prefix', () => {
  const input = 'https://example.com/a.jpg\nPRIMARY:https://example.com/b.jpg\nhttps://example.com/c.jpg';
  const photos = context.gwActivityPhotos_(input);
  assert.deepEqual(Array.from(photos), [
    'https://example.com/a.jpg',
    'https://example.com/b.jpg',
    'https://example.com/c.jpg'
  ]);
});

runTest('gwActivityCover_ - fallback to first', () => {
  const input = 'https://example.com/a.jpg\nhttps://example.com/b.jpg';
  const cover = context.gwActivityCover_(input);
  assert.equal(cover, 'https://example.com/a.jpg');
});

runTest('Multiple News Thumbnails Simulation', () => {
  const newsA = 'PRIMARY:https://example.com/a2.jpg';
  const newsB = 'PRIMARY:https://example.com/b3.jpg';
  const newsC = 'PRIMARY:https://example.com/c1.jpg';
  
  assert.equal(context.gwActivityCover_(newsA), 'https://example.com/a2.jpg');
  assert.equal(context.gwActivityCover_(newsB), 'https://example.com/b3.jpg');
  assert.equal(context.gwActivityCover_(newsC), 'https://example.com/c1.jpg');
});

console.log('OK · News System Overhaul Tests: ' + passed + '/' + total + ' passed.');
if (passed !== total) process.exit(1);
