const $ = s => document.querySelector(s), view = () => $('#view');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rp = n => 'Rp ' + new Intl.NumberFormat('id-ID').format(Number(n) || 0);
const S = { user: JSON.parse(sessionStorage.getItem('usr') || 'null'), pub: null };
const SALAT = ['Subuh', 'Zuhur', 'Asar', 'Magrib', 'Isya'];
const MENU = { dashboard: ['admin', 'ketua', 'bendahara', 'sekretaris', 'bidang'], keuangan: ['admin', 'ketua', 'bendahara'], laporan: ['admin', 'ketua', 'bendahara'], rapat: ['admin', 'ketua', 'sekretaris'], pengguna: ['admin'], log: ['admin'], pengumuman: ['admin', 'ketua', 'sekretaris'] };
const can = k => S.user && S.user.peran.some(r => MENU[k].includes(r));
let timer;

function toast(m, t = 'ok') { const e = $('#toast'); e.textContent = m; e.className = 'toast show ' + t; setTimeout(() => e.className = 'toast', 3500); }
function wibSec() {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).formatToParts(new Date());
  const g = t => +p.find(x => x.type === t).value; return (g('hour') % 24) * 3600 + g('minute') * 60 + g('second');
}
const hms = s => [Math.floor(s / 3600), Math.floor(s % 3600 / 60), s % 60].map(x => String(x).padStart(2, '0')).join(':');
const toSec = t => { const [h, m] = t.split(':'); return h * 3600 + m * 60; };

function nav() {
  const h = location.hash.replace('#/', '') || '';
  const a = (k, l) => `<a href="#/${k}" class="${h === k ? 'on' : ''}">${l}</a>`;
  $('#menu').innerHTML = a('', 'Beranda') + a('agenda', 'Agenda') + (can('dashboard') ? a('dashboard', 'Dashboard') : '') + (can('keuangan') ? a('keuangan', 'Keuangan') : '') + (can('laporan') ? a('laporan', 'Laporan') : '') + (can('rapat') ? a('rapat', 'Rapat') : '') + (can('pengumuman') ? a('pengumuman', 'Pengumuman') : '') + (can('pengguna') ? a('pengguna', 'Pengguna') : '') + (can('log') ? a('log', 'Log') : '') + a('tv', 'Layar TV') +
    (S.user ? `<button class="btn ghost" id="pw">Ganti Sandi</button><button class="btn ghost" id="out">Keluar (${esc(S.user.nama)})</button>` : a('login', 'Login Pengurus'));
  $('#pw')?.addEventListener('click', async () => { const lama = prompt('Sandi lama:'); if (!lama) return; const baru = prompt('Sandi baru (min. 6 karakter):'); if (!baru) return; try { await Api.post('gantiPassword', { lama: lama, baru: baru }); toast('Sandi berhasil diganti'); } catch (z) { authErr(z); } });
  $('#out')?.addEventListener('click', () => { sessionStorage.clear(); S.user = null; location.hash = '#/'; route(); });
}

async function loadPub() { if (!S.pub) { try { S.pub = await Api.get('publik'); } catch (e) { S.pub = { jadwal: null, agenda: [], pengumuman: [] }; toast(e.message, 'err'); } } return S.pub; }
const agendaRows = a => a.length ? a.map(k => `<tr><td class="mono">${esc(k.tanggal)}</td><td><b>${esc(k.nama)}</b></td><td class="mono">${esc(k.waktu)}</td><td>${esc(k.lokasi)}</td><td><span class="tag">${esc(k.kategori)}</span></td></tr>`).join('') : '<tr><td colspan="5" class="empty">Belum ada agenda publik.</td></tr>';

async function vBeranda() {
  view().innerHTML = '<p class="empty">Memuat…</p>';
  const p = await loadPub(), j = p.jadwal;
  view().innerHTML = `<section class="hero"><div><span class="tag">${j ? esc(j.hijriah) : ''}</span><h1>MASJID AL-JAMAAL</h1><p>Perum. Gading Elok Blok I, Karawang</p>
  <div class="clock mono" id="clk">--:--:--</div></div>
  <div class="card next"><small>SALAT BERIKUTNYA</small><h2 id="nx">—</h2><div class="count mono" id="cd">--:--:--</div></div></section>
  <h3 class="sec">Jadwal Salat Hari Ini</h3>${j ? `<div class="grid5">${SALAT.map(s => `<div class="card pr" data-s="${s}"><small>${s}</small><b class="mono">${j.waktu[s]}</b></div>`).join('')}</div>
  <p class="muted mono">Imsak ${j.waktu.Imsak} · Syuruq ${j.waktu.Syuruq} · Metode Kemenag RI</p>` : '<p class="empty">Jadwal belum tersedia. Coba muat ulang beberapa saat lagi.</p>'}
  ${(p.pengumuman || []).length ? '<h3 class="sec">Pengumuman</h3><div class="grid3">' + p.pengumuman.slice(0, 3).map(x => `<div class="card"><span class="tag">${esc(x.kategori)}</span> <small class="muted">${esc(x.tanggal)}</small><h3>${esc(x.judul)}</h3><p>${esc(x.isi)}</p></div>`).join('') + '</div>' : ''}
  <h3 class="sec">Agenda Mendatang</h3><div class="tw"><table><thead><tr><th>Tanggal</th><th>Kegiatan</th><th>Waktu</th><th>Lokasi</th><th>Kategori</th></tr></thead><tbody>${agendaRows(p.agenda)}</tbody></table></div>`;
  clearInterval(timer);
  const tick = () => {
    const n = wibSec(); $('#clk') && ($('#clk').textContent = hms(n)); if (!j) return;
    let nx = SALAT.find(s => toSec(j.waktu[s]) > n), d = nx ? toSec(j.waktu[nx]) - n : toSec(j.waktu.Subuh) + 86400 - n; nx = nx || 'Subuh';
    $('#nx') && ($('#nx').textContent = nx + ' · ' + j.waktu[nx] + ' WIB'); $('#cd') && ($('#cd').textContent = '- ' + hms(d));
    document.querySelectorAll('.pr').forEach(e => e.classList.toggle('act', e.dataset.s === nx));
  };
  tick(); timer = setInterval(tick, 1000);
}

async function vAgenda() {
  const p = await loadPub(); let staff = [];
  const bisa = S.user && S.user.peran.some(r => ['admin', 'ketua', 'sekretaris', 'bidang'].includes(r));
  if (bisa) { try { staff = await Api.post('listKegiatan'); } catch (e) { toast(e.message, 'err'); } }
  const form = bisa ? `<form id="fk" class="card form"><h3>Tambah Kegiatan</h3>
  <label>Nama kegiatan *<input name="nama" required></label><label>Tanggal *<input type="date" name="tanggal" required></label><label>Waktu<input type="time" name="waktu"></label>
  <label>Lokasi<input name="lokasi"></label><label>Penanggung jawab<input name="pj"></label><label>Kategori<input name="kategori" list="kat" placeholder="Kajian Rutin"></label>
  <datalist id="kat"><option>Kajian Rutin<option>KARAMAL<option>Salat Jumat<option>Ramadan<option>Sosial</datalist>
  <label class="chk"><input type="checkbox" name="publik" checked> Tampilkan di halaman publik</label><button class="btn">Simpan Kegiatan</button></form>` : '';
  view().innerHTML = `<h1 class="pt">Agenda Kegiatan</h1><div class="tw"><table><thead><tr><th>Tanggal</th><th>Kegiatan</th><th>Waktu</th><th>Lokasi</th><th>Kategori</th></tr></thead><tbody>${agendaRows(bisa ? staff : p.agenda)}</tbody></table></div>${form}`;
  $('#fk')?.addEventListener('submit', async e => {
    e.preventDefault(); const f = e.target, d = Object.fromEntries(new FormData(f)); d.publik = f.publik.checked;
    try { await Api.post('addKegiatan', d); S.pub = null; toast('Kegiatan tersimpan'); vAgenda(); } catch (x) { toast(x.message, 'err'); }
  });
}

function vLogin() {
  view().innerHTML = `<div class="card login"><img src="img/logo.png" alt=""><h2>Masuk Pengurus DKM</h2><form id="fl" class="form" style="grid-template-columns:1fr;text-align:left"><label>Username<input name="username" autocomplete="username" required autofocus></label><label>Sandi<input type="password" name="password" autocomplete="current-password" required></label><button class="btn">Masuk</button></form><p class="err" id="lerr"></p></div>`;
  $('#fl').onsubmit = async e => { e.preventDefault(); try { const m = await Api.post('login', Object.fromEntries(new FormData(e.target))); sessionStorage.setItem('tok', m.token); S.user = m.user; sessionStorage.setItem('usr', JSON.stringify(m.user)); location.hash = '#/dashboard'; route(); } catch (x) { $('#lerr').textContent = x.message; } };
}

const needAuth = k => { if (!can(k)) { location.hash = '#/login'; return false; } return true; };
const stat = (l, v, c = '') => `<div class="card stat ${c}"><small>${l}</small><b class="mono">${v}</b></div>`;

async function vDashboard() {
  if (!needAuth('dashboard')) return; view().innerHTML = '<p class="empty">Memuat…</p>';
  try {
    const r = await Api.post('ringkasan'), mx = Math.max(1, ...r.kas.map(k => Math.abs(k.saldo)));
    view().innerHTML = `<h1 class="pt">Assalamu'alaikum, ${esc(S.user.nama)}</h1><div class="grid4">${stat('Total Saldo Kas', rp(r.total), 'main')}${stat('Pemasukan Bulan Ini', rp(r.masuk), 'grn')}${stat('Pengeluaran Bulan Ini', rp(r.keluar))}${stat('Menunggu Persetujuan', r.menunggu + ' transaksi', r.menunggu ? 'amb' : '')}</div>
    <h3 class="sec">Saldo per Kas</h3><div class="card">${r.kas.map(k => `<div class="kas"><span>${esc(k.nama)}</span><b class="mono">${rp(k.saldo)}</b><div class="bar"><i style="width:${Math.max(0, k.saldo) / mx * 100}%"></i></div></div>`).join('')}</div>`;
  } catch (e) { authErr(e); }
}

function authErr(e) { toast(e.message, 'err'); if (/login|kedaluwarsa|valid/i.test(e.message)) { sessionStorage.clear(); S.user = null; location.hash = '#/login'; route(); } }
const badge = s => `<span class="bdg ${{ Disetujui: 'ok', Menunggu: 'wait', Ditolak: 'no' }[s] || ''}">${esc(s)}</span>`;

async function vKeuangan() {
  if (!needAuth('keuangan')) return; view().innerHTML = '<p class="empty">Memuat…</p>';
  try {
    const [r, t] = await Promise.all([Api.post('ringkasan'), Api.post('listTrx')]), ketua = S.user.peran.includes('ketua');
    const opt = r.kas.map(k => `<option value="${esc(k.kode)}">${esc(k.nama)}</option>`).join('');
    view().innerHTML = `<h1 class="pt">Keuangan</h1><div class="grid3">${r.kas.map(k => `<div class="card"><small>${esc(k.kode)} · ${esc(k.nama)}</small><b class="mono big">${rp(k.saldo)}</b><div class="muted mono">+${rp(k.masuk)} / −${rp(k.keluar)} bln ini</div></div>`).join('')}</div>
    ${grafik(r.bulanan)}<form id="ft" class="card form"><h3>Catat Transaksi</h3><label>Tipe<select name="tipe"><option value="masuk">Pemasukan</option><option value="keluar">Pengeluaran</option><option value="transfer">Transfer Antar-Kas</option></select></label>
    <label>Kas<select name="kode_kas">${opt}</select></label><label id="lt" hidden>Kas tujuan<select name="kas_tujuan">${opt}</select></label><label>Tanggal<input type="date" name="tanggal" value="${new Date().toISOString().slice(0, 10)}"></label>
    <label>Kategori<input name="kategori" placeholder="Infak Jumat, Listrik, …"></label><label>Nominal (Rp) *<input name="nominal" type="number" min="1" required class="mono"></label>
    <label>Pihak<input name="pihak"></label><label>Uraian<textarea name="uraian"></textarea></label><label>Bukti (foto nota)<input type="file" name="bf" accept="image/*"></label><button class="btn">Kirim untuk Persetujuan</button></form>
    <h3 class="sec">Transaksi Terbaru</h3><div class="tw"><table><thead><tr><th>No</th><th>Tanggal</th><th>Kas</th><th>Tipe</th><th>Kategori</th><th class="r">Nominal</th><th>Status</th><th></th></tr></thead><tbody>${t.length ? t.map(x => `<tr><td class="mono">${esc(x.no)}</td><td class="mono">${esc(x.tanggal)}</td><td>${esc(x.kode_kas)}</td><td>${esc(x.tipe)}</td><td>${esc(x.kategori)}</td><td class="r mono">${rp(x.nominal)}</td><td>${badge(x.status)}${x.id_bukti ? ' <a href="https://drive.google.com/file/d/' + esc(x.id_bukti) + '/view" target="_blank" rel="noopener">📎</a>' : ''}</td>
    <td>${ketua && x.status === 'Menunggu' ? `<button class="btn sm" data-n="${esc(x.no)}" data-s="Disetujui">Setujui</button> <button class="btn sm ghost" data-n="${esc(x.no)}" data-s="Ditolak">Tolak</button>` : ''}</td></tr>`).join('') : '<tr><td colspan="8" class="empty">Belum ada transaksi.</td></tr>'}</tbody></table></div>`;
    const f = $('#ft'); f.tipe.onchange = () => $('#lt').hidden = f.tipe.value !== 'transfer';
    f.onsubmit = async e => { e.preventDefault(); try { const d = Object.fromEntries(new FormData(f)), fl = f.bf.files[0]; delete d.bf; if (fl) d.bukti = await kompres(fl); const x = await Api.post('addTrx', d); toast('Tersimpan: ' + x.no); vKeuangan(); } catch (z) { authErr(z); } };
    document.querySelectorAll('[data-n]').forEach(b => b.onclick = async () => { try { await Api.post('setStatusTrx', { no: b.dataset.n, status: b.dataset.s }); toast('Status diperbarui'); vKeuangan(); } catch (z) { authErr(z); } });
  } catch (e) { authErr(e); }
}


function runClock(j) {
  clearInterval(timer);
  const tick = () => {
    const n = wibSec(); $('#clk') && ($('#clk').textContent = hms(n)); if (!j) return;
    let nx = SALAT.find(s => toSec(j.waktu[s]) > n), d = nx ? toSec(j.waktu[nx]) - n : toSec(j.waktu.Subuh) + 86400 - n; nx = nx || 'Subuh';
    $('#nx') && ($('#nx').textContent = nx + ' ' + j.waktu[nx]); $('#cd') && ($('#cd').textContent = '- ' + hms(d));
    document.querySelectorAll('.pr').forEach(e => e.classList.toggle('act', e.dataset.s === nx));
    if (n % 12 === 0 && window.slide) window.slide();
  }; tick(); timer = setInterval(tick, 1000);
}
async function vTV() {
  document.body.classList.add('tv'); const p = await loadPub(), j = p.jadwal; let i = 0;
  view().innerHTML = `<div class="tvw"><div class="tvh"><img src="img/logo.png" alt=""><div><b>MASJID AL-JAMAAL</b><small>Perum. Gading Elok Blok I, Karawang${j ? ' · ' + esc(j.hijriah) : ''}</small></div><div class="mono tvc" id="clk"></div></div>
  <div class="tvg">${j ? SALAT.map(s => `<div class="pr tvp" data-s="${s}"><small>${s}</small><b class="mono">${j.waktu[s]}</b></div>`).join('') : '<p>Jadwal belum tersedia</p>'}</div>
  <div class="tvb"><span>MENUJU <b id="nx"></b></span><b class="mono" id="cd"></b></div><div class="tvs" id="sl"></div><a class="tvx" href="#/">✕ Keluar</a></div>`;
  window.slide = () => { const a = (p.pengumuman || []).map(x => ({ t: 'PENGUMUMAN', h: x.judul, d: x.isi })).concat(p.agenda.map(x => ({ t: 'AGENDA', h: x.nama, d: x.tanggal + ' · ' + x.waktu + ' · ' + x.lokasi }))); const s = a[i % (a.length || 1)]; $('#sl') && ($('#sl').innerHTML = s ? `<small>${s.t}</small><h2>${esc(s.h)}</h2><p>${esc(s.d)}</p>` : '<h2>Selamat datang di Masjid Al-Jamaal</h2>'); i++; };
  window.slide(); runClock(j);
}
async function vLaporan() {
  if (!needAuth('laporan')) return;
  try {
    const [r, t] = await Promise.all([Api.post('ringkasan'), Api.post('listTrx')]), nm = {}; r.kas.forEach(k => nm[k.kode] = k.nama);
    view().innerHTML = `<div class="noprt"><h1 class="pt">Laporan Keuangan</h1><div class="card form"><label>Kas<select id="fk2"><option value="">Semua kas</option>${r.kas.map(k => `<option value="${esc(k.kode)}">${esc(k.nama)}</option>`).join('')}</select></label>
    <label>Bulan<input type="month" id="fb" value="${new Date().toISOString().slice(0, 7)}"></label><button class="btn" id="pr">Cetak / Simpan PDF</button><button class="btn ghost" id="wa">Bagikan via WhatsApp</button><button class="btn ghost" id="em">Kirim via Email</button></div></div><div id="rep"></div>`;
    let txt = ''; const draw = () => {
      const k = $('#fk2').value, b = $('#fb').value, L = t.filter(x => x.status === 'Disetujui' && String(x.tanggal).slice(0, 7) === b && (!k || x.kode_kas === k || x.kas_tujuan === k));
      const m = L.filter(x => x.tipe === 'masuk').reduce((s, x) => s + Number(x.nominal), 0), c = L.filter(x => x.tipe === 'keluar').reduce((s, x) => s + Number(x.nominal), 0);
      txt = `Laporan Kas Masjid Al-Jamaal ${k ? '(' + nm[k] + ') ' : ''}${b}\nPemasukan: ${rp(m)}\nPengeluaran: ${rp(c)}\nSelisih: ${rp(m - c)}\nSaldo total kas: ${rp(r.total)}`;
      $('#rep').innerHTML = `<div class="prh"><img src="img/logo.png" alt=""><div><h2>Laporan Keuangan Masjid Al-Jamaal</h2><p>Periode ${esc(b)} · ${k ? esc(nm[k]) : 'Semua kas'} · Dicetak ${new Date().toLocaleDateString('id-ID')} oleh ${esc(S.user.nama)}</p></div></div>
      <div class="tw"><table><thead><tr><th>Tanggal</th><th>No</th><th>Kas</th><th>Kategori</th><th class="r">Masuk</th><th class="r">Keluar</th></tr></thead><tbody>${L.length ? L.map(x => `<tr><td class="mono">${esc(x.tanggal)}</td><td class="mono">${esc(x.no)}</td><td>${esc(nm[x.kode_kas] || x.kode_kas)}</td><td>${esc(x.kategori)}</td><td class="r mono">${x.tipe === 'masuk' ? rp(x.nominal) : ''}</td><td class="r mono">${x.tipe === 'keluar' ? rp(x.nominal) : ''}</td></tr>`).join('') : '<tr><td colspan="6" class="empty">Tidak ada transaksi disetujui pada periode ini.</td></tr>'}
      <tr><th colspan="4">TOTAL</th><th class="r mono">${rp(m)}</th><th class="r mono">${rp(c)}</th></tr></tbody></table></div>`;
    };
    $('#fk2').onchange = $('#fb').onchange = draw; $('#pr').onclick = () => window.print(); $('#wa').onclick = () => window.open('https://wa.me/?text=' + encodeURIComponent(txt)); $('#em').onclick = async () => { const to = prompt('Kirim laporan ke alamat email:'); if (!to) return; try { await Api.post('kirimLaporan', { to: to, subjek: 'Laporan Kas Masjid Al-Jamaal', isi: txt }); toast('Email terkirim'); } catch (z) { authErr(z); } }; draw();
  } catch (e) { authErr(e); }
}
async function vRapat() {
  if (!needAuth('rapat')) return;
  try {
    const L = await Api.post('listRapat');
    view().innerHTML = `<h1 class="pt">Rapat & Notulen</h1><form id="fr" class="card form"><h3>Catat Rapat</h3><label>Judul *<input name="judul" required></label><label>Tanggal *<input type="date" name="tanggal" required></label><label>Tempat<input name="tempat"></label><label>Pimpinan<input name="pimpinan"></label>
    <label>Notulen<textarea name="notulen" rows="4"></textarea></label><label>Keputusan & tindak lanjut<textarea name="keputusan" rows="4"></textarea></label><button class="btn">Simpan Notulen</button></form>
    ${L.length ? L.map(x => `<div class="card" style="margin-bottom:12px"><span class="tag">${esc(x.tanggal)}</span><h3>${esc(x.judul)}</h3><small class="muted">${esc(x.tempat)} · Pimpinan: ${esc(x.pimpinan)}</small><p style="white-space:pre-wrap">${esc(x.notulen)}</p><b>Keputusan</b><p style="white-space:pre-wrap">${esc(x.keputusan)}</p></div>`).join('') : '<p class="empty">Belum ada notulen.</p>'}`;
    $('#fr').onsubmit = async e => { e.preventDefault(); try { await Api.post('addRapat', Object.fromEntries(new FormData(e.target))); toast('Notulen tersimpan'); vRapat(); } catch (z) { authErr(z); } };
  } catch (e) { authErr(e); }
}
async function vPengguna() {
  if (!needAuth('pengguna')) return;
  try {
    const L = await Api.post('listUsers');
    view().innerHTML = `<h1 class="pt">Pengguna & Hak Akses</h1><form id="fu" class="card form"><h3>Tambah Pengguna</h3><label>Username *<input name="username" required pattern="[a-z0-9._-]{3,20}" title="3-20 karakter: huruf kecil, angka, titik, strip"></label><label>Nama *<input name="nama" required></label><label>Sandi awal *<input type="password" name="password" minlength="6" required></label>
    <label>Peran<select name="peran"><option value="ketua">Ketua DKM</option><option value="bendahara">Bendahara</option><option value="sekretaris">Sekretaris</option><option value="bidang">Pengurus Bidang</option><option value="admin">Admin</option></select></label><button class="btn">Daftarkan</button></form>
    <div class="tw"><table><thead><tr><th>Nama</th><th>Username</th><th>Peran</th><th>Aktif</th><th></th></tr></thead><tbody>${L.map(x => `<tr><td>${esc(x.nama)}</td><td class="mono">${esc(x.username)}</td><td><span class="tag">${esc(x.peran)}</span></td><td>${esc(x.aktif)}</td><td><button class="btn sm ghost" data-u="${esc(x.username)}">Atur ulang sandi</button></td></tr>`).join('')}</tbody></table></div>`;
    $('#fu').onsubmit = async e => { e.preventDefault(); try { await Api.post('addUser', Object.fromEntries(new FormData(e.target))); toast('Pengguna terdaftar'); vPengguna(); } catch (z) { authErr(z); } };
    document.querySelectorAll('[data-u]').forEach(b => b.onclick = async () => { const pw = prompt('Sandi baru untuk ' + b.dataset.u + ' (min. 6 karakter):'); if (!pw) return; try { await Api.post('setPassword', { username: b.dataset.u, password: pw }); toast('Sandi diatur ulang'); } catch (z) { authErr(z); } });
  } catch (e) { authErr(e); }
}

function grafik(b) {
  const mx = Math.max(1, ...b.flatMap(x => [x.masuk, x.keluar])), w = 300 / b.length;
  return `<div class="card"><h3>Pemasukan vs Pengeluaran (6 bulan)</h3><svg viewBox="0 0 300 120" class="chart">${b.map((x, i) => { const h1 = x.masuk / mx * 90, h2 = x.keluar / mx * 90; return `<rect x="${i * w + 8}" y="${100 - h1}" width="${w / 2 - 10}" height="${h1}" fill="#0B4F8A"/><rect x="${i * w + w / 2 - 2}" y="${100 - h2}" width="${w / 2 - 10}" height="${h2}" fill="#1E9BF0"/><text x="${i * w + w / 2}" y="114" font-size="9" text-anchor="middle" fill="#4B5563">${x.b.slice(5)}</text>`; }).join('')}</svg><small class="muted"><b style="color:#0B4F8A">■</b> Pemasukan <b style="color:#1E9BF0">■</b> Pengeluaran (hanya transaksi disetujui)</small></div>`;
}
const kompres = f => new Promise((ok, no) => { const im = new Image(), r = new FileReader(); r.onload = () => { im.onload = () => { const s = Math.min(1, 1024 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = im.width * s; c.height = im.height * s; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); ok({ mime: 'image/jpeg', data: c.toDataURL('image/jpeg', .7).split(',')[1] }); }; im.onerror = () => no(new Error('File harus berupa gambar')); im.src = r.result; }; r.readAsDataURL(f); });
async function vPengumuman() {
  if (!needAuth('pengumuman')) return; const p = await loadPub();
  view().innerHTML = `<h1 class="pt">Pengumuman</h1><form id="fp" class="card form"><h3>Buat Pengumuman</h3><label>Judul *<input name="judul" required></label><label>Kategori<input name="kategori" placeholder="Kegiatan"></label><label>Isi *<textarea name="isi" rows="3" required></textarea></label><button class="btn">Terbitkan</button></form>${(p.pengumuman || []).map(x => `<div class="card"><span class="tag">${esc(x.kategori)}</span> <small class="muted">${esc(x.tanggal)}</small><h3>${esc(x.judul)}</h3><p>${esc(x.isi)}</p></div>`).join('')}`;
  $('#fp').onsubmit = async e => { e.preventDefault(); try { await Api.post('addPengumuman', Object.fromEntries(new FormData(e.target))); S.pub = null; toast('Pengumuman terbit'); vPengumuman(); } catch (z) { authErr(z); } };
}
async function vLog() {
  if (!needAuth('log')) return;
  try { const L = await Api.post('listLog'); view().innerHTML = `<h1 class="pt">Log Aktivitas</h1><div class="tw"><table><thead><tr><th>Waktu</th><th>Pengguna</th><th>Aksi</th><th>Detail</th></tr></thead><tbody>${L.map(x => `<tr><td class="mono">${esc(x.waktu)}</td><td>${esc(x.pengguna)}</td><td><span class="tag">${esc(x.aksi)}</span></td><td>${esc(x.detail)}</td></tr>`).join('')}</tbody></table></div>`; } catch (e) { authErr(e); }
}

function route() {
  document.body.classList.remove('tv'); $('#menu').classList.remove('open');
  clearInterval(timer); nav();
  const h = location.hash.replace('#/', '') || '';
  ({ '': vBeranda, agenda: vAgenda, login: vLogin, dashboard: vDashboard, keuangan: vKeuangan, tv: vTV, laporan: vLaporan, rapat: vRapat, pengguna: vPengguna, pengumuman: vPengumuman, log: vLog }[h] || vBeranda)();
}
window.addEventListener('hashchange', route); route();

$('#burger').addEventListener('click', () => $('#menu').classList.toggle('open'));
