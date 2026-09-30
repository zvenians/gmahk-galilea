const fs = require('fs');
const { execSync } = require('child_process');
const assert = require('assert');

const CANONICAL_DEPLOYMENT_ID = 'AKfycbxOkCVxWcipB8IY6Y9ToTuWfJ-XQAM5VBJLx33qeuuUU8jmaVJjCitgimo50Mq15n_68Q';

console.log('--- STARTING VERCEL ENV CONFIG VERIFICATION ---');

try {
  // Pull for Development
  execSync('npx vercel env pull .env.development.local --environment=development --yes', { stdio: 'ignore' });
  const devEnv = fs.readFileSync('.env.development.local', 'utf-8');
  assert.match(devEnv, new RegExp(`GALILEA_APPS_SCRIPT_ADMIN_URL.*${CANONICAL_DEPLOYMENT_ID}`), 'Development env must match canonical ID');
  console.log('✓ Development Environment: Verified');

  // Pull for Preview
  execSync('npx vercel env pull .env.preview.local --environment=preview --yes', { stdio: 'ignore' });
  const previewEnv = fs.readFileSync('.env.preview.local', 'utf-8');
  assert.match(previewEnv, new RegExp(`GALILEA_APPS_SCRIPT_ADMIN_URL.*${CANONICAL_DEPLOYMENT_ID}`), 'Preview env must match canonical ID');
  console.log('✓ Preview Environment: Verified');

  // Pull for Production
  execSync('npx vercel env pull .env.production.local --environment=production --yes', { stdio: 'ignore' });
  const prodEnv = fs.readFileSync('.env.production.local', 'utf-8');
  assert.match(prodEnv, new RegExp(`GALILEA_APPS_SCRIPT_ADMIN_URL.*${CANONICAL_DEPLOYMENT_ID}`), 'Production env must match canonical ID');
  console.log('✓ Production Environment: Verified');

  // Cleanup
  fs.unlinkSync('.env.development.local');
  fs.unlinkSync('.env.preview.local');
  fs.unlinkSync('.env.production.local');

  console.log('VERCEL ENV CONFIG VERIFIED SUCCESSFULLY');
} catch (err) {
  console.error('VERCEL ENV CONFIG VERIFICATION FAILED:', err.message);
  process.exit(1);
}
