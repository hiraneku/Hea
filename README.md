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

## Duel v0.2

- **Satu boss: IGNIS.** Duel berakhir saat boss kalah atau HP player habis. Tidak ada gelombang, target latihan tambahan, atau respawn musuh otomatis.
- Player berupa balok merah dengan pita putih; kamera third-person mengikuti gerak, dash, dan hempasan. Boss berupa balok gelap terbang dengan glyph emas di depan.
- Boss mendekat, mengorbit, menghindari penghalang lewat perubahan ketinggian, dan menjaga jarak tembak. Urutan serangannya memiliki telegraph, fase tembak, dan pemulihan:
  1. **Rentetan api:** 12 proyektil cepat, seperti tembakan senapan.
  2. **Misil homing:** tiga salvo berpasangan; misil melebar dan melengkung menuju player. Kecepatan belok dan durasi panduannya terbatas sehingga tetap bisa dihindari.
  3. **Hempasan Surya:** naik ke udara dan mengunci sasaran sebelum melepas tembakan berat. Gerak setelah sasaran terkunci dapat menghindarinya.
- **Aegis maksimum, otomatis 360°.** Glyph heksagonal muncul menghadap proyektil sesaat sebelum benturan. Semua proyektil yang mengancam diblokir selama **1,65 detik**, tanpa batas jumlah dan tanpa biaya energi. Setelah itu **cooldown 3,2 detik**. Tembakan yang meleset atau lebih dulu terhalang bangunan tidak menghabiskan shield. HUD menunjukkan status dan waktu tersisa.
- Serangan yang lolos menyebabkan knockback. Misil melontarkan; serangan berat dapat menghantamkan player ke tanah. **Nova juga dapat menghempaskan boss.** Benturan keras berikutnya dengan lingkungan menimbulkan puing, debu, hit-stop, dan impact frame hitam-putih, bukan setiap kali sihir ditembakkan.
- **Kerusakan nyata:** bagian balok yang hancur dihapus dari mesh dan collision. Tanah berlekuk secara permanen selama duel, dan collision menggunakan segitiga permukaan yang sama. Restart mengembalikan arena, boss, HP, energi, dan semua cooldown.
- Tiga sihir player: **Bara** (api dengan bantuan bidik), **Prisma** (sinar cyan instan), **Nova** (ledakan dan knockback berat).
- Dash dengan kekebalan singkat, lompat ganda, regenerasi energi, dan pemulihan HP setelah sembilan detik tanpa terkena serangan.
- Multitouch, fokus boss opsional, layout portrait/landscape, pause, restart, demo real-time, panduan, dan video referensi asli.
- Audio WebAudio prosedural; kualitas, sensitivitas, volume, serta **Efek nyaman** untuk menonaktifkan impact frame/hit-stop dan mengurangi guncangan. Rekor waktu kemenangan dan preferensi disimpan lokal.

## Kontrol

| Aksi           | Desktop                                       | Mobile                     |
| -------------- | --------------------------------------------- | -------------------------- |
| Bergerak       | WASD / panah                                  | Joystick kiri              |
| Arahkan kamera | Mouse; seret jika pointer lock tidak tersedia | Geser area kanan           |
| Fokus boss     | E / klik kanan                                | Tombol **Fokus**           |
| Menyerang      | Klik / tahan mouse kiri                       | Tap / tahan **Serang**     |
| Ganti sihir    | 1 / 2 / 3, Q atau Tab                         | Sentuh slot sihir          |
| Dash           | Shift                                         | Tombol **Dash**            |
| Lompat ganda   | Space dua kali                                | Tombol **Lompat** dua kali |
| Aegis          | **Otomatis, tanpa tombol**                    | **Otomatis, tanpa tombol** |
| Jeda           | Esc / P / tombol jeda                         | Tombol jeda                |
| Ulangi duel    | R / menu jeda                                 | Menu jeda / hasil duel     |

Fokus boss aktif secara default di mobile. Menggeser kamera melepaskan fokus; tekan **Fokus** untuk menguncinya kembali. Tombol fokus hanya mengendalikan kamera, **bukan** perisai. Dash memberi kekebalan selama gerak cepatnya, bukan sepanjang cooldown. Energi hanya dipakai untuk sihir.

## Hubungan dengan referensi

Video sekitar tujuh detik di `reference.mp4` menjadi acuan arena greybox, player merah dengan pita putih, boss terbang gelap dengan lingkaran emas, tembakan api, laser cyan, perisai heksagonal, puing dan impact frame. Versi ini mengikuti koreksi pengguna: **player vs satu boss**, shield otomatis, dan knockback ke lingkungan destruktibel.

Model tetap mengikuti gaya blockout, bukan karakter humanoid. Durasi shield, damage, kecepatan, jarak boss dan urutan serangan tidak dapat diukur pasti dari cuplikan; nilainya merupakan tuning awal yang dapat diubah, bukan klaim replika 100%.

## Teknologi dan struktur

- Three.js + TypeScript + Vite; font dan aset dibundel lokal.
- `src/game/Game.ts`: simulasi duel, chase camera, knockback, projectile CCD, spell dan hasil duel.
- `src/game/Boss.ts`: satu model boss terbang, glyph, telegraph dan presentasi visual.
- `src/game/combat.ts`: state machine Aegis dan pola boss, prediksi ancaman, panduan misil, serta parameter utama `DUEL` / `ATTACKS`.
- `src/game/destruction.ts`: sel balok destruktibel, collider berlubang, dan bentuk kawah.
- `src/game/World.ts`: arena prosedural, mesh pecahan, deformasi tanah dan bayangan kontak.
- `src/game/Effects.ts`: particle pool, instanced debris, debu, ribbon, glyph, beam dan shield directional.
- `src/game/Controls.ts`, `Audio.ts`, `math.ts`: input multitouch, suara prosedural dan collision.
- `src/main.ts`, `src/style.css`, `src/duel.css`: HUD duel, menu dan dialog responsif.

**Kualitas dan batas simulasi:** mode Tinggi memakai shadow map dan bloom, DPR maksimal 2. Ringan menonaktifkan keduanya, membatasi DPR ke 1, serta mengurangi partikel. Otomatis memakai Ringan untuk perangkat sentuh dan dapat menurunkan kualitas desktop. Fisika memakai substep; tab yang tersendat tidak membuat proyektil/hempasan menembus arena. Render berhenti saat pause/hasil duel kecuali diperlukan pembaruan tampilan.

Bangunan utama memakai sel voxel; collider bangunan miring masih merupakan pendekatan bounding box. Prisma dekoratif memakai collider tetap. Puing bergerak merupakan efek terpool, bukan rigid-body yang saling menumpuk. Kawah dibatasi 24 bentuk per duel untuk menjaga biaya komputasi; kerusakan lama tidak dihapus diam-diam. Tidak ada simulasi keruntuhan struktural seluruh bangunan.

Font Inter dan Barlow Condensed didistribusikan melalui `@fontsource` beserta lisensi OFL. Selain video referensi, aset visual dibuat secara prosedural dalam kode.

## Pengujian

`npm test` memeriksa collision, Aegis, prediksi benturan, jadwal serangan pada timestep berbeda, belokan misil, lubang dinding, dan kawah/reset.

`npm run test:e2e` memeriksa menu dan kontrol desktop/mobile, damage sihir, empat intersepsi bersamaan, kerentanan saat cooldown, hempasan player/boss, lubang collision, deformasi tanah, semua pola serangan, kemenangan/kekalahan tanpa respawn, dan restart. Sebagian kasus khusus mobile sengaja dilewati pada project desktop, dan sebaliknya.

Pada server dev, `window.__HEA_DEBUG__` menyediakan snapshot/diagnostik. Tambahan query `?test` membuka fixture QA deterministik untuk melangkah simulasi dan menguji benturan. **Hook tersebut tidak diekspor pada build produksi / GitHub Pages.** Tes memakai simulasi sungguhan; fixture hanya menempatkan aktor/proyektil dan mengatur waktu agar kondisi dapat direproduksi.

## Status Android

Ini adalah **prototipe web untuk diuji di mobile**, belum APK/native Android. Pengujian Chromium/emulasi sentuh bukan benchmark HP Android nyata; belum ada klaim FPS untuk perangkat tertentu. Perlu uji latensi sentuh, panas/baterai, rasio layar dan WebGL pada perangkat sasaran sebelum membungkusnya dengan Capacitor atau memindahkan gameplay ke engine native. Belum ada multiplayer atau level lain.
