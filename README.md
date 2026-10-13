# Duel Interpretasi — Prototipe Game FPS 3D (Web Preview)

Game **first-person 3D** yang berjalan langsung di browser (Three.js + WebGL, dibundel Vite).
Dibuat sebagai **preview & percobaan di web (GitHub Pages)** sebelum dijadikan aplikasi game sungguhan.

> Konsep: bukan FPS tembak-tembakan biasa. Di Desa Aster kamu menghadapi **Roh Ladang** —
> amati perilakunya (**AMATI**), pancing reaksinya (**UJI**), kumpulkan 3 jejak pikiran,
> lalu susun **interpretasi** yang benar dan putuskan nasibnya. Musuh bahkan *mempelajari pola hindarmu*.

## ▶️ Cara main

| Aksi | Desktop | Mobile |
|---|---|---|
| Bergerak | `W A S D` | Joystick kiri |
| Melihat | Mouse (klik layar untuk mengunci pointer) | Geser sisi kanan layar |
| Lari (sprint) | `SHIFT` (ada stamina) | — |
| Amati roh | `E` | Tombol **AMATI** |
| Uji dugaan | `F` | Tombol **UJI** |
| Menghindar | `SPASI` | Tombol **HINDAR** |
| Tafsirkan (setelah 3 jejak) | `R` | Tombol **TAFSIR** |
| Jeda / Suara | `P` / `M` | Tombol ❚❚ / ♪ di kanan atas |

Alur: dekati roh → **AMATI** saat ia bereaksi → gunakan **UJI** (berpura-pura pergi / suara lonceng / lempar batu) untuk memancing respons berbeda → kumpulkan **3 jejak** → **TAFSIR** → pilih resolusi (Murnikan / Ikat / Hancurkan). Setiap pilihan mengubah akhir cerita & warna dunia.

## ✨ Yang sudah ada di Playtest 0.2

> **Perbaikan 0.2.1 (panel & layar HP):** panel UJI/TAFSIR kini pasti bisa ditutup & dipilih di layar sentuh (tombol ✕ besar 44px, ketuk di luar panel untuk menutup, `Esc` di desktop, kontrol di belakang panel mati total saat panel terbuka). Layar mengikuti `visualViewport` + `100dvh` dan ada tombol **⛶ layar penuh** agar tidak kepotong toolbar browser.

- **Kamera first-person penuh**: pointer-lock mouse, sentuh-geser di HP, *head-bob*, kamera miring saat strafing/dodge, FOV dinamis saat lari & menghindar, langkah kaki bersuara sintetis.
- **Viewmodel tangan + jimat penafsir** di layar: berayun saat berjalan, terangkat saat mengamati, permata berubah warna (membidik = emas, siap tafsir = hijau, mengamati = berdenyut).
- **Dunia cel-shaded prosedural**: desa dengan 5 rumah, ladang gandum, lonceng, kuil batu, pagar, bunga, bebatuan, lentera hangat, pegunungan, awan bergerak, langit gradasi + matahari, serbuk sari beterbangan, burung melintas, pohon bergoyang.
- **Musuh ber-AI perilaku**: menyerang dengan proyektil, mengejar saat kamu "pergi", terpaku sedih oleh lonceng, dan *belajar* dari pola hindarmu (proyektil berikutnya memotong arah gerakmu).
- **HUD lengkap**: tujuan, bar Kejernihan + Stamina, panel Jejak Pikiran, kompas arah (◆ roh, ♪ lonceng), crosshair dinamis, indikator FPS dengan **kualitas grafis otomatis** (pixel-ratio turun sendiri di HP kentang), layar jeda, efek damage & peringatan kejernihan rendah.
- **Audio sintetis** (WebAudio, tanpa file): lonceng, nada amati/tafsir, langkah, serangan — tombol `M` untuk bisu.
- **Checkpoint otomatis** di `localStorage`, 3 interpretasi, 3 ending berbeda.
- **Siap install sebagai PWA** (`manifest.webmanifest`, mode fullscreen landscape) — jembatan menuju aplikasi.

## 🛠️ Menjalankan lokal

```bash
npm install
npm run dev      # mode pengembangan
npm run build    # hasil produksi di dist/
npm run preview  # pratinjau hasil build
```

## 🌐 Deploy ke GitHub Pages (web preview)

Ada dua cara — cara A paling cepat untuk preview:

**Cara A — dari folder `docs/` (tanpa Actions, sudah disiapkan):**
1. Di GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
2. Pilih branch yang berisi game ini, folder **`/docs`**, lalu **Save**.
3. Tunggu ±1 menit → game online di `https://<username>.github.io/<nama-repo>/`.
   Setiap kali game diperbarui: `npm run build`, salin `dist/` ke `docs/`, commit, push.

**Cara B — GitHub Actions (otomatis tiap push ke `main`):**
1. File `deploy-ke-github-pages.yml` di repo ini adalah workflow-nya. Di GitHub buat file baru `.github/workflows/deploy.yml` dan salin isinya (atau pindahkan file itu ke folder tersebut lewat web GitHub).
2. **Settings → Pages → Source: GitHub Actions**.
3. Push ke `main` → build & deploy berjalan otomatis.

Tidak perlu server, database, atau biaya: GitHub Pages menyajikan file statis `dist/` hasil build.

## 🗺️ Roadmap menuju aplikasi game

1. **Sekarang — Web preview (GitHub Pages):** playtest, kumpulkan masukan, ukur FPS di berbagai HP.
2. **PWA terinstall:** tambahkan service worker (offline) → game bisa di-"install" dari browser seperti aplikasi.
3. **Aplikasi mobile/desktop:** bungkus build web yang sama dengan **Capacitor** (Android/iOS) atau **Tauri** (Windows/macOS) — tanpa menulis ulang game.
4. **Konten penuh:** banyak roh dengan psikologi berbeda, dialog bersuara, save slot, pengaturan grafis manual, gamepad.

## 📁 Struktur

```
index.html            # HUD, layar menu/jeda/hasil
src/main.js           # seluruh game: dunia 3D, AI musuh, input, audio
src/style.css         # tampilan HUD & layar
public/               # manifest PWA + ikon
.github/workflows/    # deploy otomatis ke GitHub Pages
```
