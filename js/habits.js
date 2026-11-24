import { data, save, dateKey, day, prayersDone, streak, PRAYERS } from './store.js';
import { $, esc } from './util.js';

let wired = false;

export function renderHabits() {
  const root = $('#habits');
  if (!wired) {
    wired = true;
    root.addEventListener('change', e => {
      const t = e.target;
      if (t.matches('[data-habit]')) { day().habits[t.dataset.habit] = t.checked; save(); draw(); }
      else if (t.matches('[data-prayer]')) { day().prayers[t.dataset.prayer] = t.checked; save(); draw(); }
    });
    root.addEventListener('click', e => {
      const t = e.target.closest('[data-act]');
      if (!t) return;
      if (t.dataset.act === 'add') addHabit();
      else if (t.dataset.act === 'del') {
        const h = data.habits[Number(t.dataset.i)];
        if (h && confirm(`Buang amalan “${h}”?`)) { data.habits.splice(Number(t.dataset.i), 1); save(); draw(); }
      } else if (t.dataset.act === 'journal') {
        data.journal[dateKey()] = $('#journal').value.trim();
        if (!data.journal[dateKey()]) delete data.journal[dateKey()];
        save(); draw(); $('#saved').textContent = ' Disimpan pada peranti ini.';
      }
    });
    root.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'newHabit') addHabit(); });
  }
  draw();
}

function addHabit() {
  const el = $('#newHabit');
  const n = el.value.trim().slice(0, 60);
  if (!n || data.habits.includes(n)) return;
  data.habits.push(n); save(); draw();
  $('#newHabit').focus();
}

function weekStrip() {
  const out = [];
  const d = new Date();
  d.setDate(d.getDate() - 6);
  for (let i = 0; i < 7; i++) {
    const k = dateKey(d), n = prayersDone(k);
    out.push(`<div class="wd ${n === 5 ? 'full' : n ? 'part' : ''}"><small>${d.toLocaleDateString('ms-MY', { weekday: 'short' })}</small><b>${n}/5</b></div>`);
    d.setDate(d.getDate() + 1);
  }
  return out.join('');
}

function draw() {
  const root = $('#habits');
  const keepAdd = $('#newHabit')?.value || '';
  const keepJournal = $('#journal')?.value;
  const today = dateKey();
  const dd = data.days[today] || { prayers: {}, habits: {} };
  const s = streak();
  const past = Object.keys(data.journal).filter(k => k !== today).sort().reverse().slice(0, 14);
  root.innerHTML = `
    <div class="section-head"><h2>Amalan harian</h2><span class="subtle">Bina rutin sedikit demi sedikit</span></div>
    <div class="card">
      <b>Solat fardu hari ini</b>
      ${PRAYERS.map(p => `<label class="checkrow"><input type="checkbox" data-prayer="${p}" ${dd.prayers[p] ? 'checked' : ''}><span>${p}</span></label>`).join('')}
      <div class="week" aria-label="7 hari lepas">${weekStrip()}</div>
      <div class="subtle" style="margin-top:8px">${s ? `🔥 ${s} hari berturut-turut lengkap 5 waktu` : 'Mulakan rantaian anda hari ini.'}</div>
    </div>
    <div class="card" style="margin-top:12px"><b>Checklist amalan</b>
      <p class="subtle">Tandakan apabila selesai. Rekod disimpan pada peranti ini.</p>
      <div>${data.habits.map((h, i) => `
        <div class="checkrow"><input type="checkbox" id="h${i}" data-habit="${esc(h)}" ${dd.habits[h] ? 'checked' : ''}>
          <label for="h${i}" style="flex:1">${esc(h)}</label>
          <button type="button" class="chip" data-act="del" data-i="${i}" aria-label="Buang ${esc(h)}">✕</button></div>`).join('') || '<div class="empty">Tiada amalan. Tambah satu di bawah.</div>'}</div>
      <div class="actions"><input class="field" id="newHabit" placeholder="Tambah amalan sendiri" maxlength="60" style="flex:1;margin:0" value="${esc(keepAdd)}"><button type="button" class="btn" data-act="add">Tambah</button></div>
    </div>
    <div class="section-head"><h2>Muhasabah diri</h2></div>
    <div class="card">
      <label class="small" for="journal">Apa satu perkara baik hari ini?</label>
      <textarea id="journal" class="field" rows="4" maxlength="2000" placeholder="Tulis refleksi ringkas…">${esc(keepJournal ?? data.journal[today] ?? '')}</textarea>
      <button type="button" class="btn" data-act="journal">Simpan refleksi</button><span class="small" id="saved"></span>
    </div>
    ${past.length ? `<div class="section-head"><h2>Refleksi lepas</h2></div>${past.map(k => `
      <details class="item"><summary>${new Date(k + 'T00:00').toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long' })}</summary><p style="white-space:pre-wrap">${esc(data.journal[k])}</p></details>`).join('')}` : ''}`;
}
