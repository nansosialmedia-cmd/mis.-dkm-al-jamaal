# Panduan Instalasi — DKM Al-Jamaal (3 langkah)

## Persiapan (sekali)
- Akun GitHub (github.com/signup) dan akun Google.
- Buat repository **kosong**: github.com/new → isi nama (mis. `dkm-al-jamaal`) → **jangan** centang README / .gitignore / license → Create.

## Langkah 1 — Backend (Google Apps Script)
1. Buka https://script.google.com → **Proyek baru** → hapus isi bawaan → tempel seluruh isi `Kode.gs`.
2. Pilih fungsi `setupAppEnvironment` di menu atas → ▶ **Run** (SEKALI SAJA) → izinkan akses (Advanced → Go to ... → Allow).
3. Buka **Execution log**, catat baris: `LOGIN ADMIN -> Username: admin | Sandi: xxxxxxxx`.
4. **Deploy → New deployment → Web app** → Execute as: **Me**, Who has access: **Anyone** → Deploy → salin URL berakhiran `/exec`.

## Langkah 2 — Frontend ke GitHub (otomatis)
1. Ekstrak ZIP. Buka folder `dkm-al-jamaal`.
2. Klik dua kali **`MULAI-DI-SINI.bat`** lalu jawab pertanyaannya: tempel URL `/exec`, nama, email, dan URL repository. Installer memasang Git bila belum ada, mengisi `config.js`, dan mengirim semua file.
3. Saat selesai, ikuti petunjuk di layar: GitHub → Settings → Pages → Branch `main` / `(root)` → Save.

## Langkah 3 — Pakai
Buka alamat `https://NAMAANDA.github.io/NAMA-REPO/` → **Login Pengurus** → username `admin` + sandi dari Langkah 1 → menu **Pengguna** untuk membuat akun Ketua, Bendahara, Sekretaris, dan Bidang. Segera klik **Ganti Sandi**.

**Update aplikasi:** ganti file yang berubah lalu klik dua kali `MULAI-DI-SINI.bat` lagi. Jika `Kode.gs` berubah: tempel ulang → Deploy → Manage deployments → ✏️ → New version.

## Fitur baru (versi 3)
- **Menu bertema:** Tampilan & Identitas → pilih tema (Putih-Biru, Hijau, Maroon-Gold, Dark-Gold) dan unggah foto masjid untuk beranda.
- **Pengguna merangkap jabatan:** menu Pengguna → centang beberapa peran untuk satu akun. Akun itu bisa memilih "Sebagai ..." di sidebar. Tiap akun hanya mengubah profil/fotonya sendiri.
- **Pengaturan TV:** menu Pengaturan TV → pilih yang tampil, durasi, tema TV, unggah template kajian (bisa dijadwalkan tanggal tampil), dan panduan sambungan ke TV ada di halaman itu.
- **Laporan & notulen:** tombol Simpan PDF, Bagikan PDF ke WhatsApp (HP: lembar bagikan, PC: PDF terunduh lalu lampirkan), Cetak.
- **Foto:** pengumuman, agenda, profil, hero beranda, dan poster TV tersimpan di Google Drive (tampil publik lewat tautan); lampiran bukti transaksi tetap privat.
- **Update dari versi lama:** tempel ulang `Kode.gs` → Deploy → Manage deployments → ✏️ → New version → izinkan akses Drive baru. Kolom baru di Sheet dibuat otomatis. Lalu ekstrak ZIP baru dan klik `MULAI-DI-SINI.bat`.

## Tampilkan di TV Masjid + alarm adzan & iqamah
Alamat layar TV: `https://NAMAANDA.github.io/NAMA-REPO/#/tv`

**Cara termudah dan paling stabil: PC/mini-PC/laptop + kabel HDMI ke TV**
1. Klik kanan Desktop → New → Shortcut, isi lokasi:
   `"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --autoplay-policy=no-user-gesture-required https://NAMAANDA.github.io/NAMA-REPO/#/tv`
2. Agar menyala otomatis saat komputer hidup: tekan `Win + R` → ketik `shell:startup` → pindahkan shortcut tadi ke folder itu.
3. Windows: Settings → System → Power → Screen & Sleep = **Never**. Atur volume komputer/TV.

**Alternatif:** Android TV / TV box → pasang *Fully Kiosk Browser* (Start URL = alamat di atas, aktifkan *Keep Screen On* dan *Autoplay Audio*); Smart TV → buka alamat lewat browser bawaan; Chromecast → Chrome → ⋮ → Cast → pilih tab.

**Pertama kali dibuka:** muncul layar "Tekan OK / klik untuk mulai & aktifkan suara" → tekan **OK/Enter** (browser mewajibkan satu sentuhan agar suara boleh bunyi). Layar otomatis penuh.

**Uji suara kapan saja:** tekan **A** (tes adzan) atau **I** (tes iqamah) di keyboard.

**Alarm otomatis:** saat waktu adzan 5 waktu, terdengar bunyi dan layar hijau-biru berkedip bertuliskan ADZAN (2 menit); setelah jeda iqamah, bunyi lagi dengan tulisan IQAMAH (1,5 menit). Jeda iqamah diatur di `js/pengaturan.js` (Subuh 15, Zuhur 10, Asar 10, Magrib 8, Isya 10 menit). Suara asli: taruh `adzan.mp3` dan `iqamah.mp3` di folder `audio/`, lalu klik `MULAI-DI-SINI.bat`. Tanpa file itu dipakai nada lonceng.
TV memuat ulang sendiri tiap tengah malam (jadwal hari baru) dan menyegarkan agenda tiap 10 menit; bila internet putus, jam, jadwal tersimpan, dan alarm tetap jalan.

## Catatan kecepatan
- Halaman tampil seketika dari data tersimpan, lalu diperbarui diam-diam; Dashboard/Keuangan diperbarui otomatis tiap 1 menit.
- Setelah update aplikasi, **muat ulang 2 kali** agar versi baru aktif.
- Perubahan yang dibuat langsung di Google Sheets tampil paling lambat 5 menit; lewat aplikasi langsung.

## Jika ada masalah
| Gejala | Penyebab & solusi |
|---|---|
| `git is not recognized` | Git belum terpasang → jalankan installer, jawab `y`, lalu buka ulang `MULAI-DI-SINI.bat`. |
| `Author identity unknown` | Nama/email belum diisi → installer menanyakannya otomatis. |
| `LF will be replaced by CRLF` | Hanya peringatan, **aman diabaikan**. |
| `Pengiriman ditolak` / rejected | Repository dibuat dengan README → jawab `y` untuk menimpa. |
| Halaman GitHub Pages 404 | Tunggu 1–3 menit; pastikan Pages diatur ke `main` / `(root)`. |
| `Failed to fetch` di aplikasi | `GAS_URL` salah, atau deployment belum "Anyone"; deploy ulang sebagai New version. |
| Jadwal salat kosong | Muat ulang; API jadwal sedang tidak merespons, tersimpan otomatis begitu pulih. |
| Lupa sandi admin | Di Apps Script jalankan fungsi `resetAdmin`, lihat sandi baru di Execution log. |
| Tautan 📎 bukti tidak terbuka | Bagikan folder `Bukti_Transaksi` di Google Drive ke Ketua/Bendahara. |

Catatan: login gagal 5 kali = terkunci 10 menit; sesi berlaku 12 jam; fitur email/bukti meminta izin tambahan saat deploy (izinkan).
