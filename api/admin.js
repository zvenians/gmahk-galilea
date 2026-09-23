import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { appsScriptApiUrl } from './_apps-script.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BUILD = 'GALILEA-VERCEL-ADMIN-21.0.0';

function resolveAdminUrl() {
  const raw = 'https://script.google.com/macros/s/AKfycbxOkCVxWcipB8IY6Y9ToTuWfJ-XQAM5VBJLx33qeuuUU8jmaVJjCitgimo50Mq15n_68Q/exec';
  let target;
  try {
    target = new URL(raw);
  } catch (_) {
    throw new Error('URL backend admin tidak valid.');
  }
  const validHost = target.protocol === 'https:' && target.hostname === 'script.google.com';
  const validPath = /^\/macros\/s\/[^/]+\/exec$/.test(target.pathname);
  if (!validHost || !validPath) throw new Error('URL backend admin belum dikonfigurasi dengan benar.');
  target.searchParams.set('page', 'admin');
  return target;
}

let cachedAdminHtml = null;

function loadAdminHtml() {
  if (cachedAdminHtml) return cachedAdminHtml;
  const candidates = [
    path.resolve(process.cwd(), 'apps-script-backend/Admins.html'),
    path.resolve(__dirname, '../apps-script-backend/Admins.html'),
    path.resolve(__dirname, 'Admins.html')
  ];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        let content = fs.readFileSync(candidate, 'utf8');
        content = content.replace(/<\?!=\s*JSON\.stringify\(appUrl\s*\|\|\s*''\)\s*\?>/g, JSON.stringify('/admin'));
        cachedAdminHtml = content;
        return cachedAdminHtml;
      }
    } catch (_) {}
  }
  throw new Error('File Admins.html tidak ditemukan pada serverless bundle.');
}

function parseBody(request) {
  if (request.body && typeof request.body === 'object') return request.body;
  if (typeof request.body === 'string' && request.body.trim()) {
    try { return JSON.parse(request.body); } catch (_) { return {}; }
  }
  return {};
}

function reply(response, status, body) {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store, max-age=0');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Galilea-Admin-Build', BUILD);
  return response.status(status).json(body);
}

async function callGoogleAppsScript(method, args) {
  const apiUrl = process.env.GALILEA_APPS_SCRIPT_API_URL || appsScriptApiUrl();
  const secret = String(process.env.GALILEA_API_SECRET || '');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    const upstream = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Accept': 'application/json',
        'User-Agent': BUILD
      },
      body: JSON.stringify({ secret, method, args }),
      redirect: 'follow',
      signal: controller.signal
    });
    
    const text = await upstream.text();
    console.log('[APPS_SCRIPT_RES]', method, text.slice(0, 200));
    
    if (!upstream.ok) {
      return { ok: false, error: 'Server merespons dengan status ' + upstream.status + ': ' + text.slice(0, 100) };
    }
    
    const contentType = upstream.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      return { ok: false, error: 'Respons backend Apps Script bukan JSON (kemungkinan crash): ' + text.slice(0, 160) };
    }
    
    try {
      return JSON.parse(text);
    } catch (_) {
      return { ok: false, error: 'Gagal membaca response backend sebagai JSON.' };
    }
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : String(err) };
  } finally {
    clearTimeout(timer);
  }
}

let cachedLiveSiteData = null;
let cachedLiveSiteDataTime = 0;

async function fetchLiveWebsiteData(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedLiveSiteData && (now - cachedLiveSiteDataTime) < 30000) {
    return cachedLiveSiteData;
  }
  const apiUrl = appsScriptApiUrl();
  const secret = String(process.env.GALILEA_API_SECRET || '');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const upstream = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Accept': 'application/json',
        'User-Agent': BUILD
      },
      body: JSON.stringify({ secret, method: 'getWebsiteData', args: [] }),
      redirect: 'follow',
      signal: controller.signal
    });
    const text = await upstream.text();
    const parsed = JSON.parse(text);
    if (parsed && parsed.ok && parsed.data) {
      cachedLiveSiteData = parsed.data;
      cachedLiveSiteDataTime = now;
      return cachedLiveSiteData;
    }
  } catch (_) {
  } finally {
    clearTimeout(timer);
  }

  try {
    const res = await callGoogleAppsScript('getWebsiteData', []);
    if (res && res.ok && res.data) {
      cachedLiveSiteData = res.data;
      cachedLiveSiteDataTime = now;
      return cachedLiveSiteData;
    }
  } catch (_) {}

  try {
    const bridgeRes = await fetch('https://gmahk-galilea.vercel.app/api/gas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'getWebsiteData', args: [] })
    });
    const bridgeJson = await bridgeRes.json();
    if (bridgeJson && bridgeJson.ok && bridgeJson.data) {
      cachedLiveSiteData = bridgeJson.data;
      cachedLiveSiteDataTime = now;
      return cachedLiveSiteData;
    }
  } catch (_) {}

  return cachedLiveSiteData || {};
}

// Entity schema field definitions matching Admin.gs
const ENTITY_SCHEMAS = {
  announcements: {
    label: 'Agenda dan Pengumuman',
    icon: 'bell',
    fields: [
      { key: 'date', label: 'Tanggal Informasi / Acara', type: 'date', required: true, help: 'Tanggal yang akan dibaca jemaat pada Agenda dan Pengumuman.' },
      { key: 'title', label: 'Judul', type: 'text', required: true },
      { key: 'summary', label: 'Isi Pengumuman', type: 'textarea', required: true, help: 'Tulis singkat, jelas, dan siap dimasukkan ke Warta serta WhatsApp.' },
      { key: 'url', label: 'Tautan Selengkapnya', type: 'url', required: false },
      { key: 'endDate', label: 'Berakhir Tampil', type: 'date', required: false, help: 'Setelah tanggal ini pengumuman otomatis berhenti tampil.' },
      { key: 'priority', label: 'Prioritas', type: 'select', required: true, options: ['NORMAL', 'IBADAH', 'PENTING'] },
      { key: 'includeInBulletin', label: 'Masukkan ke Warta', type: 'select', required: true, options: ['YA', 'TIDAK'], help: 'Pilih YA agar pengumuman ikut masuk PDF dan pesan Warta Jemaat.' },
      { key: 'category', label: 'Kategori Tampilan', type: 'select', required: true, options: ['RABU MALAM', 'IBADAH KHOTBAH', 'SEKOLAH SABAT', 'PEMUDA ADVENT', 'UMUM'], help: 'Kategori memisahkan pengumuman dan menentukan kelompok Mode Layar.' }
    ]
  },
  activities: {
    label: 'Berita Jemaat',
    icon: 'newspaper',
    fields: [
      { key: 'date', label: 'Tanggal Kejadian', type: 'date', required: true },
      { key: 'title', label: 'Judul Berita', type: 'text', required: true },
      { key: 'location', label: 'Lokasi', type: 'text', required: false },
      { key: 'description', label: 'Isi Berita', type: 'textarea', required: true },
      { key: 'url', label: 'Tautan', type: 'url', required: false },
      { key: 'photos', label: 'Foto Berita', type: 'images', required: false }
    ]
  },
  themeSong: {
    label: 'Lagu Tema',
    icon: 'music',
    fields: [
      { key: 'title', label: 'Judul Lagu Tema', type: 'text', required: true, help: 'Judul ini tampil paling atas pada halaman Lagu Sion.' },
      { key: 'verse1', label: 'Ayat 1', type: 'textarea', required: true, help: 'Ketik lirik Ayat 1 di sini. Pisahkan setiap baris lirik dengan Enter.' },
      { key: 'verse2', label: 'Ayat 2', type: 'textarea', required: false, help: 'Ketik lirik Ayat 2 di sini. Kosongkan bila lagu hanya memiliki satu ayat.' },
      { key: 'verse3', label: 'Ayat Tambahan', type: 'textarea', required: false, help: 'Opsional untuk Ayat 3 atau ayat berikutnya.' },
      { key: 'refrain', label: 'Reff', type: 'textarea', required: false, help: 'Ketik bagian Reff di sini. Reff akan diberi tanda khusus pada layar.' },
      { key: 'note', label: 'Catatan Internal', type: 'textarea', required: false, help: 'Opsional, misalnya masa penggunaan lagu tema.' }
    ]
  },
  gallery: {
    label: 'Galeri',
    icon: 'image',
    fields: [
      { key: 'imageUrl', label: 'Foto', type: 'image', required: true },
      { key: 'title', label: 'Judul', type: 'text', required: true },
      { key: 'caption', label: 'Keterangan', type: 'textarea', required: false }
    ]
  },
  leaders: {
    label: 'Pengurus Gereja',
    icon: 'users',
    fields: [
      { key: 'order', label: 'Urutan', type: 'number', required: true },
      { key: 'name', label: 'Nama', type: 'text', required: true },
      { key: 'role', label: 'Jabatan', type: 'text', required: true },
      { key: 'photoUrl', label: 'Foto', type: 'image', required: false },
      { key: 'description', label: 'Deskripsi', type: 'textarea', required: false }
    ]
  },
  banners: {
    label: 'Pengumuman Terjadwal',
    icon: 'flag',
    fields: [
      { key: 'startDate', label: 'Mulai Tampil', type: 'date', required: true },
      { key: 'endDate', label: 'Berakhir', type: 'date', required: false },
      { key: 'title', label: 'Judul', type: 'text', required: true },
      { key: 'message', label: 'Pesan', type: 'textarea', required: true },
      { key: 'url', label: 'Tautan', type: 'url', required: false },
      { key: 'buttonLabel', label: 'Label Tombol', type: 'text', required: false },
      { key: 'variant', label: 'Jenis', type: 'select', required: true, options: ['INFO', 'PENTING', 'IBADAH'] }
    ]
  },
  faq: {
    label: 'FAQ Jemaat',
    icon: 'help',
    fields: [
      { key: 'category', label: 'Kategori', type: 'text', required: true },
      { key: 'question', label: 'Pertanyaan', type: 'textarea', required: true },
      { key: 'answer', label: 'Jawaban', type: 'textarea', required: true },
      { key: 'order', label: 'Urutan', type: 'number', required: true }
    ]
  },
  worshipPlans: {
    label: 'Susunan Ibadah',
    icon: 'layout',
    fields: [
      { key: 'date', label: 'Tanggal Ibadah', type: 'date', required: true },
      { key: 'type', label: 'Jenis Ibadah', type: 'select', required: true, options: ['Kebaktian Khotbah', 'Sekolah Sabat', 'Rabu Malam', 'Pemuda Advent'] },
      { key: 'theme', label: 'Tema Ibadah', type: 'text', required: true },
      { key: 'scripture', label: 'Ayat Inti', type: 'text', required: false },
      { key: 'openingSong', label: 'Lagu Buka', type: 'text', required: false },
      { key: 'closingSong', label: 'Lagu Tutup', type: 'text', required: false },
      { key: 'preacher', label: 'Pengkhotbah / Pembicara', type: 'text', required: false },
      { key: 'notes', label: 'Catatan Petugas', type: 'textarea', required: false }
    ]
  },
  settings: {
    label: 'Identitas & Tampilan',
    icon: 'settings',
    fields: [
      { key: 'key', label: 'Pengaturan', type: 'text', required: true },
      { key: 'value', label: 'Nilai Pengaturan', type: 'textarea', required: true }
    ]
  },
  schedule: {
    label: 'Jadwal Pelayanan',
    icon: 'calendar',
    fields: []
  }
};

// Internal active store for administrative state



export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store, max-age=0');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Galilea-Admin-Build', BUILD);

  // 1. GET requests: Redirect to authenticated Apps Script URL
  if (request.method === 'GET' || request.method === 'HEAD') {
    try {
      const target = resolveAdminUrl();
      console.info('[api/admin] redirecting to authenticated Apps Script Admin UI');
      return response.redirect(307, target.toString());
    } catch (err) {
      return response.status(503).send('URL Apps Script admin belum siap.');
    }
  }

  // 2. POST requests: Admin operations connected to REAL Google Sheets data
  if (request.method === 'POST') {
    const body = parseBody(request);
    const method = String(body.method || '');
    const args = Array.isArray(body.args) ? body.args : [];

    if (!method) {
      return reply(response, 400, { ok: false, error: 'Nama method tidak boleh kosong.' });
    }

    if (method.startsWith('admin')) {
      return reply(response, 403, { ok: false, error: 'FORBIDDEN: Endpoint ini telah dikunci untuk mencegah akses anonim. Silakan akses portal dari environment yang terautentikasi (Apps Script).' });
    }

    try {
      const upstreamResult = await callGoogleAppsScript(method, args);
      if (upstreamResult && upstreamResult.ok === true) {
        if (method === 'adminListEntity' && args[0] === 'themeSong' && (!upstreamResult.data?.records || upstreamResult.data.records.length === 0)) {
          const siteData = await fetchLiveWebsiteData();
          const song = siteData.themeSong;
          if (song) {
            const v1 = song.lyrics?.find(l => l.type === 'verse' && l.index === 1)?.lines?.join('\n') || '';
            const v2 = song.lyrics?.find(l => l.type === 'verse' && l.index === 2)?.lines?.join('\n') || '';
            const v3 = song.lyrics?.find(l => l.type === 'verse' && l.index === 3)?.lines?.join('\n') || '';
            const ref = song.lyrics?.find(l => l.type === 'chorus' || l.type === 'refrain')?.lines?.join('\n') || '';
            upstreamResult.data.records = [{
              id: song.id || 'THEME-01',
              title: song.title || 'Lagu Tema Jemaat',
              status: 'PUBLISH',
              group: 'Lagu Sion',
              values: {
                title: song.title || '',
                verse1: v1,
                verse2: v2,
                verse3: v3,
                refrain: ref,
                note: song.note || song.source || ''
              }
            }];
          }
        }
        // Invalidate cache after successful write operations
        const WRITE_METHODS = ['adminSaveWorkflow','adminReviewWorkflow','adminCancelWorkflow','adminDeleteWorkflow','adminDeleteApproval','adminSaveUser','adminDeleteUser','adminUploadImage','adminUpdateServiceStatus','adminDeleteService','adminRunSystemAction'];
        if (WRITE_METHODS.includes(method)) {
          cachedLiveSiteData = null;
        }
        return reply(response, 200, upstreamResult);
      }

      // ----------------------------------------------------------------------
      // STEP B: LOCAL EXECUTION (ONLY FOR CACHE REFRESH)
      // ----------------------------------------------------------------------
      
      // Method 18: adminRunSystemAction — only Vercel-side cache clear is handled locally
      if (method === 'adminRunSystemAction') {
        const [action] = args;
        if (action === 'refresh' || action === 'purgeCache') {
          cachedLiveSiteData = null;
          await fetchLiveWebsiteData(true);
          return reply(response, 200, {
            ok: true,
            message: 'Cache berhasil diperbarui. Data terbaru dari Google Sheets siap ditampilkan.'
          });
        }
        // health, archives, backup, etc. must go through Apps Script
      }

      return reply(response, 502, {
        ok: false,
        error: (upstreamResult && upstreamResult.error) ? 'Apps Script Error: ' + upstreamResult.error : 'Operasi ' + method + ' belum dapat diselesaikan oleh backend Apps Script.'
      });
    } catch (err) {
      console.error('[api/admin] Error processing method ' + method + ':', err);
      return reply(response, 500, {
        ok: false,
        error: 'Gangguan server admin: ' + (err && err.message ? err.message : String(err))
      });
    }
  }

  response.setHeader('Allow', 'GET, POST, HEAD');
  return reply(response, 405, { ok: false, error: 'Metode tidak didukung.' });
}
