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
indeks dan tekstur dipertahankan. Mulai v6, hanya penampang pergelangan/lengan bawah
aset turunan dirampingkan atas permintaan pengguna; normal dihitung ulang. Tes
membandingkan hasil dengan transformasi taper yang terdokumentasi dan memastikan
bagian lain tetap sama dengan sumber.

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
Preview memakai revisi URL v6 untuk menghindari cache lama. Overlay skeleton
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

## Bahu dan siku v5

Bahu v4 di Y=1,46 m terlalu dekat ketiak. V5 memproyeksikan centerline lengan
atas dan mencocokkan radius penampang dengan kontur cap bahu membulat. Hasil
kiri/kanan: bahu Y=**1,560 m**, |X|≈**0,08784 m** (tinggi model 2 m).
Chest menjadi Y=1,545 m, clavicle Y=1,555 m, SpineUpper mengikuti jarak ke Chest,
dan Neck Y=1,65 m; bukan sekadar menggeser garis lengan tanpa rantai tubuh.

Siku lama Y=1,16 m terlalu rendah terhadap transisi shaft model ini. Penampang
lengan asli disampel tiap 5 mm; minimum luas bbox kontur pada pita shaft
Y=1,25–1,42 m menempatkan siku di **Y=1,350 m**, |X|≈**0,13869 m**.
Model bergaya ini tidak mempunyai crease siku tajam: minimum shaft adalah
landmark geometris yang dipakai untuk authoring, bukan klaim sendi biologis yang
bisa diketahui persis dari permukaan. Rentang fit khusus model ini dapat diaudit
di `anatomy101172.ts`; profil serta landmark kedua lengan ikut metadata GLB.

Blend UpperArm/ForeArm sekarang dibatasi ±4 cm terhadap siku terukur, dengan
transisi terpisah ke Hand. Pemisahan komponen lengan–paha v4 tetap digunakan.
Walking diekspor ulang dengan skeleton/weights baru; tidak ada koreksi khusus
viewer. Overlay menambahkan label BAHU dan SIKU di posisi bone yang sebenarnya.
Tes mengukur ulang sumber, membandingkan pivot ekspor, memeriksa weight forearm,
dan mempertahankan regresi paha/telapak. Gerakan Jalan toggle tetap berfungsi.

## Penyesuaian v6 — siku, pergelangan, leher, dan uji main

- Siku diturunkan **4 cm** dari landmark v5 ke Y=**1,31 m** pada model 2 m.
  X/Z diambil dari kontur pada tinggi baru. `elbowContour` tetap menyimpan hasil
  ukur v5; offset ini adalah keputusan authoring sesuai review, bukan pengukuran baru.
- `shape101172.ts` merampingkan radius X/Z lengan bawah/pergelangan hingga **12%**,
  dengan fade halus Y=0,91–1,295 m. Centerline, panjang, UV, indeks, jumlah vertex,
  tangan paling bawah, lengan atas, torso dan kaki tidak diubah. Hanya GLB turunan
  yang dibentuk ulang, bukan sumber. Weight dihitung ulang setelah taper.
- Skeleton tetap 28 tulang termasuk **Neck → Head**. `CharacterLook` mengontrol
  yaw ±70° dan pitch ±30°, dibagi Neck 65% / Head 35%, relatif tubuh. Panggil
  `clear()` SEBELUM update mixer, lalu `apply(yawRadians, pitchRadians)` SESUDAHNYA.
  Helper ini renderer/DOM-independent dan dapat digunakan gameplay dengan GLB yang
  sama; tidak memakai deformer viewer. Ini kontrol prosedural, bukan clip look baru.
  Overlay menampilkan titik LEHER dan panah putih untuk arah kepala tanpa wajah.
- Tombol **Mainkan karakter** mengaktifkan joystick layar dan WASD/panah.
  Gerakan mengikuti bidang kamera; kamera mengikuti perpindahan karakter. Joystick
  berhenti pada pointer-up/cancel/lost-capture; input dibersihkan saat blur/hidden.
  Lepas input untuk diam, Reset posisi untuk kembali ke pusat, Selesai main untuk
  inspeksi. Slider menoleh tetap tersedia selama berjalan.
- `CharacterTestDrive` memakai Walking dari GLB dan acuan speed metadata, mengukur
  speed aktual untuk playback, menormalkan diagonal, serta membatasi posisi ±5 m.
  Ini **arena uji lantai datar**, bukan integrasi controller game penuh: belum ada
  collision, gravitasi, lompat, run, obstacle, terrain atau multiplayer. Mode ini
  tidak memodifikasi pemain default. Kontrol inspeksi clip dikunci selama main
  agar scrub/pause tidak bertentangan dengan locomotion.

Tes mencakup taper hanya pada region lengan, batas perubahan vertex, offset siku,
rotasi look tanpa akumulasi/gerak torso, motion relatif kamera, normalisasi diagonal,
batas arena, keyboard/joystick, lepas input, reset posisi dan kontrol menoleh.

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

## Stop dua langkah — menggantikan blend berhenti sebelumnya

Stop sebelumnya ditolak: selesai setengah siklus lalu fade ke bind pose bukan
langkah penutup. Sekarang `CharacterStop.ts` membake **clip `Stopping` khusus pose
dan fase saat input dilepas**, memakai solver hinge-frame yang sama dengan Walking:

1. Fase <0,5 memilih kaki kanan sebagai kaki berikutnya yang akan menapak; fase
   ≥0,5 memilih kiri. Posisi, orientasi dan kecepatan swing awal disampel dari pose
   aktual/Walking; kaki penopang tetap di target lantai semula.
2. Kaki acuan mendarat lebih dulu (0,18–0,56 detik), lalu transfer berat 0,08 detik.
3. Kaki satunya terangkat dan menyusul selama 0,42 detik. Target Z akhir sama,
   dengan lane X kiri/kanan tetap terpisah. Tidak menyatukan kedua kaki bertumpuk.
4. Tubuh/lengan mereda 0,22 detik; pose akhir ditahan sebagai **berdiri sejajar**,
   bukan A-pose. Total sekitar 0,9–1,28 detik tergantung fase awal.

Clip berisi quaternion tulang, Hips.position dan Root.position biasa. IK hanya
berjalan saat pembentukan clip, bukan setiap frame playback. Metadata, bind skeleton,
geometry dan Walking GLB v6 tidak diubah. Clip Stopping bersifat phase-specific,
**dibuat runtime oleh helper reusable, tidak disimpan statis di GLB unduhan**.
`makeCharacterStop` mengembalikan AnimationClip standar yang juga bisa diekspor
bersama rig oleh pipeline glTF. Tidak ada logika berhenti khusus renderer preview.

`CharacterPlayback.setMode('bind')` tetap nama API legacy untuk permintaan stop.
`setMode('bind', true)` hanya untuk bind inspection awal/reset. `isStopping`
menandai transisi; `stopPlan` menyediakan clip dan waktu kontak untuk inspeksi.
Memulai walk lagi membatalkan stop dari pose yang sedang terlihat dan membake
langkah awal baru, bukan crossfade ke siklus pada fase acak. Jeda inspeksi biasa
masih tersedia, tetapi permintaan stop menyelesaikan gerak walau `playing=false`.

Untuk motor dunia: aktifkan `rootMotionEnabled`, panggil `update(dt)`, kemudian
`consumeRootMotion()` sekali per frame; putar delta lokal mengikuti orientasi tubuh,
kalikan skala tubuh, dan terapkan pada motor. **Jangan tambahkan translasi Walking
atau damping velocity saat Starting / Stopping**: itu menyeret kaki yang sedang dipin.
`CharacterTestDrive` menerapkan kontrak ini, termasuk ketika pose akhir ditahan.
Preview inspeksi juga mengonsumsi motion dan mengikuti posisi dengan kamera.

QA: `npm run character:stop-review` merender fase 0,25 dan 0,75 dari tiga arah,
masing-masing saat mulai, kontak pertama, kaki penutup terangkat, kontak kedua,
dan akhir. PNG berada di `.cache/stop-review/`, tidak di Git. Regresi menguji delapan
fase, kedua kaki acuan, pijakan <2 mm drift, tidak menembus lantai, clearance kaki
penutup, pose akhir sejajar, serta ekstraksi motion pada tubuh diputar/diskalakan.

Batasan: ini stop authoring prosedural untuk **lantai datar**, bukan mocap, collision
solver atau animasi airborne. Di batas arena yang meng-clamp tubuh, foot-lock tidak
bisa dijamin jika motion ditolak; controller terrain/halangan perlu replanning.
Gerak tetap perlu review pengguna. Preview tetap ringkas, detail teknis dalam panel lipat.

## Start dan penyatuan ritme Walking → stop

`CharacterStart.ts` membake clip `Starting` dari pose berdiri/pose stop saat ini:
transfer berat singkat, satu langkah awal dengan clearance, lalu masuk ke pose
kontak Walking yang sama persis. Kaki tumpuan berputar pada patch telapak tetap;
Root bergerak dari kecepatan nol dan menyerahkan kecepatan akhir ke cadence Walking.
Jika pijakan sudah jauh di belakang ketika start diinterupsi, fase join digeser
sedikit dalam double support agar tubuh tidak ditarik mundur.

`setMode('walk')` dari diam memakai start ini; `isStarting` dan `startPlan` tersedia
untuk controller. `seek()` tetap inspeksi Walking langsung dan membatalkan start.
Start mengikuti pause/speed; stop tetap menuntaskan langkah penutup. Starting dan
Stopping dibuat runtime, **bukan tambahan clip di GLB v6 unduhan**. File sumber,
mesh/rig v6, Walking, dan pemain game default tidak diganti.

Stop tidak lagi membekukan torso/lengan lalu menariknya langsung ke netral.
Helper mengambil kelanjutan Walking dengan cadence yang melambat, mempertahankan
counter-swing lengan dan gerak pelvis pada awal release, lalu meredakannya. Jeda
transfer antarlangkah dipersingkat, waktu langkah penutup mengikuti durasi Walking,
dan tinggi langkah disesuaikan agar terasa sebagai lanjutan jalan yang memendek.

**Kontrak motor:** `rootMotionEnabled=true` dan konsumsi delta tepat sekali saat
Starting maupun Stopping; jangan tambahkan gerak jalan biasa di frame tersebut.
Saat start selesai di tengah frame, playback memasukkan sisa waktu frame ke fase
Walking dan delta root, sehingga motor tidak boleh menghitungnya dua kali. Sesudah
handoff, gerak biasa mengikuti `playback.speed`, bukan kecepatan input instan.
`CharacterTestDrive` adalah contoh lengkap. Arah hadap ditetapkan sebelum start dan
ditahan selama langkah pertama agar pijakan tidak terseret oleh yaw. Ini belum
turn-in-place/turn-aware IK; perubahan arah diterapkan kembali setelah kontak awal.

Regresi tambahan mengukur first-step clearance, kontak telapak, drift XZ, batas
perubahan sendi hingga join, pose akhir identik Walking, release/restart cepat,
kelanjutan counter-swing saat stop, dan leftover frame pada tubuh diskalakan.
`npm run character:stop-review` kini juga merender tujuh tahap start sampai masuk
Walking dari depan/samping/tiga-perempat. PNG di cache hanya untuk QA; kelulusan
teknis tidak menggantikan penilaian gerak oleh pengguna.

## Profil gait per clip — sinkronisasi setelah Walking diganti

Start/stop tidak lagi mengasumsikan kontak di fase 0 / 0,5 atau mengambil
`walkSpeed` / `walkStance` lama dari rig. `WalkingGait.ts` menjadi sumber bersama
untuk fase kontak/lift-off tiap kaki, kecepatan acuan, durasi, dan clearance.
Start memilih pose join dari marker kaki yang benar; rentang pergeseran join
mengikuti double support clip itu. Stop memilih kontak berikutnya, menghitung
sisa waktu dan interval menuju kontak kaki kedua, termasuk cadence playback.

Urutan pemilihan profil:

1. Marker eksplisit dari pemanggil, bila disediakan.
2. `animation.extras.heaGait` di GLB, jika fingerprint cocok dengan clip.
3. Analisis clip aktual: sampel telapak dan kecepatan ankle sepanjang satu siklus,
   estimasi kecepatan in-place, lalu identifikasi interval tumpuan setiap kaki.

`rig101172.ts` kini menulis marker eksak melalui `stampWalkingGait()`. GLTFExporter
menyimpannya di animation extras; GLTFLoader memulihkannya sebagai clip userData.
Fingerprint mencakup durasi dan track names/times/values; marker lama tidak dipakai
ketika clip berubah. Analisis di-cache per clip dan geometry, bukan tiap frame.
Jika ambigu, sistem melaporkan error yang meminta profil yang benar—tidak diam-diam
kembali ke fase Walking lama. Marker eksplisit juga diperiksa terhadap pose/speed.

Contoh authoring clip baru pada rig yang sama:

```ts
import { stampWalkingGait } from '../character/WalkingGait';

// Isi dari marker authoring animasi baru, bukan menyalin angka Walking lama.
stampWalkingGait(newWalk, {
  speed: authoredForwardSpeed, // unit aset/detik; sebelum skala tubuh
  feet: {
    Left: { contact: leftContactPhase, liftOff: leftLiftOffPhase },
    Right: { contact: rightContactPhase, liftOff: rightLiftOffPhase },
  },
});
// Ekspor newWalk bersama rig menggunakan GLTFExporter seperti pipeline sekarang.
```

Jika hanya mengganti file GLB dengan clip baru bernama `Walking`, loader memproses
profilnya otomatis. Untuk mengganti clip pada instance yang sudah hidup:

```ts
// Panggil setelah stop selesai; saat masih berjalan/transisi akan ditolak.
playback.replaceWalking(newWalk); // atau replaceWalking(newWalk, exactMarkers)
// Inspeksi hasil: playback.gait, playback.authoredWalkSpeed.
```

Jangan mengedit track instance yang sedang dimainkan secara in-place; buat clip
baru dan gunakan API replacement agar action mixer dan profil diperbarui bersama.
Replacement mereset ke bind inspection. `CharacterTestDrive(body, playback)` tanpa
argumen speed mengikuti kecepatan profil baru dan skala tubuh secara dinamis.
Argumen speed ketiga opsional adalah permintaan kecepatan dunia; cadence disesuaikan
terhadap kecepatan asli clip, bukan mengganti metadata gait-nya.

**Batas dukungan:** walking siklik in-place maju +Z, rig/anatomi 101172 yang sama,
pose translation limb sesuai bind, satu contact/lift-off per kaki per siklus,
dengan double support dan kecepatan stance kira-kira konstan di lantai datar.
Bukan jaminan untuk rig lain, strafing/backwalk, run/airborne, root-motion Walking,
atau clip yang sudah salah foot sliding. Clip tersebut perlu retargeting atau
adapter tersendiri. Marker manual harus sesuai animasi, bukan sekadar angka valid.
`AvatarModel` adapter lama/default gameplay tidak dialihkan ke motor baru ini.

Regresi memuat marker melalui GLB aktual, mengubah durasi dan offset fase clip,
mengecek foot-lock start/stop, mengabaikan metadata rig yang sengaja dibuat basi,
mengecek interval asimetris/wrap, menolak clip tidak didukung, serta memastikan
replacement yang gagal tidak merusak action lama. GLB v6 ditambah metadata saja;
binary chunk mesh, skin, skeleton dan keyframe-nya tetap identik.

## V7 — putih, isolasi bahu/leher, dan flight menggantikan jump

Review pengguna menolak ArcaneJump. UI dan API jump dihapus, diganti flight:
**tekukan kaki singkat → naik → hover terus → turun atas permintaan → recovery**.
`CharacterFlight.ts` membake envelope `Flight` dari pose aktual. Tidak ada lagi
pose merapal, ayunan lengan ekstrem atau jatuh otomatis setelah apex. Tinggi hover
0,62 unit aset, takeoff 0,28 s dan mencapai hover 0,72 s. Hover bertahan tanpa batas;
root bob 1,4 cm dengan ramp halus serta napas kecil pada torso/lengan.

```ts
playback.rootMotionEnabled = true;
playback.fly(); // false jika masih terbang/recovery
playback.land(); // antre turun jika masih dalam fase naik
playback.update(dt);
const delta = playback.consumeRootMotion(); // XYZ: skala/orientasi oleh motor
// isFlying, isLanding, flightStage, flightPlan untuk inspeksi.
```

`CharacterTestDrive.requestFlight()` melakukan toggle terbang/turun. Dalam mode
main, joystick/WASD menggeser dan mengarahkan karakter saat hover. Tidak ada gerak
jalan biasa yang diduplikasi selama takeoff/landing. Heading ditahan saat kaki
menapak; input menentukan apakah sesudah recovery diam atau masuk Starting.
Spasi atau tombol TERBANG/Turun pada stage; tombol Terbang/Turun juga tersedia
untuk inspeksi. Landing request mempertahankan offset bob agar tidak snap; reset
membersihkan trajectory dan state, pemilik mereset posisi/kamera.

Ini **flight preview di lantai datar**, belum flight physics/collision milik game
aktif: tidak ada ceiling/platform/terrain/collision avoidance. Jangan menjalankan
gravity lain bersamaan dengan authored root Y. Flight clip dibuat runtime, bukan
clip baru di GLB unduhan; unduhan tetap berisi rig dan Walking. Gameplay default
belum diganti. Clock flight independen cadence jalan; pause inspeksi tetap bekerja.

Perbaikan skin/material pada GLB turunan v7:

- Weight Head/Neck dibatasi ke leher/kepala; vertex bahu di bawah Y 1,59 tidak
  menerima pengaruh kedua tulang itu. Kepala tetap menoleh dengan Neck/Head,
  bukan menggerakkan mesh bahu lewat kernel Head yang terlalu lebar.
- Pengaruh Clavicle dipadamkan sebelum lengan bawah, pemisahan lengan/paha
  berbasis konektivitas tetap dipertahankan. Pose flight memakai lengan terbuka
  dan elbow ringan untuk menghindari persilangan/pelebaran pose jump lama.
- Material derivative putih tanpa base-color texture ungu; file sumber, posisi
  vertex, topology dan UV tetap dipertahankan. Geometry taper v6 tidak ditambah.
  Landmark siku/bahu tetap; Walking dan marker gait tetap kompatibel.

Regresi mengukur posisi vertex bahu pada pitch ±30°/yaw, tidak hanya posisi bone;
menguji nol weight kepala pada bahu dan pemisahan weight forearm/thigh, material
GLB putih, flight height/floor/pose, hover 10 detik tanpa auto-land, bob/descent,
scaled root consumer, input setelah landing, pause dan reset. Renderer QA juga
memeriksa envelope flight dari tiga sudut. Kualitas gerak tetap perlu review pengguna.

## V8 — hover lurus/rapat dan recovery stance

Flight membentuk chain paha–betis lurus di udara dengan arah hampir vertikal;
jarak ankle sekitar 17 cm, bukan 44 cm dari bind model. Upper arm dan forearm
diarahkan rileks ke bawah di dekat badan. Blend airborne dimulai setelah takeoff
serta selesai menjelang kontak lantai; knee bend hanya persiapan/penyerapan landing,
bukan pose hover. Bob/breathing tetap memakai playback reusable yang sama.

Landing memakai X/Z kaki yang ditangkap saat entry. Untuk entry diam dari stance
stopping, quaternion seluruh tulang dan posisi pelvis kembali ke pose entry;
recovery tungkai memakai IK agar telapak tetap kontak. Entry Walking menutup
kedua kaki ke kedalaman bersama, bukan mengembalikan pose stride melayang.
Walking hanya dilanjutkan oleh intent gerak motor yang masih aktif.

Skin v8 memakai partisi longitudinal sepanjang limb tanpa kernel jarak yang
mengubah bobot melintang penampang. Shoulder/arm mask ditransisikan pada graf
permukaan welded selama 300 iterasi, dengan label shaft/tubuh tetap di luar
zona bahu. Ini menghilangkan diskontinuitas klasifikasi horizontal di armpit.
Clavicle kini terbatas dekat shoulder. Sumber GLB dan bentuk selain taper forearm
yang sudah disetujui tetap tidak diubah. Test mengukur edge stretch mesh saat
hover, knee angle, lebar kaki, posisi tangan, dan recovery stance dari stopping.
