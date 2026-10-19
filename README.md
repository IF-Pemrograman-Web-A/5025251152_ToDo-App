# [E03] The Iron Citadel - ToDo App

## Identitas
- Nama : Dewa Ngakan Putu Sunyananda Triyanca
- NRP : 5025251152
- Kelas : Pemrograman Web (A)

## Deskripsi
Pengembangan aplikasi ToDo List E03 menjadi E04 dengan PHP dan MariaDB/MySQL. Penyimpanan utama tugas dipindahkan dari IndexedDB browser ke database relasional. Aplikasi mempertahankan desain antarmuka E03 dan menambahkan navigasi Personal dan Shared, pemisahan kode PHP, serta operasi CRUD melalui API PHP.

### Fitur Utama
#### 1. Personal ToDo
- Menambahkan, melihat, mengedit, menandai selesai/belum selesai, dan menghapus tugas.
- Perubahan disimpan di database dan tetap tersedia setelah halaman dimuat ulang.
- Judul, deskripsi, status penyelesaian, waktu pengingat, dan referensi foto tersimpan pada tabel `todos`.

#### 2. Shared ToDo
- Memisahkan tampilan tugas bersama dari tugas pribadi melalui menu **Shared**.
- Menambahkan dan melihat tugas bersama.
- Tugas Shared disimpan dengan `task_type = 'shared'`, sedangkan relasi pengguna tersimpan pada tabel `todo_shares`.

### 3. PHP Modular dan Database
- Antarmuka utama pada `index.php` dengan komponen terpisah di folder `includes/`.
- Endpoint PHP pada folder `api/` untuk membaca, membuat, memperbarui, dan menghapus Todo.
- Koneksi database menggunakan PDO dan prepared statements.
- Struktur database dan data contoh disertakan pada `data.sql`.

### 4. Fitur E03 yang Dipertahankan
- Tema terang/gelap, dengan preferensi disimpan melalui `localStorage`.
- Pengaturan jadwal reminder yang disimpan ke kolom `due_date`.
- Upload foto dari perangkat atau kamera, pratinjau, dan penyimpanan file di folder `uploads/`.
- Tampilan responsif dan dukungan aksesibilitas dasar.

## Preview
### 1. Desktop Preview
<img width="1535" height="693" alt="image" src="https://github.com/user-attachments/assets/dc369c96-28b4-4cd0-a1f4-10f92fdd5edd" />
<img width="1535" height="692" alt="image" src="https://github.com/user-attachments/assets/a002e2f2-875f-41d0-8b1c-f6388d2bfe00" />



### 2. Mobile Preview
<img width="753" height="693" alt="image" src="https://github.com/user-attachments/assets/44633aa6-8cb5-426b-8785-f7cab4fd8847" />
<img width="750" height="692" alt="image" src="https://github.com/user-attachments/assets/93193e9d-919a-4e6a-806e-d4a134021d5f" />



