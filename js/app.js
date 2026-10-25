// ===== Util =====
const $ = s => document.querySelector(s), view = () => $('#view');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rp = n => 'Rp ' + new Intl.NumberFormat('id-ID').format(Number(n) || 0);
const S = { user: JSON.parse(sessionStorage.getItem('usr') || 'null'), pub: null, role: sessionStorage.getItem('role') || 'semua' };
const SALAT = ['Subuh', 'Zuhur', 'Asar', 'Magrib', 'Isya'];
const ROLES = { admin: 'Admin', ketua: 'Ketua DKM', bendahara: 'Bendahara', sekretaris: 'Sekretaris', bidang: 'Pengurus Bidang', tv: 'Petugas TV' };
const TEMA = { biru: ['Putih & Biru', '#0B4F8A', '#1E9BF0'], hijau: ['Hijau Tua & Muda', '#14532D', '#4ADE80'], maroon: ['Maroon & Gold', '#7F1D1D', '#C9A227'], dark: ['Dark & Gold', '#0B1220', '#C9A227'] };
const IZ = { dashboard: ['admin', 'ketua', 'bendahara', 'sekretaris', 'bidang'], keuangan: ['admin', 'ketua', 'bendahara'], laporan: ['admin', 'ketua', 'bendahara'], agenda: ['admin', 'ketua', 'sekretaris', 'bidang'], pengumuman: ['admin', 'ketua', 'sekretaris'], rapat: ['admin', 'ketua', 'sekretaris'], pengguna: ['admin'], pengaturan: ['admin'], tvset: ['admin', 'tv'], log: ['admin'] };
const aktifRoles = () => S.user ? (S.role !== 'semua' && S.user.peran.includes(S.role) ? [S.role] : S.user.peran) : [];
const can = k => aktifRoles().some(r => IZ[k].includes(r));
const cfg = () => (S.pub && S.pub.cfg) || (Cache.get('publik') || {}).cfg || {};
const img = (id, w) => id ? 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w' + (w || 800) : '';
const av = u => u.foto ? `<img class="av" src="${img(u.foto, 128)}" alt="">` : `<span class="av">${esc((u.nama || '?')[0])}</span>`;
const skel = () => view().innerHTML = '<div class="skel"></div><div class="skel"></div><div class="skel"></div>';
const cv = n => getComputedStyle(document.body).getPropertyValue(n).trim();
let timer;
function toast(m, t = 'ok') { const e = $('#toast'); e.textContent = m; e.className = 'toast show ' + t; setTimeout(() => e.className = 'toast', 3500); }
function wibSec() {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).formatToParts(new Date());
  const g = t => +p.find(x => x.type === t).value; return (g('hour') % 24) * 3600 + g('minute') * 60 + g('second');
}
const hms = s => [Math.floor(s / 3600), Math.floor(s % 3600 / 60), s % 60].map(x => String(x).padStart(2, '0')).join(':');
const hm = s => hms(s % 86400).slice(0, 5);
const toSec = t => { const [h, m] = t.split(':'); return h * 3600 + m * 60; };
const libs = {};
const lib = u => libs[u] || (libs[u] = new Promise((ok, no) => { const s = document.createElement('script'); s.src = u; s.onload = ok; s.onerror = () => { delete libs[u]; no(new Error('Gagal memuat pustaka, periksa internet')); }; document.head.appendChild(s); }));
const CH = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js', PDF = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
const kompres = (f, mx) => new Promise((ok, no) => { const im = new Image(), r = new FileReader(); r.onload = () => { im.onload = () => { const s = Math.min(1, (mx || 1024) / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = im.width * s; c.height = im.height * s; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); ok({ mime: 'image/jpeg', data: c.toDataURL('image/jpeg', .72).split(',')[1] }); }; im.onerror = () => no(new Error('File harus berupa gambar')); im.src = r.result; }; r.readAsDataURL(f); });
async function up(f, sub, mx) { // unggah foto/PDF ke Drive, kembalikan ID
  const b = f.type === 'application/pdf' ? { mime: f.type, data: await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result.split(',')[1]); fr.readAsDataURL(f); }) } : await kompres(f, mx);
  return (await Api._post('uploadFoto', Object.assign({ sub: sub }, b))).id;
}
async function loadPub() { if (!S.pub) { try { S.pub = await Api.get('publik'); } catch (e) { S.pub = { jadwal: null, agenda: [], pengumuman: [], cfg: {} }; toast(e.message, 'err'); } } return S.pub; }
function authErr(e) { toast(e.message, 'err'); if (/login|kedaluwarsa|valid/i.test(e.message)) { sessionStorage.clear(); Cache.clear(); S.user = null; location.hash = '#/login'; route(); } }
const needAuth = k => { if (!can(k)) { location.hash = S.user ? '#/' : '#/login'; return false; } return true; };
const badge = s => `<span class="bdg ${{ Disetujui: 'ok', Menunggu: 'wait', Ditolak: 'no' }[s] || ''}">${esc(s)}</span>`;
const stat = (l, v, c = '', i = '') => `<div class="card stat ${c}"><i class="ic">${i}</i><div><small>${l}</small><b class="mono">${v}</b></div></div>`;
const gdrive = id => 'https://drive.google.com/file/d/' + encodeURIComponent(id) + '/view';
const masjidSvg = () => '<svg viewBox="0 0 400 200" fill="currentColor" aria-hidden="true"><rect x="40" y="40" width="14" height="150"/><polygon points="47,10 55,40 39,40"/><rect x="346" y="60" width="12" height="130"/><polygon points="352,32 360,60 344,60"/><path d="M130 190V120a70 70 0 0 1 140 0v70z"/><rect x="196" y="40" width="8" height="22"/><circle cx="200" cy="36" r="6"/><rect x="90" y="150" width="220" height="40"/><path d="M100 190v-22a12 12 0 0 1 24 0v22zM150 190v-22a12 12 0 0 1 24 0v22zM226 190v-22a12 12 0 0 1 24 0v22zM276 190v-22a12 12 0 0 1 24 0v22z" fill="#fff" fill-opacity=".35"/><rect x="0" y="190" width="400" height="10"/></svg>';
const tema = () => { const h = location.hash.indexOf('#/tv') === 0, c = cfg(); document.body.dataset.tema = (h ? (c.tv || {}).tema : c.tema) || 'biru'; };

// ===== PDF & cetak (laporan, notulen) =====
const kop = () => `<div class="prh"><img src="img/logo.png" alt=""><div><h2>${esc(cfg().nama || 'Masjid Al-Jamaal')}</h2><p>${esc(cfg().alamat || 'Perum. Gading Elok Blok I, Karawang')}</p></div></div><hr>`;
async function hardcopy(html, nama, mode) { // mode: pdf | share | print
  const pp = $('#pp'); pp.innerHTML = `<div class="paper">${kop()}${html}</div>`;
  if (mode === 'print') { document.body.classList.add('pp'); window.print(); document.body.classList.remove('pp'); return; }
  try {
    toast('Menyiapkan PDF…'); await lib(PDF);
    const b = await html2pdf().set({ margin: 10, image: { type: 'jpeg', quality: .95 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4' } }).from(pp.firstChild).outputPdf('blob'), f = new File([b], nama, { type: 'application/pdf' });
    if (mode === 'share' && navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: nama }); return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = nama; a.click();
    if (mode === 'share') { toast('PDF terunduh — lampirkan ke WhatsApp'); window.open('https://wa.me/?text=' + encodeURIComponent('Terlampir: ' + nama)); } else toast('PDF tersimpan ✓');
  } catch (e) { if (e.name !== 'AbortError') toast(e.message || 'Gagal membuat PDF', 'err'); }
}

// ===== Navigasi (publik: menu atas; pengurus: sidebar terstruktur) =====
function nav() {
  const h = (location.hash.replace('#/', '') || '').split('?')[0], u = S.user;
  document.body.classList.toggle('staff', !!u && h !== 'tv');
  const a = (k, l, i) => `<a href="#/${k}" class="${h === k ? 'on' : ''}">${i ? '<i>' + i + '</i>' : ''}${l}</a>`;
  $('#menu').innerHTML = a('', 'Beranda') + a('jadwal', 'Jadwal Salat') + a('agenda', 'Agenda') + a('info', 'Pengumuman') + a('tv', 'Layar TV') + (u ? '' : a('login', 'Login Pengurus'));
  const g = (t, items) => { const x = items.filter(i => !i[3] || can(i[3])).map(i => a(i[0], i[1], i[2])).join(''); return x ? `<small>${t}</small>${x}` : ''; };
  $('#side').innerHTML = u ? `<div class="me">${av(u)}<div><b>${esc(u.nama)}</b><small>${esc(aktifRoles().map(r => ROLES[r] || r).join(' + '))}</small></div></div>` +
    (u.peran.length > 1 ? `<select id="rl" class="rl"><option value="semua">Semua peran saya</option>${u.peran.map(r => `<option value="${r}" ${S.role === r ? 'selected' : ''}>Sebagai ${ROLES[r] || r}</option>`).join('')}</select>` : '') +
    g('UTAMA', [['', 'Beranda', '🏠'], ['dashboard', 'Dashboard', '📊', 'dashboard'], ['jadwal', 'Jadwal Salat', '🕌']]) + g('KEUANGAN', [['keuangan', 'Keuangan', '💰', 'keuangan'], ['laporan', 'Laporan', '🧾', 'laporan']]) +
    g('KEGIATAN', [['agenda', 'Agenda', '📅'], ['info', 'Pengumuman', '📣'], ['rapat', 'Rapat & Notulen', '📝', 'rapat']]) + g('LAYAR TV', [['tv', 'Buka Layar TV', '📺'], ['tvset', 'Pengaturan TV', '⚙️', 'tvset']]) +
    g('ADMIN', [['pengguna', 'Pengguna', '👥', 'pengguna'], ['pengaturan', 'Tampilan & Identitas', '🎨', 'pengaturan'], ['log', 'Log Aktivitas', '🕘', 'log']]) + `<small>AKUN</small>${a('profil', 'Profil Saya', '🙍')}<button class="btn ghost out" id="out">Keluar</button>` : '';
  $('#out')?.addEventListener('click', () => { sessionStorage.clear(); Cache.clear(); S.user = null; S.role = 'semua'; location.hash = '#/'; route(); });
  $('#rl')?.addEventListener('change', e => { S.role = e.target.value; sessionStorage.setItem('role', S.role); route(); });
}

// ===== Halaman publik =====
const agCard = x => `<article class="card pc hv">${x.foto ? `<img loading="lazy" src="${img(x.foto, 600)}" alt="">` : ''}<div class="pb"><span class="tag">${esc(x.kategori)}</span> <small class="muted mono">${esc(x.tanggal)} ${esc(x.waktu)}</small><h3>${esc(x.nama)}</h3><p>📍 ${esc(x.lokasi)} · ${esc(x.pj)}</p></div></article>`;
const pgCard = x => `<article class="card pc hv">${x.foto ? `<img loading="lazy" src="${img(x.foto, 600)}" alt="">` : ''}<div class="pb"><span class="tag">${esc(x.kategori)}</span> <small class="muted mono">${esc(x.tanggal)}</small><h3>${esc(x.judul)}</h3><p>${esc(x.isi)}</p></div></article>`;
async function vBeranda() {
  skel(); const p = await loadPub(), j = p.jadwal, c = p.cfg || {};
  const bg = c.hero ? `background-image:linear-gradient(100deg,var(--ov) 30%,transparent 90%),url(${img(c.hero, 1600)})` : '';
  view().innerHTML = `<section class="hero" style="${bg}">${c.hero ? '' : '<div class="tvart">' + masjidSvg() + '</div>'}<div class="hin"><span class="tag">${j ? esc(j.hijriah) : 'Assalamu\'alaikum'}</span><h1>${esc(c.nama || 'Masjid Al-Jamaal')}</h1><p class="muted">${esc(c.alamat || 'Perum. Gading Elok Blok I, Karawang')}</p><div class="clock mono" id="clk">--:--:--</div></div>
  <div class="card next"><small>SALAT BERIKUTNYA</small><h2 id="nx">—</h2><div class="count mono" id="cd">--:--:--</div></div></section>
  <h3 class="sec">Jadwal Salat Hari Ini</h3>${j ? `<div class="grid5">${SALAT.map(s => `<div class="card pr" data-s="${s}"><small>${s}</small><b class="mono">${j.waktu[s]}</b><small class="muted mono">iqamah ${hm(toSec(j.waktu[s]) + (IQ[s] || 10) * 60)}</small></div>`).join('')}</div><p class="muted mono">Imsak ${j.waktu.Imsak} · Syuruq ${j.waktu.Syuruq} · Metode Kemenag RI</p>` : '<p class="empty">Jadwal belum tersedia. Muat ulang beberapa saat lagi.</p>'}
  ${(p.pengumuman || []).length ? `<h3 class="sec">Pengumuman Terbaru</h3><div class="grid3">${p.pengumuman.slice(0, 3).map(pgCard).join('')}</div>` : ''}
  ${(p.agenda || []).length ? `<h3 class="sec">Agenda Mendatang</h3><div class="grid3">${p.agenda.slice(0, 6).map(agCard).join('')}</div>` : ''}
  <div class="card next" style="margin-top:28px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><div><h3>Layar Informasi Masjid (TV)</h3><small>Jadwal salat, pengumuman, dan agenda tampil langsung.</small></div><a class="btn ghost" style="background:var(--on);color:var(--p)" href="#/tv">Buka Layar TV</a></div>`;
  runClock(j);
}
async function vInfo() {
  skel(); const p = await loadPub(), f = can('pengumuman') ? `<form id="fp" class="card form"><h3>Buat Pengumuman</h3><label>Judul *<input name="judul" required></label><label>Kategori<input name="kategori" placeholder="Kegiatan"></label><label class="wide">Isi *<textarea name="isi" rows="3" required></textarea></label><label>Foto (opsional)<input type="file" name="f" accept="image/*"></label><button class="btn">Terbitkan</button></form>` : '';
  view().innerHTML = `<h1 class="pt">Pengumuman</h1>${f}<div class="grid3">${(p.pengumuman || []).map(pgCard).join('') || '<p class="empty">Belum ada pengumuman.</p>'}</div>`;
  $('#fp')?.addEventListener('submit', async e => {
    e.preventDefault(); const fm = e.target, fl = fm.f.files[0], d = { judul: fm.judul.value, kategori: fm.kategori.value || 'Umum', isi: fm.isi.value };
    try { if (fl) { toast('Mengunggah foto…'); d.foto = await up(fl, 'Dokumentasi_Kegiatan'); } const t = Object.assign({ tanggal: new Date().toISOString().slice(0, 10) }, d); toast('Pengumuman terbit ✓');
      Api.opt('addPengumuman', d, () => Api.patch('publik', q => Object.assign({}, q, { pengumuman: [t].concat(q.pengumuman || []) }))).catch(authErr); } catch (z) { authErr(z); }
  });
}
async function vAgenda() {
  skel(); const p = await loadPub(), bisa = can('agenda'); let L = p.agenda || [];
  if (bisa) { try { L = await Api.post('listKegiatan'); } catch (e) { toast(e.message, 'err'); } }
  const f = bisa ? `<form id="fk" class="card form"><h3>Tambah Kegiatan</h3><label>Nama *<input name="nama" required></label><label>Tanggal *<input type="date" name="tanggal" required></label><label>Waktu<input type="time" name="waktu"></label><label>Lokasi<input name="lokasi"></label><label>Penanggung jawab<input name="pj"></label><label>Kategori<input name="kategori" list="kat" placeholder="Kajian Rutin"></label><datalist id="kat"><option>Kajian Rutin<option>KARAMAL<option>Salat Jumat<option>Ramadan<option>Sosial</datalist><label>Poster/foto (opsional)<input type="file" name="f" accept="image/*"></label><label class="chk"><input type="checkbox" name="publik" checked> Tampil di halaman publik & TV</label><button class="btn">Simpan Kegiatan</button></form>` : '';
  view().innerHTML = `<h1 class="pt">Agenda Kegiatan</h1>${f}<div class="grid3">${L.map(agCard).join('') || '<p class="empty">Belum ada agenda.</p>'}</div>`;
  $('#fk')?.addEventListener('submit', async e => {
    e.preventDefault(); const fm = e.target, fl = fm.f.files[0], d = Object.fromEntries(new FormData(fm)); delete d.f; d.publik = fm.publik.checked;
    try { if (fl) { toast('Mengunggah foto…'); d.foto = await up(fl, 'Dokumentasi_Kegiatan'); } toast('Kegiatan dikirim ✓');
      Api.opt('addKegiatan', d, () => Api.patch('u_listKegiatan', q => [Object.assign({ id: 'tmp', status: 'Terjadwal' }, d)].concat(q))).catch(authErr); } catch (z) { authErr(z); }
  });
}
function vLogin() {
  view().innerHTML = `<div class="card login"><img src="img/logo.png" alt=""><h2>Masuk Pengurus DKM</h2><form id="fl" class="form" style="grid-template-columns:1fr;text-align:left"><label>Username<input name="username" autocomplete="username" required autofocus></label><label>Sandi<input type="password" name="password" autocomplete="current-password" required></label><button class="btn">Masuk</button></form><p class="err" id="lerr"></p></div>`;
  $('#fl').onsubmit = async e => { e.preventDefault(); try { const m = await Api.post('login', Object.fromEntries(new FormData(e.target))); sessionStorage.setItem('tok', m.token); S.user = m.user; S.role = 'semua'; sessionStorage.setItem('usr', JSON.stringify(m.user)); await Api.sync(true); location.hash = m.user.peran.some(r => IZ.dashboard.includes(r)) ? '#/dashboard' : '#/tvset'; route(); } catch (x) { $('#lerr').textContent = x.message; } };
}

// ===== Dashboard & Keuangan (grafik interaktif Chart.js) =====
function grafik(r, a, b, klik) {
  lib(CH).then(() => {
    const P = cv('--p'), X = cv('--s'), t = cv('--t2'), bd = cv('--bd'), pal = [P, X, cv('--g'), '#7FB8E6', '#F59E0B', '#9CA3AF'];
    new Chart($(a), { type: 'bar', data: { labels: r.bulanan.map(x => x.b.slice(5)), datasets: [{ label: 'Pemasukan', data: r.bulanan.map(x => x.masuk), backgroundColor: P, borderRadius: 4 }, { label: 'Pengeluaran', data: r.bulanan.map(x => x.keluar), backgroundColor: X, borderRadius: 4 }] },
      options: { responsive: true, interaction: { mode: 'index' }, plugins: { legend: { labels: { color: t } }, tooltip: { callbacks: { label: c => c.dataset.label + ': ' + rp(c.parsed.y) } } }, scales: { x: { ticks: { color: t }, grid: { display: false } }, y: { ticks: { color: t, callback: v => (v / 1e6) + ' jt' }, grid: { color: bd } } } } });
    new Chart($(b), { type: 'doughnut', data: { labels: r.kas.map(k => k.nama), datasets: [{ data: r.kas.map(k => Math.max(0, k.saldo)), backgroundColor: pal, borderWidth: 0 }] },
      options: { cutout: '62%', onClick: (e, el) => { if (klik && el.length) klik(r.kas[el[0].index].kode); }, plugins: { legend: { position: 'bottom', labels: { color: t } }, tooltip: { callbacks: { label: c => c.label + ': ' + rp(c.parsed) } } } } });
  }).catch(e => toast(e.message, 'err'));
}
async function vDashboard() {
  if (!needAuth('dashboard')) return; skel();
  try {
    const r = await Api.post('ringkasan'), p = await loadPub(), j = p.jadwal, tl = (k, h, i, l) => !k || can(k) ? `<a class="card hv tile" href="#/${h}"><i>${i}</i>${l}</a>` : '';
    view().innerHTML = `<section class="dhero"><div class="tvart">${masjidSvg()}</div><div style="position:relative"><small>${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</small><h1>Assalamu'alaikum, ${esc(S.user.nama)}</h1><p>Selamat datang di Sistem Informasi ${esc(cfg().nama || 'Masjid Al-Jamaal')}. Mengelola masjid dengan lebih baik, transparan, dan profesional.</p></div></section>
    <div class="grid4">${stat('Total Saldo Kas', rp(r.total), 'main', '💼')}${stat('Pemasukan Bulan Ini', rp(r.masuk), 'grn', '📥')}${stat('Pengeluaran Bulan Ini', rp(r.keluar), '', '📤')}${stat('Menunggu Persetujuan', r.menunggu + ' transaksi', r.menunggu ? 'amb' : '', '⏳')}</div>
    <div class="tiles">${tl('keuangan', 'keuangan', '➕', 'Input Transaksi')}${tl('', 'jadwal', '🕌', 'Jadwal Salat')}${tl('agenda', 'agenda', '📅', 'Agenda Kegiatan')}${tl('laporan', 'laporan', '🧾', 'Laporan')}${tl('rapat', 'rapat', '📝', 'Notulen Rapat')}${tl('', 'tv', '📺', 'Layar TV')}</div>
    <div class="dtop"><div class="card"><h3>Jadwal Salat Hari Ini</h3>${j ? `<div class="grid5">${SALAT.map(s => `<div class="card pr" data-s="${s}"><small>${s}</small><b class="mono">${j.waktu[s]}</b></div>`).join('')}</div>` : '<p class="muted">Jadwal belum tersedia.</p>'}</div><div class="card next"><small>MENUJU SALAT</small><h2 id="nx">—</h2><div class="count mono" id="cd">--:--:--</div></div></div>
    <div class="grid2"><div class="card"><h3>Arus Kas 6 Bulan</h3><canvas id="c1" height="170"></canvas></div><div class="card"><h3>Komposisi Saldo per Kas</h3><canvas id="c2" height="170"></canvas></div></div>
    <div class="grid2"><div class="card"><h3>Saldo per Kas</h3>${r.kas.map(k => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--bd)"><span>${esc(k.nama)}</span><b class="mono">${rp(k.saldo)}</b></div>`).join('')}</div>
    <div class="card"><h3>Agenda Kegiatan Terdekat</h3>${(p.agenda || []).slice(0, 4).map(x => `<div style="padding:6px 0;border-bottom:1px solid var(--bd)"><b>${esc(x.nama)}</b><br><small class="muted mono">${esc(x.tanggal)} ${esc(x.waktu)} · ${esc(x.lokasi)}</small></div>`).join('') || '<p class="muted">Belum ada agenda.</p>'}</div></div>`;
    grafik(r, '#c1', '#c2'); runClock(j);
  } catch (e) { authErr(e); }
}
async function vJadwal() {
  skel(); const p = await loadPub(), j = p.jadwal, c = p.cfg || {};
  view().innerHTML = `<h1 class="pt">Jadwal Salat</h1><p class="muted">${esc(c.alamat || 'Perum. Gading Elok Blok I, Karawang')} · Metode Kemenag RI</p>
  <div class="card next big2"><div><small>WAKTU SEKARANG</small><div class="clock mono" id="clk">--:--:--</div><small>${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}${j ? ' · ' + esc(j.hijriah) : ''}</small></div><div><small>MENUJU SALAT</small><h2 id="nx">—</h2><div class="count mono" id="cd">--:--:--</div></div></div>
  ${j ? `<div class="grid6"><div class="card" style="text-align:center"><small>Imsak</small><b class="mono big">${j.waktu.Imsak}</b></div>${SALAT.map(s => `<div class="card pr" data-s="${s}"><small>${s}</small><b class="mono">${j.waktu[s]}</b><small class="mono">iqamah ${hm(toSec(j.waktu[s]) + (IQ[s] || 10) * 60)}</small></div>`).join('')}</div>` : '<p class="empty">Jadwal belum tersedia. Muat ulang beberapa saat lagi.</p>'}
  <div class="card dhero" style="margin-top:14px"><div class="tvart">${masjidSvg()}</div><p style="position:relative;margin:0">“Sesungguhnya salat itu adalah kewajiban yang ditentukan waktunya atas orang-orang yang beriman.” <b>(QS. An-Nisa: 103)</b></p></div>`;
  runClock(j);
}
async function vKeuangan() {
  if (!needAuth('keuangan')) return; skel();
  try {
    const [r, t] = await Promise.all([Api.post('ringkasan'), Api.post('listTrx')]), ketua = S.user.peran.includes('ketua'), opt = r.kas.map(k => `<option value="${esc(k.kode)}">${esc(k.nama)}</option>`).join('');
    let fk = '';
    view().innerHTML = `<h1 class="pt">Keuangan</h1><div class="grid3">${r.kas.map(k => `<div class="card kas hv" data-k="${esc(k.kode)}"><small>${esc(k.kode)} · ${esc(k.nama)}</small><b class="mono big">${rp(k.saldo)}</b><small class="muted mono">+${rp(k.masuk)} / −${rp(k.keluar)} bln ini</small></div>`).join('')}</div>
    <div class="grid2"><div class="card"><h3>Arus Kas 6 Bulan</h3><canvas id="c1" height="170"></canvas></div><div class="card"><h3>Saldo per Kas <small class="muted">(klik irisan = filter tabel)</small></h3><canvas id="c2" height="170"></canvas></div></div>
    <form id="ft" class="card form"><h3>Catat Transaksi</h3><label>Tipe<select name="tipe"><option value="masuk">Pemasukan</option><option value="keluar">Pengeluaran</option><option value="transfer">Transfer Antar-Kas</option></select></label><label>Kas<select name="kode_kas">${opt}</select></label><label id="lt" hidden>Kas tujuan<select name="kas_tujuan">${opt}</select></label><label>Tanggal<input type="date" name="tanggal" value="${new Date().toISOString().slice(0, 10)}"></label><label>Kategori<input name="kategori" placeholder="Infak Jumat, Listrik, …"></label><label>Nominal (Rp) *<input name="nominal" type="number" min="1" required class="mono"></label><label>Pihak<input name="pihak"></label><label>Uraian<textarea name="uraian"></textarea></label><label>Bukti (foto nota)<input type="file" name="bf" accept="image/*"></label><button class="btn">Kirim untuk Persetujuan</button></form>
    <h3 class="sec">Transaksi</h3><div class="qa"><input id="fq" placeholder="🔍 Cari uraian/kategori/no…" style="max-width:260px"><select id="fs" style="max-width:180px"><option value="">Semua status</option><option>Menunggu</option><option>Disetujui</option><option>Ditolak</option></select><button class="btn ghost sm" id="fr0">Reset filter kas</button></div>
    <div class="tw"><table><thead><tr><th>No</th><th>Tanggal</th><th>Kas</th><th>Tipe</th><th>Kategori</th><th class="r">Nominal</th><th>Status</th><th></th></tr></thead><tbody id="tb"></tbody></table></div>`;
    const tbl = () => { const q = $('#fq').value.toLowerCase(), s = $('#fs').value, L = t.filter(x => (!fk || x.kode_kas === fk || x.kas_tujuan === fk) && (!s || x.status === s) && (!q || (x.no + x.kategori + x.uraian + x.pihak).toLowerCase().includes(q)));
      $('#tb').innerHTML = L.length ? L.map(x => `<tr><td class="mono">${esc(x.no)}</td><td class="mono">${esc(x.tanggal)}</td><td>${esc(x.kode_kas)}</td><td>${esc(x.tipe)}</td><td>${esc(x.kategori)}</td><td class="r mono">${rp(x.nominal)}</td><td>${badge(x.status)}${x.id_bukti ? ` <a href="${gdrive(x.id_bukti)}" target="_blank" rel="noopener">📎</a>` : ''}</td><td>${ketua && x.status === 'Menunggu' ? `<button class="btn sm" data-n="${esc(x.no)}" data-s="Disetujui">Setujui</button> <button class="btn sm ghost" data-n="${esc(x.no)}" data-s="Ditolak">Tolak</button>` : ''}</td></tr>`).join('') : '<tr><td colspan="8" class="empty">Tidak ada transaksi.</td></tr>';
      document.querySelectorAll('[data-n]').forEach(b => b.onclick = () => { const no = b.dataset.n, st = b.dataset.s; toast('Diproses…'); Api.opt('setStatusTrx', { no: no, status: st }, () => { Api.patch('u_listTrx', L2 => L2.map(x => x.no === no ? Object.assign({}, x, { status: st }) : x)); Api.patch('u_ringkasan', z => Object.assign({}, z, { menunggu: Math.max(0, z.menunggu - 1) })); }).then(() => toast('Status diperbarui')).catch(authErr); }); };
    const setK = k => { fk = k; document.querySelectorAll('.kas').forEach(e => e.classList.toggle('on', e.dataset.k === k)); tbl(); };
    document.querySelectorAll('.kas').forEach(e => e.onclick = () => setK(e.dataset.k === fk ? '' : e.dataset.k)); $('#fr0').onclick = () => setK(''); $('#fq').oninput = $('#fs').onchange = tbl; tbl(); grafik(r, '#c1', '#c2', setK);
    const f = $('#ft'); f.tipe.onchange = () => $('#lt').hidden = f.tipe.value !== 'transfer';
    f.onsubmit = async e => { e.preventDefault(); try { const d = Object.fromEntries(new FormData(f)), fl = f.bf.files[0]; delete d.bf; if (fl) d.bukti = await kompres(fl); const tmp = Object.assign({}, d, { no: 'TRX-baru', status: 'Menunggu', pencatat: S.user.username, id_bukti: '' }); delete tmp.bukti; toast('Transaksi dikirim ✓'); Api.opt('addTrx', d, () => { Api.patch('u_listTrx', L => [tmp].concat(L)); Api.patch('u_ringkasan', z => Object.assign({}, z, { menunggu: z.menunggu + 1 })); }).then(x => toast('Tersimpan: ' + x.no)).catch(authErr); } catch (z) { authErr(z); } };
  } catch (e) { authErr(e); }
}

// ===== Laporan (PDF, bagikan PDF ke WhatsApp, cetak, email) =====
async function vLaporan() {
  if (!needAuth('laporan')) return; skel();
  try {
    const [r, t] = await Promise.all([Api.post('ringkasan'), Api.post('listTrx')]), nm = {}; r.kas.forEach(k => nm[k.kode] = k.nama);
    view().innerHTML = `<h1 class="pt">Laporan Keuangan</h1><div class="card form"><label>Kas<select id="fk2"><option value="">Semua kas</option>${r.kas.map(k => `<option value="${esc(k.kode)}">${esc(k.nama)}</option>`).join('')}</select></label><label>Bulan<input type="month" id="fb" value="${new Date().toISOString().slice(0, 7)}"></label><div class="wide qa"><button class="btn" id="pdf">⬇ Simpan PDF</button><button class="btn ghost" id="wa">🟢 Bagikan PDF ke WhatsApp</button><button class="btn ghost" id="pr">🖨 Cetak</button><button class="btn ghost" id="em">✉ Email</button></div></div><div class="card" style="overflow:auto"><div class="paper" id="rep"></div></div>`;
    let isi = '', txt = '', nama = ''; const draw = () => {
      const k = $('#fk2').value, b = $('#fb').value, L = t.filter(x => x.status === 'Disetujui' && String(x.tanggal).slice(0, 7) === b && (!k || x.kode_kas === k || x.kas_tujuan === k));
      const m = L.filter(x => x.tipe === 'masuk').reduce((s, x) => s + Number(x.nominal), 0), c = L.filter(x => x.tipe === 'keluar').reduce((s, x) => s + Number(x.nominal), 0);
      nama = 'Laporan-Kas-' + b + (k ? '-' + k : '') + '.pdf'; txt = `Laporan Kas ${cfg().nama || 'Masjid Al-Jamaal'} ${k ? '(' + nm[k] + ') ' : ''}${b}\nPemasukan: ${rp(m)}\nPengeluaran: ${rp(c)}\nSelisih: ${rp(m - c)}\nSaldo total kas: ${rp(r.total)}`;
      isi = `<h3>Laporan Keuangan</h3><p>Periode ${esc(b)} · ${k ? esc(nm[k]) : 'Semua kas'} · Dicetak ${new Date().toLocaleDateString('id-ID')} oleh ${esc(S.user.nama)}</p><table><thead><tr><th>Tanggal</th><th>No</th><th>Kas</th><th>Kategori</th><th class="r">Masuk</th><th class="r">Keluar</th></tr></thead><tbody>${L.map(x => `<tr><td>${esc(x.tanggal)}</td><td>${esc(x.no)}</td><td>${esc(nm[x.kode_kas] || x.kode_kas)}</td><td>${esc(x.kategori)}</td><td class="r">${x.tipe === 'masuk' ? rp(x.nominal) : ''}</td><td class="r">${x.tipe === 'keluar' ? rp(x.nominal) : ''}</td></tr>`).join('') || '<tr><td colspan="6">Tidak ada transaksi disetujui pada periode ini.</td></tr>'}<tr><th colspan="4">TOTAL</th><th class="r">${rp(m)}</th><th class="r">${rp(c)}</th></tr></tbody></table><p>Selisih: <b>${rp(m - c)}</b> · Saldo total kas: <b>${rp(r.total)}</b></p><br><table style="border:0"><tr><td style="border:0;text-align:center">Bendahara<br><br><br>(................)</td><td style="border:0;text-align:center">Ketua DKM<br><br><br>(................)</td></tr></table>`;
      $('#rep').innerHTML = kop() + isi;
    };
    $('#fk2').onchange = $('#fb').onchange = draw; $('#pdf').onclick = () => hardcopy(isi, nama, 'pdf'); $('#wa').onclick = () => hardcopy(isi, nama, 'share'); $('#pr').onclick = () => hardcopy(isi, nama, 'print');
    $('#em').onclick = async () => { const to = prompt('Kirim ringkasan laporan ke email:'); if (!to) return; try { await Api.post('kirimLaporan', { to: to, subjek: 'Laporan Kas ' + (cfg().nama || 'Masjid Al-Jamaal'), isi: txt }); toast('Email terkirim'); } catch (z) { authErr(z); } }; draw();
  } catch (e) { authErr(e); }
}

// ===== Rapat & Notulen =====
const paperN = x => `<h3>NOTULEN RAPAT</h3><table style="border:0"><tr><td style="border:0;width:120px">Judul</td><td style="border:0">: ${esc(x.judul)}</td></tr><tr><td style="border:0">Tanggal</td><td style="border:0">: ${esc(x.tanggal)}</td></tr><tr><td style="border:0">Tempat</td><td style="border:0">: ${esc(x.tempat)}</td></tr><tr><td style="border:0">Pimpinan</td><td style="border:0">: ${esc(x.pimpinan)}</td></tr></table><h4>Pembahasan</h4><p style="white-space:pre-wrap">${esc(x.notulen)}</p><h4>Keputusan & Tindak Lanjut</h4><p style="white-space:pre-wrap">${esc(x.keputusan)}</p><br><table style="border:0"><tr><td style="border:0;text-align:center">Pimpinan Rapat<br><br><br>(................)</td><td style="border:0;text-align:center">Sekretaris<br><br><br>(................)</td></tr></table>`;
async function vRapat() {
  if (!needAuth('rapat')) return; skel();
  try {
    const L = await Api.post('listRapat');
    view().innerHTML = `<h1 class="pt">Rapat & Notulen</h1><form id="fr" class="card form"><h3>Catat Rapat & Notulen</h3><label>Judul *<input name="judul" required></label><label>Tanggal *<input type="date" name="tanggal" required></label><label>Tempat<input name="tempat"></label><label>Pimpinan<input name="pimpinan"></label><label class="wide">Notulen / pembahasan<textarea name="notulen" rows="5"></textarea></label><label class="wide">Keputusan & tindak lanjut<textarea name="keputusan" rows="3"></textarea></label><label>Unggah file notulen (PDF/foto)<input type="file" name="f" accept="application/pdf,image/*"></label><button class="btn">Simpan Notulen</button></form>
    <div class="grid3">${L.map((x, i) => `<div class="card hv"><span class="tag">${esc(x.tanggal)}</span><h3 style="margin-top:6px">${esc(x.judul)}</h3><small class="muted">${esc(x.tempat)} · Pimpinan: ${esc(x.pimpinan)}</small><p class="muted" style="white-space:pre-wrap;max-height:90px;overflow:hidden">${esc(x.notulen)}</p><div class="qa"><button class="btn sm" data-i="${i}" data-m="pdf">PDF</button><button class="btn sm ghost" data-i="${i}" data-m="print">Cetak</button><button class="btn sm ghost" data-i="${i}" data-m="share">WA</button>${x.file ? `<a class="btn sm ghost" target="_blank" rel="noopener" href="${gdrive(x.file)}">File</a>` : ''}</div></div>`).join('') || '<p class="empty">Belum ada notulen.</p>'}</div>`;
    document.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { const x = L[b.dataset.i]; hardcopy(paperN(x), 'Notulen-' + x.tanggal + '.pdf', b.dataset.m); });
    $('#fr').onsubmit = async e => { e.preventDefault(); const fm = e.target, fl = fm.f.files[0], d = Object.fromEntries(new FormData(fm)); delete d.f; try { if (fl) { toast('Mengunggah file…'); d.file = await up(fl, 'Notulen', 1600); } await Api.post('addRapat', d); toast('Notulen tersimpan'); vRapat(); } catch (z) { authErr(z); } };
  } catch (e) { authErr(e); }
}

// ===== Pengguna (admin), Profil (diri sendiri), Pengaturan, Log =====
const rolesBox = sel => Object.keys(ROLES).map(r => `<label class="chk"><input type="checkbox" value="${r}" ${sel.includes(r) ? 'checked' : ''}> ${ROLES[r]}</label>`).join('');
const pick = el => [...el.querySelectorAll('.rls input:checked')].map(i => i.value).join(',');
async function vPengguna() {
  if (!needAuth('pengguna')) return; skel();
  try {
    const L = await Api.post('listUsers');
    view().innerHTML = `<h1 class="pt">Pengguna & Hak Akses</h1><form id="fu" class="card form"><h3>Tambah Pengguna</h3><label>Username *<input name="username" required pattern="[a-z0-9._-]{3,20}" title="3-20 karakter: huruf kecil, angka, titik, strip"></label><label>Nama *<input name="nama" required></label><label>Sandi awal *<input type="password" name="password" minlength="6" required></label><div class="wide"><b>Peran</b> <small class="muted">(boleh lebih dari satu untuk yang merangkap jabatan)</small><div class="rls" style="margin-top:6px">${rolesBox(['bidang'])}</div></div><button class="btn">Daftarkan</button></form>
    <div class="card">${L.map(x => `<div class="urow" data-u="${esc(x.username)}">${av(x)}<div class="ui"><b>${esc(x.nama)}</b><small class="mono">${esc(x.username)}</small></div><div class="rls">${rolesBox(String(x.peran).split(',').map(s => s.trim()))}</div><label class="chk"><input type="checkbox" class="ak" ${String(x.aktif).toUpperCase() !== 'FALSE' ? 'checked' : ''}> Aktif</label><button class="btn sm sv">Simpan</button><button class="btn sm ghost pw">Atur sandi</button></div>`).join('')}</div>`;
    $('#fu').onsubmit = async e => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)); d.peran = pick(e.target); if (!d.peran) return toast('Pilih minimal satu peran', 'err'); try { await Api.post('addUser', d); toast('Pengguna terdaftar'); vPengguna(); } catch (z) { authErr(z); } };
    document.querySelectorAll('.sv').forEach(b => b.onclick = async () => { const row = b.closest('.urow'); try { await Api.post('updateUser', { username: row.dataset.u, peran: pick(row), aktif: row.querySelector('.ak').checked ? 'TRUE' : 'FALSE' }); toast('Tersimpan'); } catch (z) { authErr(z); } });
    document.querySelectorAll('.pw').forEach(b => b.onclick = async () => { const u = b.closest('.urow').dataset.u, pw = prompt('Sandi baru untuk ' + u + ' (min. 6 karakter):'); if (!pw) return; try { await Api.post('setPassword', { username: u, password: pw }); toast('Sandi diatur ulang'); } catch (z) { authErr(z); } });
  } catch (e) { authErr(e); }
}
function vProfil() {
  if (!S.user) { location.hash = '#/login'; return; } const u = S.user;
  view().innerHTML = `<h1 class="pt">Profil Saya</h1><div class="grid2"><form id="fpf" class="card form"><h3>Data Akun</h3><div class="pfoto wide">${av(u)}</div><label>Nama<input name="nama" value="${esc(u.nama)}" required></label><label>Foto profil<input type="file" name="f" accept="image/*"></label><p class="muted wide">Username: <b class="mono">${esc(u.username)}</b><br>Peran: ${esc(u.peran.map(r => ROLES[r] || r).join(', '))}</p><button class="btn">Simpan Profil</button></form>
  <form id="fpw" class="card form"><h3>Ganti Sandi</h3><label>Sandi lama<input type="password" name="lama" required></label><label>Sandi baru<input type="password" name="baru" minlength="6" required></label><button class="btn">Ganti Sandi</button></form></div>`;
  $('#fpf').onsubmit = async e => { e.preventDefault(); const fm = e.target, d = { nama: fm.nama.value }; try { if (fm.f.files[0]) { toast('Mengunggah foto…'); d.foto = await up(fm.f.files[0], 'Dokumentasi_Kegiatan', 400); } await Api.post('updateProfil', d); S.user = Object.assign({}, S.user, d); sessionStorage.setItem('usr', JSON.stringify(S.user)); toast('Profil tersimpan'); route(); } catch (z) { authErr(z); } };
  $('#fpw').onsubmit = async e => { e.preventDefault(); try { await Api.post('gantiPassword', { lama: e.target.lama.value, baru: e.target.baru.value }); e.target.reset(); toast('Sandi berhasil diganti'); } catch (z) { authErr(z); } };
}
const temaBox = (n, v) => `<div class="sw">${Object.keys(TEMA).map(k => `<label><input type="radio" name="${n}" value="${k}" ${v === k ? 'checked' : ''}><i style="background:linear-gradient(135deg,${TEMA[k][1]} 50%,${TEMA[k][2]} 50%)"></i>${TEMA[k][0]}</label>`).join('')}</div>`;
async function vPengaturan() {
  if (!needAuth('pengaturan')) return; skel(); const p = await loadPub(), c = p.cfg || {};
  view().innerHTML = `<h1 class="pt">Tampilan & Identitas</h1><form id="fg" class="card form"><h3>Identitas Masjid</h3><label>Nama masjid<input name="nama" value="${esc(c.nama || 'Masjid Al-Jamaal')}"></label><label>Alamat<input name="alamat" value="${esc(c.alamat || 'Perum. Gading Elok Blok I, Karawang')}"></label><label class="wide">Foto masjid untuk beranda ${c.hero ? '(sudah ada, pilih lagi untuk mengganti)' : ''}<input type="file" name="f" accept="image/*"></label>${c.hero ? `<img class="wide" src="${img(c.hero, 600)}" style="max-height:160px;object-fit:cover;border-radius:10px" alt="">` : ''}<div class="wide"><b>Tema warna aplikasi</b>${temaBox('tema', c.tema || 'biru')}</div><button class="btn">Simpan</button></form>`;
  $('#fg').onsubmit = async e => { e.preventDefault(); const fm = e.target, d = { nama: fm.nama.value, alamat: fm.alamat.value, tema: fm.tema.value, hero: c.hero || '' }; try { if (fm.f.files[0]) { toast('Mengunggah foto…'); d.hero = await up(fm.f.files[0], 'Logo_dan_Aset', 1600); } const r = await Api.post('savePengaturan', d); S.pub.cfg = r; Cache.set('publik', S.pub); toast('Tersimpan ✓'); route(); } catch (z) { authErr(z); } };
}
async function vLog() {
  if (!needAuth('log')) return; skel();
  try { const L = await Api.post('listLog'); view().innerHTML = `<h1 class="pt">Log Aktivitas</h1><div class="tw"><table><thead><tr><th>Waktu</th><th>Pengguna</th><th>Aksi</th><th>Detail</th></tr></thead><tbody>${L.map(x => `<tr><td class="mono">${esc(x.waktu)}</td><td>${esc(x.pengguna)}</td><td><span class="tag">${esc(x.aksi)}</span></td><td>${esc(x.detail)}</td></tr>`).join('')}</tbody></table></div>`; } catch (e) { authErr(e); }
}

// ===== Pengaturan Layar TV (+ panduan sambungan ke TV) =====
async function vTvSet() {
  if (!needAuth('tvset')) return; skel(); const p = await loadPub(), c = p.cfg || {}, t = Object.assign({ durasi: {}, tampil: {}, poster: [], teks: '', tema: 'biru' }, c.tv || {}); const poster = (t.poster || []).slice(), url = location.origin + location.pathname + '#/tv';
  const on = k => t.tampil[k] !== false ? 'checked' : '', du = (k, d) => t.durasi[k] || d;
  const prow = () => poster.map((x, i) => `<div class="urow"><img class="th" src="${img(x.id, 200)}" alt=""><div class="ui"><b>${esc(x.judul || 'Template')}</b></div><label>Dari<input type="date" data-pi="${i}" data-f="dari" value="${esc(x.dari || '')}"></label><label>Sampai<input type="date" data-pi="${i}" data-f="sampai" value="${esc(x.sampai || '')}"></label><label class="chk"><input type="checkbox" data-pi="${i}" data-f="aktif" ${x.aktif !== false ? 'checked' : ''}> Tampil</label><button class="btn sm ghost" data-del="${i}">Hapus</button></div>`).join('') || '<p class="muted">Belum ada template.</p>';
  view().innerHTML = `<h1 class="pt">Pengaturan Layar TV</h1>
  <div class="card"><h3>Alamat Layar TV</h3><p>Buka alamat ini di TV masjid:</p><code class="mono" id="turl" style="word-break:break-all">${esc(url)}</code><div class="qa" style="margin-top:8px"><button class="btn sm" id="cp">Salin alamat</button><a class="btn sm ghost" href="#/tv" target="_blank">Pratinjau</a></div></div>
  <div class="card form"><h3>Yang ditampilkan & durasi (detik)</h3>${[['jadwal', 'Tabel jadwal adzan & iqamah', 15], ['poster', 'Template kajian/poster', 15], ['pengumuman', 'Pengumuman', 15], ['agenda', 'Agenda', 15]].map(x => `<label class="chk"><input type="checkbox" data-t="${x[0]}" ${on(x[0])}> ${x[1]}</label><label>Durasi<input type="number" min="5" max="120" data-d="${x[0]}" value="${du(x[0], x[2])}"></label>`).join('')}
  <label class="chk"><input type="checkbox" data-t="kartu" ${on('kartu')}> Kartu waktu salat (selalu tampil di atas)</label><label class="chk"><input type="checkbox" data-t="hitung" ${on('hitung')}> Hitung mundur salat berikutnya</label><label class="chk"><input type="checkbox" data-t="ticker" ${on('ticker')}> Teks berjalan (pengumuman & agenda)</label><label class="wide">Teks berjalan tambahan<input id="teks" value="${esc(t.teks)}" placeholder="Mohon senyapkan ponsel selama salat"></label><div class="wide"><b>Tema warna layar TV</b>${temaBox('ttema', t.tema || 'biru')}</div></div>
  <div class="card"><h3>Template kajian / poster untuk TV</h3><div id="plist">${prow()}</div><form id="fpo" class="form"><label>Judul<input name="judul" placeholder="Kajian Subuh Ahad"></label><label>Gambar poster<input type="file" name="f" accept="image/*" required></label><button class="btn">Unggah template</button></form></div>
  <button class="btn" id="svt">💾 Simpan Pengaturan TV</button>
  <h3 class="sec">Panduan menyambungkan ke TV</h3>
  <details open><summary>1. Komputer / mini-PC / laptop + kabel HDMI (paling stabil)</summary><p>Buat shortcut Chrome dengan target:</p><code>"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --kiosk --autoplay-policy=no-user-gesture-required ${esc(url)}</code><p>Agar menyala otomatis: tekan <b>Win+R</b> → <b>shell:startup</b> → pindahkan shortcut ke folder itu. Matikan sleep: Settings → Power → Screen &amp; Sleep = Never.</p></details>
  <details><summary>2. TV Android / TV box</summary><p>Pasang <b>Fully Kiosk Browser</b>, isi Start URL dengan alamat di atas, aktifkan <i>Keep Screen On</i> dan <i>Autoplay Audio</i>.</p></details>
  <details><summary>3. Smart TV (browser bawaan)</summary><p>Buka alamat di atas lewat browser TV, lalu tekan <b>OK</b> pada layar "aktifkan suara".</p></details>
  <details><summary>4. Chromecast / Cast layar</summary><p>Buka alamat di Chrome → menu ⋮ → <b>Cast</b> → pilih TV (suara ikut).</p></details>
  <details><summary>5. Uji suara & alarm</summary><p>Saat layar TV terbuka, tekan <b>A</b> (tes adzan) atau <b>I</b> (tes iqamah). Alarm bunyi otomatis saat adzan dan iqamah 5 waktu; jeda iqamah diatur di <code>js/pengaturan.js</code>. Suara asli: taruh <code>adzan.mp3</code> dan <code>iqamah.mp3</code> di folder <code>audio/</code>.</p></details>`;
  $('#cp').onclick = () => { navigator.clipboard?.writeText(url); toast('Alamat disalin'); };
  const draw = () => { $('#plist').innerHTML = prow(); bind(); }, bind = () => {
    document.querySelectorAll('[data-pi]').forEach(i => i.onchange = () => { poster[i.dataset.pi][i.dataset.f] = i.type === 'checkbox' ? i.checked : i.value; });
    document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { poster.splice(b.dataset.del, 1); draw(); }); }; bind();
  $('#fpo').onsubmit = async e => { e.preventDefault(); const fm = e.target; try { toast('Mengunggah…'); poster.push({ id: await up(fm.f.files[0], 'Logo_dan_Aset', 1600), judul: fm.judul.value, aktif: true }); fm.reset(); draw(); toast('Template ditambahkan — jangan lupa Simpan'); } catch (z) { authErr(z); } };
  $('#svt').onclick = async () => { const tv = { tampil: {}, durasi: {}, poster: poster, teks: $('#teks').value, tema: document.querySelector('[name=ttema]:checked').value }; document.querySelectorAll('[data-t]').forEach(i => tv.tampil[i.dataset.t] = i.checked); document.querySelectorAll('[data-d]').forEach(i => tv.durasi[i.dataset.d] = Math.max(5, +i.value || 15));
    try { const r = await Api.post('savePengaturan', { tv: tv }); S.pub.cfg = r; Cache.set('publik', S.pub); toast('Pengaturan TV tersimpan ✓ (TV memperbarui diri dalam ≤10 menit)'); } catch (z) { authErr(z); } };
}

// ===== Jam, hitung mundur, alarm adzan & iqamah =====
const IQ = (typeof IQAMAH_MENIT !== 'undefined') ? IQAMAH_MENIT : { Subuh: 15, Zuhur: 10, Asar: 10, Magrib: 8, Isya: 10 };
function runClock(j) {
  clearInterval(timer);
  const tick = () => {
    const n = wibSec(); $('#clk') && ($('#clk').textContent = hms(n)); if (!j) return;
    let nx = SALAT.find(s => toSec(j.waktu[s]) > n), d = nx ? toSec(j.waktu[nx]) - n : toSec(j.waktu.Subuh) + 86400 - n; nx = nx || 'Subuh';
    $('#nx') && ($('#nx').textContent = nx + ' ' + j.waktu[nx]); $('#cd') && ($('#cd').textContent = '- ' + hms(d));
    document.querySelectorAll('.pr').forEach(e => e.classList.toggle('act', e.dataset.s === nx));
    if (window.tvOn) alarm(j, n);
  }; tick(); timer = setInterval(tick, 1000);
}
let ac; const fired = {};
function nada(seq) { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); ac.resume(); let t = ac.currentTime; seq.forEach(([f, d]) => { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f; o.connect(g); g.connect(ac.destination); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.7, t + .03); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.start(t); o.stop(t + d + .05); t += d + .1; }); } catch (e) { /* tanpa suara */ } }
function suara(jenis) { const nd = jenis === 'adzan' ? [[660, .8], [880, .8], [660, .8], [880, .8], [660, .8], [880, 1.4]] : [[880, .3], [880, .3], [1040, .8]]; new Audio('audio/' + jenis + '.mp3').play().catch(() => nada(nd)); }
function banner(h, p, dur) { $('#al')?.remove(); document.body.insertAdjacentHTML('beforeend', `<div class="tvalarm" id="al"><h1>${esc(h)}</h1><p>${esc(p)}</p></div>`); setTimeout(() => $('#al')?.remove(), dur * 1000); }
function alarm(j, n) {
  if (window.tvDay !== new Date().toDateString()) return location.reload();
  SALAT.forEach(s => { const t = toSec(j.waktu[s]);
    [['adzan', t, 'ADZAN ' + s.toUpperCase(), 'Mari bersiap menunaikan salat. Iqamah ' + (IQ[s] || 10) + ' menit lagi.', 120], ['iqamah', t + (IQ[s] || 10) * 60, 'IQAMAH ' + s.toUpperCase(), 'Luruskan dan rapatkan shaf', 90]].forEach(x => {
      const key = window.tvDay + s + x[0]; if (n >= x[1] && n < x[1] + 60 && !fired[key]) { fired[key] = 1; suara(x[0]); banner(x[2], x[3], x[4]); } }); });
}

// ===== Layar TV (slide mengikuti pengaturan) =====
function tvSlides(p) {
  const t = (p.cfg || {}).tv || {}, d = t.durasi || {}, on = t.tampil || {}, hr = new Date().toISOString().slice(0, 10), L = [];
  if (on.jadwal !== false) L.push({ k: 'jadwal', dur: d.jadwal || 15 });
  if (on.poster !== false) (t.poster || []).filter(x => x.aktif !== false && (!x.dari || x.dari <= hr) && (!x.sampai || x.sampai >= hr)).forEach(x => L.push({ k: 'poster', x: x, dur: d.poster || 15 }));
  if (on.pengumuman !== false) (p.pengumuman || []).slice(0, 6).forEach(x => L.push({ k: 'pengumuman', x: x, dur: d.pengumuman || 15 }));
  if (on.agenda !== false) (p.agenda || []).slice(0, 6).forEach(x => L.push({ k: 'agenda', x: x, dur: d.agenda || 15 }));
  return L.length ? L : [{ k: 'jadwal', dur: 15 }];
}
function tvRender(s, j) {
  if (s.k === 'jadwal') return `<table class="tvt"><thead><tr><th>Waktu</th><th>Adzan</th><th>Iqamah</th></tr></thead><tbody>${SALAT.map(x => `<tr class="pr" data-s="${x}"><td>${x}</td><td class="mono">${j ? j.waktu[x] : '--:--'}</td><td class="mono">${j ? hm(toSec(j.waktu[x]) + (IQ[x] || 10) * 60) : '--:--'}</td></tr>`).join('')}</tbody></table>`;
  if (s.k === 'poster') return `<img class="tvimg" src="${img(s.x.id, 1600)}" alt="">`;
  const x = s.x, pg = s.k === 'pengumuman';
  return `<div class="tvsp">${x.foto ? `<img src="${img(x.foto, 1000)}" alt="">` : ''}<div><small>${pg ? 'PENGUMUMAN' : 'AGENDA'}</small><h2>${esc(pg ? x.judul : x.nama)}</h2><p>${esc(pg ? x.isi : x.tanggal + ' · ' + x.waktu + ' · ' + x.lokasi)}</p></div></div>`;
}
async function vTV() {
  document.body.classList.add('tv'); tema(); const p = await loadPub(), j = p.jadwal, c = p.cfg || {}, t = c.tv || {}, on = t.tampil || {}; let i = 0;
  const tick = (p.pengumuman || []).map(x => x.judul + ': ' + x.isi).concat((p.agenda || []).map(x => 'Agenda: ' + x.nama + ' (' + x.tanggal + ' ' + x.waktu + ')')); if (t.teks) tick.unshift(t.teks);
  const ico = { Subuh: '🌅', Zuhur: '☀️', Asar: '🌤️', Magrib: '🌇', Isya: '🌙' }, tgl = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), inf = [{ i: '🕌', b: 'Jadwal Jumat', s: 'Jumat, ' + (j ? j.waktu.Zuhur : '12:00') + ' WIB' }].concat((p.agenda || []).slice(0, 3).map(x => ({ i: '📅', b: x.nama, s: x.tanggal + ' · ' + x.waktu })));
  view().innerHTML = `<div class="tvw"><div class="tvtop"><img class="tvlogo" src="img/logo.png" alt=""><div class="tvti"><h1>${esc(c.nama || 'Masjid Al-Jamaal')}</h1><b>${esc(c.alamat || 'Gading Elok 1 - Karawang')}</b><i>“Mari tingkatkan iman dan takwa bersama di rumah Allah”</i></div><div class="tvart">${masjidSvg()}</div><div class="tvclock"><small>${tgl}${j ? '<br>' + esc(j.hijriah) : ''}</small><div class="mono" id="clk"></div></div></div>
  ${on.kartu !== false && j ? `<div class="tvrow"><div class="tvlbl"><b>Jadwal Sholat</b><small>Hari ini</small></div>${SALAT.map(s => `<div class="pr tvp" data-s="${s}"><small>${ico[s]} ${s}</small><b class="mono">${j.waktu[s]}</b></div>`).join('')}<div class="tvp ims"><small>⏱ Imsak</small><b class="mono">${j.waktu.Imsak}</b></div></div>` : ''}
  <div class="tvmain"><div class="tvs" id="sl"></div><div class="tvinfo"><h3>Informasi Masjid</h3>${inf.map(x => `<div class="inf"><i>${x.i}</i><div><b>${esc(x.b)}</b><small>${esc(x.s)}</small></div></div>`).join('')}</div></div>
  ${on.hitung !== false ? '<div class="tvb"><span>MENUJU <b id="nx"></b></span><b class="mono" id="cd"></b></div>' : ''}${on.ticker !== false && tick.length ? `<div class="tick"><span>${esc(tick.join('   •   '))}</span></div>` : ''}<a class="tvx" href="#/">✕</a></div>`;
  const next = () => { const L = tvSlides(p), s = L[i++ % L.length]; $('#sl') && ($('#sl').innerHTML = tvRender(s, j)); window.tvT = setTimeout(next, s.dur * 1000); }; next();
  window.tvOn = true; window.tvDay = new Date().toDateString(); runClock(j); tvSetup(p);
}
function tvSetup(p) {
  $('.tvw').insertAdjacentHTML('beforeend', '<div class="tvon" id="on"><button class="btn" id="onb">🔊 Tekan OK / klik untuk mulai &amp; aktifkan suara</button></div>');
  const go = () => { $('#on')?.remove(); nada([[1, .01]]); document.documentElement.requestFullscreen?.().catch(() => {}); navigator.wakeLock?.request('screen').catch(() => {}); };
  $('#onb').onclick = go;
  window.onkeydown = e => { const k = e.key.toLowerCase(); if (k === 'enter') go(); if (k === 'a') { suara('adzan'); banner('TES ADZAN', 'Ini hanya uji coba suara', 8); } if (k === 'i') { suara('iqamah'); banner('TES IQAMAH', 'Ini hanya uji coba suara', 8); } };
  window.tvR = setInterval(() => Api._get('publik').then(v => { Cache.set('publik', v); S.pub = v; p.agenda = v.agenda; p.pengumuman = v.pengumuman || []; p.cfg = v.cfg || {}; }).catch(() => {}), 600000);
}

// ===== Router =====
function refreshView(force) { const a = document.activeElement; if (window.tvOn) return; if (!force && a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && view().contains(a)) return; route(); }
function route() {
  document.body.classList.remove('tv', 'sd'); $('#menu').classList.remove('open'); window.tvOn = false; window.onkeydown = null; clearInterval(window.tvR); clearTimeout(window.tvT); $('#al')?.remove(); clearInterval(timer);
  tema(); nav(); const h = (location.hash.replace('#/', '') || '').split('?')[0];
  ({ '': vBeranda, agenda: vAgenda, info: vInfo, login: vLogin, dashboard: vDashboard, keuangan: vKeuangan, laporan: vLaporan, rapat: vRapat, pengguna: vPengguna, profil: vProfil, pengaturan: vPengaturan, tvset: vTvSet, tv: vTV, log: vLog, jadwal: vJadwal }[h] || vBeranda)();
}
window.addEventListener('hashchange', route); route();
$('#burger').addEventListener('click', () => document.body.classList.contains('staff') ? document.body.classList.toggle('sd') : $('#menu').classList.toggle('open'));
document.addEventListener('click', e => { if (document.body.classList.contains('sd') && !e.target.closest('#side') && !e.target.closest('#burger')) document.body.classList.remove('sd'); });
setInterval(() => { if (S.user && !document.hidden) Api.sync(); }, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && S.user) Api.sync(); });
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
