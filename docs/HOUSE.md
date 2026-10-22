# Rumah Senja — revamp tahap 1: living room

Area `/Hea/house/` terpisah dari arena. Keputusan pengguna: **mulai rumah baru
bertahap**, living room dahulu, mengikuti denah/screenshot yang dikirim dengan
**gaya desa isekai**, bukan menyalin UI aplikasi perancang pada screenshot.
Denah rumah dua lantai sebelumnya digantikan; versi itu tetap ada dalam riwayat
Git sebelum revamp. Ruang lain menunggu referensi berikutnya.

## Acuan dan orientasi

- Ukuran ruang bersih sekitar **8,11 × 8,3 m** (≈67,3 m²), utara = −Z.
- Pintu masuk di selatan/bawah denah; keset di depannya dan gantungan mantel
  sedikit ke kiri. Bagian tengah dan selatan sengaja luas, bukan diisi dekor baru.
- Area duduk di timur-laut/kanan atas: sofa tiga dudukan menghadap ruang,
  meja bundar kecil di kanannya, karpet cokelat, kursi santai di tepi barat
  karpet dan kursi goyang di sudut tenggara. Perapian berada di dinding timur.
- Lantai papan oak, dinding plester krem, balok kayu, sofa linen abu kehijauan,
  kursi goyang kayu dan perapian batu merupakan interpretasi isekai.
- Jendela barat dan calon sambungan utara-barat mengikuti pembacaan screenshot.
  Posisi/detail bukaan tidak semuanya terukur dari gambar, jadi bukan klaim
  rekonstruksi CAD presisi. Sambungan utara-barat kini berupa lorong lengkung terbuka sepanjang 2,2 m,
  tanpa daun pintu. Ujung lorong masih tertutup karena ruang berikutnya belum dibangun.

`src/house/layout.ts` menyimpan dimensi dan footprint furnitur bersama untuk
scene, collision, proxy kamera dan denah. Atap terbuka kini memiliki tepi 3,25 m dan puncak 5,9 m.
Ini keputusan pemodelan atmosfer dari referensi, bukan ukuran CAD pengguna.

## Eksplorasi

- Stickman putih otomatis spawn di area terbuka dekat pintu masuk.
- Joystick HP/WASD/panah untuk berjalan; seret untuk melihat. Kamera mengikuti
  atau beralih ke first-person melalui tombol **Kamera: Ikuti / Mata**. Saat berjalan, kamera mata mengikuti ritme langkah dengan ayunan kepala/samping ringan dan kembali halus saat berhenti; gerak dinonaktifkan pada preferensi reduced-motion.
  Tubuh/tangan/kaki tetap terlihat saat menunduk; hanya segitiga kepala yang
  dihilangkan pada salinan geometri render privat, tanpa mengubah GLB atau tulang.
  Kecepatan berjalan 0,85 m/s, turun dari 1,65 m/s.
- Dinding dan furnitur menghalangi gerak; motor memakai substep 7 cm dan sliding.
  Kamera memakai lima ray pada geometri proxy, jarak/FOV adaptif, dan batas di
  bukaan pintu masuk agar tidak tersangkut daun pintu atau keluar dari ruangan.
- Denah sekarang hanya living room. Tombol living room/titik awal mengembalikan
  avatar, bukan memindahkan pemain ke kamar lama yang sudah tidak ada.
- Akses keluar, dapur, kamar, lantai lain, dan tangga **belum dibangun**.
  Lorong penghubung di balik lengkungan bisa dilewati. Pintu
  bukan interaksi buka/tutup; taman di luar jendela hanya backdrop.
- Rig putih lokal tidak diubah. Animasi memakai kecepatan setelah collision;
  root motion bukan sumber posisi kedua. Model wajib dimuat dengan pesan gagal
  dan tombol coba lagi, tanpa fallback kotak.

## Koreksi setelah umpan balik living room

- Sofa dan kursi santai diganti rangka oak/slat terbuka dengan bantalan linen,
  bukan badan upholstery modern. Desain kursi goyang dipertahankan, posisinya digeser.
- Karpet 2,65 × 1,85 m digeser ke barat. Jarak tepi karpet ke footprint perapian
  lebih dari 0,9 m; kursi goyang lebih dari 0,6 m. Alas batu 0,95 × 1,84 m,
  dengan proyeksi ke depan tungku yang lebih kecil. Ini proporsi game, bukan
  spesifikasi keselamatan konstruksi perapian sungguhan.
- Titik cahaya plafon dihapus; pencahayaan dari daylight/ambient dan perapian.
- Api kini memakai lidah shader bertepi lembut, kayu bakar dengan permukaan hangus dan potongan serat terlihat, serta bara kecil. Gerak tetap stylized; bukan simulasi pembakaran/fluida.
- Pintu masuk diperbaiki arah engsel/bukaannya, panel dua sisi dan latch besi;
  panel besar di luar pintu yang merusak tampilan dihapus. Collision daun pintu
  mencegah karakter/kamera menembusnya. Daun pintu masih statis, bukan interaksi.

## Atmosfer rumah tua dari referensi ilustrasi

Denah 8,11 × 8,3 m dan kontrol tetap, bukan menyalin keseluruhan bangunan
cutaway pada gambar. Tidak menambah dapur, tangga, NPC, atau lantai baru.

- Plafon datar diganti atap miring terbuka, papan kayu tua, kasau, collar beam,
  king post dan penopang. Proxy kamera mengikuti lereng, tidak menyisakan bidang
  collision plafon datar lama.
- Dinding plester gading bernoda halus/retak rambut, batu kaki dinding, lantai
  flagstone berwarna tanah, karpet tenun berpinggir/fringe dan kain linen.
- Gable utara mempunyai bukaan segitiga di sumbu tengah, rangka lebih tipis dan tracery bertingkat. Kaca dibuat sedikit emissive untuk menggambarkan langit, bukan lampu. Jalur sinar dan tumpahan cahaya lantai adalah pendekatan shader lembut tanpa volumetrik/pencahayaan global.
- Arah matahari, hemisphere dan pantulan daylight dari lantai diatur untuk
  menyisakan sudut teduh tanpa membuat kasau hitam. Pantulan bawah adalah
  aproksimasi pencahayaan, **bukan lampu/fixture plafon**. Tidak memakai GI/SSAO
  real-time atau janji hasil identik dengan ilustrasi referensi.
- Perapian menyatu dengan hood plester dan lengkungan batu potong. Buku, rak
  kecil dan kendi memberi kesan dihuni, tetap di tepi ruangan dan memiliki
  collider untuk rak. Jarak karpet/kursi dari tungku tetap dipertahankan.
- 48 motes debu kecil mengisi jalur cahaya; bukan full-screen fog atau simulasi
  volumetrik mahal. Reduced-motion menghentikan gerak debu dan variasi api.
- Navigasi desktop diperkecil agar tidak menutupi lantai dengan panel putih besar.

## Teknis dan pemeriksaan

Geometri/material dibuat lokal tanpa CDN atau aset eksternal baru. Scene dibatch
menjadi sekitar 30 kelompok statis; bayangan arsitektur dicache, avatar memakai contact
decal. Angka ini bukan janji FPS pada semua HP. Arena dan controller karakter
bersama tidak diubah oleh revamp.

- 329 unit test / 32 file lulus, termasuk dimensi, batas tahap tunggal,
  susunan furnitur/jalur kosong, collision/sliding/substep dan kamera.
- Putaran browser final: **13 lulus, 1 dilewati eksplisit** (lorong fisik di HP);
  mencakup startup/denah, kontrol desktop dan joystick sentuh, mode kamera,
  pengujian kamera langkah first-person, identitas 22 buku dan kegagalan model.
- Build Pages juga dibuka pada prefix `/Hea/house/`: avatar termuat pada
  desktop/HP tanpa page error; screenshot pandangan mata dan denah diperiksa.
- Satu kasus browser tambahan memverifikasi perjalanan WASD melalui lengkungan
  menuju lorong secara fisik di desktop; jalur/batas motor juga diuji unit.
- Screenshot desktop/HP spawn, first-person menunduk, pintu masuk dan pandangan
  mata ditinjau ulang pada build produksi. Tidak ada page error.
- Screenshot desktop/HP spawn, pandangan mata dan denah ditinjau. Masalah awal
  kamera di belakang daun pintu ditemukan dan diperbaiki sebelum review ulang.
- Pemeriksaan visual hanya sampel, bukan penerimaan estetika oleh pengguna,
  jaminan bebas bug, atau pengukuran performa HP fisik.

Review: `node --experimental-strip-types scripts/review-house.mjs` dengan dev
server aktif; `HOUSE_REVIEW_URL` dapat menunjuk build produksi berprefix `/Hea/`.
Artefak hanya di `.cache/`, tidak ikut aset publik.

### Validasi atmosfer rumah tua

- Full unit suite 329 tes / 32 file lulus, termasuk clearance atap, bukaan jendela
  yang benar-benar terbuka, langkah kamera dan reduced-motion.
- Putaran browser final: 13 lulus dan satu kasus lorong fisik HP dilewati secara
  eksplisit. Jalur lorong desktop lulus setelah budget waktu uji disesuaikan untuk
  rasterisasi software; kecepatan gerak permainan tidak diubah.
- Build produksi `/Hea/house/` direview pada desktop dan HP: avatar/kontrol kamera,
  first-person, buku, pintu masuk dan interior, tanpa page error. Kasau diperiksa
  lewat pandangan ke atas; daylight/jendela, flame, batu dan furnitur diperiksa ulang.
- Shader/tekstur dan shadow cache tetap WebGL lokal, tanpa workflow publikasi baru.
  Tidak ada jaminan FPS HP, kesamaan identik dengan ilustrasi, atau penerimaan estetika pengguna. Pencahayaan ini memakai shadow map/ambient fill dan tumpahan shader, bukan path tracing atau GI fisik.
