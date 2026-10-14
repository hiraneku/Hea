# HEA — Arcane Arena

Prototipe game pertarungan sihir 3D **mobile-first**, bisa langsung dimainkan di browser. Dibangun dari repo yang awalnya hanya berisi `reference.mp4`.

## Menjalankan

Gunakan Node.js 22.12+ dan npm.

```bash
npm ci
npm run dev
```

Buka alamat yang ditampilkan Vite (port `5173`). Server mendengarkan di `0.0.0.0` dan menerima host preview `*.e2b.app`. Semua font, grafis, dan video dilayani dari origin yang sama; tidak membutuhkan CDN, backend, akun, atau koneksi eksternal saat bermain.

```bash
npm run build       # Pemeriksaan TypeScript + bundel produksi ke dist/
npm run preview     # Preview build produksi, port 4173
npm test            # Unit test fisika / collision / utilitas
npm run test:e2e     # Browser test; jalankan npm run dev terlebih dahulu
npm run format:check # Pemeriksaan format kode
```

Tes browser menggunakan Chromium dari paket npm di Linux, termasuk SwiftShader jika GPU tidak tersedia. Pada sistem lain, jalankan `npx playwright install chromium`, atau tentukan `BROWSER_EXECUTABLE_PATH`. `PLAYWRIGHT_BASE_URL` dapat mengganti alamat server pengujian. Screenshot/trace kegagalan, browser cache, dan `dist/` tidak masuk Git. Build `docs/` disertakan khusus untuk GitHub Pages.

## GitHub Pages

Folder **`docs/` sengaja disertakan di Git** sebagai build statis untuk metode **Deploy from a branch**. URL aset relatif, sehingga JavaScript, font, favicon, dan video tetap berjalan pada subpath `/Hea/`. File `.nojekyll` menonaktifkan pemrosesan Jekyll.

Setelah branch ini di-push:

1. Buka **Settings → Pages → Build and deployment** di repo GitHub.
2. Pilih **Source: Deploy from a branch**.
3. Pilih branch **`arena/7161cdd8-hea`**, folder **`/docs`**, lalu **Save**.
4. Tunggu deployment GitHub Pages selesai. Alamat situs: **https://hiraneku.github.io/Hea/**.

Tidak memerlukan PR atau perubahan pada `main`. Pengaturan Pages repo tidak diubah otomatis; jika masih menunjuk branch lama, situs tetap memakai versi lama sampai kamu menggantinya.

Setiap kali kode game berubah, perbarui build sebelum commit dan push:

```bash
npm ci
npm run build:pages
```

Jangan memilih folder root: `index.html` di root adalah entry pengembangan TypeScript, bukan build statis yang dapat langsung dijalankan GitHub Pages. `dist/` tetap diabaikan Git; hanya `docs/` yang disertakan untuk publikasi Pages.

## Duel v0.7 — Tuning Hempasan, Arena & Shield

Delapan perubahan tuning atas v0.6; angka lama → baru dicantumkan agar mudah dibandingkan.

1. **Partikel seretan.** Player maupun boss yang terseret di tanah kini meninggalkan jejak debu abu-abu dan serpihan gelap rendah (dengan sesekali puing) sepanjang seretan, ~22 emisi per detik per tubuh, dibatasi pool partikel yang sama. Diagnostik `particles` memaparkan jumlah emisi untuk pengujian.
2. **Boss tidak lagi macet di balik cover atau di ujung arena.** Setiap 0,4 s saat jalur tembaknya tertutup, boss memilih _vantage_: beberapa cincin jarak (15–27 m) × empat ketinggian × dua belas arah di sekitar player, menilai yang punya jalur tembak bersih dan dapat dicapai; blokade lebih dari 3 s membuatnya mendekat. Vantage dipertahankan sampai tercapai/basi/tak lagi melihat player. Rute ke sana melewati **satu sudut bangunan penghalang (atau di atasnya)** bila garis lurusnya tertutup, dan tarikan jarak-jauh dimatikan selama mengikuti rute agar tidak menyeret boss kembali ke dinding. Sidestep lokal berkomitmen 0,8 s, mengutamakan sisi yang sudah dipilih dan sisi yang membuka garis lurus ke tujuan. Fixture `far-cover` (boss di (−96, −96) di balik monolit, player di tengah) sampai jarak < 40 m dengan jalur bersih dalam ±14 s.
3. **Pemulihan di udara.** Ragdoll yang melayang **0,85 s tanpa menyentuh dinding/tanah** menegakkan diri di udara (blend 0,22 s) alih-alih menunggu mendarat; setiap benturan menyetel ulang penghitungnya, jadi tubuh yang masih menabrak dinding tetap berguling. Di mode jalan, pemulihan di udara menyerahkan sisa kecepatan vertikal ke gravitasi normal.
4. **Arena 260 × 260 m (dari 200 × 200), 31 blok (dari 55), langit-langit terbang 56 m (dari 42).** Blok lebih besar dan tebal: cluster tengah 13 blok (lebar 11–22 m, tebal 10–15 m, tinggi sampai 42 m, dua slab tipis tetap ada untuk mekanik tembus), cincin 8 blok di radius 70 m dan 10 blok di radius 105 m (lebar 20–30 m, tebal 10–17 m; satu dari lima tipis 2,6 m). Ukuran sel voxel menyesuaikan volume blok (1,6–2,4 m) agar jumlah sel tetap terkendali; kabut, langit, kamera bayangan, dan jarak kamera disesuaikan.
5. **Jeda kontak lebih lama.** Hit berat kini menahan simulasi **0,5 s** (dari 135 ms): Hempasan Surya pada player dan Nova pada boss. Hit ringan hanya dinaikkan sedikit — bolt api 65 → 90 ms, orb pemburu 80 → 120 ms — karena rentetan 40 bolt dengan jeda 0,5 s per hit akan membekukan permainan berdetik-detik. Tes kontak diretime mengikuti nilai baru.
6. **Shield lebih maju, zona aman lebih lebar, tidak menumpuk.** Busur 210° → 240° (belakang tetap buta), cangkang 2,35 → 3,1 m, jarak minimum 1,8 → 2,4 m, maksimum 4,15 → 5,2 m. Patch kini **collider dunia** selama jejaknya hidup (1,5 s; 1,7 s untuk patch besar): proyektil berikutnya pada lintasan yang sama disapu terhadap patch yang berdiri, diblok dengan memperbarui jejak yang sama (umur, cincin hit, percikan) alih-alih membuat patch baru; patch baru hanya muncul untuk lintasan berbeda. Hanya sisi depan patch yang memblok, hanya saat Aegis ON. Fixture `shield-line` (tiga bolt berurutan satu garis) → 3 blok, 1 patch, 2 pemakaian ulang.
7. **Misil pemburu menyebar.** Setiap orb memburu titik sasaran sendiri — offset deterministik 0,7–2,6 m di sekitar pusat tubuh (seed per pola/indeks/sisi) — sehingga satu salvo tidak lagi menyatu ke satu titik; kecepatan luncur awal juga sedikit lebih acak. Komitmen lurus dan CCD tetap seperti v0.6.
8. **Rentetan api lebih panjang dan lingkarannya lebih keluar.** Durasi 3,3 → 4,2 s, 32 → 40 bolt (interval 0,1 s). Lingkaran satelit kini mengorbit ±3 m dari glyph (radius 2,95 + 0,22·(i mod 3), maju 1,45 m), jauh di luar tubuh boss selebar 2,35 m, dan ukurannya 1,16× lebih besar (radius 1,3 m) agar tetap terbaca dari jauh.

## Duel v0.6 — Reference 2 & Cover Awareness

- **Satu boss: IGNIS.** Duel berakhir saat boss kalah atau HP player habis. Tidak ada gelombang, target latihan tambahan, atau respawn musuh otomatis.
- **Dua mode gerak:** tekan **F** / tombol mode untuk terbang atau berjalan. Mode jalan memakai gravitasi, lompatan ganda, dan dash horizontal. Menonaktifkan terbang di udara membuat player turun secara alami; menyalakannya kembali memberi hover.
- **Terbang enam arah:** player merah dengan pita putih, motor spring dengan akselerasi yang berkesinambungan, banking tubuh saat berbelok, dan hover ketika input dilepas. Kamera memakai spring follow, bukan perpindahan posisi mendadak. Gerak maju mengikuti arah pandang; naik-turun independen dan dash dapat dilakukan di udara. Kamera third-person mengikuti gerak dan hempasan. Boss berupa balok gelap dengan glyph emas di depan.
- **Arena 260 × 260 meter** (v0.7; sebelumnya 200 × 200), dengan **31 blok/dinding utama yang destruktibel** (sebelumnya 55). Dinding berbidang lebar (sekitar 11–30 m) dan menara sampai 45 m, dengan beberapa slab tipis dan blok tebal; bangunan utuh digabung dalam tiga instanced draw untuk menekan biaya render.
- **Boss memeriksa jalur tembak:** tetap mengetahui posisi player, tetapi menahan cast jika dinding menutup lintasan. Ia mencari sudut baru; bila material cukup tipis untuk ditembus/dihancurkan, ia dapat mengganti serangan untuk membuka jalan. Semua lintasan diperiksa lagi saat emisi, termasuk tembakan yang sudah diantrekan pada glyph. Semua lapisan penghalang diperhitungkan, bukan hanya dinding pertama.
- Boss memilih waypoint untuk strafe, flank, mendekat, lintasan rendah, atau naik. Ketinggiannya tidak terus ditambatkan di atas player; setelah terhempas, ia memulihkan posisi dekat ketinggian terakhir. Jarak minimum diperiksa kembali setelah manuver menghindari penghalang. Tiga jenis serangan tetap diperkenalkan berurutan; siklus berikutnya diacak tanpa mengulang jenis yang sama berturut-turut. Semuanya memiliki telegraph, fase tembak, dan pemulihan:
  1. **Rentetan api:** 40 bolt api memanjang (v0.7; sebelumnya 32), berdiameter inti sekitar 0,64 m, dalam fase 4,2 detik (sebelumnya 3,3) yang mengikuti rentetan pada `reference2.mp4`. Sepuluh paket, masing-masing empat tembakan, menyapu arah bidik dengan sebaran kipas. Tembakan berasal dari lingkaran satelit yang berganti per paket pada busur sekitar 3 m dari glyph boss; bukan dari glyph tengah. Lingkaran beradius 1,3 m, dengan tepi emas tebal dan alas amber kontras yang tetap terlihat di mode Ringan. Lingkaran mengembang 120 ms sebelum menembak, lalu bertahan singkat. Pool delapan lingkaran dipakai ulang.
  2. **Mantra Pemburu:** enam salvo berpasangan, total 12 orb bercincin, keluar dari glyph boss; sejak v0.7 setiap orb memburu titik sasaran sendiri di sekitar tubuh player. Homing kini lebih lunak: belokan maksimal 1,25 rad/detik dengan sedikit prediksi. Orb berkomitmen ke arah lurus setelah dekat (5,2 m), lewat 1,35 detik, atau kehilangan target dari arah depan. Tidak ada putaran balik/auto-lock terminal; gerak menyilang atau dash dapat membuatnya lewat. Peluncuran jarak dekat tetap diarahkan dengan baik dan menggunakan CCD radius-aware.
  3. **Hempasan Surya:** glyph charge jauh melebihi ukuran tubuh boss, bertahan besar ketika orb dilepas. Bola berdiameter 2,5 m dapat **melubangi dan meneruskan lintasan melalui material tipis** sampai mengenai player, shield aktif, tanah, atau material tebal. Ketebalan diukur sepanjang arah tembakan, bukan berdasarkan setiap sel voxel; ambang awal 3,2 m. Dinding tebal menahannya. Lubang hasil tembus ikut mengubah mesh dan collision.
- **Aegis ON/OFF tanpa cooldown.** Tekan **G** / tombol Aegis. Tidak ada window waktu, mana, batas jumlah blok, atau waktu tunggu saat diaktifkan lagi. Sektor depan–samping 240° (v0.7; sebelumnya 210°) tetap menyisakan **titik buta belakang**; dinding masih dapat menghalangi intersepsi.
- **Shield berbentuk potongan puzzle heksagonal, bukan bentuk poligon berbeda.** Setiap patch tersusun dari 5–10 prisma heksagonal tipis yang saling tersambung; jumlah dan susunannya berubah (misalnya 6, 8, 7, 5), tetapi bentuk setiap keping selalu sama. Variasi segitiga, wajik, cincin dan kelopak v0.5 telah dihapus. Jejak tetap diam di ruang selama sekitar 1,5–1,7 detik lalu memudar; selama masih berdiri dan Aegis ON, jejak itu ikut menahan tembakan berikutnya pada lintasan yang sama (v0.7). Saat OFF jejak lama tidak memblokir serangan baru. Pusat patch tetap dekat tubuh, biasanya sekitar 3,4 m di depan untuk tembakan biasa, maksimal 5,2 m; serangan besar memunculkan patch lebih besar.

- **Kontak → jeda → hempasan cepat → benturan.** Saat serangan musuh mengenai player, simulasi berhenti singkat tepat pada kontak, lalu impuls mencapai puncak dalam satu langkah fisika, tanpa ramp lambat. Momentum awal tetap cepat, tetapi pelepasan gaya, drag, kendali, dan pemulihan tidak lagi berganti mendadak saat timer berakhir. **Nova memberi jeda 0,5 s pada boss (v0.7; sebelumnya 135 ms) lalu impuls dasar 112 m/s**, termasuk pada pukulan terakhir. Skill ketiga boss juga memberi jeda 0,5 s, lalu impuls dasar 122 m/s pada player; hit ringan berjeda 90 ms (api) dan 120 ms (orb). Nova pada boss dan Hempasan Surya pada player memicu **ragdoll rotasi tubuh balok**: jatuh dengan gravitasi penuh, menyerap benturan tanah **tanpa pantulan**, berguling singkat lalu terseret dengan gesekan. Putaran tanah dibatasi agar tidak berputar terus seperti roda. Begitu seretan melambat, transisi berdiri dimulai langsung dan selesai sekitar 220 ms, tanpa jeda pingsan tambahan. Orientasi balok menentukan tinggi tumpuannya agar pose rebah tidak melayang di atas tanah. Ragdoll yang melayang 0,85 s tanpa menyentuh apa pun menegakkan diri di udara (v0.7); benturan menyetel ulang penghitung itu. Kamera tidak ikut berguling bersama tubuh. Kontak menampilkan percikan lokal; benturan keras berikutnya dengan lingkungan menghasilkan puing, debu, jeda benturan dan impact frame hitam-putih. Serangan biasa yang tidak mengenai lingkungan tidak memalsukan impact frame.
- **Kerusakan nyata:** bagian balok yang hancur dihapus dari mesh dan collision. Tanah berlekuk secara permanen selama duel, dan collision menggunakan segitiga permukaan yang sama. Restart mengembalikan arena, boss, HP, energi, dan semua cooldown.
- Tiga sihir player: **Bara** (api dengan bantuan bidik), **Prisma** (sinar cyan instan), **Nova** (ledakan dan knockback berat).
- Dash udara memakai kurva akselerasi 60 ms, puncak 90 ms, lalu coast 350 ms. Arah dash dapat dibelokkan perlahan; boost ditambahkan ke gerak terbang dan turun kembali ke kecepatan normal tanpa stop mendadak. Kekebalan hanya pada 230 ms awal, bukan seluruh coast/cooldown. Hover dan kontrol ketinggian, regenerasi energi, serta pemulihan HP setelah sembilan detik tanpa terkena serangan.
- Multitouch, fokus boss opsional, layout portrait/landscape, pause, restart, demo real-time, panduan, dan video referensi asli.
- Audio WebAudio prosedural; kualitas, sensitivitas, volume, serta **Efek nyaman** untuk menonaktifkan impact frame dan mengurangi guncangan. Jeda kontak tetap berlaku agar aturan hempasan konsisten. Rekor waktu kemenangan dan preferensi disimpan lokal.

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

Fokus boss aktif secara default di mobile. Menggeser kamera melepaskan fokus; tekan **Fokus** untuk menguncinya kembali. Tombol fokus hanya mengendalikan kamera, **bukan** perisai. Dash memberi kekebalan singkat pada awal luncuran, bukan selama fase coast atau cooldown. Energi hanya dipakai untuk sihir. Terbang dan Aegis tidak menguras energi. Restart mengaktifkan kembali mode terbang dan Aegis. Mengganti mode tidak membatalkan ragdoll yang masih terjatuh/terseret. Menjauh sambil tetap menghadap boss menjaga perlindungan depan; berbalik membelakanginya membuka titik buta.

## Hubungan dengan referensi

Video sekitar tujuh detik di `reference.mp4` menjadi acuan arena greybox, player merah dengan pita putih, boss terbang gelap dengan lingkaran emas, tembakan api, laser cyan, perisai heksagonal, puing dan impact frame. Versi ini mengikuti koreksi pengguna: **player vs satu boss**, shield otomatis, dan knockback ke lingkungan destruktibel.

`reference2.mp4` (11,75 detik, unggahan pengguna) juga telah diperiksa: bagian sekitar 5,2–8,2 detik menjadi acuan kepingan hex dan bolt api. Keduanya tersedia lewat pemilih di viewer referensi. Bentuk dan tempo yang terlihat direkonstruksi; detail yang tertutup efek/perspektif tetap membutuhkan tuning, bukan klaim salinan identik frame-per-frame.

Model tetap mengikuti gaya blockout, bukan karakter humanoid. Respons player dibuat lebih menyerupai tubuh yang terlempar/terseret; bukan mengganti model merah dengan manusia. Durasi jejak, damage, kecepatan, jarak boss dan urutan serangan tidak dapat diukur pasti dari cuplikan; nilainya merupakan tuning awal yang dapat diubah, bukan klaim replika 100%.

## Teknologi dan struktur

- Three.js + TypeScript + Vite; font dan aset dibundel lokal.
- `src/game/Game.ts`: simulasi duel, chase camera, knockback, projectile CCD, spell dan hasil duel.
- `src/game/Boss.ts`: satu model boss terbang, glyph, telegraph dan presentasi visual.
- `src/game/combat.ts`: Aegis directional, contact pause, pola boss, radius collision, spread dan panduan misil; tuning `DUEL` / `ATTACKS` / `PROJECTILES`.
- `src/game/flight.ts`, `src/game/motion.ts`, `src/game/config.ts`: flight/camera spring, dash envelope, pelepasan impuls, ragdoll rotasi, hover dan batas arena.
- `src/game/BossTactics.ts`: waypoint/taktik ketinggian dan posisi lingkaran satelit yang diacak secara deterministik.
- `src/game/destruction.ts`: sel balok destruktibel, collider berlubang, dan bentuk kawah.
- `src/game/World.ts`: arena prosedural, mesh pecahan, deformasi tanah dan bayangan kontak.
- `src/game/ShieldVisual.ts`: potongan polyhex yang tersambung dengan jumlah/susunan keping berbeda.
- `src/game/AttackSight.ts`: pemeriksaan jalur tembak non-mutatif, ketebalan material dan kemampuan serangan.
- `src/game/Effects.ts`: particle pool, instanced debris, debu, ribbon, glyph, beam dan shield directional.
- `src/game/Controls.ts`, `Audio.ts`, `math.ts`: input multitouch, suara prosedural dan collision.
- `src/main.ts`, `src/style.css`, `src/duel.css`: HUD duel, menu dan dialog responsif.

**Kualitas dan batas simulasi:** mode Tinggi memakai shadow map dan bloom, DPR maksimal 2. Ringan menonaktifkan keduanya, membatasi DPR ke 1, serta mengurangi partikel. Otomatis memakai Ringan untuk perangkat sentuh dan dapat menurunkan kualitas desktop. Jika beberapa sampel FPS tetap rendah, resolusi render otomatis dapat turun sampai 75%; HUD tetap dirender pada resolusi CSS. Fisika memakai substep; tab yang tersendat tidak membuat proyektil/hempasan menembus arena. Render berhenti saat pause/hasil duel kecuali diperlukan pembaruan tampilan.

Bangunan utama memakai sel voxel; collider bangunan miring masih merupakan pendekatan bounding box. Prisma dekoratif memakai collider tetap. Puing bergerak merupakan efek terpool, bukan rigid-body yang saling menumpuk. Kawah dibatasi 24 bentuk per duel untuk menjaga biaya komputasi; kerusakan lama tidak dihapus diam-diam. Tidak ada simulasi keruntuhan struktural seluruh bangunan. Ragdoll memakai dinamika translasi/rotasi balok, tumpuan berorientasi, penyerapan benturan dan gesekan tanpa restitusi tanah dengan collider konservatif; bukan kerangka humanoid multi-sendi. Penetrasi menggunakan ray/material-span pada collider voxel, termasuk pendekatan bounding box pada bangunan miring.

Font Inter dan Barlow Condensed didistribusikan melalui `@fontsource` beserta lisensi OFL. Selain video referensi, aset visual dibuat secara prosedural dalam kode.

## Pengujian

`npm test` memeriksa collision, arc Aegis, prediksi benturan, emisi dari glyph boss, jadwal serangan/spread, orb lurus dari jarak 2–22 m, komitmen lintasan homing dan peluang menghindar, sebaran titik sasaran misil, jeda kontak (0,5 s berat / singkat ringan), flight spring, kurva dash, pemulihan ragdoll di tanah dan di udara, variasi waypoint, lingkaran satelit ±3 m, patch shield di luar pusat dan pemakaian ulang patch pada lintasan sama, lubang dinding, dan kawah/reset.

`npm run test:e2e` memeriksa menu dan kontrol desktop/mobile, damage sihir, intersepsi depan–samping, titik buta saat shield aktif, toggle ON/OFF tanpa cooldown, misil jarak dekat, jeda kontak sebelum hempasan player/boss, lubang collision, deformasi tanah, semua pola serangan, hover/kontrol naik-turun, perpindahan melampaui batas map lama, shield besar/tersebar dekat tubuh, dash dengan coast, ragdoll dua aktor, pembatalan cast saat terkena Nova, emisi lingkaran satelit, mode jalan/lompat ganda, shield echo tetap di ruang dan memudar, satu patch menahan tiga bolt segaris, seretan tanpa pantulan dengan jejak debu, pemulihan berdiri cepat, pemulihan di udara sebelum mendarat, boss menahan cast di balik cover, boss jauh yang mengejar player dari balik monolit, penetrasi dinding tipis vs tebal, kemenangan/kekalahan tanpa respawn, dan restart. Sebagian kasus khusus mobile sengaja dilewati pada project desktop, dan sebaliknya.

Pada server dev, `window.__HEA_DEBUG__` menyediakan snapshot/diagnostik. Tambahan query `?test` membuka fixture QA deterministik untuk melangkah simulasi dan menguji benturan. **Hook tersebut tidak diekspor pada build produksi / GitHub Pages.** Tes memakai simulasi sungguhan; fixture hanya menempatkan aktor/proyektil dan mengatur waktu agar kondisi dapat direproduksi.

## Status Android

Ini adalah **prototipe web untuk diuji di mobile**, belum APK/native Android. Pengujian Chromium/emulasi sentuh bukan benchmark HP Android nyata; belum ada klaim FPS untuk perangkat tertentu. Perlu uji latensi sentuh, panas/baterai, rasio layar dan WebGL pada perangkat sasaran sebelum membungkusnya dengan Capacitor atau memindahkan gameplay ke engine native. Belum ada multiplayer atau level lain.
