// Pembaca Quran (teks Uthmani + terjemahan Melayu) melalui alquran.cloud + penjejak juz.
import { data, save } from './store.js';
import { $, esc, copy, getJSON, toast, toArabicDigits } from './util.js';

const API = 'https://api.alquran.cloud/v1';
const SURAH_KEY = 'noor.surahs';
let surahs = null;
let wired = false;

async function loadSurahs() {
  if (surahs) return surahs;
  try { const c = localStorage.getItem(SURAH_KEY); if (c) { surahs = JSON.parse(c); return surahs; } } catch { /* abaikan */ }
  const j = await getJSON(API + '/surah');
  surahs = j.data.map(s => ({ n: s.number, ar: s.name, en: s.englishName, tr: s.englishNameTranslation, ayahs: s.numberOfAyahs, type: s.revelationType }));
  try { localStorage.setItem(SURAH_KEY, JSON.stringify(surahs)); } catch { /* penuh */ }
  return surahs;
}

const stripMarks = s => s.replace(/[ً-ٰٟۖ-ۭـ]/g, '').replace(/[ٱ]/g, 'ا');

/** Ambil Arab + terjemahan. Jika edisi terjemahan gagal, cari edisi Melayu lain; akhir sekali Arab sahaja. */
async function loadSurah(n) {
  const ed = data.settings.translation || 'ms.basmeih';
  const get = async e => (await getJSON(`${API}/surah/${n}/editions/quran-uthmani,${e}`)).data;
  try {
    const d = await get(ed);
    return { ar: d[0].ayahs, tr: d[1].ayahs };
  } catch (e1) {
    try {
      const list = (await getJSON(`${API}/edition?format=text&language=ms&type=translation`)).data;
      if (!list?.length) throw new Error('tiada edisi');
      data.settings.translation = list[0].identifier; save();
      const d = await get(list[0].identifier);
      return { ar: d[0].ayahs, tr: d[1].ayahs };
    } catch {
      const d = (await getJSON(`${API}/surah/${n}/quran-uthmani`)).data;
      return { ar: d.ayahs, tr: [], noTr: true };
    }
  }
}

export function renderQuran(arg) {
  const root = $('#quran');
  if (!wired) { wired = true; wire(root); }
  const [n, a] = (arg || '').split('/').map(Number);
  if (n >= 1 && n <= 114) showReader(n, a);
  else showList();
}

function wire(root) {
  root.addEventListener('click', e => {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    const act = t.dataset.act;
    if (act === 'bookmark') {
      data.quran.bookmark = { surah: Number(t.dataset.s), ayah: Number(t.dataset.a) };
      save(); markBookmark(); toast('Penanda bacaan disimpan');
    } else if (act === 'copy') {
      copy(t.dataset.text);
    } else if (act === 'size') {
      data.settings.arSize = Math.min(44, Math.max(20, data.settings.arSize + Number(t.dataset.d))); save(); applySize();
    } else if (act === 'retry') {
      renderQuran(location.hash.replace(/^#quran\/?/, ''));
    }
  });
  root.addEventListener('change', e => {
    if (e.target.matches('[data-juz]')) {
      data.juz[Number(e.target.dataset.juz)] = e.target.checked; save(); drawJuz();
    }
  });
  root.addEventListener('input', e => { if (e.target.id === 'surahSearch') drawSurahRows(); });
}

const applySize = () => document.documentElement.style.setProperty('--ar-size', data.settings.arSize + 'px');
applySize();

/* ---------- Senarai surah ---------- */
async function showList() {
  const root = $('#quran');
  const bm = data.quran.bookmark;
  root.innerHTML = `
    <div class="section-head"><h2>Quran</h2><span class="subtle">Baca & jejak bacaan</span></div>
    <div id="qContinue"></div>
    <input class="search" id="surahSearch" placeholder="Cari surah (nama atau nombor)…" aria-label="Cari surah" autocomplete="off">
    <div id="surahRows"><div class="empty">Memuatkan senarai surah…</div></div>
    <div class="section-head"><h2>Jejak juz</h2><span class="subtle" id="qCount"></span></div>
    <div class="card"><div class="progress-wrap"><div class="ring" id="qRing"><b id="qPercent">0%</b></div><div><b>Perjalanan khatam</b><div class="subtle">Tandakan juz yang telah dibaca.</div></div></div></div>
    <div id="juzList" class="grid" style="margin-top:12px"></div>
    <p class="small">Teks Quran daripada <a href="https://alquran.cloud" target="_blank" rel="noopener">Al Quran Cloud</a> (Uthmani). Terjemahan Melayu: edisi Basmeih. Sentiasa rujuk mushaf yang sahih.</p>`;
  drawJuz();
  try {
    await loadSurahs();
    if (bm) {
      const s = surahs.find(x => x.n === bm.surah);
      if (s) $('#qContinue').innerHTML = `<a class="card continue" href="#quran/${bm.surah}/${bm.ayah}"><span class="eyebrow gold">SAMBUNG BACAAN</span><b>${esc(s.en)} · ayat ${bm.ayah}</b><span class="subtle">Ketik untuk sambung</span></a>`;
    }
    drawSurahRows();
  } catch {
    $('#surahRows').innerHTML = `<div class="empty">Tidak dapat memuatkan senarai surah. Semak sambungan internet.<br><button type="button" class="btn light" data-act="retry" style="margin-top:10px">Cuba lagi</button></div>`;
  }
}

function drawSurahRows() {
  const el = $('#surahRows');
  if (!el || !surahs) return;
  const q = ($('#surahSearch')?.value || '').trim().toLowerCase();
  const rows = surahs.filter(s => !q || String(s.n) === q || `${s.en} ${s.tr} ${stripMarks(s.ar)}`.toLowerCase().includes(q));
  el.innerHTML = rows.map(s => `
    <a class="surah-row" href="#quran/${s.n}">
      <span class="num">${s.n}</span>
      <span class="sname"><b>${esc(s.en)}</b><small>${esc(s.tr)} · ${s.ayahs} ayat · ${s.type === 'Meccan' ? 'Makkiyyah' : 'Madaniyyah'}</small></span>
      <span class="arabic-sm" lang="ar" dir="rtl">${esc(s.ar.replace(/^سُورَةُ\s*/, ''))}</span>
    </a>`).join('') || '<div class="empty">Tiada surah dijumpai.</div>';
}

function drawJuz() {
  if (!$('#juzList')) return;
  const n = data.juz.filter(Boolean).length, p = Math.round(n / 30 * 100);
  $('#qCount').textContent = `${n} / 30 juz`;
  $('#qPercent').textContent = p + '%';
  $('#qRing').style.setProperty('--p', p + '%');
  $('#juzList').innerHTML = data.juz.map((v, i) => `
    <label class="item row"><input type="checkbox" data-juz="${i}" ${v ? 'checked' : ''}><span>Juz ${i + 1}</span><span class="small" style="margin-left:auto">${v ? 'Selesai' : 'Belum'}</span></label>`).join('');
}

/* ---------- Pembaca ---------- */
async function showReader(n, focusAyah) {
  const root = $('#quran');
  root.innerHTML = `<a class="back" href="#quran">← Senarai surah</a><div class="empty" id="rBody">Memuatkan surah…</div>`;
  try {
    const [list, body] = await Promise.all([loadSurahs(), loadSurah(n)]);
    if (!location.hash.startsWith('#quran/' + n)) return; // pengguna sudah beralih
    const s = list.find(x => x.n === n);
    const bm = data.quran.bookmark;
    const ayahs = body.ar.map((a, i) => {
      let text = a.text;
      if (a.numberInSurah === 1 && n !== 1 && n !== 9) {
        const words = text.split(' ');
        if (stripMarks(words[0]) === 'بسم' && words.length > 4) text = words.slice(4).join(' ');
      }
      return { n: a.numberInSurah, ar: text, tr: body.tr[i]?.text || '', juz: a.juz };
    });
    root.innerHTML = `
      <a class="back" href="#quran">← Senarai surah</a>
      <div class="card reader-head">
        <div class="arabic" lang="ar" dir="rtl" style="text-align:center;margin:0">${esc(s.ar)}</div>
        <b>${n}. ${esc(s.en)}</b>
        <div class="subtle">${esc(s.tr)} · ${s.ayahs} ayat · ${s.type === 'Meccan' ? 'Makkiyyah' : 'Madaniyyah'}</div>
        <div class="actions" style="justify-content:center">
          <button type="button" class="btn light" data-act="size" data-d="-2" aria-label="Kecilkan tulisan">A−</button>
          <button type="button" class="btn light" data-act="size" data-d="2" aria-label="Besarkan tulisan">A+</button>
        </div>
      </div>
      ${n !== 1 && n !== 9 ? '<div class="arabic bismillah" lang="ar" dir="rtl">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>' : ''}
      ${body.noTr ? '<p class="small">Terjemahan tidak dapat dimuatkan — memaparkan teks Arab sahaja.</p>' : ''}
      <div id="ayahs">${ayahs.map(a => `
        <article class="ayah" id="a${a.n}">
          <div class="ayah-ar arabic" lang="ar" dir="rtl">${esc(a.ar)} <span class="end">﴿${toArabicDigits(a.n)}﴾</span></div>
          ${a.tr ? `<p class="trans">${esc(a.tr)}</p>` : ''}
          <div class="ayah-bar"><span class="small">${n}:${a.n} · Juz ${a.juz}</span>
            <span>
              <button type="button" class="chip ${bm && bm.surah === n && bm.ayah === a.n ? 'on' : ''}" data-act="bookmark" data-s="${n}" data-a="${a.n}" aria-label="Tanda bacaan ayat ${a.n}">🔖</button>
              <button type="button" class="chip" data-act="copy" data-text="${esc(`${a.ar}\n${a.tr}\n(${s.en} ${n}:${a.n})`)}" aria-label="Salin ayat ${a.n}">⧉</button>
            </span></div>
        </article>`).join('')}</div>
      <div class="actions" style="justify-content:space-between;margin:18px 0">
        ${n > 1 ? `<a class="btn light" href="#quran/${n - 1}">← Surah sebelum</a>` : '<span></span>'}
        ${n < 114 ? `<a class="btn" href="#quran/${n + 1}">Surah seterusnya →</a>` : ''}
      </div>`;
    applySize();
    if (focusAyah) document.getElementById('a' + focusAyah)?.scrollIntoView({ block: 'center' });
  } catch {
    root.innerHTML = `<a class="back" href="#quran">← Senarai surah</a><div class="empty">Tidak dapat memuatkan surah ini. Surah yang pernah dibuka akan tersedia luar talian.<br><button type="button" class="btn light" data-act="retry" style="margin-top:10px">Cuba lagi</button></div>`;
  }
}

function markBookmark() {
  const bm = data.quran.bookmark;
  document.querySelectorAll('#ayahs .chip[data-act="bookmark"]').forEach(b => {
    b.classList.toggle('on', !!bm && Number(b.dataset.s) === bm.surah && Number(b.dataset.a) === bm.ayah);
  });
}
