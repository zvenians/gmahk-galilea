const BUILD = 'GALILEA-YOUTUBE-35.0.0';

const CHANNELS = {
  awr: {
    id: 'UC41TOa3S2aC8C-AxRBvH9Xw',
    name: 'AWR Borneo',
    url: 'https://www.youtube.com/@AWRBorneo',
  },
  sabbath: {
    id: 'UCkNVHkC8G5HiOgFG7Iv9smg',
    name: 'Diskusi Sekolah Sabat · Hope Channel Indonesia',
    url: 'https://www.youtube.com/@DiskusiSekolahSabat',
  },
};

function decodeXml(value) {
  return String(value || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .trim();
}

function tag(source, name) {
  const match = String(source || '').match(
    new RegExp(
      '<(?:[a-z]+:)?' + name + '(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[a-z]+:)?' + name + '>',
      'i',
    ),
  );
  return decodeXml(match && match[1]);
}

function dateLabel(value) {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Makassar',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value));
  } catch (_) {
    return '';
  }
}

function publicVideo(item) {
  return {
    videoId: item.videoId,
    title: item.title,
    publishedAt: item.publishedAt,
    publishedLabel: dateLabel(item.publishedAt),
    thumbnailUrl: '/api/thumbnail?id=' + encodeURIComponent(item.videoId),
    embedUrl:
      'https://www.youtube-nocookie.com/embed/' +
      item.videoId +
      '?rel=0&modestbranding=1&playsinline=1',
    watchUrl: 'https://www.youtube.com/watch?v=' + item.videoId,
  };
}

async function readFeed(channel) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(
      'https://www.youtube.com/feeds/videos.xml?channel_id=' + encodeURIComponent(channel.id),
      {
        headers: {
          Accept: 'application/atom+xml, application/xml, text/xml',
          'User-Agent': BUILD,
        },
        redirect: 'follow',
        signal: controller.signal,
      },
    );
    if (!response.ok) throw new Error('Feed YouTube menjawab HTTP ' + response.status + '.');
    const xml = await response.text();
    const entries = xml.match(/<entry>[\s\S]*?<\/entry>/gi) || [];
    const seen = new Set();
    return entries
      .map((entry) => ({
        videoId: tag(entry, 'videoId'),
        title: tag(entry, 'title') || 'Video YouTube',
        publishedAt: tag(entry, 'published'),
      }))
      .filter((item) => {
        if (!/^[A-Za-z0-9_-]{11}$/.test(item.videoId) || seen.has(item.videoId)) return false;
        seen.add(item.videoId);
        return true;
      });
  } finally {
    clearTimeout(timer);
  }
}

function normalizedTitle(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\blive\b|🔴|episode\s*\d+|ep\.?\s*\d+/gi, ' ')
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim();
}

function uniqueByTitle(items, limit) {
  const seenIds = new Set();
  const seenTitles = new Set();
  const result = [];
  for (const item of items || []) {
    const id = String((item && item.videoId) || '');
    const title = normalizedTitle(item && item.title);
    if (!id || seenIds.has(id) || (title && seenTitles.has(title))) continue;
    seenIds.add(id);
    if (title) seenTitles.add(title);
    result.push(item);
    if (result.length >= limit) break;
  }
  return result;
}

function isDiscussion(item) {
  const title = String((item && item.title) || '');
  return (
    /sekolah\s+sabat|sabbath\s+school/i.test(title) &&
    /pelajaran|diskusi|sabbath\s+school/i.test(title) &&
    !/shorts?|q\s*&\s*a|tanya\s*jawab|pertanyaan/i.test(title)
  );
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ ok: false, error: 'Metode tidak didukung.' });
  }
  const type = String((request.query && request.query.channel) || 'awr').toLowerCase();
  const channel = CHANNELS[type];
  if (!channel) return response.status(400).json({ ok: false, error: 'Kanal tidak dikenali.' });
  try {
    const videos = await readFeed(channel);
    if (!videos.length) throw new Error('Feed kanal belum memuat video.');
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=900');
    response.setHeader('X-Galilea-Build', BUILD);
    if (type === 'sabbath') {
      const selected = videos.find(isDiscussion) || videos[0];
      return response.status(200).json({
        ok: true,
        channel: type,
        data: {
          channelName: channel.name,
          channelId: channel.id,
          channelUrl: channel.url,
          video: publicVideo(selected),
          updatedAt: new Date().toISOString(),
          source: 'YouTube RSS · Vercel',
        },
      });
    }
    const latest = uniqueByTitle(videos, 3);
    return response.status(200).json({
      ok: true,
      channel: type,
      data: {
        isLive: false,
        mode: 'latest',
        channelId: channel.id,
        channelName: channel.name,
        videoId: latest[0].videoId,
        title: latest[0].title,
        channelUrl: channel.url,
        recentVideos: latest.slice(1).map(publicVideo),
        updatedAt: new Date().toISOString(),
        source: 'YouTube RSS · Vercel',
      },
    });
  } catch (error) {
    const timedOut = error && error.name === 'AbortError';
    return response.status(timedOut ? 504 : 502).json({
      ok: false,
      error: timedOut
        ? 'YouTube membutuhkan waktu terlalu lama.'
        : String((error && error.message) || error || 'Video belum dapat dimuat.'),
      build: BUILD,
    });
  }
}
