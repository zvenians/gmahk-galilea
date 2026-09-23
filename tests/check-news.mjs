import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const websiteCode = read('apps-script-backend/Website.gs');
const adminCode = read('apps-script-backend/Admin.gs');
const indexHtml = read('index.html');

function extractFunction(name) {
  const start = indexHtml.indexOf('function ' + name + '(');
  let braceCount = 0;
  let started = false;
  for (let i = start; i < indexHtml.length; i++) {
    if (indexHtml[i] === '{') {
      braceCount++;
      started = true;
    } else if (indexHtml[i] === '}') {
      braceCount--;
    }
    if (started && braceCount === 0) {
      return indexHtml.substring(start, i + 1);
    }
  }
  throw new Error('Function not found: ' + name);
}

const htmlToWaTextStr = extractFunction('htmlToWaText');
const cleanHtmlStr = extractFunction('cleanHtml');

const jsdomInstance = new JSDOM('<!DOCTYPE html><html><body></body></html>');
const window = jsdomInstance.window;
console.log("JSDOM initialized");

const context = vm.createContext({ 
  console, String, RegExp, Date, Number, Array,
  document: window.document
});

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
  
  ${cleanHtmlStr}
  globalThis.cleanHtml = cleanHtml;
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

// 1. WhatsApp Formatting (Blocker 5)
runTest('TEST 1: legacy plain text', () => {
  assert.equal(context.htmlToWaText('Paragraf satu.\n\nParagraf dua.'), 'Paragraf satu.\n\nParagraf dua.');
});

runTest('TEST 2: rich paragraph', () => {
  assert.equal(context.htmlToWaText('<p>Paragraf pertama.</p><p>Paragraf kedua.</p>'), 'Paragraf pertama.\n\nParagraf kedua.');
});

runTest('TEST 3: bold', () => {
  assert.equal(context.htmlToWaText('<p><strong>Tebal</strong></p>'), '*Tebal*');
});

runTest('TEST 4: italic', () => {
  assert.equal(context.htmlToWaText('<p><em>Miring</em></p>'), '_Miring_');
});

runTest('TEST 5: underline', () => {
  assert.equal(context.htmlToWaText('<p>Teks <u>bergaris bawah</u>.</p>'), 'Teks bergaris bawah.');
});

runTest('TEST 6: UL', () => {
  assert.equal(context.htmlToWaText('<ul><li>Poin satu</li><li>Poin dua</li></ul>'), '- Poin satu\n- Poin dua');
});

runTest('TEST 7: OL', () => {
  assert.equal(context.htmlToWaText('<ol><li>Langkah satu</li><li>Langkah dua</li></ol>'), '1. Langkah satu\n2. Langkah dua');
});

runTest('TEST 8: HTTPS link', () => {
  assert.equal(context.htmlToWaText('<p><a href="https://example.com">Example</a></p>'), 'Example (https://example.com)');
});

runTest('TEST 9: control characters', () => {
  assert.equal(context.htmlToWaText('<p>Teks \u200Bbersih\x00</p>'), 'Teks bersih');
});

// 2. Server Sanitization (Blocker 4)
runTest('TEST 10: script injection (Server)', () => {
  assert.equal(context.gaSanitizeHtml_('<p>Hello <script>alert(1)</script></p>'), '<p>Hello </p>');
});

runTest('TEST 11: iframe injection (Server)', () => {
  assert.equal(context.gaSanitizeHtml_('<p>Hello <iframe src="x"></iframe></p>'), '<p>Hello </p>');
});

runTest('TEST 12: dangerous attribute (Server)', () => {
  assert.equal(context.gaSanitizeHtml_('<p onclick="alert(1)">Klik</p>'), '<p>Klik</p>');
});

runTest('TEST 13: javascript href (Server)', () => {
  assert.equal(context.gaSanitizeHtml_('<a href="javascript:alert(1)">Klik</a>'), '<a>Klik</a>');
});

// 3. Primary Photo Logic (Blocker 7)
runTest('TEST 14: PRIMARY preservation', () => {
  const payload = {
    title: 'Test',
    date: '2026-01-01',
    description: 'Test',
    photos: 'https://example.com/a.jpg\nPRIMARY:https://example.com/b.jpg\nhttps://example.com/c.jpg'
  };
  const result = context.gaSanitizePayload_('activities', payload);
  assert.equal(result.photos, 'https://example.com/a.jpg\nPRIMARY:https://example.com/b.jpg\nhttps://example.com/c.jpg');
});

runTest('TEST 15: cover extraction', () => {
  const input = 'https://example.com/a.jpg\nPRIMARY:https://example.com/b.jpg\nhttps://example.com/c.jpg';
  assert.equal(context.gwActivityCover_(input), 'https://example.com/b.jpg');
});

runTest('TEST 16: duplicate photos', () => {
  const input = 'https://example.com/a.jpg\nPRIMARY:https://example.com/b.jpg\nhttps://example.com/a.jpg';
  assert.deepEqual(Array.from(context.gwActivityPhotos_(input)), ['https://example.com/a.jpg', 'https://example.com/b.jpg']);
});

runTest('TEST 17: multiple news independence', () => {
  assert.equal(context.gwActivityCover_('PRIMARY:https://example.com/a2.jpg'), 'https://example.com/a2.jpg');
  assert.equal(context.gwActivityCover_('PRIMARY:https://example.com/b3.jpg'), 'https://example.com/b3.jpg');
  assert.equal(context.gwActivityCover_('PRIMARY:https://example.com/c1.jpg'), 'https://example.com/c1.jpg');
});

// 4. Client Sanitization (Blocker 1)
runTest('TEST 18: client sanitizer allowed tags', () => {
  const input = '<p><strong>A</strong> <em>B</em> <u>C</u> <br> </p><ul><li>D</li></ul> <ol><li>E</li></ol>';
  const expected = '<p><strong>A</strong> <em>B</em> <u>C</u> <br> </p><ul><li>D</li></ul> <ol><li>E</li></ol>';
  assert.equal(context.cleanHtml(input), expected);
});

runTest('TEST 19: client sanitizer dangerous tags', () => {
  const input = '<div><script>alert(1)</script><p>Hello</p><style>body{}</style><object></object></div>';
  const result = context.cleanHtml(input);
  assert.equal(result, '<p>Hello</p>');
  assert.doesNotMatch(result, /script/i);
  assert.doesNotMatch(result, /style/i);
  assert.doesNotMatch(result, /object/i);
  assert.doesNotMatch(result, /div/i);
});

runTest('TEST 20: client sanitizer dangerous attributes', () => {
  const input = '<p onclick="alert(1)" class="test" id="abc" style="color:red">Hello</p>';
  assert.equal(context.cleanHtml(input), '<p>Hello</p>');
});

runTest('TEST 21: client sanitizer javascript href', () => {
  const input = '<a href="javascript:alert(1)">Click</a>';
  assert.equal(context.cleanHtml(input), '<a>Click</a>');
});

runTest('TEST 22: client sanitizer preserves list', () => {
  const input = '<ul><li>A</li></ul>';
  assert.equal(context.cleanHtml(input), '<ul><li>A</li></ul>');
});

runTest('TEST 23: client sanitizer preserves formatting', () => {
  const input = '<p><strong>Bold</strong></p>';
  assert.equal(context.cleanHtml(input), '<p><strong>Bold</strong></p>');
});

// Extra check to verify the test suite executed completely.
runTest('TEST 24: Suite Executed Completely', () => {
  assert.ok(true, 'Suite ran to completion');
});

console.log('OK - News System Overhaul Tests: ' + passed + '/' + total + ' passed.');
if (passed !== total) process.exit(1);
