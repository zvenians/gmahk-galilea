
export default async function handler(request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const baseUrl = protocol + '://' + host;

  let title = 'Berita Jemaat — GMAHK Galilea Balikpapan';
  let description = 'Kabar, informasi, dan dokumentasi kegiatan Jemaat Galilea Balikpapan.';
  let image = baseUrl + '/api/og';
  const canonical = baseUrl + '/berita/' + encodeURIComponent(id || '');

  try {
    if (id) {
      const response = await fetch(baseUrl + '/api/gas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'getWebsiteData', args: [] })
      });
      
      if (response.ok) {
        const json = await response.json();
        if (json.ok && json.data && Array.isArray(json.data.activities)) {
          const activity = json.data.activities.find(a => String(a.id) === String(id));
          if (activity) {
            title = activity.title + ' — Berita Jemaat';
            description = (activity.description || description).slice(0, 160);
            
            const cover = activity.coverUrl || (activity.photos && activity.photos[0]);
            if (cover) {
              image = baseUrl + '/api/news-og?id=' + encodeURIComponent(id);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('[berita-og] Failed to fetch data:', error);
  }

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  
  <meta property="og:type" content="article">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta property="og:site_name" content="GMAHK Galilea Balikpapan">
  
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${escapeHtml(canonical)}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">
  
  <script>
    window.location.replace("/#berita/${encodeURIComponent(id || '')}");
  </script>
</head>
<body>
  <p>Mengalihkan ke halaman Berita Jemaat...</p>
  <noscript>
    <p>Silakan klik tautan berikut: <a href="/#berita/${encodeURIComponent(id || '')}">Buka Berita</a></p>
  </noscript>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
    }
  });
}

function escapeHtml(unsafe) {
  return String(unsafe || '')
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
