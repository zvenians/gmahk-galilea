import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const bridge = readFileSync(new URL('../apps-script-backend/VercelApi.gs', import.meta.url), 'utf8');
const admin = readFileSync(new URL('../api/admin.js', import.meta.url), 'utf8');

// The bridge may return a secret to its authorized Apps Script editor,
// but must never print that value to logs.
const logs = [];
const values = new Map();
const ctx = vm.createContext({
  console: { log: (...args) => logs.push(args.join(' ')), error: (...args) => logs.push(args.join(' ')) },
  PropertiesService: {
    getScriptProperties: () => ({
      getProperty: key => values.get(key),
      setProperty: (key, value) => values.set(key, value)
    })
  },
  Utilities: {
    getUuid: () => '01234567-89ab-cdef-0123-456789abcdef'
  }
});
vm.runInContext(bridge, ctx, { filename: 'VercelApi.gs' });
const first = vm.runInContext('generateGalileaVercelSecret()', ctx);
const second = vm.runInContext('generateGalileaVercelSecret()', ctx);
assert.equal(first, second, 'Secret regeneration must not rotate an existing value');
assert.ok(first.length >= 32, 'Expected a valid length secret');
assert.ok(!logs.join(' ').includes(first), 'Generated secret appeared in execution logs');

assert.doesNotMatch(admin, /console\.(?:log|info|error)\s*\([^\n]*text\.slice\s*\(/);
assert.doesNotMatch(admin, /\[APPS_SCRIPT_RES\]/);
assert.doesNotMatch(bridge, /console\.(?:log|info|error)\s*\([^\n]*GALILEA_API_SECRET\s*=/);

const { default: adminHandler } = await import('../api/admin.js');
const previousFetch = globalThis.fetch;
const previousUrl = process.env.GALILEA_APPS_SCRIPT_API_URL;
const previousSecret = process.env.GALILEA_API_SECRET;
const previousLog = console.log;
const recorded = [];
const marker = 'PRIVATE_RESPONSE_MARKER_DO_NOT_DISPLAY';
process.env.GALILEA_APPS_SCRIPT_API_URL = 'https://script.google.com/macros/s/TEST_ID/exec';
process.env.GALILEA_API_SECRET = 'test-value-not-a-real-secret';
console.log = (...args) => recorded.push(args.join(' '));

function response() {
  return {
    statusCode: 200,
    payload: null,
    setHeader() {},
    status(value) { this.statusCode = value; return this; },
    json(payload) { this.payload = payload; return this; }
  };
}
try {
  for (const [status, contentType] of [[503, 'text/plain'], [200, 'text/html']]) {
    globalThis.fetch = async () => ({
      ok: status === 200,
      status,
      headers: { get: () => contentType },
      text: async () => marker
    });
    const res = response();
    await adminHandler({ method: 'POST', body: { method: 'getWebsiteData', args: [] } }, res);
    assert.equal(res.statusCode, 502);
    assert.ok(!JSON.stringify(res.payload).includes(marker), 'Private upstream body exposed to API caller');
  }
  assert.ok(!recorded.join(' ').includes(marker), 'Private upstream body exposed to server logs');
} finally {
  console.log = previousLog;
  globalThis.fetch = previousFetch;
  if (previousUrl === undefined) delete process.env.GALILEA_APPS_SCRIPT_API_URL;
  else process.env.GALILEA_APPS_SCRIPT_API_URL = previousUrl;
  if (previousSecret === undefined) delete process.env.GALILEA_API_SECRET;
  else process.env.GALILEA_API_SECRET = previousSecret;
}
console.log('Safe logging and backend-error responses verified.');
