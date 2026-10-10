(function (root) {
  'use strict';

  function dayKey(value) {
    return new Date(Number(value) + 8 * 3600000).toISOString().slice(0, 10);
  }

  function timestamp(record) {
    if (!record) return NaN;
    const raw = record.timestamp;
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
    if (typeof raw === 'string' && /(?:Z|[+-]\d{2}:?\d{2})$/.test(raw)) {
      const parsed = Date.parse(raw);
      if (Number.isFinite(parsed)) return parsed;
    }
    const date = String(record.isoDate || '');
    const time = String(record.time || '').match(/(\d{1,2})[.:](\d{2})/);
    return /^\d{4}-\d{2}-\d{2}$/.test(date) && time
      ? Date.parse(date + 'T' + time[1].padStart(2, '0') + ':' + time[2] + ':00+08:00')
      : NaN;
  }

  function countdown(record, now) {
    const start = timestamp(record);
    if (!Number.isFinite(start)) return '';
    if (dayKey(start) === dayKey(now)) return 'HARI INI';
    if (start < now) return '';
    const hours = Math.floor((start - now) / 3600000);
    const days = Math.floor(hours / 24);
    return days ? days + ' HARI • ' + hours % 24 + ' JAM LAGI' : Math.max(hours, 1) + ' JAM LAGI';
  }

  function section(data, id) {
    return (data.sections || []).find(item => item.id === id);
  }

  function orderedRecords(value) {
    return (value && Array.isArray(value.records) ? value.records : [])
      .filter(record => Number.isFinite(timestamp(record)))
      .slice().sort((a, b) => timestamp(a) - timestamp(b));
  }

  function sabbathSummary(data, record, now) {
    if (!record) return null;
    const services = ['khotbah', 'sekolahSabat', 'pemuda'].map(id => {
      const group = section(data, id);
      const match = group && (group.records || []).find(item => item.isoDate === record.isoDate);
      return match ? {id, title: group.title, color: group.color, fields: match.fields || []} : null;
    }).filter(Boolean);
    return {
      isoDate: record.isoDate, dateLabel: record.dateLabel, time: '09.00 WITA',
      timestamp: record.timestamp || timestamp(record), countdown: countdown(record, now), services
    };
  }

  function forDate(data, kind, date, now = Date.now()) {
    const group = section(data, kind === 'sabbath' ? 'khotbah' : 'doa');
    const record = orderedRecords(group).find(item => item.isoDate === date);
    return kind === 'sabbath' ? sabbathSummary(data, record, Number(now)) : record
      ? Object.assign({}, record, {timeLabel: '19.00 WITA', countdown: countdown(record, Number(now))}) : null;
  }

  function signature(data) {
    return JSON.stringify([
      [data.nextSabbath, data.nextWednesday].map(item => item && [item.isoDate, item.timestamp, item.countdown]),
      (data.sections || []).map(group => (group.records || []).map(item => [item.status, item.countdown])),
      (data.worshipPlans || []).map(item => item.isToday)
    ]);
  }

  function refresh(data, value = Date.now()) {
    const now = Number(value);
    if (!data || !Number.isFinite(now)) return false;
    const before = signature(data);
    (data.sections || []).forEach(group => {
      const next = orderedRecords(group).find(record => timestamp(record) >= now);
      (group.records || []).forEach(record => {
        const start = timestamp(record);
        if (!Number.isFinite(start)) return;
        record.status = start < now ? 'past' : record === next ? 'next' : 'future';
        record.countdown = countdown(record, now);
      });
    });
    const khotbah = section(data, 'khotbah');
    const doa = section(data, 'doa');
    // Cached sections remain useful after the selected service has started.
    if (khotbah) data.nextSabbath = sabbathSummary(data, orderedRecords(khotbah).find(item => timestamp(item) >= now), now);
    else if (data.nextSabbath && !(timestamp(data.nextSabbath) >= now)) data.nextSabbath = null;
    if (doa) {
      const next = orderedRecords(doa).find(item => timestamp(item) >= now);
      data.nextWednesday = next ? Object.assign({}, next, {timeLabel: '19.00 WITA', countdown: countdown(next, now)}) : null;
    } else if (data.nextWednesday && !(timestamp(data.nextWednesday) >= now)) data.nextWednesday = null;
    (data.worshipPlans || []).forEach(plan => { plan.isToday = plan.isoDate === dayKey(now); });
    return before !== signature(data);
  }

  root.GalileaScheduleClock = {refresh, forDate, timestamp};
})(typeof window === 'undefined' ? globalThis : window);
