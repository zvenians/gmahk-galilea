/**
 * GALILEA VERCEL API BRIDGE · V16.0.0
 * Tambahkan file ini ke project Apps Script yang sama.
 * File ini tidak menggantikan Website.gs, Admin.gs, Code.gs, atau file HTML.
 */

const GALILEA_VERCEL_API = Object.freeze({
  VERSION: '16.0.0',
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
    getWebsiteData: function (args) { return galileaGetWebsiteDataForViewer_(); },
    searchWebsite: function (args) { return searchWebsite.apply(null, args); },
    submitServiceRequest: function (args) { return submitServiceRequest.apply(null, args); },
    translateViewerTexts: function (args) { return translateViewerTexts.apply(null, args); },

    // Admin Backend Handlers have been removed from Vercel Bridge to prevent privilege escalation bypass
  };
}

/**
 * Public viewer adapter.
 *
 * Website.gs historically excluded activities dated today because it used
 * `dateValue < today`. That is correct for the old "already happened" archive
 * semantics, but it makes a news item published on the current date disappear
 * from the public viewer even though Admin correctly shows it as PUBLISH.
 *
 * We deliberately keep Website.gs untouched. This adapter starts from its
 * normal public payload, then reconciles `activities` directly from the same
 * public sheet using the viewer rule: PUBLISH + dated today or earlier.
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
  const width = Math.max(8, Math.min(sheet.getLastColumn(), 8));
  const raw = sheet.getRange(2, 1, count, width).getValues();
  const display = sheet.getRange(2, 1, count, width).getDisplayValues();
  const today = new Date(Utilities.formatDate(new Date(), GW.TIMEZONE, 'yyyy-MM-dd') + 'T00:00:00' + GW.UTC_OFFSET).getTime();

  data.activities = raw.map(function (row, index) {
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
    return item.status === 'publish' && item.title && item.dateValue <= today;
  }).sort(function (a, b) {
    return b.dateValue - a.dateValue;
  }).slice(0, 24);

  return data;
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
