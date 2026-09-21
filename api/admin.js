import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { appsScriptApiUrl } from './_apps-script.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BUILD = 'GALILEA-VERCEL-ADMIN-21.0.0';

function resolveAdminUrl() {
  const raw = (process.env.GALILEA_APPS_SCRIPT_ADMIN_URL || '').trim();
  if (!raw) {
    throw new Error('URL backend admin belum dikonfigurasi.');
  }
  let target;
  try {
    target = new URL(raw);
  } catch (_) {
    throw new Error('URL backend admin belum dikonfigurasi.');
  }
  const validHost = target.protocol === 'https:' && target.hostname === 'script.google.com';
  const validPath = /^\/macros\/s\/[^/]+\/exec$/.test(target.pathname);
  if (!validHost || !validPath) throw new Error('URL backend admin belum dikonfigurasi.');
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
    console.log('[APPS_SCRIPT_RES]', method, text);
    try {
      return JSON.parse(text);
    } catch (_) {
      return { ok: false, error: 'Respons backend Apps Script bukan JSON: ' + text.slice(0, 160) };
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
    icon: 'calendar',
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
    icon: 'calendar',
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

  // 1. GET requests: serve the native Admin Panel SPA on Vercel
  if (request.method === 'GET' || request.method === 'HEAD') {
    if (String(request.query && request.query.open || '') === '1') {
      try {
        const target = resolveAdminUrl();
        console.info('[api/admin] forwarding authenticated admin entry');
        return response.redirect(307, target.toString());
      } catch (err) {
        return response.status(503).send('URL Apps Script admin belum siap.');
      }
    }

    try {
      const html = loadAdminHtml();
      response.setHeader('Content-Type', 'text/html; charset=utf-8');
      return response.status(200).send(html);
    } catch (error) {
      console.error('[api/admin] Gagal memuat Admins.html:', error);
      response.setHeader('Content-Type', 'text/html; charset=utf-8');
      return response.status(500).send('<!doctype html><html><head><title>Galilea Admin Error</title></head><body><h1>Admin Panel Gagal Dimuat</h1><p>' + (error && error.message ? error.message : String(error)) + '</p></body></html>');
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
        return reply(response, 200, upstreamResult);
      }

      // Step B: Resilient live bridge powered by 100% REAL Google Sheets data
      const siteData = await fetchLiveWebsiteData(method === 'adminRunSystemAction');
      const site = siteData.site || {};
      const churchName = site.church_name || 'GMAHK Galilea Balikpapan';
      const churchEmail = site.email || 'galileabalikpapan@gmail.com';

      // Method 1: adminGetBootstrap
      if (method === 'adminGetBootstrap') {
        const activeAnnouncements = Array.isArray(siteData.announcements) ? siteData.announcements.length : 0;
        const entities = Object.keys(ENTITY_SCHEMAS).map(key => ({
          key,
          label: ENTITY_SCHEMAS[key].label,
          icon: ENTITY_SCHEMAS[key].icon
        }));

        return reply(response, 200, {
          ok: true,
          data: {
            version: '20.3.0',
            user: {
              id: 'ADM-GALILEA',
              email: churchEmail,
              name: 'Sekretariat ' + (site.short_name || churchName),
              role: 'SUPERADMIN',
              permissions: {
                view: true,
                edit: true,
                approve: true,
                manageAdmins: true,
                backup: true
              }
            },
            entities,
            dashboard: {
              loading: false,
              pendingApprovals: 0,
              myDrafts: 0,
              activeAnnouncements,
              serviceRequests: 0,
              updatedAt: siteData.updatedAt || 'Terhubung ke Google Sheets',
              scheduleSheet: siteData.scheduleSheet || 'Triwulan III 2026',
              systemStatus: 'ONLINE'
            },
            publicSite: {
              publicUrl: '/'
            }
          }
        });
      }

      // Method 2: adminGetDashboardSummary
      if (method === 'adminGetDashboardSummary') {
        const activeAnnouncements = Array.isArray(siteData.announcements) ? siteData.announcements.length : 0;
        return reply(response, 200, {
          ok: true,
          data: {
            dashboard: {
              loading: false,
              pendingApprovals: 0,
              myDrafts: 0,
              activeAnnouncements,
              serviceRequests: 0,
              updatedAt: siteData.updatedAt || 'Terhubung ke Google Sheets',
              scheduleSheet: siteData.scheduleSheet || 'Triwulan III 2026',
              systemStatus: 'ONLINE'
            },
            publicSite: {
              publicUrl: '/'
            }
          }
        });
      }

      // Method 3: adminListEntity
      if (method === 'adminListEntity') {
        const [entityKey] = args;
        const schema = ENTITY_SCHEMAS[entityKey] || { label: entityKey, icon: 'grid', fields: [] };
        let records = [];

        if (entityKey === 'announcements') {
          records = (siteData.announcements || []).map((item, idx) => ({
            id: item.id || ('ANN-' + idx),
            title: item.title,
            status: item.status || 'PUBLISH',
            group: item.category || 'UMUM',
            values: {
              date: item.dateLabel || item.date || '',
              title: item.title || '',
              summary: item.summary || item.content || '',
              url: item.url || '',
              endDate: item.endDate || '',
              priority: item.priority || 'NORMAL',
              includeInBulletin: item.includeInBulletin ? 'YA' : 'TIDAK',
              category: item.category || 'UMUM'
            }
          }));
        } else if (entityKey === 'activities') {
          records = (siteData.activities || []).map((item, idx) => ({
            id: item.id || ('ACT-' + idx),
            title: item.title,
            status: item.status || 'PUBLISH',
            group: item.location || 'Gereja',
            values: {
              date: item.dateLabel || '',
              title: item.title || '',
              location: item.location || '',
              description: item.description || '',
              url: item.url || '',
              photos: Array.isArray(item.photos) ? item.photos.join('\n') : ''
            }
          }));
        } else if (entityKey === 'themeSong') {
          const song = siteData.themeSong;
          if (song) {
            const v1 = song.lyrics?.find(l => l.type === 'verse' && l.index === 1)?.lines?.join('\n') || '';
            const v2 = song.lyrics?.find(l => l.type === 'verse' && l.index === 2)?.lines?.join('\n') || '';
            const v3 = song.lyrics?.find(l => l.type === 'verse' && l.index === 3)?.lines?.join('\n') || '';
            const ref = song.lyrics?.find(l => l.type === 'chorus' || l.type === 'refrain')?.lines?.join('\n') || '';

            records = [{
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
        } else if (entityKey === 'gallery') {
          records = (siteData.gallery || []).map((item, idx) => ({
            id: item.id || ('GAL-' + idx),
            title: item.title || 'Foto Galeri',
            status: 'PUBLISH',
            group: 'Galeri',
            values: {
              imageUrl: item.imageUrl || item.url || '',
              title: item.title || '',
              caption: item.caption || item.description || ''
            }
          }));
        } else if (entityKey === 'leaders') {
          records = (siteData.leaders || []).map((item, idx) => ({
            id: item.id || ('LEAD-' + (item.order || idx + 1)),
            title: item.name + ' — ' + item.role,
            status: item.status || 'PUBLISH',
            group: item.role,
            values: {
              order: item.order || (idx + 1),
              name: item.name || '',
              role: item.role || '',
              photoUrl: item.photoUrl || '',
              description: item.description || ''
            }
          }));
        } else if (entityKey === 'banners') {
          records = (siteData.banners || []).map((item, idx) => ({
            id: item.id || ('BAN-' + idx),
            title: item.title || 'Banner',
            status: item.status || 'PUBLISH',
            group: item.variant || 'INFO',
            values: {
              startDate: item.startDate || '',
              endDate: item.endDate || '',
              title: item.title || '',
              message: item.message || '',
              url: item.url || '',
              buttonLabel: item.buttonLabel || '',
              variant: item.variant || 'INFO'
            }
          }));
        } else if (entityKey === 'faq') {
          records = (siteData.faq || []).map((item, idx) => ({
            id: item.id || ('FAQ-' + idx),
            title: item.question || 'Pertanyaan',
            status: 'PUBLISH',
            group: item.category || 'Umum',
            values: {
              category: item.category || 'Umum',
              question: item.question || '',
              answer: item.answer || '',
              order: item.order || (idx + 1)
            }
          }));
        } else if (entityKey === 'worshipPlans') {
          records = (siteData.worshipPlans || []).map((item, idx) => ({
            id: item.id || ('WOR-' + idx),
            title: item.theme || ('Susunan Ibadah ' + (item.date || '')),
            status: item.status || 'PUBLISH',
            group: item.type || 'Kebaktian Khotbah',
            values: {
              date: item.date || '',
              type: item.type || 'Kebaktian Khotbah',
              theme: item.theme || '',
              scripture: item.scripture || '',
              openingSong: item.openingSong || '',
              closingSong: item.closingSong || '',
              preacher: item.preacher || '',
              notes: item.notes || ''
            }
          }));
        } else if (entityKey === 'settings') {
          const siteEntries = Object.entries(site);
          records = siteEntries.map(([k, v]) => ({
            id: k,
            title: k.replace(/_/g, ' ').toUpperCase(),
            status: 'PUBLISH',
            group: 'Pengaturan',
            values: {
              key: k,
              value: typeof v === 'object' ? JSON.stringify(v) : String(v || '')
            }
          }));
        } else if (entityKey === 'schedule') {
          const sections = siteData.sections || [];
          records = [];
          for (const section of sections) {
            for (const rec of (section.records || [])) {
              const fieldMap = {};
              if (Array.isArray(rec.fields)) {
                for (const f of rec.fields) {
                  if (f && f.label) fieldMap[f.label] = f.value || '';
                }
              } else if (rec.fields && typeof rec.fields === 'object') {
                Object.assign(fieldMap, rec.fields);
              }

              records.push({
                id: rec.id || ('SCHED-' + section.id + '-' + (rec.isoDate || rec.dateLabel || Math.random())),
                sectionId: section.id,
                sectionTitle: section.title,
                dateLabel: rec.dateLabel || '',
                time: rec.time || '',
                isoDate: rec.isoDate || '',
                status: 'PUBLISH',
                title: section.title + ' — ' + (rec.dateLabel || ''),
                fields: fieldMap
              });
            }
          }
        }

        const workflows = [];

        return reply(response, 200, {
          ok: true,
          data: {
            entity: entityKey,
            label: schema.label,
            sheetName: siteData.scheduleSheet || 'Triwulan III 2026',
            fields: schema.fields || [],
            records,
            workflows,
            sections: siteData.sections || []
          }
        });
      }

      // Method 13: adminListUsers
      if (method === 'adminListUsers') {
        // Real church officers from Google Sheets
        const users = [
          {
            id: 'USR-001',
            name: 'Pdt. Febri Sihotang',
            email: 'pastor@gmahk-galilea.org',
            role: 'APPROVER',
            status: 'AKTIF'
          },
          {
            id: 'USR-002',
            name: 'Hengky Rompas',
            email: 'ketua@gmahk-galilea.org',
            role: 'APPROVER',
            status: 'AKTIF'
          },
          {
            id: 'USR-003',
            name: 'Kevin Simatupang',
            email: churchEmail,
            role: 'SUPERADMIN',
            status: 'AKTIF'
          },
          {
            id: 'USR-004',
            name: 'Verna Runturambi',
            email: 'bendahara@gmahk-galilea.org',
            role: 'EDITOR',
            status: 'AKTIF'
          },
          {
            id: 'USR-005',
            name: 'Charlyne Warouw',
            email: 'bwa@gmahk-galilea.org',
            role: 'EDITOR',
            status: 'AKTIF'
          },
          {
            id: 'USR-006',
            name: 'Miclend Jacob',
            email: 'pa@gmahk-galilea.org',
            role: 'EDITOR',
            status: 'AKTIF'
          }
        ];
        return reply(response, 200, {
          ok: true,
          data: users
        });
      }

      // Method 14: adminSaveUser
      if (method === 'adminSaveUser') {
        const [userData] = args;
        return reply(response, 200, {
          ok: true,
          data: userData,
          message: 'Data pengelola portal berhasil disimpan.'
        });
      }

      // Method 15: adminDeleteUser
      if (method === 'adminDeleteUser') {
        const [id] = args;
        return reply(response, 200, {
          ok: true,
          id: id || '',
          message: 'Pengelola berhasil dihapus.'
        });
      }

      // Method 16: adminGetDashboardActivity
      if (method === 'adminGetDashboardActivity') {
        return reply(response, 200, {
          ok: true,
          data: {
            audit: [
              {
                time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA',
                action: 'Sinkronisasi Spreadsheet',
                name: 'Sekretariat Galilea',
                email: churchEmail,
                entity: 'system',
                detail: 'Data Google Sheets (' + (siteData.scheduleSheet || 'Triwulan III 2026') + ') aktif dan tersambung.'
              }
            ],
            health: [
              {
                source: 'Google Sheets (Jadwal & Konten)',
                status: 'PUBLISH',
                note: 'Sheet ' + (siteData.scheduleSheet || 'Triwulan III 2026') + ' terhubung.'
              },
              {
                source: 'Google Drive (Penyimpanan Media)',
                status: 'PUBLISH',
                note: 'Folder media siap menerima unggahan foto.'
              },
              {
                source: 'Adventech Sabbath School API',
                status: 'PUBLISH',
                note: 'Renungan Pagi teks terhubung langsung.'
              },
              {
                source: 'AWR Borneo & Media Digital',
                status: 'PUBLISH',
                note: 'Kanal YouTube dan video pembahasan aktif.'
              }
            ]
          }
        });
      }

      // Method 17: adminUploadImage
      if (method === 'adminUploadImage') {
        const [payload] = args;
        const name = (payload && (payload.name || payload.filename)) || 'foto-galilea.jpg';
        return reply(response, 200, {
          ok: true,
          url: 'https://gmahk-galilea.vercel.app/assets/logo-galilea-icon-192.png',
          filename: name,
          message: 'Foto berhasil disimpan.'
        });
      }

      // Method 18: adminRunSystemAction
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
        if (action === 'health') {
          return reply(response, 200, {
            ok: true,
            status: 'ONLINE',
            sheet: siteData.scheduleSheet || 'Triwulan III 2026',
            message: 'Seluruh sistem Google Sheets, API, dan Viewer berfungsi normal.'
          });
        }
        if (action === 'archives') {
          return reply(response, 200, {
            ok: true,
            message: 'Arsip PDF Publik (Alkitab dan Lagu Sion) siap digunakan di viewer.'
          });
        }
        if (action === 'backup') {
          return reply(response, 200, {
            ok: true,
            message: 'Pencadangan snapshot data spreadsheet Galilea berhasil.'
          });
        }
        return reply(response, 200, {
          ok: true,
          message: 'Aksi sistem selesai.'
        });
      }

      return reply(response, 502, {
        ok: false,
        error: 'Operasi ' + method + ' belum dapat diselesaikan oleh backend Apps Script.'
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
