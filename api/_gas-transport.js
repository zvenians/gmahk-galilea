// Only public reads may be replayed. A timed-out write may already have committed.
export async function callAppsScript(url, body, {fetcher = fetch, timeoutMs = 52000} = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const attempts = body.method === 'submitServiceRequest' ? 1 : 2;
  try {
    for (let attempt = 0; attempt < attempts; attempt++) {
      let response;
      try {
        response = await fetcher(url, {
          method: 'POST',
          headers: {'Content-Type': 'text/plain; charset=utf-8', Accept: 'application/json'},
          body: JSON.stringify(body), redirect: 'manual', signal: controller.signal
        });
        // ContentService returns a one-time URL. Follow as GET, without the secret.
        if ([301, 302, 303].includes(response.status)) {
          const target = new URL(response.headers.get('location') || '', url);
          if (target.protocol !== 'https:' || target.hostname !== 'script.googleusercontent.com') {
            throw new Error('Deployment API meminta login atau mengarah ke alamat yang tidak didukung. Periksa akses publik Apps Script.');
          }
          response = await fetcher(target.toString(), {
            method: 'GET', headers: {Accept: 'application/json'}, redirect: 'error', signal: controller.signal
          });
        }
        const text = await response.text();
        let payload;
        try { payload = JSON.parse(text); }
        catch (_) {
          console.warn('[gas] Non-JSON upstream', {method: body.method, status: response.status, attempt: attempt + 1});
          if (attempt + 1 < attempts) continue;
          throw new Error('Sambungan data Google sedang terganggu. Coba lagi beberapa saat; data tersimpan tetap dapat digunakan.');
        }
        if (response.status >= 500 && attempt + 1 < attempts) continue;
        return {response, payload};
      } catch (error) {
        if (controller.signal.aborted || attempt + 1 >= attempts || /meminta login/.test(error.message)) throw error;
        console.warn('[gas] Retrying public read', {method: body.method, attempt: attempt + 1});
      }
    }
  } finally { clearTimeout(timer); }
}
