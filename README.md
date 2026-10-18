# HEA — Arcane Arena

Prototipe game pertarungan sihir 3D **mobile-first** yang bisa langsung dimainkan di
browser: satu pemain melawan satu boss terbang, **IGNIS**, di arena kota 600 × 600 m
yang bisa dihancurkan. Terbang bebas, perisai Aegis directional (depan + samping,
belakang titik buta), empat sihir yang bisa disusun bebas, hempasan ragdoll, dan navigasi boss yang sadar
cover. Tanpa backend, akun, atau koneksi eksternal saat bermain.

▶ **Mainkan:** https://hiraneku.github.io/Hea/

Dibangun dari repo yang awalnya hanya berisi `reference.mp4`; video itu (dan
`reference2.mp4`) adalah acuan arena greybox, tembakan api, laser cyan, perisai
heksagonal, puing, dan impact frame. Ini prototipe web — belum aplikasi mobile/native.

## Menjalankan

Gunakan Node.js 22.12+ dan npm.

```bash
npm ci
npm run dev     # http://localhost:5173
```

| Perintah               | Fungsi                                                   |
| ---------------------- | -------------------------------------------------------- |
| `npm run dev`          | Server pengembangan Vite (port 5173)                     |
| `npm run build`        | Cek TypeScript + bundel produksi ke `dist/`              |
| `npm run preview`      | Preview build produksi (port 4173)                       |
| `npm test`             | Unit test fisika / collision / logika murni              |
| `npm run test:e2e`     | Browser test Playwright (server dev/preview harus jalan) |
| `npm run lint`         | ESLint                                                   |
| `npm run format:check` | Pemeriksaan format Prettier                              |

Semua font, grafis, dan video dilayani dari origin yang sama; tidak membutuhkan CDN.

## Cara bermain

Hadapi IGNIS (1440 HP) dengan 100 HP milikmu. Energi hanya dipakai untuk sihir;
terbang dan Aegis tidak menguras energi.

**Empat sihir, disusun lewat Grimoire (maks. 4 slot):** **BARA** (proyektil api memburu), **PRISMA** (tap: lingkaran cahaya
menembakkan sinar penyapu proyektil; tahan: lancip berat pembongkar dinding),
**NOVA** (ledakan penghempas boss; tahan untuk muatan lebih besar), dan **FALL**
(gravitasi: tahan untuk menghantam boss ke tanah dan menahannya tertekan di sana —
ia tidak bisa lolos sampai kamu melepasnya).

**Aegis** aktif otomatis tanpa cooldown dan tanpa biaya, menutupi busur 240° di depan
dan samping tubuh — **belakang adalah titik buta**. Satu patch perisai menahan 5 hit
lalu pecah dan meninggalkan lubang sesaat di arah itu. Serangan berat boss membekukan
kontak sejenak, lalu menghempaskanmu sebagai ragdoll menembus arena yang destruktibel.

IGNIS menyerang dengan empat pola bergilir: Rentetan Api, Mantra Pemburu (misil
homing), Hempasan Surya, dan Pusaran Surya (sumur gravitasi yang meledak menjadi
cincin bara — kaburlah naik/menukik, jangan lurus membelakanginya).

## Kontrol

| Aksi                 | Desktop                                       | Mobile                     |
| -------------------- | --------------------------------------------- | -------------------------- |
| Bergerak             | WASD / panah                                  | Joystick kiri              |
| Arahkan kamera       | Mouse; seret jika pointer lock tidak tersedia | Geser area kanan           |
| Fokus boss           | E / klik kanan                                | Tombol **Fokus**           |
| Menyerang            | Klik / tahan mouse kiri                       | Tap / tahan **Serang**     |
| Ganti sihir          | 1 / 2 / 3, Q atau Tab                         | Sentuh slot sihir          |
| Dash                 | Shift                                         | Tombol **Dash**            |
| Naik / turun         | Tahan Space / C                               | Tahan **Naik / Turun**     |
| Aegis ON/OFF         | G                                             | Tombol **Aegis ON/OFF**    |
| Mode terbang / jalan | F                                             | Tombol **Terbang / Jalan** |
| Lompat ganda (jalan) | Space dua kali                                | Tap **Lompat ×2** dua kali |
| Jeda                 | Esc / P / tombol jeda                         | Tombol jeda                |
| Ulangi duel          | R / menu jeda                                 | Menu jeda / hasil duel     |

Fokus boss aktif secara default di mobile. Menggeser kamera melepaskan fokus; tekan
**Fokus** untuk menguncinya kembali. Tombol fokus hanya mengendalikan kamera,
**bukan** perisai. Dash memberi kekebalan singkat pada awal luncuran, bukan selama
fase coast atau cooldown. Restart mengaktifkan kembali mode terbang dan Aegis.
Mengganti mode tidak membatalkan ragdoll yang masih terjatuh/terseret. Menjauh sambil
tetap menghadap boss menjaga perlindungan depan; berbalik membelakanginya membuka
titik buta.

**Tombol desktop dapat dipetakan ulang** di Pengaturan → Pemetaan tombol (konflik
bertukar otomatis; panah, Esc/P, Tab, dan 1/2/3 selalu aktif sebagai cadangan), dan
petunjuk tombol di HUD mengikuti pemetaanmu.

## Aksesibilitas & pengaturan

Di panel **Pengaturan** (tersimpan otomatis di perangkat):

- **Pemetaan tombol** keyboard sesuai kebiasaanmu.
- **Bantuan bidik** — sihir menempel ke boss dalam bidikan dan Bara memburu sasaran;
  matikan untuk bidikan yang sepenuhnya manual.
- **Indikator arah boss** — panah berbentuk dengan label jarak yang menunjuk IGNIS
  saat ia meninggalkan pandangan, tanpa bergantung pada warna.
- **Palet aman buta warna** — rona HUD alternatif (deuteranopia / protanopia /
  tritanopia) plus pola garis pada meteran boss agar telegraf terbaca tanpa warna.
- **Skala HUD**, sensitivitas kamera, sudut pandang orang pertama/ketiga, jarak
  kamera, kualitas visual (Otomatis/Tinggi/Ringan dengan resolusi adaptif), efek
  nyaman (menghormati `prefers-reduced-motion`), volume, dan statistik performa.

## Teknologi

Three.js + TypeScript (strict) + Vite; audio prosedural Web Audio (reverb konvolusi,
panner HRTF); font dan aset dibundel lokal. Simulasi dipecah menjadi modul-modul
dengan tanggung jawab tunggal — `Game` mengorkestrasi, sedangkan kamera
(`CameraRig`), proyektil (`ProjectileSystem`), Prisma (`PrismaSystem`), navigasi
boss, registri patch Aegis, dan logika duel murni hidup di modulnya sendiri. Peta
selengkapnya ada di [panduan pengembangan](docs/DEVELOPMENT.md).

## Dokumentasi

- [Panduan pengembangan](docs/DEVELOPMENT.md) — arsitektur, peta modul, pengujian,
  CI/CD, dan batas simulasi yang disadari.
- [CHANGELOG](CHANGELOG.md) — riwayat versi dan jurnal pengembangan v0.6–v0.19.
- [Proses rilis](docs/RELEASING.md) — versioning, tag, dan GitHub Release.

## Deployment

Situs diterbitkan lewat GitHub Pages dari folder `docs/` di branch ini: jalankan
`npm run build:pages` (build masuk ke `docs/`), lalu commit & push hasilnya. Repo ini
tidak memakai workflow otomatisasi, jadi langkah build itu adalah bagian dari rilis.
Untuk host statis lain, `npm run build` menghasilkan `dist/` yang setara.

## Lisensi

Kode berlisensi [MIT](LICENSE). Komponen pihak ketiga mempertahankan lisensinya
masing-masing (Three.js MIT; font Inter & Barlow Condensed OFL; model avatar CC0 —
lihat `public/licenses/` dan `public/models/AVATAR-LICENSE.txt`). Video referensi
adalah unggahan pemilik proyek dan tidak termasuk dalam lisensi MIT.
