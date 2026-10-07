/**
 * GALILEA VERCEL API BRIDGE · V16.0.0
 * Tambahkan file ini ke project Apps Script yang sama.
 * File ini tidak menggantikan Website.gs, Admin.gs, Code.gs, atau file HTML.
 */

const GALILEA_VERCEL_API = Object.freeze({
  VERSION: '17.0.0',
  SECRET_PROPERTY: 'GALILEA_VERCEL_API_SECRET',
  MAX_ARGUMENT_BYTES: 180000
});

function doPost(e) {
  try {
    const request = galileaParseVercelRequest_(e);
    galileaVerifyVercelSecret_(request.secret);

    const method = String(request.method || '');
    const args = Array.isArray(request.args) ? request.args : [];
    if (JSON.stringify(args).length > GALILEA_VERCEL_API.MAX_ARGUMENT_BYTES) {
      throw new Error('Parameter permintaan terlalu besar.');
    }

    const handlers = galileaVercelHandlers_();
    if (!Object.prototype.hasOwnProperty.call(handlers, method)) {
      throw new Error('Fungsi tidak diizinkan pada viewer publik.');
    }

    const data = handlers[method](args);
    return galileaVercelJson_({
      ok: true,
      data: data,
      meta: {
        version: GALILEA_VERCEL_API.VERSION,
        generatedAt: new Date().toISOString(),
        timezone: Session.getScriptTimeZone() || 'Asia/Makassar'
      }
    });
  } catch (error) {
    console.error('[Galilea Vercel API]', error && error.stack ? error.stack : error);
    return galileaVercelJson_({
      ok: false,
      error: error && error.message ? error.message : String(error || 'Terjadi gangguan pada backend Galilea.')
    });
  }
}

function galileaVercelHandlers_() {
  return {
    downloadQuarterlySchedulePdf: function (args) { return downloadQuarterlySchedulePdf.apply(null, args); },
    findMemberSchedule: function (args) { return findMemberSchedule.apply(null, args); },
    getAdventTheme: function (args) { return getAdventTheme.apply(null, args); },
    getAwrBorneoMedia: function (args) { return getAwrBorneoMedia.apply(null, args); },
    getBibleBook: function (args) { return getBibleBook.apply(null, args); },
    getBibleBooks: function (args) { return getBibleBooks.apply(null, args); },
    getBibleChapter: function (args) { return getBibleChapter.apply(null, args); },
    getDailyDevotional: function (args) { return getDailyDevotional.apply(null, args); },
    getGalileaDownloadArchives: function (args) { return getGalileaDownloadArchives.apply(null, args); },
    getHymnalCatalog: function (args) { return getHymnalCatalog.apply(null, args); },
    getHymnalSong: function (args) { return getHymnalSong.apply(null, args); },
    getPersonalEvangelism: function (args) { return getPersonalEvangelism.apply(null, args); },
    getSabbathDiscussionVideos: function (args) { return getSabbathDiscussionVideos.apply(null, args); },
    getSabbathLessonDetail: function (args) { return getSabbathLessonDetail.apply(null, args); },
    getSabbathResourceDetail: function (args) { return getSabbathResourceDetail.apply(null, args); },
    getSabbathResources: function (args) { return getSabbathResources.apply(null, args); },
    getSabbathSchoolLibrary: function (args) { return getSabbathSchoolLibrary.apply(null, args); },
    getWebsiteData: function (args) {
      if (args[0] && args[0].revisionOnly === true) return getWebsiteData(args[0]);
      return galileaGetWebsiteDataForViewer_();
    },
    searchWebsite: function (args) { return searchWebsite.apply(null, args); },
    submitServiceRequest: function (args) { return submitServiceRequest.apply(null, args); },
    translateViewerTexts: function (args) { return translateViewerTexts.apply(null, args); },

    // Admin Backend Handlers have been removed from Vercel Bridge to prevent privilege escalation bypass
  };
}

/**
 * Public viewer adapter.
 *
 * Adapter ini melakukan rekonsiliasi terakhir dari sheet publik agar berita
 * bertanggal hari ini dan metadata media terbaru selalu sampai ke viewer.
 * Hanya baris PUBLISH dengan tanggal hari ini atau sebelumnya yang dikirim.
 * No draft/admin-only data is exposed.
 */
function galileaGetWebsiteDataForViewer_() {
  const data = getWebsiteData();
  if (!data || !Array.isArray(data.activities)) return data;

  const spreadsheet = gwSpreadsheet_();
  const sheet = spreadsheet.getSheetByName(GW.SHEETS.activities);
  if (!sheet || sheet.getLastRow() < 2) {
    data.activities = [];
    return data;
  }

  const count = sheet.getLastRow() - 1;
  const width = Math.max(9, Math.min(sheet.getLastColumn(), 9));
  const raw = sheet.getRange(2, 1, count, width).getValues();
  const display = sheet.getRange(2, 1, count, width).getDisplayValues();
  const today = new Date(Utilities.formatDate(new Date(), GW.TIMEZONE, 'yyyy-MM-dd') + 'T00:00:00' + GW.UTC_OFFSET).getTime();

  data.activities = raw.map(function (row, index) {
    const date = gwParseDate_(row[0], display[index][0]);
    const photos = gwActivityPhotos_(display[index][6]);
    const coverUrl = gwActivityCover_(display[index][6]);
    let media = [];
    try {
      media = display[index][8] ? JSON.parse(display[index][8]) : [];
      if (!Array.isArray(media)) media = [];
    } catch (ignore) { media = []; }
    media = media.map(function (item) {
      if (!item || typeof item !== 'object') return null;
      const mimeType = gwClean_(item.mimeType || 'application/octet-stream').toLowerCase();
      const rawUrl = gwSafeUrl_(item.url);
      const url = /^image\//.test(mimeType) ? galileaDirectDriveImageUrl_(rawUrl) : rawUrl;
      if (!url) return null;
      return {
        id: gwClean_(item.id),
        name: gwClean_(item.name || 'Media'),
        mimeType: mimeType,
        size: Math.max(0, Number(item.size) || 0),
        url: url,
        viewUrl: gwSafeUrl_(item.viewUrl),
        downloadUrl: gwSafeUrl_(item.downloadUrl),
        primary: Boolean(item.primary)
      };
    }).filter(Boolean).slice(0, 24);
    if (!media.length && photos.length) {
      media = photos.map(function (url) {
        return { id: '', name: 'Foto berita', mimeType: 'image/jpeg', size: 0, url: url, primary: url === coverUrl };
      });
    }
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
      media: media,
      coverUrl: coverUrl,
      photoCount: photos.length
    };
  }).filter(function (item) {
    return item.status === 'publish' && item.title && item.dateValue <= today;
  }).sort(function (a, b) {
    return b.dateValue - a.dateValue;
  }).slice(0, 24);

  return data;
}

function galileaDirectDriveImageUrl_(value) {
  const url = gwSafeUrl_(value);
  if (!url) return '';
  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i,
    /drive\.google\.com\/(?:uc|thumbnail)\?[^#]*\bid=([a-zA-Z0-9_-]+)/i,
    /lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/i
  ];
  for (let index = 0; index < patterns.length; index++) {
    const match = url.match(patterns[index]);
    if (match) return 'https://lh3.googleusercontent.com/d/' + match[1] + '=w1600';
  }
  return url;
}

function galileaParseVercelRequest_(e) {
  const contents = e && e.postData && e.postData.contents ? e.postData.contents : '';
  if (!contents) throw new Error('Isi permintaan kosong.');
  if (contents.length > GALILEA_VERCEL_API.MAX_ARGUMENT_BYTES + 2000) throw new Error('Permintaan terlalu besar.');
  try {
    return JSON.parse(contents);
  } catch (_) {
    throw new Error('Format permintaan tidak valid.');
  }
}

function galileaVerifyVercelSecret_(providedSecret) {
  const expected = PropertiesService.getScriptProperties().getProperty(GALILEA_VERCEL_API.SECRET_PROPERTY) || '';
  if (expected.length < 32) {
    throw new Error('Secret Vercel belum dibuat. Jalankan generateGalileaVercelSecret() satu kali.');
  }
  if (String(providedSecret || '') !== expected) throw new Error('Akses API tidak sah.');
}

function galileaVercelJson_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Jalankan satu kali dari editor Apps Script.
 * Secret akan muncul di Execution log dan harus disalin ke Vercel.
 * Jika sudah pernah dibuat, fungsi ini mengembalikan secret yang sama.
 */
function generateGalileaVercelSecret() {
  const properties = PropertiesService.getScriptProperties();
  let secret = properties.getProperty(GALILEA_VERCEL_API.SECRET_PROPERTY) || '';
  if (secret.length < 32) {
    secret = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
    properties.setProperty(GALILEA_VERCEL_API.SECRET_PROPERTY, secret);
  }
  console.log('GALILEA_API_SECRET=' + secret);
  return secret;
}

function checkGalileaVercelBridge() {
  const secret = PropertiesService.getScriptProperties().getProperty(GALILEA_VERCEL_API.SECRET_PROPERTY) || '';
  const result = {
    ok: secret.length >= 32,
    version: GALILEA_VERCEL_API.VERSION,
    timezone: Session.getScriptTimeZone(),
    message: secret.length >= 32 ? 'Bridge siap dideploy.' : 'Jalankan generateGalileaVercelSecret() terlebih dahulu.'
  };
  console.log(JSON.stringify(result));
  return result;
}
