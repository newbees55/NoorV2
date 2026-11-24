// Arah kiblat: pengiraan bearing bulatan besar ke Kaabah + kompas peranti (jika disokong).
import { data } from './store.js';
import { $, toast } from './util.js';

const KAABA = { lat: 21.4225, lng: 39.8262 };
const rad = d => d * Math.PI / 180;

export function qiblaBearing(lat, lng) {
  const dl = rad(KAABA.lng - lng);
  const y = Math.sin(dl) * Math.cos(rad(KAABA.lat));
  const x = Math.cos(rad(lat)) * Math.sin(rad(KAABA.lat)) - Math.sin(rad(lat)) * Math.cos(rad(KAABA.lat)) * Math.cos(dl);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

const DIRS = ['Utara', 'Timur Laut', 'Timur', 'Tenggara', 'Selatan', 'Barat Daya', 'Barat', 'Barat Laut'];
const dirName = deg => DIRS[Math.round(deg / 45) % 8];

let listening = false;

export function renderQibla(el) {
  const q = qiblaBearing(data.settings.lat, data.settings.lng);
  el.innerHTML = `
    <div class="qibla">
      <svg viewBox="0 0 120 120" class="qdial" role="img" aria-label="Kompas kiblat">
        <circle cx="60" cy="60" r="56" class="qring"/>
        <text x="60" y="15" text-anchor="middle" class="qn">U</text>
        <g id="qneedle" style="transform-origin:60px 60px;transform:rotate(${q}deg)">
          <path d="M60 20 L68 60 L60 54 L52 60 Z" class="qarrow"/>
          <circle cx="60" cy="60" r="4" class="qhub"/>
        </g>
      </svg>
      <div>
        <div class="eyebrow gold">ARAH KIBLAT</div>
        <b style="font-size:22px">${Math.round(q)}°</b> <span class="subtle">dari Utara · ${dirName(q)}</span>
        <div class="subtle" style="margin:4px 0 10px">Dikira untuk ${data.settings.place}.</div>
        <button class="btn light" id="compassBtn" type="button">Hidupkan kompas</button>
      </div>
    </div>`;
  $('#compassBtn', el).addEventListener('click', async () => {
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        const r = await DeviceOrientationEvent.requestPermission();
        if (r !== 'granted') throw new Error('ditolak');
      }
      if (!('ondeviceorientation' in window)) throw new Error('tiada sensor');
      if (!listening) {
        listening = true;
        const needle = () => $('#qneedle');
        const set = h => { const n = needle(); if (n) n.style.transform = `rotate(${qiblaBearing(data.settings.lat, data.settings.lng) - h}deg)`; };
        addEventListener('deviceorientationabsolute', e => { if (e.alpha != null) set(360 - e.alpha); }, true);
        addEventListener('deviceorientation', e => { if (e.webkitCompassHeading != null) set(e.webkitCompassHeading); }, true);
      }
      toast('Kompas dihidupkan — pegang telefon mendatar');
    } catch {
      toast('Kompas tidak tersedia pada peranti ini');
    }
  });
}
