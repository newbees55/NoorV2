import { $, esc, copy } from './util.js';

// PENTING: Semak teks Arab, terjemahan dan rujukan dengan sumber berautoriti / ustaz sebelum penerbitan awam.
export const DUAS = [
  { cat: ['Pagi'], title: 'Doa bangun tidur',
    ar: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
    tr: 'Alhamdu lillahil-lazi ahyana ba’da ma amatana wa ilaihin-nusyur.',
    ms: 'Segala puji bagi Allah yang menghidupkan kami selepas mematikan kami, dan kepada-Nya tempat kembali.',
    ref: 'Sahih al-Bukhari 6312' },
  { cat: ['Pagi', 'Petang'], title: 'Sayyidul Istighfar',
    ar: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
    tr: 'Allahumma anta rabbi la ilaha illa anta, khalaqtani wa ana ‘abduka, wa ana ‘ala ‘ahdika wa wa‘dika mastata‘tu, a‘uzu bika min syarri ma sana‘tu, abu’u laka bini‘matika ‘alayya, wa abu’u bizanbi faghfir li, fa innahu la yaghfiruz-zunuba illa anta.',
    ms: 'Ya Allah, Engkau Tuhanku, tiada tuhan melainkan Engkau. Engkau menciptakan aku dan aku hamba-Mu; aku berpegang pada janji-Mu setakat kemampuanku. Aku berlindung dengan-Mu daripada keburukan perbuatanku. Aku mengakui nikmat-Mu ke atasku dan aku mengakui dosaku, maka ampunilah aku, kerana tiada yang mengampunkan dosa melainkan Engkau.',
    ref: 'Sahih al-Bukhari 6306' },
  { cat: ['Pagi', 'Petang', 'Tidur', 'Solat'], title: 'Ayat Kursi',
    ar: 'اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',
    tr: '',
    ms: 'Allah, tiada tuhan melainkan Dia, Yang Maha Hidup, Yang Maha Berdiri sendiri. Dia tidak mengantuk dan tidak tidur. Kepunyaan-Nya apa yang di langit dan di bumi. Siapakah yang dapat memberi syafaat di sisi-Nya melainkan dengan izin-Nya? Dia mengetahui apa yang di hadapan mereka dan di belakang mereka, dan mereka tidak mengetahui sesuatu pun daripada ilmu-Nya melainkan apa yang Dia kehendaki. Kursi-Nya meliputi langit dan bumi, dan Dia tidak berasa berat memelihara keduanya. Dialah Yang Maha Tinggi, Maha Agung.',
    ref: 'Al-Quran, al-Baqarah 2:255', links: [['Baca dalam Quran', '#quran/2/255']] },
  { cat: ['Pagi', 'Petang', 'Tidur'], title: 'Al-Ikhlas, Al-Falaq & An-Nas',
    ar: '', tr: '',
    ms: 'Dibaca tiga kali pada waktu pagi dan petang, dan sebelum tidur dibaca dengan meniup pada kedua-dua tapak tangan lalu disapu ke badan.',
    ref: 'Sunan Abi Dawud 5082; Jami‘ at-Tirmidhi 3575; Sahih al-Bukhari 5017',
    links: [['Al-Ikhlas', '#quran/112'], ['Al-Falaq', '#quran/113'], ['An-Nas', '#quran/114']] },
  { cat: ['Tidur'], title: 'Doa sebelum tidur',
    ar: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
    tr: 'Bismika Allahumma amutu wa ahya.',
    ms: 'Dengan nama-Mu ya Allah, aku mati dan aku hidup.',
    ref: 'Sahih al-Bukhari 6324' },
  { cat: ['Solat'], title: 'Istighfar selepas solat',
    ar: 'أَسْتَغْفِرُ اللَّهَ',
    tr: 'Astaghfirullah.',
    ms: 'Aku memohon keampunan daripada Allah. Dibaca tiga kali selepas salam.',
    ref: 'Sahih Muslim 591' },
  { cat: ['Solat'], title: 'Doa selepas salam',
    ar: 'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
    tr: 'Allahumma antas-salam wa minkas-salam tabarakta ya zal-jalali wal-ikram.',
    ms: 'Ya Allah, Engkaulah kesejahteraan dan daripada-Mu kesejahteraan. Maha Berkat Engkau, wahai Tuhan yang mempunyai kebesaran dan kemuliaan.',
    ref: 'Sahih Muslim 591' },
  { cat: ['Solat'], title: 'Tasbih, tahmid & takbir selepas solat',
    ar: 'سُبْحَانَ اللَّهِ ، الْحَمْدُ لِلَّهِ ، اللَّهُ أَكْبَرُ',
    tr: 'Subhanallah, Alhamdulillah, Allahu Akbar.',
    ms: 'Maha Suci Allah, segala puji bagi Allah, Allah Maha Besar. Masing-masing dibaca 33 kali selepas solat fardu.',
    ref: 'Sahih Muslim 595', links: [['Buka tasbih', '#tasbih']] },
  { cat: ['Harian'], title: 'Doa memohon kebaikan dunia dan akhirat',
    ar: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    tr: 'Rabbana atina fid-dunya hasanah wa fil-akhirati hasanah waqina azaban-nar.',
    ms: 'Wahai Tuhan kami, berikanlah kami kebaikan di dunia dan kebaikan di akhirat, serta peliharalah kami daripada azab neraka.',
    ref: 'Al-Quran, al-Baqarah 2:201' },
  { cat: ['Harian'], title: 'Doa untuk ibu bapa',
    ar: 'رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا',
    tr: 'Rabbir-hamhuma kama rabbayani saghira.',
    ms: 'Wahai Tuhanku, rahmatilah mereka berdua sebagaimana mereka telah mendidikku ketika kecil.',
    ref: 'Al-Quran, al-Isra’ 17:24' },
  { cat: ['Harian'], title: 'Doa memohon tambahan ilmu',
    ar: 'رَبِّ زِدْنِي عِلْمًا',
    tr: 'Rabbi zidni ‘ilma.',
    ms: 'Wahai Tuhanku, tambahkanlah ilmu kepadaku.',
    ref: 'Al-Quran, Taha 20:114' },
  { cat: ['Harian'], title: 'Doa keluar rumah',
    ar: 'بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    tr: 'Bismillah, tawakkaltu ‘alallah, wa la hawla wa la quwwata illa billah.',
    ms: 'Dengan nama Allah, aku bertawakal kepada Allah, tiada daya dan kekuatan melainkan dengan Allah.',
    ref: 'Sunan Abi Dawud 5095; Jami‘ at-Tirmidhi 3426' },
  { cat: ['Harian'], title: 'Doa sebelum makan',
    ar: 'بِسْمِ اللَّهِ',
    tr: 'Bismillah.',
    ms: 'Dengan nama Allah. Jika terlupa di awal, sebut: “Bismillahi awwalahu wa akhirahu”.',
    ref: 'Sunan Abi Dawud 3767' },
  { cat: ['Harian'], title: 'Doa masuk tandas',
    ar: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ',
    tr: 'Allahumma inni a‘uzu bika minal-khubusi wal-khaba’ith.',
    ms: 'Ya Allah, aku berlindung dengan-Mu daripada syaitan lelaki dan syaitan perempuan.',
    ref: 'Sahih al-Bukhari 142; Sahih Muslim 375' }
];

export const DUA_CATS = ['Semua', 'Pagi', 'Petang', 'Tidur', 'Solat', 'Harian'];
let cat = 'Semua';
let wired = false;

export function renderDuas(arg) {
  const root = $('#duas');
  if (arg && DUA_CATS.includes(decodeURIComponent(arg))) cat = decodeURIComponent(arg);
  if (!wired) {
    wired = true;
    root.addEventListener('click', e => {
      const t = e.target.closest('[data-cat],[data-copy]');
      if (!t) return;
      if (t.dataset.cat) { cat = t.dataset.cat; draw(); }
      else {
        const d = DUAS[Number(t.dataset.i)];
        copy(t.dataset.copy === 'ar' ? d.ar : `${d.title}\n${d.ar}\n${d.ms}\n(${d.ref})`);
      }
    });
    $('#duaSearch').addEventListener('input', draw);
  }
  draw();
}

function draw() {
  $('#duaTabs').innerHTML = DUA_CATS.map(c => `<button type="button" class="${cat === c ? 'active' : ''}" data-cat="${c}">${c}</button>`).join('');
  const q = $('#duaSearch').value.trim().toLowerCase();
  const rows = DUAS.map((d, i) => [d, i]).filter(([d]) =>
    (cat === 'Semua' || d.cat.includes(cat)) && `${d.title} ${d.ms} ${d.tr} ${d.cat.join(' ')}`.toLowerCase().includes(q));
  $('#duaList').innerHTML = rows.map(([d, i]) => `
    <article class="item">
      <div class="small">${d.cat.join(' · ').toUpperCase()}</div>
      <h3>${esc(d.title)}</h3>
      ${d.ar ? `<div class="arabic" dir="rtl" lang="ar">${esc(d.ar)}</div>` : ''}
      ${d.tr ? `<p class="trans">${esc(d.tr)}</p>` : ''}
      <p>${esc(d.ms)}</p>
      <div class="small">Rujukan: ${esc(d.ref)}</div>
      <div class="actions">
        ${d.ar ? `<button type="button" class="btn light" data-copy="ar" data-i="${i}">Salin Arab</button>` : ''}
        <button type="button" class="btn gold" data-copy="all" data-i="${i}">Salin maksud</button>
        ${(d.links || []).map(([l, h]) => `<a class="btn light" href="${h}">${esc(l)}</a>`).join('')}
      </div>
    </article>`).join('') || '<div class="empty">Tiada doa dijumpai.</div>';
}
