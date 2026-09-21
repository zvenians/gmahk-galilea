import {appsScriptApiUrl} from './_apps-script.js';

const PUBLIC_METHODS = new Set([
  'downloadQuarterlySchedulePdf',
  'findMemberSchedule',
  'getAdventTheme',
  'getAwrBorneoMedia',
  'getBibleBook',
  'getBibleBooks',
  'getBibleChapter',
  'getDailyDevotional',
  'getGalileaDownloadArchives',
  'getHymnalCatalog',
  'getHymnalSong',
  'getPersonalEvangelism',
  'getSabbathDiscussionVideos',
  'getSabbathLessonDetail',
  'getSabbathResourceDetail',
  'getSabbathResources',
  'getSabbathSchoolLibrary',
  'getWebsiteData',
  'searchBible',
  'searchWebsite',
  'submitServiceRequest',
  'translateViewerTexts'
]);

const BUILD = 'GALILEA-VERCEL-BRIDGE-17.4.0';
const MAX_REQUEST_BYTES = 180000;

function reply(response, status, body, cacheControl) {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', cacheControl || 'no-store, max-age=0');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Galilea-Build', BUILD);
  return response.status(status).json(body);
}

function parseBody(request) {
  if (request.body && typeof request.body === 'object') return request.body;
  if (typeof request.body === 'string' && request.body.trim()) return JSON.parse(request.body);
  return {};
}

function backendUrl(rawValue) {
  const url = new URL(String(rawValue || ''));
  const validHost = url.protocol === 'https:' && url.hostname === 'script.google.com';
  const validPath = /^\/macros\/s\/[^/]+\/exec$/.test(url.pathname);
  if (!validHost || !validPath) throw new Error('GALILEA_APPS_SCRIPT_API_URL belum valid. Gunakan URL deployment API yang berakhir /exec.');
  return url.toString();
}


const DEVOTIONAL_API = 'https://sabbath-school.adventech.io/api/v2';
const DEVOTIONAL_SITE = 'https://sabbath-school.adventech.io';

function witaDateKey(value) {
  const raw = String(value || '');
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function dateNumber(value) {
  const raw = String(value || '').trim();
  let match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) return Number(match[3] + match[2].padStart(2, '0') + match[1].padStart(2, '0'));
  match = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  return match ? Number(match[1] + match[2].padStart(2, '0') + match[3].padStart(2, '0')) : 0;
}

function cleanText(value) {
  return String(value == null ? '' : value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;|&#038;/gi, '&')
    .replace(/&quot;|&#8220;|&#8221;/gi, '"')
    .replace(/&#039;|&apos;|&#8216;|&#8217;/gi, "'")
    .replace(/&hellip;|&#8230;/gi, '…')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(value, limit) {
  const text = cleanText(value);
  return text.length > limit ? text.slice(0, limit - 1).trimEnd() + '…' : text;
}

function sanitizeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|iframe|object|embed|form|input|button|textarea|select)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<(script|style|iframe|object|embed|form|input|button|textarea|select)\b[^>]*\/?\s*>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+(?:style|id|class)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+(href|src)\s*=\s*(["'])\s*(?:javascript:|data:text\/html)[\s\S]*?\2/gi, '')
    .trim();
}

function renderBible(value) {
  if (typeof value === 'string') return sanitizeHtml(value);
  const seen = new Set();
  const parts = [];
  for (const group of Array.isArray(value) ? value : []) {
    const verses = group && group.verses && typeof group.verses === 'object' ? group.verses : {};
    for (const html of Object.values(verses)) {
      const plain = cleanText(html);
      if (!plain || seen.has(plain) || parts.length >= 8) continue;
      seen.add(plain);
      parts.push(sanitizeHtml(html));
    }
  }
  return parts.join('<hr>');
}

function longDateLabel(dateKey) {
  const date = new Date(dateKey + 'T12:00:00+08:00');
  const label = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Makassar', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

async function fetchOfficialJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const result = await fetch(url, {
      headers: {'Accept': 'application/json', 'User-Agent': BUILD},
      redirect: 'follow',
      signal: controller.signal
    });
    if (!result.ok) throw new Error('HTTP ' + result.status);
    return await result.json();
  } finally {
    clearTimeout(timer);
  }
}

async function getOfficialDailyDevotional(dateValue) {
  const dateKey = witaDateKey(dateValue);
  const [yearText, monthText] = dateKey.split('-');
  const year = Number(yearText);
  const quarter = Math.floor((Number(monthText) - 1) / 3) + 1;
  const periodId = year + '-' + String(quarter).padStart(2, '0');
  const quarterlyPayload = await fetchOfficialJson(DEVOTIONAL_API + '/in/quarterlies/' + periodId + '/index.json');
  const quarterly = quarterlyPayload.quarterly || quarterlyPayload || {};
  const lessons = Array.isArray(quarterly.lessons) ? quarterly.lessons : (Array.isArray(quarterlyPayload.lessons) ? quarterlyPayload.lessons : []);
  const target = dateNumber(dateKey);
  const lesson = lessons.find(item => {
    const start = dateNumber(item.start_date || item.startDate);
    const end = dateNumber(item.end_date || item.endDate || item.start_date || item.startDate);
    return start && start <= target && end >= target;
  });
  if (!lesson) throw new Error('Pelajaran Advent untuk tanggal WITA hari ini belum ditemukan.');

  const lessonId = String(lesson.id || lesson.index || lesson.number || '').replace(/\D/g, '').padStart(2, '0');
  if (!lessonId || lessonId === '00') throw new Error('Nomor pelajaran harian tidak valid.');
  const base = DEVOTIONAL_API + '/in/quarterlies/' + periodId + '/lessons/' + lessonId;
  const detailPayload = await fetchOfficialJson(base + '/index.json');
  const lessonDetail = detailPayload.lesson && typeof detailPayload.lesson === 'object' ? detailPayload.lesson : detailPayload;
  const days = Array.isArray(detailPayload.days) ? detailPayload.days : (Array.isArray(lessonDetail.days) ? lessonDetail.days : []);

  let day = days.find(item => dateNumber(item.date) === target) || null;
  let reading = null;
  if (day) {
    const dayId = String(day.id || day.index || '').replace(/\D/g, '').padStart(2, '0');
    if (dayId && dayId !== '00') {
      const payload = await fetchOfficialJson(base + '/days/' + dayId + '/read/index.json');
      reading = payload && payload.read ? payload.read : payload;
    }
  } else {
    const candidates = await Promise.all(days.map(async (item, index) => {
      const dayId = String(item.id || item.index || index + 1).replace(/\D/g, '').padStart(2, '0');
      try {
        const payload = await fetchOfficialJson(base + '/days/' + dayId + '/read/index.json');
        const value = payload && payload.read ? payload.read : payload;
        return {day: item, dayId, reading: value};
      } catch (_) {
        return null;
      }
    }));
    const exact = candidates.find(item => item && dateNumber(item.reading && item.reading.date || item.day && item.day.date) === target);
    if (exact) {
      day = Object.assign({}, exact.day, {id: exact.dayId});
      reading = exact.reading;
    }
  }

  reading = reading || day || {};
  const readingDate = dateNumber(reading.date || day && day.date);
  if (!day || readingDate !== target) throw new Error('Bacaan Advent yang tersedia belum cocok dengan tanggal WITA hari ini.');
  const contentHtml = sanitizeHtml(reading.content || day.content || '');
  const bibleHtml = renderBible(reading.bible || day.bible || '');
  if (!contentHtml) throw new Error('Isi bacaan Advent hari ini masih kosong.');

  const dayId = String(day.id || day.index || '').replace(/\D/g, '').padStart(2, '0');
  const title = cleanText(reading.title || day.title || lessonDetail.title || lesson.title || 'Renungan Pagi');
  const scripture = truncate(bibleHtml, 190);
  return {
    id: 'adventech-' + periodId + '-' + lessonId + '-' + dayId,
    format: 'text',
    requestedDate: dateKey,
    contentDate: dateKey,
    title,
    todayLabel: longDateLabel(dateKey),
    contentDateLabel: longDateLabel(dateKey),
    scripture,
    summary: truncate(contentHtml, 420),
    contentHtml: (bibleHtml ? '<div class="devotional-scripture">' + bibleHtml + '</div>' : '') + contentHtml,
    videoId: '', thumbnailUrl: '', embedUrl: '', watchUrl: '',
    isArchive: false,
    isPending: false,
    source: 'Adventech Sabbath School · Bahasa Indonesia',
    sourceUrl: DEVOTIONAL_SITE,
    lessonTitle: cleanText(lessonDetail.title || lesson.title || ''),
    lessonNumber: Number(String(lessonDetail.id || lessonDetail.number || lessonId).replace(/\D/g, '')) || Number(lessonId),
    attribution: 'Materi Advent harian · Dibagikan melalui Website Gereja Galilea'
  };
}

const BIBLE_BOOKS = [
  { id: 'GEN', name: 'Kejadian', folder: 'Kejadian', chapters: 50, testament: 'PL' },
  { id: 'EXO', name: 'Keluaran', folder: 'Keluaran', chapters: 40, testament: 'PL' },
  { id: 'LEV', name: 'Imamat', folder: 'Imamat', chapters: 27, testament: 'PL' },
  { id: 'NUM', name: 'Bilangan', folder: 'Bilangan', chapters: 36, testament: 'PL' },
  { id: 'DEU', name: 'Ulangan', folder: 'Ulangan', chapters: 34, testament: 'PL' },
  { id: 'JOS', name: 'Yosua', folder: 'Yosua', chapters: 24, testament: 'PL' },
  { id: 'JDG', name: 'Hakim-hakim', folder: 'Hakim_Hakim', chapters: 21, testament: 'PL' },
  { id: 'RUT', name: 'Rut', folder: 'Rut', chapters: 4, testament: 'PL' },
  { id: '1SA', name: '1 Samuel', folder: '1_Samuel', chapters: 31, testament: 'PL' },
  { id: '2SA', name: '2 Samuel', folder: '2_Samuel', chapters: 24, testament: 'PL' },
  { id: '1KI', name: '1 Raja-raja', folder: '1_Raja_Raja', chapters: 22, testament: 'PL' },
  { id: '2KI', name: '2 Raja-raja', folder: '2_Raja_Raja', chapters: 25, testament: 'PL' },
  { id: '1CH', name: '1 Tawarikh', folder: '1_Tawarikh', chapters: 29, testament: 'PL' },
  { id: '2CH', name: '2 Tawarikh', folder: '2_Tawarikh', chapters: 36, testament: 'PL' },
  { id: 'EZR', name: 'Ezra', folder: 'Ezra', chapters: 10, testament: 'PL' },
  { id: 'NEH', name: 'Nehemia', folder: 'Nehemia', chapters: 13, testament: 'PL' },
  { id: 'EST', name: 'Ester', folder: 'Ester', chapters: 10, testament: 'PL' },
  { id: 'JOB', name: 'Ayub', folder: 'Ayub', chapters: 42, testament: 'PL' },
  { id: 'PSA', name: 'Mazmur', folder: 'Mazmur', chapters: 150, testament: 'PL' },
  { id: 'PRO', name: 'Amsal', folder: 'Amsal', chapters: 31, testament: 'PL' },
  { id: 'ECC', name: 'Pengkhotbah', folder: 'Pengkhotbah', chapters: 12, testament: 'PL' },
  { id: 'SNG', name: 'Kidung Agung', folder: 'Kidung_Agung', chapters: 8, testament: 'PL' },
  { id: 'ISA', name: 'Yesaya', folder: 'Yesaya', chapters: 66, testament: 'PL' },
  { id: 'JER', name: 'Yeremia', folder: 'Yeremia', chapters: 52, testament: 'PL' },
  { id: 'LAM', name: 'Ratapan', folder: 'Ratapan', chapters: 5, testament: 'PL' },
  { id: 'EZK', name: 'Yehezkiel', folder: 'Yehezkiel', chapters: 48, testament: 'PL' },
  { id: 'DAN', name: 'Daniel', folder: 'Daniel', chapters: 12, testament: 'PL' },
  { id: 'HOS', name: 'Hosea', folder: 'Hosea', chapters: 14, testament: 'PL' },
  { id: 'JOL', name: 'Yoel', folder: 'Yoel', chapters: 3, testament: 'PL' },
  { id: 'AMO', name: 'Amos', folder: 'Amos', chapters: 9, testament: 'PL' },
  { id: 'OBA', name: 'Obaja', folder: 'Obaja', chapters: 1, testament: 'PL' },
  { id: 'JON', name: 'Yunus', folder: 'Yunus', chapters: 4, testament: 'PL' },
  { id: 'MIC', name: 'Mikha', folder: 'Mikha', chapters: 7, testament: 'PL' },
  { id: 'NAM', name: 'Nahum', folder: 'Nahum', chapters: 3, testament: 'PL' },
  { id: 'HAB', name: 'Habakuk', folder: 'Habakuk', chapters: 3, testament: 'PL' },
  { id: 'ZEP', name: 'Zefanya', folder: 'Zafanya', chapters: 3, testament: 'PL' },
  { id: 'HAG', name: 'Hagai', folder: 'Hagai', chapters: 2, testament: 'PL' },
  { id: 'ZEC', name: 'Zakharia', folder: 'Zakharia', chapters: 14, testament: 'PL' },
  { id: 'MAL', name: 'Maleakhi', folder: 'Maleakhi', chapters: 4, testament: 'PL' },
  { id: 'MAT', name: 'Matius', folder: 'Matius', chapters: 28, testament: 'PB' },
  { id: 'MRK', name: 'Markus', folder: 'Markus', chapters: 16, testament: 'PB' },
  { id: 'LUK', name: 'Lukas', folder: 'Lukas', chapters: 24, testament: 'PB' },
  { id: 'JHN', name: 'Yohanes', folder: 'Yohanes', chapters: 21, testament: 'PB' },
  { id: 'ACT', name: 'Kisah Para Rasul', folder: 'Kisah_Para_Rasul', chapters: 28, testament: 'PB' },
  { id: 'ROM', name: 'Roma', folder: 'Roma', chapters: 16, testament: 'PB' },
  { id: '1CO', name: '1 Korintus', folder: '1_Korintus', chapters: 16, testament: 'PB' },
  { id: '2CO', name: '2 Korintus', folder: '2_Korintus', chapters: 13, testament: 'PB' },
  { id: 'GAL', name: 'Galatia', folder: 'Galatia', chapters: 6, testament: 'PB' },
  { id: 'EPH', name: 'Efesus', folder: 'Efesus', chapters: 6, testament: 'PB' },
  { id: 'PHP', name: 'Filipi', folder: 'Filipi', chapters: 4, testament: 'PB' },
  { id: 'COL', name: 'Kolose', folder: 'Kolose', chapters: 4, testament: 'PB' },
  { id: '1TH', name: '1 Tesalonika', folder: '1_Tesalonika', chapters: 5, testament: 'PB' },
  { id: '2TH', name: '2 Tesalonika', folder: '2_Tesalonika', chapters: 3, testament: 'PB' },
  { id: '1TI', name: '1 Timotius', folder: '1_Timotius', chapters: 6, testament: 'PB' },
  { id: '2TI', name: '2 Timotius', folder: '2_Timotius', chapters: 4, testament: 'PB' },
  { id: 'TIT', name: 'Titus', folder: 'Titus', chapters: 3, testament: 'PB' },
  { id: 'PHM', name: 'Filemon', folder: 'Filemon', chapters: 1, testament: 'PB' },
  { id: 'HEB', name: 'Ibrani', folder: 'Ibrani', chapters: 13, testament: 'PB' },
  { id: 'JAS', name: 'Yakobus', folder: 'Yakobus', chapters: 5, testament: 'PB' },
  { id: '1PE', name: '1 Petrus', folder: '1_Petrus', chapters: 5, testament: 'PB' },
  { id: '2PE', name: '2 Petrus', folder: '2_Petrus', chapters: 3, testament: 'PB' },
  { id: '1JN', name: '1 Yohanes', folder: '1_Yohanes', chapters: 5, testament: 'PB' },
  { id: '2JN', name: '2 Yohanes', folder: '2_Yohanes', chapters: 1, testament: 'PB' },
  { id: '3JN', name: '3 Yohanes', folder: '3_Yohanes', chapters: 1, testament: 'PB' },
  { id: 'JUD', name: 'Yudas', folder: 'Yudas', chapters: 1, testament: 'PB' },
  { id: 'REV', name: 'Wahyu', folder: 'Wahyu', chapters: 22, testament: 'PB' }
];

// Satu-satunya sumber runtime Alkitab. Metadata di bawah harus selalu menunjuk
// ke repositori yang benar-benar di-fetch, bukan penyedia lain.
const BIBLE_SOURCE_BASE = 'https://raw.githubusercontent.com/neocarles/alkitab-tb/master/Alkitab/';
const BIBLE_SOURCE_URL = 'https://github.com/neocarles/alkitab-tb';
const BIBLE_SOURCE_LABEL = 'Alkitab Terjemahan Baru (TB) · dataset neocarles/alkitab-tb';
const BIBLE_FETCH_TIMEOUT_MS = 12000;
const BIBLE_SEARCH_CONCURRENCY = 12;
const BIBLE_SEARCH_MAX_RESULTS = 60;
const BIBLE_SEARCH_DEADLINE_MS = 40000;
const BIBLE_SEARCH_MIN_QUERY = 2;

function bibleChapterUrl(book, chapter) {
  return `${BIBLE_SOURCE_BASE}${book.folder}/${book.folder}_${chapter}.txt`;
}

function resolveBibleBook(bookId) {
  const idStr = String(bookId || '').toUpperCase();
  return BIBLE_BOOKS.find(b => b.id === idStr || b.name.toUpperCase() === idStr) || null;
}

function parseTbChapter(text) {
  const lines = String(text || '').replace(/\r/g, '').split('\n');
  const verses = [];
  let currentVerse = null;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = trimmed.match(/^\((\d+[a-z]?)\)\s*(.*)$/i);
    if (match) {
      currentVerse = { number: match[1], text: match[2].trim() };
      verses.push(currentVerse);
    } else if (currentVerse) {
      currentVerse.text = (currentVerse.text + ' ' + trimmed).trim();
    }
  }
  return verses.filter(v => v.text);
}

function getBibleBooksDirect() {
  return BIBLE_BOOKS.map((b, i) => ({
    id: b.id,
    name: b.name,
    chapters: b.chapters,
    testament: b.testament,
    testamentLabel: b.testament === 'PL' ? 'Perjanjian Lama' : 'Perjanjian Baru',
    order: i + 1
  }));
}

async function fetchTbChapterVerses(book, ch) {
  const url = bibleChapterUrl(book, ch);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BIBLE_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'text/plain' } });
    if (!res.ok) throw new Error('Sumber Alkitab TB sedang tidak dapat dihubungi.');
    const text = await res.text();
    return parseTbChapter(text);
  } finally {
    clearTimeout(timer);
  }
}

async function getBibleChapterDirect(bookId, chapter) {
  const book = resolveBibleBook(bookId);
  if (!book) throw new Error('Kitab tidak dikenali.');
  const ch = Math.max(1, Math.min(book.chapters, Number(chapter) || 1));

  const verses = await fetchTbChapterVerses(book, ch);
  if (!verses.length) throw new Error('Pasal yang dipilih belum tersedia.');
  return {
    book: book.name,
    bookId: book.id,
    chapter: ch,
    chapters: book.chapters,
    verses,
    source: BIBLE_SOURCE_LABEL,
    sourceUrl: BIBLE_SOURCE_URL
  };
}

async function getBibleBookDirect(bookId) {
  const idStr = String(bookId || '').toUpperCase();
  const book = BIBLE_BOOKS.find(b => b.id === idStr || b.name.toUpperCase() === idStr);
  if (!book) throw new Error('Kitab tidak dikenali.');

  const chapterPromises = Array.from({ length: book.chapters }, async (_, idx) => {
    const ch = idx + 1;
    try {
      return { number: ch, verses: await fetchTbChapterVerses(book, ch) };
    } catch (_) {
      return { number: ch, verses: [] };
    }
  });

  const chapters = await Promise.all(chapterPromises);
  return {
    book: book.name,
    bookId: book.id,
    chapters,
    source: BIBLE_SOURCE_LABEL,
    sourceUrl: BIBLE_SOURCE_URL,
    watermark: 'Diunduh melalui Website Galilea',
    copyright: '© Sekretaris Galilea 2026'
  };
}

// Cache chapter lintas-invocation (hangat selama serverless instance hidup),
// supaya pencarian berulang tidak menembak GitHub raw lagi.
const bibleChapterCache = new Map();
const BIBLE_CACHE_TTL_MS = 86400000;
const BIBLE_CACHE_MAX_ENTRIES = 1200;

async function getCachedChapterVerses(book, chapter) {
  const key = `${book.id}-${chapter}`;
  const hit = bibleChapterCache.get(key);
  if (hit && (Date.now() - hit.at) < BIBLE_CACHE_TTL_MS) return hit.verses;
  const verses = await fetchTbChapterVerses(book, chapter);
  if (bibleChapterCache.size >= BIBLE_CACHE_MAX_ENTRIES) {
    const oldest = bibleChapterCache.keys().next().value;
    if (oldest !== undefined) bibleChapterCache.delete(oldest);
  }
  bibleChapterCache.set(key, { at: Date.now(), verses });
  return verses;
}

function normalizeSearchQuery(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function resolveSearchScope(scope) {
  const raw = String(scope || 'all').trim();
  const upper = raw.toUpperCase();
  if (upper === 'PL' || upper === 'PB') {
    return { books: BIBLE_BOOKS.filter(b => b.testament === upper), scope: upper };
  }
  if (!raw || upper === 'ALL') return { books: BIBLE_BOOKS.slice(), scope: 'all' };
  const book = resolveBibleBook(raw);
  if (!book) throw new Error('Kitab tidak dikenali.');
  return { books: [book], scope: book.id };
}

// Menjalankan task dengan batas konkurensi agar GitHub raw tidak dibanjiri.
async function runWithConcurrency(tasks, limit, shouldStop) {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, async () => {
    while (cursor < tasks.length) {
      if (shouldStop && shouldStop()) return;
      const index = cursor++;
      await tasks[index]();
    }
  });
  await Promise.all(workers);
}

async function searchBibleDirect(query, scope) {
  const normalized = normalizeSearchQuery(query);
  if (normalized.length < BIBLE_SEARCH_MIN_QUERY) {
    throw new Error('Ketik minimal 2 karakter untuk mencari ayat.');
  }
  const { books, scope: resolvedScope } = resolveSearchScope(scope);

  const targets = [];
  for (const book of books) {
    for (let ch = 1; ch <= book.chapters; ch += 1) targets.push({ book, chapter: ch });
  }

  const results = [];
  let scanned = 0;
  let hitLimit = false;
  let hitDeadline = false;
  const startedAt = Date.now();
  const stop = () => {
    if (results.length >= BIBLE_SEARCH_MAX_RESULTS) { hitLimit = true; return true; }
    if ((Date.now() - startedAt) > BIBLE_SEARCH_DEADLINE_MS) { hitDeadline = true; return true; }
    return false;
  };

  const tasks = targets.map(({ book, chapter }) => async () => {
    if (stop()) return;
    let verses;
    try {
      verses = await getCachedChapterVerses(book, chapter);
    } catch (_) {
      return;
    }
    scanned += 1;
    for (const verse of verses) {
      if (results.length >= BIBLE_SEARCH_MAX_RESULTS) { hitLimit = true; return; }
      if (!verse.text.toLowerCase().includes(normalized)) continue;
      results.push({
        book: book.name,
        bookId: book.id,
        chapter,
        verse: String(verse.number),
        text: verse.text
      });
    }
  });

  await runWithConcurrency(tasks, BIBLE_SEARCH_CONCURRENCY, stop);

  results.sort((a, b) => {
    const orderA = BIBLE_BOOKS.findIndex(x => x.id === a.bookId);
    const orderB = BIBLE_BOOKS.findIndex(x => x.id === b.bookId);
    if (orderA !== orderB) return orderA - orderB;
    if (a.chapter !== b.chapter) return a.chapter - b.chapter;
    return Number(a.verse) - Number(b.verse);
  });

  return {
    query: String(query || '').trim(),
    scope: resolvedScope,
    results,
    total: results.length,
    scanned,
    chapterCount: targets.length,
    partial: scanned < targets.length,
    limited: hitLimit,
    timedOut: hitDeadline,
    source: BIBLE_SOURCE_LABEL,
    sourceUrl: BIBLE_SOURCE_URL
  };
}

export default async function handler(request, response) {
  if (request.method === 'GET') {
    return reply(response, 200, {
      ok: true,
      service: 'Galilea Vercel API Bridge',
      build: BUILD,
      configured: Boolean(appsScriptApiUrl() && process.env.GALILEA_API_SECRET)
    });
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST');
    return reply(response, 405, {ok: false, error: 'Metode permintaan tidak didukung.'});
  }

  try {
    const rawLength = Number(request.headers['content-length'] || 0);
    if (rawLength > MAX_REQUEST_BYTES) return reply(response, 413, {ok: false, error: 'Permintaan terlalu besar.'});

    const body = parseBody(request);
    const method = String(body.method || '');
    const args = Array.isArray(body.args) ? body.args : [];
    if (!PUBLIC_METHODS.has(method)) return reply(response, 403, {ok: false, error: 'Fungsi tidak diizinkan pada viewer publik.'});
    if (args.length > 20 || JSON.stringify(args).length > MAX_REQUEST_BYTES) {
      return reply(response, 413, {ok: false, error: 'Parameter permintaan terlalu besar.'});
    }

    if (method === 'getDailyDevotional') {
      try {
        const devotional = await getOfficialDailyDevotional(args[0]);
        return reply(response, 200, {ok: true, data: devotional, meta: {source: 'adventech-direct', build: BUILD}}, 'public, s-maxage=900, stale-while-revalidate=1800');
      } catch (devotionalError) {
        return reply(response, 502, {
          ok: false,
          error: 'Renungan Pagi teks hari ini belum dapat dimuat dari sumber resmi. ' +
            String(devotionalError && devotionalError.message ? devotionalError.message : devotionalError || '')
        });
      }
    }

    if (method === 'getBibleBooks') {
      try {
        const books = getBibleBooksDirect();
        return reply(response, 200, {ok: true, data: books, meta: {source: 'tb-neocarles', build: BUILD}}, 'public, s-maxage=86400, stale-while-revalidate=604800');
      } catch (booksError) {
        return reply(response, 502, {ok: false, error: 'Daftar kitab Alkitab belum dapat dimuat: ' + String(booksError?.message || booksError)});
      }
    }

    if (method === 'getBibleChapter') {
      try {
        const chapter = await getBibleChapterDirect(args[0], args[1]);
        return reply(response, 200, {ok: true, data: chapter, meta: {source: 'tb-neocarles', build: BUILD}}, 'public, s-maxage=86400, stale-while-revalidate=604800');
      } catch (chapterError) {
        return reply(response, 502, {ok: false, error: 'Pasal Alkitab belum dapat dimuat: ' + String(chapterError?.message || chapterError)});
      }
    }

    if (method === 'getBibleBook') {
      try {
        const bookData = await getBibleBookDirect(args[0]);
        return reply(response, 200, {ok: true, data: bookData, meta: {source: 'tb-neocarles', build: BUILD}}, 'public, s-maxage=86400, stale-while-revalidate=604800');
      } catch (bookError) {
        return reply(response, 502, {ok: false, error: 'Isi kitab Alkitab belum dapat dimuat: ' + String(bookError?.message || bookError)});
      }
    }

    if (method === 'searchBible') {
      const rawQuery = String(args[0] || '');
      if (normalizeSearchQuery(rawQuery).length < BIBLE_SEARCH_MIN_QUERY) {
        return reply(response, 400, {ok: false, error: 'Ketik minimal 2 karakter untuk mencari ayat.'});
      }
      try {
        const found = await searchBibleDirect(rawQuery, args[1]);
        return reply(response, 200, {ok: true, data: found, meta: {source: 'tb-neocarles', build: BUILD}}, 'public, s-maxage=86400, stale-while-revalidate=604800');
      } catch (searchError) {
        return reply(response, 502, {ok: false, error: 'Pencarian Alkitab belum dapat dijalankan: ' + String(searchError?.message || searchError)});
      }
    }

    const configuredUrl = backendUrl(appsScriptApiUrl());
    const secret = String(process.env.GALILEA_API_SECRET || '');
    if (secret.length < 32) throw new Error('GALILEA_API_SECRET belum dipasang atau terlalu pendek.');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 55000);
    let upstream;
    try {
      upstream = await fetch(configuredUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Accept': 'application/json',
          'User-Agent': BUILD
        },
        body: JSON.stringify({secret, method, args}),
        redirect: 'follow',
        signal: controller.signal
      });
    } finally {
      clearTimeout(timer);
    }

    const text = await upstream.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch (_) {
      const looksLikeHtml = /^\s*</.test(text);
      throw new Error(looksLikeHtml
        ? 'Backend Apps Script mengirim halaman HTML. Pasang VercelApi.gs lalu deploy versi terbaru.'
        : 'Respons backend tidak dapat dibaca.');
    }

    if (!upstream.ok || !payload || payload.ok !== true) {
      return reply(response, upstream.ok ? 502 : upstream.status, {
        ok: false,
        error: payload && payload.error ? payload.error : 'Backend Galilea belum dapat dihubungi.'
      });
    }

    return reply(response, 200, {ok: true, data: payload.data, meta: payload.meta || null});
  } catch (error) {
    const timedOut = error && error.name === 'AbortError';
    return reply(response, timedOut ? 504 : 500, {
      ok: false,
      error: timedOut
        ? 'Backend membutuhkan waktu terlalu lama. Silakan coba lagi.'
        : String(error && error.message ? error.message : error || 'Terjadi gangguan pada API Galilea.')
    });
  }
}
