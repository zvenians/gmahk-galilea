import { readFileSync } from 'node:fs';

// One Apps Script project publishes two distinct snapshots: Admin and Public API.
// Check capacity before either clasp push, so a quota error never leaves an
// unpublished Admin manifest in the remote project's editable HEAD.
const VERSION_LIMIT = 200;
const REQUIRED_FREE_SLOTS = 2;
const output = readFileSync(0, 'utf8').replace(/\x1b\[[0-9;]*m/g, '');
const match = output.match(/^Found\s+(\d+)\s+versions?\.\s*$/m);

if (!match) {
  console.error('::error title=Apps Script version preflight::Cannot determine the version count from clasp list-versions. Nothing has been pushed.');
  process.exit(1);
}

const versionCount = Number(match[1]);
const available = VERSION_LIMIT - versionCount;
if (!Number.isSafeInteger(versionCount) || versionCount < 0 || available < 0) {
  console.error('::error title=Apps Script version preflight::Unexpected version count; refusing to push.');
  process.exit(1);
}

if (available < REQUIRED_FREE_SLOTS) {
  console.error('::error title=Apps Script version quota::' +
    'Project has ' + versionCount + ' of ' + VERSION_LIMIT +
    ' versions (' + available + ' free), but this release requires ' +
    REQUIRED_FREE_SLOTS + ' free slots. In Apps Script Project History, bulk-delete unused versions not linked to active deployments, then use workflow_dispatch with deploy_backend=true. Nothing has been pushed.');
  process.exit(1);
}

console.log('Apps Script version capacity: ' + versionCount + '/' +
  VERSION_LIMIT + '; ' + available + ' free; ' + REQUIRED_FREE_SLOTS + ' required.');
