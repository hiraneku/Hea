# Proses Rilis

HEA memakai [Semantic Versioning](https://semver.org/lang/id/): **MAJOR** untuk perubahan
yang mematahkan kompatibilitas (mis. format simpanan pengaturan), **MINOR** untuk fitur
baru yang kompatibel, **PATCH** untuk perbaikan. Setiap rilis harus bisa dilacak kembali
ke commit, tag, dan entri changelog yang sama.

## Langkah rilis

1. Pastikan gerbang kualitas lokal hijau di `main`: format, lint, unit test
   ber-coverage, build, dan suite Playwright (lihat `docs/DEVELOPMENT.md`).
2. Pindahkan bagian `## [Unreleased]` di [CHANGELOG.md](../CHANGELOG.md) menjadi
   `## [x.y.z] — <tanggal>`, lalu buat lagi bagian `[Unreleased]` kosong di atasnya.
3. Naikkan versi di `package.json` **dan** `package-lock.json` sekaligus:
   ```bash
   npm version x.y.z --no-git-tag-version
   ```
   Samakan juga label versi di footer menu (`src/main.ts`, teks `WEB PROTOTYPE — Vx.y`).
4. Commit: `chore(release): v x.y.z`, lalu push ke `main`.
5. Buat dan push tag anotasi — **tag adalah sumber kebenaran rilis**:
   ```bash
   git tag -a vx.y.z -m "HEA v x.y.z"
   git push origin vx.y.z
   ```
6. Buat GitHub Release dari tag itu secara manual dan lampirkan build-nya:
   ```bash
   npm run build
   cd dist && zip -r ../hea-arcane-arena-vx.y.z.zip . && cd ..
   gh release create vx.y.z hea-arcane-arena-vx.y.z.zip --verify-tag --title "HEA vx.y.z"
   ```
   Isi bagian `[x.y.z]` di CHANGELOG adalah sumber catatan rilisnya.
7. Verifikasi situs Pages memuat versi baru.

## Konvensi commit

Satu komitmen per perubahan yang utuh, dengan awalan konvensional (`feat:`, `fix:`,
`refactor:`, `ci:`, `tooling:`, `docs:`, `test:`, `chore(release):`) agar riwayat bisa
dibaca sebagai daftar perubahan dan regresi bisa di-_bisect_. Jangan mencampur build
hasil generate ke commit sumber — tidak ada artefak build yang di-commit di repo ini.
