// Lapisan data: stale-while-revalidate + optimistic UI (gas-instant-ux)
const Cache = {
  get(k) { try { return JSON.parse(localStorage.getItem('c_' + k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem('c_' + k, JSON.stringify(v)); } catch (e) {} },
  clear() { Object.keys(localStorage).filter(k => k.indexOf('c_u_') === 0).forEach(k => localStorage.removeItem(k)); }
};
const READ = ['ringkasan', 'listTrx', 'listKegiatan', 'listRapat', 'listUsers', 'listLog'];
// catatan: savePengaturan/updateProfil lewat Api.post biasa lalu sync otomatis
const Api = {
  busy: 0,
  token: () => sessionStorage.getItem('tok'),
  async _get(a) { const r = await fetch(GAS_URL + '?action=' + a), j = await r.json(); if (!j.success) throw new Error(j.message); return j.data; },
  async _post(a, d) { // WAJIB text/plain agar tidak kena CORS preflight
    const r = await fetch(GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: a, token: Api.token(), data: d || {} }) });
    const j = await r.json(); if (!j.success) throw new Error(j.message); return j.data;
  },
  swr(key, load, fresh) { // tampilkan cache SEKETIKA, segarkan di latar belakang
    const c = Cache.get(key);
    const p = load().then(v => { if (!Api.busy && JSON.stringify(v) !== JSON.stringify(c)) { Cache.set(key, v); if (c !== null && fresh) fresh(v); } return v; });
    if (c !== null) { p.catch(() => {}); return Promise.resolve(c); }
    return p;
  },
  get(a) { return Api.swr('publik', () => Api._get(a), v => { S.pub = v; refreshView(); }); },
  post(a, d) {
    if (READ.indexOf(a) > -1) return Api.swr('u_' + a, () => Api._post(a, d), () => refreshView());
    return Api._post(a, d).then(r => { Api.sync(); return r; });
  },
  patch(k, fn) { const v = Cache.get(k); if (v === null) return; const n = fn(v); Cache.set(k, n); if (k === 'publik') S.pub = n; },
  opt(a, d, apply) { // UI berubah 0 ms, server menyusul; gagal = dikembalikan
    const snap = {}; Object.keys(localStorage).forEach(k => { if (k.indexOf('c_u_') === 0 || k === 'c_publik') snap[k] = localStorage.getItem(k); });
    Api.busy++; apply(); refreshView(true);
    return Api._post(a, d).then(r => { Api.busy--; return Api.sync().then(() => r); })
      .catch(e => { Api.busy--; Object.keys(snap).forEach(k => localStorage.setItem(k, snap[k])); try { S.pub = JSON.parse(snap.c_publik); } catch (z) {} refreshView(true); throw e; });
  },
  async sync(silent) { // 1 panggilan batch untuk semua data pengurus
    if (!Api.token() || Api.busy) return;
    try {
      const o = await Api._post('bootstrap'); let ch = false;
      Object.keys(o).forEach(k => { if (JSON.stringify(o[k]) !== JSON.stringify(Cache.get('u_' + k))) { Cache.set('u_' + k, o[k]); ch = true; } });
      const p = await Api._get('publik');
      if (JSON.stringify(p) !== JSON.stringify(Cache.get('publik'))) { Cache.set('publik', p); S.pub = p; ch = true; }
      if (ch && !silent) refreshView();
    } catch (e) { if (/login|kedaluwarsa|valid/i.test(e.message)) authErr(e); }
  }
};
