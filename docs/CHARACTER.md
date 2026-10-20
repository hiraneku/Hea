# Karakter 101172 — rig & animasi berjalan

## Aset gameplay, bukan trik viewer

- Sumber tetap utuh: `public/models/101172.glb` (salinan unggahan di root juga tidak diubah).
- Hasil: `public/models/101172-rigged.glb`, GLB mandiri dengan mesh, tekstur,
  skeleton, inverse bind matrices, skin weights, dan clip **`Walking`**.
- Preview di `/Hea/preview/` memakai `GLTFLoader` + `AnimationMixer` untuk memutar
  **clip dari GLB itu sendiri**. Tidak ada deformer/IK runtime yang hanya hidup di viewer.
- Tombol unduh di preview memberikan aset yang sama, bisa dibuka di editor glTF
  atau dimuat game. Karakter aktif belum dialihkan ke aset ini.

## Konvensi dan rig

Aset hasil dinormalisasi ke tinggi **2 m**, telapak di Y=0, arah depan **+Z**, up +Y.
Sumber menghadap -Z dan memiliki pose kaki terbuka; konversi orientasi/ukuran
sudah dibake pada geometry. Material, UV, indeks dan tekstur dipertahankan.

Skeleton **28 tulang**:

- Root → Hips → Spine → SpineUpper → Chest → Neck → Head → HeadEnd.
- Kiri/kanan: Chest → Clavicle → UpperArm → ForeArm → Hand → HandEnd.
- Kiri/kanan: Hips → Thigh → Shin → Foot → Toes → ToeEnd.

Landmark pada `src/character/rig101172.ts` ditulis khusus untuk bentuk model ini,
bukan auto-rigger generik. Empat slot influence per vertex dinormalisasi; falloff
halus di sendi dan mask anatomis membatasi kebocoran weight antara lengan–torso
serta kaki kiri–kanan. Tangan model berupa bentuk membulat tanpa jari terpisah,
jadi belum ada rig jari. Tulang terminal dipakai sebagai ujung rantai, bukan semua
harus memiliki weight. Jumlah geometri masih **188.524 segitiga / 116.724 vertex**;
ini belum aset low-poly yang dioptimalkan untuk HP.

## Walking v1

- Loop **1,12 detik**, in-place, tanpa translasi Root di dunia.
- Perpindahan satu siklus **1,04 m** pada skala aset (kecepatan acuan ±0,929 m/s).
- Siklus kaki berlawanan 50%; stance 62% memberi fase tumpuan ganda.
- IK dua tulang dibake saat authoring untuk menjaga lutut menekuk ke depan.
- Kontak tumit → telapak → toe-off; clearance swing dan koreksi permukaan telapak
  dibake terhadap lantai datar (target clearance kontak 2 mm).
- Panggul memiliki bob/sway dan rotasi kecil; dada berputar berlawanan, kepala
  dikompensasi, lengan berayun berlawanan dengan kaki, siku dan pergelangan melunak.
- 120 interval sampling per siklus; track quaternion dengan interpolasi standar
  dan endpoint yang menyambung. Tidak memerlukan solver khusus saat dimainkan.

Ini **versi pertama untuk direview**, bukan klaim motion capture atau rig final
untuk semua pose. Perlu penilaian visual pengguna, tuning weight saat pose ekstrem,
dan kelak animasi idle/run/air/cast. Belum ada foot IK runtime untuk tangga/lereng.

## Pemakaian dalam gameplay

Sistem `AvatarModel` yang sudah ada mengenali nama clip `Walking`. Untuk memakai
aset setelah disetujui, berikan URL hasil ke constructor, misalnya:

```ts
// siteRoot harus menunjuk root situs HEA, bukan root domain di GitHub Pages.
const avatar = new AvatarModel(body, new URL('models/101172-rigged.glb', siteRoot).href);
await avatar.load();
avatar.update(dt, { speed: actualWorldSpeed, airborne, dead });
```

Adapter membaca `heaCharacter.walkSpeed`, mengoreksi acuan kecepatan setelah skala
ke tinggi pemain 1,52 m, dan menyesuaikan +Z menjadi -Z yang dipakai tubuh game.
Clip yang belum ada tidak dipalsukan: bila berhenti atau airborne, Walking memudar
kembali ke bind pose. Ini placeholder sampai clip idle/air dibuat. Pengujian memuat
GLB yang sebenarnya melalui adapter tersebut, bukan hanya model palsu di viewer.

**Penting:** kecepatan ground motor saat ini 8,5 m/s, jauh di atas jalan santai.
Pada tinggi pemain 1,52 m, kecepatan acuan Walking menjadi ±0,706 m/s. Sebelum
mengaktifkan karakter ini di game, selaraskan motor locomotion atau tambahkan run
beserta blending-nya. Clamp playback bukan solusi foot sliding pada kecepatan itu.
Juga belum menghubungkan ragdoll blocky lama ke skeleton baru.

Alternatif untuk controller baru: `src/character/CharacterPlayback.ts` menyediakan
play/pause, seek, blend bind/walk, serta `locomotion(dt, speed, grounded,
authoredWalkSpeed)`. Root/world translation tetap tanggung jawab motor game.
Hindari menyalin gerakan sin/cos dari preview; semua pose ada dalam aset.

## Menghasilkan ulang dan memeriksa

```bash
npm ci
npm run character:build
npm test
npm run build
npm run test:e2e -- tests/e2e/preview.spec.ts
```

`character:build` memakai Three.js/GLTFExporter dalam browser headless yang sudah
tersedia lewat dependensi npm, dengan server Vite sementara yang selalu ditutup.
Tidak perlu Blender atau layanan rigging eksternal. Script hanya menulis GLB baru;
tidak mengubah sumber atau mengganti karakter yang sedang aktif.

Unit test memeriksa GLB ekspor: skeleton, indeks/weight seluruh vertex, kontinuitas
loop, batas rotasi per sampel, clearance dan kontak telapak sepanjang siklus,
lintasan ankle pada stance, pause/scrub/blend, dan kompatibilitas `AvatarModel`.
Tes kontak berlaku pada skala aset dan lantai datar, bukan jaminan semua terrain.
Browser test memeriksa kontrol desktop/sentuh dan kegagalan pemuatan.

## Asal model

`101172.glb` adalah model yang disediakan dalam repositori oleh pemilik proyek.
Dokumen ini tidak mengasumsikan lisensi pihak ketiga untuk model tersebut.
`AVATAR-LICENSE.txt` yang sudah ada menjelaskan **RobotExpressive (`avatar.glb`)**,
bukan bukti lisensi untuk `101172.glb` atau turunannya.
