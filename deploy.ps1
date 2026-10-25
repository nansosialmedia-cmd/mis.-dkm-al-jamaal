# Pemasang interaktif DKM Al-Jamaal -> GitHub Pages (jalankan lewat MULAI-DI-SINI.bat)
Set-Location -Path $PSScriptRoot
function Say($m, $c = 'White') { Write-Host $m -ForegroundColor $c }
function Ask($q, $d = '') { $s = ''; if ($d) { $s = " [$d]" }; $r = Read-Host "$q$s"; if ([string]::IsNullOrWhiteSpace($r)) { return $d } else { return $r.Trim() } }
function Stop-Here { Read-Host 'Tekan Enter untuk menutup'; exit }

Say '=== Pemasang DKM Al-Jamaal ke GitHub Pages ===' Cyan

# LANGKAH 1: Git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Say '[1/5] Git belum terpasang di komputer ini.' Yellow
  if ((Ask 'Pasang Git sekarang? (y/n)' 'y') -eq 'y') {
    winget install --id Git.Git -e --source winget
    Say 'Selesai. TUTUP jendela ini, lalu klik dua kali MULAI-DI-SINI.bat lagi.' Green
  } else { Say 'Pasang manual dari https://git-scm.com/download/win lalu jalankan ulang.' Yellow }
  Stop-Here
}
Say '[1/5] Git sudah terpasang.' Green

# LANGKAH 2: URL Apps Script -> js\config.js
$cfg = Get-Content 'js\config.js' -Raw
if ($cfg -match 'GANTI_DENGAN') {
  while ($true) {
    $u = Ask '[2/5] Tempel URL Web App Apps Script (berakhiran /exec)'
    if ($u -match '^https://script\.google\.com/macros/s/.+/exec$') { break }
    Say 'URL tidak sesuai. Harus diawali https://script.google.com/macros/s/ dan diakhiri /exec' Red
  }
  $isi = "// URL Web App Apps Script`nconst GAS_URL = '$u';`n"
  [IO.File]::WriteAllText((Join-Path $PSScriptRoot 'js\config.js'), $isi, (New-Object Text.UTF8Encoding($false)))
  Say 'config.js sudah diisi.' Green
} else { Say '[2/5] config.js sudah terisi (dilewati).' Green }

# LANGKAH 3: identitas Git
$n = git config --global user.name; $e = git config --global user.email
if (-not $n) { $n = Ask '[3/5] Nama Anda'; git config --global user.name $n }
if (-not $e) { $e = Ask '[3/5] Email (sebaiknya email akun GitHub)'; git config --global user.email $e }
Say "[3/5] Identitas Git: $n <$e>" Green

# LANGKAH 4: repository
if (-not (Test-Path '.git')) { git init -b main | Out-Null }
$remote = git remote get-url origin 2>$null
if (-not $remote) {
  Say 'Buat repository KOSONG di github.com/new (jangan centang README/.gitignore/license), lalu salin URL-nya.' Yellow
  while ($true) {
    $remote = Ask '[4/5] URL repository (contoh https://github.com/namaanda/dkm-al-jamaal)'
    if ($remote -match '^https://github\.com/[^/]+/[^/]+$') { break }
    Say 'Format salah. Contoh: https://github.com/namaanda/dkm-al-jamaal' Red
  }
  $remote = $remote -replace '\.git$', ''
  git remote add origin ($remote + '.git')
}
git add . 2>$null
git commit -m ('Update ' + (Get-Date -Format 'yyyy-MM-dd HH:mm')) 2>&1 | Out-Null
git branch -M main
Say '[4/5] File siap dikirim.' Green

# LANGKAH 5: kirim ke GitHub
Say '[5/5] Mengirim ke GitHub. Jika muncul jendela login, masuk dengan akun GitHub Anda.' Cyan
git push -u origin main
if ($LASTEXITCODE -ne 0) {
  Say 'Pengiriman ditolak. Penyebab umum: repository dibuat dengan README, sehingga isinya berbeda.' Yellow
  if ((Ask 'Timpa isi repository dengan folder ini? (y/n)' 'n') -eq 'y') { git push -u origin main --force }
}
if ($LASTEXITCODE -eq 0) {
  $url = git remote get-url origin
  if ($url -match 'github\.com/([^/]+)/([^/.]+)') {
    $o = $Matches[1]; $r = $Matches[2]
    Say 'BERHASIL terkirim!' Green
    Say "Langkah terakhir (sekali saja): buka https://github.com/$o/$r/settings/pages" White
    Say '  -> Source: Deploy from a branch -> Branch: main, folder: / (root) -> Save' White
    Say "Alamat aplikasi (aktif 1-3 menit): https://$o.github.io/$r/" Green
    if ((Ask 'Buka halaman pengaturan Pages sekarang? (y/n)' 'y') -eq 'y') { Start-Process "https://github.com/$o/$r/settings/pages" }
  }
} else { Say 'Belum berhasil. Salin pesan merah di atas dan kirim ke Claude.' Red }
Say 'Update di kemudian hari: klik dua kali MULAI-DI-SINI.bat lagi.' Cyan
Stop-Here
