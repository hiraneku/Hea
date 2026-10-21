# Koreksi hentakan langkah setelah Task 2

Keluhan pengguna: langkah masih terlihat robotik dan hentakan membuat karakter
bergetar. Audit lanjutan menemukan masalah di **overlay prosedural**, terpisah
dari clip Walking revision 2 yang tetap byte-identik.

## Penyebab yang diperbaiki

Di `CharacterLocomotion.ts`, target kaki menjelang akhir stance diberi lift sampai
25 mm, tetapi awal swing dimulai lagi dari lift nol. Pitch juga berpindah dari
roll stance langsung ke nol; lintasan travel linear stance disambung ke swing
smootherstep yang kecepatannya nol. Ketiga sambungan ini tidak kontinu walaupun
smoothing quaternion sesudahnya menyamarkan sebagian perubahan. Batas tinggi
pelvis juga dilepas/diberlakukan lewat kondisi fase yang mendadak. Selain itu,
overlay menyala/mati pada ambang lateral 12%, sehingga koreksi arah kecil dapat
mencampur dua pose berbeda berulang kali.

Perubahan terarah:

- `sampleLocomotionStep` dipakai bersama untuk langkah biasa dan lateral. Swing
  quintic menyamai kecepatan stance dan percepatan nol pada toe-off/contact.
- Lift stance nol; heel rise berasal dari orientasi sole terukur. Lift swing sin³
  memiliki kecepatan/percepatan vertikal nol di sambungan, dengan apex tetap.
  Roll forefoot positif sesuai +Z-forward diteruskan dan diredam selama swing,
  bukan diputus tiba-tiba. Tidak menambah kecepatan atau tinggi langkah.
- Cap reach pelvis memakai soft-min 2 mm, dilepas halus sesudah toe-off dan
  diaktifkan kembali sebelum contact agar pelvis tidak tiba-tiba turun.
- Bobot overlay berubah kontinu pada rasio lateral 0.08–0.22, bukan gate biner
  pada 0.12. Pace dan kontrol tetap. Reach lateral sedikit dipadatkan menjadi
  `0.043 + run*0.009` m untuk mengimbangi overshoot Hermite dan mempertahankan
  batas lane yang sudah diuji; tidak mengubah kecepatan perpindahan pemain.

## Pemeriksaan

- 302 unit tests / 27 files lulus: tes baru posisi/kecepatan/percepatan di contact
  dan toe-off, serta jitter bobot saat rasio lateral berganti 0.119/0.121. Tes
  lama floor contact, lane, pivot, start/stop, flight dan facing dipertahankan.
- 8 regresi browser desktop/HP untuk gerak preview, pace/lock, backward travel dan
  hold heading dijalankan. Ini pemeriksaan otomatis, bukan acceptance visual.
- Renderer overlay menghasilkan baseline/final dari source sebelum/sesudah yang
  sama-sama memakai GLB Walking revision 2. Gambar depan/samping untuk lateral
  dua arah, backward dan run dibuka/diperiksa. Review ini adalah pose sampel
  pada renderer rig, **bukan video gameplay kontinu** dan tidak membuktikan semua
  getaran sudah hilang atau gerak sudah diterima pengguna.
- Lint, format dan build Pages diperiksa. Model, rig, material, physics, movement
  speeds, combat, dash balance, serta kode Task 2 lainnya tidak diedit.

File fungsional: `src/character/CharacterLocomotion.ts`.
Tes: `tests/unit/character-step.test.ts`, `tests/unit/character-rig.test.ts`.
Review: `scripts/review-locomotion.mjs`. Output PNG tetap di `.cache/motion-review`.
Dokumentasi: file ini dan `CHANGELOG.md`; output Pages dibangun ulang.

Reproduksi review baseline tanpa berpindah branch:

```sh
git show cbf2e12:src/character/CharacterLocomotion.ts > src/character/CharacterLocomotionBeforeReview.ts
node --experimental-strip-types scripts/review-locomotion.mjs before
rm src/character/CharacterLocomotionBeforeReview.ts
node --experimental-strip-types scripts/review-locomotion.mjs after
npm test
npm run lint
npm run format:check
npm run build:pages
```

Perubahan ini menghilangkan diskontinuitas target yang teridentifikasi, bukan
sekadar memperlambat karakter. Feel gerak masih perlu dinilai pengguna di game;
terutama percampuran Walking dan overlay ketika belok/berhenti pada berbagai fase.
