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

Setelah berhasil, GitHub akan menyediakan URL publik untuk aplikasi.

## Sinkronisasi semua pengguna

Integrasi Supabase sudah disiapkan melalui `supabase-config.js` dan `supabase-schema.sql`.

1. Buat project baru di Supabase.
2. Buka **SQL Editor**, jalankan seluruh isi `supabase-schema.sql`.
3. Buka **Project Settings > API**, salin **Project URL** dan **anon public key** ke `supabase-config.js`.
4. Upload `supabase-config.js`, `app.js`, dan `index.html` terbaru ke repository GitHub.

Setelah deployment selesai, semua pengguna memakai data dari tabel Supabase yang sama. Perubahan akan terlihat setelah halaman dimuat ulang; `localStorage` hanya digunakan sebagai fallback sebelum konfigurasi Supabase diisi.
