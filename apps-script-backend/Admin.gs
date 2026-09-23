/**
 * GALILEA PORTAL V16 — CINEMATIC CONTROL ROOM
 *
 * File ini berada pada project Apps Script yang sama dengan Website.gs.
 * Semua operasi tulis memeriksa akun Google dan peran pada sheet Website Admin.
 */

const GA = Object.freeze({
  VERSION: '20.3.0',
  SHEETS: Object.freeze({
    admins: 'Website Admin',
    workflow: 'Website Workflow',
    audit: 'Website Audit'
  }),
  ROLES: Object.freeze({ VIEWER: 10, EDITOR: 20, APPROVER: 30, SUPERADMIN: 40 }),
  STATES: Object.freeze(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']),
  SERVICE_STATUSES: Object.freeze(['BARU', 'DIPROSES', 'MENUNGGU', 'SELESAI', 'DITUTUP']),
  IMAGE_FOLDER_PROPERTY: 'GALILEA_ADMIN_IMAGE_FOLDER_ID'
});

function gaEntityDefinitions_() {
  return {
    announcements: {
      label: 'Agenda dan Pengumuman', icon: 'bell', sheet: GW.SHEETS.announcements,
      fields: [
        gaField_('date', 'Tanggal Informasi / Acara', 0, 'date', true, [], 'Tanggal yang akan dibaca jemaat pada Agenda dan Pengumuman.'),
        gaField_('title', 'Judul', 1, 'text', true),
        gaField_('summary', 'Isi Pengumuman', 2, 'textarea', true, [], 'Tulis singkat, jelas, dan siap dimasukkan ke Warta serta WhatsApp.'),
        gaField_('url', 'Tautan Selengkapnya', 3, 'url', false),
        gaField_('endDate', 'Berakhir Tampil', 5, 'date', false, [], 'Setelah tanggal ini pengumuman otomatis berhenti tampil.'),
        gaField_('priority', 'Prioritas', 6, 'select', true, ['NORMAL', 'IBADAH', 'PENTING']),
        gaField_('includeInBulletin', 'Masukkan ke Warta', 7, 'select', true, ['YA', 'TIDAK'], 'Pilih YA agar pengumuman ikut masuk PDF dan pesan Warta Jemaat.'),
        gaField_('category', 'Kategori Tampilan', 8, 'select', true, ['RABU MALAM', 'IBADAH KHOTBAH', 'SEKOLAH SABAT', 'PEMUDA ADVENT', 'UMUM'], 'Kategori memisahkan pengumuman dan menentukan kelompok Mode Layar.')
      ], statusColumn: 4, idColumn: 9
    },
    activities: {
      label: 'Berita Jemaat', icon: 'calendar', sheet: GW.SHEETS.activities,
      fields: [
        gaField_('date', 'Tanggal Kejadian', 0, 'date', true),
        gaField_('title', 'Judul Berita', 1, 'text', true),
        gaField_('location', 'Lokasi', 2, 'text', false),
        gaField_('description', 'Isi Berita', 3, 'textarea', true),
        gaField_('url', 'Tautan', 4, 'url', false),
        gaField_('photos', 'Foto Berita', 6, 'images', false)
      ], statusColumn: 5, idColumn: 7
    },
    themeSong: {
      label: 'Lagu Tema', icon: 'music', sheet: GW.SHEETS.themeSong,
      fields: [
        gaField_('title', 'Judul Lagu Tema', 0, 'text', true, [], 'Judul ini tampil paling atas pada halaman Lagu Sion.'),
        gaField_('verse1', 'Ayat 1', 1, 'textarea', true, [], 'Ketik lirik Ayat 1 di sini. Pisahkan setiap baris lirik dengan Enter.'),
        gaField_('verse2', 'Ayat 2', 2, 'textarea', false, [], 'Ketik lirik Ayat 2 di sini. Kosongkan bila lagu hanya memiliki satu ayat.'),
        gaField_('verse3', 'Ayat Tambahan', 3, 'textarea', false, [], 'Opsional untuk Ayat 3 atau ayat berikutnya.'),
        gaField_('refrain', 'Reff', 4, 'textarea', false, [], 'Ketik bagian Reff di sini. Reff akan diberi tanda khusus pada layar.'),
        gaField_('note', 'Catatan Internal', 5, 'textarea', false, [], 'Opsional, misalnya masa penggunaan lagu tema.')
      ], statusColumn: 6, idColumn: 7
    },
    gallery: {
      label: 'Galeri', icon: 'image', sheet: GW.SHEETS.gallery,
      fields: [
        gaField_('imageUrl', 'Foto', 0, 'image', true),
        gaField_('title', 'Judul', 1, 'text', true),
        gaField_('caption', 'Keterangan', 2, 'textarea', false)
      ], statusColumn: 3, idColumn: 4
    },
    leaders: {
      label: 'Pengurus Gereja', icon: 'users', sheet: GW.SHEETS.leaders,
      fields: [
        gaField_('order', 'Urutan', 0, 'number', true),
        gaField_('name', 'Nama', 1, 'text', true),
        gaField_('role', 'Jabatan', 2, 'text', true),
        gaField_('photoUrl', 'Foto', 3, 'image', false),
        gaField_('description', 'Deskripsi', 4, 'textarea', false)
      ], statusColumn: 5, idColumn: 6
    },
    banners: {
      label: 'Pengumuman Terjadwal', icon: 'flag', sheet: GW.SHEETS.banners,
      fields: [
        gaField_('startDate', 'Mulai Tampil', 0, 'date', true),
        gaField_('endDate', 'Berakhir', 1, 'date', false),
        gaField_('title', 'Judul', 2, 'text', true),
        gaField_('message', 'Pesan', 3, 'textarea', true),
        gaField_('url', 'Tautan', 4, 'url', false),
        gaField_('buttonLabel', 'Label Tombol', 5, 'text', false),
        gaField_('variant', 'Jenis', 6, 'select', true, ['INFO', 'PENTING', 'IBADAH'])
      ], statusColumn: 7, idColumn: 8
    },
    faq: {
      label: 'FAQ Jemaat', icon: 'help', sheet: GW.SHEETS.faq,
      fields: [
        gaField_('category', 'Kategori', 0, 'text', true),
        gaField_('question', 'Pertanyaan', 1, 'textarea', true),
        gaField_('answer', 'Jawaban', 2, 'textarea', true),
        gaField_('order', 'Urutan', 3, 'number', true)
      ], statusColumn: 4, idColumn: 5
    },
    mission: {
      label: 'Berita Misi Cadangan', icon: 'info', sheet: GW.SHEETS.mission,
      fields: [
        gaField_('year', 'Tahun', 0, 'number', true, [], 'Gunakan tahun bacaan, misalnya 2026.'),
        gaField_('quarter', 'Triwulan', 1, 'select', true, ['1', '2', '3', '4'], 'Pilih triwulan sesuai tanggal Sabat.'),
        gaField_('date', 'Tanggal Sabat', 2, 'date', true, [], 'Tanggal ini menentukan bacaan mana yang ditampilkan sebagai Sabat terbaru.'),
        gaField_('title', 'Judul Berita Misi', 3, 'text', true),
        gaField_('summary', 'Ringkasan', 4, 'textarea', true, [], 'Ringkasan singkat yang tampil pada kartu Berita Misi.'),
        gaField_('url', 'Link Bacaan Cadangan', 5, 'url', true, [], 'Dipakai otomatis bila sumber Berita Misi utama sedang tidak dapat dihubungi.'),
        gaField_('imageUrl', 'Gambar Opsional', 6, 'image', false)
      ], statusColumn: 7, idColumn: 8
    },
    adventTheme: {
      label: 'Tema Advent', icon: 'spark', sheet: GW.SHEETS.adventTheme,
      fields: [
        gaField_('year', 'Tahun', 0, 'number', true),
        gaField_('theme', 'Tema', 1, 'text', true),
        gaField_('verse', 'Ayat Tema', 2, 'text', false),
        gaField_('song', 'Lagu Tema', 3, 'text', false),
        gaField_('imageUrl', 'Foto Tema', 4, 'image', false),
        gaField_('sourceUrl', 'Sumber', 5, 'url', false)
      ], statusColumn: 6, idColumn: 7
    },
    worshipPlans: {
      label: 'Susunan Ibadah', icon: 'calendar', sheet: GW.SHEETS.worshipPlans,
      fields: [
        gaField_('date', 'Tanggal Ibadah', 0, 'date', true),
        gaField_('serviceType', 'Jenis Ibadah', 1, 'select', true, ['IBADAH SABAT', 'RABU MALAM', 'PERMINTAAN DOA', 'PEMUDA ADVENT', 'LAINNYA']),
        gaField_('time', 'Waktu WITA', 2, 'time', true),
        gaField_('theme', 'Tema Ibadah', 3, 'text', true),
        gaField_('scripture', 'Ayat Utama', 4, 'text', false),
        gaField_('songs', 'Lagu Sion', 5, 'textarea', false),
        gaField_('agenda', 'Susunan Acara', 6, 'textarea', true),
        gaField_('note', 'Catatan untuk Jemaat', 7, 'textarea', false),
        gaField_('livestreamUrl', 'Tautan Siaran', 8, 'url', false)
      ], statusColumn: 9, idColumn: 10
    }
  };
}

function gaField_(key, label, column, type, required, options, help) {
  return { key: key, label: label, column: column, type: type, required: Boolean(required), options: options || [], help: help || '' };
}

/** Jalankan dari editor bila setup utama pernah dijalankan sebelum V11. */
function setupAdminGalilea() {
  const spreadsheet = gwSpreadsheet_();
  if (typeof gwEnsureV200ContentSchemas_ === 'function') gwEnsureV200ContentSchemas_(spreadsheet);
  if (typeof gwUpgradeActivityPhotos_ === 'function') gwUpgradeActivityPhotos_(spreadsheet);
  gaEnsureAdminInfrastructure_(spreadsheet, true);
  const email = gaNormalizeEmail_(Session.getEffectiveUser().getEmail());
  return 'Portal Sekretariat siap. Superadmin awal: ' + (email || 'periksa sheet Website Admin');
}

function gaEnsureAdminInfrastructure_(spreadsheet, createOwner, deferServiceStore) {
  const adminSheet = gaEnsureSheet_(spreadsheet, GA.SHEETS.admins,
    ['ID', 'Email', 'Nama', 'Peran', 'Status', 'Dibuat', 'Diperbarui']);
  gaEnsureSheet_(spreadsheet, GA.SHEETS.workflow,
    ['ID', 'Entitas', 'ID Entitas', 'Aksi', 'Payload JSON', 'Status', 'Email Pemilik', 'Nama Pemilik', 'Dibuat', 'Diperbarui', 'Email Reviewer', 'Waktu Review', 'Catatan']);
  gaEnsureSheet_(spreadsheet, GA.SHEETS.audit,
    ['ID', 'Waktu', 'Email', 'Nama', 'Aksi', 'Entitas', 'ID Entitas', 'Detail']);

  gaEnsureEntityIds_(spreadsheet);
  if (!deferServiceStore) gaEnsureServiceColumns_();

  if (createOwner && adminSheet.getLastRow() < 2) {
    const email = gaNormalizeEmail_(Session.getEffectiveUser().getEmail() || Session.getActiveUser().getEmail());
    if (!email) throw new Error('Email akun Google tidak terbaca. Jalankan setupAdminGalilea() langsung dari editor Apps Script.');
    const now = new Date();
    const name = gaDefaultAdminName_(email);
    adminSheet.appendRow([gaId_('ADM'), email, name, 'SUPERADMIN', 'AKTIF', now, now]);
    gaAuditRaw_(spreadsheet, email, name, 'CREATE_INITIAL_ADMIN', 'admins', email, 'Superadmin pertama dibuat oleh setup.');
  }
  return true;
}

function gaEnsureSheet_(spreadsheet, name, headers) {
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  if (sheet.getLastRow() < 1) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  else if (sheet.getLastColumn() < headers.length) {
    const oldColumns = sheet.getLastColumn();
    if (sheet.getMaxColumns() < headers.length) sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
    sheet.getRange(1, oldColumns + 1, 1, headers.length - oldColumns).setValues([headers.slice(oldColumns)]);
  }
  gwFormatAdminSheet_(sheet, headers.map(function (_, index) { return index === 4 || index === 7 || index === 12 ? 360 : 155; }));
  return sheet;
}

function gaEnsureEntityIds_(spreadsheet, onlyKey) {
  const definitions = gaEntityDefinitions_();
  Object.keys(definitions).forEach(function (key) {
    if (onlyKey && key !== onlyKey) return;
    const definition = definitions[key];
    const sheet = spreadsheet.getSheetByName(definition.sheet);
    if (!sheet) return;
    const idColumn = definition.idColumn + 1;
    if (sheet.getMaxColumns() < idColumn) sheet.insertColumnsAfter(sheet.getMaxColumns(), idColumn - sheet.getMaxColumns());
    sheet.getRange(1, idColumn).setValue('Admin ID');
    if (sheet.getLastRow() < 2) return;
    const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, idColumn).getDisplayValues();
    let changed = false;
    const output = rows.map(function (row) {
      const current = gwClean_(row[idColumn - 1]);
      const hasContent = row.slice(0, idColumn - 1).some(function (cell) { return Boolean(gwClean_(cell)); });
      const next = hasContent ? (current || gaId_(key.slice(0, 3).toUpperCase())) : '';
      if (next !== current) changed = true;
      return [next];
    });
    if (changed) sheet.getRange(2, idColumn, output.length, 1).setValues(output);
  });
}

function gaEnsureServiceColumns_() {
  const sheet = gwServiceSheet_();
  if (sheet.getMaxColumns() < 12) sheet.insertColumnsAfter(sheet.getMaxColumns(), 12 - sheet.getMaxColumns());
  const expected = ['Catatan Admin', 'Diperbarui', 'Privasi'];
  const current = sheet.getRange(1, 10, 1, 3).getDisplayValues()[0];
  if (expected.some(function (value, index) { return current[index] !== value; })) {
    sheet.getRange(1, 10, 1, 3).setValues([expected]);
  }
}

/* -------------------------------------------------------------------------- */
/* Autentikasi dan peran                                                      */
/* -------------------------------------------------------------------------- */

function gaCurrentUser_() {
  const activeEmail = Session.getActiveUser().getEmail();
  if (!activeEmail) {
    throw new Error('LOGIN_REQUIRED|Akun Google belum terbaca. Akses anonim ditolak.');
  }
  const email = gaNormalizeEmail_(activeEmail);
  const spreadsheet = gwSpreadsheet_();
  let sheet = spreadsheet.getSheetByName(GA.SHEETS.admins);
  if (!sheet || sheet.getLastRow() < 2) {
    try {
      gaEnsureAdminInfrastructure_(spreadsheet, true);
      sheet = spreadsheet.getSheetByName(GA.SHEETS.admins);
    } catch (ignore) {}
  }
  if (!sheet || sheet.getLastRow() < 2) {
    throw new Error('ADMIN_NOT_READY|Jalankan setupAdminGalilea() dari editor Apps Script.');
  }
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).getDisplayValues();
  let found = rows.filter(function (row) { return gaNormalizeEmail_(row[1]) === email; })[0];
  if (!found) {
    const ownerEmail = gaNormalizeEmail_(Session.getEffectiveUser().getEmail());
    if (email && email === ownerEmail) {
      const now = new Date();
      const name = gaDefaultAdminName_(email);
      const id = gaId_('ADM');
      sheet.appendRow([id, email, name, 'SUPERADMIN', 'AKTIF', now, now]);
      return { id: id, email: email, name: name, role: 'SUPERADMIN', level: GA.ROLES.SUPERADMIN };
    }
    throw new Error('ACCESS_DENIED|Akun ' + email + ' belum terdaftar sebagai pengelola website.');
  }
  if (String(found[4]).toUpperCase() !== 'AKTIF') {
    throw new Error('ACCESS_DENIED|Akun ' + email + ' berstatus ' + (found[4] || 'NONAKTIF') + '. Hubungi Superadmin.');
  }
  const role = String(found[3] || 'VIEWER').toUpperCase();
  if (!GA.ROLES[role]) throw new Error('ACCESS_DENIED|Peran akun tidak dikenali.');
  return { id: found[0], email: email, name: gwClean_(found[2]) || email, role: role, level: GA.ROLES[role] };
}

function gaRequireRole_(minimumRole) {
  const user = gaCurrentUser_();
  if (user.level < GA.ROLES[minimumRole]) throw new Error('FORBIDDEN|Anda tidak memiliki izin untuk melakukan tindakan ini.');
  return user;
}

function gaNormalizeEmail_(value) { return gwClean_(value).toLowerCase(); }

function gaDefaultAdminName_(email) {
  return String(email || 'Administrator').split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, function (letter) { return letter.toUpperCase(); });
}

function gaPublicUser_(user) {
  return {
    name: user.name, email: user.email, role: user.role,
    permissions: {
      view: true,
      edit: user.level >= GA.ROLES.EDITOR,
      approve: user.level >= GA.ROLES.APPROVER,
      manageAdmins: user.level >= GA.ROLES.SUPERADMIN,
      backup: user.level >= GA.ROLES.SUPERADMIN
    }
  };
}

/* -------------------------------------------------------------------------- */
/* Data awal dashboard                                                        */
/* -------------------------------------------------------------------------- */

function adminGetBootstrap() {
  const user = gaRequireRole_('VIEWER');
  const spreadsheet = gwSpreadsheet_();
  const definitions = gaEntityDefinitions_();
  const entities = Object.keys(definitions).map(function (key) {
    return { key: key, label: definitions[key].label, icon: definitions[key].icon };
  });
  entities.push({ key: 'settings', label: 'Identitas & Tampilan', icon: 'settings' });
  entities.push({ key: 'schedule', label: 'Jadwal Pelayanan', icon: 'calendar' });

  /*
   * Bootstrap sengaja hanya berisi data yang dibutuhkan untuk menggambar shell.
   * Migrasi, pemeriksaan sumber, dan pembacaan sheet berukuran besar tidak boleh
   * berjalan saat login. Ringkasan lengkap dimuat terpisah melalui
   * adminGetDashboardSummary(), sehingga portal tetap dapat dibuka meski salah
   * satu sumber statistik sedang lambat.
   */
  return {
    version: GA.VERSION,
    user: gaPublicUser_(user),
    entities: entities,
    dashboard: {
      pendingApprovals: 0,
      myDrafts: 0,
      activeAnnouncements: 0,
      upcomingActivities: 0,
      serviceRequests: 0,
      updatedAt: gwFormatDateTime_(new Date()),
      scheduleSheet: 'Sedang diperiksa…',
      systemStatus: 'BELUM DIPERIKSA',
      loading: true
    },
    publicSite: {
      churchName: GW.TITLE,
      logoUrl: GW.SOURCES.adventLogo,
      publicUrl: 'https://gmahk-galilea.vercel.app/',
      spreadsheetUrl: spreadsheet.getUrl()
    }
  };
}

/**
 * Statistik dashboard dimuat setelah shell admin sudah tampil. Fungsi ini hanya
 * membaca data; setup dan migrasi tetap dijalankan secara eksplisit dari menu
 * Sistem atau setupAdminGalilea().
 */
function adminGetDashboardSummary() {
  const user = gaRequireRole_('VIEWER');
  const spreadsheet = gwSpreadsheet_();
  const workflowSheet = spreadsheet.getSheetByName(GA.SHEETS.workflow);
  let pendingApprovals = 0;
  let myDrafts = 0;
  if (workflowSheet && workflowSheet.getLastRow() > 1) {
    workflowSheet.getRange(2, 6, workflowSheet.getLastRow() - 1, 2).getDisplayValues().forEach(function (row) {
      const workflowState = String(row[0] || '').toUpperCase();
      const ownerEmail = gaNormalizeEmail_(row[1]);
      if (workflowState === 'PENDING') pendingApprovals++;
      if (workflowState === 'DRAFT' && ownerEmail === user.email) myDrafts++;
    });
  }

  const publishedCount = function (sheet, statusColumn) {
    if (!sheet || sheet.getLastRow() < 2) return 0;
    return sheet.getRange(2, statusColumn, sheet.getLastRow() - 1, 1).getDisplayValues()
      .filter(function (row) { return String(row[0] || '').toUpperCase() === 'PUBLISH'; }).length;
  };

  let serviceRequests = 0;
  if (user.level >= GA.ROLES.EDITOR) {
    try {
      const serviceSheet = gwServiceSheet_();
      serviceRequests = serviceSheet.getLastRow() > 1
        ? serviceSheet.getRange(2, 9, serviceSheet.getLastRow() - 1, 1).getDisplayValues()
          .filter(function (row) { return ['SELESAI', 'DITUTUP'].indexOf(String(row[0] || '').toUpperCase()) < 0; }).length
        : 0;
    } catch (ignore) {
      serviceRequests = null;
    }
  }

  const settings = gwReadSettings_(spreadsheet);
  const scheduleSheet = gwChooseScheduleSheet_(spreadsheet);
  const health = gaHealthSources_(spreadsheet);
  return {
    dashboard: {
      pendingApprovals: pendingApprovals,
      myDrafts: myDrafts,
      activeAnnouncements: publishedCount(spreadsheet.getSheetByName(GW.SHEETS.announcements), 5),
      upcomingActivities: publishedCount(spreadsheet.getSheetByName(GW.SHEETS.activities), 6),
      serviceRequests: serviceRequests,
      updatedAt: gwFormatDateTime_(new Date()),
      scheduleSheet: scheduleSheet ? scheduleSheet.getName() : 'Belum ditemukan',
      systemStatus: health.some(function (item) {
        return ['GANGGUAN', 'ERROR', 'LEWATI'].indexOf(String(item.status || '').toUpperCase()) >= 0;
      }) ? 'PERLU DIPERIKSA' : (health.length ? 'BAIK' : 'BELUM DIPERIKSA'),
      loading: false
    },
    publicSite: {
      churchName: settings.church_name || GW.TITLE,
      logoUrl: gwSafeUrl_(settings.logo_url) || GW.SOURCES.adventLogo,
      publicUrl: gwSafeUrl_(settings.google_site_url) || 'https://gmahk-galilea.vercel.app/',
      spreadsheetUrl: spreadsheet.getUrl()
    }
  };
}

function adminGetDashboardActivity() {
  const user = gaRequireRole_('APPROVER');
  const spreadsheet = gwSpreadsheet_();
  const auditSheet = spreadsheet.getSheetByName(GA.SHEETS.audit);
  const audit = [];
  if (auditSheet && auditSheet.getLastRow() > 1) {
    const start = Math.max(2, auditSheet.getLastRow() - 29);
    const rows = auditSheet.getRange(start, 1, auditSheet.getLastRow() - start + 1, 8).getDisplayValues();
    rows.reverse().forEach(function (row) {
      audit.push({ id: row[0], time: row[1], email: row[2], name: row[3], action: row[4], entity: row[5], entityId: row[6], detail: row[7] });
    });
  }
  /* Membaca hasil pemeriksaan terakhir agar dashboard cepat dan tidak memanggil
     seluruh API setiap kali halaman aktivitas dibuka. Pemeriksaan baru tetap
     tersedia pada menu Sistem & Backup. */
  const health = gaHealthSources_(spreadsheet);
  return { user: gaPublicUser_(user), audit: audit, health: health };
}

/**
 * gwReadPublicHealth_() mengembalikan objek ringkasan {checkedAt, overall,
 * sources}. Portal admin hanya membutuhkan daftar sources. Normalisasi ini
 * juga menjaga kompatibilitas jika project lama masih menyimpan bentuk array.
 */
function gaHealthSources_(spreadsheet) {
  let payload;
  try { payload = gwReadPublicHealth_(spreadsheet); }
  catch (ignore) { return []; }
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.sources)) {
    return payload.sources.map(function (item) {
      return {
        source: gwClean_(item.source || item.name || 'Sumber'),
        status: gwClean_(item.status || 'BELUM DIPERIKSA'),
        note: gwClean_(item.note || '')
      };
    });
  }
  return [];
}

/* -------------------------------------------------------------------------- */
/* Daftar dan editor entitas                                                   */
/* -------------------------------------------------------------------------- */

function adminListEntity(entityKey) {
  const user = gaRequireRole_('VIEWER');
  const key = gwClean_(entityKey);
  const spreadsheet = gwSpreadsheet_();
  if (key === 'settings') return gaListSettings_(spreadsheet, user);
  if (key === 'schedule') return gaListSchedule_(spreadsheet, user);
  const definition = gaEntityDefinitions_()[key];
  if (!definition) throw new Error('Entitas admin tidak dikenali.');
  gaEnsureEntityIds_(spreadsheet, key);
  const sheet = spreadsheet.getSheetByName(definition.sheet);
  const records = [];
  if (sheet && sheet.getLastRow() > 1) {
    const width = definition.idColumn + 1;
    const raw = sheet.getRange(2, 1, sheet.getLastRow() - 1, width).getValues();
    const display = sheet.getRange(2, 1, sheet.getLastRow() - 1, width).getDisplayValues();
    display.forEach(function (row, index) {
      const id = gwClean_(row[definition.idColumn]);
      if (!id) return;
      const values = {};
      definition.fields.forEach(function (field) {
        values[field.key] = field.type === 'date' ? gaDateInput_(raw[index][field.column], row[field.column]) : row[field.column];
      });
      records.push({ id: id, status: gwClean_(row[definition.statusColumn] || 'DRAFT').toUpperCase(), values: values, title: gaRecordTitle_(definition, values) });
    });
  }
  return {
    entity: key, label: definition.label, fields: definition.fields,
    records: records,
    workflows: gaWorkflowRows_(spreadsheet).filter(function (item) {
      return item.entity === key && ['DRAFT', 'PENDING', 'REJECTED'].indexOf(item.state) >= 0 && (user.level >= GA.ROLES.APPROVER || item.ownerEmail === user.email);
    })
  };
}

function gaListSettings_(spreadsheet, user) {
  gwEnsureSettingsSheet_(spreadsheet);
  const settings = gwReadSettings_(spreadsheet);
  const excluded = /api[_-]?key|youtube_channel_id|analytics_id/i;
  const definitions = gwSettingDefinitions_().filter(function (row) { return !excluded.test(row[1]); });
  const records = definitions.map(function (row) {
    return { id: row[1], status: 'PUBLISH', group: row[0], title: row[3] || row[1], values: { value: settings[row[1]] || '', help: 'Kunci: ' + row[1] } };
  });
  return {
    entity: 'settings', label: 'Identitas & Tampilan',
    fields: [gaField_('value', 'Isi Website', 0, 'textarea', false)],
    records: records,
    workflows: gaWorkflowRows_(spreadsheet).filter(function (item) {
      return item.entity === 'settings' && ['DRAFT', 'PENDING', 'REJECTED'].indexOf(item.state) >= 0 && (user.level >= GA.ROLES.APPROVER || item.ownerEmail === user.email);
    })
  };
}

function gaListSchedule_(spreadsheet, user) {
  const sheet = gwChooseScheduleSheet_(spreadsheet);
  if (!sheet) throw new Error('Sheet jadwal aktif tidak ditemukan.');
  const locator = gaScheduleLocator_(sheet);
  return {
    entity: 'schedule', label: 'Jadwal Pelayanan', sheetName: sheet.getName(),
    sections: locator.sections,
    records: locator.records,
    workflows: gaWorkflowRows_(spreadsheet).filter(function (item) {
      return item.entity === 'schedule' && ['DRAFT', 'PENDING', 'REJECTED'].indexOf(item.state) >= 0 && (user.level >= GA.ROLES.APPROVER || item.ownerEmail === user.email);
    })
  };
}

function adminSaveWorkflow(request) {
  const user = gaRequireRole_('EDITOR');
  const payload = request && typeof request === 'object' ? request : {};
  const entity = gwClean_(payload.entity);
  if (entity !== 'settings' && entity !== 'schedule' && !gaEntityDefinitions_()[entity]) throw new Error('Entitas tidak dikenali.');
  const action = String(payload.action || 'UPSERT').toUpperCase();
  if (['UPSERT', 'DELETE'].indexOf(action) < 0) throw new Error('Aksi workflow tidak dikenali.');

  const cleanPayload = action === 'DELETE' ? {} : gaSanitizePayload_(entity, payload.payload || {});
  const spreadsheet = gwSpreadsheet_();
  const sheet = spreadsheet.getSheetByName(GA.SHEETS.workflow);
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    let rowNumber = 0;
    let workflowId = gwClean_(payload.workflowId);
    if (workflowId) rowNumber = gaFindRowByValue_(sheet, 1, workflowId);
    if (rowNumber) {
      const existing = sheet.getRange(rowNumber, 1, 1, 13).getDisplayValues()[0];
      if (existing[5] !== 'DRAFT' && existing[5] !== 'REJECTED') throw new Error('Workflow ini tidak dapat diubah lagi.');
      if (gaNormalizeEmail_(existing[6]) !== user.email && user.level < GA.ROLES.SUPERADMIN) throw new Error('Draft ini dimiliki admin lain.');
      if (existing[1] !== entity || existing[2] !== gwClean_(payload.entityId) || existing[3] !== action) {
        throw new Error('Identitas draft berubah. Muat ulang portal sebelum menyimpan kembali.');
      }
    } else {
      workflowId = gaId_('REQ');
      rowNumber = sheet.getLastRow() + 1;
    }
    const now = new Date();
    const state = payload.submit ? 'PENDING' : 'DRAFT';
    const created = rowNumber <= sheet.getLastRow() ? sheet.getRange(rowNumber, 9).getValue() || now : now;
    sheet.getRange(rowNumber, 1, 1, 13).setValues([[
      workflowId, entity, gwClean_(payload.entityId) || ('NEW-' + gaId_('ITEM')), action,
      JSON.stringify(cleanPayload), state, user.email, user.name, created, now, '', '', gwClean_(payload.note)
    ]]);
    gaAudit_(user, payload.submit ? 'SUBMIT_FOR_APPROVAL' : 'SAVE_DRAFT', entity, workflowId, gaPayloadSummary_(cleanPayload));
    return { ok: true, id: workflowId, state: state, message: payload.submit ? 'Konten sudah diajukan untuk persetujuan.' : 'Draft sudah disimpan.' };
  } finally { lock.releaseLock(); }
}

/** Menarik kembali pengajuan yang belum ditinjau agar dapat diperbaiki. */
function adminCancelWorkflow(workflowId) {
  const user = gaRequireRole_('EDITOR');
  const spreadsheet = gwSpreadsheet_();
  const sheet = spreadsheet.getSheetByName(GA.SHEETS.workflow);
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const row = gaFindRowByValue_(sheet, 1, workflowId);
    if (!row) throw new Error('Pengajuan tidak ditemukan.');
    const values = sheet.getRange(row, 1, 1, 13).getDisplayValues()[0];
    if (values[5] !== 'PENDING') throw new Error('Hanya pengajuan yang masih menunggu review yang dapat ditarik.');
    if (gaNormalizeEmail_(values[6]) !== user.email && user.level < GA.ROLES.SUPERADMIN) {
      throw new Error('Pengajuan ini dimiliki admin lain.');
    }
    sheet.getRange(row, 6).setValue('DRAFT');
    sheet.getRange(row, 10, 1, 4).setValues([[new Date(), '', '', 'Ditarik kembali untuk diperbaiki.']]);
    gaAudit_(user, 'CANCEL_SUBMISSION', values[1], workflowId, 'Pengajuan ditarik kembali menjadi draft.');
    return { ok: true, state: 'DRAFT', message: 'Pengajuan ditarik kembali dan dapat diedit sebagai draft.' };
  } finally { lock.releaseLock(); }
}

function adminDeleteWorkflow(workflowId) {
  const user = gaRequireRole_('EDITOR');
  const sheet = gwSpreadsheet_().getSheetByName(GA.SHEETS.workflow);
  const row = gaFindRowByValue_(sheet, 1, workflowId);
  if (!row) throw new Error('Draft tidak ditemukan.');
  const values = sheet.getRange(row, 1, 1, 13).getDisplayValues()[0];
  if (['DRAFT', 'REJECTED'].indexOf(values[5]) < 0) throw new Error('Hanya draft atau revisi yang dapat dihapus.');
  if (gaNormalizeEmail_(values[6]) !== user.email && user.level < GA.ROLES.SUPERADMIN) throw new Error('Draft ini dimiliki admin lain.');
  sheet.deleteRow(row);
  gaAudit_(user, 'DELETE_DRAFT', values[1], workflowId, 'Draft dihapus.');
  return { ok: true };
}

function adminListApprovals(stateFilter) {
  gaRequireRole_('APPROVER');
  const state = String(stateFilter || 'PENDING').toUpperCase();
  if (GA.STATES.indexOf(state) < 0) throw new Error('Filter status persetujuan tidak dikenali.');
  return gaWorkflowRows_(gwSpreadsheet_()).filter(function (item) { return !state || item.state === state; });
}

/**
 * Menghapus catatan persetujuan tanpa membatalkan konten yang sudah diterbitkan.
 * Jejak tindakan tetap disimpan di Website Audit agar pengelolaan dapat ditelusuri.
 */
function adminDeleteApproval(workflowId) {
  const user = gaRequireRole_('APPROVER');
  const spreadsheet = gwSpreadsheet_();
  const sheet = spreadsheet.getSheetByName(GA.SHEETS.workflow);
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(7000)) throw new Error('Portal sedang menyimpan perubahan lain. Tunggu beberapa detik lalu coba kembali.');
  try {
    const row = gaFindRowByValue_(sheet, 1, workflowId);
    if (!row) throw new Error('Catatan persetujuan tidak ditemukan.');
    const values = sheet.getRange(row, 1, 1, 13).getDisplayValues()[0];
    const workflowState = String(values[5] || '').toUpperCase();
    if (['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].indexOf(workflowState) < 0) {
      throw new Error('Item ini bukan catatan persetujuan yang dapat dihapus.');
    }
    sheet.deleteRow(row);
    gaAudit_(user, 'DELETE_APPROVAL_RECORD', values[1], workflowId, workflowState + ' · catatan persetujuan dihapus; konten publik tidak dibatalkan');
    return {
      ok: true,
      id: workflowId,
      state: workflowState,
      message: workflowState === 'APPROVED'
        ? 'Riwayat persetujuan dihapus. Konten yang sudah terbit tetap tampil.'
        : 'Pengajuan berhasil dihapus dari daftar persetujuan.'
    };
  } finally { lock.releaseLock(); }
}

function adminReviewWorkflow(workflowId, decision, note) {
  const user = gaRequireRole_('APPROVER');
  const selectedDecision = String(decision || '').toUpperCase();
  if (['APPROVE', 'REJECT'].indexOf(selectedDecision) < 0) throw new Error('Keputusan tidak dikenali.');
  const reviewerNote = gwClean_(note);
  if (selectedDecision === 'REJECT' && reviewerNote.length < 4) {
    throw new Error('Alasan revisi wajib diisi minimal 4 karakter agar editor mengetahui yang harus diperbaiki.');
  }
  const spreadsheet = gwSpreadsheet_();
  const sheet = spreadsheet.getSheetByName(GA.SHEETS.workflow);
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(7000)) throw new Error('Portal sedang menyimpan perubahan lain. Tunggu beberapa detik lalu coba kembali.');
  try {
    const row = gaFindRowByValue_(sheet, 1, workflowId);
    if (!row) throw new Error('Permintaan persetujuan tidak ditemukan.');
    const raw = sheet.getRange(row, 1, 1, 13).getValues()[0];
    const display = sheet.getRange(row, 1, 1, 13).getDisplayValues()[0];
    if (display[5] !== 'PENDING') throw new Error('Permintaan ini sudah diproses atau belum diajukan.');
    let applied = null;
    if (selectedDecision === 'APPROVE') {
      const payload = JSON.parse(String(raw[4] || '{}'));
      applied = gaApplyWorkflow_(spreadsheet, display[1], display[2], display[3], payload);
    }
    const nextState = selectedDecision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    sheet.getRange(row, 6).setValue(nextState);
    sheet.getRange(row, 11, 1, 3).setValues([[user.email, new Date(), reviewerNote]]);
    gwRefreshWebsiteGalilea_();
    gaAuditRaw_(spreadsheet, user.email, user.name, selectedDecision, display[1], display[2], reviewerNote || gaPayloadSummary_(JSON.parse(String(raw[4] || '{}'))));
    return { ok: true, state: nextState, applied: applied, message: nextState === 'APPROVED' ? 'Perubahan disetujui dan sudah diterbitkan.' : 'Perubahan dikembalikan untuk direvisi.' };
  } finally { lock.releaseLock(); }
}

function gaWorkflowRows_(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(GA.SHEETS.workflow);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const raw = sheet.getRange(2, 1, sheet.getLastRow() - 1, 13).getValues();
  const display = sheet.getRange(2, 1, sheet.getLastRow() - 1, 13).getDisplayValues();
  return display.map(function (row, index) {
    let payload = {};
    try { payload = JSON.parse(String(raw[index][4] || '{}')); } catch (ignore) {}
    return {
      id: row[0], entity: row[1], entityId: row[2], action: row[3], payload: payload,
      state: row[5], ownerEmail: gaNormalizeEmail_(row[6]), ownerName: row[7],
      createdAt: row[8], updatedAt: row[9], reviewerEmail: row[10], reviewedAt: row[11], note: row[12]
    };
  }).sort(function (a, b) { return String(b.updatedAt).localeCompare(String(a.updatedAt)); });
}

/* -------------------------------------------------------------------------- */
/* Penerapan workflow                                                         */
/* -------------------------------------------------------------------------- */

function gaApplyWorkflow_(spreadsheet, entity, entityId, action, payload) {
  if (entity === 'settings') return gaApplySetting_(spreadsheet, entityId, action, payload);
  if (entity === 'schedule') return gaApplySchedule_(spreadsheet, entityId, action, payload);
  const definition = gaEntityDefinitions_()[entity];
  if (!definition) throw new Error('Entitas workflow tidak dikenali.');
  const sheet = spreadsheet.getSheetByName(definition.sheet);
  if (!sheet) throw new Error('Sheet “' + definition.sheet + '” tidak ditemukan.');
  const idColumn = definition.idColumn + 1;
  let row = gaFindRowByValue_(sheet, idColumn, entityId);
  if (action === 'DELETE') {
    if (!row) throw new Error('Konten yang akan dihapus tidak ditemukan.');
    sheet.deleteRow(row);
    return { deleted: true, id: entityId };
  }
  const newId = /^NEW-/i.test(entityId) || !entityId ? gaId_(entity.slice(0, 3).toUpperCase()) : entityId;
  if (!row) row = sheet.getLastRow() + 1;
  const width = definition.idColumn + 1;
  const existing = row <= sheet.getLastRow() ? sheet.getRange(row, 1, 1, width).getValues()[0] : new Array(width).fill('');
  definition.fields.forEach(function (field) { existing[field.column] = gaSheetValue_(field, payload[field.key]); });
  existing[definition.statusColumn] = 'PUBLISH';
  existing[definition.idColumn] = newId;
  sheet.getRange(row, 1, 1, width).setValues([existing]);
  return { id: newId, row: row };
}

function gaApplySetting_(spreadsheet, key, action, payload) {
  if (action === 'DELETE') throw new Error('Pengaturan inti tidak dapat dihapus.');
  gwEnsureSettingsSheet_(spreadsheet);
  const sheet = spreadsheet.getSheetByName(GW.SHEETS.settings);
  let row = gaFindRowByValue_(sheet, 2, key);
  if (!row) {
    const definition = gwSettingDefinitions_().filter(function (item) { return item[1] === key; })[0];
    if (!definition) throw new Error('Kunci pengaturan tidak ditemukan.');
    row = sheet.getLastRow() + 1;
    sheet.getRange(row, 1, 1, 4).setValues([[definition[0], definition[1], '', definition[3]]]);
  }
  sheet.getRange(row, 3).setValue(String(payload.value == null ? '' : payload.value));
  return { id: key, row: row };
}

function gaApplySchedule_(spreadsheet, entityId, action, payload) {
  const sheet = gwChooseScheduleSheet_(spreadsheet);
  if (!sheet) throw new Error('Sheet jadwal aktif tidak ditemukan.');
  const locator = gaScheduleLocator_(sheet);
  if (action === 'DELETE') {
    const target = locator.records.filter(function (item) { return item.id === String(entityId); })[0];
    if (!target) throw new Error('Jadwal yang akan dihapus tidak ditemukan.');
    sheet.deleteRow(target.sheetRow);
    return { deleted: true, id: entityId, row: target.sheetRow, sheet: sheet.getName() };
  }
  const section = GW.SCHEDULES.filter(function (item) { return item.id === payload.sectionId; })[0];
  if (!section) throw new Error('Jenis ibadah tidak dikenali.');
  const targetIso = gwClean_(payload.isoDate);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetIso)) throw new Error('Tanggal jadwal tidak valid.');
  let record = locator.records.filter(function (item) { return item.id === String(entityId); })[0];
  if (record && record.sectionId !== section.id) throw new Error('Jenis ibadah pada jadwal yang sudah ada tidak dapat diubah. Buat jadwal baru pada jenis ibadah tujuan.');
  const duplicate = locator.records.filter(function (item) {
    return item.sectionId === section.id && item.isoDate === targetIso && (!record || item.sheetRow !== record.sheetRow);
  })[0];
  if (duplicate) throw new Error('Tanggal tersebut sudah ada pada jenis ibadah yang dipilih.');
  const sectionMeta = locator.sections.filter(function (item) { return item.id === section.id; })[0];
  if (!sectionMeta) throw new Error('Bagian jadwal tidak ditemukan pada spreadsheet.');
  let row;
  if (record) row = record.sheetRow;
  else {
    row = sectionMeta.lastRecordRow ? sectionMeta.lastRecordRow + 1 : sectionMeta.headerRow + 1;
    if (row > sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(), row - sheet.getMaxRows());
    else sheet.insertRowBefore(row);
    if (row > 2) sheet.getRange(row - 1, 1, 1, Math.min(12, sheet.getMaxColumns())).copyTo(sheet.getRange(row, 1, 1, Math.min(12, sheet.getMaxColumns())), SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
  }
  const date = new Date(targetIso + 'T00:00:00' + GW.UTC_OFFSET);
  sheet.getRange(row, 1).setValue(date).setNumberFormat('dd mmmm yyyy');
  const fieldMap = payload.fields && typeof payload.fields === 'object' ? payload.fields : {};
  section.columns.forEach(function (column) {
    sheet.getRange(row, column[1] + 1).setValue(gwClean_(fieldMap[column[0]]));
  });
  return { id: section.id + '|' + targetIso, row: row, sheet: sheet.getName() };
}

function gaScheduleLocator_(sheet) {
  const rowCount = Math.max(1, sheet.getLastRow());
  if (sheet.getMaxColumns() < 12) sheet.insertColumnsAfter(sheet.getMaxColumns(), 12 - sheet.getMaxColumns());
  const columnCount = Math.min(sheet.getMaxColumns(), Math.max(12, Math.min(20, sheet.getLastColumn())));
  const range = sheet.getRange(1, 1, rowCount, columnCount);
  const raw = range.getValues();
  const display = range.getDisplayValues();
  const sections = [];
  const records = [];
  GW.SCHEDULES.forEach(function (definition) {
    let header = -1;
    for (let r = 0; r < display.length; r++) {
      if (!display[r].some(function (cell) { return gwNormalize_(cell) === gwNormalize_(definition.anchor); })) continue;
      for (let n = r + 1; n < Math.min(r + 8, display.length); n++) {
        if (gwNormalize_(display[n][0]) === 'tanggal') { header = n; break; }
      }
      if (header >= 0) break;
    }
    if (header < 0) return;
    let lastRecordRow = 0;
    for (let r = header + 1; r < raw.length; r++) {
      const date = gwParseDate_(raw[r][0], display[r][0]);
      if (!date) { if (lastRecordRow) break; else continue; }
      const isoDate = Utilities.formatDate(date, GW.TIMEZONE, 'yyyy-MM-dd');
      const fields = {};
      definition.columns.forEach(function (column) { fields[column[0]] = gwClean_(display[r][column[1]]); });
      lastRecordRow = r + 1;
      records.push({
        id: definition.id + '|' + isoDate, sectionId: definition.id, sectionTitle: definition.title,
        isoDate: isoDate, dateLabel: gwFormatLongDate_(date), time: definition.time,
        sheetRow: r + 1, fields: fields, status: 'PUBLISH', title: definition.title + ' · ' + gwFormatShortDate_(date)
      });
    }
    sections.push({ id: definition.id, title: definition.title, time: definition.time, headerRow: header + 1, lastRecordRow: lastRecordRow, fields: definition.columns.map(function (column) { return column[0]; }) });
  });
  return { sections: sections, records: records };
}

function gaSanitizePayload_(entity, payload) {
  if (entity === 'settings') return { value: String(payload.value == null ? '' : payload.value).slice(0, 8000) };
  if (entity === 'schedule') {
    const section = GW.SCHEDULES.filter(function (item) { return item.id === payload.sectionId; })[0];
    if (!section) throw new Error('Jenis ibadah tidak dikenali.');
    const fields = {};
    section.columns.forEach(function (column) { fields[column[0]] = String(payload.fields && payload.fields[column[0]] || '').slice(0, 300); });
    const isoDate = gwClean_(payload.isoDate);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate) || isNaN(new Date(isoDate + 'T12:00:00' + GW.UTC_OFFSET).getTime())) {
      throw new Error('Tanggal jadwal wajib diisi dengan tanggal yang valid.');
    }
    return { sectionId: section.id, isoDate: isoDate, fields: fields };
  }
  const definition = gaEntityDefinitions_()[entity];
  const clean = {};
  definition.fields.forEach(function (field) {
    let value = payload[field.key];
    if (field.required && (value == null || String(value).trim() === '')) throw new Error('Kolom “' + field.label + '” wajib diisi.');
    if (field.type === 'number') {
      if (value !== '' && !isFinite(Number(value))) throw new Error('Kolom “' + field.label + '” harus berupa angka.');
      value = Number(value) || 0;
    } else if (field.type === 'date') {
      value = gwClean_(value);
      if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Tanggal pada kolom “' + field.label + '” tidak valid.');
    } else if (field.type === 'url' || field.type === 'image') {
      const original = gwClean_(value);
      value = original ? (gwSafeUrl_(original) || '') : '';
      if (original && !value) throw new Error('Tautan pada kolom “' + field.label + '” harus menggunakan alamat HTTPS yang valid.');
    } else if (field.type === 'images') {
      let hasPrimary = false;
      const urls = String(value == null ? '' : value).split(/[\n,;]+/).map(function (item) {
        const original = item.trim();
        if (!original) return '';
        const isPrimary = /^PRIMARY:/i.test(original);
        const urlToTest = isPrimary ? original.substring(8).trim() : original;
        const safeUrl = gwSafeUrl_(urlToTest);
        if (!safeUrl) return '';
        if (isPrimary && !hasPrimary) {
          hasPrimary = true;
          return 'PRIMARY:' + safeUrl;
        }
        return safeUrl;
      }).filter(Boolean);
      if (urls.length > 12) throw new Error('Maksimal 12 foto untuk satu kegiatan.');
      value = urls.join('\n');
    } else {
      let rawStr = String(value == null ? '' : value).slice(0, field.type === 'textarea' ? 8000 : 1000).trim();
      if (field.type === 'textarea') {
        rawStr = gaSanitizeHtml_(rawStr);
      }
      value = rawStr;
    }
    if (field.options.length && value && field.options.indexOf(String(value).toUpperCase()) < 0) throw new Error('Pilihan “' + field.label + '” tidak valid.');
    clean[field.key] = field.options.length ? String(value).toUpperCase() : value;
  });
  return clean;
}

function gaSheetValue_(field, value) {
  if (field.type === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return new Date(String(value) + 'T00:00:00' + GW.UTC_OFFSET);
  return value == null ? '' : value;
}

function gaSanitizeHtml_(html) {
  if (!html) return '';
  let text = String(html);
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  text = text.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  text = text.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
  text = text.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, function(match, p1) {
    const tag = p1.toLowerCase();
    const allowedTags = ['p', 'strong', 'b', 'em', 'i', 'u', 'br', 'ul', 'ol', 'li', 'a'];
    if (allowedTags.indexOf(tag) === -1) return '';
    if (match.charAt(1) === '/') return '</' + tag + '>';
    if (tag === 'a') {
      const hrefMatch = match.match(/href\s*=\s*(["'])(.*?)\1/i);
      if (hrefMatch) {
        let href = hrefMatch[2].trim();
        if (/^(javascript:|data:|vbscript:)/i.test(href)) return '<a>';
        if (!/^https:\/\//i.test(href)) return '<a>';
        return '<a href="' + href.replace(/"/g, '&quot;') + '">';
      }
      return '<a>';
    } else if (tag === 'br') {
      return '<br>';
    } else {
      return '<' + tag + '>';
    }
  });
  return text.trim();
}

/* -------------------------------------------------------------------------- */
/* Layanan jemaat                                                             */
/* -------------------------------------------------------------------------- */

function adminListServices() {
  const user = gaRequireRole_('EDITOR');
  gaEnsureServiceColumns_();
  const sheet = gwServiceSheet_();
  if (sheet.getLastRow() < 2) return [];
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 12).getDisplayValues();
  return rows.map(function (row) {
    const privacy = String(row[11] || 'TIM_PELAYANAN').toUpperCase();
    const restricted = privacy === 'GEMBALA' && user.level < GA.ROLES.APPROVER;
    return { id: row[0], receivedAt: row[1], type: row[2], name: restricted ? 'Permohonan privat' : row[3], phone: restricted ? '' : row[4], message: restricted ? 'Isi hanya dapat dibaca oleh Gembala atau reviewer yang ditunjuk.' : row[5], contactMethod: row[6], consent: row[7], status: row[8] || 'BARU', adminNote: restricted ? '' : row[9], updatedAt: row[10], privacy: privacy, restricted: restricted };
  }).reverse();
}

function adminUpdateServiceStatus(id, status, note) {
  const user = gaRequireRole_('EDITOR');
  const selected = String(status || '').toUpperCase();
  if (GA.SERVICE_STATUSES.indexOf(selected) < 0) throw new Error('Status layanan tidak dikenali.');
  const sheet = gwServiceSheet_();
  const row = gaFindRowByValue_(sheet, 1, id);
  if (!row) throw new Error('Permohonan layanan tidak ditemukan.');
  sheet.getRange(row, 9, 1, 3).setValues([[selected, gwClean_(note), new Date()]]);
  gaAudit_(user, 'UPDATE_SERVICE', 'services', id, selected + (note ? ' · ' + gwClean_(note) : ''));
  return { ok: true, status: selected };
}

function adminDeleteService(id) {
  const user = gaRequireRole_('EDITOR');
  gaEnsureServiceColumns_();
  const sheet = gwServiceSheet_();
  const row = gaFindRowByValue_(sheet, 1, id);
  if (!row) throw new Error('Permohonan layanan tidak ditemukan.');
  const values = sheet.getRange(row, 1, 1, 12).getDisplayValues()[0];
  const privacy = String(values[11] || 'TIM_PELAYANAN').toUpperCase();
  if (privacy === 'GEMBALA' && user.level < GA.ROLES.APPROVER) {
    throw new Error('FORBIDDEN|Pengajuan privat hanya dapat dihapus oleh APPROVER atau SUPERADMIN.');
  }
  const reference = values[0];
  const type = values[2] || 'Layanan Jemaat';
  sheet.deleteRow(row);
  gaAudit_(user, 'DELETE_SERVICE', 'services', reference, type + ' · pengajuan dihapus permanen');
  return { ok: true, id: reference, message: 'Pengajuan berhasil dihapus.' };
}

/* -------------------------------------------------------------------------- */
/* Pengguna admin                                                             */
/* -------------------------------------------------------------------------- */

function adminListUsers() {
  gaRequireRole_('SUPERADMIN');
  const sheet = gwSpreadsheet_().getSheetByName(GA.SHEETS.admins);
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).getDisplayValues().map(function (row) {
    return { id: row[0], email: row[1], name: row[2], role: row[3], status: row[4], createdAt: row[5], updatedAt: row[6] };
  });
}

function adminSaveUser(payload) {
  const actor = gaRequireRole_('SUPERADMIN');
  const data = payload && typeof payload === 'object' ? payload : {};
  const email = gaNormalizeEmail_(data.email);
  const role = String(data.role || '').toUpperCase();
  const status = String(data.status || 'AKTIF').toUpperCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Alamat email tidak valid.');
  if (!GA.ROLES[role]) throw new Error('Peran admin tidak valid.');
  if (['AKTIF', 'NONAKTIF'].indexOf(status) < 0) throw new Error('Status admin tidak valid.');
  const sheet = gwSpreadsheet_().getSheetByName(GA.SHEETS.admins);
  let row = gaFindRowByValue_(sheet, 1, gwClean_(data.id));
  if (!row) row = gaFindRowByValue_(sheet, 2, email);
  const duplicateRow = gaFindRowByValue_(sheet, 2, email);
  if (duplicateRow && row && duplicateRow !== row) throw new Error('Email tersebut sudah digunakan pengelola lain.');
  if (row) {
    const existing = sheet.getRange(row, 1, 1, 7).getDisplayValues()[0];
    const isCurrentActor = gaNormalizeEmail_(existing[1]) === actor.email;
    const removesSuperadmin = String(existing[3]).toUpperCase() === 'SUPERADMIN' && String(existing[4]).toUpperCase() === 'AKTIF' && (role !== 'SUPERADMIN' || status !== 'AKTIF');
    if (isCurrentActor && removesSuperadmin) throw new Error('Anda tidak dapat menonaktifkan atau menurunkan peran akun yang sedang digunakan.');
    if (removesSuperadmin && adminListUsers().filter(function (item) { return item.role === 'SUPERADMIN' && item.status === 'AKTIF'; }).length <= 1) {
      throw new Error('Minimal harus ada satu SUPERADMIN aktif.');
    }
  }
  const now = new Date();
  const id = row ? sheet.getRange(row, 1).getDisplayValue() : gaId_('ADM');
  const created = row ? sheet.getRange(row, 6).getValue() : now;
  if (!row) row = sheet.getLastRow() + 1;
  sheet.getRange(row, 1, 1, 7).setValues([[id, email, gwClean_(data.name) || email, role, status, created, now]]);
  const accessWarning = gaGrantAdminAccess_(email, role, status);
  gaAudit_(actor, 'SAVE_ADMIN', 'admins', id, email + ' · ' + role + ' · ' + status);
  return { ok: true, id: id, message: accessWarning ? 'Pengelola tersimpan, tetapi izin Drive perlu diperiksa: ' + accessWarning : 'Pengelola dan izin Drive berhasil disiapkan.' };
}

function gaGrantAdminAccess_(email, role, status) {
  const warnings = [];
  const revoke = function(resource, label) {
    try { resource.removeEditor(email); resource.removeViewer(email); }
    catch (error) { warnings.push('cabut ' + label + ': ' + gwErrorMessage_(error)); }
  };
  const spreadsheet = gwSpreadsheet_();
  
  if (status !== 'AKTIF') {
    revoke(DriveApp.getFileById(spreadsheet.getId()), 'spreadsheet utama');
    try { revoke(DriveApp.getFileById(gwEnsureServiceStore_().getId()), 'data layanan'); } catch(e) {}
    const folderId = PropertiesService.getScriptProperties().getProperty(GA.IMAGE_FOLDER_PROPERTY);
    if (folderId) { try { revoke(DriveApp.getFolderById(folderId), 'folder media'); } catch(e) {} }
    return warnings.join(' | ').slice(0, 700);
  }

  const level = GA.ROLES[role] || GA.ROLES.VIEWER;
  const grant = function (resource, label, editor) {
    try {
      if (editor) resource.addEditor(email);
      else resource.addViewer(email);
    } catch (error) { warnings.push(label + ': ' + gwErrorMessage_(error)); }
  };
  
  grant(DriveApp.getFileById(spreadsheet.getId()), 'spreadsheet utama', level >= GA.ROLES.EDITOR);
  if (level >= GA.ROLES.EDITOR) {
    try { grant(DriveApp.getFileById(gwEnsureServiceStore_().getId()), 'data layanan jemaat', true); }
    catch (error) { warnings.push('data layanan jemaat: ' + gwErrorMessage_(error)); }
    const folderId = PropertiesService.getScriptProperties().getProperty(GA.IMAGE_FOLDER_PROPERTY);
    if (folderId) {
      try { grant(DriveApp.getFolderById(folderId), 'folder media website', true); }
      catch (error) { warnings.push('folder media website: ' + gwErrorMessage_(error)); }
    }
  }
  return warnings.join(' | ').slice(0, 700);
}

function adminDeleteUser(id) {
  const actor = gaRequireRole_('SUPERADMIN');
  const sheet = gwSpreadsheet_().getSheetByName(GA.SHEETS.admins);
  const row = gaFindRowByValue_(sheet, 1, id);
  if (!row) throw new Error('Admin tidak ditemukan.');
  const target = sheet.getRange(row, 1, 1, 7).getDisplayValues()[0];
  if (gaNormalizeEmail_(target[1]) === actor.email) throw new Error('Anda tidak dapat menghapus akun yang sedang digunakan.');
  if (String(target[3]).toUpperCase() === 'SUPERADMIN' && String(target[4]).toUpperCase() === 'AKTIF') {
    const users = adminListUsers();
    if (users.filter(function (item) { return item.role === 'SUPERADMIN' && item.status === 'AKTIF'; }).length <= 1) throw new Error('Minimal harus ada satu SUPERADMIN aktif.');
  }
  sheet.deleteRow(row);
  gaAudit_(actor, 'DELETE_ADMIN', 'admins', id, target[1]);
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Media, sistem, dan backup                                                   */
/* -------------------------------------------------------------------------- */

function adminUploadImage(filePayload) {
  const user = gaRequireRole_('EDITOR');
  const payload = filePayload && typeof filePayload === 'object' ? filePayload : {};
  const mime = String(payload.mimeType || '');
  if (!/^image\/(?:png|jpe?g|webp|gif)$/i.test(mime)) throw new Error('Format gambar harus PNG, JPG, WEBP, atau GIF.');
  const bytes = Utilities.base64Decode(String(payload.base64 || ''));
  if (!bytes.length || bytes.length > 4 * 1024 * 1024) throw new Error('Ukuran gambar maksimal 4 MB.');
  const folder = gaImageFolder_();
  const safeName = String(payload.name || 'gambar').replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 100);
  const file = folder.createFile(Utilities.newBlob(bytes, mime, Date.now() + '-' + safeName));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const url = 'https://drive.google.com/uc?export=view&id=' + file.getId();
  gaAudit_(user, 'UPLOAD_IMAGE', 'media', file.getId(), safeName);
  return { id: file.getId(), name: file.getName(), url: url };
}

function gaImageFolder_() {
  const properties = PropertiesService.getScriptProperties();
  const stored = properties.getProperty(GA.IMAGE_FOLDER_PROPERTY);
  if (stored) {
    try { return DriveApp.getFolderById(stored); } catch (ignore) {}
  }
  const folder = DriveApp.createFolder('GMAHK Galilea - Media Website');
  properties.setProperty(GA.IMAGE_FOLDER_PROPERTY, folder.getId());
  try {
    const sheet = gwSpreadsheet_().getSheetByName(GA.SHEETS.admins);
    if (sheet && sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).getDisplayValues().forEach(function (row) {
        const role = String(row[3] || '').toUpperCase();
        if (String(row[4] || '').toUpperCase() === 'AKTIF' && GA.ROLES[role] >= GA.ROLES.EDITOR) {
          try { folder.addEditor(gaNormalizeEmail_(row[1])); } catch (ignore) {}
        }
      });
    }
  } catch (ignore) {}
  return folder;
}

function adminRunSystemAction(action) {
  const selected = String(action || 'refresh').toLowerCase();
  const user = gaRequireRole_((selected === 'backup' || selected === 'archives') ? 'SUPERADMIN' : 'EDITOR');
  let result;
  if (selected === 'refresh') result = refreshWebsiteGalilea();
  else if (selected === 'health') result = runWebsiteHealthCheck();
  else if (selected === 'backup') result = gaCreateBackup_();
  else if (selected === 'archives') {
    if (typeof buildGalileaDownloadArchives !== 'function') throw new Error('Fungsi arsip PDF belum tersedia pada Website.gs.');
    result = buildGalileaDownloadArchives('all');
  }
  else throw new Error('Aksi sistem tidak dikenali.');
  gaAudit_(user, 'SYSTEM_' + selected.toUpperCase(), 'system', '', typeof result === 'string' ? result : JSON.stringify(result));
  return result;
}

function gaCreateBackup_() {
  const spreadsheet = gwSpreadsheet_();
  const stamp = Utilities.formatDate(new Date(), GW.TIMEZONE, 'yyyyMMdd-HHmmss');
  const copy = DriveApp.getFileById(spreadsheet.getId()).makeCopy('BACKUP Galilea ' + stamp);
  let serviceCopy = '';
  try {
    const service = gwEnsureServiceStore_();
    serviceCopy = DriveApp.getFileById(service.getId()).makeCopy('BACKUP Layanan Galilea ' + stamp).getUrl();
  } catch (ignore) {}
  return { ok: true, createdAt: gwFormatDateTime_(new Date()), spreadsheetUrl: copy.getUrl(), serviceUrl: serviceCopy };
}

/* -------------------------------------------------------------------------- */
/* Utilitas admin                                                              */
/* -------------------------------------------------------------------------- */

function gaDateInput_(raw, display) {
  if (raw instanceof Date && !isNaN(raw.getTime())) return Utilities.formatDate(raw, GW.TIMEZONE, 'yyyy-MM-dd');
  const parsed = gwParseDate_(raw, display);
  return parsed ? Utilities.formatDate(parsed, GW.TIMEZONE, 'yyyy-MM-dd') : '';
}

function gaRecordTitle_(definition, values) {
  return gwClean_(values.title || values.name || values.question || values.theme || values.date || definition.label);
}

function gaFindRowByValue_(sheet, column, value) {
  const target = gwClean_(value);
  if (!sheet || !target || sheet.getLastRow() < 2) return 0;
  const values = sheet.getRange(2, column, sheet.getLastRow() - 1, 1).getDisplayValues();
  for (let index = 0; index < values.length; index++) if (gwClean_(values[index][0]) === target) return index + 2;
  return 0;
}

function gaId_(prefix) { return String(prefix || 'ID') + '-' + Utilities.getUuid().replace(/-/g, '').slice(0, 14).toUpperCase(); }

function gaPayloadSummary_(payload) {
  const values = Object.keys(payload || {}).map(function (key) {
    const value = payload[key] && typeof payload[key] === 'object' ? JSON.stringify(payload[key]) : String(payload[key] == null ? '' : payload[key]);
    return key + ': ' + value.slice(0, 80);
  });
  return values.join(' · ').slice(0, 800);
}

function gaAudit_(user, action, entity, entityId, detail) {
  gaAuditRaw_(gwSpreadsheet_(), user.email, user.name, action, entity, entityId, detail);
}

function gaAuditRaw_(spreadsheet, email, name, action, entity, entityId, detail) {
  const sheet = spreadsheet.getSheetByName(GA.SHEETS.audit) || gaEnsureSheet_(spreadsheet, GA.SHEETS.audit,
    ['ID', 'Waktu', 'Email', 'Nama', 'Aksi', 'Entitas', 'ID Entitas', 'Detail']);
  sheet.appendRow([gaId_('LOG'), new Date(), email, name, action, entity, entityId, String(detail || '').slice(0, 1500)]);
}
