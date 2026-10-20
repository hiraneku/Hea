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
Sumber sudah menghadap **+Z** dan memiliki pose kaki terbuka. V3 hanya membake
normalisasi ukuran/posisi, tanpa rotasi 180° yang keliru pada v1/v2. Material, UV,
indeks dan tekstur dipertahankan; tes membandingkan seluruh vertex bind pose dengan sumber.

Skeleton **28 tulang**:

- Root → Hips → Spine → SpineUpper → Chest → Neck → Head → HeadEnd.
- Kiri/kanan: Chest → Clavicle → UpperArm → ForeArm → Hand → HandEnd.
- Kiri/kanan: Hips → Thigh → Shin → Foot → Toes → ToeEnd.

Landmark kaki dihitung oleh `src/character/anatomy101172.ts`, bukan tebakan
proporsi manusia generik. Penampang segitiga dirangkai menjadi kontur terhubung;
kontur luar dipilih agar lapisan dalam mesh tidak menggeser pusat penampang.
Percabangan kontur menentukan crotch; pusat pangkal kaki diambil di atasnya.
Perubahan arah centerline tungkai menentukan lutut, dan perubahan lebar/kedalaman
penampang menentukan pergelangan. Forefoot dan arah tekukan lutut memverifikasi +Z.
Ini estimator khusus geometri model ini, bukan pengganti landmark artis atau
jaminan anatomi untuk model lain. Offset soket/pelvis, batas pencarian dan fit
centerline dapat diaudit di source; landmark beserta profil disimpan di metadata GLB.

Pengukuran setelah normalisasi 2 m (dibulatkan; sisi kiri):

| Landmark             |    X (m) |   Y (m) |    Z (m) |
| -------------------- | -------: | ------: | -------: |
| Pusat pelvis         | −0,00008 | 1,10500 |  0,01863 |
| Pangkal kaki / Thigh |  0,05500 | 1,07500 |  0,01905 |
| Lutut / Shin         |  0,14277 | 0,61352 |  0,03974 |
| Pergelangan / Foot   |  0,22131 | 0,19000 | −0,05196 |
| Ball / Toes          |  0,25606 | 0,04500 |  0,04743 |

Pangkal kaki kini di 53,8% tinggi model, lutut 30,7%, pergelangan 9,5%.
Empat slot influence per vertex dinormalisasi; mask anatomis memisahkan lengan,
torso, dan kedua kaki. Blend lutut dipusatkan di hasil pengukuran, bukan di paha.
Weight pusat pelvis menjembatani sambungan kedua kaki; telapak dibatasi pada
Foot/Toes. Tangan model membulat tanpa jari terpisah, jadi belum ada rig jari.
Jumlah geometri tetap **188.524 segitiga / 116.724 vertex**; belum dioptimalkan untuk HP.

## Walking v3 — koreksi terhadap mesh asli

- Loop **1,16 detik**, in-place, tanpa translasi Root di dunia.
- Perpindahan satu siklus **0,94 m**, kecepatan acuan ±0,810 m/s pada skala aset.
- Siklus kaki berlawanan 50%; stance 58%, dengan overlap tumpuan.
- IK dua tulang dibake menggunakan panjang tungkai hasil ukur. Frame bidang
  tekukan bind pose dicocokkan penuh dengan frame pose, bukan sekadar arah tulang.
- Target angkatan ankle swing **12 cm** sebelum koreksi roll/kontak lantai.
  Angka ini bukan jarak minimum seluruh telapak dari lantai. Telapak membulat;
  roll dibatasi dan rotasi jari berlebihan tidak digunakan.
- Panggul memiliki bob/sway; dada berputar berlawanan, kepala dikompensasi,
  lengan berayun berlawanan dengan kaki dan dijauhkan sedikit dari paha.
- 120 interval per siklus, track quaternion standar dengan endpoint menyambung.
  Tidak memerlukan solver khusus saat dimainkan.

V1 dan v2 ditolak secara visual. V2 masih memakai pivot terlalu rendah, arah
sumber terbalik, dan angkatan kaki terlalu kecil. V3 mengganti dasar penentuan
sendi, orientasi dan lintasan tersebut. **Ini masih perlu review pengguna**, bukan
klaim motion capture atau rig final. Deformasi lipatan panggul pada pose ekstrem
masih perlu dinilai visual; belum ada idle/run/air/cast atau IK runtime untuk lereng.

`npm run character:review` memuat GLB ekspor secara independen, merender 8 fase
(dari depan, samping, tiga perempat), dan mengukur sudut lutut/separasi/tinggi pelvis.
PNG/metrik berada di `.cache/character-review/`, tidak di Git. Untuk membandingkan
sumber: `npm run character:review -- public/models/101172.glb` (bind pose).
Panah di lantai menunjukkan +Z. Ini inspeksi manusia, **bukan tes bahwa motion natural**.
Preview memakai revisi URL v4 untuk menghindari cache lama. Overlay skeleton
menambahkan titik panggul/lutut/pergelangan dengan label dan panah arah depan;
semuanya hanya alat inspeksi, bukan bagian yang menggerakkan karakter.

## Koreksi skin v4 dan pilihan gerakan

Mask X/Y v3 mengira sisi luar paha yang dekat tangan merupakan bagian lengan.
Akibatnya ayunan tangan menarik beberapa vertex paha menjadi tonjolan tajam.
`skinRegions101172.ts` kini memisahkan komponen mesh di bawah bahu (Y < 1,4 m),
menyatukan posisi berimpit untuk seam UV/normal, lalu membedakan komponen lengan
menggantung dari tubuh/tungkai yang tersambung ke kaki. Di atas batas itu tetap
ada blend bahu. Geometry asli tidak diubah; koreksi dibake pada skin weights GLB.

Regresi memeriksa nol weight lengan pada daerah paha tengah serta batas stretch
edge segitiga paha pada 16 fase Walking. Render QA diperiksa dari depan, samping,
dan tiga perempat, bukan hanya mengandalkan tes koordinat tulang.

Preview sekarang mulai **diam (bind pose)**. Tombol **Jalan** mengaktifkan Walking;
klik lagi mengembalikan weight animasi ke nol dengan transisi halus. Ini berbeda
dari **Jeda animasi**, yang hanya membekukan fase aktif. Dropdown pose tetap sinkron
dengan tombol; scrub mengaktifkan Walking untuk inspeksi fase. Hanya Walking
tersedia saat ini, tidak ada clip idle/run/jump palsu. Pilihan gerakan lain dapat
ditambahkan saat clip-nya selesai. Perubahan UI tidak mengganti pemain default.

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
Pada tinggi pemain 1,52 m, kecepatan acuan Walking menjadi ±0,616 m/s. Sebelum
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
npm run character:review
npm test
npm run build
npm run test:e2e -- tests/e2e/preview.spec.ts
```

`character:build` memakai Three.js/GLTFExporter dalam browser headless yang sudah
tersedia lewat dependensi npm, dengan server Vite sementara yang selalu ditutup.
Tidak perlu Blender atau layanan rigging eksternal. Script hanya menulis GLB baru;
tidak mengubah sumber atau mengganti karakter yang sedang aktif.

Unit test mengukur ulang sumber, memeriksa identitas vertex/orientasi bind pose,
landmark ekspor, hash sumber dalam metadata, skeleton, indeks/weight seluruh vertex, kontinuitas
loop, batas rotasi per sampel, clearance dan kontak telapak sepanjang siklus,
lintasan ankle pada stance, pause/scrub/blend, dan kompatibilitas `AvatarModel`.
Tes kontak berlaku pada skala aset dan lantai datar, bukan jaminan semua terrain.
Browser test memeriksa kontrol desktop/sentuh, label sendi, dan kegagalan pemuatan.
SHA-256 sumber: `1dd246fbac2e45209b97648018093b643d49624e288f3c87b1b26317e058e9c8`.

## Asal model

`101172.glb` adalah model yang disediakan dalam repositori oleh pemilik proyek.
Dokumen ini tidak mengasumsikan lisensi pihak ketiga untuk model tersebut.
`AVATAR-LICENSE.txt` yang sudah ada menjelaskan **RobotExpressive (`avatar.glb`)**,
bukan bukti lisensi untuk `101172.glb` atau turunannya.
