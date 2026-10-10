import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const worker = fs.readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
const source = fs.readFileSync(new URL('../schedule-clock.js', import.meta.url), 'utf8');
const ms = value => Date.parse(value + '+08:00');
let now = ms('2026-10-10T08:59:59');
class Clock extends Date { static now() { return now; } }
const window = {};
const context = vm.createContext({window, Date: Clock, console});
vm.runInContext(source, context);
const clock = window.GalileaScheduleClock;
function records(dates, time) {
  return dates.map(isoDate => ({isoDate, dateLabel: isoDate, time, timestamp: isoDate + 'T' + time + ':00+08:00', fields: [{label: 'Petugas', value: isoDate}]}));
}
function data() {
  return {
    nextSabbath: {isoDate: '2026-10-10', timestamp: '2026-10-10T09:00:00+08:00', countdown: 'HARI INI'},
    nextWednesday: {isoDate: '2026-10-07', timestamp: '2026-10-07T19:00:00+08:00'},
    sections: [
      {id: 'khotbah', title: 'Kebaktian Khotbah', records: records(['2026-10-24', '2026-10-10', '2026-10-17'], '09:00')},
      {id: 'sekolahSabat', title: 'Sekolah Sabat', records: records(['2026-10-10', '2026-10-17'], '09:00')},
      {id: 'pemuda', title: 'Pemuda', records: records(['2026-10-10', '2026-10-17'], '15:00')},
      {id: 'doa', title: 'Rabu Malam', records: records(['2026-10-07', '2026-10-14', '2026-10-21'], '19:00')}
    ],
    worshipPlans: [{isoDate: '2026-10-10', isToday: false}, {isoDate: '2026-10-17', isToday: true}]
  };
}
const saved = data();
clock.refresh(saved, now);
assert.equal(saved.nextSabbath.isoDate, '2026-10-10');
assert.equal(saved.nextSabbath.countdown, 'HARI INI');
assert.equal(saved.nextWednesday.isoDate, '2026-10-14');
assert.equal(clock.refresh(saved, now), false, 'Stable clock does not trigger repeated renders');
now = ms('2026-10-10T09:00:00');
clock.refresh(saved, now);
assert.equal(saved.nextSabbath.isoDate, '2026-10-10', 'Exact start preserves existing boundary semantics');
now += 1000;
assert.equal(clock.refresh(saved, now), true);
assert.equal(saved.nextSabbath.isoDate, '2026-10-17');
assert.equal(saved.nextSabbath.services.length, 3);
assert.ok(saved.nextSabbath.services.every(service => service.fields[0].value === '2026-10-17'));
assert.notEqual(saved.nextSabbath.countdown, 'HARI INI');
assert.equal(saved.sections[0].records.find(record => record.isoDate === '2026-10-10').status, 'past');
assert.equal(saved.sections[0].records.find(record => record.isoDate === '2026-10-17').status, 'next');
assert.equal(saved.worshipPlans[0].isToday, true);
assert.equal(saved.worshipPlans[1].isToday, false);
assert.equal(clock.forDate(saved, 'sabbath', '2026-10-10', now).services[0].fields[0].value, '2026-10-10');

now = ms('2026-10-10T15:03:18');
const reloaded = JSON.parse(JSON.stringify(data()));
clock.refresh(reloaded, now);
assert.equal(reloaded.nextSabbath.isoDate, '2026-10-17', 'Reload from a morning cache recomputes the summary');
now = ms('2026-10-14T19:00:01');
clock.refresh(reloaded, now);
assert.equal(reloaded.nextWednesday.isoDate, '2026-10-21');
assert.equal(reloaded.worshipPlans[0].isToday, false);
now = ms('2026-10-17T00:00:00');
clock.refresh(reloaded, now);
assert.equal(reloaded.nextSabbath.isoDate, '2026-10-17', 'WITA midnight does not prematurely skip the upcoming service');
assert.equal(reloaded.worshipPlans[1].isToday, true);
now = ms('2027-01-01T23:59:00');
clock.refresh(reloaded, now);
assert.equal(reloaded.nextSabbath, null, 'No invented service when the saved quarter is exhausted');
assert.equal(reloaded.nextWednesday, null);
assert.equal(clock.forDate(reloaded, 'sabbath', '2027-01-02', now), null);
const invalid = {sections: [{id: 'khotbah', records: [{isoDate: 'bad', timestamp: 'bad'}]}]};
clock.refresh(invalid, now);
assert.equal(invalid.nextSabbath, null);
assert.equal(clock.timestamp({isoDate: '2026-10-17', time: '09.00 WITA'}), ms('2026-10-17T09:00:00'));
assert.equal(clock.timestamp({isoDate: '2026-10-17', time: '09:00', timestamp: '2026-10-17T09:00:00'}), ms('2026-10-17T09:00:00'), 'Timezone-less values use explicit WITA fields');

function sourceFunction(name) {
  const start = html.search(new RegExp('      function ' + name + '\\('));
  assert.ok(start >= 0, name);
  const end = html.slice(start + 1).search(/\n      (?:async )?function /);
  return html.slice(start, start + 1 + end);
}
now = ms('2026-10-10T15:03:18');
const state = {route: 'schedule', data: data()};
let renders = 0, busy = false;
Object.assign(context, {state, document: {visibilityState: 'visible'}, websiteUpdateIsBusy: () => busy, render: () => {renders++;}, witaDateKey: () => new Date(now + 8 * 3600000).toISOString().slice(0, 10)});
for (const name of ['checkScheduleClock', 'normalizeWorshipTime', 'scheduleWorshipFallback', 'selectedWorshipPlan', 'eventStatus']) vm.runInContext(sourceFunction(name), context);
context.checkScheduleClock();
assert.equal(renders, 1);
assert.equal(state.data.nextSabbath.isoDate, '2026-10-17');
assert.equal(context.selectedWorshipPlan().isoDate, '2026-10-10');
state.data.worshipPlans = [];
assert.equal(context.selectedWorshipPlan().isoDate, '2026-10-10', 'Today fallback survives switching the upcoming summary');
assert.equal(context.eventStatus({timestamp: '2026-10-10T16:00:00+08:00'}).label, 'Dimulai dalam 57 menit', 'ISO timestamps produce a valid live countdown');
context.checkScheduleClock();
assert.equal(renders, 1);
busy = true;
now = ms('2026-10-17T09:00:01');
context.checkScheduleClock();
assert.equal(renders, 1, 'Open readers are not replaced at the boundary');
assert.equal(state.scheduleClockPending, true);
busy = false;
context.checkScheduleClock();
assert.equal(renders, 2, 'Deferred display updates after the reader closes');
state.route = 'hymnal';
now = ms('2026-10-24T09:00:01');
context.checkScheduleClock();
assert.equal(renders, 2, 'Song view is not re-rendered by the schedule clock');
assert.match(html, /schedule-clock\.js\?v=32-wita/);
assert.ok(html.indexOf('schedule-clock.js') < html.indexOf('      function render()'));
assert.match(html, /GalileaScheduleClock\.refresh\(state\.data\)/);
assert.match(html, /setInterval\(checkScheduleClock,60000\)/);
assert.match(worker, /schedule-clock\.js\?v=32-wita/);
console.log('Schedule clock verified: stale/offline cache, WITA start/midnight, sorted records, exact service fields, exhausted/invalid schedules, Wednesday rollover, today fallback, live countdown and deferred rendering.');
