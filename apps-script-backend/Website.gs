/**
 * GALILEA PORTAL V16 — CINEMATIC SANCTUARY
 * Backend website GMAHK Galilea Balikpapan.
 *
 * File ini menggantikan isi Website.gs lama. Code.gs tidak perlu diubah.
 * Jalankan setupWebsiteGalilea() satu kali setelah menempelkan file.
 */

const GW = Object.freeze({
  VERSION: '20.3.0',
  BUILD_ID: 'GALILEA-20260903-ADMIN-BOOTSTRAP-2030',
  TITLE: 'GMAHK Galilea Balikpapan',
  TIMEZONE: 'Asia/Makassar',
  UTC_OFFSET: '+08:00',
  SPREADSHEET_PROPERTY: 'GALILEA_SPREADSHEET_ID',
  CACHE_REVISION_PROPERTY: 'GALILEA_CACHE_REVISION_V2000',
  YOUTUBE_KEY_PROPERTY: 'GALILEA_YOUTUBE_API_KEY',
  YOUTUBE_CHANNEL_PROPERTY: 'GALILEA_AWR_BORNEO_CHANNEL_ID',
  SERVICE_SPREADSHEET_PROPERTY: 'GALILEA_SERVICE_SPREADSHEET_ID',
  TITLE_MARKER: 'JADWAL IBADAH JEMAAT GALILEA',
  CACHE_SECONDS: 60,
  SHEETS: Object.freeze({
    settings: 'Website Setting',
    announcements: 'Website Pengumuman',
    activities: 'Website Kegiatan',
    gallery: 'Website Galeri',
    leaders: 'Website Pengurus',
    banners: 'Website Banner',
    services: 'Website Layanan',
    faq: 'Website FAQ',
    health: 'Website Pemeriksaan',
    mission: 'API Berita Misi',
    offering: 'API Bacaan Persembahan',
    adventTheme: 'Website Tema Advent',
    themeSong: 'Website Lagu Tema',
    worshipPlans: 'Website Susunan Ibadah'
  }),
  SOURCES: Object.freeze({
    sabbath: 'https://sabbath-school.adventech.io/api/v2',
    sabbathWeb: 'https://sabbath-school.adventech.io',
    wordpress: Object.freeze([
      'https://ibadahadvent.wordpress.com/wp-json/wp/v2',
      'https://public-api.wordpress.com/wp/v2/sites/ibadahadvent.wordpress.com'
    ]),
    bible: 'https://raw.githubusercontent.com/neocarles/alkitab-tb/master/Alkitab/',
    
    hymnal: 'https://raw.githubusercontent.com/PaulTitto/LaguSion-indo/main/sda-hymnal-db-in.json',
    hymnalProject: 'https://github.com/PaulTitto/LaguSion-indo',
    adventTheme: 'https://news.adventist.asia/all/ssd-launches-mission-reaps',
    adventLogo: 'https://gmahk-galilea.vercel.app/assets/logo-galilea-icon-192.png',
    devotionalYoutubeChannel: '',
    devotionalYoutubeHandle: '@HopeChannelIndonesiaTV',
    devotionalYoutubeUrl: 'https://www.youtube.com/@HopeChannelIndonesiaTV'
  }),
  WORDPRESS_CATEGORIES: Object.freeze({ mission: '557252025', offering: '762775280' }),
  SCHEDULES: Object.freeze([
    Object.freeze({
      id: 'khotbah',
      title: 'Kebaktian Khotbah',
      anchor: 'KEBAKTIAN KHOTBAH',
      time: '09:00',
      color: '#52705C',
      columns: Object.freeze([
        Object.freeze(['Pendamping 1', 1]), Object.freeze(['Pendamping 2', 2]),
        Object.freeze(['Pengkhotbah', 3]), Object.freeze(['Lagu Pujian', 4]),
        Object.freeze(['Khotbah Anak-anak', 5]), Object.freeze(['Chorister', 6]),
        Object.freeze(['Diakon/es Bertugas', 7]), Object.freeze(['Pianis', 8]),
        Object.freeze(['Cuci Piring', 9]), Object.freeze(['Keterangan', 10])
      ])
    }),
    Object.freeze({
      id: 'sekolahSabat',
      title: 'Sekolah Sabat',
      anchor: 'SEKOLAH SABAT',
      time: '09:00',
      color: '#6B7F58',
      columns: Object.freeze([
        Object.freeze(['Pemimpin Acara', 1]), Object.freeze(['Ayat Inti / Doa Buka', 3]),
        Object.freeze(['Acara Rumah Tangga', 4]), Object.freeze(['Lagu Pujian', 6]),
        Object.freeze(['Berita Misi', 7]), Object.freeze(['Pembawa Pelajaran', 9]),
        Object.freeze(['Doa Tutup', 10])
      ])
    }),
    Object.freeze({
      id: 'doa',
      title: 'Kebaktian Permintaan Doa',
      anchor: 'KEBAKTIAN PERMINTAAN DOA',
      time: '19:00',
      color: '#7C7358',
      columns: Object.freeze([
        Object.freeze(['Pemimpin Acara', 1]), Object.freeze(['Pembicara', 3]),
        Object.freeze(['Lagu Pujian', 5]), Object.freeze(['Doa Syafaat', 6]),
        Object.freeze(['Doa Tutup', 8]), Object.freeze(['Tempat', 9]),
        Object.freeze(['Pianis', 10])
      ])
    }),
    Object.freeze({
      id: 'pemuda',
      title: 'Kebaktian Pemuda Advent',
      anchor: 'KEBAKTIAN PEMUDA ADVENT',
      time: '15:00',
      color: '#5E7062',
      columns: Object.freeze([
        Object.freeze(['Pemimpin Acara', 2]), Object.freeze(['Ayat Inti / Doa Buka', 4]),
        Object.freeze(['Acara', 6]), Object.freeze(['Kuis Alkitab', 8]),
        Object.freeze(['Bacaan / Diskusi', 9]), Object.freeze(['Cadangan', 11])
      ])
    })
  ])
});

/** Menampilkan website dan tetap dapat disematkan sebagai full-page embed di Google Sites. */
function doGet(e) {
  if (e && e.parameter && e.parameter.asset === 'manifest') {
    return ContentService.createTextOutput(JSON.stringify({
      name: GW.TITLE,
      short_name: 'Galilea',
      start_url: ScriptApp.getService().getUrl() || '.',
      display: 'standalone',
      background_color: '#F3F5EF',
      theme_color: '#476452',
      description: 'Jadwal, pelayanan, dan informasi resmi GMAHK Galilea Balikpapan.'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  const adminRoute = e && e.parameter ? String(e.parameter.portal || e.parameter.page || '').toLowerCase() : '';
  const wantsAdmin = adminRoute === 'admin';
  const template = wantsAdmin ? gwAdminTemplate_() : HtmlService.createTemplateFromFile('Index');
  template.appUrl = ScriptApp.getService().getUrl() || '';
  return template.evaluate()
    .setTitle(wantsAdmin ? 'Portal Sekretariat — ' + GW.TITLE : GW.TITLE + ' — Website Resmi')
    .setFaviconUrl(GW.SOURCES.adventLogo)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
}

/**
 * Apps Script tidak mengizinkan Admin.gs dan Admin.html memakai nama dasar yang sama.
 * Nama baku paket adalah Admins.html; varian huruf kecil tetap didukung agar portal lama tidak gagal.
 */
function gwAdminTemplate_() {
  const names = ['Admins', 'admins'];
  for (let index = 0; index < names.length; index++) {
    try { return HtmlService.createTemplateFromFile(names[index]); }
    catch (ignore) {}
  }
  throw new Error('File HTML portal admin belum ditemukan. Buat file HTML bernama Admins (akan tampil sebagai Admins.html).');
}

/**
 * Jalankan satu kali dari Apps Script yang terikat pada spreadsheet jadwal.
 * Fungsi ini tidak mengubah Code.gs dan tidak menimpa data sheet yang sudah ada.
 */
function setupWebsiteGalilea() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('Buka Apps Script dari Spreadsheet Jadwal Ibadah, lalu jalankan setupWebsiteGalilea() kembali.');
  }
  const actor = gwClean_(Session.getEffectiveUser().getEmail() || Session.getActiveUser().getEmail());
  if (!actor) throw new Error('Email akun Google belum terbaca. Jalankan setup langsung dari editor Apps Script milik spreadsheet.');

  const report = [];
  const stage = function (label, callback) {
    try {
      const value = callback();
      report.push('OK · ' + label);
      return value;
    } catch (error) {
      const message = gwErrorMessage_(error);
      console.error('[SETUP][' + label + '] ' + (error && error.stack ? error.stack : message));
      throw new Error('SETUP GAGAL · ' + label + ' · ' + message + ' Jalankan diagnoseSetupWebsiteGalilea() untuk melihat tahap yang belum siap.');
    }
  };

  stage('Menghubungkan spreadsheet', function () {
    PropertiesService.getScriptProperties().setProperty(GW.SPREADSHEET_PROPERTY, spreadsheet.getId());
  });
  stage('Menyiapkan sheet konten', function () {
    gwEnsureSheets_(spreadsheet);
    gwUpgradeFaqV14_(spreadsheet);
    SpreadsheetApp.flush();
  });
  stage('Menyiapkan portal admin', function () {
    if (typeof gaEnsureAdminInfrastructure_ !== 'function') {
      throw new Error('File Admin.gs belum terpasang atau belum tersimpan.');
    }
    gaEnsureAdminInfrastructure_(spreadsheet, true, true);
    SpreadsheetApp.flush();
  });
  stage('Menyiapkan penyimpanan layanan privat', function () {
    gwEnsureServiceStore_();
    if (typeof gaEnsureServiceColumns_ === 'function') gaEnsureServiceColumns_();
  });
  stage('Memasang pembaruan otomatis', function () { gwInstallTriggers_(spreadsheet); });
  stage('Menyegarkan cache', function () { gwRefreshWebsiteGalilea_(); });

  return report.join('\n') + '\nSELESAI · Website V' + GW.VERSION + ' dan Portal Sekretariat terhubung ke “' + spreadsheet.getName() + '”.';
}

/**
 * Diagnostik aman ketika Apps Script hanya menampilkan “unknown error”.
 * Fungsi ini tidak menghapus data dan dapat dijalankan berulang kali.
 */
function diagnoseSetupWebsiteGalilea() {
  const result = [];
  const check = function (label, callback) {
    try {
      const note = callback();
      result.push('OK · ' + label + (note ? ' · ' + note : ''));
    } catch (error) {
      result.push('GAGAL · ' + label + ' · ' + gwErrorMessage_(error));
    }
  };
  check('Akun editor', function () {
    const email = gwClean_(Session.getEffectiveUser().getEmail() || Session.getActiveUser().getEmail());
    if (!email) throw new Error('Email akun tidak terbaca.');
    return email;
  });
  check('Spreadsheet aktif', function () {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (!active) throw new Error('Project tidak terikat ke Google Spreadsheet.');
    return active.getName();
  });
  check('Script Properties', function () {
    PropertiesService.getScriptProperties().getProperties();
    return 'dapat diakses';
  });
  check('Sheet website', function () {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet() || gwSpreadsheet_();
    const missing = Object.keys(GW.SHEETS).map(function (key) { return GW.SHEETS[key]; })
      .filter(function (name) { return name !== GW.SHEETS.services && !spreadsheet.getSheetByName(name); });
    return missing.length ? 'belum ada: ' + missing.join(', ') : 'lengkap';
  });
  check('Portal admin', function () {
    if (typeof gaEnsureAdminInfrastructure_ !== 'function') throw new Error('Admin.gs belum tersimpan.');
    return 'fungsi admin terbaca';
  });
  check('Penyimpanan layanan', function () {
    const id = PropertiesService.getScriptProperties().getProperty(GW.SERVICE_SPREADSHEET_PROPERTY);
    if (!id) return 'belum dibuat; akan dibuat saat setup';
    return SpreadsheetApp.openById(id).getName();
  });
  check('Trigger otomatis', function () {
    const handlers = ScriptApp.getProjectTriggers().map(function (trigger) { return trigger.getHandlerFunction(); });
    return handlers.length ? handlers.join(', ') : 'belum dipasang';
  });
  check('Koneksi keluar', function () {
    const response = UrlFetchApp.fetch('https://www.youtube.com/feeds/videos.xml?channel_id=UC41TOa3S2aC8C-AxRBvH9Xw', { muteHttpExceptions: true });
    return 'YouTube HTTP ' + response.getResponseCode();
  });
  const output = 'DIAGNOSTIK GALILEA V' + GW.VERSION + '\n' + result.join('\n');
  console.log(output);
  return output;
}

/** Simpan API key YouTube Data API secara aman di Script Properties, bukan di spreadsheet publik. */
function setYouTubeApiKey(apiKey) {
  if (typeof gaRequireRole_ === 'function') gaRequireRole_('SUPERADMIN');
  const key = gwClean_(apiKey);
  const properties = PropertiesService.getScriptProperties();
  if (!key) {
    properties.deleteProperty(GW.YOUTUBE_KEY_PROPERTY);
    properties.deleteProperty(GW.YOUTUBE_CHANNEL_PROPERTY);
    gwRefreshWebsiteGalilea_();
    return 'API key YouTube dihapus. Sistem akan memakai fallback publik YouTube.';
  }
  if (key.length < 20 || key.length > 200) throw new Error('Format API key YouTube tidak dikenali.');
  properties.setProperty(GW.YOUTUBE_KEY_PROPERTY, key);
  properties.deleteProperty(GW.YOUTUBE_CHANNEL_PROPERTY);
  gwRefreshWebsiteGalilea_();
  return 'API key YouTube tersimpan. Nilainya tidak dikirim ke browser.';
}

/** Mengganti revisi cache agar perubahan spreadsheet dibaca tanpa menunggu cache lama habis. */
function refreshWebsiteGalilea() {
  if (typeof gaRequireRole_ === 'function') gaRequireRole_('EDITOR');
  return gwRefreshWebsiteGalilea_();
}

function gwRefreshWebsiteGalilea_() {
  PropertiesService.getScriptProperties().setProperty(
    GW.CACHE_REVISION_PROPERTY,
    String(new Date().getTime())
  );
  return 'Cache website sudah diperbarui.';
}

/** Trigger edit terpasang otomatis oleh setupWebsiteGalilea(). */
function websiteOnEdit(e) {
  if (!e || !e.range) return;
  const sheetName = e.range.getSheet().getName();
  const watched = Object.keys(GW.SHEETS).map(function (key) { return GW.SHEETS[key]; });
  if (watched.indexOf(sheetName) >= 0 || /^Triwulan\s+[IV]+\s+\d{4}$/i.test(sheetName)) {
    gwRefreshWebsiteGalilea_();
  }
}

/** Pemeliharaan harian: mengganti cache dan mencatat kesehatan sumber data. */
function websiteDailyMaintenance() {
  gwRefreshWebsiteGalilea_();
  try { gwRefreshDailyDevotional_(); } catch (ignore) {}
  return gwRunWebsiteHealthCheck_();
}

/**
 * Menghangatkan cache media di belakang layar. Kegagalan satu sumber tidak
 * membatalkan sumber lain dan tidak pernah menghambat halaman publik.
 */
function websiteHourlyMediaRefresh() {
  const report = [];
  const warm = function (label, callback) {
    try {
      const value = callback();
      report.push('OK · ' + label + (value ? ' · ' + value : ''));
    } catch (error) {
      report.push('LEWATI · ' + label + ' · ' + gwErrorMessage_(error));
    }
  };
  warm('AWR Borneo', function () {
    const media = getAwrBorneoMedia(true);
    return media.videoId ? (media.isLive ? 'live' : 'video terbaru') : 'playlist resmi';
  });
  warm('Diskusi Sekolah Sabat', function () {
    const media = getSabbathDiscussionVideos(true);
    return media.video && media.video.videoId ? 'video terbaru' : (media.playlistEmbedUrl ? 'playlist resmi' : 'belum tersedia');
  });
  warm('Renungan Pagi teks Advent', function () {
    const devotional = gwRefreshDailyDevotional_();
    return devotional && devotional.contentHtml ? 'bacaan teks hari ini' : 'menunggu materi harian';
  });
  console.log(report.join('\n'));
  return report.join('\n');
}

function gwRefreshDailyDevotional_() {
  const todayKey = Utilities.formatDate(new Date(), GW.TIMEZONE, 'yyyy-MM-dd');
  CacheService.getScriptCache().remove(gwCacheKey_('daily-reading-v16-' + todayKey.replace(/-/g, '')));
  return getDailyDevotional(todayKey);
}

/** Data awal website. Hanya data berstatus publik yang dikirim ke browser. */
function getWebsiteData() {
  const cache = CacheService.getScriptCache();
  const cacheKey = gwCacheKey_('bootstrap');
  const cached = cache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const spreadsheet = gwSpreadsheet_();
  gwEnsureSettingsSheet_(spreadsheet);
  gwEnsureV200ContentSchemas_(spreadsheet);
  const scheduleSheet = gwChooseScheduleSheet_(spreadsheet);
  if (!scheduleSheet) {
    throw new Error('Sheet jadwal aktif tidak ditemukan. Pastikan A1 berisi “' + GW.TITLE_MARKER + '”.');
  }

  const rowCount = Math.max(scheduleSheet.getLastRow(), 1);
  const columnCount = Math.max(1, Math.min(12, scheduleSheet.getLastColumn()));
  const range = scheduleSheet.getRange(1, 1, rowCount, columnCount);
  const rawRows = range.getValues();
  const displayRows = range.getDisplayValues();
  const now = new Date();
  const settings = gwReadSettings_(spreadsheet);

  const sections = GW.SCHEDULES.map(function (definition) {
    return {
      id: definition.id,
      title: definition.title,
      color: definition.color,
      records: gwDecorateSchedule_(gwParseScheduleSection_(rawRows, displayRows, definition), now)
    };
  });

  settings.schedule_spreadsheet_url = gwSafeUrl_(settings.schedule_spreadsheet_url) || spreadsheet.getUrl();
  const payload = {
    version: GW.VERSION,
    site: gwPublicSettings_(settings),
    scheduleSheet: scheduleSheet.getName(),
    periodLabel: gwPeriodLabel_(now),
    updatedAt: gwFormatDateTime_(now),
    nextSabbath: gwNextSabbath_(sections, now),
    nextWednesday: gwNextWednesday_(sections, now),
    sections: sections,
    banners: gwReadBanners_(spreadsheet, now),
    announcements: gwReadAnnouncements_(spreadsheet, now),
    themeSong: gwReadThemeSong_(spreadsheet),
    worshipPlans: gwReadWorshipPlans_(spreadsheet, now),
    activities: gwReadActivities_(spreadsheet, now),
    gallery: gwReadGallery_(spreadsheet),
    leaders: gwReadLeaders_(spreadsheet, settings),
    faq: gwReadFaq_(spreadsheet),
    system: gwReadPublicHealth_(spreadsheet),
    copyright: '© Sekretaris Jemaat Galilea ' + Utilities.formatDate(now, GW.TIMEZONE, 'yyyy')
  };

  gwCachePut_(cache, cacheKey, payload, GW.CACHE_SECONDS);
  return payload;
}

/** Mencari semua penugasan seseorang pada jadwal aktif. */
function findMemberSchedule(name) {
  const query = gwNormalizeSearch_(name);
  if (query.length < 2) throw new Error('Ketik sedikitnya dua huruf nama.');
  const data = getWebsiteData();
  const results = [];

  data.sections.forEach(function (section) {
    section.records.forEach(function (record) {
      const roles = record.fields.filter(function (field) {
        return gwNormalizeSearch_(field.value).indexOf(query) >= 0;
      });
      if (!roles.length) return;
      results.push({
        sectionId: section.id,
        sectionTitle: section.title,
        color: section.color,
        isoDate: record.isoDate,
        dateLabel: record.dateLabel,
        time: record.time,
        timestamp: record.timestamp,
        status: record.status,
        roles: roles
      });
    });
  });

  results.sort(function (a, b) { return new Date(a.timestamp) - new Date(b.timestamp); });
  return {
    query: gwClean_(name),
    count: results.length,
    results: results,
    updatedAt: data.updatedAt
  };
}

/** Pencarian lintas halaman. API besar hanya dipanggil setelah pengguna benar-benar mencari. */
function searchWebsite(searchText) {
  const query = gwNormalizeSearch_(searchText);
  if (query.length < 2) throw new Error('Ketik sedikitnya dua huruf untuk mencari.');
  const data = getWebsiteData();
  const found = [];
  const add = function (kind, title, excerpt, route, action, keywords) {
    const haystack = gwNormalizeSearch_([title, excerpt, keywords].join(' '));
    if (haystack.indexOf(query) < 0) return;
    found.push({ kind: kind, title: gwClean_(title), excerpt: gwTruncate_(excerpt, 150), route: route, action: action || '' });
  };

  [
    ['Halaman', 'Beranda', 'Ringkasan informasi Jemaat Galilea', 'home'],
    ['Halaman', 'Gereja', data.site.about_text, 'church'],
    ['Halaman', 'Pengurus Gereja', 'Daftar pelayan dan pengurus jemaat', 'leaders'],
    ['Halaman', 'Ibadah Hari Ini', 'Susunan acara, ayat utama, lagu, petugas, dan pengumuman ibadah', 'today'],
    ['Halaman', 'Jadwal Ibadah', 'Ringkasan dan rincian pelayanan', 'schedule'],
    ['Halaman', 'Sekolah Sabat', 'Pelajaran, Berita Misi, Bacaan Persembahan, dan Penginjilan Perorangan', 'sabbath'],
    ['Halaman', 'Alkitab', 'Baca Alkitab berdasarkan kitab dan pasal', 'bible'],
    ['Halaman', 'Lagu Sion', 'Buka Lagu Tema atau cari nomor dan judul Lagu Sion', 'hymnal'],
    ['Halaman', 'Layanan Jemaat', 'Permohonan doa, kunjungan, baptisan, dan kelas Alkitab', 'services'],
    ['Halaman', 'Pertanyaan Umum', 'Bantuan menggunakan website', 'faq'],
    ['Halaman', 'Kontak', data.site.address, 'contact']
  ].forEach(function (item) { add(item[0], item[1], item[2], item[3], '', item[1]); });

  data.sections.forEach(function (section) {
    section.records.forEach(function (record) {
      const fieldsText = record.fields.map(function (field) { return field.label + ' ' + field.value; }).join(' ');
      add('Jadwal', section.title + ' · ' + record.shortDate, fieldsText, 'schedule', section.id, fieldsText);
    });
  });
  data.leaders.forEach(function (leader) { add('Pengurus', leader.name, leader.role + '. ' + leader.description, 'leaders', '', leader.role); });
  data.announcements.forEach(function (item) { add('Agenda dan Pengumuman', item.title, item.summary, 'announcements', '', item.dateLabel); });
  data.activities.forEach(function (item) { add('Berita Jemaat', item.title, item.description, 'activities', '', item.location + ' ' + item.dateLabel); });
  if (data.themeSong) add('Lagu Tema', data.themeSong.title, 'Lagu tema jemaat aktif', 'hymnal', 'theme', 'Lagu Tema');
  data.faq.forEach(function (item) { add('FAQ', item.question, item.answer, 'faq', '', item.category); });

  try {
    const songs = getHymnalCatalog().songs;
    songs.forEach(function (song) {
      add('Lagu Sion', 'No. ' + song.number + ' · ' + song.title, 'Buka lirik Lagu Sion', 'hymnal', String(song.number), song.index);
    });
  } catch (ignore) {}

  try {
    const today = new Date();
    const year = Number(Utilities.formatDate(today, GW.TIMEZONE, 'yyyy'));
    const quarter = Math.floor((Number(Utilities.formatDate(today, GW.TIMEZONE, 'M')) - 1) / 3) + 1;
    getSabbathSchoolLibrary(year, quarter).lessons.forEach(function (lesson) {
      add('Sekolah Sabat', 'Pelajaran ' + lesson.number + ' · ' + lesson.title, lesson.dateLabel, 'sabbath', lesson.id, lesson.title);
    });
  } catch (ignore) {}

  return { query: gwClean_(searchText), count: found.length, results: found.slice(0, 48) };
}

/**
 * Terjemahan viewer. Antarmuka tetap berbahasa Indonesia saat pertama dibuka;
 * bahasa lain hanya diproses ketika jemaat memilihnya. Hasil disimpan di cache
 * agar perpindahan halaman berikutnya tetap ringan.
 */
function translateViewerTexts(texts, targetLanguage) {
  const languages = { id: true, en: true, ms: true, 'zh-CN': true, es: true };
  const target = String(targetLanguage || 'id');
  if (!languages[target]) throw new Error('Bahasa yang dipilih belum didukung.');
  const source = Array.isArray(texts) ? texts.slice(0, 120) : [];
  const cleaned = source.map(function (value) { return String(value == null ? '' : value).trim().slice(0, 1600); });
  if (target === 'id') return { language: target, translations: cleaned };

  const cache = CacheService.getScriptCache();
  const translations = new Array(cleaned.length);
  const pending = [];
  cleaned.forEach(function (text, index) {
    if (!text || /^\d[\d\s.:/+-]*$/.test(text)) {
      translations[index] = text;
      return;
    }
    const key = 'gxtr-' + target.replace(/[^a-z]/gi, '') + '-' + gwDigest_(text).slice(0, 34);
    const cached = cache.get(key);
    if (cached != null) translations[index] = cached;
    else pending.push({ index: index, text: text, key: key });
  });

  const delimiter = '\n[[[GALILEA_TRANSLATION_SPLIT]]]\n';
  let cursor = 0;
  while (cursor < pending.length) {
    const batch = [];
    let size = 0;
    while (cursor < pending.length && batch.length < 18) {
      const candidate = pending[cursor];
      if (batch.length && size + candidate.text.length > 4800) break;
      batch.push(candidate);
      size += candidate.text.length + delimiter.length;
      cursor++;
    }
    const translatedBlock = LanguageApp.translate(batch.map(function (item) { return item.text; }).join(delimiter), 'id', target);
    let parts = String(translatedBlock || '').split(/\s*\[\[\[GALILEA_TRANSLATION_SPLIT\]\]\]\s*/);
    /* Beberapa bahasa dapat mengubah spasi di sekitar penanda. Bila hasil
       gabungan tidak utuh, terjemahkan item pada batch ini satu per satu agar
       tidak ada label atau konten dinamis yang tertukar. */
    if (parts.length !== batch.length) {
      parts = batch.map(function (item) {
        try { return LanguageApp.translate(item.text, 'id', target); }
        catch (ignore) { return item.text; }
      });
    }
    batch.forEach(function (item, index) {
      const translated = gwClean_(parts[index]);
      translations[item.index] = translated || item.text;
      try { cache.put(item.key, translations[item.index], 21600); } catch (ignore) {}
    });
  }
  return { language: target, translations: translations };
}

/** Menyimpan permohonan pelayanan. Data tidak pernah ikut dikirim kembali ke website publik. */
function submitServiceRequest(form) {
  const value = form && typeof form === 'object' ? form : {};
  if (gwClean_(value.website)) throw new Error('Permintaan tidak dapat diproses.');

  const allowedTypes = ['Permohonan Doa', 'Kunjungan', 'Kelas Alkitab', 'Baptisan', 'Bergabung Melayani', 'Bantuan Website'];
  const type = gwClean_(value.type);
  const name = gwClean_(value.name).slice(0, 100);
  const phone = gwClean_(value.phone).replace(/[^0-9+()\-\s]/g, '').slice(0, 30);
  const message = gwClean_(value.message).slice(0, 1200);
  const contactMethod = gwClean_(value.contactMethod || 'WhatsApp').slice(0, 30);
  const consent = value.consent === true || String(value.consent) === 'true';
  const privacy = String(value.privacy || 'TIM_PELAYANAN').toUpperCase();

  if (allowedTypes.indexOf(type) < 0) throw new Error('Pilih jenis layanan yang tersedia.');
  if (name.length < 2) throw new Error('Nama belum diisi dengan benar.');
  if (phone.replace(/\D/g, '').length < 8) throw new Error('Nomor WhatsApp belum lengkap.');
  if (message.length < 5) throw new Error('Tuliskan permohonan Anda dengan singkat dan jelas.');
  if (!consent) throw new Error('Persetujuan penyimpanan data perlu dicentang.');
  if (['GEMBALA', 'TIM_PELAYANAN', 'ANONIM'].indexOf(privacy) < 0) throw new Error('Pilihan privasi belum valid.');

  const rateKey = 'gw10-submit-' + gwDigest_([phone, type, Utilities.formatDate(new Date(), GW.TIMEZONE, 'yyyyMMddHH')].join('|'));
  const cache = CacheService.getScriptCache();
  if (cache.get(rateKey)) throw new Error('Permohonan serupa baru saja dikirim. Silakan tunggu sebelum mencoba kembali.');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = gwServiceSheet_();
    const id = 'GL-' + Utilities.formatDate(new Date(), GW.TIMEZONE, 'yyyyMMdd-HHmmss') + '-' + String(Math.floor(Math.random() * 900) + 100);
    sheet.appendRow([id, new Date(), type, name, phone, message, contactMethod, 'SETUJU', 'BARU', '', '', privacy]);
    cache.put(rateKey, '1', 3600);
    return { ok: true, reference: id, message: 'Permohonan sudah diterima. Pengurus akan menindaklanjuti melalui kontak yang Anda berikan.' };
  } finally {
    lock.releaseLock();
  }
}

/** Pemeriksaan manual/harian. Hasil aman ditulis ke Website Pemeriksaan. */
function runWebsiteHealthCheck() {
  if (typeof gaRequireRole_ === 'function') gaRequireRole_('EDITOR');
  return gwRunWebsiteHealthCheck_();
}

function gwRunWebsiteHealthCheck_() {
  const spreadsheet = gwSpreadsheet_();
  const now = new Date();
  const period = gwCurrentPeriod_();
  const checks = [];
  const check = function (name, callback) {
    try {
      const note = callback();
      checks.push([now, name, 'OK', gwTruncate_(note || 'Terhubung', 180)]);
    } catch (error) {
      checks.push([now, name, 'GANGGUAN', gwTruncate_(gwErrorMessage_(error), 180)]);
    }
  };

  check('Spreadsheet Jadwal', function () {
    const sheet = gwChooseScheduleSheet_(spreadsheet);
    if (!sheet) throw new Error('Sheet jadwal aktif tidak ditemukan.');
    return sheet.getName();
  });
  check('Sekolah Sabat', function () {
    const data = getSabbathSchoolLibrary(period.year, period.quarter);
    if (!data.lessons.length) throw new Error('Pelajaran periode aktif belum tersedia.');
    return data.lessons.length + ' pelajaran tersedia';
  });
  check('Media Advent', function () {
    const posts = gwWordPressPosts_({ search: 'Berita Misi', per_page: 1, _fields: 'id,title' });
    if (!posts.length) throw new Error('Belum ada artikel yang terbaca.');
    return 'API artikel merespons';
  });
  check('AWR Borneo YouTube', function () {
    const media = getAwrBorneoMedia(true);
    if (!media.videoId && !media.playlistEmbedUrl) throw new Error('Video dan playlist resmi belum ditemukan.');
    return media.videoId ? (media.isLive ? 'Siaran langsung ditemukan' : 'Video terbaru tersedia') : 'Playlist unggahan resmi tersedia';
  });
  check('Renungan Pagi teks Advent', function () {
    const devotional = gwRefreshDailyDevotional_();
    if (!devotional.contentHtml) throw new Error('Teks Renungan Pagi hari ini belum ditemukan.');
    return 'Bacaan teks hari ini tersedia: ' + devotional.contentDateLabel;
  });
  check('Diskusi Sekolah Sabat YouTube', function () {
    const media = getSabbathDiscussionVideos(true);
    if ((!media.video || !media.video.videoId) && !media.playlistEmbedUrl) throw new Error('Pembahasan mingguan dan playlist belum ditemukan.');
    return media.video && media.video.videoId ? media.video.title : 'Playlist unggahan resmi tersedia';
  });
  check('Alkitab', function () {
    const data = getBibleChapter('JHN', 3);
    return data.verses.length + ' ayat terbaca';
  });
  check('Lagu Sion', function () {
    const data = getHymnalCatalog();
    return data.count + ' lagu terbaca';
  });

  const sheet = spreadsheet.getSheetByName(GW.SHEETS.health);
  if (sheet) {
    if (sheet.getLastRow() > 1) sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).clearContent();
    sheet.getRange(2, 1, checks.length, 4).setValues(checks);
    sheet.getRange(2, 1, checks.length, 1).setNumberFormat('dd mmmm yyyy HH:mm');
  }
  gwRefreshWebsiteGalilea_();

  return checks.map(function (row) { return { source: row[1], status: row[2], note: row[3] }; });
}

/* -------------------------------------------------------------------------- */
/* Pengaturan dan sheet pengelolaan                                            */
/* -------------------------------------------------------------------------- */

function gwSettingDefinitions_() {
  return [
    ['Identitas', 'church_name', 'GMAHK Galilea Balikpapan', 'Nama resmi gereja'],
    ['Identitas', 'short_name', 'Galilea Balikpapan', 'Nama singkat di header'],
    ['Identitas', 'tagline', 'Bertumbuh dalam Iman • Bersatu dalam Kasih • Melayani dengan Sukacita', 'Moto jemaat'],
    ['Identitas', 'logo_url', GW.SOURCES.adventLogo, 'URL logo resmi GMAHK Galilea'],
    ['Beranda', 'hero_title', 'Iman yang hidup. Kasih yang bergerak.', 'Judul utama beranda'],
    ['Beranda', 'hero_description', 'Jadwal ibadah, pelayanan, dan informasi Jemaat Galilea dalam satu tempat.', 'Kalimat singkat di beranda'],
    ['Beranda', 'hero_image_url', '', 'Opsional: URL foto gereja untuk hero'],
    ['Beranda', 'greeting_audience', 'Jemaat Galilea', 'Nama penerima sapaan'],
    ['Beranda', 'welcome_title', 'Selamat datang di Galilea.', 'Judul sambutan'],
    ['Beranda', 'welcome_text', 'Mari bertumbuh dalam firman, saling menguatkan, dan melayani bersama.', 'Sambutan singkat'],
    ['Beranda', 'bible_verse', 'Marilah kita saling memperhatikan supaya kita saling mendorong dalam kasih dan dalam pekerjaan baik.', 'Ayat beranda'],
    ['Beranda', 'bible_reference', 'Ibrani 10:24', 'Referensi ayat'],
    ['Gereja', 'about_title', 'GMAHK Galilea Balikpapan', 'Judul halaman gereja'],
    ['Gereja', 'about_text', 'Jemaat Galilea adalah keluarga rohani di Balikpapan yang beribadah, bertumbuh, dan melayani dalam pengharapan akan kedatangan Kristus.', 'Profil singkat gereja'],
    ['Gereja', 'church_history', 'Tuliskan sejarah berdirinya dan perjalanan pelayanan Jemaat Galilea di sini.', 'Sejarah gereja'],
    ['Gereja', 'church_established', '2003', 'Tahun berdiri'],
    ['Gereja', 'vision', 'Menjadi jemaat yang berakar dalam firman, bertumbuh dalam iman, dan berdampak melalui pelayanan.', 'Visi'],
    ['Gereja', 'mission', 'Membangun kehidupan rohani melalui ibadah dan pemuridan.\nMempererat persekutuan dan kepedulian.\nMelayani masyarakat dan membagikan pengharapan di dalam Kristus.', 'Pisahkan poin dengan baris baru'],
    ['Gereja', 'church_image_url', '', 'URL foto gedung atau jemaat'],
    ['Jadwal', 'schedule_spreadsheet_url', '', 'URL spreadsheet jadwal publik; kosong memakai spreadsheet ini'],
    ['Jadwal', 'sabbath_service', 'Setiap Sabat • 09.00 WITA', 'Jam ibadah Sabat'],
    ['Jadwal', 'wednesday_service', 'Setiap Rabu • 19.00 WITA', 'Jam ibadah Rabu malam'],
    ['Jadwal', 'youth_service', 'Sabat sore • mengikuti jadwal', 'Jam Pemuda Advent'],
    ['Pengurus', 'pastor_name', 'Pdt. Febri Sihotang', 'Nama gembala'],
    ['Pengurus', 'chairman_name', 'Hengky Rompas', 'Nama ketua jemaat'],
    ['Pengurus', 'secretary_name', 'Kevin Simatupang', 'Nama sekretaris jemaat'],
    ['Kontak', 'address', 'Jl. Mulawarman Gg. Sumber Rejeki RT.15 No.11, Balikpapan', 'Alamat lengkap'],
    ['Kontak', 'phone', '+62 851-1717-7709', 'Telepon/WhatsApp'],
    ['Kontak', 'whatsapp_url', 'https://wa.me/6285117177709', 'Link WhatsApp'],
    ['Kontak', 'email', 'galileabalikpapan@gmail.com', 'Email resmi'],
    ['Kontak', 'maps_url', '', 'Link Google Maps'],
    ['Kontak', 'maps_embed_url', '', 'URL embed Google Maps'],
    ['Media', 'instagram_url', 'https://www.instagram.com/advent.galilea/', 'Link Instagram'],
    ['Media', 'instagram_handle', '@advent.galilea', 'Nama akun Instagram, termasuk tanda @'],
    ['Media', 'youtube_url', '', 'Link YouTube jemaat'],
    ['Media', 'facebook_url', '', 'Link Facebook'],
    ['Media', 'awr_youtube_channel_url', 'https://www.youtube.com/@AWRBorneo', 'Channel YouTube resmi AWR Borneo; boleh dikoreksi bila handle kanal berbeda'],
    ['Media', 'awr_youtube_live_url', 'https://www.youtube.com/@AWRBorneo/live', 'Halaman siaran langsung YouTube AWR Borneo'],
    ['Media', 'awr_youtube_channel_id', 'UC41TOa3S2aC8C-AxRBvH9Xw', 'ID tetap channel YouTube AWR Borneo'],
    ['Media', 'awr_promo_video_id', '', 'Opsional: ID video YouTube cadangan, 11 karakter'],
    ['Media', 'sabbath_discussion_channel_url', 'https://www.youtube.com/channel/UCkNVHkC8G5HiOgFG7Iv9smg', 'Kanal Diskusi Sekolah Sabat dari Hope Channel Indonesia'],
    ['Media', 'sabbath_discussion_channel_id', 'UCkNVHkC8G5HiOgFG7Iv9smg', 'ID kanal untuk pembahasan Sekolah Sabat mingguan'],
    ['Media', 'theme_song_number', '', 'Nomor Lagu Sion tema, 1–525'],
    ['Media', 'theme_song_title', 'Lagu Tema Jemaat', 'Judul kartu lagu tema'],
    ['Navigasi', 'navigation_menu_label', 'MENU', 'Tulisan tombol menu utama, maksimal 12 karakter'],
    ['Tentang Website', 'website_about_title', 'Sebuah ruang digital yang terasa teduh, jelas, dan dekat.', 'Judul utama halaman Tentang Website'],
    ['Tentang Website', 'website_about_intro', 'Website ini dibuat agar hal-hal sederhana—melihat jadwal, menemukan bacaan, atau menghubungi jemaat—tidak terasa rumit. Ia bukan pengganti persekutuan, melainkan jembatan kecil yang membantu kita tetap terhubung.', 'Pembuka halaman dengan gaya bahasa yang hangat'],
    ['Tentang Website', 'website_palette_text', 'Hijau tua dipilih sebagai warna utama karena mengingatkan pada pertumbuhan, keteduhan, dan pengharapan yang terus hidup. Emas memberi rasa hangat sekaligus mengarah pada terang—sebuah pengingat sederhana kepada Yesus, Terang Dunia. Warna gading menjaga setiap halaman tetap jernih dan nyaman dibaca.', 'Filosofi palet warna website'],
    ['Tentang Website', 'website_logo_text', 'Nyala api Advent, Alkitab yang terbuka, dan salib bertemu dalam satu lambang. Bagi kami, bentuk ini bercerita tentang Kristus yang tetap menjadi pusat, firman yang hidup, dan kabar baik yang terus bergerak keluar.', 'Filosofi logo GMAHK Galilea'],
    ['Tentang Website', 'website_purpose_text', 'Tujuannya sederhana: membuat informasi ibadah dan pelayanan lebih mudah ditemukan, dibaca dari ponsel, serta ditampilkan dengan tenang saat kebaktian. Teknologi dipakai untuk membantu pelayanan, bukan mengambil alih persekutuan.', 'Tujuan website bagi jemaat dan pengunjung'],
    ['Tentang Website', 'website_developer', 'Kevin Oloan Simatupang', 'Nama pengembang website'],
    ['Mode Layar', 'presentation_reminder_arrival', 'Partisipan wajib hadir 15 menit sebelum kebaktian dimulai.', 'Teks pengingat pertama di akhir presentasi'],
    ['Mode Layar', 'presentation_reminder_devices', 'Mohon nonaktifkan perangkat elektronik saat ibadah berjalan.', 'Teks pengingat kedua di akhir presentasi'],
    ['Mode Layar', 'presentation_connection_title', 'Tetap terhubung bersama kami.', 'Judul slide kontak'],
    ['Mode Layar', 'presentation_instagram_handle', '@advent.galilea', 'Instagram yang tampil di presentasi'],
    ['Mode Layar', 'presentation_email', 'galileabalikpapan@gmail.com', 'Email yang tampil di presentasi'],
    ['Mode Layar', 'presentation_bank_name', 'Bank Mandiri', 'Nama bank rekening jemaat'],
    ['Mode Layar', 'presentation_bank_account', '1490022442422', 'Nomor rekening jemaat'],
    ['Mode Layar', 'presentation_bank_holder', 'Gereja Masehi Advent Hari Ketujuh', 'Nama pemilik rekening'],
    ['Mode Layar', 'presentation_website', 'gmahk-galilea.vercel.app', 'Alamat website yang tampil di presentasi'],
    ['Mode Layar', 'presentation_ornaments_enabled', 'YA', 'YA untuk menampilkan ornamen; TIDAK untuk menyembunyikan semuanya'],
    ['Mode Layar', 'presentation_ornament_strength', 'JELAS', 'Pilihan: LEMBUT, SEIMBANG, atau JELAS'],
    ['Mode Layar', 'presentation_schedule_background_url', '', 'Opsional: URL HTTPS foto latar Jadwal Terdekat; kosong memakai gambar bawaan'],
    ['Mode Layar', 'presentation_bible_background_url', '', 'Opsional: URL HTTPS foto latar Alkitab; kosong memakai gambar bawaan'],
    ['Mode Layar', 'presentation_hymnal_background_url', '', 'Opsional: URL HTTPS foto latar Lagu Sion; kosong memakai gambar bawaan'],
    ['Mode Layar', 'presentation_schedule_ornament', 'AUTO', 'AUTO menyesuaikan slide; pilihan manual: CHURCH, CALENDAR, BOOK, MUSIC, USERS, BELL, HEART'],
    ['Mode Layar', 'presentation_bible_ornament', 'BOOK', 'Ornamen Alkitab. Gunakan BOOK atau pilihan ikon Mode Layar lainnya'],
    ['Mode Layar', 'presentation_hymnal_ornament', 'MUSIC', 'Ornamen Lagu Sion. Gunakan MUSIC atau pilihan ikon Mode Layar lainnya'],
    ['Mode Layar', 'presentation_announcement_ornament', 'AUTO', 'AUTO memilih ornamen berbeda dari isi pengumuman'],
    ['Tema Advent', 'advent_theme_year', '', 'Kosong mengikuti tahun berjalan'],
    ['Tampilan', 'primary_color', '#476452', 'Warna utama HEX'],
    ['Tampilan', 'accent_color', '#B79A61', 'Warna aksen HEX'],
    ['Tampilan', 'default_theme', 'system', 'system, light, atau dark'],
    ['Tampilan', 'analytics_id', '', 'Opsional: Google Analytics Measurement ID, contoh G-XXXX'],
    ['SEO', 'google_site_url', '', 'Alamat Google Sites yang sudah dipublikasikan'],
    ['SEO', 'seo_description', 'Website resmi GMAHK Galilea Balikpapan: jadwal ibadah, pelayanan, Sekolah Sabat, pengurus, dan kontak gereja.', 'Deskripsi pencarian Google'],
    ['Footer', 'footer_text', 'Website resmi GMAHK Galilea Balikpapan', 'Teks footer']
  ];
}

function gwEnsureSheets_(spreadsheet) {
  gwEnsureSettingsSheet_(spreadsheet);
  gwEnsureTable_(spreadsheet, GW.SHEETS.announcements,
    ['Tanggal Publikasi', 'Judul', 'Ringkasan', 'Tautan', 'Status'],
    [[new Date(), 'Contoh Pengumuman', 'Ganti isi baris ini, lalu ubah status menjadi PUBLISH.', '', 'DRAFT']]);
  gwEnsureV200ContentSchemas_(spreadsheet);
  gwEnsureTable_(spreadsheet, GW.SHEETS.activities,
    ['Tanggal', 'Judul', 'Lokasi', 'Deskripsi', 'Tautan', 'Status', 'Foto URL'],
    [[new Date(), 'Contoh Kegiatan', 'Gereja', 'Ganti isi baris ini, tambahkan satu atau beberapa foto, lalu ubah status menjadi PUBLISH.', '', 'DRAFT', '']]);
  gwUpgradeActivityPhotos_(spreadsheet);
  gwEnsureTable_(spreadsheet, GW.SHEETS.gallery,
    ['Foto URL', 'Judul', 'Keterangan', 'Status'],
    [['', 'Contoh Foto', 'Masukkan URL foto lalu ubah status menjadi PUBLISH.', 'DRAFT']]);
  gwEnsureTable_(spreadsheet, GW.SHEETS.leaders,
    ['Urutan', 'Nama', 'Jabatan', 'Foto URL', 'Deskripsi', 'Status'],
    [
      [1, 'Pdt. Febri Sihotang', 'Gembala Jemaat', '', '', 'PUBLISH'],
      [2, 'Hengky Rompas', 'Ketua Jemaat', '', '', 'PUBLISH'],
      [3, 'Kevin Simatupang', 'Sekretaris Jemaat', '', '', 'PUBLISH']
    ]);
  gwEnsureTable_(spreadsheet, GW.SHEETS.banners,
    ['Mulai', 'Berakhir', 'Judul', 'Pesan', 'Tautan', 'Label Tombol', 'Varian', 'Status'],
    [[new Date(), new Date(), 'Informasi penting', 'Isi banner singkat.', '', 'Baca', 'INFO', 'DRAFT']]);
  gwEnsureTable_(spreadsheet, GW.SHEETS.faq,
    ['Kategori', 'Pertanyaan', 'Jawaban', 'Urutan', 'Status'], gwDefaultFaqRows_());
  gwEnsureTable_(spreadsheet, GW.SHEETS.health,
    ['Waktu', 'Sumber', 'Status', 'Catatan'], []);
  gwEnsureTable_(spreadsheet, GW.SHEETS.mission,
    ['Tahun', 'Triwulan', 'Tanggal', 'Judul', 'Ringkasan', 'Tautan', 'Gambar URL', 'Status'],
    [[new Date().getFullYear(), 1, new Date(), 'Contoh Berita Misi', 'Gunakan baris ini bila sumber otomatis belum tersedia.', '', '', 'DRAFT']]);
  gwEnsureTable_(spreadsheet, GW.SHEETS.offering,
    ['Tahun', 'Triwulan', 'Tanggal', 'Judul', 'Ringkasan', 'Tautan', 'Gambar URL', 'Status'],
    [[new Date().getFullYear(), 1, new Date(), 'Contoh Bacaan Persembahan', 'Gunakan baris ini bila sumber otomatis belum tersedia.', '', '', 'DRAFT']]);
  gwEnsureTable_(spreadsheet, GW.SHEETS.adventTheme,
    ['Tahun', 'Tema', 'Ayat', 'Lagu Tema', 'Foto URL', 'Sumber URL', 'Status'],
    [[2026, 'Mission Reach 2026', 'Yohanes 4:35–36', '', '', GW.SOURCES.adventTheme, 'DRAFT']]);
  gwEnsureTable_(spreadsheet, GW.SHEETS.themeSong,
    ['Judul Lagu Tema', 'Ayat 1', 'Ayat 2', 'Ayat Tambahan', 'Reff', 'Catatan', 'Status'],
    [['Lagu Tema Jemaat', '', '', '', '', 'Isi lirik melalui Portal Sekretariat.', 'DRAFT']]);
  gwEnsureTable_(spreadsheet, GW.SHEETS.worshipPlans,
    ['Tanggal', 'Jenis Ibadah', 'Waktu', 'Tema', 'Ayat Utama', 'Lagu Sion', 'Susunan Acara', 'Catatan Jemaat', 'Tautan Siaran', 'Status'],
    [[new Date(), 'IBADAH SABAT', '09:00', 'Tema ibadah', 'Ibrani 10:24–25', '', 'Sekolah Sabat\nKebaktian Khotbah', '', '', 'DRAFT']]);
}

/**
 * Menjaga migrasi Website Pengumuman tetap aman untuk sheet lama. Kolom baru
 * disisipkan sebelum Admin ID agar status dan ID yang sudah ada tidak
 * bergeser atau tertimpa ketika pengurus menyimpan perubahan.
 */
function gwEnsureV200ContentSchemas_(spreadsheet) {
  if (!spreadsheet.getSheetByName(GW.SHEETS.themeSong)) {
    gwEnsureTable_(spreadsheet, GW.SHEETS.themeSong,
      ['Judul Lagu Tema', 'Ayat 1', 'Ayat 2', 'Ayat Tambahan', 'Reff', 'Catatan', 'Status'],
      [['Lagu Tema Jemaat', '', '', '', '', 'Isi lirik melalui Portal Sekretariat.', 'DRAFT']]);
  }
  const sheet = spreadsheet.getSheetByName(GW.SHEETS.announcements);
  if (!sheet) return;
  const headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getDisplayValues()[0];
  const normalized = headers.map(gwNormalize_);
  if (normalized.indexOf('berakhir tampil') < 0) {
    let idIndex = normalized.indexOf('admin id');
    if (idIndex < 0) idIndex = normalized.indexOf('id');
    const beforeColumn = idIndex >= 0 ? idIndex + 1 : Math.max(6, sheet.getLastColumn() + 1);
    if (beforeColumn <= sheet.getMaxColumns()) sheet.insertColumnsBefore(beforeColumn, 3);
    else sheet.insertColumnsAfter(sheet.getMaxColumns(), beforeColumn + 2 - sheet.getMaxColumns());
    sheet.getRange(1, beforeColumn, 1, 3).setValues([['Berakhir Tampil', 'Prioritas', 'Masuk Warta']]);
    if (sheet.getLastRow() > 1) {
      const count = sheet.getLastRow() - 1;
      sheet.getRange(2, beforeColumn + 1, count, 1).setValues(Array.from({length: count}, function () { return ['NORMAL']; }));
      sheet.getRange(2, beforeColumn + 2, count, 1).setValues(Array.from({length: count}, function () { return ['YA']; }));
    }
  }
  const latestHeaders = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getDisplayValues()[0];
  const latestNormalized = latestHeaders.map(gwNormalize_);
  if (latestNormalized.indexOf('kategori tampilan') < 0) {
    let latestIdIndex = latestNormalized.indexOf('admin id');
    if (latestIdIndex < 0) latestIdIndex = latestNormalized.indexOf('id');
    const categoryColumn = latestIdIndex >= 0 ? latestIdIndex + 1 : sheet.getLastColumn() + 1;
    if (categoryColumn <= sheet.getMaxColumns()) sheet.insertColumnBefore(categoryColumn);
    else sheet.insertColumnAfter(sheet.getMaxColumns());
    sheet.getRange(1, categoryColumn).setValue('Kategori Tampilan');
    if (sheet.getLastRow() > 1) {
      const categoryCount = sheet.getLastRow() - 1;
      sheet.getRange(2, categoryColumn, categoryCount, 1).setValues(Array.from({length: categoryCount}, function () { return ['UMUM']; }));
    }
  }
}

function gwEnsureSettingsSheet_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(GW.SHEETS.settings);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(GW.SHEETS.settings);
    sheet.getRange(1, 1, 1, 4).setValues([['Bagian', 'Kunci', 'Isi Website', 'Petunjuk']]);
  }
  const rows = gwSettingDefinitions_();
  const keys = sheet.getLastRow() > 1
    ? sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getDisplayValues().map(function (row) { return row[0]; })
    : [];
  const missing = rows.filter(function (row) { return keys.indexOf(row[1]) < 0; });
  if (missing.length) sheet.getRange(sheet.getLastRow() + 1, 1, missing.length, 4).setValues(missing);
  gwFormatAdminSheet_(sheet, [145, 220, 540, 360]);
}

function gwEnsureTable_(spreadsheet, name, headers, sampleRows) {
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    if (sampleRows && sampleRows.length) sheet.getRange(2, 1, sampleRows.length, headers.length).setValues(sampleRows);
  }
  gwFormatAdminSheet_(sheet, headers.map(function (_, index) {
    if (index === 0) return 150;
    if (index === headers.length - 1) return 110;
    return 230;
  }));
}

/**
 * Upgrade aman untuk Website Kegiatan lama.
 * Kolom F tetap Status, kolom G menjadi kumpulan URL foto, dan Admin ID
 * dipindahkan ke H. Dengan demikian data lama tidak bergeser atau hilang.
 */
function gwUpgradeActivityPhotos_(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(GW.SHEETS.activities);
  if (!sheet) return;
  if (sheet.getMaxColumns() < 8) sheet.insertColumnsAfter(sheet.getMaxColumns(), 8 - sheet.getMaxColumns());
  const oldHeader = gwNormalize_(sheet.getRange(1, 7).getDisplayValue());
  const lastRow = sheet.getLastRow();
  if (oldHeader === 'admin id' && lastRow > 1) {
    const ids = sheet.getRange(2, 7, lastRow - 1, 1).getValues();
    sheet.getRange(2, 8, ids.length, 1).setValues(ids);
    sheet.getRange(2, 7, ids.length, 1).clearContent();
  }
  sheet.getRange(1, 7, 1, 2).setValues([['Foto URL', 'Admin ID']]);
  sheet.setColumnWidth(7, 420);
  sheet.setColumnWidth(8, 165);
}

function gwFormatAdminSheet_(sheet, widths) {
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), widths.length))
    .setBackground('#476452').setFontColor('#FFFFFF').setFontWeight('bold');
  widths.forEach(function (width, index) { sheet.setColumnWidth(index + 1, width); });
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, Math.max(sheet.getLastColumn(), widths.length))
      .setVerticalAlignment('top').setWrap(true);
  }
}

function gwInstallTriggers_(spreadsheet) {
  const triggers = ScriptApp.getProjectTriggers();
  const handlers = triggers.map(function (trigger) { return trigger.getHandlerFunction(); });
  if (handlers.indexOf('websiteOnEdit') < 0) {
    ScriptApp.newTrigger('websiteOnEdit').forSpreadsheet(spreadsheet).onEdit().create();
  }
  if (handlers.indexOf('websiteDailyMaintenance') < 0) {
    ScriptApp.newTrigger('websiteDailyMaintenance').timeBased().everyDays(1).atHour(3).create();
  }
  if (handlers.indexOf('websiteHourlyMediaRefresh') < 0) {
    ScriptApp.newTrigger('websiteHourlyMediaRefresh').timeBased().everyHours(1).create();
  }
}

function gwReadSettings_(spreadsheet) {
  const values = {};
  gwSettingDefinitions_().forEach(function (row) { values[row[1]] = row[2]; });
  const sheet = spreadsheet.getSheetByName(GW.SHEETS.settings);
  if (!sheet || sheet.getLastRow() < 2) return values;
  sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getDisplayValues().forEach(function (row) {
    const key = gwClean_(row[1]);
    if (key) values[key] = gwClean_(row[2]);
  });
  return values;
}

function gwPublicSettings_(settings) {
  const clone = {};
  Object.keys(settings).forEach(function (key) {
    if (/api[_-]?key|secret|notification_email/i.test(key)) return;
    clone[key] = settings[key];
  });
  return clone;
}

function gwDefaultFaqRows_() {
  return [
    ['Navigasi', 'Di mana ringkasan ibadah terdekat?', 'Buka menu Jadwal. Tab Ringkasan Terdekat selalu tampil paling awal dan tombol dari Beranda juga langsung menuju halaman tersebut.', 1, 'PUBLISH'],
    ['Navigasi', 'Bagaimana kembali ke Beranda?', 'Tekan nama atau lambang Advent di kiri atas, atau pilih Beranda pada menu utama.', 2, 'PUBLISH'],
    ['Jadwal & Pelayanan', 'Bagaimana menemukan jadwal pelayanan saya?', 'Pada halaman Jadwal pilih Jadwal Saya, ketik sedikitnya dua huruf nama, lalu tekan Cari. Semua tugas yang cocok akan tampil bersama tanggal dan perannya.', 3, 'PUBLISH'],
    ['Jadwal & Pelayanan', 'Bagaimana membagikan satu jadwal?', 'Pada kartu jadwal tekan WhatsApp untuk mengirim langsung, Bagikan Lainnya untuk memakai menu berbagi perangkat, atau Poster untuk menyimpan gambar.', 4, 'PUBLISH'],
    ['Jadwal & Pelayanan', 'Bisakah hasil Jadwal Saya diunduh?', 'Bisa. Setelah hasil pencarian tampil, tekan Unduh sebagai gambar. Gambar berisi seluruh hasil yang ditemukan beserta watermark Website Galilea.', 5, 'PUBLISH'],
    ['Jadwal & Pelayanan', 'Bisakah jadwal satu triwulan disimpan sebagai PDF?', 'Bisa. Pada halaman Jadwal tekan PDF Triwulan. Website akan menyusun seluruh jenis ibadah pada periode aktif menjadi satu PDF.', 6, 'PUBLISH'],
    ['Jadwal & Pelayanan', 'Apakah perubahan spreadsheet otomatis masuk ke website?', 'Ya. Data publik dibaca dari spreadsheet gereja. Setelah perubahan disimpan dan disetujui, muat ulang halaman bila pembaruan belum terlihat dalam beberapa menit.', 7, 'PUBLISH'],
    ['Sekolah Sabat', 'Bagaimana menemukan pelajaran minggu ini dan bacaan hari ini?', 'Buka Sekolah Sabat. Pelajaran aktif diberi tanda Minggu Ini. Saat dibuka, hari yang sesuai tanggal WITA ditandai Hari Ini.', 8, 'PUBLISH'],
    ['Sekolah Sabat', 'Di mana Berita Misi dan Bacaan Persembahan Sabat mendatang?', 'Gunakan tab Berita Misi atau Bacaan Persembahan. Website memilih bacaan Sabat yang paling dekat dan menandainya sebagai terbaru atau Sabat mendatang.', 9, 'PUBLISH'],
    ['Sekolah Sabat', 'Bisakah bacaan Sekolah Sabat disimpan?', 'Bisa. Tekan Unduh Pelajaran atau Unduh Bacaan pada materi yang sedang dibuka. Sumber materi tetap dicantumkan pada file.', 10, 'PUBLISH'],
    ['Renungan Pagi', 'Mengapa bacaan hari ini belum muncul?', 'Website mencocokkan tanggal WITA dengan bacaan harian Sekolah Sabat berbahasa Indonesia. Jika sumber resmi sedang tidak dapat dihubungi, tunggu sebentar lalu muat ulang halaman.', 11, 'PUBLISH'],
    ['Renungan & Video', 'Bagaimana membagikan Renungan Pagi?', 'Pada kartu Renungan Pagi tekan Bagikan Renungan. Pesan WhatsApp berisi judul, tanggal materi, tautan video, dan keterangan bahwa materi dibagikan melalui Website Galilea.', 12, 'PUBLISH'],
    ['Renungan & Video', 'Mengapa video tidak langsung berputar?', 'Untuk menghemat kuota dan mempercepat halaman, video baru dimuat setelah gambar video ditekan. Jika YouTube membatasi pemutaran, gunakan tombol Buka di YouTube.', 13, 'PUBLISH'],
    ['Alkitab & Lagu Sion', 'Bagaimana mencari ayat Alkitab?', 'Pilih Perjanjian Lama atau Baru, pilih kitab sesuai urutan, tentukan pasal dan ayat, lalu tekan Buka Ayat. Ayat tujuan akan ditandai.', 14, 'PUBLISH'],
    ['Alkitab & Lagu Sion', 'Bagaimana menampilkan ayat dan reff Lagu Sion?', 'Pilih Lagu Tema atau sebuah Lagu Sion, lalu tekan Mode Layar. Ayat tampil besar dan jelas, Reff ditandai khusus, dan tombol panah digunakan untuk berpindah ayat.', 15, 'PUBLISH'],
    ['Unduhan', 'Apa arti watermark pada hasil unduhan?', 'Watermark kecil menunjukkan file dibuat melalui Website Galilea dan membantu jemaat mengetahui sumber pembaruannya tanpa mengganggu isi utama.', 16, 'PUBLISH'],
    ['Tampilan & Bahasa', 'Bagaimana mengganti bahasa?', 'Pilih kode bahasa di kanan atas. Menu umum berubah seketika, sedangkan bagian bacaan yang panjang menyusul di latar belakang.', 17, 'PUBLISH'],
    ['Tampilan & Bahasa', 'Bagaimana mengganti mode terang, gelap, atau ukuran tulisan?', 'Tekan ikon tema untuk perpindahan cepat. Untuk pilihan lengkap, buka menu Aksesibilitas lalu pilih tema, ukuran tulisan, dan tingkat gerakan.', 18, 'PUBLISH'],
    ['Privasi & Layanan', 'Apakah permohonan doa terlihat oleh pengunjung lain?', 'Tidak. Pesan Layanan Jemaat tidak ditampilkan di website publik dan hanya ditindaklanjuti oleh pengurus yang berwenang.', 19, 'PUBLISH'],
    ['Privasi & Layanan', 'Bagaimana menghubungi gereja atau membuka lokasi?', 'Buka Kontak. Gunakan tombol WhatsApp untuk menghubungi gereja dan Google Maps untuk petunjuk arah.', 20, 'PUBLISH'],
    ['Gangguan', 'Apa yang dilakukan jika sebuah bagian belum tampil?', 'Periksa koneksi, tunggu beberapa detik, lalu muat ulang. Bila masih gagal, buka Layanan Jemaat dan pilih Bantuan Website untuk memberi tahu pengurus.', 21, 'PUBLISH'],
    ['Gangguan', 'Mengapa data lama masih terlihat setelah diperbarui?', 'Browser mungkin masih menyimpan salinan cepat. Muat ulang halaman, tutup lalu buka kembali website, atau tunggu cache otomatis berakhir beberapa menit.', 22, 'PUBLISH']
  ];
}

function gwUpgradeFaqV14_(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(GW.SHEETS.faq);
  if (!sheet) return;
  const existing = sheet.getLastRow() > 1
    ? sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getDisplayValues().map(function (row) { return gwNormalize_(row[0]); })
    : [];
  const seen = {}; existing.forEach(function (question) { if (question) seen[question] = true; });
  const additions = gwDefaultFaqRows_().filter(function (row) { return !seen[gwNormalize_(row[1])]; });
  if (additions.length) sheet.getRange(sheet.getLastRow() + 1, 1, additions.length, 5).setValues(additions);
}

/* -------------------------------------------------------------------------- */
/* Pembacaan konten spreadsheet                                                */
/* -------------------------------------------------------------------------- */

function gwReadLeaders_(spreadsheet, settings) {
  const sheet = spreadsheet.getSheetByName(GW.SHEETS.leaders);
  let leaders = [];
  if (sheet && sheet.getLastRow() > 1) {
    leaders = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getDisplayValues().map(function (row, index) {
      return {
        order: Number(row[0]) || index + 1,
        name: gwClean_(row[1]),
        role: gwClean_(row[2]),
        photoUrl: gwSafeUrl_(row[3]),
        description: gwClean_(row[4]),
        status: gwNormalize_(row[5])
      };
    }).filter(function (item) {
      return item.status === 'publish' && item.name && item.role;
    }).sort(function (a, b) { return a.order - b.order; });
  }
  if (leaders.length) return leaders.slice(0, 50);
  return [
    { order: 1, name: settings.pastor_name, role: 'Gembala Jemaat', photoUrl: '', description: '' },
    { order: 2, name: settings.chairman_name, role: 'Ketua Jemaat', photoUrl: '', description: '' },
    { order: 3, name: settings.secretary_name, role: 'Sekretaris Jemaat', photoUrl: '', description: '' }
  ].filter(function (item) { return gwClean_(item.name); });
}

function gwReadAnnouncements_(spreadsheet, now) {
  const sheet = spreadsheet.getSheetByName(GW.SHEETS.announcements);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const count = sheet.getLastRow() - 1;
  const width = Math.min(Math.max(sheet.getLastColumn(), 10), 10);
  const raw = sheet.getRange(2, 1, count, width).getValues();
  const display = sheet.getRange(2, 1, count, width).getDisplayValues();
  const today = new Date(Utilities.formatDate(now || new Date(), GW.TIMEZONE, 'yyyy-MM-dd') + 'T00:00:00' + GW.UTC_OFFSET).getTime();
  return raw.map(function (row, index) {
    const date = gwParseDate_(row[0], display[index][0]);
    const expires = gwParseDate_(row[5], display[index][5]);
    const priority = ['PENTING', 'IBADAH', 'NORMAL'].indexOf(String(display[index][6] || '').toUpperCase()) >= 0
      ? String(display[index][6]).toUpperCase() : 'NORMAL';
    const bulletinValue = gwNormalize_(display[index][7] || 'YA');
    const categoryValue = String(display[index][8] || 'UMUM').toUpperCase();
    const category = categoryValue === 'PA' ? 'PEMUDA ADVENT' : (['RABU MALAM', 'IBADAH KHOTBAH', 'SEKOLAH SABAT', 'PEMUDA ADVENT', 'UMUM'].indexOf(categoryValue) >= 0 ? categoryValue : 'UMUM');
    return {
      id: gwClean_(display[index][9]) || ('ANN-' + (index + 2)),
      dateValue: date ? date.getTime() : 0,
      dateLabel: date ? gwFormatShortDate_(date) : gwClean_(display[index][0]),
      title: gwClean_(display[index][1]),
      summary: gwClean_(display[index][2]),
      url: gwSafeUrl_(display[index][3]),
      status: gwNormalize_(display[index][4]),
      expiresAt: expires ? Utilities.formatDate(expires, GW.TIMEZONE, 'yyyy-MM-dd') : '',
      priority: priority,
      includeInBulletin: ['tidak', 'no', 'false', '0'].indexOf(bulletinValue) < 0,
      category: category
    };
  }).filter(function (item) {
    const end = item.expiresAt ? new Date(item.expiresAt + 'T23:59:59' + GW.UTC_OFFSET).getTime() : Infinity;
    return item.status === 'publish' && item.title && end >= today;
  }).sort(function (a, b) {
    const rank = { PENTING: 0, IBADAH: 1, NORMAL: 2 };
    return rank[a.priority] - rank[b.priority] || a.dateValue - b.dateValue;
  }).slice(0, 24);
}

function gwReadThemeSong_(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(GW.SHEETS.themeSong);
  if (!sheet || sheet.getLastRow() < 2) return null;
  const width = Math.min(Math.max(sheet.getLastColumn(), 8), 8);
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, width).getDisplayValues();
  for (let index = rows.length - 1; index >= 0; index--) {
    const row = rows[index];
    if (gwNormalize_(row[6]) !== 'publish' || !gwClean_(row[0])) continue;
    const lyrics = [];
    [1, 2, 3].forEach(function (column, verseIndex) {
      const lines = String(row[column] || '').split(/\n+/).map(gwClean_).filter(Boolean);
      if (lines.length) lyrics.push({ type: 'verse', index: verseIndex + 1, lines: lines });
    });
    const refrain = String(row[4] || '').split(/\n+/).map(gwClean_).filter(Boolean);
    if (refrain.length) lyrics.push({ type: 'chorus', index: 1, lines: refrain });
    if (!lyrics.length) continue;
    return {
      id: gwClean_(row[7]) || ('THEME-' + (index + 2)),
      number: 0,
      isTheme: true,
      title: gwClean_(row[0]),
      lyrics: lyrics,
      note: gwClean_(row[5]),
      source: 'Lagu Tema GMAHK Galilea Balikpapan'
    };
  }
  return null;
}

function gwReadWorshipPlans_(spreadsheet, now) {
  const sheet = spreadsheet.getSheetByName(GW.SHEETS.worshipPlans);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const count = sheet.getLastRow() - 1;
  const width = Math.min(Math.max(sheet.getLastColumn(), 10), 11);
  const raw = sheet.getRange(2, 1, count, width).getValues();
  const display = sheet.getRange(2, 1, count, width).getDisplayValues();
  const todayKey = Utilities.formatDate(now, GW.TIMEZONE, 'yyyy-MM-dd');
  return raw.map(function (row, index) {
    const date = gwParseDate_(row[0], display[index][0]);
    const isoDate = date ? Utilities.formatDate(date, GW.TIMEZONE, 'yyyy-MM-dd') : '';
    const agenda = String(display[index][6] || '').split(/\n+/).map(gwClean_).filter(Boolean).slice(0, 30);
    const songs = String(display[index][5] || '').split(/[,;\n]+/).map(gwClean_).filter(Boolean).slice(0, 20);
    return {
      id: gwClean_(display[index][10]) || ('WOR-' + (index + 2)),
      isoDate: isoDate,
      dateLabel: date ? gwFormatLongDate_(date) : gwClean_(display[index][0]),
      serviceType: gwClean_(display[index][1] || 'Ibadah'),
      time: gwClean_(display[index][2] || '09:00'),
      theme: gwClean_(display[index][3]),
      scripture: gwClean_(display[index][4]),
      songs: songs,
      agenda: agenda,
      note: gwClean_(display[index][7]),
      livestreamUrl: gwSafeUrl_(display[index][8]),
      status: gwNormalize_(display[index][9]),
      isToday: isoDate === todayKey
    };
  }).filter(function (item) {
    return item.status === 'publish' && item.isoDate && item.theme;
  }).sort(function (a, b) { return a.isoDate.localeCompare(b.isoDate) || a.time.localeCompare(b.time); }).slice(-40);
}

function gwReadActivities_(spreadsheet, now) {
  const sheet = spreadsheet.getSheetByName(GW.SHEETS.activities);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const count = sheet.getLastRow() - 1;
  const width = Math.max(8, Math.min(sheet.getLastColumn(), 8));
  const raw = sheet.getRange(2, 1, count, width).getValues();
  const display = sheet.getRange(2, 1, count, width).getDisplayValues();
  const today = new Date(Utilities.formatDate(now, GW.TIMEZONE, 'yyyy-MM-dd') + 'T00:00:00' + GW.UTC_OFFSET).getTime();
  return raw.map(function (row, index) {
    const date = gwParseDate_(row[0], display[index][0]);
    const photos = gwActivityPhotos_(display[index][6]);
    return {
      id: gwClean_(display[index][7]) || ('ACT-' + (index + 2)),
      dateValue: date ? date.getTime() : 0,
      dateLabel: date ? gwFormatLongDate_(date) : gwClean_(display[index][0]),
      title: gwClean_(display[index][1]),
      location: gwClean_(display[index][2]),
      description: gwClean_(display[index][3]),
      url: gwSafeUrl_(display[index][4]),
      status: gwNormalize_(display[index][5]),
      photos: photos,
      coverUrl: gwActivityCover_(display[index][6]),
      photoCount: photos.length
    };
  }).filter(function (item) {
    return item.status === 'publish' && item.title && item.dateValue < today;
  }).sort(function (a, b) {
    return b.dateValue - a.dateValue;
  }).slice(0, 24);
}

function gwActivityPhotos_(value) {
  const seen = {};
  return String(value == null ? '' : value)
    .split(/[\n,;]+/)
    .map(function (item) { return gwSafeUrl_(item.trim().replace(/^PRIMARY:/i, '')); })
    .filter(function (url) {
      if (!url || seen[url]) return false;
      seen[url] = true;
      return true;
    })
    .slice(0, 12);
}

function gwActivityCover_(value) {
  const urls = String(value == null ? '' : value).split(/[\n,;]+/);
  let primary = '';
  let first = '';
  for (let i = 0; i < urls.length; i++) {
    const raw = urls[i].trim();
    if (!raw) continue;
    if (raw.toUpperCase().indexOf('PRIMARY:') === 0) {
      primary = gwSafeUrl_(raw.substring(8));
    }
    const clean = gwSafeUrl_(raw.replace(/^PRIMARY:/i, ''));
    if (!first && clean) first = clean;
  }
  return primary || first || '';
}

function gwReadGallery_(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(GW.SHEETS.gallery);
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getDisplayValues().map(function (row) {
    return {
      imageUrl: gwSafeUrl_(row[0]),
      title: gwClean_(row[1]),
      caption: gwClean_(row[2]),
      status: gwNormalize_(row[3])
    };
  }).filter(function (item) {
    return item.status === 'publish' && item.imageUrl;
  }).slice(0, 20);
}

function gwReadBanners_(spreadsheet, now) {
  const sheet = spreadsheet.getSheetByName(GW.SHEETS.banners);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const count = sheet.getLastRow() - 1;
  const raw = sheet.getRange(2, 1, count, 8).getValues();
  const display = sheet.getRange(2, 1, count, 8).getDisplayValues();
  const nowTime = now.getTime();
  return raw.map(function (row, index) {
    const start = gwParseDate_(row[0], display[index][0]);
    const end = gwParseDate_(row[1], display[index][1]);
    if (end) end.setHours(23, 59, 59, 999);
    return {
      start: start ? start.getTime() : 0,
      end: end ? end.getTime() : 0,
      title: gwClean_(display[index][2]),
      message: gwClean_(display[index][3]),
      url: gwSafeUrl_(display[index][4]),
      buttonLabel: gwClean_(display[index][5] || 'Buka'),
      variant: ['INFO', 'PENTING', 'IBADAH'].indexOf(String(display[index][6]).toUpperCase()) >= 0
        ? String(display[index][6]).toUpperCase() : 'INFO',
      status: gwNormalize_(display[index][7])
    };
  }).filter(function (item) {
    const started = !item.start || item.start <= nowTime;
    const active = !item.end || item.end >= nowTime;
    return item.status === 'publish' && item.title && started && active;
  }).slice(0, 4);
}

function gwReadFaq_(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(GW.SHEETS.faq);
  if (!sheet || sheet.getLastRow() < 2) {
    return gwDefaultFaqRows_().map(function (row) {
      return { category: row[0], question: row[1], answer: row[2], order: row[3] };
    });
  }
  const items = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getDisplayValues().map(function (row, index) {
    return {
      category: gwClean_(row[0] || 'Umum'),
      question: gwClean_(row[1]),
      answer: gwClean_(row[2]),
      order: Number(row[3]) || index + 1,
      status: gwNormalize_(row[4])
    };
  }).filter(function (item) {
    return item.status === 'publish' && item.question && item.answer;
  }).sort(function (a, b) { return a.order - b.order; }).slice(0, 60);
  const containsLegacyDeveloperFaq = items.some(function (item) {
    return /spreadsheet diedit|dari mana materi sekolah sabat berasal|dari mana video awr/i.test(item.question);
  });
  if (containsLegacyDeveloperFaq) {
    return gwDefaultFaqRows_().map(function (row) {
      return { category: row[0], question: row[1], answer: row[2], order: row[3] };
    });
  }
  return items;
}

function gwReadPublicHealth_(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(GW.SHEETS.health);
  if (!sheet || sheet.getLastRow() < 2) {
    return { checkedAt: '', overall: 'BELUM DIPERIKSA', sources: [] };
  }
  const count = Math.min(sheet.getLastRow() - 1, 20);
  const raw = sheet.getRange(2, 1, count, 4).getValues();
  const display = sheet.getRange(2, 1, count, 4).getDisplayValues();
  const sources = display.map(function (row) {
    return { name: gwClean_(row[1]), status: gwClean_(row[2]), note: gwClean_(row[3]) };
  }).filter(function (item) { return item.name; });
  return {
    checkedAt: raw[0] && raw[0][0] instanceof Date ? gwFormatDateTime_(raw[0][0]) : gwClean_(display[0] && display[0][0]),
    overall: sources.some(function (item) { return item.status !== 'OK'; }) ? 'SEBAGIAN TERGANGGU' : 'NORMAL',
    sources: sources
  };
}

/* -------------------------------------------------------------------------- */
/* Parser jadwal                                                               */
/* -------------------------------------------------------------------------- */

function gwChooseScheduleSheet_(spreadsheet) {
  const period = gwCurrentPeriod_();
  const exact = spreadsheet.getSheetByName('Triwulan ' + gwRoman_(period.quarter) + ' ' + period.year);
  if (exact) return exact;
  const candidates = spreadsheet.getSheets().filter(function (sheet) {
    return gwNormalize_(sheet.getRange('A1').getDisplayValue()) === gwNormalize_(GW.TITLE_MARKER);
  });
  candidates.sort(function (a, b) { return gwScheduleRank_(b.getName()) - gwScheduleRank_(a.getName()); });
  return candidates[0] || null;
}

function gwScheduleRank_(name) {
  const match = String(name || '').match(/Triwulan\s+([IV]+)\s+(\d{4})/i);
  if (!match) return 0;
  return Number(match[2]) * 10 + gwFromRoman_(match[1]);
}

function gwParseScheduleSection_(rawRows, displayRows, definition) {
  const anchor = gwNormalize_(definition.anchor);
  let header = -1;
  for (let row = 0; row < displayRows.length; row++) {
    const hasAnchor = displayRows[row].some(function (cell) { return gwNormalize_(cell) === anchor; });
    if (!hasAnchor) continue;
    for (let next = row + 1; next < Math.min(row + 8, displayRows.length); next++) {
      if (gwNormalize_(displayRows[next][0]) === 'tanggal') {
        header = next;
        break;
      }
    }
    if (header >= 0) break;
  }
  if (header < 0) return [];

  const records = [];
  for (let row = header + 1; row < rawRows.length; row++) {
    const date = gwParseDate_(rawRows[row][0], displayRows[row][0]);
    if (!date) {
      if (records.length) break;
      continue;
    }
    const isoDate = Utilities.formatDate(date, GW.TIMEZONE, 'yyyy-MM-dd');
    const fields = definition.columns.map(function (column) {
      return { label: column[0], value: gwClean_(displayRows[row][column[1]]) };
    }).filter(function (field) { return field.value; });
    records.push({
      isoDate: isoDate,
      dateLabel: gwFormatLongDate_(date),
      shortDate: gwFormatShortDate_(date),
      time: definition.time,
      timestamp: isoDate + 'T' + definition.time + ':00' + GW.UTC_OFFSET,
      fields: fields
    });
  }
  return records;
}

function gwDecorateSchedule_(records, now) {
  let nextIndex = -1;
  records.some(function (record, index) {
    if (new Date(record.timestamp).getTime() >= now.getTime()) {
      nextIndex = index;
      return true;
    }
    return false;
  });
  return records.map(function (record, index) {
    const time = new Date(record.timestamp).getTime();
    return Object.assign({}, record, {
      status: time < now.getTime() ? 'past' : index === nextIndex ? 'next' : 'future',
      countdown: gwCountdown_(record.timestamp, now)
    });
  });
}

function gwNextSabbath_(sections, now) {
  const khotbah = gwSection_(sections, 'khotbah');
  const sabbathSchool = gwSection_(sections, 'sekolahSabat');
  const youth = gwSection_(sections, 'pemuda');
  const record = gwUpcoming_(khotbah.records, now);
  if (!record) return null;
  return {
    isoDate: record.isoDate,
    dateLabel: record.dateLabel,
    time: '09.00 WITA',
    timestamp: record.timestamp,
    countdown: gwCountdown_(record.timestamp, now),
    services: [
      gwScheduleSummary_(khotbah, record.isoDate),
      gwScheduleSummary_(sabbathSchool, record.isoDate),
      gwScheduleSummary_(youth, record.isoDate)
    ].filter(Boolean)
  };
}

function gwNextWednesday_(sections, now) {
  const section = gwSection_(sections, 'doa');
  const record = gwUpcoming_(section.records, now);
  if (!record) return null;
  return Object.assign({}, record, {
    timeLabel: '19.00 WITA',
    countdown: gwCountdown_(record.timestamp, now)
  });
}

function gwScheduleSummary_(section, isoDate) {
  const record = section.records.filter(function (item) { return item.isoDate === isoDate; })[0];
  if (!record) return null;
  return { id: section.id, title: section.title, color: section.color, fields: record.fields };
}

function gwSection_(sections, id) {
  return sections.filter(function (section) { return section.id === id; })[0] || { records: [] };
}

function gwUpcoming_(records, now) {
  return records.filter(function (record) { return new Date(record.timestamp).getTime() >= now.getTime(); })[0] || null;
}

/* -------------------------------------------------------------------------- */
/* Sekolah Sabat, Berita Misi, Persembahan, Renungan, Penginjilan              */
/* -------------------------------------------------------------------------- */

function getSabbathSchoolLibrary(year, quarter, forceRefresh) {
  const period = gwNormalizePeriod_(year, quarter);
  const cache = CacheService.getScriptCache();
  const cacheKey = gwCacheKey_('ss-' + period.id);
  const cached = forceRefresh ? '' : cache.get(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed && Array.isArray(parsed.lessons) && parsed.lessons.length) return parsed;
    } catch (ignore) {}
  }

  const result = {
    year: period.year,
    quarter: period.quarter,
    periodId: period.id,
    quarterly: {},
    lessons: [],
    status: 'ok',
    message: ''
  };

  try {
    const url = GW.SOURCES.sabbath + '/in/quarterlies/' + period.id + '/index.json';
    const payload = gwFetchJson_([url], 'Materi Sekolah Sabat Indonesia untuk periode ini belum tersedia.');
    const quarterly = payload.quarterly || payload;
    const lessons = Array.isArray(quarterly.lessons) ? quarterly.lessons : (Array.isArray(payload.lessons) ? payload.lessons : []);
    result.quarterly = {
      title: gwClean_(quarterly.title || quarterly.name || ('Triwulan ' + gwRoman_(period.quarter) + ' ' + period.year)),
      description: gwClean_(quarterly.description || quarterly.introduction || ''),
      humanDate: gwClean_(quarterly.human_date || quarterly.humanDate || ''),
      coverUrl: gwAssetUrl_(quarterly.cover || quarterly.cover_url || quarterly.coverUrl)
    };
    const nowKey = Number(Utilities.formatDate(new Date(), GW.TIMEZONE, 'yyyyMMdd'));
    result.lessons = lessons.map(function (lesson, index) {
      lesson = lesson && typeof lesson === 'object' ? lesson : {};
      const id = String(lesson.id || lesson.index || index + 1).replace(/\D/g, '').padStart(2, '0');
      const startDate = gwClean_(lesson.start_date || lesson.startDate || '');
      const endDate = gwClean_(lesson.end_date || lesson.endDate || '');
      const startKey = gwApiDateNumber_(startDate);
      const endKey = gwApiDateNumber_(endDate || startDate);
      return {
        id: id,
        number: Number(lesson.index || lesson.number || id) || index + 1,
        title: gwClean_(lesson.title || lesson.name || ('Pelajaran ' + (index + 1))),
        dateLabel: gwClean_(lesson.human_date || lesson.humanDate || lesson.date || gwApiDateRangeLabel_(startDate, endDate)),
        startDate: startDate,
        endDate: endDate,
        coverUrl: gwAssetUrl_(lesson.cover || lesson.cover_url || lesson.coverUrl),
        isCurrent: Boolean(startKey && startKey <= nowKey && endKey >= nowKey),
        isUpcoming: Boolean(startKey && startKey > nowKey),
        status: startKey && startKey <= nowKey && endKey >= nowKey ? 'current' : startKey > nowKey ? 'upcoming' : 'past'
      };
    });
  } catch (error) {
    result.status = 'unavailable';
    result.message = gwErrorMessage_(error);
  }

  gwCachePut_(cache, cacheKey, result, 1800);
  return result;
}

/** Materi mingguan dipanggil hanya ketika tab dibuka agar halaman awal Sekolah Sabat lebih cepat. */
function getSabbathResources(type, year, quarter) {
  const selectedType = String(type || '').toLowerCase();
  if (['mission', 'offering'].indexOf(selectedType) < 0) throw new Error('Jenis materi tidak dikenali.');
  const period = gwNormalizePeriod_(year, quarter);
  const cache = CacheService.getScriptCache();
  const cacheKey = gwCacheKey_('ss-resource-list-' + selectedType + '-' + period.id);
  const cached = cache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const spreadsheet = gwSpreadsheet_();
  const sheetName = selectedType === 'mission' ? GW.SHEETS.mission : GW.SHEETS.offering;
  const localItems = gwReadResourceSheet_(spreadsheet, sheetName, period.year, period.quarter);
  let onlineItems = [];
  try {
    onlineItems = gwFetchWordPressResources_(selectedType, period.year, period.quarter);
  } catch (ignore) {
    /* Sheet lokal tetap ditampilkan bila sumber penerbit sedang lambat/berubah. */
  }
  let items = gwMergeResources_(localItems, onlineItems);
  items = gwDecorateResources_(items, selectedType);
  const result = {
    type: selectedType,
    year: period.year,
    quarter: period.quarter,
    items: items,
    featured: items.filter(function (item) { return item.isThisSabbath; })[0] || items.filter(function (item) { return item.isLatest; })[0] || items[0] || null,
    updatedAt: gwFormatDateTime_(new Date()),
    cadence: 'Setiap Sabat'
  };
  gwCachePut_(cache, cacheKey, result, 1800);
  return result;
}

function getSabbathLessonDetail(year, quarter, lessonId, forceRefresh) {
  const period = gwNormalizePeriod_(year, quarter);
  const selectedLesson = String(lessonId || '').replace(/\D/g, '').padStart(2, '0');
  if (!selectedLesson || selectedLesson === '00') throw new Error('Pelajaran tidak dikenali.');
  const cache = CacheService.getScriptCache();
  const cacheKey = gwCacheKey_('ss-detail-v10-' + period.id + '-' + selectedLesson);
  const cached = forceRefresh ? '' : cache.get(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (gwValidSabbathDetail_(parsed)) return parsed;
    } catch (ignore) {}
  }

  const base = GW.SOURCES.sabbath + '/in/quarterlies/' + period.id + '/lessons/' + selectedLesson;
  const payload = gwFetchJson_([base + '/index.json'], 'Rincian pelajaran belum tersedia.');
  if (!payload || typeof payload !== 'object') throw new Error('Sumber pelajaran mengirim data kosong. Silakan coba kembali.');
  const lesson = payload.lesson && typeof payload.lesson === 'object' ? payload.lesson : payload;
  const rawDays = Array.isArray(payload.days) ? payload.days : (Array.isArray(lesson.days) ? lesson.days : []);
  const requests = rawDays.map(function (day, index) {
    day = day && typeof day === 'object' ? day : {};
    const dayId = String(day.id || day.index || index + 1).replace(/\D/g, '').padStart(2, '0');
    return { url: base + '/days/' + dayId + '/read/index.json', muteHttpExceptions: true, followRedirects: true, headers: { Accept: 'application/json' } };
  });
  const responses = requests.length ? UrlFetchApp.fetchAll(requests) : [];
  const days = rawDays.map(function (day, index) {
    day = day && typeof day === 'object' ? day : {};
    let reading = day;
    const response = responses[index];
    if (response && response.getResponseCode() >= 200 && response.getResponseCode() < 300) {
      const text = response.getContentText();
      if (/^\s*[\[{]/.test(text)) {
        try { reading = JSON.parse(text); } catch (ignore) {}
      }
    }
    reading = (reading && reading.read ? reading.read : reading) || {};
    const dateValue = reading.date || day.date || '';
    const todayKey = Number(Utilities.formatDate(new Date(), GW.TIMEZONE, 'yyyyMMdd'));
    const readingKey = gwApiDateNumber_(dateValue);
    return {
      id: String(day.id || day.index || index + 1).replace(/\D/g, '').padStart(2, '0'),
      date: gwClean_(dateValue),
      dateLabel: gwApiDateLabel_(dateValue),
      title: gwClean_(reading.title || day.title || ('Hari ' + (index + 1))),
      bibleHtml: gwSanitizeHtml_(gwRenderBibleFragments_(reading.bible || day.bible || '')),
      contentHtml: gwSanitizeHtml_(reading.content || day.content || ''),
      summary: gwTruncate_(gwStripHtml_(reading.content || day.content || ''), 260),
      isToday: Boolean(readingKey && readingKey === todayKey),
      isPast: Boolean(readingKey && readingKey < todayKey),
      isUpcoming: Boolean(readingKey && readingKey > todayKey)
    };
  });
  const lessonNumber = Number(String(lesson.id || lesson.number || selectedLesson).replace(/\D/g, '')) || Number(selectedLesson);
  const result = {
    year: period.year,
    quarter: period.quarter,
    lessonId: selectedLesson,
    number: lessonNumber,
    title: gwClean_(lesson.title || ('Pelajaran ' + Number(selectedLesson))),
    dateLabel: gwClean_(lesson.human_date || lesson.humanDate || lesson.date || gwApiDateRangeLabel_(lesson.start_date || lesson.startDate, lesson.end_date || lesson.endDate)),
    days: days,
    source: 'Adventech Sabbath School',
    sourceUrl: GW.SOURCES.sabbathWeb
  };
  if (!gwValidSabbathDetail_(result)) {
    throw new Error('Isi pelajaran ini belum selesai diterbitkan oleh sumber Sekolah Sabat. Silakan coba kembali beberapa saat lagi.');
  }
  gwCachePut_(cache, cacheKey, result, 21600);
  return result;
}

/** Menjaga kontrak data agar cache kosong/rusak tidak pernah diteruskan ke browser. */
function gwValidSabbathDetail_(value) {
  return Boolean(
    value &&
    Number(value.number) > 0 &&
    gwClean_(value.title) &&
    Array.isArray(value.days) &&
    value.days.length
  );
}

function getSabbathResourceDetail(type, sourceId) {
  const selectedType = String(type || '').toLowerCase();
  if (['mission', 'offering'].indexOf(selectedType) < 0) throw new Error('Jenis bacaan tidak dikenali.');
  const id = String(sourceId || '').replace(/\D/g, '');
  if (!id) throw new Error('Isi lengkap materi ini belum tersedia.');
  const cache = CacheService.getScriptCache();
  const cacheKey = gwCacheKey_('resource-' + selectedType + '-' + id);
  const cached = cache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const paths = GW.SOURCES.wordpress.map(function (base) {
    return base + '/posts/' + id + '?_fields=id,date,link,title,excerpt,content';
  });
  const post = gwFetchJson_(paths, 'Isi bacaan belum dapat dimuat.');
  const date = gwWordPressDate_(post.date);
  const rawHtml = String(post.content && post.content.rendered || '');
  const document = rawHtml.match(/href=(?:"|')([^"']+\.(?:pdf|docx?)(?:\?[^"']*)?)(?:"|')/i);
  const title = gwStripHtml_(post.title && post.title.rendered);
  const titleYear = Number((title.match(/\b(20\d{2})\b/) || [])[1] || 0);
  const currentYear = Number(Utilities.formatDate(new Date(), GW.TIMEZONE, 'yyyy'));
  const targetSabbath = selectedType === 'offering' && titleYear === currentYear ? gwNextSabbathDate_(new Date()) : null;
  const result = {
    id: id,
    type: selectedType,
    title: title,
    dateLabel: date ? gwFormatLongDate_(date) : '',
    targetDateLabel: targetSabbath ? gwFormatLongDate_(targetSabbath) : '',
    pageNumber: targetSabbath ? gwSabbathOrdinal_(targetSabbath) + 5 : 0,
    summary: gwStripHtml_(post.excerpt && post.excerpt.rendered),
    contentHtml: gwSanitizeHtml_(rawHtml),
    documentUrl: document ? gwSafeUrl_(gwDecodeHtml_(document[1])) : '',
    source: 'Ibadah Advent Indonesia',
    sourceUrl: gwSafeUrl_(post.link)
  };
  gwCachePut_(cache, cacheKey, result, 21600);
  return result;
}

function getDailyDevotional(dateValue) {
  const todayKey = Utilities.formatDate(new Date(), GW.TIMEZONE, 'yyyy-MM-dd');
  const requestedKey = /^\d{4}-\d{2}-\d{2}$/.test(String(dateValue || '')) ? String(dateValue) : todayKey;
  const requested = new Date(requestedKey + 'T12:00:00' + GW.UTC_OFFSET);
  const date = isNaN(requested.getTime()) ? new Date(todayKey + 'T12:00:00' + GW.UTC_OFFSET) : requested;
  const dateKey = Utilities.formatDate(date, GW.TIMEZONE, 'yyyy-MM-dd');
  const cache = CacheService.getScriptCache();
  const cacheKey = gwCacheKey_('daily-reading-v16-' + dateKey.replace(/-/g, ''));
  const cached = cache.get(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.requestedDate === dateKey) return parsed;
    } catch (ignore) { cache.remove(cacheKey); }
  }

  try {
    const year = Number(Utilities.formatDate(date, GW.TIMEZONE, 'yyyy'));
    const month = Number(Utilities.formatDate(date, GW.TIMEZONE, 'M'));
    const quarter = Math.floor((month - 1) / 3) + 1;
    const library = getSabbathSchoolLibrary(year, quarter, false);
    const lesson = (library.lessons || []).filter(function (item) {
      const start = gwApiDateNumber_(item.startDate);
      const end = gwApiDateNumber_(item.endDate || item.startDate);
      const target = Number(dateKey.replace(/-/g, ''));
      return start && start <= target && end >= target;
    })[0] || (library.lessons || []).filter(function (item) { return item.isCurrent; })[0];
    if (!lesson) throw new Error('Pelajaran aktif belum tersedia untuk tanggal ini.');

    const detail = getSabbathLessonDetail(year, quarter, lesson.id, false);
    const exactDay = (detail.days || []).filter(function (item) {
      return gwApiDateNumber_(item.date) === Number(dateKey.replace(/-/g, ''));
    })[0];
    const day = exactDay;
    if (!day || !day.contentHtml) throw new Error('Isi bacaan untuk tanggal WITA hari ini belum selesai diterbitkan.');

    const result = {
      id: 'adventech-' + year + '-' + String(quarter).padStart(2, '0') + '-' + lesson.id + '-' + day.id,
      format: 'text',
      requestedDate: dateKey,
      contentDate: dateKey,
      title: day.title || detail.title,
      todayLabel: gwFormatLongDate_(date),
      contentDateLabel: day.dateLabel || gwFormatLongDate_(date),
      scripture: gwTruncate_(gwStripHtml_(day.bibleHtml || ''), 170),
      summary: day.summary || gwTruncate_(gwStripHtml_(day.contentHtml), 360),
      contentHtml: (day.bibleHtml ? '<div class="devotional-scripture">' + day.bibleHtml + '</div>' : '') + day.contentHtml,
      videoId: '', thumbnailUrl: '', embedUrl: '', watchUrl: '',
      isArchive: false, isPending: false,
      source: 'Adventech Sabbath School · Bahasa Indonesia',
      sourceUrl: detail.sourceUrl || GW.SOURCES.sabbathWeb,
      lessonTitle: detail.title,
      lessonNumber: detail.number,
      attribution: 'Materi Advent harian · Dibagikan melalui Website Gereja Galilea'
    };
    /* Cache terikat tanggal WITA; hari baru selalu memakai kunci baru. */
    gwCachePut_(cache, cacheKey, result, 1800);
    return result;
  } catch (error) {
    const unavailable = {
      id: 'daily-pending-' + dateKey,
      format: 'pending', requestedDate: dateKey, contentDate: dateKey,
      title: 'Bacaan hari ini sedang disiapkan', todayLabel: gwFormatLongDate_(date),
      scripture: '',
      summary: 'Sumber teks Advent sedang diperiksa kembali. Website akan mencoba lagi secara otomatis tanpa menampilkan materi dari tanggal yang salah.',
      contentHtml: '', videoId: '', thumbnailUrl: '', embedUrl: '', watchUrl: '',
      isArchive: false, isPending: true,
      source: 'Adventech Sabbath School', sourceUrl: GW.SOURCES.sabbathWeb,
      attribution: 'Dibagikan melalui Website Gereja Galilea'
    };
    gwCachePut_(cache, cacheKey, unavailable, 120);
    return unavailable;
  }
}

/**
 * Memilih video Renungan Pagi dari kanal resmi Hope Channel Indonesia.
 * Urutan: unggahan tepat tanggal WITA -> unggahan resmi terbaru sebelum tanggal itu.
 */
function gwHopeDailyDevotional_(date) {
  const properties = PropertiesService.getScriptProperties();
  const apiKey = properties.getProperty(GW.YOUTUBE_KEY_PROPERTY) || '';
  const channelId = gwResolveYouTubeChannelId_(
    GW.SOURCES.devotionalYoutubeUrl,
    GW.SOURCES.devotionalYoutubeHandle,
    GW.SOURCES.devotionalYoutubeChannel,
    'GALILEA_HOPE_CHANNEL_ID',
    apiKey
  );
  let videos = [];
  if (channelId) {
    try { videos = gwYouTubeFeedEntries_(channelId, 30); } catch (ignore) {}
    if (apiKey) {
      try {
        const apiMedia = gwYouTubeApiMedia_(apiKey, channelId);
        videos = gwMergeYouTubeVideos_(videos.concat(apiMedia.recent || []));
      } catch (ignore) {}
    }
  }
  if (!videos.length) {
    try {
      /* Membaca halaman /videos kanal yang sama; tidak memakai hasil pencarian
         umum agar video kanal lain tidak pernah dianggap sebagai sumber resmi. */
      const html = gwFetchText_(GW.SOURCES.devotionalYoutubeUrl.replace(/\/$/, '') + '/videos', '');
      videos = gwYouTubeVideoList_(html, 24).map(function (id) {
        return { id: id, title: gwYouTubeTitle_(html, id), publishedAt: '', isLive: false };
      });
    } catch (ignore) {}
  }

  const dateKey = Utilities.formatDate(date, GW.TIMEZONE, 'yyyy-MM-dd');
  const targetText = gwNormalize_(gwDevotionalDateText_(date));
  const devotional = videos.filter(function (item) {
    const title = gwNormalize_(item && item.title);
    return /(?:renungan|devotional|firman|morning)/.test(title) && !/(?:shorts?|trailer|promo)/.test(title);
  }).map(function (item) {
    const published = gwYouTubeWitaDate_(item.publishedAt);
    const normalizedTitle = gwNormalize_(item.title);
    const titleDate = normalizedTitle.indexOf(targetText) >= 0 ? dateKey : gwDateFromIndonesianTitle_(item.title);
    return { item: item, dateKey: titleDate || published, exactTitle: normalizedTitle.indexOf(targetText) >= 0 };
  }).filter(function (item) { return !item.dateKey || item.dateKey <= dateKey; });

  const exact = devotional.filter(function (item) { return item.dateKey === dateKey; })[0];
  const selected = exact || devotional.sort(function (a, b) {
    return String(b.dateKey || '').localeCompare(String(a.dateKey || ''));
  })[0];
  return selected ? { video: selected.item, contentDate: selected.dateKey || '', exact: Boolean(exact) } : null;
}

function gwResolveYouTubeChannelId_(url, handle, configuredId, propertyName, apiKey) {
  const properties = PropertiesService.getScriptProperties();
  const candidates = [configuredId, properties.getProperty(propertyName), (String(url || '').match(/\/channel\/(UC[A-Za-z0-9_-]{20,})/) || [])[1]];
  for (let index = 0; index < candidates.length; index++) {
    if (/^UC[A-Za-z0-9_-]{20,}$/.test(gwClean_(candidates[index]))) return gwClean_(candidates[index]);
  }
  let channelId = '';
  if (apiKey && handle) {
    try {
      const payload = gwFetchJson_([
        'https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=' + encodeURIComponent(handle) + '&key=' + encodeURIComponent(apiKey)
      ], 'Kanal YouTube belum dapat dikenali.');
      channelId = payload.items && payload.items[0] && payload.items[0].id || '';
    } catch (ignore) {}
  }
  if (!channelId) {
    try {
      const html = gwFetchText_(url, '');
      channelId = (html.match(/"channelId":"(UC[A-Za-z0-9_-]{20,})"/) || html.match(/youtube\.com\/channel\/(UC[A-Za-z0-9_-]{20,})/i) || [])[1] || '';
    } catch (ignore) {}
  }
  if (/^UC[A-Za-z0-9_-]{20,}$/.test(channelId)) {
    try { properties.setProperty(propertyName, channelId); } catch (ignore) {}
    return channelId;
  }
  return '';
}

function gwYouTubeWitaDate_(publishedAt) {
  if (!publishedAt) return '';
  const date = new Date(publishedAt);
  return isNaN(date.getTime()) ? '' : Utilities.formatDate(date, GW.TIMEZONE, 'yyyy-MM-dd');
}

function gwDateFromIndonesianTitle_(title) {
  const months = { januari:1, februari:2, maret:3, april:4, mei:5, juni:6, juli:7, agustus:8, september:9, oktober:10, november:11, nopember:11, desember:12 };
  const match = gwNormalize_(title).match(/\b(\d{1,2})\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|nopember|desember)\s+(20\d{2})\b/);
  if (!match) return '';
  return [match[3], String(months[match[2]]).padStart(2, '0'), String(Number(match[1])).padStart(2, '0')].join('-');
}

function gwDevotionalDateText_(date) {
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const month = Number(Utilities.formatDate(date, GW.TIMEZONE, 'M')) - 1;
  return Number(Utilities.formatDate(date, GW.TIMEZONE, 'd')) + ' ' + months[month] + ' ' + Utilities.formatDate(date, GW.TIMEZONE, 'yyyy');
}

function gwCleanDevotionalVideoTitle_(value, date) {
  const escapedDate = gwDevotionalDateText_(date).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return gwClean_(String(value || '')
    .replace(/^\s*Renungan\s+Pagi\s*[|:\-–—]\s*/i, '')
    .replace(new RegExp('\\s*[|:\-–—]\\s*' + escapedDate + '\\s*$', 'i'), '')) || 'Renungan Pagi';
}

function gwDevotionalPlainText_(html, title) {
  let text = gwStripHtml_(html);
  text = text.replace(/^Renungan\s+Pagi,?\s*(?:Minggu|Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Sabat)?\s*,?\s*\d{1,2}\s+(?:Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Nopember|Desember)\s+20\d{2}\s*/i, '');
  const heading = gwClean_(title);
  if (heading && text.toLowerCase().indexOf(heading.toLowerCase()) === 0) text = gwClean_(text.slice(heading.length));
  return text;
}

/**
 * Penginjilan Perorangan memakai bacaan Adventech yang sesuai tanggal,
 * lalu menyusun langkah pelayanan praktis. Tidak mengaku sebagai materi resmi terpisah.
 */
function getPersonalEvangelism(year, quarter) {
  const period = gwNormalizePeriod_(year, quarter);
  const todayKey = Utilities.formatDate(new Date(), GW.TIMEZONE, 'yyyyMMdd');
  const cache = CacheService.getScriptCache();
  const cacheKey = gwCacheKey_('personal-' + period.id + '-' + todayKey);
  const cached = cache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const library = getSabbathSchoolLibrary(period.year, period.quarter);
  if (!library.lessons.length) throw new Error('Pelajaran periode ini belum tersedia.');
  const lesson = gwSelectDated_(library.lessons, new Date(), 'startDate', 'endDate');
  if (!lesson) throw new Error('Pelajaran untuk tanggal ini belum ditemukan.');
  const detail = getSabbathLessonDetail(period.year, period.quarter, lesson.id);
  if (!detail.days.length) throw new Error('Bacaan harian belum tersedia.');
  const day = gwSelectDated_(detail.days, new Date(), 'date', 'date');
  if (!day) throw new Error('Bacaan untuk hari ini belum ditemukan.');
  const references = gwExtractReferences_(day.bibleHtml + ' ' + day.contentHtml);
  const result = {
    year: period.year,
    quarter: period.quarter,
    date: day.date,
    dateLabel: day.dateLabel,
    lessonId: lesson.id,
    lessonNumber: lesson.number,
    lessonTitle: lesson.title,
    title: day.title || 'Penginjilan Perorangan',
    summary: day.summary,
    contentHtml: day.contentHtml,
    references: references,
    actions: gwPersonalActions_(Number(day.id), day.title),
    source: 'Diolah dari pelajaran harian Adventech',
    sourceUrl: GW.SOURCES.sabbathWeb
  };
  gwCachePut_(cache, cacheKey, result, 21600);
  return result;
}

function gwReadResourceSheet_(spreadsheet, sheetName, year, quarter) {
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const count = sheet.getLastRow() - 1;
  const raw = sheet.getRange(2, 1, count, 8).getValues();
  const display = sheet.getRange(2, 1, count, 8).getDisplayValues();
  return raw.map(function (row, index) {
    const date = gwParseDate_(row[2], display[index][2]);
    const targetDate = sheetName === GW.SHEETS.mission && date ? gwNextSabbathDate_(date) : date;
    return {
      sourceId: '', year: Number(display[index][0]), quarter: Number(display[index][1]),
      dateValue: targetDate ? targetDate.getTime() : 0,
      isoDate: targetDate ? Utilities.formatDate(targetDate, GW.TIMEZONE, 'yyyy-MM-dd') : '',
      dateLabel: targetDate ? gwFormatLongDate_(targetDate) : gwClean_(display[index][2]),
      title: gwClean_(display[index][3]), summary: gwClean_(display[index][4]),
      url: gwSafeUrl_(display[index][5]), imageUrl: gwSafeUrl_(display[index][6]),
      status: gwNormalize_(display[index][7]), source: 'Spreadsheet Jemaat Galilea'
    };
  }).filter(function (item) {
    return item.status === 'publish' && item.title && item.year === Number(year) && item.quarter === Number(quarter);
  }).sort(function (a, b) { return b.dateValue - a.dateValue; }).slice(0, 40);
}

function gwFetchWordPressResources_(type, year, quarter) {
  const isMission = type === 'mission';
  const startMonth = (Number(quarter) - 1) * 3;
  const start = new Date(Date.UTC(Number(year), startMonth, -6));
  const end = new Date(Date.UTC(Number(year), startMonth + 3, 8));
  const searchTerms = isMission ? ['Berita Misi Dewasa', 'Berita Mission Dewasa'] : ['Bacaan Persembahan', 'Persembahan dan Persepuluhan'];
  let posts = [];
  try {
    const categoryId = gwWordPressCategoryId_(isMission ? 'berita-mission-dewasa' : 'bacaan-persembahan', GW.WORDPRESS_CATEGORIES[type]);
    const parameters = {
      categories: categoryId, per_page: isMission ? 30 : 12, orderby: 'date', order: 'desc',
      _fields: 'id,date,link,title,excerpt'
    };
    if (isMission) {
      parameters.after = start.toISOString();
      parameters.before = end.toISOString();
    }
    posts = gwWordPressPosts_({
      categories: parameters.categories, per_page: parameters.per_page, orderby: parameters.orderby, order: parameters.order,
      after: parameters.after || '', before: parameters.before || '', _fields: parameters._fields
    });
  } catch (ignore) {}
  for (let index = 0; index < searchTerms.length && !posts.length; index++) {
    try {
      const parameters = { search: searchTerms[index], per_page: isMission ? 30 : 12, orderby: 'date', order: 'desc', _fields: 'id,date,link,title,excerpt' };
      if (isMission) { parameters.after = start.toISOString(); parameters.before = end.toISOString(); }
      posts = gwWordPressPosts_(parameters);
    } catch (ignore) {}
  }
  const mapped = posts.map(function (post) {
    const publishedDate = gwWordPressDate_(post.date);
    const title = gwStripHtml_(post.title && post.title.rendered);
    const summary = gwStripHtml_(post.excerpt && post.excerpt.rendered);
    const explicitDate = isMission ? gwExtractIndonesianDate_(title + ' ' + summary) : null;
    const currentYear = Number(Utilities.formatDate(new Date(), GW.TIMEZONE, 'yyyy'));
    const currentQuarter = Math.floor((Number(Utilities.formatDate(new Date(), GW.TIMEZONE, 'M')) - 1) / 3) + 1;
    const targetDate = isMission ? (explicitDate || (publishedDate ? gwNextSabbathDate_(publishedDate) : null)) :
      (Number(year) === currentYear && Number(quarter) === currentQuarter ? gwNextSabbathDate_(new Date()) : publishedDate);
    return {
      sourceId: String(post.id || ''), year: Number(year), quarter: Number(quarter),
      dateValue: targetDate ? targetDate.getTime() : 0,
      isoDate: targetDate ? Utilities.formatDate(targetDate, GW.TIMEZONE, 'yyyy-MM-dd') : '',
      dateLabel: targetDate ? gwFormatLongDate_(targetDate) : '',
      publishedLabel: publishedDate ? gwFormatShortDate_(publishedDate) : '',
      title: title,
      summary: summary,
      url: gwSafeUrl_(post.link), imageUrl: '', status: 'publish', source: 'Ibadah Advent Indonesia'
    };
  }).filter(function (item) {
    if (!item.title) return false;
    if (isMission && !/berita\s+miss?i(?:on)?|misi\s+(?:advent\s+)?dewasa/i.test(item.title + ' ' + item.summary)) return false;
    if (!isMission && (!/bacaan\s+persembahan(?:\s+dan\s+persepuluhan)?/i.test(item.title) || item.title.indexOf(String(year)) < 0)) return false;
    return true;
  });
  if (!isMission) return mapped.slice(0, 12);
  const seenSabbath = {};
  return mapped.filter(function (item) {
    if (!item.isoDate || seenSabbath[item.isoDate]) return false;
    seenSabbath[item.isoDate] = true;
    return true;
  }).slice(0, 20);
}

function gwMergeResources_(first, second) {
  const seen = {};
  return (first || []).concat(second || []).filter(function (item) {
    const key = gwNormalize_(item.url || item.title);
    if (!key || seen[key]) return false;
    seen[key] = true;
    return true;
  }).sort(function (a, b) { return Number(b.dateValue || 0) - Number(a.dateValue || 0); }).slice(0, 40);
}

function gwDecorateResources_(items, type) {
  const sabbath = gwNextSabbathDate_(new Date());
  const sabbathIso = Utilities.formatDate(sabbath, GW.TIMEZONE, 'yyyy-MM-dd');
  const sorted = (items || []).slice().sort(function (a, b) { return Number(b.dateValue || 0) - Number(a.dateValue || 0); });
  let latestAssigned = false;
  return sorted.map(function (item) {
    const isThisSabbath = (type === 'mission' || type === 'offering') && item.isoDate === sabbathIso;
    const isLatest = !latestAssigned;
    if (isLatest) latestAssigned = true;
    return Object.assign({}, item, {
      isThisSabbath: isThisSabbath,
      isLatest: isLatest,
      badge: isThisSabbath ? (type === 'offering' ? 'SABAT MENDATANG' : 'SABAT INI') : isLatest ? 'TERBARU' : ''
    });
  });
}

/* -------------------------------------------------------------------------- */
/* AWR Borneo melalui YouTube                                                  */
/* -------------------------------------------------------------------------- */

function getAwrBorneoMedia(forceRefresh) {
  const cache = CacheService.getScriptCache();
  const cacheKey = gwCacheKey_('awr-borneo-youtube-v13-unique');
  if (!forceRefresh) {
    const cached = cache.get(cacheKey);
    if (cached) {
      try { return JSON.parse(cached); }
      catch (ignore) { cache.remove(cacheKey); }
    }
  }

  const settings = gwReadSettings_(gwSpreadsheet_());
  const properties = PropertiesService.getScriptProperties();
  const apiKey = properties.getProperty(GW.YOUTUBE_KEY_PROPERTY) || '';
  let channelId = gwClean_(settings.awr_youtube_channel_id) || properties.getProperty(GW.YOUTUBE_CHANNEL_PROPERTY) || 'UC41TOa3S2aC8C-AxRBvH9Xw';
  let channelUrl = gwSafeUrl_(settings.awr_youtube_channel_url) || 'https://www.youtube.com/@AWRBorneo';
  let video = null;
  let recentVideos = [];

  if (apiKey) {
    try {
      if (!channelId) {
        const handle = gwYouTubeHandle_(channelUrl);
        if (handle) {
          try {
            const channelPayload = gwFetchJson_([
              'https://www.googleapis.com/youtube/v3/channels?part=id,snippet&forHandle=' + encodeURIComponent(handle) + '&key=' + encodeURIComponent(apiKey)
            ], 'Channel YouTube belum dapat dikenali.');
            channelId = channelPayload.items && channelPayload.items[0] && channelPayload.items[0].id || '';
          } catch (ignore) {}
        }
        if (!channelId) {
          const found = gwYouTubeFindChannel_(apiKey, 'AWR Borneo');
          channelId = found.id;
          channelUrl = found.url || channelUrl;
          if (channelId) properties.setProperty(GW.YOUTUBE_CHANNEL_PROPERTY, channelId);
        }
      }
      if (channelId) {
        const media = gwYouTubeApiMedia_(apiKey, channelId);
        video = media.featured;
        recentVideos = media.recent;
      }
    } catch (ignore) {}
  }

  /* Feed resmi hanya diminta bila API belum memberi tiga video yang cukup.
     Ini mengurangi satu permintaan jaringan pada jalur normal. */
  if (!video || recentVideos.length < 3) try {
    let feed;
    try {
      feed = gwYouTubeFeedMedia_(channelId || 'UC41TOa3S2aC8C-AxRBvH9Xw');
    } catch (configuredChannelError) {
      channelId = 'UC41TOa3S2aC8C-AxRBvH9Xw';
      channelUrl = 'https://www.youtube.com/@AWRBorneo';
      feed = gwYouTubeFeedMedia_(channelId);
    }
    if (!video || !video.isLive) video = feed.featured;
    recentVideos = gwMergeYouTubeVideos_((recentVideos || []).concat(feed.recent || []));
  } catch (ignore) {}

  /* Fallback tanpa API key: baca halaman resmi kanal. Ini juga menutup kasus
     feed RSS YouTube sesekali menjawab kosong dari pusat data Google tertentu. */
  if (!video || recentVideos.length < 3) {
    try {
      const liveUrl = gwSafeUrl_(settings.awr_youtube_live_url) || channelUrl.replace(/\/$/, '') + '/live';
      const publicMedia = gwYouTubePublicMedia_([liveUrl, 'https://www.youtube.com/@AWRBorneo/live'], channelUrl);
      if (publicMedia.featured && (!video || publicMedia.featured.isLive)) video = publicMedia.featured;
      recentVideos = gwMergeYouTubeVideos_((recentVideos || []).concat(publicMedia.recent || []));
    } catch (ignore) {}
  }

  if (!video && /^[A-Za-z0-9_-]{11}$/.test(gwClean_(settings.awr_promo_video_id))) {
    video = { id: gwClean_(settings.awr_promo_video_id), title: 'Program AWR Borneo', isLive: false };
  }

  const orderedVideos = gwMergeYouTubeVideos_((video ? [video] : []).concat(recentVideos || []));
  if (!video || !video.isLive) video = orderedVideos[0] || video;
  recentVideos = orderedVideos.filter(function (item) { return !video || item.id !== video.id; });
  const result = {
    isLive: Boolean(video && video.isLive),
    mode: video && video.isLive ? 'live' : 'latest',
    videoId: video ? video.id : '',
    title: video && video.title ? video.title : 'AWR Borneo',
    embedUrl: video ? 'https://www.youtube-nocookie.com/embed/' + video.id + '?rel=0&modestbranding=1&playsinline=1' : '',
    watchUrl: video ? 'https://www.youtube.com/watch?v=' + video.id : channelUrl,
    recentVideos: recentVideos.filter(function (item) { return item.id && (!video || item.id !== video.id); }).slice(0, 2).map(function (item) {
      return {
        videoId: item.id,
        title: item.title || 'Program AWR Borneo',
        publishedLabel: item.publishedAt ? gwFormatLongDate_(new Date(item.publishedAt)) : '',
        embedUrl: 'https://www.youtube-nocookie.com/embed/' + item.id + '?rel=0&modestbranding=1&playsinline=1',
        watchUrl: 'https://www.youtube.com/watch?v=' + item.id
      };
    }),
    playlistEmbedUrl: channelId && /^UC[A-Za-z0-9_-]{20,}$/.test(channelId)
      ? 'https://www.youtube-nocookie.com/embed/videoseries?list=UU' + channelId.slice(2) + '&rel=0'
      : '',
    channelUrl: channelUrl,
    source: 'YouTube · AWR Borneo',
    configuredWithApi: Boolean(apiKey && channelId)
  };
  gwCachePut_(cache, cacheKey, result, result.isLive ? 300 : 1800);
  return result;
}

/** Video pembahasan Sekolah Sabat terbaru dari kanal Diskusi Sekolah Sabat. */
function getSabbathDiscussionVideos(forceRefresh) {
  const cache = CacheService.getScriptCache();
  const cacheKey = gwCacheKey_('sabbath-discussion-youtube-v13-single');
  if (!forceRefresh) {
    const cached = cache.get(cacheKey);
    if (cached) {
      try { return JSON.parse(cached); }
      catch (ignore) { cache.remove(cacheKey); }
    }
  }

  const settings = gwReadSettings_(gwSpreadsheet_());
  const apiKey = PropertiesService.getScriptProperties().getProperty(GW.YOUTUBE_KEY_PROPERTY) || '';
  const fallbackId = 'UCkNVHkC8G5HiOgFG7Iv9smg';
  const channelId = gwClean_(settings.sabbath_discussion_channel_id) || fallbackId;
  const channelUrl = gwSafeUrl_(settings.sabbath_discussion_channel_url) || 'https://www.youtube.com/@DiskusiSekolahSabat';
  let videos = [];
  if (apiKey) {
    try {
      const apiMedia = gwYouTubeApiMedia_(apiKey, channelId || fallbackId);
      videos = gwMergeYouTubeVideos_((apiMedia.recent || []).concat(apiMedia.featured || []));
    } catch (ignore) {}
  }
  if (!videos.length) {
    try {
      videos = gwMergeYouTubeVideos_(videos.concat(gwYouTubeFeedEntries_(channelId || fallbackId, 8)));
    } catch (firstError) {
      if (channelId !== fallbackId) {
        try { videos = gwMergeYouTubeVideos_(videos.concat(gwYouTubeFeedEntries_(fallbackId, 8))); }
        catch (ignore) {}
      }
    }
  }
  if (!videos.length) {
    try {
      const publicMedia = gwYouTubePublicMedia_([], channelUrl, 'Diskusi Sekolah Sabat Hope Channel Indonesia');
      videos = gwMergeYouTubeVideos_((publicMedia.recent || []).concat(publicMedia.featured || []));
    } catch (ignore) {}
  }

  const discussions = videos.filter(function (item) {
    const title = gwClean_(item.title);
    return title &&
      title.charAt(0) !== '#' &&
      /sekolah\s+sabat/i.test(title) &&
      /(?:pelajaran|sabbath\s+school|diskusi)/i.test(title) &&
      !/(?:q\s*&\s*a|pertanyaan|shorts?)/i.test(title);
  });
  const selected = discussions[0] || videos.filter(function (item) {
    return item.title && item.title.charAt(0) !== '#' && /sekolah\s+sabat/i.test(item.title);
  })[0] || null;

  const result = {
    channelName: 'Diskusi Sekolah Sabat · Hope Channel Indonesia',
    channelUrl: channelUrl,
    updatedAt: gwFormatDateTime_(new Date()),
    video: selected ? gwPublicYouTubeVideo_(selected) : null,
    playlistEmbedUrl: 'https://www.youtube-nocookie.com/embed/videoseries?list=UU' + (channelId || fallbackId).slice(2) + '&rel=0'
  };
  gwCachePut_(cache, cacheKey, result, 1800);
  return result;
}

function gwYouTubeFeedMedia_(channelId) {
  const videos = gwYouTubeFeedEntries_(channelId, 8);
  return { featured: videos[0] || null, recent: videos };
}

function gwYouTubeFeedEntries_(channelId, limit) {
  const id = gwClean_(channelId);
  if (!/^UC[A-Za-z0-9_-]{20,}$/.test(id)) throw new Error('ID kanal YouTube tidak dikenali.');
  const response = UrlFetchApp.fetch('https://www.youtube.com/feeds/videos.xml?channel_id=' + encodeURIComponent(id), {
    muteHttpExceptions: true,
    followRedirects: true,
    headers: { Accept: 'application/atom+xml,application/xml,text/xml', 'User-Agent': 'GalileaPortal/' + GW.VERSION }
  });
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
    throw new Error('Feed YouTube belum dapat dihubungi.');
  }
  const document = XmlService.parse(response.getContentText('UTF-8'));
  const root = document.getRootElement();
  const atom = XmlService.getNamespace('http://www.w3.org/2005/Atom');
  const yt = XmlService.getNamespace('yt', 'http://www.youtube.com/xml/schemas/2015');
  const entries = root.getChildren('entry', atom).slice(0, Math.max(1, Number(limit) || 8));
  const videos = entries.map(function (entry) {
    const videoNode = entry.getChild('videoId', yt);
    const titleNode = entry.getChild('title', atom);
    const publishedNode = entry.getChild('published', atom);
    const videoId = videoNode ? gwClean_(videoNode.getText()) : '';
    const title = titleNode ? gwClean_(titleNode.getText()) : 'Video YouTube';
    return {
      id: videoId,
      title: title,
      publishedAt: publishedNode ? gwClean_(publishedNode.getText()) : '',
      /* Feed tidak menyediakan status isLiveNow. Jangan memberi label LIVE palsu;
         status langsung hanya berasal dari YouTube Data API/halaman /live. */
      isLive: false
    };
  }).filter(function (item) { return /^[A-Za-z0-9_-]{11}$/.test(item.id); });
  return videos;
}

function gwPublicYouTubeVideo_(item) {
  const videoId = gwClean_(item && item.id);
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) return null;
  return {
    videoId: videoId,
    title: gwClean_(item.title || 'Video YouTube'),
    publishedAt: gwClean_(item.publishedAt),
    publishedLabel: item.publishedAt ? gwFormatDateTime_(new Date(item.publishedAt)) : '',
    thumbnailUrl: 'https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg',
    embedUrl: 'https://www.youtube-nocookie.com/embed/' + videoId + '?autoplay=1&rel=0&modestbranding=1&playsinline=1',
    watchUrl: 'https://www.youtube.com/watch?v=' + videoId
  };
}

function gwMergeYouTubeVideos_(items) {
  const seen = {};
  const seenTitles = {};
  return (items || []).filter(function (item) {
    const titleKey = gwNormalize_(item && item.title);
    if (!item || !/^[A-Za-z0-9_-]{11}$/.test(gwClean_(item.id)) || seen[item.id] || (titleKey && seenTitles[titleKey])) return false;
    seen[item.id] = true;
    if (titleKey) seenTitles[titleKey] = true;
    return true;
  });
}

function gwYouTubeFindChannel_(apiKey, query) {
  const payload = gwFetchJson_([
    'https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=5&q=' + encodeURIComponent(query) + '&key=' + encodeURIComponent(apiKey)
  ], 'Channel AWR Borneo belum ditemukan.');
  const items = payload.items || [];
  const selected = items.filter(function (item) {
    const title = gwNormalize_(item.snippet && item.snippet.title);
    return title.indexOf('awr borneo') >= 0;
  })[0] || items[0];
  const id = selected && selected.id && selected.id.channelId || '';
  return { id: id, url: id ? 'https://www.youtube.com/channel/' + id : '' };
}

function gwYouTubeApiMedia_(apiKey, channelId) {
  const base = 'https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=1&channelId=' +
    encodeURIComponent(channelId) + '&key=' + encodeURIComponent(apiKey);
  const live = gwFetchJson_([base + '&eventType=live&order=date'], 'Siaran YouTube belum terbaca.');
  const latestUrl = base.replace('maxResults=1', 'maxResults=5') + '&order=date';
  const latest = gwFetchJson_([latestUrl], 'Video YouTube belum terbaca.');
  const recent = (latest.items || []).map(function (item) {
    return { id: item.id.videoId, title: gwClean_(item.snippet && item.snippet.title), publishedAt: gwClean_(item.snippet && item.snippet.publishedAt), isLive: false };
  });
  const featured = live.items && live.items.length ? {
    id: live.items[0].id.videoId,
    title: gwClean_(live.items[0].snippet && live.items[0].snippet.title),
    publishedAt: gwClean_(live.items[0].snippet && live.items[0].snippet.publishedAt),
    isLive: true
  } : recent[0] || null;
  return { featured: featured, recent: recent };
}

function gwYouTubePublicMedia_(liveUrls, channelUrl, searchQuery) {
  const urls = Array.isArray(liveUrls) ? liveUrls : [liveUrls];
  let liveVideo = null;
  for (let index = 0; index < urls.length; index++) {
    try {
      const liveHtml = gwFetchText_(urls[index], '');
      const liveId = gwYouTubeVideoId_(liveHtml, true);
      if (liveId) {
        liveVideo = { id: liveId, title: gwYouTubeTitle_(liveHtml, liveId) || 'AWR Borneo · Live', isLive: true };
        break;
      }
    } catch (ignore) {}
  }
  let videosHtml = '';
  try { videosHtml = gwFetchText_(channelUrl.replace(/\/$/, '') + '/videos', ''); } catch (ignore) {}
  if (!videosHtml || !gwYouTubeVideoId_(videosHtml, false)) {
    videosHtml = gwFetchText_('https://www.youtube.com/results?search_query=' + encodeURIComponent(searchQuery || 'AWR Borneo'), 'Video YouTube belum dapat diperiksa.');
  }
  const recent = gwYouTubeVideoList_(videosHtml, 5).map(function (id, index) {
    return { id: id, title: gwYouTubeTitle_(videosHtml, id) || (index ? 'Video AWR Borneo sebelumnya' : 'Program terbaru AWR Borneo'), isLive: false };
  });
  return { featured: liveVideo || recent[0] || null, recent: recent };
}

function gwYouTubeVideoList_(html, limit) {
  const source = String(html || '');
  const expression = /"videoId":"([A-Za-z0-9_-]{11})"/g;
  const seen = {};
  const items = [];
  let match;
  while ((match = expression.exec(source)) && items.length < Number(limit || 5)) {
    if (seen[match[1]]) continue;
    seen[match[1]] = true;
    items.push(match[1]);
  }
  return items;
}

function gwYouTubeVideoId_(html, requireLive) {
  const source = String(html || '');
  let match = null;
  if (requireLive) {
    match = source.match(/"videoId":"([A-Za-z0-9_-]{11})"[\s\S]{0,1600}?"isLiveNow":true/) ||
      source.match(/"isLiveNow":true[\s\S]{0,1600}?"videoId":"([A-Za-z0-9_-]{11})"/);
  } else {
    match = source.match(/"videoId":"([A-Za-z0-9_-]{11})"/);
  }
  return match ? match[1] : '';
}

function gwYouTubeTitle_(html, videoId) {
  const source = String(html || '');
  const position = source.indexOf('"videoId":"' + videoId + '"');
  const slice = source.slice(Math.max(0, position - 1600), position + 3200);
  const match = slice.match(/"title":\{"runs":\[\{"text":"((?:\\.|[^"\\])*)"/) ||
    slice.match(/"title":\{"simpleText":"((?:\\.|[^"\\])*)"/);
  if (!match) return '';
  try { return gwClean_(JSON.parse('"' + match[1] + '"')); } catch (ignore) { return gwClean_(match[1]); }
}

function gwYouTubeHandle_(url) {
  const match = String(url || '').match(/youtube\.com\/(?:@)?([^/?#]+)/i);
  if (!match || /^(channel|c|user)$/i.test(match[1])) return '';
  return '@' + String(match[1]).replace(/^@/, '');
}

/* -------------------------------------------------------------------------- */
/* Tema Advent tahunan                                                         */
/* -------------------------------------------------------------------------- */

function getAdventTheme(year) {
  const currentYear = Number(Utilities.formatDate(new Date(), GW.TIMEZONE, 'yyyy'));
  const selectedYear = Math.max(2024, Math.min(2100, Number(year) || currentYear));
  const cache = CacheService.getScriptCache();
  const cacheKey = gwCacheKey_('advent-theme-' + selectedYear);
  const cached = cache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const spreadsheet = gwSpreadsheet_();
  let result = gwThemeFromSheet_(spreadsheet, selectedYear);
  if (!result) result = gwOfficialTheme_(selectedYear);
  if (!result) {
    result = {
      year: selectedYear,
      title: 'Tema tahun ' + selectedYear + ' belum tersedia.',
      scripture: '', song: '', description: '', imageUrl: '',
      source: 'Belum diterbitkan pada sumber yang terhubung', sourceUrl: '', status: 'unavailable'
    };
  }
  gwCachePut_(cache, cacheKey, result, 43200);
  return result;
}

function gwThemeFromSheet_(spreadsheet, year) {
  const sheet = spreadsheet.getSheetByName(GW.SHEETS.adventTheme);
  if (!sheet || sheet.getLastRow() < 2) return null;
  const row = sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).getDisplayValues().filter(function (item) {
    return Number(item[0]) === Number(year) && gwNormalize_(item[6]) === 'publish' && gwClean_(item[1]);
  })[0];
  if (!row) return null;
  return {
    year: Number(row[0]), title: gwClean_(row[1]), scripture: gwClean_(row[2]),
    song: gwClean_(row[3]), description: '', imageUrl: gwSafeUrl_(row[4]),
    sourceUrl: gwSafeUrl_(row[5]), source: 'Pengaturan Jemaat Galilea', status: 'available'
  };
}

function gwOfficialTheme_(year) {
  const phases = {
    2026: { title: 'Mission Reach 2026', description: 'Menjangkau orang, tempat, dan peluang baru dengan terang pengharapan dan kasih.' },
    2027: { title: 'Mission Expand 2027', description: 'Memperluas pengaruh dan dampak misi, termasuk pelayanan di ruang digital.' },
    2028: { title: 'Mission Advance 2028', description: 'Memajukan misi dengan keberanian, pertumbuhan, dan inovasi.' },
    2029: { title: 'Mission Proclaim 2029', description: 'Meninggikan Yesus dan memberitakan Injil kekal.' },
    2030: { title: 'Mission Seek · Save · Disciple 2030', description: 'Mencari, menyelamatkan, dan memuridkan secara berkelanjutan.' }
  };
  const selected = phases[Number(year)];
  if (!selected) return null;
  let imageUrl = '';
  try {
    const html = gwFetchText_(GW.SOURCES.adventTheme, '');
    const image = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    imageUrl = gwSafeUrl_(image && image[1]);
  } catch (ignore) {}
  return {
    year: Number(year), title: selected.title, scripture: 'Yohanes 4:35–36', song: '',
    description: selected.description, imageUrl: imageUrl, sourceUrl: GW.SOURCES.adventTheme,
    source: 'Southern Asia-Pacific Division · Mission REAPS 2026–2030', status: 'available'
  };
}

/* -------------------------------------------------------------------------- */
/* Alkitab dan Lagu Sion                                                       */
/* -------------------------------------------------------------------------- */

function getBibleBooks() {
  return gwBibleBooks_().map(function (book, index) {
    return {
      id: book.id, name: book.name, chapters: book.chapters, testament: book.testament,
      testamentLabel: book.testament === 'PL' ? 'Perjanjian Lama' : 'Perjanjian Baru',
      order: index + 1
    };
  });
}

function getBibleChapter(bookId, chapter) {
  const book = gwBibleBooks_().filter(function (item) { return item.id === String(bookId || '').toUpperCase(); })[0];
  if (!book) throw new Error('Kitab tidak dikenali.');
  const selectedChapter = Math.max(1, Math.min(book.chapters, Number(chapter) || 1));
  const cache = CacheService.getScriptCache();
  const cacheKey = gwCacheKey_('bible-tb-' + book.id + '-' + selectedChapter);
  const cached = cache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const folder = book.folder || book.name;
  const url = GW.SOURCES.bible + folder + '/' + folder + '_' + selectedChapter + '.txt';
  const response = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true, followRedirects: true, headers: { Accept: 'text/plain' }
  });
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
    throw new Error('Sumber Alkitab sedang tidak dapat dihubungi.');
  }
  const verses = gwParseTb_(response.getContentText('UTF-8')).map(function (verse, index) {
    return {
      number: gwClean_(verse && verse.number) || String(index + 1),
      text: gwClean_(verse && verse.text)
    };
  }).filter(function (verse) { return Boolean(verse.text); });
  if (!verses.length) throw new Error('Pasal yang dipilih belum tersedia.');
  const result = {
    book: book.name, bookId: book.id, chapter: selectedChapter, chapters: book.chapters,
    verses: verses, source: 'Alkitab Terjemahan Baru (TB) · dataset neocarles/alkitab-tb', sourceUrl: GW.SOURCES.bible
  };
  gwCachePut_(cache, cacheKey, result, 21600);
  return result;
}

/** Mengambil satu kitab lengkap untuk unduhan per kitab. */
function getBibleBook(bookId) {
  const book = gwBibleBooks_().filter(function (item) { return item.id === String(bookId || '').toUpperCase(); })[0];
  if (!book) throw new Error('Kitab tidak dikenali.');
  const folder = book.folder || book.name;
  const chapters = Array.from({ length: book.chapters }, function (_, index) {
    const chapterNum = index + 1;
    let verses = [];
    try {
      const url = GW.SOURCES.bible + folder + '/' + folder + '_' + chapterNum + '.txt';
      const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true, headers: { Accept: 'text/plain' } });
      if (res.getResponseCode() >= 200 && res.getResponseCode() < 300) {
        verses = gwParseTb_(res.getContentText('UTF-8')).map(function (verse, verseIndex) {
          return {
            number: gwClean_(verse && verse.number) || String(verseIndex + 1),
            text: gwClean_(verse && verse.text)
          };
        }).filter(function (verse) { return Boolean(verse.text); });
      }
    } catch (ignore) {}
    return { number: chapterNum, verses: verses };
  });
  return {
    book: book.name, bookId: book.id, chapters: chapters,
    source: 'Alkitab Terjemahan Baru (TB) · dataset neocarles/alkitab-tb', sourceUrl: GW.SOURCES.bible,
    watermark: 'Diunduh melalui Website Galilea', copyright: '© Sekretaris Galilea 2026'
  };
}

function getHymnalCatalog() {
  const cache = CacheService.getScriptCache();
  const cacheKey = gwCacheKey_('hymnal-catalog');
  const cached = cache.get(cacheKey);
  if (cached) return JSON.parse(cached);
  const songs = gwHymnalSource_();
  const result = {
    count: songs.length,
    songs: songs.map(function (song) {
      return { number: Number(song.number), index: gwClean_(song.index), title: gwClean_(song.title) };
    }),
    source: 'LaguSion-indo', sourceUrl: GW.SOURCES.hymnalProject
  };
  gwCachePut_(cache, cacheKey, result, 21600);
  return result;
}

function getHymnalSong(number) {
  const selected = Number(number);
  if (!Number.isInteger(selected) || selected < 1 || selected > 525) throw new Error('Nomor Lagu Sion harus antara 1 sampai 525.');
  const cache = CacheService.getScriptCache();
  const cacheKey = gwCacheKey_('hymn-' + selected);
  const cached = cache.get(cacheKey);
  if (cached) return JSON.parse(cached);
  const song = gwHymnalSource_().filter(function (item) { return Number(item.number) === selected; })[0];
  if (!song) throw new Error('Lagu nomor ' + selected + ' tidak ditemukan.');
  const result = {
    number: Number(song.number), title: gwClean_(song.title),
    lyrics: (song.lyrics || []).map(function (part) {
      return {
        type: gwClean_(part.type || 'verse'), index: Number(part.index) || 1,
        lines: (part.lines || []).map(gwClean_).filter(Boolean)
      };
    }),
    source: 'LaguSion-indo', sourceUrl: GW.SOURCES.hymnalProject
  };
  gwCachePut_(cache, cacheKey, result, 21600);
  return result;
}

/** Status arsip PDF besar. Dibangun sekali oleh admin lalu dipakai semua jemaat. */
function getGalileaDownloadArchives() {
  const properties = PropertiesService.getScriptProperties();
  return {
    bible: gwDownloadFileInfo_(properties.getProperty('GALILEA_BIBLE_PDF_ID'), 'Alkitab lengkap'),
    hymnal: gwDownloadFileInfo_(properties.getProperty('GALILEA_HYMNAL_PDF_ID'), 'Lagu Sion lengkap')
  };
}

/** Jalankan dari admin/editor saat pertama kali atau bila sumber perlu diperbarui. */
function buildGalileaDownloadArchives(kind) {
  if (typeof gaRequireRole_ === 'function') gaRequireRole_('SUPERADMIN');
  const selected = gwClean_(kind || 'all').toLowerCase();
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error('Pembuatan arsip lain sedang berlangsung. Coba kembali beberapa saat lagi.');
  try {
    const result = {};
    if (selected === 'all' || selected === 'bible') result.bible = gwBuildBiblePdf_();
    if (selected === 'all' || selected === 'hymnal') result.hymnal = gwBuildHymnalPdf_();
    return result;
  } finally { lock.releaseLock(); }
}

/** PDF triwulan aktif dikirim sebagai Base64 agar langsung terunduh tanpa file sementara. */
function downloadQuarterlySchedulePdf() {
  const data = getWebsiteData();
  const sections = data.sections.map(function (section) {
    return '<section><h2>' + gwEscapeHtml_(section.title) + '</h2>' + section.records.map(function (record) {
      return '<article><h3>' + gwEscapeHtml_(record.dateLabel) + ' · ' + gwEscapeHtml_(String(record.time).replace(':', '.')) + ' WITA</h3><table>' +
        record.fields.map(function (field) { return '<tr><th>' + gwEscapeHtml_(field.label) + '</th><td>' + gwEscapeHtml_(field.value) + '</td></tr>'; }).join('') +
        '</table></article>';
    }).join('') + '</section>';
  }).join('');
  const html = gwPdfDocumentHtml_('Jadwal Ibadah · ' + data.periodLabel, '<p class="lead">GMAHK Galilea Balikpapan · ' + gwEscapeHtml_(data.updatedAt) + '</p>' + sections);
  const blob = gwHtmlPdfBlob_(html, 'Jadwal-Ibadah-' + data.periodLabel.replace(/[^A-Za-z0-9]+/g, '-') + '.pdf');
  return { filename: blob.getName(), mimeType: 'application/pdf', base64: Utilities.base64Encode(blob.getBytes()) };
}

function gwBuildBiblePdf_() {
  const books = gwBibleBooks_();
  const responses = UrlFetchApp.fetchAll(books.map(function (book) {
    return { url: GW.SOURCES.bible + book.file, muteHttpExceptions: true, followRedirects: true, headers: { Accept: 'text/plain' } };
  }));
  const body = books.map(function (book, index) {
    const response = responses[index];
    if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) return '';
    const source = response.getContentText('UTF-8');
    return '<section class="book"><h2>' + gwEscapeHtml_(book.name) + '</h2>' + Array.from({ length: book.chapters }, function (_, chapterIndex) {
      const chapter = chapterIndex + 1;
      const verses = gwParseUsfm_(source, chapter);
      return '<article><h3>' + gwEscapeHtml_(book.name) + ' ' + chapter + '</h3><p>' + verses.map(function (verse) {
        return '<sup>' + gwEscapeHtml_(verse.number) + '</sup> ' + gwEscapeHtml_(verse.text);
      }).join(' ') + '</p></article>';
    }).join('') + '</section>';
  }).join('');
  const blob = gwHtmlPdfBlob_(gwPdfDocumentHtml_('Alkitab Yang Terbuka', body + '<p class="source">Sumber teks: Alkitab Yang Terbuka (AYT) — SABDA.</p>'), 'Alkitab-AYT-Galilea.pdf');
  return gwSavePublicDownload_(blob, 'GALILEA_BIBLE_PDF_ID');
}

function gwBuildHymnalPdf_() {
  const songs = gwHymnalSource_();
  const body = songs.map(function (song) {
    return '<article class="song"><h2>' + Number(song.number) + '. ' + gwEscapeHtml_(song.title) + '</h2>' + (song.lyrics || []).map(function (part) {
      const chorus = gwNormalize_(part.type) === 'chorus' || gwNormalize_(part.type) === 'refrain';
      return '<h3>' + (chorus ? 'Reff' : 'Ayat ' + (Number(part.index) || 1)) + '</h3><p>' + (part.lines || []).map(gwEscapeHtml_).join('<br>') + '</p>';
    }).join('') + '</article>';
  }).join('');
  const blob = gwHtmlPdfBlob_(gwPdfDocumentHtml_('Lagu Sion · Edisi Lengkap', body + '<p class="source">Sumber digital: LaguSion-indo.</p>'), 'Lagu-Sion-Lengkap-Galilea.pdf');
  return gwSavePublicDownload_(blob, 'GALILEA_HYMNAL_PDF_ID');
}

function gwPdfDocumentHtml_(title, body) {
  return '<!doctype html><html><head><meta charset="utf-8"><style>' +
    '@page{size:A4;margin:18mm 16mm 21mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#172019;font-size:10pt;line-height:1.52}h1{font-size:25pt;color:#214b36;margin:0 0 8mm}h2{font-size:17pt;color:#315d45;margin:10mm 0 4mm;page-break-after:avoid}h3{font-size:11pt;margin:5mm 0 2mm;page-break-after:avoid}article{page-break-inside:avoid;margin-bottom:6mm}table{width:100%;border-collapse:collapse}th,td{padding:2.2mm;border-bottom:1px solid #d8e1d8;text-align:left;vertical-align:top}th{width:36%;color:#526157}sup{color:#52705c;font-weight:700}.lead,.source{color:#647169}.song{page-break-inside:avoid}.watermark{position:fixed;right:0;bottom:-10mm;color:#78877e;font-size:7pt}.copyright{position:fixed;left:0;bottom:-10mm;color:#78877e;font-size:7pt}</style></head><body>' +
    '<h1>' + gwEscapeHtml_(title) + '</h1>' + body +
    '<div class="watermark">Diunduh melalui Website Galilea</div><div class="copyright">© Sekretaris Galilea 2026</div></body></html>';
}

function gwHtmlPdfBlob_(html, filename) {
  try { return Utilities.newBlob(html, 'text/html', filename.replace(/\.pdf$/i, '.html')).getAs(MimeType.PDF).setName(filename); }
  catch (error) { throw new Error('PDF belum dapat dibuat: ' + gwErrorMessage_(error)); }
}

function gwSavePublicDownload_(blob, propertyName) {
  const properties = PropertiesService.getScriptProperties();
  const oldId = properties.getProperty(propertyName);
  if (oldId) { try { DriveApp.getFileById(oldId).setTrashed(true); } catch (ignore) {} }
  const folder = gwDownloadFolder_();
  const file = folder.createFile(blob);
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (ignore) {}
  properties.setProperty(propertyName, file.getId());
  return gwDownloadFileInfo_(file.getId(), file.getName());
}

function gwDownloadFolder_() {
  const properties = PropertiesService.getScriptProperties();
  const stored = properties.getProperty('GALILEA_DOWNLOAD_FOLDER_ID');
  if (stored) { try { return DriveApp.getFolderById(stored); } catch (ignore) {} }
  const folder = DriveApp.createFolder('Galilea Website Downloads');
  properties.setProperty('GALILEA_DOWNLOAD_FOLDER_ID', folder.getId());
  return folder;
}

function gwDownloadFileInfo_(id, label) {
  if (!id) return { ready: false, label: label, url: '' };
  try {
    const file = DriveApp.getFileById(id);
    if (file.isTrashed()) return { ready: false, label: label, url: '' };
    return { ready: true, label: label, name: file.getName(), url: 'https://drive.google.com/uc?export=download&id=' + id, updatedAt: gwFormatDateTime_(file.getLastUpdated()) };
  } catch (ignore) { return { ready: false, label: label, url: '' }; }
}

function gwEscapeHtml_(value) {
  return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function gwHymnalSource_() {
  const payload = gwFetchJson_([GW.SOURCES.hymnal], 'Katalog Lagu Sion sedang tidak dapat dihubungi.');
  if (!Array.isArray(payload)) throw new Error('Format katalog Lagu Sion tidak dikenali.');
  return payload;
}

/* -------------------------------------------------------------------------- */
/* Utilitas inti                                                               */
/* -------------------------------------------------------------------------- */

function gwSpreadsheet_() {
  const properties = PropertiesService.getScriptProperties();
  const storedId = properties.getProperty(GW.SPREADSHEET_PROPERTY);
  if (storedId) {
    try { return SpreadsheetApp.openById(storedId); } catch (ignore) {}
  }
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) {
    throw new Error('Website belum terhubung ke spreadsheet. Jalankan setupWebsiteGalilea() satu kali.');
  }
  properties.setProperty(GW.SPREADSHEET_PROPERTY, active.getId());
  return active;
}

function gwEnsureServiceStore_() {
  const properties = PropertiesService.getScriptProperties();
  const storedId = properties.getProperty(GW.SERVICE_SPREADSHEET_PROPERTY);
  if (storedId) {
    try {
      const existing = SpreadsheetApp.openById(storedId);
      if (existing) return existing;
    } catch (ignore) {}
  }
  const store = SpreadsheetApp.create('GMAHK Galilea - Layanan Jemaat (PRIVAT)');
  const sheet = store.getSheets()[0];
  sheet.setName(GW.SHEETS.services);
  sheet.getRange(1, 1, 1, 12).setValues([['ID', 'Waktu Masuk', 'Jenis Layanan', 'Nama', 'WhatsApp', 'Pesan', 'Cara Dihubungi', 'Persetujuan', 'Status', 'Catatan Admin', 'Diperbarui', 'Privasi']]);
  gwFormatAdminSheet_(sheet, [185, 165, 190, 180, 155, 420, 150, 120, 110, 320, 165, 150]);
  properties.setProperty(GW.SERVICE_SPREADSHEET_PROPERTY, store.getId());
  return store;
}

function gwServiceSheet_() {
  const store = gwEnsureServiceStore_();
  let sheet = store.getSheetByName(GW.SHEETS.services);
  if (!sheet) {
    sheet = store.insertSheet(GW.SHEETS.services);
    sheet.getRange(1, 1, 1, 12).setValues([['ID', 'Waktu Masuk', 'Jenis Layanan', 'Nama', 'WhatsApp', 'Pesan', 'Cara Dihubungi', 'Persetujuan', 'Status', 'Catatan Admin', 'Diperbarui', 'Privasi']]);
    gwFormatAdminSheet_(sheet, [185, 165, 190, 180, 155, 420, 150, 120, 110, 320, 165, 150]);
  }
  if (sheet.getMaxColumns() < 12) sheet.insertColumnsAfter(sheet.getMaxColumns(), 12 - sheet.getMaxColumns());
  sheet.getRange(1, 10, 1, 3).setValues([['Catatan Admin', 'Diperbarui', 'Privasi']]);
  return sheet;
}

function gwCacheKey_(name) {
  const revision = PropertiesService.getScriptProperties().getProperty(GW.CACHE_REVISION_PROPERTY) || '0';
  return 'gw1402-' + gwDigest_(name + '|' + revision).slice(0, 28);
}

function gwCachePut_(cache, key, value, seconds) {
  try {
    const serialized = JSON.stringify(value);
    if (serialized.length <= 95000) cache.put(key, serialized, Math.max(60, Math.min(21600, Number(seconds) || 300)));
  } catch (ignore) {}
}

function gwClean_(value) {
  const text = String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  return text === '-' ? '—' : text;
}

function gwNormalize_(value) {
  return gwClean_(value).toLowerCase();
}

function gwNormalizeSearch_(value) {
  return gwNormalize_(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function gwSafeUrl_(value) {
  const url = gwClean_(value);
  if (!url) return '';
  if (!/^https:\/\//i.test(url)) return '';
  if (/^https:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?:[:/]|$)/i.test(url)) return '';
  return url.replace(/[\u0000-\u001f\u007f]/g, '');
}

function gwAssetUrl_(value) {
  const raw = gwClean_(value);
  if (!raw) return '';
  if (/^https:\/\//i.test(raw)) return gwSafeUrl_(raw);
  if (/^\/\//.test(raw)) return gwSafeUrl_('https:' + raw);
  if (/^\//.test(raw)) return gwSafeUrl_(GW.SOURCES.sabbathWeb + raw);
  return gwSafeUrl_(GW.SOURCES.sabbathWeb + '/' + raw.replace(/^\.\//, ''));
}

function gwDigest_(value) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value || ''), Utilities.Charset.UTF_8);
  return bytes.map(function (byte) {
    const unsigned = byte < 0 ? byte + 256 : byte;
    return ('0' + unsigned.toString(16)).slice(-2);
  }).join('');
}

function gwErrorMessage_(error) {
  const message = error && error.message ? error.message : String(error || 'Terjadi gangguan.');
  return gwClean_(message.replace(/^Exception:\s*/i, ''));
}

function gwTruncate_(value, limit) {
  const text = gwClean_(value);
  const max = Math.max(40, Number(limit) || 240);
  return text.length > max ? text.slice(0, max).replace(/\s+\S*$/, '') + '…' : text;
}

/* -------------------------------------------------------------------------- */
/* Tanggal dan periode                                                         */
/* -------------------------------------------------------------------------- */

function gwParseDate_(rawValue, displayValue) {
  if (Object.prototype.toString.call(rawValue) === '[object Date]' && !isNaN(rawValue.getTime())) return rawValue;
  if (typeof rawValue === 'number' && isFinite(rawValue)) {
    const serial = new Date(Math.round((rawValue - 25569) * 86400000));
    return isNaN(serial.getTime()) ? null : serial;
  }
  const text = gwClean_(displayValue || rawValue);
  let match = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (match) return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]), 12);
  match = text.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  return null;
}

function gwFormatLongDate_(date) {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabat'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const localIso = Utilities.formatDate(date, GW.TIMEZONE, 'yyyy-MM-dd').split('-').map(Number);
  const dayIndex = new Date(Date.UTC(localIso[0], localIso[1] - 1, localIso[2])).getUTCDay();
  return days[dayIndex] + ', ' + localIso[2] + ' ' + months[localIso[1] - 1] + ' ' + localIso[0];
}

function gwFormatShortDate_(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const day = Number(Utilities.formatDate(date, GW.TIMEZONE, 'd'));
  const month = Number(Utilities.formatDate(date, GW.TIMEZONE, 'M')) - 1;
  return day + ' ' + months[month] + ' ' + Utilities.formatDate(date, GW.TIMEZONE, 'yyyy');
}

function gwFormatDateTime_(date) {
  return gwFormatLongDate_(date) + ' • ' + Utilities.formatDate(date, GW.TIMEZONE, 'HH.mm') + ' WITA';
}

function gwCountdown_(timestamp, now) {
  const target = new Date(timestamp);
  if (isNaN(target.getTime())) return '';
  const difference = Math.max(target.getTime() - now.getTime(), 0);
  const sameDate = Utilities.formatDate(target, GW.TIMEZONE, 'yyyy-MM-dd') === Utilities.formatDate(now, GW.TIMEZONE, 'yyyy-MM-dd');
  if (sameDate) return 'HARI INI';
  const totalHours = Math.floor(difference / 3600000);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return days ? days + ' HARI • ' + hours + ' JAM LAGI' : Math.max(hours, 1) + ' JAM LAGI';
}

function gwPeriodLabel_(date) {
  const year = Number(Utilities.formatDate(date, GW.TIMEZONE, 'yyyy'));
  const month = Number(Utilities.formatDate(date, GW.TIMEZONE, 'M'));
  const quarter = Math.floor((month - 1) / 3) + 1;
  const months = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];
  const start = (quarter - 1) * 3;
  return 'TRIWULAN ' + gwRoman_(quarter) + ' • ' + months[start] + ' – ' + months[start + 2] + ' ' + year;
}

function gwCurrentPeriod_() {
  const now = new Date();
  const year = Number(Utilities.formatDate(now, GW.TIMEZONE, 'yyyy'));
  const month = Number(Utilities.formatDate(now, GW.TIMEZONE, 'M'));
  const quarter = Math.floor((month - 1) / 3) + 1;
  return { year: year, quarter: quarter, id: year + '-' + String(quarter).padStart(2, '0') };
}

function gwNormalizePeriod_(year, quarter) {
  const current = gwCurrentPeriod_();
  const selectedYear = Math.min(2100, Math.max(2016, Number(year) || current.year));
  const selectedQuarter = Math.min(4, Math.max(1, Number(quarter) || current.quarter));
  return { year: selectedYear, quarter: selectedQuarter, id: selectedYear + '-' + String(selectedQuarter).padStart(2, '0') };
}

function gwRoman_(number) {
  return ['', 'I', 'II', 'III', 'IV'][Number(number)] || String(number);
}

function gwFromRoman_(roman) {
  return ({ I: 1, II: 2, III: 3, IV: 4 })[String(roman || '').toUpperCase()] || 0;
}

function gwApiDateNumber_(value) {
  const text = gwClean_(value);
  let match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) return Number(match[3] + String(match[2]).padStart(2, '0') + String(match[1]).padStart(2, '0'));
  match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) return Number(match[1] + String(match[2]).padStart(2, '0') + String(match[3]).padStart(2, '0'));
  return 0;
}

function gwApiDateLabel_(value) {
  const text = gwClean_(value);
  let match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) return gwFormatLongDate_(new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]), 12));
  match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) return gwFormatLongDate_(new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12));
  return text;
}

function gwApiDateRangeLabel_(startValue, endValue) {
  const start = gwApiDateLabel_(startValue);
  const end = gwApiDateLabel_(endValue);
  if (!start) return end;
  if (!end || start === end) return start;
  return start + ' — ' + end;
}

function gwSelectDated_(items, now, startKey, endKey) {
  const today = Number(Utilities.formatDate(now, GW.TIMEZONE, 'yyyyMMdd'));
  const dated = (items || []).map(function (item, index) {
    return {
      item: item, index: index,
      start: gwApiDateNumber_(item[startKey] || item.date),
      end: gwApiDateNumber_(item[endKey] || item[startKey] || item.date)
    };
  }).filter(function (entry) { return entry.start; });
  if (!dated.length) return (items || [])[0] || {};
  const active = dated.filter(function (entry) { return entry.start <= today && entry.end >= today; })[0];
  if (active) return active.item;
  const future = dated.filter(function (entry) { return entry.start > today; }).sort(function (a, b) { return a.start - b.start; })[0];
  return future ? future.item : dated.sort(function (a, b) { return b.end - a.end; })[0].item;
}

/* -------------------------------------------------------------------------- */
/* Pengambilan dan pemrosesan konten                                           */
/* -------------------------------------------------------------------------- */

function gwFetchJson_(urls, publicErrorMessage) {
  const list = Array.isArray(urls) ? urls : [urls];
  let lastMessage = '';
  for (let index = 0; index < list.length; index++) {
    try {
      const response = UrlFetchApp.fetch(list[index], {
        muteHttpExceptions: true,
        followRedirects: true,
        headers: { Accept: 'application/json', 'User-Agent': 'GalileaPortal/' + GW.VERSION }
      });
      const text = response.getContentText('UTF-8');
      const code = response.getResponseCode();
      if (code < 200 || code >= 300 || !/^\s*[\[{]/.test(text)) {
        lastMessage = 'HTTP ' + code;
        continue;
      }
      try { return JSON.parse(text); } catch (parseError) { lastMessage = 'Format JSON tidak dikenali'; }
    } catch (error) { lastMessage = gwErrorMessage_(error); }
  }
  throw new Error(publicErrorMessage || lastMessage || 'Sumber data sedang tidak tersedia.');
}

function gwFetchText_(url, publicErrorMessage) {
  const response = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    followRedirects: true,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; GalileaPortal/' + GW.VERSION + ')',
      'Accept-Language': 'id-ID,id;q=0.9,en;q=0.7'
    }
  });
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
    throw new Error(publicErrorMessage || 'Sumber daring sedang tidak dapat dihubungi.');
  }
  return response.getContentText('UTF-8');
}

function gwWordPressPosts_(parameters) {
  const query = Object.keys(parameters || {}).filter(function (key) {
    return parameters[key] !== '' && parameters[key] != null;
  }).map(function (key) {
    return encodeURIComponent(key) + '=' + encodeURIComponent(parameters[key]);
  }).join('&');
  const urls = GW.SOURCES.wordpress.map(function (base) { return base + '/posts?' + query; });
  const payload = gwFetchJson_(urls, 'Materi Advent sedang tidak dapat dihubungi.');
  return Array.isArray(payload) ? payload : [];
}

function gwWordPressCategoryId_(slug, fallbackId) {
  const cache = CacheService.getScriptCache();
  const key = gwCacheKey_('wp-category-' + slug);
  const cached = cache.get(key);
  if (cached) return cached;
  try {
    const urls = GW.SOURCES.wordpress.map(function (base) {
      return base + '/categories?slug=' + encodeURIComponent(slug) + '&per_page=1&_fields=id,slug,name';
    });
    const categories = gwFetchJson_(urls, 'Kategori materi belum tersedia.');
    const id = categories && categories[0] && String(categories[0].id || '');
    if (id) { cache.put(key, id, 21600); return id; }
  } catch (ignore) {}
  return String(fallbackId || '');
}

function gwWordPressDate_(value) {
  const text = gwClean_(value);
  if (!text) return null;
  const date = new Date(/(?:Z|[+\-]\d{2}:?\d{2})$/.test(text) ? text : text + GW.UTC_OFFSET);
  return isNaN(date.getTime()) ? null : date;
}

function gwWordPressDateParts_(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return { year: Number(match[1]), monthIndex: Number(match[2]) - 1, day: Number(match[3]) };
}

function gwExtractIndonesianDate_(value) {
  const months = {
    januari: 0, februari: 1, maret: 2, april: 3, mei: 4, juni: 5,
    juli: 6, agustus: 7, september: 8, oktober: 9, november: 10, nopember: 10, desember: 11
  };
  const match = gwStripHtml_(value).toLowerCase().match(/(?:sabat|sabtu)?\s*,?\s*(\d{1,2})\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|nopember|desember)\s+(\d{4})/i);
  if (!match) return null;
  const date = new Date(Number(match[3]), months[match[2].toLowerCase()], Number(match[1]), 12);
  return isNaN(date.getTime()) ? null : date;
}

function gwNextSabbathDate_(value) {
  const source = value instanceof Date ? value : new Date(value);
  const local = Utilities.formatDate(source, GW.TIMEZONE, 'yyyy-MM-dd').split('-').map(Number);
  const date = new Date(local[0], local[1] - 1, local[2], 12);
  const daysUntil = (6 - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + daysUntil);
  return date;
}

function gwSabbathOrdinal_(value) {
  const source = value instanceof Date ? value : new Date(value);
  const parts = Utilities.formatDate(source, GW.TIMEZONE, 'yyyy-MM-dd').split('-').map(Number);
  const target = new Date(parts[0], parts[1] - 1, parts[2], 12);
  const first = new Date(parts[0], 0, 1, 12);
  first.setDate(first.getDate() + ((6 - first.getDay() + 7) % 7));
  return Math.max(1, Math.floor((target.getTime() - first.getTime()) / 604800000) + 1);
}

function gwSanitizeHtml_(value) {
  let html = String(value == null ? '' : value);
  html = html
    .replace(/<!--([\s\S]*?)-->/g, '')
    .replace(/<(script|style|iframe|object|embed|form|input|button|textarea|select)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<(script|style|iframe|object|embed|form|input|button|textarea|select)\b[^>]*\/?\s*>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+(?:style|id|class)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+(href|src)\s*=\s*(["'])\s*(?:javascript:|data:text\/html)[\s\S]*?\2/gi, '')
    .replace(/<a\b(?![^>]*\btarget=)([^>]*)>/gi, '<a$1 target="_blank" rel="noopener noreferrer">');
  return html.trim();
}

function gwStripHtml_(value) {
  return String(value == null ? '' : value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;|&#038;/gi, '&')
    .replace(/&quot;|&#8220;|&#8221;/gi, '"')
    .replace(/&#039;|&apos;|&#8216;|&#8217;/gi, "'")
    .replace(/&hellip;|&#8230;/gi, '…')
    .replace(/&#8211;|&#8212;/gi, '—')
    .replace(/\s+/g, ' ')
    .trim();
}

function gwDecodeHtml_(value) {
  return String(value == null ? '' : value)
    .replace(/&amp;|&#038;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function gwRenderBibleFragments_(value) {
  if (typeof value === 'string') return value;
  const seen = {};
  const passages = [];
  (Array.isArray(value) ? value : []).forEach(function (group) {
    const verses = group && group.verses && typeof group.verses === 'object' ? group.verses : {};
    Object.keys(verses).forEach(function (key) {
      const html = String(verses[key] || '');
      const plain = gwStripHtml_(html);
      if (!plain || seen[plain] || passages.length >= 6) return;
      seen[plain] = true;
      passages.push(html);
    });
  });
  return passages.join('<hr>');
}

function gwExtractDevotionalDay_(value, day, monthIndex, year) {
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'Nopember', 'Desember'];
  const selectedMonth = monthIndex === 10 ? '(?:November|Nopember)' : months[monthIndex];
  const marker = new RegExp(
    '<p[^>]*>\\s*<em[^>]*>\\s*Renungan\\s+Pagi,[\\s\\S]{0,100}?' + Number(day) + '\\s+' + selectedMonth + '\\s+' + Number(year) + '[\\s\\S]*?<\\/em>\\s*<\\/p>',
    'i'
  );
  const source = String(value || '');
  const match = marker.exec(source);
  if (!match) return '';
  const next = source.indexOf('<!--nextpage-->', match.index + match[0].length);
  return source.slice(match.index, next >= 0 ? next : source.length);
}

function gwFirstScripture_(html) {
  const quote = String(html || '').match(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/i);
  if (quote) return gwTruncate_(gwStripHtml_(quote[1]), 220);
  const plain = gwStripHtml_(html);
  const match = plain.match(/(?:[1-3]\s*)?[A-Z][A-Za-z.-]+\s+\d{1,3}:\d{1,3}(?:\s*[-–]\s*\d{1,3})?/);
  return match ? match[0] : '';
}

function gwExtractReferences_(html) {
  const text = gwStripHtml_(html);
  const matches = text.match(/(?:[1-3]\s*)?[A-Z][A-Za-z.-]+\s+\d{1,3}:\d{1,3}(?:\s*[-–]\s*\d{1,3})?/g) || [];
  const seen = {};
  return matches.filter(function (item) {
    const key = item.toLowerCase();
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  }).slice(0, 8);
}

function gwPersonalActions_(dayNumber, readingTitle) {
  const actions = [
    'Doakan satu orang secara spesifik dan minta Tuhan membuka kesempatan untuk menyapanya.',
    'Bagikan satu ayat dari bacaan hari ini bersama pesan pribadi yang singkat dan tulus.',
    'Hubungi anggota atau sahabat yang lama tidak terlihat, lalu dengarkan kabarnya.',
    'Lakukan satu tindakan pelayanan sederhana yang menjawab kebutuhan nyata di sekitar Anda.',
    'Tawarkan doa bersama atau pendampingan belajar Alkitab kepada seseorang yang membutuhkan.',
    'Undang seorang sahabat mengikuti ibadah atau kegiatan jemaat terdekat.',
    'Catat pengalaman pelayanan minggu ini, ucapkan syukur, lalu rencanakan tindak lanjut.'
  ];
  const start = Math.max(0, (Number(dayNumber) || 1) - 1) % actions.length;
  return [
    actions[start],
    actions[(start + 2) % actions.length],
    'Gunakan pokok “' + gwClean_(readingTitle || 'bacaan hari ini') + '” sebagai pembuka percakapan rohani yang alami.'
  ];
}

/* -------------------------------------------------------------------------- */
/* Alkitab Terjemahan Baru (TB)                                               */
/* -------------------------------------------------------------------------- */

function gwBibleBooks_() {
  const rows = [
    ['GEN','Kejadian','Kejadian',50,'PL'],['EXO','Keluaran','Keluaran',40,'PL'],['LEV','Imamat','Imamat',27,'PL'],['NUM','Bilangan','Bilangan',36,'PL'],['DEU','Ulangan','Ulangan',34,'PL'],
    ['JOS','Yosua','Yosua',24,'PL'],['JDG','Hakim-hakim','Hakim_Hakim',21,'PL'],['RUT','Rut','Rut',4,'PL'],['1SA','1 Samuel','1_Samuel',31,'PL'],['2SA','2 Samuel','2_Samuel',24,'PL'],
    ['1KI','1 Raja-raja','1_Raja_Raja',22,'PL'],['2KI','2 Raja-raja','2_Raja_Raja',25,'PL'],['1CH','1 Tawarikh','1_Tawarikh',29,'PL'],['2CH','2 Tawarikh','2_Tawarikh',36,'PL'],['EZR','Ezra','Ezra',10,'PL'],
    ['NEH','Nehemia','Nehemia',13,'PL'],['EST','Ester','Ester',10,'PL'],['JOB','Ayub','Ayub',42,'PL'],['PSA','Mazmur','Mazmur',150,'PL'],['PRO','Amsal','Amsal',31,'PL'],
    ['ECC','Pengkhotbah','Pengkhotbah',12,'PL'],['SNG','Kidung Agung','Kidung_Agung',8,'PL'],['ISA','Yesaya','Yesaya',66,'PL'],['JER','Yeremia','Yeremia',52,'PL'],['LAM','Ratapan','Ratapan',5,'PL'],
    ['EZK','Yehezkiel','Yehezkiel',48,'PL'],['DAN','Daniel','Daniel',12,'PL'],['HOS','Hosea','Hosea',14,'PL'],['JOL','Yoel','Yoel',3,'PL'],['AMO','Amos','Amos',9,'PL'],
    ['OBA','Obaja','Obaja',1,'PL'],['JON','Yunus','Yunus',4,'PL'],['MIC','Mikha','Mikha',7,'PL'],['NAM','Nahum','Nahum',3,'PL'],['HAB','Habakuk','Habakuk',3,'PL'],
    ['ZEP','Zefanya','Zafanya',3,'PL'],['HAG','Hagai','Hagai',2,'PL'],['ZEC','Zakharia','Zakharia',14,'PL'],['MAL','Maleakhi','Maleakhi',4,'PL'],
    ['MAT','Matius','Matius',28,'PB'],['MRK','Markus','Markus',16,'PB'],['LUK','Lukas','Lukas',24,'PB'],['JHN','Yohanes','Yohanes',21,'PB'],['ACT','Kisah Para Rasul','Kisah_Para_Rasul',28,'PB'],
    ['ROM','Roma','Roma',16,'PB'],['1CO','1 Korintus','1_Korintus',16,'PB'],['2CO','2 Korintus','2_Korintus',13,'PB'],['GAL','Galatia','Galatia',6,'PB'],['EPH','Efesus','Efesus',6,'PB'],
    ['PHP','Filipi','Filipi',4,'PB'],['COL','Kolose','Kolose',4,'PB'],['1TH','1 Tesalonika','1_Tesalonika',5,'PB'],['2TH','2 Tesalonika','2_Tesalonika',3,'PB'],['1TI','1 Timotius','1_Timotius',6,'PB'],
    ['2TI','2 Timotius','2_Timotius',4,'PB'],['TIT','Titus','Titus',3,'PB'],['PHM','Filemon','Filemon',1,'PB'],['HEB','Ibrani','Ibrani',13,'PB'],['JAS','Yakobus','Yakobus',5,'PB'],
    ['1PE','1 Petrus','1_Petrus',5,'PB'],['2PE','2 Petrus','2_Petrus',3,'PB'],['1JN','1 Yohanes','1_Yohanes',5,'PB'],['2JN','2 Yohanes','2_Yohanes',1,'PB'],['3JN','3 Yohanes','3_Yohanes',1,'PB'],
    ['JUD','Yudas','Yudas',1,'PB'],['REV','Wahyu','Wahyu',22,'PB']
  ];
  return rows.map(function (row) {
    return { id: row[0], name: row[1], folder: row[2], file: row[2], chapters: row[3], testament: row[4] };
  });
}

function gwParseTb_(source) {
  const lines = String(source || '').replace(/\r/g, '').split('\n');
  const verses = [];
  let current = null;
  lines.forEach(function (line) {
    const trimmed = line.trim();
    if (!trimmed) return;
    const match = trimmed.match(/^\((\d+[a-z]?)\)\s*(.*)$/i);
    if (match) {
      current = { number: match[1], text: match[2].trim() };
      verses.push(current);
    } else if (current) {
      current.text = (current.text + ' ' + trimmed).trim();
    }
  });
  return verses.filter(function (v) { return Boolean(v.text); });
}

function gwParseUsfm_(source, selectedChapter) {
  const lines = String(source || '').replace(/\r/g, '').split('\n');
  const verses = [];
  let active = false;
  let current = null;
  lines.forEach(function (line) {
    const chapterMatch = line.match(/^\\c\s+(\d+)/);
    if (chapterMatch) {
      const number = Number(chapterMatch[1]);
      active = number === Number(selectedChapter);
      current = null;
      return;
    }
    if (!active) return;
    const verseMatch = line.match(/^\\v\s+(\d+[a-z]?)\s*(.*)$/i);
    if (verseMatch) {
      current = { number: verseMatch[1], text: gwCleanUsfm_(verseMatch[2]) };
      verses.push(current);
      return;
    }
    const continuation = line.match(/^\\(?:p|m|nb|pi\d*|q\d*|li\d*)\s*(.*)$/i);
    if (current && continuation && continuation[1]) {
      const extra = gwCleanUsfm_(continuation[1]);
      if (extra) current.text = gwClean_(current.text + ' ' + extra);
    }
  });
  return verses.filter(function (verse) { return verse.text; });
}

function gwCleanUsfm_(value) {
  return gwClean_(String(value || '')
    .replace(/\\f\s[\s\S]*?\\f\*/g, ' ')
    .replace(/\\x\s[\s\S]*?\\x\*/g, ' ')
    .replace(/\\w\s+([^|\\]+)(?:\|[^\\]+)?\\w\*/g, '$1')
    .replace(/\\[a-z0-9]+\*?/gi, ' ')
    .replace(/\|[^\s]+/g, ' '));
}
