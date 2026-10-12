import { appsScriptApiUrl } from './_apps-script.js';

const BUILD = 'GALILEA-WEEKLY-BULLETIN-20.0.0';
const PAGE = { width: 595, height: 842, contentTop: 650, contentBottom: 72, left: 48, right: 547 };
const COLOR = {
  paper: [0.972, 0.978, 0.956],
  green: [0.035, 0.176, 0.098],
  green2: [0.074, 0.267, 0.151],
  ink: [0.055, 0.082, 0.063],
  soft: [0.31, 0.38, 0.325],
  gold: [0.79, 0.655, 0.31],
  mist: [0.9, 0.93, 0.88],
  white: [1, 1, 1],
};
const clean = (value) =>
  String(value == null ? '' : value)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
const pdfText = (value) =>
  clean(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '-')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
const rgb = (color) => color.join(' ') + ' rg';

function backendUrl(value) {
  const url = new URL(String(value || ''));
  if (
    url.protocol !== 'https:' ||
    url.hostname !== 'script.google.com' ||
    !/^\/macros\/s\/[^/]+\/exec$/.test(url.pathname)
  )
    throw new Error('Konfigurasi API Apps Script belum valid.');
  return url.toString();
}
async function websiteData() {
  const url = backendUrl(appsScriptApiUrl()),
    secret = String(process.env.GALILEA_API_SECRET || '');
  if (secret.length < 32) throw new Error('Secret API Vercel belum tersedia.');
  const controller = new AbortController(),
    timer = setTimeout(() => controller.abort(), 55000);
  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        Accept: 'application/json',
        'User-Agent': BUILD,
      },
      body: JSON.stringify({ secret, method: 'getWebsiteData', args: [] }),
      redirect: 'follow',
      signal: controller.signal,
    });
    const payload = await upstream.json();
    if (!upstream.ok || !payload || payload.ok !== true || !payload.data)
      throw new Error((payload && payload.error) || 'Data Warta belum dapat dimuat.');
    return payload.data;
  } finally {
    clearTimeout(timer);
  }
}

function wrap(value, limit = 82) {
  const words = clean(value).split(' ').filter(Boolean),
    lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? line + ' ' + word : word;
    if (next.length > limit && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines.length ? lines : ['-'];
}
function bulletinEntries(data) {
  const entries = [];
  const addService = (item) => {
    if (!item) return;
    entries.push({
      kind: 'section',
      text: clean(item.title || item.sectionTitle || 'IBADAH').toUpperCase(),
    });
    entries.push({
      kind: 'meta',
      text: [clean(item.dateLabel), clean(item.time)].filter(Boolean).join('  |  '),
    });
    const fields = item.fields || (item.services || []).flatMap((service) => service.fields || []);
    for (const field of fields)
      entries.push({ kind: 'field', text: clean(field.label) + ': ' + clean(field.value) });
    entries.push({ kind: 'space' });
  };
  addService(data.nextSabbath);
  addService(data.nextWednesday);
  const announcements = (data.announcements || [])
    .filter((item) => item.includeInBulletin !== false)
    .slice(0, 12);
  entries.push({ kind: 'section', text: 'AGENDA DAN PENGUMUMAN' });
  if (!announcements.length)
    entries.push({
      kind: 'note',
      text: 'Belum ada Agenda dan Pengumuman yang dimasukkan ke Warta.',
    });
  for (const item of announcements) {
    const priority =
      item.priority && item.priority !== 'NORMAL' ? '[' + clean(item.priority) + '] ' : '';
    entries.push({
      kind: 'announcement',
      text: priority + clean(item.title) + (item.dateLabel ? ' | ' + clean(item.dateLabel) : ''),
    });
    if (item.summary) entries.push({ kind: 'note', text: clean(item.summary) });
  }
  return entries;
}
function entryLayout(entry) {
  if (entry.kind === 'space') return { ...entry, lines: [''], height: 14 };
  const size =
    entry.kind === 'section'
      ? 12
      : entry.kind === 'meta'
        ? 9.5
        : entry.kind === 'announcement'
          ? 9.5
          : 8.8;
  const limit = entry.kind === 'section' ? 62 : entry.kind === 'note' ? 94 : 86;
  const lines = wrap(entry.text, limit),
    lineHeight = size + 4;
  const top = entry.kind === 'section' ? 24 : entry.kind === 'announcement' ? 8 : 4;
  const bottom = entry.kind === 'section' ? 9 : entry.kind === 'note' ? 7 : 4;
  return {
    ...entry,
    size,
    lines,
    lineHeight,
    height: top + lines.length * lineHeight + bottom,
    top,
    bottom,
  };
}
function paginate(entries) {
  const pages = [[]];
  let y = PAGE.contentTop;
  for (const raw of entries) {
    const item = entryLayout(raw);
    if (y - item.height < PAGE.contentBottom && pages[pages.length - 1].length) {
      pages.push([]);
      y = PAGE.contentTop;
    }
    pages[pages.length - 1].push({ ...item, y });
    y -= item.height;
  }
  return pages;
}
function textCommand(text, x, y, size, color, bold) {
  return [
    'BT',
    rgb(color),
    `/${bold ? 'F2' : 'F1'} ${size} Tf`,
    `1 0 0 1 ${x} ${y} Tm`,
    `(${pdfText(text)}) Tj`,
    'ET',
  ];
}
function pageCommands(items, pageIndex, pageCount, data, generatedLabel) {
  const c = [
    'q',
    rgb(COLOR.paper),
    `0 0 ${PAGE.width} ${PAGE.height} re f`,
    'Q',
    'q',
    rgb(COLOR.green),
    `0 682 ${PAGE.width} 160 re f`,
    'Q',
    'q',
    rgb(COLOR.gold),
    `0 676 ${PAGE.width} 6 re f`,
    'Q',
  ];
  c.push(...textCommand('GMAHK GALILEA BALIKPAPAN', 48, 805, 9, COLOR.gold, true));
  c.push(...textCommand('WARTA JEMAAT', 48, 754, 30, COLOR.white, true));
  c.push(
    ...textCommand(
      'Informasi ibadah mingguan yang resmi, ringkas, dan siap dibagikan.',
      48,
      724,
      10,
      COLOR.white,
      false,
    ),
  );
  c.push(
    ...textCommand(
      'Diperbarui ' + clean(data.updatedAt || generatedLabel),
      48,
      702,
      8,
      COLOR.mist,
      false,
    ),
  );
  c.push(
    'q',
    rgb(COLOR.green2),
    '450 724 97 78 re f',
    'Q',
    'q',
    rgb(COLOR.gold),
    '466 740 65 4 re f',
    'Q',
  );
  c.push(...textCommand(String(pageIndex + 1).padStart(2, '0'), 477, 758, 28, COLOR.white, true));
  for (const item of items) {
    if (item.kind === 'space') continue;
    let cursor = item.y - item.top;
    if (item.kind === 'section') {
      c.push('q', rgb(COLOR.gold), `48 ${cursor + 5} 30 3 re f`, 'Q');
      for (const line of item.lines) {
        c.push(...textCommand(line, 88, cursor, item.size, COLOR.green, true));
        cursor -= item.lineHeight;
      }
      continue;
    }
    const x = item.kind === 'note' ? 67 : 58;
    if (item.kind === 'announcement')
      c.push('q', rgb(COLOR.gold), `48 ${cursor + 2} 4 9 re f`, 'Q');
    if (item.kind === 'field')
      c.push('q', rgb(COLOR.mist), `48 ${cursor - 3} 499 ${item.lineHeight + 2} re f`, 'Q');
    const color = item.kind === 'meta' ? COLOR.soft : item.kind === 'note' ? COLOR.soft : COLOR.ink,
      bold = item.kind === 'meta' || item.kind === 'announcement';
    for (const line of item.lines) {
      c.push(...textCommand(line, x, cursor, item.size, color, bold));
      cursor -= item.lineHeight;
    }
  }
  c.push('q', rgb(COLOR.green), '48 51 499 1 re f', 'Q');
  c.push(
    ...textCommand(
      `Diunduh dari website resmi GMAHK Galilea Balikpapan pada ${generatedLabel}`,
      48,
      34,
      7.1,
      COLOR.soft,
      false,
    ),
  );
  c.push(
    ...textCommand(
      `gmahk-galilea.vercel.app  |  Halaman ${pageIndex + 1} dari ${pageCount}`,
      48,
      20,
      7.1,
      COLOR.soft,
      false,
    ),
  );
  c.push(...textCommand('(c) Sekretaris Galilea 2026', 426, 20, 7.1, COLOR.soft, true));
  return c;
}
function buildPdf(data) {
  const generatedLabel =
    new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Makassar',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .format(new Date())
      .replace(' pukul ', ' - ') + ' WITA';
  const pages = paginate(bulletinEntries(data));
  const objects = [null],
    add = (body) => (objects.push(body), objects.length - 1),
    catalog = add(''),
    pagesId = add(''),
    regular = add(
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    ),
    bold = add(
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    ),
    pageIds = [];
  pages.forEach((items, index) => {
    const commands = pageCommands(items, index, pages.length, data, generatedLabel),
      stream = commands.join('\n'),
      content = add(
        `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`,
      ),
      pageId = add(
        `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE.width} ${PAGE.height}] /Resources << /Font << /F1 ${regular} 0 R /F2 ${bold} 0 R >> >> /Contents ${content} 0 R >>`,
      );
    pageIds.push(pageId);
  });
  objects[catalog] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId] =
    `<< /Type /Pages /Kids [${pageIds.map((id) => id + ' 0 R').join(' ')}] /Count ${pageIds.length} >>`;
  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets = [0];
  for (let id = 1; id < objects.length; id++) {
    offsets[id] = Buffer.byteLength(pdf, 'latin1');
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id++)
    pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, 'latin1');
}
export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ ok: false, error: 'Metode tidak didukung.' });
  }
  try {
    const data = await websiteData(),
      pdf = buildPdf(data);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', 'attachment; filename="Warta-Jemaat-Galilea.pdf"');
    response.setHeader('Content-Length', String(pdf.length));
    response.setHeader('Cache-Control', 'private, no-store, max-age=0');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Galilea-Build', BUILD);
    return response.status(200).send(pdf);
  } catch (error) {
    return response
      .status(error && error.name === 'AbortError' ? 504 : 500)
      .json({ ok: false, error: clean((error && error.message) || error) });
  }
}
export { buildPdf };
