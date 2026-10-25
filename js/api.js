const Api = {
  token: () => sessionStorage.getItem('tok'),
  async get(a) {
    const r = await fetch(GAS_URL + '?action=' + a), j = await r.json();
    if (!j.success) throw new Error(j.message); return j.data;
  },
  async post(a, d) { // WAJIB text/plain agar tidak kena CORS preflight
    const r = await fetch(GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: a, token: Api.token(), data: d || {} }) });
    const j = await r.json(); if (!j.success) throw new Error(j.message); return j.data;
  }
};
