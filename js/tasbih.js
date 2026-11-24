import { data, save, dateKey } from './store.js';
import { $, esc, buzz } from './util.js';

const DHIKR = [
  { id: 'Subhanallah', ar: 'سُبْحَانَ اللَّهِ', target: 33 },
  { id: 'Alhamdulillah', ar: 'الْحَمْدُ لِلَّهِ', target: 33 },
  { id: 'Allahu Akbar', ar: 'اللَّهُ أَكْبَرُ', target: 33 },
  { id: 'La ilaha illallah', ar: 'لَا إِلَهَ إِلَّا اللَّهُ', target: 100 },
  { id: 'Astaghfirullah', ar: 'أَسْتَغْفِرُ اللَّهَ', target: 100 },
  { id: 'Selawat', ar: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ', target: 100 }
];
let cur = DHIKR[0].id;
let wired = false;

const target = id => data.tasbih.targets[id] || DHIKR.find(d => d.id === id).target;
const count = id => data.tasbih.counts[id] || 0;

export function renderTasbih() {
  const root = $('#tasbih');
  if (!wired) {
    wired = true;
    root.addEventListener('click', e => {
      const t = e.target.closest('[data-act]');
      if (!t) return;
      const a = t.dataset.act;
      if (a === 'tap') {
        const before = count(cur);
        data.tasbih.counts[cur] = before + 1;
        data.tasbih.total++;
        const k = dateKey();
        data.tasbih.byDay[k] = (data.tasbih.byDay[k] || 0) + 1;
        const tg = target(cur);
        buzz(before + 1 === tg ? [60, 40, 60] : 12);
        save(); draw();
      } else if (a === 'reset') {
        data.tasbih.counts[cur] = 0; save(); draw();
      } else if (a === 'target') {
        const v = Number(prompt('Masukkan sasaran zikir', target(cur)));
        if (Number.isInteger(v) && v > 0 && v <= 100000) { data.tasbih.targets[cur] = v; save(); draw(); }
      }
    });
    root.addEventListener('change', e => { if (e.target.id === 'dhikrSelect') { cur = e.target.value; draw(); } });
  }
  draw();
}

function draw() {
  const d = DHIKR.find(x => x.id === cur);
  const c = count(cur), tg = target(cur), done = c >= tg;
  $('#tasbih').innerHTML = `
    <div class="section-head"><h2>Digital tasbih</h2><span class="subtle">Zikir dengan tenang</span></div>
    <div class="card tasbih">
      <select class="field" id="dhikrSelect" aria-label="Pilih zikir">${DHIKR.map(x => `<option ${x.id === cur ? 'selected' : ''}>${esc(x.id)}</option>`).join('')}</select>
      <div class="arabic" lang="ar" dir="rtl" style="text-align:center">${d.ar}</div>
      <div class="small">BILANGAN ZIKIR</div>
      <div class="count" aria-live="polite">${c}</div>
      <button type="button" class="tap" data-act="tap" aria-label="Tambah bilangan zikir">Sentuh<br>untuk zikir</button>
      <div class="actions" style="justify-content:center">
        <button type="button" class="btn light" data-act="reset">Reset</button>
        <button type="button" class="btn gold" data-act="target">Tetapkan sasaran</button>
      </div>
      <p class="small">Sasaran: ${tg}${done ? ' · Sasaran dicapai! ✓' : ''}</p>
      <p class="small">Hari ini: ${data.tasbih.byDay[dateKey()] || 0} · Jumlah keseluruhan: ${data.tasbih.total}</p>
    </div>`;
}
