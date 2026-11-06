import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const script = fileURLToPath(new URL('../scripts/check-apps-script-version-capacity.mjs', import.meta.url));

function check(output) {
  return spawnSync(process.execPath, [script], { input: output, encoding: 'utf8' });
}

test('permits a release with two version slots remaining', () => {
  const result = check('Found 198 versions.\n1 - older\n198 - latest\n');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /2 free/);
});

test('requires two slots for Admin and API snapshots', () => {
  for (const count of [199, 200]) {
    const result = check('Found ' + count + ' versions.\n');
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stderr, /quota/i);
    assert.match(result.stderr, /Nothing has been pushed/);
  }
});

test('accepts singular version summary', () => {
  assert.equal(check('Found 1 version.\n1 - initial\n').status, 0);
});

test('fails closed for unavailable or unexpected clasp output', () => {
  for (const output of ['', 'OAuth token expired', 'Found 201 versions.\n', 'Found unknown versions.\n']) {
    const result = check(output);
    assert.equal(result.status, 1, output);
    assert.match(result.stderr, /::error/);
  }
});
