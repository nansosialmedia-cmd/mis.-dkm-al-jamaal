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
