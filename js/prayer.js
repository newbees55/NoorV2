// Waktu solat melalui Aladhan API (kaedah 17 = JAKIM). Dicache supaya berfungsi luar talian.
import { data, dateKey } from './store.js';
import { getJSON } from './util.js';

const API = 'https://api.aladhan.com/v1/timings/';

export const CITIES = [
  ['Kuala Lumpur', 3.139, 101.6869], ['Putrajaya', 2.9264, 101.6964], ['Shah Alam', 3.0738, 101.5183],
  ['Seremban', 2.7297, 101.9381], ['Melaka', 2.1896, 102.2501], ['Johor Bahru', 1.4927, 103.7414],
  ['Kuantan', 3.8077, 103.326], ['Kuala Terengganu', 5.3302, 103.1408], ['Kota Bharu', 6.1254, 102.2381],
  ['Ipoh', 4.5975, 101.0901], ['George Town', 5.4141, 100.3288], ['Alor Setar', 6.1248, 100.3678],
  ['Kangar', 6.4414, 100.1986], ['Kuching', 1.5535, 110.3593], ['Kota Kinabalu', 5.9804, 116.0735], ['Labuan', 5.2831, 115.2308]
];

export const METHODS = [
  [17, 'JAKIM (Malaysia)'], [11, 'MUIS (Singapura)'], [20, 'KEMENAG (Indonesia)'],
  [3, 'Muslim World League'], [4, 'Umm al-Qura (Makkah)']
];

const HIJRI_MS = ['', 'Muharram', 'Safar', 'Rabiulawal', 'Rabiulakhir', 'Jamadilawal', 'Jamadilakhir', 'Rejab', 'Syaaban', 'Ramadan', 'Syawal', 'Zulkaedah', 'Zulhijjah'];

export const ORDER = ['Subuh', 'Syuruk', 'Zohor', 'Asar', 'Maghrib', 'Isyak'];
const MAP = { Subuh: 'Fajr', Syuruk: 'Sunrise', Zohor: 'Dhuhr', Asar: 'Asr', Maghrib: 'Maghrib', Isyak: 'Isha' };

const hhmm = s => { const m = /(\d{1,2}):(\d{2})/.exec(s || ''); return m ? `${m[1].padStart(2, '0')}:${m[2]}` : null; };
export const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

const lsGet = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* penuh */ } };

function pruneCache() {
  try {
    const today = dateKey();
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k?.startsWith('noor.times.') && k !== 'noor.times.last' && !k.startsWith('noor.times.' + today)) localStorage.removeItem(k);
    }
  } catch { /* abaikan */ }
}

/**
 * @returns {Promise<{times:Record<string,string>, hijri:string, tz:string, source:'live'|'cache'|'stale'}>}
 */
export async function getTimes(date = new Date()) {
  const { lat, lng, method } = data.settings;
  const key = `noor.times.${dateKey(date)}.${lat.toFixed(2)},${lng.toFixed(2)}.${method}`;
  const cached = lsGet(key);
  if (cached) return { ...cached, source: 'cache' };

  const dd = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
  try {
    const j = await getJSON(`${API}${dd}?latitude=${lat}&longitude=${lng}&method=${method}`);
    const t = j.data.timings;
    const times = {};
    for (const [ms, en] of Object.entries(MAP)) {
      const v = hhmm(t[en]);
      if (!v) throw new Error('Format waktu tidak dijangka');
      times[ms] = v;
    }
    const h = j.data.date?.hijri;
    const hijri = h ? `${Number(h.day)} ${HIJRI_MS[h.month?.number] || h.month?.en} ${h.year}H` : '';
    const out = { times, hijri, tz: j.data.meta?.timezone || 'Asia/Kuala_Lumpur', date: dateKey(date) };
    lsSet(key, out);
    lsSet('noor.times.last', out);
    pruneCache();
    return { ...out, source: 'live' };
  } catch (err) {
    const last = lsGet('noor.times.last'); // anggaran: waktu terakhir diketahui
    if (last) return { ...last, source: 'stale' };
    throw err;
  }
}

/** Minit sejak tengah malam di zon waktu lokasi. */
export function nowMinutes(tz) {
  try {
    const p = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).formatToParts(new Date());
    const g = t => Number(p.find(x => x.type === t).value);
    return (g('hour') % 24) * 60 + g('minute') + g('second') / 60;
  } catch {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
  }
}

/** Solat seterusnya (tidak termasuk Syuruk). Selepas Isyak → Subuh esok (anggaran guna waktu Subuh hari ini). */
export function nextPrayer({ times, tz }) {
  const now = nowMinutes(tz);
  for (const n of ['Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak']) {
    const m = toMin(times[n]);
    if (m > now) return { name: n, time: times[n], inMin: m - now, tomorrow: false };
  }
  return { name: 'Subuh', time: times.Subuh, inMin: toMin(times.Subuh) + 1440 - now, tomorrow: true };
}

export function fmtCountdown(min) {
  const m = Math.max(0, Math.ceil(min));
  const h = Math.floor(m / 60);
  return h ? `${h}j ${m % 60}m` : `${m} minit`;
}
