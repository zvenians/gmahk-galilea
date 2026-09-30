import assert from 'node:assert';

const CANONICAL_DEPLOYMENT_ID = 'AKfycbxOkCVxWcipB8IY6Y9ToTuWfJ-XQAM5VBJLx33qeuuUU8jmaVJjCitgimo50Mq15n_68Q';

async function runProductionCheck() {
  console.log('--- STARTING PRODUCTION RUNTIME VERIFICATION ---');
  try {
    const response = await fetch('https://gmahk-galilea.vercel.app/admin', { redirect: 'manual' });
    
    console.log('HTTP Status:', response.status);
    assert.strictEqual(response.status, 307, 'Response status should be 307');

    const location = response.headers.get('location');
    console.log('Location Header:', location);
    assert.ok(location, 'Location header must be present');
    assert.match(location, /\?page=admin/, 'Location must contain ?page=admin');
    assert.match(location, new RegExp(CANONICAL_DEPLOYMENT_ID), 'Location must contain the canonical deployment ID');
    
    // Ensure no old/stale IDs are present
    assert.doesNotMatch(location, /AKfycbyQcY5P0e_tcLdFhrTdjEHvO15zeiMXcJ8KZFXiIN0PNCOWZnjf-DkRW4kHN5Jvv1iUKg/, 'Location must not contain Vercel stale ID');
    assert.doesNotMatch(location, /AKfycbzcZfVYt2IfLh8raFPGsZqzNyIbLrfyDrDd0Xh6KeOlqxwHrxvEPi8PqlWJsykugNN6qg/, 'Location must not contain legacy sync ID');

    console.log('PRODUCTION RUNTIME VERIFIED SUCCESSFULLY');
  } catch (error) {
    console.error('PRODUCTION RUNTIME VERIFICATION FAILED:', error.message);
    process.exit(1);
  }
}

runProductionCheck();
