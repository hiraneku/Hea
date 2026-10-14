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

## Yang sudah tersedia

- Arena greybox 3D: lantai grid, blok dan menara, prisma miring, langit, bayangan, puing, dan bekas benturan.
- Target merah bergerak dengan jejak pita putih berbasis mesh.
- First-person movement, collision dengan arena, **dash kebal singkat**, dan **lompat ganda**.
- **Bara:** proyektil api cepat, dengan homing ringan pada target yang sudah dibidik.
- **Prisma:** sinar instan biru, glyph dan pola heksagonal.
- **Nova:** ledakan area dengan pecahan, gelombang kejut dan impact frame.
- Perisai energi, kesehatan, regenerasi, cooldown, skor, gelombang musuh yang makin sulit, dan rekor lokal.
- Musuh menembakkan proyektil yang dapat diblokir, dihindari, atau ditahan oleh bangunan.
- Mode demo real-time, menu jeda, mulai ulang, panduan, dan pemutar video referensi asli.
- Kontrol sentuh multitouch, bantuan bidik mobile, layout portrait dan landscape.
- Efek audio prosedural berbasis WebAudio. Audio baru diaktifkan setelah interaksi pengguna.
- Pengaturan kualitas, sensitivitas, volume, serta **Efek nyaman** untuk mengurangi kilatan dan gerakan kamera; preferensi disimpan secara lokal.

## Kontrol

| Aksi           | Desktop                                       | Mobile                     |
| -------------- | --------------------------------------------- | -------------------------- |
| Bergerak       | WASD / panah                                  | Joystick kiri              |
| Arahkan kamera | Mouse; seret jika pointer lock tidak tersedia | Geser area kanan           |
| Menyerang      | Klik / tahan tombol kiri mouse                | Tap / tahan **Serang**     |
| Ganti sihir    | 1 / 2 / 3, Q atau Tab                         | Sentuh slot sihir          |
| Dash           | Shift                                         | Tombol **Dash**            |
| Lompat ganda   | Space, lalu Space sekali lagi di udara        | Tombol **Lompat** dua kali |
| Perisai        | Tahan F / tombol kanan mouse                  | Tahan **Perisai**          |
| Jeda           | Esc / P / tombol jeda                         | Tombol jeda                |
| Ulangi         | R / menu jeda                                 | Menu jeda                  |

Energi pulih saat perisai tidak ditahan. Kesehatan mulai pulih setelah sembilan detik tanpa terkena serangan. Selesaikan semua target untuk maju ke gelombang berikutnya. Dash memberi kekebalan singkat selama gerak cepatnya, bukan selama seluruh cooldown.

## Hubungan dengan referensi

Video asli berdurasi sekitar tujuh detik. Arena, objek merah, jejak putih, sihir oranye, laser biru, heksagon, serpihan, dan impact frame menjadi acuan visual. Video **tidak** menjelaskan aturan game atau peran objek merah. Karena itu, objek tersebut diinterpretasikan sebagai target/musuh latihan dan sistem pertarungan dirancang untuk membuat rekonstruksi interaktif yang bisa dimainkan. Ini bukan klaim kesamaan 100% atau replika semua sistem game sumber.

## Teknologi dan struktur

- Three.js + TypeScript + Vite. Three.js digunakan untuk menjaga bundel web ringkas serta mengendalikan langsung mesh trail, partikel, dan efek.
- `src/game/Game.ts`: state, update loop, kamera, combat, gelombang.
- `src/game/World.ts`: dunia dan aset tekstur prosedural.
- `src/game/Effects.ts`: particle pool, instanced debris, ribbon, glyph, sinar, dan shield.
- `src/game/Controls.ts`: keyboard, pointer lock/fallback, dan multitouch.
- `src/game/math.ts`: collision kontinu proyektil, collision karakter, utilitas deterministik.
- `src/game/Audio.ts`: sintesis suara tanpa aset eksternal.
- `src/main.ts`, `src/style.css`: HUD, menu, dialog, dan layout responsif.

**Kualitas:** mode Tinggi memakai shadow map dan bloom, DPR maksimal 2. Ringan menonaktifkan keduanya, membatasi DPR ke 1, serta mengurangi jumlah partikel. Otomatis memakai Ringan untuk perangkat sentuh dan dapat menurunkan kualitas desktop setelah beberapa sampel frame rate rendah. Simulation delta dibatasi agar tab yang tersendat tidak memindahkan karakter menembus arena. Game dijeda saat tab disembunyikan / kehilangan fokus. Render dunia dihentikan selama jeda, kecuali saat perlu resize atau perubahan kualitas.

Font Inter dan Barlow Condensed didistribusikan melalui `@fontsource` beserta lisensi OFL-nya. Semua aset visual selain video referensi dibuat secara prosedural dalam kode.

## Status Android

Ini adalah **prototipe web yang dioptimalkan untuk input mobile**, belum APK/native Android. Langkah berikutnya dapat menggunakan Capacitor untuk membungkus `dist/`, atau mengadaptasi gameplay ke engine native jika pengujian menunjukkan WebView tidak mencukupi. Build APK membutuhkan Android SDK dan pengujian perangkat nyata.

Pengujian browser/emulasi sentuh tidak menggantikan pengujian HP asli. Belum ada klaim FPS pada perangkat Android tertentu. Prioritas uji lanjutan: panas dan baterai, latensi sentuh, rasio layar, serta performa WebGL pada GPU kelas menengah/rendah. Belum ada multiplayer, progression permanen, atau level di luar arena latihan ini.
