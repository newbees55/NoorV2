// Penyimpanan data setempat (localStorage) + migrasi daripada prototaip lama.
const KEY = 'noor.v2';
const OLD_KEY = 'noorData';

const pad = n => String(n).padStart(2, '0');
/** Kunci tarikh mengikut masa TEMPATAN (bukan UTC) supaya hari bertukar pada tengah malam waktu anda. */
export const dateKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const PRAYERS = ['Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak'];
export const DEFAULT_HABITS = ['Baca Quran', 'Zikir pagi', 'Zikir petang', 'Solat Dhuha', 'Sedekah', 'Istighfar'];

const defaults = () => ({
  v: 2,
  name: '',
  settings: {
    lat: 3.139, lng: 101.6869, place: 'Kuala Lumpur',
    method: 17,               // 17 = JAKIM (Aladhan)
    theme: 'auto',            // auto | light | dark
    translation: 'ms.basmeih',
    arSize: 28
  },
  days: {},                   // { 'YYYY-MM-DD': { prayers:{Subuh:true}, habits:{'Baca Quran':true} } }
  habits: [...DEFAULT_HABITS],
  juz: Array(30).fill(false),
  journal: {},                // { 'YYYY-MM-DD': 'teks' }
  tasbih: { total: 0, counts: {}, targets: {}, byDay: {} },
  quran: { bookmark: null }   // { surah, ayah }
});

const safeGet = k => { try { return localStorage.getItem(k); } catch { return null; } };
const safeSet = (k, v) => { try { localStorage.setItem(k, v); return true; } catch { return false; } };

const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
const num = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);

/** Tapis & lengkapkan data supaya struktur sentiasa sah (digunakan untuk muat & import). */
function normalize(raw) {
  const d = defaults();
  if (!isObj(raw)) return d;
  if (typeof raw.name === 'string') d.name = raw.name.slice(0, 40);
  if (isObj(raw.settings)) {
    const s = raw.settings;
    d.settings.lat = Math.min(90, Math.max(-90, num(s.lat, d.settings.lat)));
    d.settings.lng = Math.min(180, Math.max(-180, num(s.lng, d.settings.lng)));
    if (typeof s.place === 'string') d.settings.place = s.place.slice(0, 60);
    d.settings.method = num(s.method, d.settings.method);
    if (['auto', 'light', 'dark'].includes(s.theme)) d.settings.theme = s.theme;
    if (typeof s.translation === 'string' && /^[a-z]{2}\.[\w-]+$/i.test(s.translation)) d.settings.translation = s.translation;
    d.settings.arSize = Math.min(44, Math.max(20, num(s.arSize, 28)));
  }
  if (isObj(raw.days)) {
    for (const [k, v] of Object.entries(raw.days)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(k) || !isObj(v)) continue;
      d.days[k] = { prayers: isObj(v.prayers) ? { ...v.prayers } : {}, habits: isObj(v.habits) ? { ...v.habits } : {} };
    }
  }
  if (Array.isArray(raw.habits)) d.habits = raw.habits.filter(x => typeof x === 'string' && x.trim()).map(x => x.slice(0, 60));
  if (Array.isArray(raw.juz) && raw.juz.length === 30) d.juz = raw.juz.map(Boolean);
  if (isObj(raw.journal)) for (const [k, v] of Object.entries(raw.journal)) if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k)) d.journal[k] = v;
  if (isObj(raw.tasbih)) {
    const t = raw.tasbih;
    d.tasbih.total = num(t.total, 0);
    for (const f of ['counts', 'targets', 'byDay']) if (isObj(t[f])) d.tasbih[f] = { ...t[f] };
  }
  if (isObj(raw.quran?.bookmark) && Number.isInteger(raw.quran.bookmark.surah) && Number.isInteger(raw.quran.bookmark.ayah)) {
    d.quran.bookmark = { surah: raw.quran.bookmark.surah, ayah: raw.quran.bookmark.ayah };
  }
  return d;
}

function load() {
  const cur = safeGet(KEY);
  if (cur) { try { return normalize(JSON.parse(cur)); } catch { /* rosak → cuba lama */ } }
  const old = safeGet(OLD_KEY); // migrasi daripada prototaip
  if (old) {
    try {
      const o = JSON.parse(old);
      const d = normalize({ name: o.name, habits: o.habits, juz: o.juz });
      const k = typeof o.day === 'string' ? o.day : dateKey();
      d.days[k] = { prayers: isObj(o.prayers) ? o.prayers : {}, habits: isObj(o.habitsDone) ? o.habitsDone : {} };
      if (typeof o.journal === 'string' && o.journal) d.journal[k] = o.journal;
      return d;
    } catch { /* abaikan */ }
  }
  return defaults();
}

export let data = load();
const subs = new Set();
export const onChange = fn => subs.add(fn);
export function save() {
  safeSet(KEY, JSON.stringify(data));
  subs.forEach(fn => fn());
}
export function replaceAll(raw) { data = normalize(raw); save(); }
export function resetAll() { data = defaults(); save(); }

/** Rekod hari (dicipta apabila perlu). */
export function day(key = dateKey()) {
  return (data.days[key] ??= { prayers: {}, habits: {} });
}
export const prayersDone = (key = dateKey()) => PRAYERS.filter(p => data.days[key]?.prayers?.[p]).length;

/** Bilangan hari berturut-turut kelima-lima solat ditanda. Hari ini yang belum lengkap tidak memutuskan rantaian. */
export function streak() {
  let n = 0;
  const d = new Date();
  if (prayersDone(dateKey(d)) < 5) d.setDate(d.getDate() - 1);
  while (prayersDone(dateKey(d)) === 5) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
