# Panduan Pengembangan HEA

Dokumen untuk kontributor: arsitektur, peta modul, pengujian, deployment, dan batas
simulasi yang disadari. Untuk cara bermain lihat [README](../README.md); untuk riwayat
versi lihat [CHANGELOG](../CHANGELOG.md); untuk proses rilis lihat
[RELEASING](RELEASING.md).

## Perintah

```bash
npm ci                  # pasang dependensi (Node.js 22.12+)
npm run dev             # server dev Vite, port 5173 (0.0.0.0, host *.e2b.app diterima)
npm test                # unit test (Vitest)
npm run test:coverage   # unit test + ambang coverage modul logika murni
npm run test:e2e        # browser test (Playwright); butuh server dev/preview berjalan
npm run lint            # ESLint (src, tests, konfigurasi)
npm run format:check    # Prettier
npm run build           # tsc --noEmit + build produksi ke dist/
npm run preview         # preview build produksi, port 4173
```

## Gerbang kualitas

Tidak ada workflow CI yang disertakan di repo ini; gerbang kualitas dijalankan lokal
(dan wajib hijau sebelum rilis):

```bash
npm run format:check   # Prettier
npm run lint           # ESLint
npm run test:coverage  # unit test + ambang coverage modul logika murni
npm run build          # tsc + build produksi
npm run test:e2e       # Playwright melawan dev server (harness __HEA_DEBUG__ hanya dev)
```

Penerbitan: GitHub Pages melayani folder `docs/` di branch ini. `npm run build:pages`
menulis build produksi ke `docs/` (commit & push hasilnya); file Markdown di `docs/`
ikut tinggal di folder itu, jadi pulihkan mereka bila build membersihkan folder.
`npm run build` menghasilkan `dist/` yang setara untuk host statis lain.

## Teknologi dan struktur

- Three.js + TypeScript + Vite; font dan aset dibundel lokal.
- `src/game/Game.ts`: orkestrasi duel — simulasi, knockback, projectile CCD, spell dan hasil duel.
- `src/game/CameraRig.ts`: kamera sebagai benda fisik — pegas pengejar/mata, tendangan hantaman, dip pendaratan, punch FOV, framing showcase.
- `src/game/ProjectileSystem.ts`: kepemilikan proyektil — geometri/material bersama, spawn, pensiun (termasuk menyerahkan tubuh ke perisai/pusaran), dekorasi inti sumur vortex.
- `src/game/PrismaSystem.ts`: semua Prisma — lingkaran tap & sinarnya, lingkaran besar bermuatan & lancip berat, dan lance berdiri yang menyapu tembakan musuh. Game memegang kendali tembak (timing tahan, energi); sistem ini memiliki lingkarannya.
- `src/game/Boss.ts`: satu model boss terbang, glyph, telegraph dan presentasi visual.
- `src/game/combat.ts`: Aegis directional, contact pause, pola boss, radius collision, spread dan panduan misil; tuning `DUEL` / `ATTACKS` / `PROJECTILES`.
- `src/game/flight.ts`, `src/game/motion.ts`, `src/game/config.ts`: flight/camera spring, dash envelope, pelepasan impuls, ragdoll rotasi, hover dan batas arena.
- `src/game/BossTactics.ts`: waypoint/taktik ketinggian dan posisi lingkaran satelit yang diacak secara deterministik.
- `src/game/BossNavigation.ts`: graf visibilitas sudut bangunan, A\*, pemilihan vantage dan steering boss (v0.8).
- `src/game/ShieldPatches.ts`: registri patch Aegis — kisi heksagon bersama agar patch berdampingan seperti puzzle, kontak cakram, durabilitas 5 hit, lubang sudut setelah pecah (v0.8–0.9).
- `src/game/Furrows.ts`: alur seretan — strip tanah dinamis dengan parit dan gundukan kiri-kanan yang mengikuti arah seretan (v0.9).
- `src/game/Scorches.ts`: tanda hangus — pool cakram gelap bergerigi yang digelar di atas kontur tanah dan memudar (v0.10).
- `src/game/TestScenarios.ts`, `src/game/terrainGrid.ts`: fixture QA deklaratif dan pemetaan grid terrain adaptif (v0.8).
- `src/game/destruction.ts`: sel balok destruktibel, collider berlubang, dan bentuk kawah.
- `src/game/World.ts`: arena prosedural, mesh pecahan, deformasi tanah dan bayangan kontak.
- `src/game/ShieldVisual.ts`: potongan polyhex yang tersambung dengan jumlah/susunan keping berbeda, geometri prisma heksagon dan retakan untuk efek pecah.
- `src/game/AttackSight.ts`: pemeriksaan jalur tembak non-mutatif, ketebalan material dan kemampuan serangan.
- `src/game/Effects.ts`: particle pool, instanced debris/bongkahan, debu, ribbon, glyph, beam, benturan dan pecahan shield, atraktor pusaran.
- `src/game/Controls.ts`, `Audio.ts`, `math.ts`: input multitouch (dead zone, kurva respons, flick), suara prosedural pada bus kompresor dengan loop gesekan seretan, dan collision.
- `src/main.ts`, `src/style.css`, `src/duel.css`: HUD duel, menu dan dialog responsif.

**Kualitas dan batas simulasi:** mode Tinggi memakai shadow map dan bloom, DPR maksimal 2. Ringan menonaktifkan keduanya, membatasi DPR ke 1, serta mengurangi partikel. Otomatis memakai Ringan untuk perangkat sentuh dan dapat menurunkan kualitas desktop. Jika beberapa sampel FPS tetap rendah, resolusi render otomatis dapat turun sampai 75%; HUD tetap dirender pada resolusi CSS. Fisika memakai substep; tab yang tersendat tidak membuat proyektil/hempasan menembus arena. Render berhenti saat pause/hasil duel kecuali diperlukan pembaruan tampilan.

Bangunan utama memakai sel voxel; collider bangunan miring masih merupakan pendekatan bounding box. Prisma dekoratif memakai collider tetap. Puing bergerak merupakan efek terpool, bukan rigid-body yang saling menumpuk. Kawah dibatasi 24 bentuk per duel untuk menjaga biaya komputasi; kerusakan lama tidak dihapus diam-diam. Tidak ada simulasi keruntuhan struktural seluruh bangunan. Ragdoll memakai dinamika translasi/rotasi balok, tumpuan berorientasi, penyerapan benturan dan gesekan tanpa restitusi tanah dengan collider konservatif; bukan kerangka humanoid multi-sendi. Penetrasi menggunakan ray/material-span pada collider voxel, termasuk pendekatan bounding box pada bangunan miring.

Font Inter dan Barlow Condensed didistribusikan melalui `@fontsource` beserta lisensi OFL. Selain video referensi, aset visual dibuat secara prosedural dalam kode.

## Hubungan dengan referensi

Video sekitar tujuh detik di `reference.mp4` menjadi acuan arena greybox, player merah dengan pita putih, boss terbang gelap dengan lingkaran emas, tembakan api, laser cyan, perisai heksagonal, puing dan impact frame. Versi ini mengikuti koreksi pengguna: **player vs satu boss**, shield otomatis, dan knockback ke lingkungan destruktibel.

`reference2.mp4` (11,75 detik, unggahan pengguna) juga telah diperiksa: bagian sekitar 5,2–8,2 detik menjadi acuan kepingan hex dan bolt api. Keduanya tersedia lewat pemilih di viewer referensi. Bentuk dan tempo yang terlihat direkonstruksi; detail yang tertutup efek/perspektif tetap membutuhkan tuning, bukan klaim salinan identik frame-per-frame.

Model tetap mengikuti gaya blockout, bukan karakter humanoid. Respons player dibuat lebih menyerupai tubuh yang terlempar/terseret; bukan mengganti model merah dengan manusia. Durasi jejak, damage, kecepatan, jarak boss dan urutan serangan tidak dapat diukur pasti dari cuplikan; nilainya merupakan tuning awal yang dapat diubah, bukan klaim replika 100%.

## Pengujian

`npm test` memeriksa graf navigasi/A\* dan vantage boss, grid terrain adaptif, registri patch (durabilitas 5 hit, lubang sudut, kisi puzzle tanpa tumpang tindih, kontak cakram pada moncong proyektil), geometri alur seretan, tanda hangus dan kepadatan partikel adaptif, waypoint boss yang sadar pandang, urutan serangan termasuk Pusaran Surya, salto pemulihan di udara, collision, arc Aegis, prediksi benturan, emisi dari glyph boss, jadwal serangan/spread, orb lurus dari jarak 2–22 m, komitmen lintasan homing dan peluang menghindar, sebaran titik sasaran misil, jeda kontak (0,5 s berat / singkat ringan), flight spring, kurva dash, pemulihan ragdoll di tanah dan di udara, variasi waypoint, lingkaran satelit ±3 m, patch shield di luar pusat dan pemakaian ulang patch pada lintasan sama, lubang dinding, kawah/reset, muatan Nova (`novaCharge`: tap vs tahan penuh, harga 1,8× hanya bila energinya cukup), dan penjepitan slider kamera pada `readSettings`.

`npm run test:e2e` memeriksa menu dan kontrol desktop/mobile, damage sihir, intersepsi depan–samping, titik buta saat shield aktif, toggle ON/OFF tanpa cooldown, misil jarak dekat, jeda kontak sebelum hempasan player/boss, lubang collision, deformasi tanah, semua pola serangan, hover/kontrol naik-turun, perpindahan melampaui batas map lama, shield besar/tersebar dekat tubuh, dash dengan coast, ragdoll dua aktor, pembatalan cast saat terkena Nova, emisi lingkaran satelit, mode jalan/lompat ganda, shield echo tetap di ruang dan memudar, satu patch menahan tiga bolt segaris, seretan tanpa pantulan dengan jejak debu, pemulihan berdiri cepat, pemulihan di udara sebelum mendarat, boss menahan cast di balik cover, boss jauh yang mengejar player dari balik monolit, penetrasi dinding tipis vs tebal, kemenangan/kekalahan tanpa respawn, dan restart. Sejak v0.8 juga: jeda beku → slow-motion → punch kamera, patch yang pecah pada hit ketiga dan lubang 30°-nya, salto di udara, lingkaran api yang berotasi, boss dari (92, 98), serta golden screenshot (`visual.spec.ts`, project desktop). Sejak v0.9 juga: proyektil yang terus terbang sampai menyentuh patch dan hit yang dihitung saat kontak, patch kelima yang pecah dan bolt keenam yang lolos, ubin patch tanpa tumpang tindih pada `shield-scatter`, alur seretan tunggal dengan bongkahan, pusaran yang menambat di depan tubuh, menarik, lalu meledak (HP 76, kawah, boss kebal), pusaran sebagai pola keempat pembukaan, dan tujuh golden (`drag-furrow`, `shield-shatter`, `solar-vortex`, `shield-charge` yang diperbarui). Sejak v0.10 juga: bekas gosong api yang memudar (`scorch`), boss dari (120, 127) yang menembus celah antarmonolit tanpa memanjat, dan golden yang dibuat ulang untuk arena 340 m. Sejak v0.14 juga: Nova tap vs tahan 0,6 s (biaya 54, boss terlontar) dengan angka damage di DOM, dash menyamping mengikuti stik di kamera pengejar dan dari mata plus `--surge`/`#speed-lines.surge` selama plato dorongan (hilang pada Efek Dikurangi), dan slider FOV/jarak kamera yang hidup, tersimpan dan dijepit. Sejak v0.15 juga: Prisma bertahap (tap → lingkaran di cincin 1,0–2,2 m → sinar 15 → lingkaran pecah), voli empat tap dengan sudut yang tersebar dan lingkaran yang tertinggal saat tubuh berjalan, tahan → muatan → lancip 90 dengan ragdoll boss, pelepasan dini tanpa biaya, dan lingkaran di depan mata pada orang pertama. Sebagian kasus khusus mobile sengaja dilewati pada project desktop, dan sebaliknya.

Pada server dev, `window.__HEA_DEBUG__` menyediakan snapshot/diagnostik. Tambahan query `?test` membuka fixture QA deterministik untuk melangkah simulasi dan menguji benturan. **Hook tersebut tidak diekspor pada build produksi / GitHub Pages.** Tes memakai simulasi sungguhan; fixture hanya menempatkan aktor/proyektil dan mengatur waktu agar kondisi dapat direproduksi.

## Status platform

Ini adalah **prototipe web untuk diuji di mobile**, belum APK/native Android. Pengujian Chromium/emulasi sentuh bukan benchmark HP Android nyata; belum ada klaim FPS untuk perangkat tertentu. Perlu uji latensi sentuh, panas/baterai, rasio layar dan WebGL pada perangkat sasaran sebelum membungkusnya dengan Capacitor atau memindahkan gameplay ke engine native. Belum ada multiplayer atau level lain.
