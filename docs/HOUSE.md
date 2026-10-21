# Rumah Senja — Stickman 1

Area eksplorasi tersendiri di `/Hea/house/`, sesuai pilihan pengguna: **rumah
keluarga di desa isekai**, bukan rumah penyihir, bukan penggantian arena.
Tautan masuk juga tersedia di footer menu utama HEA.

## Arah desain dan tata ruang

Rumah timber-frame dengan footprint 10 × 8 m, lantai atas di ketinggian 3,4 m,
dan 17 anak tangga. Bahasa material: balok kayu gelap, papan oak, plester krem,
batu perapian, linen, aksen sage/terracotta/biru pudar, serta cahaya sore hangat.

**Lantai bawah** memakai ruang keluarga dan dapur/makan terbuka. Pintu masuk
berada di sisi selatan, bangku keluarga menghadap perapian di utara-barat,
dapur/pantry di utara-timur, dan tangga di sisi timur. Meja makan untuk empat
orang terpisah dari jalur tangga. Ada gantungan pakaian, sepatu, tanaman,
keramik, buku, roti, cangkir, dan lukisan lanskap keluarga.

**Lantai atas** memiliki kamar orang tua di barat-selatan, kamar dua anak di
barat-utara, koridor di tengah, sudut baca di utara-timur, dan bordes dengan
railing di sisi void tangga. Kamar anak berisi dua ranjang, meja belajar dan
mainan kayu. Kamar orang tua berisi ranjang ganda, lemari dan peti linen.
Kasau atap tetap terlihat dari lantai atas.

Denah yang disajikan adalah **skematis untuk navigasi**, bukan gambar kerja
arsitektur. Ini studi interior 3D dengan lima area utama; bukan simulasi rumah
lengkap dengan sanitasi, instalasi utilitas, pintu/lemari interaktif, atau NPC.

## Eksplorasi

- Seret layar/mouse untuk melihat, tanpa memerlukan pointer lock.
- WASD/panah atau joystick untuk berjalan; arah diagonal dinormalisasi.
- Stickman putih yang sudah ada otomatis spawn. Kamera mengikuti dari belakang;
  tombol **Kamera: Ikuti / Mata** beralih ke pandangan mata.
- Badan menghadap arah berjalan dan mempertahankan arah terakhir saat berhenti.
  Animasi memakai kecepatan setelah collision, bukan sekadar input joystick.
- Kamera mengikuti dengan collision lima ray pada proxy arsitektur; di ruang
  sempit jarak/FOV menyesuaikan, dan avatar disembunyikan jika terlalu dekat.
- Furnitur besar, dinding, dan railing membatasi gerak. Motor menggunakan
  substep 7 cm dan resolusi per sumbu untuk menghindari tunnelling dan membantu
  bergerak menyusuri sisi furnitur.
- Tangga tampak memiliki 17 tread; tinggi kamera memakai ramp kontinu di atasnya
  agar tidak bergetar setiap anak tangga. Dek lantai dua memiliki void sungguhan.
- Lima tombol ruangan/denah menyediakan pindah posisi langsung dengan fade.
  Ini fasilitas tur, bukan klaim bahwa kamera berjalan menembus pintu saat tur.
- Joystick mendukung pointer capture/cancel; input dibersihkan ketika blur,
  tab disembunyikan, dialog dibuka, atau ruangan diganti.
- Mode reduced-motion menonaktifkan flicker api dan transisi.

## Teknis

Entry Vite `house/index.html`, terpisah dari boot arena, memakai ulang rig putih lokal. Geometri
rumah, furnitur, api, pemandangan kebun dan tekstur kanvas dibuat lokal; tidak
menggunakan model unduhan, CDN, backend, atau gambar generatif eksternal.

Geometri statis dibatch menurut material/shadow state (sekitar 70-an batch,
bukan satu draw call per papan/perabot). Bayangan matahari statis dicache setelah
render pertama, pixel ratio dibatasi 1,5. Ini optimisasi, bukan janji 60 fps pada
semua HP. Angka FPS WebGL software di sandbox tidak mewakili GPU HP pengguna.

## Pembaruan stickman

`HouseCharacter` memakai rig lokal `101172-rigged.glb` tanpa mengubah GLB atau
controller karakter bersama. Tinggi avatar 1,64 m, posisi mengikuti motor collision
rumah; root motion animasi tidak menggerakkan posisi untuk kedua kalinya. Model
wajib dimuat: kegagalan menampilkan pesan dan tombol coba lagi, bukan kotak fallback.
Bayangan arsitektur tetap dicache; avatar memakai contact decal bergerak. Tangga
masih ramp kontinu dengan animasi jalan biasa, **belum foot IK khusus anak tangga**.

Pemeriksaan pembaruan: 321 unit test / 29 file, TypeScript, lint dan build Pages
lulus. Screenshot spawn dan kamar anak diperiksa pada desktop/HP, termasuk
framing kamera sempit. Sepuluh kasus browser desktop/HP tercakup: tur/denah, drag dan gerak, pelepasan
input, posisi avatar terhadap motor, naik-turun tangga, kamera Ikuti/Mata dan
kegagalan model. Putaran pertama: tujuh lulus, dua assertion visibilitas terlalu
dini (sebelum render berikutnya), dan satu timeout tangga HP saat tinggi 2,96 m.
Assertion kini menunggu frame, budget tangga software diperpanjang tanpa mengubah
kecepatan game. Pemeriksaan ulang empat kasus kamera/tangga lulus pada desktop/HP.
Build produksi `/Hea/house/` juga direview ulang: spawn dan kamar anak pada kedua
viewport, model terlihat dan tidak ada page error. Ini bukan jaminan bebas bug
atau penerimaan estetika pengguna.

## Pemeriksaan interior awal (sebelum stickman)

- Unit suite: 318 tes / 28 file lulus, termasuk lima tes layout baru untuk dua
  lantai, seluruh jalur naik/turun tangga, void/outer shell, collision per lantai,
  sliding dan substep melalui partisi tipis.
- Enam pemeriksaan browser desktop/mobile: lima lulus langsung dan tes tangga
  desktop lulus setelah retry (timeout software WebGL dijelaskan di bawah).
- Browser desktop dan mobile: tur kelima ruangan, denah dua lantai, navigasi dari
  denah, startup terpisah tanpa arena, drag look, berjalan, pelepasan input,
  dialog bantuan dan tidak ada overflow horizontal.
- Tes tangga desktop memiliki satu timeout rasterisasi software; retry lulus,
  dan pengujian tangga mobile lulus. Diagnosis menunjukkan kamera masih bergerak
  dengan collision yang valid, bukan tertahan collider. Test navigasi desktop
  memakai viewport 800 × 450 agar software WebGL lebih ringan; uji UI desktop
  lainnya tetap menggunakan viewport standar. Ini bukan pengukuran FPS HP nyata.
- Jalur kamera aktual menuju bordes dan naik/turun tangga diuji melalui kontrol
  WASD serta drag look, bukan hanya mengecek angka lantai tur.
- Review screenshot lima ruangan dan denah pada desktop/HP disimpan di cache.
  Living, kamar orang tua, dapur, kamar anak, reading nook, dan denah diperiksa.
  Ulasan gambar adalah pemeriksaan visual sampel, bukan penerimaan estetika
  oleh pengguna atau jaminan bebas bug.
- Build produksi juga dibuka pada prefix `/Hea/house/`: snapshot desktop dan
  mobile tanpa page error, serta seluruh entry asset ditemukan. Snapshot final
  living mobile, kamar anak dan reading nook desktop dibuka/diperiksa lagi.
- TypeScript, lint, format dan build Pages diperiksa sebelum publikasi.

Artefak review tetap di `.cache/house-review/`, tidak dipublikasikan sebagai aset
produksi. `node --experimental-strip-types scripts/review-house.mjs` mengambil
ulang snapshot dengan dev server aktif di port 5173.
