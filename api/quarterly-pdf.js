import { appsScriptApiUrl } from './_apps-script.js';

const BUILD = 'GALILEA-QUARTERLY-PDF-17.1.0';
const PAGE = Object.freeze({ width: 841.89, height: 595.28 }); // A4 landscape
const MARGIN = Object.freeze({ left: 36, right: 36, bottom: 38 });
const THEME = Object.freeze({
  paper: [0.965, 0.973, 0.953],
  surface: [1, 1, 1],
  rowAlt: [0.947, 0.961, 0.938],
  ink: [0.074, 0.11, 0.083],
  muted: [0.31, 0.37, 0.33],
  brand: [0.122, 0.263, 0.18],
  brandMid: [0.255, 0.408, 0.294],
  brandSoft: [0.847, 0.898, 0.831],
  gold: [0.674, 0.535, 0.294],
  goldSoft: [0.945, 0.902, 0.803],
  line: [0.76, 0.81, 0.75],
  whiteSoft: [0.89, 0.925, 0.895],
});

function backendUrl(rawValue) {
  const url = new URL(String(rawValue || ''));
  if (
    url.protocol !== 'https:' ||
    url.hostname !== 'script.google.com' ||
    !/^\/macros\/s\/[^/]+\/exec$/.test(url.pathname)
  ) {
    throw new Error('Konfigurasi API Apps Script belum valid.');
  }
  return url.toString();
}

function clean(value) {
  return String(value == null ? '' : value)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2022/g, '•')
    .replace(/\s+/g, ' ')
    .trim();
}

function pdfText(value) {
  return clean(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/•/g, '\x95')
    .replace(/[^\x20-\x7E\x80-\xFF]/g, '-')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function rgb(color, stroke = false) {
  return `${color.map((number) => Number(number).toFixed(3)).join(' ')} ${stroke ? 'RG' : 'rg'}`;
}

function wrap(value, width, size, bold = false) {
  const text = clean(value) || '-';
  const average = size * (bold ? 0.57 : 0.51);
  const limit = Math.max(5, Math.floor(width / average));
  const words = text.split(' ');
  const lines = [];
  let line = '';
  words.forEach((word) => {
    if (word.length > limit) {
      if (line) lines.push(line);
      for (let start = 0; start < word.length; start += limit)
        lines.push(word.slice(start, start + limit));
      line = '';
      return;
    }
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > limit && line) {
      lines.push(line);
      line = word;
    } else line = candidate;
  });
  if (line) lines.push(line);
  return lines.length ? lines : ['-'];
}

function sectionColumns(section) {
  const labels = [];
  (section.records || []).forEach((record) => {
    (record.fields || []).forEach((field) => {
      const label = clean(field.label);
      if (label && !labels.includes(label)) labels.push(label);
    });
  });
  return labels;
}

function fieldMap(record) {
  const map = new Map();
  (record.fields || []).forEach((field) => map.set(clean(field.label), clean(field.value) || '-'));
  return map;
}

class PdfPage {
  constructor(number, period, updatedAt) {
    this.number = number;
    this.period = period;
    this.updatedAt = updatedAt;
    this.commands = [];
    this.cursor = PAGE.height - 105;
    this.background();
    this.header();
  }

  rect(x, y, width, height, fill, stroke = null, lineWidth = 0.55) {
    this.commands.push('q');
    if (fill)
      this.commands.push(
        rgb(fill),
        `${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f`,
      );
    if (stroke)
      this.commands.push(
        rgb(stroke, true),
        `${lineWidth} w`,
        `${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re S`,
      );
    this.commands.push('Q');
  }

  line(x1, y1, x2, y2, color = THEME.line, width = 0.5) {
    this.commands.push(
      'q',
      rgb(color, true),
      `${width} w`,
      `${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`,
      'Q',
    );
  }

  text(value, x, y, size = 9, color = THEME.ink, bold = false) {
    this.commands.push(
      'BT',
      rgb(color),
      `/${bold ? 'F2' : 'F1'} ${size} Tf`,
      `1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm`,
      `(${pdfText(value)}) Tj`,
      'ET',
    );
  }

  multiline(lines, x, y, size, leading, color = THEME.ink, bold = false) {
    lines.forEach((line, index) => this.text(line, x, y - index * leading, size, color, bold));
  }

  background() {
    this.rect(0, 0, PAGE.width, PAGE.height, THEME.paper);
    this.rect(0, PAGE.height - 85, PAGE.width, 85, THEME.brand);
    this.rect(0, PAGE.height - 89, PAGE.width, 4, THEME.gold);
    this.rect(PAGE.width - 184, PAGE.height - 85, 184, 85, THEME.brandMid);
  }

  header() {
    this.text('GMAHK GALILEA BALIKPAPAN', MARGIN.left, PAGE.height - 27, 8.2, THEME.goldSoft, true);
    this.text('JADWAL PELAYANAN JEMAAT', MARGIN.left, PAGE.height - 54, 18, THEME.surface, true);
    this.text(this.period, MARGIN.left, PAGE.height - 72, 8.2, THEME.whiteSoft);
    this.text('DIPERBARUI', PAGE.width - 160, PAGE.height - 34, 6.4, THEME.goldSoft, true);
    const updatedLines = wrap(this.updatedAt, 132, 7.1, false).slice(0, 2);
    this.multiline(updatedLines, PAGE.width - 160, PAGE.height - 49, 7.1, 9, THEME.surface, false);
  }

  sectionBanner(title, continued = false) {
    const suffix = continued ? ' · LANJUTAN' : '';
    this.rect(
      MARGIN.left,
      this.cursor - 30,
      PAGE.width - MARGIN.left - MARGIN.right,
      30,
      THEME.brandSoft,
      THEME.line,
      0.6,
    );
    this.rect(MARGIN.left, this.cursor - 30, 5, 30, THEME.gold);
    this.text(
      `${clean(title).toUpperCase()}${suffix}`,
      MARGIN.left + 15,
      this.cursor - 19,
      10,
      THEME.brand,
      true,
    );
    this.text('Tabel jadwal triwulan', PAGE.width - 143, this.cursor - 19, 7.2, THEME.muted);
    this.cursor -= 40;
  }

  tableHeader(definitions) {
    const height = 42;
    const top = this.cursor;
    const bottom = top - height;
    this.rect(
      MARGIN.left,
      bottom,
      PAGE.width - MARGIN.left - MARGIN.right,
      height,
      THEME.brand,
      THEME.brand,
      0.5,
    );
    let x = MARGIN.left;
    definitions.forEach((definition, index) => {
      const lines = wrap(definition.label, definition.width - 10, 6.6, true).slice(0, 3);
      const textY = bottom + height - 13 - Math.max(0, lines.length - 2) * 2.2;
      this.multiline(
        lines,
        x + 6,
        textY,
        6.6,
        8.1,
        index < 2 ? THEME.goldSoft : THEME.surface,
        true,
      );
      x += definition.width;
      if (index < definitions.length - 1) this.line(x, bottom, x, top, [0.33, 0.45, 0.36], 0.5);
    });
    this.cursor = bottom;
  }

  tableRow(definitions, record, index) {
    const values = fieldMap(record);
    const cells = definitions.map((definition) => {
      if (definition.key === '__date')
        return wrap(record.dateLabel || '-', definition.width - 12, 7.5, true).slice(0, 3);
      if (definition.key === '__time')
        return wrap(
          `${clean(record.time).replace(':', '.')} WITA`,
          definition.width - 10,
          6.9,
          true,
        ).slice(0, 2);
      return wrap(values.get(definition.key) || '-', definition.width - 10, 7.2, false).slice(0, 4);
    });
    const lineCount = Math.max(...cells.map((lines) => lines.length), 1);
    const height = Math.max(38, lineCount * 8.8 + 14);
    const top = this.cursor;
    const bottom = top - height;
    const rowFill = index % 2 ? THEME.rowAlt : THEME.surface;
    this.rect(
      MARGIN.left,
      bottom,
      PAGE.width - MARGIN.left - MARGIN.right,
      height,
      rowFill,
      THEME.line,
      0.5,
    );
    let x = MARGIN.left;
    definitions.forEach((definition, cellIndex) => {
      if (cellIndex === 0)
        this.rect(
          x,
          bottom,
          definition.width,
          height,
          index % 2 ? THEME.goldSoft : [0.969, 0.941, 0.872],
        );
      if (cellIndex === 1)
        this.rect(
          x,
          bottom,
          definition.width,
          height,
          index % 2 ? THEME.brandSoft : [0.902, 0.933, 0.886],
        );
      const color = cellIndex < 2 ? THEME.brand : THEME.ink;
      const bold = cellIndex < 2;
      const size = cellIndex === 0 ? 7.5 : cellIndex === 1 ? 6.9 : 7.2;
      this.multiline(cells[cellIndex], x + 6, top - 14, size, 8.8, color, bold);
      x += definition.width;
      if (cellIndex < definitions.length - 1) this.line(x, bottom, x, top, THEME.line, 0.5);
    });
    this.cursor = bottom;
    return height;
  }

  footer(totalPages) {
    this.line(MARGIN.left, 28, PAGE.width - MARGIN.right, 28, THEME.line, 0.65);
    this.text('Website resmi GMAHK Galilea Balikpapan', MARGIN.left, 14, 6.8, THEME.muted);
    this.text('© Sekretaris Jemaat Galilea 2026', PAGE.width / 2 - 87, 14, 6.8, THEME.muted);
    this.text(`Halaman ${this.number} / ${totalPages}`, PAGE.width - 91, 14, 6.8, THEME.muted);
  }

  stream() {
    return this.commands.join('\n');
  }
}

function columnDefinitions(labels) {
  const usableWidth = PAGE.width - MARGIN.left - MARGIN.right;
  const dateWidth = 104;
  const timeWidth = 58;
  const roleWidth = labels.length
    ? (usableWidth - dateWidth - timeWidth) / labels.length
    : usableWidth - dateWidth - timeWidth;
  return [
    { key: '__date', label: 'TANGGAL', width: dateWidth },
    { key: '__time', label: 'JAM', width: timeWidth },
    ...labels.map((label) => ({ key: label, label, width: roleWidth })),
  ];
}

function rowHeightFor(definitions, record) {
  const values = fieldMap(record);
  const counts = definitions.map((definition) => {
    if (definition.key === '__date')
      return wrap(record.dateLabel || '-', definition.width - 12, 7.5, true).slice(0, 3).length;
    if (definition.key === '__time')
      return wrap(
        `${clean(record.time).replace(':', '.')} WITA`,
        definition.width - 10,
        6.9,
        true,
      ).slice(0, 2).length;
    return wrap(values.get(definition.key) || '-', definition.width - 10, 7.2, false).slice(0, 4)
      .length;
  });
  return Math.max(38, Math.max(...counts, 1) * 8.8 + 14);
}

function buildPages(data) {
  const period = clean(data.periodLabel || 'Jadwal Triwulan Aktif');
  const updatedAt = clean(data.updatedAt || new Date().toISOString());
  const pages = [];
  let page = null;

  const newPage = (sectionTitle, definitions, continued = false) => {
    page = new PdfPage(pages.length + 1, period, updatedAt);
    pages.push(page);
    page.sectionBanner(sectionTitle, continued);
    page.tableHeader(definitions);
  };

  (data.sections || []).forEach((section) => {
    const records = Array.isArray(section.records) ? section.records : [];
    if (!records.length) return;
    const title = clean(section.title || section.id || 'Jadwal Ibadah');
    const definitions = columnDefinitions(sectionColumns(section));
    newPage(title, definitions, false);
    records.forEach((record, index) => {
      const nextHeight = rowHeightFor(definitions, record);
      if (page.cursor - nextHeight < MARGIN.bottom + 8) newPage(title, definitions, true);
      page.tableRow(definitions, record, index);
    });
  });

  if (!pages.length) {
    const definitions = columnDefinitions(['Pelayanan', 'Petugas']);
    newPage('Jadwal Ibadah', definitions, false);
    page.text(
      'Belum ada jadwal yang dapat ditampilkan.',
      MARGIN.left + 12,
      page.cursor - 30,
      11,
      THEME.muted,
    );
  }
  pages.forEach((item) => item.footer(pages.length));
  return pages;
}

function buildPdf(data) {
  const pages = buildPages(data);
  const objects = [null];
  const add = (body) => {
    objects.push(body);
    return objects.length - 1;
  };
  const catalogId = add('');
  const pagesId = add('');
  const regularFontId = add(
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
  );
  const boldFontId = add(
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
  );
  const pageIds = [];

  pages.forEach((pageItem) => {
    const content = pageItem.stream();
    const contentId = add(
      `<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}\nendstream`,
    );
    const pageId = add(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE.width} ${PAGE.height}] /Resources << /Font << /F1 ${regularFontId} 0 R /F2 ${boldFontId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
    pageIds.push(pageId);
  });

  objects[catalogId] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId] =
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

  let pdf = '%PDF-1.4\n%âãÏÓ\n';
  const offsets = [0];
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = Buffer.byteLength(pdf, 'latin1');
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1)
    pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, 'latin1');
}

async function websiteData() {
  const url = backendUrl(appsScriptApiUrl());
  const secret = String(process.env.GALILEA_API_SECRET || '');
  if (secret.length < 32) throw new Error('Secret API Vercel belum tersedia.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 55000);
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
    const text = await upstream.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch (_) {
      throw new Error('Respons jadwal dari Apps Script tidak dapat dibaca.');
    }
    if (!upstream.ok || !payload || payload.ok !== true || !payload.data) {
      throw new Error(payload && payload.error ? payload.error : 'Jadwal belum dapat dimuat.');
    }
    return payload.data;
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ ok: false, error: 'Metode tidak didukung.' });
  }
  try {
    const data = await websiteData();
    const pdf = buildPdf(data);
    const safePeriod = clean(data.periodLabel || 'Triwulan-Aktif')
      .replace(/[^A-Za-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="Jadwal-Ibadah-Galilea-${safePeriod}.pdf"`,
    );
    response.setHeader('Content-Length', String(pdf.length));
    response.setHeader('Cache-Control', 'private, no-store, max-age=0');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Galilea-Build', BUILD);
    return response.status(200).send(pdf);
  } catch (error) {
    const timedOut = error && error.name === 'AbortError';
    return response.status(timedOut ? 504 : 500).json({
      ok: false,
      error: timedOut
        ? 'Pembuatan PDF membutuhkan waktu terlalu lama. Silakan coba kembali.'
        : clean(error && error.message ? error.message : error),
    });
  }
}

export { buildPdf };
