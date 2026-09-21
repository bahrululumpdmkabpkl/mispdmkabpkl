# Agenda Harian

Aplikasi web sederhana untuk mencatat agenda berdasarkan tanggal, pemakai, dan acara.

## Fitur

- Tambah agenda
- Edit agenda
- Hapus agenda
- Pencarian agenda
- Penyimpanan otomatis di `localStorage`
- Tampilan responsif untuk desktop dan ponsel

## Menjalankan

Buka `index.html` langsung di browser. Tidak membutuhkan instalasi atau server tambahan.

## Membuka dari mana saja

Folder ini sudah dilengkapi workflow GitHub Pages di `.github/workflows/deploy.yml`.

1. Buat repository baru di GitHub.
2. Upload seluruh isi folder ini ke branch `main`.
3. Buka tab **Actions** dan tunggu workflow **Deploy Agenda Harian** selesai.
4. Buka **Settings > Pages**, lalu pilih deployment dari **GitHub Actions**.

Setelah berhasil, GitHub akan menyediakan URL publik untuk aplikasi. Data saat ini disimpan di `localStorage`, sehingga data tersimpan per browser dan belum dibagikan antar perangkat.
