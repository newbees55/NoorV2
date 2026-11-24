import { data, save, onChange, day, dateKey, prayersDone, streak, PRAYERS, replaceAll, resetAll } from './store.js';
import { $, $$, esc, toast } from './util.js';
import { getTimes, nextPrayer, fmtCountdown, ORDER, CITIES, METHODS } from './prayer.js';
import { renderQibla } from './qibla.js';
import { renderDuas } from './duas.js';
import { renderQuran } from './quran.js';
import { renderTasbih } from './tasbih.js';
import { renderHabits } from './habits.js';

/* ---------- Tema ---------- */
function applyTheme() {
  const t = data.settings.theme;
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
  const dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  $('meta[name="theme-color"]').content = dark ? '#16241b' : '#244735';
}
applyTheme();

/* ---------- Penghala (hash) ---------- */
const VIEWS = ['home', 'duas', 'quran', 'tasbih', 'habits', 'profile'];
function route() {
  const [v, ...rest] = location.hash.replace(/^#/, '').split('/');
  const id = VIEWS.includes(v) ? v : 'home';
  $$('.view').forEach(el => el.classList.toggle('active', el.id === id));
  $$('.nav a').forEach(a => { const on = a.dataset.view === id; a.classList.toggle('active', on); on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });
  const arg = rest.join('/');
  ({ home: renderHome, duas: renderDuas, quran: renderQuran, tasbih: renderTasbih, habits: renderHabits, profile: renderProfile })[id](arg);
  window.scrollTo(0, 0);
}
addEventListener('hashchange', route);

/* ---------- Home ---------- */
const REFLECTIONS = [
  ['Maka ingatlah kepada-Ku, Aku juga akan ingat kepadamu.', 'Surah Al-Baqarah, 2:152'],
  ['Sesungguhnya bersama kesulitan ada kemudahan.', 'Surah Al-Insyirah, 94:5–6'],
  ['Ketahuilah, dengan mengingati Allah hati menjadi tenteram.', 'Surah Ar-Ra‘d, 13:28'],
  ['Allah tidak membebani seseorang melainkan sesuai dengan kesanggupannya.', 'Surah Al-Baqarah, 2:286'],
  ['Dan sesiapa yang bertawakal kepada Allah, nescaya Allah mencukupkan keperluannya.', 'Surah At-Talaq, 65:3'],
  ['Dan katakanlah: Wahai Tuhanku, tambahkanlah ilmu kepadaku.', 'Surah Taha, 20:114']
];

let times = null;      // keputusan getTimes
let timesErr = false;
let loading = false;
let homeWired = false;

function renderHome() {
  if (!homeWired) { homeWired = true; wireHome(); }
  const d = new Date();
  const doy = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
  const [q, ref] = REFLECTIONS[doy % REFLECTIONS.length];
  $('#reflection').innerHTML = `<div class="eyebrow gold">RENUNGAN</div><p class="quote">“${esc(q)}”</p><div class="small">${esc(ref)} · Terjemahan ringkas</div>`;
  renderQibla($('#qiblaCard'));
  drawToday();
  drawTimes();
  if (!times && !loading) loadTimes();
}

async function loadTimes() {
  loading = true; timesErr = false; drawTimes();
  try { times = await getTimes(); } catch { timesErr = true; }
  loading = false;
  drawTimes();
}

function drawToday() {
  const done = prayersDone();
  const p = Math.round(done / 5 * 100);
  const s = streak();
  $('#doneText').textContent = `${done} / 5 selesai`;
  $('#ring').style.setProperty('--p', p + '%');
  $('#percent').textContent = p + '%';
  $('#streakText').textContent = s ? `🔥 ${s} hari berturut-turut` : 'Setiap langkah kecil itu bermakna.';
  const dd = day();
  $('#prayerChecks').innerHTML = PRAYERS.map(n => `
    <label class="checkrow"><input type="checkbox" data-prayer="${n}" ${dd.prayers[n] ? 'checked' : ''}><span>${n}</span><span class="subtle" style="margin-left:auto">${dd.prayers[n] ? 'Selesai' : ''}</span></label>`).join('');
}

function drawTimes() {
  const grid = $('#prayers'), note = $('#timesNote'), pill = $('#nextPill');
  if (loading && !times) {
    grid.innerHTML = ORDER.map(n => `<div class="prayer skeleton"><b>${n}</b><span>––:––</span></div>`).join('');
    note.textContent = 'Memuatkan waktu solat…'; pill.textContent = 'Memuatkan…'; return;
  }
  if (!times) {
    grid.innerHTML = '';
    note.innerHTML = `Tidak dapat memuatkan waktu solat. <button type="button" class="linkbtn" data-act="retry">Cuba lagi</button>`;
    pill.textContent = 'Waktu solat tidak tersedia'; return;
  }
  const np = nextPrayer(times);
  grid.innerHTML = ORDER.map(n => `<div class="prayer ${n === np.name ? 'active' : ''} ${n === 'Syuruk' ? 'dim' : ''}"><b>${n}</b><span>${times.times[n]}</span></div>`).join('');
  pill.textContent = `${np.name} ${np.time}${np.tomorrow ? ' (esok)' : ''} · dalam ${fmtCountdown(np.inMin)}`;
  const src = { live: '', cache: '', stale: ' · ⚠ Anggaran: tiada sambungan, menggunakan waktu terakhir diketahui' }[times.source];
  note.textContent = `${data.settings.place} · ${METHODS.find(m => m[0] === data.settings.method)?.[1] || ''}${src}`;
  $('#hijri').textContent = times.hijri || 'Hari yang baik untuk memperbaiki diri';
}

function wireHome() {
  $('#home').addEventListener('change', e => {
    if (e.target.matches('[data-prayer]')) { day().prayers[e.target.dataset.prayer] = e.target.checked; save(); drawToday(); }
  });
  $('#home').addEventListener('click', e => { if (e.target.closest('[data-act="retry"]')) { times = null; loadTimes(); } });
  setInterval(() => {
    if (!$('#home').classList.contains('active')) return;
    if (times && dateKey() !== times.date) { times = null; renderHome(); return; } // tengah malam
    if (times) drawTimes();
  }, 30000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (times && dateKey() !== times.date) { times = null; }   // hari baharu
      if ($('#home').classList.contains('active')) renderHome();
    }
  });
}

/* ---------- Profil & tetapan ---------- */
let deferredInstall = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; if ($('#installBtn')) $('#installBtn').hidden = false; });

let profileWired = false;
function renderProfile() {
  const s = data.settings;
  const cityIdx = CITIES.findIndex(c => c[0] === s.place);
  $('#profile').innerHTML = `
    <div class="section-head"><h2>Tetapan & profil</h2></div>
    <div class="card"><label class="small" for="nameInput">Nama panggilan</label>
      <input class="field" id="nameInput" placeholder="Nama anda" maxlength="40" value="${esc(data.name)}"></div>
    <div class="card" style="margin-top:12px"><b>Lokasi & waktu solat</b>
      <label class="small" for="citySel">Bandar</label>
      <select class="field" id="citySel">
        ${cityIdx < 0 ? `<option value="gps" selected>${esc(s.place)}</option>` : ''}
        ${CITIES.map((c, i) => `<option value="${i}" ${i === cityIdx ? 'selected' : ''}>${c[0]}</option>`).join('')}
      </select>
      <button type="button" class="btn light" data-act="gps">📍 Guna lokasi semasa</button>
      <label class="small" for="methodSel" style="display:block;margin-top:12px">Kaedah pengiraan</label>
      <select class="field" id="methodSel">${METHODS.map(([id, n]) => `<option value="${id}" ${id === s.method ? 'selected' : ''}>${n}</option>`).join('')}</select>
      <p class="small">Waktu dikira melalui Aladhan API mengikut koordinat dan boleh berbeza seminit-dua daripada jadual zon rasmi. Rujuk <a href="https://www.e-solat.gov.my" target="_blank" rel="noopener">e-solat JAKIM</a> untuk waktu rasmi.</p></div>
    <div class="card" style="margin-top:12px"><b>Paparan</b>
      <select class="field" id="themeSel" aria-label="Tema">
        ${[['auto', 'Ikut peranti'], ['light', 'Cerah'], ['dark', 'Gelap']].map(([v, n]) => `<option value="${v}" ${s.theme === v ? 'selected' : ''}>${n}</option>`).join('')}
      </select>
      <button type="button" class="btn gold" id="installBtn" data-act="install" ${deferredInstall ? '' : 'hidden'}>Pasang aplikasi</button>
      <p class="small" id="iosHint" ${/iphone|ipad|ipod/i.test(navigator.userAgent) && !navigator.standalone ? '' : 'hidden'}>iPhone: ketik butang Kongsi di Safari → “Tambah ke Skrin Utama”.</p></div>
    <div class="card" style="margin-top:12px"><b>Data aplikasi</b>
      <p class="subtle">Rekod disimpan secara lokal dalam pelayar ini sahaja. Buat sandaran secara berkala.</p>
      <div class="actions"><button type="button" class="btn light" data-act="export">Export backup JSON</button>
        <label class="btn light">Import JSON<input type="file" accept="application/json" hidden id="importFile"></label>
        <button type="button" class="btn danger" data-act="reset">Padam semua data</button></div></div>
    <div class="card" style="margin-top:12px"><b>Tentang NOOR</b>
      <p class="subtle">Teman Islamik peribadi: waktu solat, doa & zikir, Quran, tasbih dan penjejak amalan. Doa dan rujukan hendaklah disemak dengan sumber berautoriti.</p></div>`;
  if (!profileWired) { profileWired = true; wireProfile(); }
}

function setLocation(place, lat, lng) {
  Object.assign(data.settings, { place, lat, lng });
  save(); times = null; renderProfile();
}

function wireProfile() {
  const root = $('#profile');
  root.addEventListener('change', e => {
    const t = e.target;
    if (t.id === 'nameInput') { data.name = t.value.trim().slice(0, 40); save(); toast('Nama disimpan'); }
    else if (t.id === 'citySel' && t.value !== 'gps') { const c = CITIES[Number(t.value)]; setLocation(c[0], c[1], c[2]); toast('Lokasi dikemas kini'); }
    else if (t.id === 'methodSel') { data.settings.method = Number(t.value); save(); times = null; toast('Kaedah dikemas kini'); }
    else if (t.id === 'themeSel') { data.settings.theme = t.value; save(); applyTheme(); }
    else if (t.id === 'importFile') importData(t);
  });
  root.addEventListener('click', async e => {
    const a = e.target.closest('[data-act]')?.dataset.act;
    if (a === 'gps') {
      if (!navigator.geolocation) return toast('Geolokasi tidak disokong');
      navigator.geolocation.getCurrentPosition(
        p => { setLocation('Lokasi semasa', +p.coords.latitude.toFixed(4), +p.coords.longitude.toFixed(4)); toast('Lokasi dikemas kini'); },
        () => toast('Tidak dapat mendapatkan lokasi — semak kebenaran'), { timeout: 10000 });
    } else if (a === 'install' && deferredInstall) {
      deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; $('#installBtn').hidden = true;
    } else if (a === 'export') {
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      Object.assign(document.createElement('a'), { href: url, download: `noor-backup-${dateKey()}.json` }).click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } else if (a === 'reset') {
      if (confirm('Padam SEMUA data (solat, amalan, refleksi, tasbih)? Tindakan ini tidak boleh dibatalkan.')) { resetAll(); times = null; applyTheme(); renderProfile(); toast('Data dipadam'); }
    }
  });
}

function importData(input) {
  const f = input.files[0];
  if (!f) return;
  if (f.size > 5e6) { toast('Fail terlalu besar'); return; }
  const r = new FileReader();
  r.onload = () => {
    try {
      const j = JSON.parse(r.result);
      if (!j || typeof j !== 'object' || Array.isArray(j)) throw new Error();
      if (!confirm('Import akan menggantikan data semasa. Teruskan?')) return;
      replaceAll(j); times = null; applyTheme(); renderProfile(); toast('Backup berjaya diimport');
    } catch { toast('Fail JSON tidak sah'); }
    input.value = '';
  };
  r.readAsText(f);
}

/* ---------- Header / mula ---------- */
function drawHeader() {
  $('#today').textContent = new Date().toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  $('#greeting').textContent = data.name ? `Salam, ${data.name}.` : 'Selamat datang.';
}
onChange(drawHeader);
drawHeader();
route();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
