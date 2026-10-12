const BUILD = 'GALILEA-MISSION-32.0.0';
const SOURCE_ROOT = 'https://benadam.my.id/berita-misi-advent/';
const MONTHS = Object.freeze({
  januari: 0,
  februari: 1,
  maret: 2,
  april: 3,
  mei: 4,
  juni: 5,
  juli: 6,
  agustus: 7,
  september: 8,
  oktober: 9,
  november: 10,
  nopember: 10,
  desember: 11,
});

function reply(response, status, body, cacheable) {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader(
    'Cache-Control',
    cacheable ? 'public, s-maxage=60, stale-while-revalidate=600' : 'no-store, max-age=0',
  );
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Galilea-Build', BUILD);
  return response.status(status).json(body);
}

function decodeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;|&#038;/gi, '&')
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#8211;|&#8212;/gi, '—')
    .replace(/&#8230;|&hellip;/gi, '…')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code) || 32));
}

function text(value) {
  return decodeHtml(
    String(value || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim();
}

function safeUrl(value) {
  try {
    const url = new URL(decodeHtml(value), SOURCE_ROOT);
    return url.protocol === 'https:' ? url.toString() : '';
  } catch (_) {
    return '';
  }
}

function sourceUrl(value) {
  const url = safeUrl(value);
  if (!url) return '';
  const parsed = new URL(url);
  return parsed.hostname === 'benadam.my.id' && /^\/berita-misi-advent\//i.test(parsed.pathname)
    ? parsed.toString()
    : '';
}

function dateFromSlug(slug) {
  const match = String(slug || '')
    .toLowerCase()
    .match(
      /^(\d{1,2})-(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|nopember|desember)-(20\d{2})$/,
    );
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[3]), MONTHS[match[2]], Number(match[1]), 4));
  return Number.isFinite(date.getTime()) ? date : null;
}

function dateLabel(date) {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) return '';
  const label = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Makassar',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function nextSabbath() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Makassar',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .formatToParts(new Date())
    .reduce((all, part) => {
      if (part.type !== 'literal') all[part.type] = part.value;
      return all;
    }, {});
  const date = new Date(
    Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), 4),
  );
  date.setUTCDate(date.getUTCDate() + ((6 - date.getUTCDay() + 7) % 7));
  return date;
}

function sanitizeHtml(value) {
  let html = String(value || '');
  html = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(
      /<(script|style|iframe|object|embed|form|input|button|textarea|select|nav|footer|aside)[^>]*>[\s\S]*?<\/\1>/gi,
      '',
    )
    .replace(
      /<(script|style|iframe|object|embed|form|input|button|textarea|select|nav|footer|aside)\b[^>]*\/?\s*>/gi,
      '',
    )
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+(?:style|id|class|srcset|sizes)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+(href|src)\s*=\s*(["'])\s*(?:javascript:|data:text\/html)[\s\S]*?\2/gi, '')
    .replace(/<a\b(?![^>]*\btarget=)([^>]*)>/gi, '<a$1 target="_blank" rel="noopener noreferrer">');
  return html.trim();
}

async function fetchHtml(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 14000);
  try {
    const result = await fetch(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'id-ID,id;q=0.9,en;q=0.6',
        'User-Agent': 'Mozilla/5.0 (compatible; ' + BUILD + '; +https://gmahk-galilea.vercel.app)',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    if (!result.ok) throw new Error('Sumber Berita Misi menjawab HTTP ' + result.status + '.');
    const html = await result.text();
    if (html.length < 500) throw new Error('Sumber Berita Misi mengirim halaman kosong.');
    return html;
  } finally {
    clearTimeout(timer);
  }
}

function listItems(html, year, quarter) {
  const items = [],
    seen = new Set();
  const pattern = /<a\b([^>]*?)href\s*=\s*(["'])([^"']+)\2([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = pattern.exec(html))) {
    const url = sourceUrl(match[3]);
    if (!url) continue;
    const parsed = new URL(url);
    const slugMatch = parsed.pathname.match(/^\/berita-misi-advent\/([^/]+)\/?$/i);
    if (!slugMatch || seen.has(slugMatch[1])) continue;
    const date = dateFromSlug(slugMatch[1]);
    if (
      !date ||
      date.getUTCFullYear() !== year ||
      Math.floor(date.getUTCMonth() / 3) + 1 !== quarter
    )
      continue;
    seen.add(slugMatch[1]);
    const attrs = match[1] + ' ' + match[4];
    const titleAttr =
      (attrs.match(/\b(?:title|aria-label)\s*=\s*(["'])([\s\S]*?)\1/i) || [])[2] || '';
    const anchorText = text(match[5]);
    let title = text(titleAttr || anchorText)
      .replace(/^\d{1,2}\s+[A-Za-z]+\s+20\d{2}\s*:\s*/i, '')
      .replace(/\s*\.{3,}\s*$/, '');
    if (!title || title.length < 4) title = 'Berita Misi · ' + dateLabel(date);
    items.push({
      sourceId: slugMatch[1].toLowerCase(),
      year,
      quarter,
      isoDate: isoDate(date),
      dateValue: date.getTime(),
      dateLabel: dateLabel(date),
      title,
      summary: 'Kisah misi Advent untuk ' + dateLabel(date) + '.',
      url,
      source: 'ben.Adam · Berita Misi Advent',
      imageUrl: '',
    });
  }
  return items.sort((a, b) => b.dateValue - a.dateValue);
}

function decorate(items) {
  const target = nextSabbath();
  const targetIso = isoDate(target);
  const exact = items.find((item) => item.isoDate === targetIso);
  const latest = items.find((item) => item.dateValue <= target.getTime()) || items[0] || null;
  const featured = exact || latest;
  return {
    items: items.map((item) =>
      Object.assign({}, item, {
        isThisSabbath: Boolean(exact && item.sourceId === exact.sourceId),
        isLatest: Boolean(latest && item.sourceId === latest.sourceId),
        badge:
          exact && item.sourceId === exact.sourceId
            ? 'SABAT INI'
            : latest && item.sourceId === latest.sourceId
              ? 'TERBARU'
              : '',
      }),
    ),
    featured: featured
      ? Object.assign({}, featured, {
          isThisSabbath: Boolean(exact && featured.sourceId === exact.sourceId),
          isLatest: Boolean(latest && featured.sourceId === latest.sourceId),
          badge: exact && featured.sourceId === exact.sourceId ? 'SABAT INI' : 'TERBARU',
        })
      : null,
  };
}

function detailFromHtml(html, slug, url) {
  const date = dateFromSlug(slug);
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  const title = text(h1 && h1[1]) || 'Berita Misi · ' + dateLabel(date);
  const h1Index = h1 ? html.indexOf(h1[0]) : -1;
  let articleStart = h1Index >= 0 ? html.lastIndexOf('<article', h1Index) : -1;
  if (articleStart < 0) articleStart = h1Index >= 0 ? h1Index : 0;
  let articleEnd = html.indexOf('</article>', Math.max(h1Index, articleStart));
  if (articleEnd < 0) articleEnd = html.search(/<footer\b/i);
  if (articleEnd < 0) articleEnd = html.length;
  let article = html.slice(articleStart, articleEnd);
  if (h1) article = article.replace(h1[0], '');
  article = article
    .replace(/<header\b[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(
      /<div\b[^>]*(?:sharedaddy|post-navigation|comments-area|related)[^>]*>[\s\S]*?<\/div>/gi,
      '',
    );
  const imageMatch = article.match(/<img\b[^>]*\bsrc\s*=\s*(["'])(https:\/\/[^"']+)\1[^>]*>/i);
  const contentHtml = sanitizeHtml(article);
  if (text(contentHtml).length < 120)
    throw new Error('Isi Berita Misi belum lengkap pada sumber rujukan.');
  return {
    id: slug,
    sourceId: slug,
    type: 'mission',
    title,
    isoDate: isoDate(date),
    dateLabel: dateLabel(date),
    summary: text(contentHtml).slice(0, 360),
    contentHtml,
    documentUrl: '',
    pageNumber: 0,
    imageUrl: imageMatch ? safeUrl(imageMatch[2]) : '',
    source: 'ben.Adam · Berita Misi Advent',
    sourceUrl: url,
    updatedAt: new Date().toISOString(),
  };
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return reply(response, 405, { ok: false, error: 'Metode permintaan tidak didukung.' }, false);
  }
  try {
    const id = String((request.query && request.query.id) || '')
      .toLowerCase()
      .trim();
    if (id) {
      if (!dateFromSlug(id))
        return reply(response, 400, { ok: false, error: 'ID Berita Misi tidak valid.' }, false);
      const url = sourceUrl(SOURCE_ROOT + id + '/');
      const detail = detailFromHtml(await fetchHtml(url), id, url);
      return reply(response, 200, { ok: true, detail, source: SOURCE_ROOT, build: BUILD }, true);
    }

    const now = new Date();
    const year = Math.min(
      2100,
      Math.max(2020, Number(request.query && request.query.year) || now.getUTCFullYear()),
    );
    const quarter = Math.min(
      4,
      Math.max(
        1,
        Number(request.query && request.query.quarter) || Math.floor(now.getUTCMonth() / 3) + 1,
      ),
    );
    const items = listItems(await fetchHtml(SOURCE_ROOT), year, quarter);
    const selected = decorate(items);
    return reply(
      response,
      200,
      {
        ok: true,
        type: 'mission',
        year,
        quarter,
        items: selected.items,
        featured: selected.featured,
        cadence: 'Otomatis setiap Sabat · pemeriksaan tiap 1 menit',
        updatedAt: new Date().toISOString(),
        source: SOURCE_ROOT,
        build: BUILD,
      },
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
          ? 'Sumber Berita Misi membutuhkan waktu terlalu lama.'
          : String((error && error.message) || 'Berita Misi belum dapat dimuat.'),
      },
      false,
    );
  }
}
