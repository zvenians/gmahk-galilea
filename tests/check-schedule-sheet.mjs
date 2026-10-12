import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../apps-script-backend/Website.gs', import.meta.url), 'utf8');
const revisions = [];
const context = vm.createContext({
  console,
  Utilities: {
    formatDate(date, timezone, pattern) {
      const local = new Date(date.getTime() + 8 * 3600000);
      const iso = local.toISOString();
      if (pattern === 'yyyy') return iso.slice(0, 4);
      if (pattern === 'M') return String(local.getUTCMonth() + 1);
      if (pattern === 'd') return String(local.getUTCDate());
      if (pattern === 'yyyy-MM-dd') return iso.slice(0, 10);
      throw new Error('Unexpected date format: ' + pattern);
    }
  },
  PropertiesService: {getScriptProperties: () => ({setProperty: (...args) => revisions.push(args)})}
});
vm.runInContext(source, context);
const sheet = (name, marker = '') => ({getName: () => name, getRange: () => ({getDisplayValue: () => marker})});
const fixed = sheet('Jadwal Triwulan');
const archived = sheet('Triwulan IV 2026', 'JADWAL IBADAH JEMAAT GALILEA');
const future = sheet('Triwulan I 2027', 'JADWAL IBADAH JEMAAT GALILEA');
const spreadsheet = sheets => ({getSheetByName: name => sheets.find(item => item.getName() === name), getSheets: () => sheets});
assert.equal(context.gwChooseScheduleSheet_(spreadsheet([archived, future, fixed])), fixed, 'Fixed sheet wins over dated archives');
assert.equal(context.gwChooseScheduleSheet_(spreadsheet([fixed])), fixed, 'Fixed sheet needs no A1 marker');
assert.equal(context.gwChooseScheduleSheet_(spreadsheet([sheet('Other')])), null);

context.websiteOnEdit({range: {getSheet: () => fixed}});
assert.equal(revisions.length, 1, 'Edits invalidate cached website data');
context.websiteOnEdit({range: {getSheet: () => sheet('Other')}});
assert.equal(revisions.length, 1, 'Unrelated edits do not invalidate');
context.websiteOnEdit({range: {getSheet: () => archived}});
assert.equal(revisions.length, 2, 'Legacy schedules still invalidate');
context.websiteOnEdit();
assert.equal(revisions.length, 2);

const definition = {anchor: 'KEBAKTIAN KHOTBAH', time: '09:00', columns: [['Pengkhotbah', 1]]};
const rows = [['KEBAKTIAN KHOTBAH'], ['Tanggal', 'Pengkhotbah'], ['02/01/2027', 'Petugas Januari'], ['09/01/2027', 'Petugas berikutnya']];
const records = context.gwParseScheduleSection_(rows, rows, definition);
assert.equal(records[0].isoDate, '2027-01-02');
assert.equal(records[0].timestamp, '2027-01-02T09:00:00+08:00');
assert.equal(records[0].fields[0].value, 'Petugas Januari');
const sections = [{records}];
const now = new Date('2026-10-12T09:00:00+08:00');
assert.equal(context.gwSchedulePeriodLabel_(sections, now), 'TRIWULAN I • JANUARI – MARET 2027', 'Period follows sheet dates, not current calendar');
records.push({isoDate: '2027-04-03'});
assert.equal(context.gwSchedulePeriodLabel_(sections, now), 'TRIWULAN I • JANUARI – MARET 2027 / TRIWULAN II • APRIL – JUNI 2027');
assert.equal(context.gwSchedulePeriodLabel_([], now), 'TRIWULAN IV • OKTOBER – DESEMBER 2026');
assert.match(source, /periodLabel: gwSchedulePeriodLabel_\(sections, now\)/);
console.log('Schedule sheet selection, edit invalidation, and date-derived periods: PASS');
