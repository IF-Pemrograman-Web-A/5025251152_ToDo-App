# [E05] The Offline Abyss — ToDo App

## Identitas
- Nama : Dewa Ngakan Putu Sunyananda Triyanca
- NRP : 5025251152
- Kelas : Pemrograman Web (A)

## Deskripsi
Aplikasi pengelola tugas yang dikembangkan menjadi Progressive Web App (PWA). Aplikasi dapat dipasang, dibuka tanpa jaringan setelah kunjungan awal, serta menyimpan perubahan tugas secara lokal sebelum disinkronkan ke server.

### Fitur Utama
- **Personal ToDo :** tambah, baca, edit, tandai selesai/belum selesai, dan hapus tugas.
- **Shared ToDo :** tambah dan baca tugas bersama. Edit, hapus, dan perubahan status tetap dinonaktifkan sesuai pada E04.
- **PWA :** manifest, ikon PNG 192 × 192 dan 512 × 512, serta tampilan `standalone`.
- **Tombol instalasi :** menggunakan `beforeinstallprompt`, disembunyikan sampai browser menyediakan prompt dan setelah aplikasi terpasang.
- **Offline :** precache tampilan dasar aplikasi, CSS, JavaScript, manifest, ikon, dan halaman cadangan.
- **Penyimpanan lokal :** tugas dan perubahan yang belum dikirim disimpan dalam IndexedDB.
- **Sinkronisasi :** antrean dikirim ke PHP/MySQL ketika koneksi tersedia dan aplikasi terbuka.
- **Pencegahan tugas ganda :** setiap operasi mempunyai ID unik yang dicatat di server agar pengiriman ulang tidak memproses operasi yang sama dua kali.
- **Foto tugas :** pilih foto atau ambil melalui kamera, foto baru dapat disimpan lokal sebelum diunggah saat sinkronisasi.
- **Tema dan aksesibilitas :** mode terang/gelap, label form, navigasi keyboard, serta tampilan responsif.
- **Pengingat :** menggunakan Web Notifications API, pemeriksaan jadwal berjalan ketika halaman aplikasi aktif/terbuka.

## Dokumentasi Pengerjaan
### 1. Manifest

![Manifest dan konfigurasi aplikasi](img/manifest.png)

### 2. Service Worker aktif

![Service Worker aktif pada scope E05](img/sw.png)

### 3. Cache Storage

![File app shell tersedia dalam cache](img/chache%20storage.png)

### 4. Aplikasi saat offline

![Daftar dan detail tugas saat jaringan Offline](img/offline.png)

### 5. Antrean sebelum sinkronisasi

![Operasi create tersimpan dalam outbox](img/offline%20outbox.png)

### 6. Antrean setelah sinkronisasi

![Hasil pemeriksaan antrean berupa array kosong](img/sync-offline%20complate.png)

### 7. Halaman cadangan offline

![Halaman cadangan saat navigasi tidak tersedia](img/offline%20fallback.png)

### 8. Aplikasi terpasang

![ToDo App dibuka sebagai aplikasi mandiri](img/installed%20app.png)

