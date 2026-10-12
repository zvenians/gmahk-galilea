const BUILD = 'GALILEA-THUMBNAIL-35.0.0';

function fallbackSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" role="img" aria-label="Video Galilea">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#07170d"/>
        <stop offset=".62" stop-color="#17452b"/>
        <stop offset="1" stop-color="#2f5940"/>
      </linearGradient>
      <radialGradient id="glow" cx=".78" cy=".22" r=".52">
        <stop stop-color="#d9bd74" stop-opacity=".28"/>
        <stop offset="1" stop-color="#d9bd74" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#bg)"/>
    <rect width="1280" height="720" fill="url(#glow)"/>
    <g fill="#f4e5b0" opacity=".16">
      <rect x="940" y="126" width="42" height="336" rx="12"/>
      <rect x="820" y="244" width="282" height="42" rx="12"/>
    </g>
    <circle cx="640" cy="360" r="82" fill="#f7f5ed" fill-opacity=".94"/>
    <path d="M618 314v92l75-46z" fill="#173d28"/>
    <text x="640" y="574" fill="#f4e5b0" font-family="Arial, sans-serif" font-size="28" font-weight="700" letter-spacing="7" text-anchor="middle">VIDEO RESMI GALILEA</text>
  </svg>`;
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ ok: false, error: 'Metode tidak didukung.' });
  }
  const id = String((request.query && request.query.id) || '').trim();
  if (!/^[A-Za-z0-9_-]{11}$/.test(id)) {
    return response.status(400).json({ ok: false, error: 'ID video tidak valid.' });
  }
  const candidates = ['maxresdefault.jpg', 'hqdefault.jpg', 'mqdefault.jpg'];
  for (const file of candidates) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const source = await fetch('https://i.ytimg.com/vi/' + id + '/' + file, {
        headers: { Accept: 'image/avif,image/webp,image/jpeg,*/*', 'User-Agent': BUILD },
        redirect: 'follow',
        signal: controller.signal,
      });
      if (!source.ok) continue;
      const type = String(source.headers.get('content-type') || '');
      const bytes = Buffer.from(await source.arrayBuffer());
      if (!/^image\//i.test(type) || bytes.length < 900) continue;
      response.setHeader('Content-Type', type);
      response.setHeader(
        'Cache-Control',
        'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      );
      response.setHeader('X-Galilea-Build', BUILD);
      return response.status(200).send(bytes);
    } catch (_) {
      // Coba resolusi berikutnya.
    } finally {
      clearTimeout(timer);
    }
  }
  response.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  response.setHeader(
    'Cache-Control',
    'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
  );
  response.setHeader('X-Galilea-Build', BUILD);
  return response.status(200).send(fallbackSvg());
}
