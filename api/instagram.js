const BUILD = 'GALILEA-INSTAGRAM-32.0.0';
const DEFAULT_API_VERSION = 'v25.0';
const DEFAULT_USERNAME = 'advent.galilea';

function reply(response, status, body, cacheable) {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader(
    'Cache-Control',
    cacheable ? 'public, s-maxage=60, stale-while-revalidate=300' : 'no-store, max-age=0',
  );
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Galilea-Build', BUILD);
  return response.status(status).json(body);
}

function clean(value, maxLength) {
  return String(value == null ? '' : value)
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .trim()
    .slice(0, maxLength || 500);
}

function instagramUrl(value) {
  try {
    const url = new URL(String(value || ''));
    if (url.protocol !== 'https:' || !/(^|\.)instagram\.com$/i.test(url.hostname)) return '';
    return url.toString();
  } catch (_) {
    return '';
  }
}

function publishedLabel(timestamp) {
  const parsed = Date.parse(String(timestamp || ''));
  if (!Number.isFinite(parsed)) return '';
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Makassar',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(parsed));
}

function mediaTime(item) {
  const parsed = Date.parse(String((item && item.timestamp) || ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function isReel(item) {
  const product = clean(item && item.media_product_type, 30).toUpperCase();
  const permalink = instagramUrl(item && item.permalink);
  return product === 'REELS' || /\/reel\//i.test(permalink);
}

function reelPayload(item, username) {
  const permalink = instagramUrl(item && item.permalink);
  const match = permalink && new URL(permalink).pathname.match(/^\/reel\/([^/]+)/i);
  if (!match) return null;
  const shortcode = clean(match[1], 80);
  return {
    id: clean(item.id, 120),
    username: clean(item.username || username, 40),
    caption: clean(item.caption, 1200),
    permalink,
    embedUrl: 'https://www.instagram.com/reel/' + encodeURIComponent(shortcode) + '/embed/',
    timestamp: clean(item.timestamp, 80),
    publishedLabel: publishedLabel(item.timestamp),
  };
}

function reelFromPermalink(permalink, username, caption, timestamp, source) {
  const safe = instagramUrl(permalink);
  const match = safe && new URL(safe).pathname.match(/^\/reel\/([^/]+)/i);
  if (!match) return null;
  const shortcode = clean(match[1], 80);
  return {
    id: shortcode,
    username: clean(username, 40),
    caption: clean(caption || 'Reel terbaru dari @' + username + '.', 1200),
    permalink: 'https://www.instagram.com/reel/' + encodeURIComponent(shortcode) + '/',
    embedUrl: 'https://www.instagram.com/reel/' + encodeURIComponent(shortcode) + '/embed/',
    timestamp: clean(timestamp, 80),
    publishedLabel: publishedLabel(timestamp),
    source: source || 'Instagram publik',
  };
}

function decodeJsonText(value) {
  try {
    return JSON.parse('"' + String(value || '').replace(/"/g, '\\"') + '"');
  } catch (_) {
    return String(value || '')
      .replace(/\\u0026/g, '&')
      .replace(/\\\//g, '/');
  }
}

function publicReelCandidates(html, username) {
  const normalized = String(html || '')
    .replace(/\\u002F/gi, '/')
    .replace(/\\\//g, '/');
  const matches = [];
  const seen = new Set();
  const pattern = /(?:https:\/\/www\.instagram\.com)?\/reel\/([A-Za-z0-9_-]{5,80})\/?/g;
  let hit;
  while ((hit = pattern.exec(normalized))) {
    const shortcode = hit[1];
    if (seen.has(shortcode)) continue;
    seen.add(shortcode);
    const nearby = normalized.slice(
      Math.max(0, hit.index - 4500),
      Math.min(normalized.length, hit.index + 4500),
    );
    const unix = Number(
      (nearby.match(/"(?:taken_at|taken_at_timestamp|device_timestamp)"\s*:\s*(\d{9,13})/) ||
        [])[1] || 0,
    );
    const iso = (nearby.match(/"timestamp"\s*:\s*"([^"\\]{8,80})"/) || [])[1] || '';
    const caption = (nearby.match(/"text"\s*:\s*"((?:\\.|[^"\\]){1,1200})"/) || [])[1] || '';
    const timestamp = iso || (unix ? new Date(unix > 1e12 ? unix : unix * 1000).toISOString() : '');
    const reel = reelFromPermalink(
      'https://www.instagram.com/reel/' + shortcode + '/',
      username,
      decodeJsonText(caption),
      timestamp,
      'Instagram publik',
    );
    if (reel) matches.push({ reel, order: hit.index, time: Date.parse(timestamp) || 0 });
  }
  return matches.sort((a, b) => b.time - a.time || a.order - b.order).map((item) => item.reel);
}

async function fetchPublicLatestReel(username) {
  const pages = [
    'https://www.instagram.com/' + encodeURIComponent(username) + '/reels/',
    'https://www.instagram.com/' + encodeURIComponent(username) + '/',
  ];
  for (const url of pages) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const upstream = await fetch(url, {
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'id-ID,id;q=0.9,en;q=0.6',
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/131 Mobile Safari/537.36',
          'X-IG-App-ID': '936619743392459',
        },
        redirect: 'follow',
        signal: controller.signal,
      });
      if (!upstream.ok) continue;
      const reels = publicReelCandidates(await upstream.text(), username);
      if (reels.length) return reels[0];
    } catch (_) {
      /* Halaman publik Instagram dapat membatasi pusat data tertentu. */
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

async function fetchOfficialLatestReel(token, accountId, username, version, host) {
  const endpoint = new URL(
    'https://' + host + '/' + version + '/' + encodeURIComponent(accountId) + '/media',
  );
  endpoint.searchParams.set(
    'fields',
    'id,username,caption,media_type,media_product_type,permalink,timestamp',
  );
  endpoint.searchParams.set('limit', '50');
  endpoint.searchParams.set('access_token', token);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 14000);
  try {
    const upstream = await fetch(endpoint, {
      headers: { Accept: 'application/json', 'User-Agent': BUILD },
      signal: controller.signal,
    });
    const payload = await upstream.json().catch(() => null);
    if (!upstream.ok || !payload || !Array.isArray(payload.data)) {
      const message = payload && payload.error && payload.error.message;
      throw new Error(clean(message, 180) || 'Instagram API belum dapat dihubungkan.');
    }
    const latest = payload.data.filter(isReel).sort((a, b) => mediaTime(b) - mediaTime(a))[0];
    return reelPayload(latest, username);
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return reply(response, 405, { ok: false, error: 'Metode permintaan tidak didukung.' }, false);
  }

  const token = clean(process.env.INSTAGRAM_ACCESS_TOKEN, 4096);
  const accountId = clean(process.env.INSTAGRAM_ACCOUNT_ID || 'me', 120);
  const username = clean(process.env.INSTAGRAM_USERNAME || DEFAULT_USERNAME, 40);
  const version = /^v\d+\.\d+$/.test(clean(process.env.INSTAGRAM_API_VERSION, 20))
    ? clean(process.env.INSTAGRAM_API_VERSION, 20)
    : DEFAULT_API_VERSION;
  const host =
    clean(process.env.INSTAGRAM_GRAPH_HOST, 80) === 'graph.facebook.com'
      ? 'graph.facebook.com'
      : 'graph.instagram.com';

  try {
    let reel = null;
    let source = '';
    let officialError = '';
    if (token) {
      try {
        reel = await fetchOfficialLatestReel(token, accountId, username, version, host);
        source = 'Instagram API resmi';
      } catch (error) {
        officialError = clean(error && error.message, 180);
      }
    }
    if (!reel) {
      reel = await fetchPublicLatestReel(username);
      if (reel) source = 'Instagram publik';
    }
    const manual = instagramUrl(request.query && request.query.fallback);
    if (!reel && manual) {
      reel = reelFromPermalink(manual, username, '', '', 'Tautan cadangan admin');
      if (reel) source = 'Tautan cadangan admin';
    }
    if (!reel)
      return reply(
        response,
        503,
        {
          ok: false,
          configured: Boolean(token),
          error:
            officialError ||
            'Reel terbaru belum dapat dibaca otomatis. Profil resmi tetap dapat dibuka.',
        },
        false,
      );
    return reply(
      response,
      200,
      { ok: true, reel, source, updatedAt: new Date().toISOString() },
      true,
    );
  } catch (error) {
    const timedOut = error && error.name === 'AbortError';
    return reply(
      response,
      timedOut ? 504 : 502,
      {
        ok: false,
        error: timedOut
          ? 'Koneksi Instagram membutuhkan waktu terlalu lama.'
          : clean(error && error.message, 220),
      },
      false,
    );
  }
}
