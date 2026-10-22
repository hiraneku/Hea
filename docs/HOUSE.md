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
  rekonstruksi CAD presisi. Sambungan utara-barat sementara berupa pintu lengkung
  tertutup, bukan ruangan baru yang sudah selesai.

`src/house/layout.ts` menyimpan dimensi dan footprint furnitur bersama untuk
scene, collision, proxy kamera dan denah. Tinggi plafon 3,3 m merupakan keputusan
pemodelan tahap ini, bukan ukuran yang dinyatakan pada gambar pengguna.

## Eksplorasi

- Stickman putih otomatis spawn di area terbuka dekat pintu masuk.
- Joystick HP/WASD/panah untuk berjalan; seret untuk melihat. Kamera mengikuti
  atau beralih ke pandangan mata melalui tombol **Kamera: Ikuti / Mata**.
- Dinding dan furnitur menghalangi gerak; motor memakai substep 7 cm dan sliding.
  Kamera memakai lima ray pada geometri proxy, jarak/FOV adaptif, dan batas di
  bukaan pintu masuk agar tidak tersangkut daun pintu atau keluar dari ruangan.
- Denah sekarang hanya living room. Tombol living room/titik awal mengembalikan
  avatar, bukan memindahkan pemain ke kamar lama yang sudah tidak ada.
- Akses keluar, dapur, kamar, lantai lain, dan tangga **belum dibangun**. Pintu
  bukan interaksi buka/tutup; taman di luar jendela hanya backdrop.
- Rig putih lokal tidak diubah. Animasi memakai kecepatan setelah collision;
  root motion bukan sumber posisi kedua. Model wajib dimuat dengan pesan gagal
  dan tombol coba lagi, tanpa fallback kotak.

## Teknis dan pemeriksaan

Geometri/material dibuat lokal tanpa CDN atau aset eksternal baru. Scene dibatch
menjadi 21 kelompok statis; bayangan arsitektur dicache, avatar memakai contact
decal. Angka ini bukan janji FPS pada semua HP. Arena dan controller karakter
bersama tidak diubah oleh revamp.

- 321 unit test / 29 file lulus, termasuk dimensi, batas tahap tunggal,
  susunan furnitur/jalur kosong, collision/sliding/substep dan kamera.
- Delapan kasus browser desktop/HP lulus: startup independen, denah satu tahap,
  tidak ada overflow, drag look, WASD/joystick, pelepasan input, posisi avatar
  mengikuti motor, reset titik awal, mode kamera dan kegagalan model eksplisit.
- Build Pages juga dibuka pada prefix `/Hea/house/`: avatar termuat pada
  desktop/HP tanpa page error; screenshot pandangan mata dan denah diperiksa.
- Screenshot desktop/HP spawn, pandangan mata dan denah ditinjau. Masalah awal
  kamera di belakang daun pintu ditemukan dan diperbaiki sebelum review ulang.
- Pemeriksaan visual hanya sampel, bukan penerimaan estetika oleh pengguna,
  jaminan bebas bug, atau pengukuran performa HP fisik.

Review: `node --experimental-strip-types scripts/review-house.mjs` dengan dev
server aktif; `HOUSE_REVIEW_URL` dapat menunjuk build produksi berprefix `/Hea/`.
Artefak hanya di `.cache/`, tidak ikut aset publik.
