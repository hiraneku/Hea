# Sprint reference — SPRINT 1

Referensi: `IMG_20261021_222013_942.mp4`, 1080 × 1920, 62 frame video,
PTS 0–2,035 detik (~30 fps). Ini animasi stickman 2D tampak samping, bukan mocap.
Seluruh frame diperiksa. Pose berulang sekitar 0,734 detik untuk dua langkah;
banyak pose ditahan dua frame. Video tidak menunjukkan start, stop atau belokan.

## Implementasi

- Overlay `CharacterLocomotion` yang sama dipakai arena dan mode main preview.
- Sprint maju: langkah lebih panjang, cadence mendekati referensi pada kecepatan
  acuan, disesuaikan dengan kecepatan aktual. Tidak lagi memakai putaran kaki
  sprint lama yang dapat mendekati 3 siklus/detik.
- Pemulihan kaki mencapai lift lebih awal: kaki belakang melipat sebelum dibawa
  ke depan, lalu membuka untuk touchdown. Sambungan stance/swing tetap C2.
- Panggul dan spine lebih condong, ayunan lengan lebih kuat, siku tetap tertekuk.
  Constraint jarak tangan yang sudah ada tetap dipakai, tidak menambah bukaan T.
- Stance sprint maju 35% siklus per kaki, dengan interval lepas tumpuan bersama.
  Lift presentasi pendek mengangkat pose tubuh dan kedua kaki pada interval ini;
  bukan jump, bukan perubahan collision box atau posisi dunia.
- Margin sole sprint tambahan 6 mm melindungi kontak selama interpolasi rotasi.
- Semua parameter masuk/keluar melalui blend pace yang sudah ada. Jalan/lari
  biasa tetap memakai kurva lama. Sprint terkunci menyamping/mundur mempertahankan
  kontak kompak; tidak dipaksa memakai langkah panjang tampak-samping.
- GERAK 8 (badan mengikuti arah gerak tanpa lock, menahan heading setelah berhenti),
  kepala independen, flight, dash, double jump, landing dan combat tidak diubah.
- Label preview: `v9 · GERAK 8 · SPRINT 1`. Walking tetap revisi 2.

## Pemeriksaan

- Unit suite akhir: 308 tes / 27 file lulus. Tes baru memeriksa kurva recovery,
  posisi/kecepatan/percepatan di sambungan, lipatan lutut, clearance sole skinned,
  interval kedua kaki terangkat, kemiringan torso, panjang tulang, root tetap,
  dan perubahan panggul per frame pada 30/60/120 fps.
- Browser: 10 tes terpilih desktop/mobile lulus dalam satu suite. Meliputi pace,
  preview, stop pilihan gerakan, arah belakang dan heading setelah dilepas.
  Duplikasi dua tes mobile yang sempat dijalankan bersamaan dengan renderer
  mengalami satu timeout menunggu phase stop; pengulangan serial tes tersebut
  lulus. Tidak mengubah assertion atau timeout untuk meloloskannya.
- ESLint, Prettier, TypeScript dan build Pages diperiksa sebelum publikasi.
- Review pose: 12 sampel satu siklus × 3 sudut, sebelum/sesudah. Hasil di cache,
  bukan aset game. Final samping dan depan dibuka/diperiksa; sampel oblique awal
  juga diperiksa. Ini pemeriksaan rangkaian pose, bukan klaim telah menonton
  playback video kontinu atau jaminan seluruh rasa robotik sudah hilang.
- Original `101172.glb` dan derivative `101172-rigged.glb` tidak berubah:
  SHA-256 masing-masing `1dd246fbac2e45209b97648018093b643d49624e288f3c87b1b26317e058e9c8`
  dan `0acf1c73e6060bcc3da603ad0bdacc99f7829c6e7859e4bc9c134742d838a75e`.
- Motor fisika, kecepatan, normalisasi diagonal dan gameplay balance tidak diedit.

## Batas kecocokan

Ini adaptasi gaya/timing, bukan duplikat 3D identik. Lebar pijakan, rotasi 3D,
serta detail telapak tidak dapat ditentukan dari stickman samping. Panjang langkah
terbatas anatomi; cadence adaptif tidak menjamin foot-lock dunia sempurna pada
semua kecepatan. Condong tubuh tidak disalin ekstrem mentah-mentah. Pose sumber
yang ditahan dihaluskan agar tidak memindahkan hentakan kartun ke karakter 3D.

Coba di `/Hea/preview/`: **Mainkan karakter → JALAN → LARI → SPRINT**, lalu
joystick/WASD. Tombol Jalan pada mode inspeksi tetap untuk clip Walking, bukan
sprint overlay. Coba juga pergantian pace, stop, dan sudut samping saat bergerak.

## Reproduksi review

`node --experimental-strip-types scripts/review-sprint.mjs after` menghasilkan
36 gambar di `.cache/sprint-review/after`. Untuk baseline, simpan sementara
versi sebelum perubahan sebagai `src/character/CharacterLocomotionBeforeReview.ts`,
lalu jalankan dengan argumen `before` dan hapus sumber sementara setelah selesai.
