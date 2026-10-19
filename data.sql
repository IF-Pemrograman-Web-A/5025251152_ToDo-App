-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3307
-- Waktu pembuatan: 19 Okt 2026 pada 12.56
-- Versi server: 10.4.32-MariaDB
-- Versi PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `todoapp`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `todos`
--

CREATE TABLE `todos` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `is_completed` tinyint(1) NOT NULL DEFAULT 0,
  `due_date` datetime DEFAULT NULL,
  `task_type` enum('personal','shared') NOT NULL DEFAULT 'personal',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_notified` tinyint(1) NOT NULL DEFAULT 0,
  `image_path` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `todos`
--

INSERT INTO `todos` (`id`, `user_id`, `title`, `description`, `is_completed`, `due_date`, `task_type`, `created_at`, `is_notified`, `image_path`) VALUES
(1, 1, 'Belajar PWEB', 'Belajar membuat aplikasi to-do', 0, NULL, 'personal', '2026-10-19 09:17:39', 0, NULL),
(2, 2, 'Belanja Bulanan', 'Membeli ayam 2 ekor dan minyak goreng 1L', 0, NULL, 'personal', '2026-10-19 09:18:45', 0, NULL),
(3, 1, 'Project Web', 'Menyelesaikan project akhir web', 0, NULL, 'shared', '2026-10-19 09:19:48', 0, NULL),
(5, 1, 'Testing Update dengan Foto', 'Foto lama harus tetap tersimpan', 0, NULL, 'personal', '2026-10-19 10:28:56', 0, 'uploads/4f0a956e89d79226d981ee60ba704766.png'),
(6, 1, 'Testing Todo dengan Reminder', 'Pengujian penyimpanan due_date melalui PHP', 0, '2026-10-25 14:30:00', 'personal', '2026-10-19 10:39:04', 0, NULL);

-- --------------------------------------------------------

--
-- Struktur dari tabel `todo_shares`
--

CREATE TABLE `todo_shares` (
  `id` int(11) NOT NULL,
  `todo_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `todo_shares`
--

INSERT INTO `todo_shares` (`id`, `todo_id`, `user_id`) VALUES
(1, 3, 2);

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`id`, `username`, `password_hash`) VALUES
(1, 'budi', '$2y$10$SC9ZopnpzAhn4RD72CiiOeZ/tuhoV47iRSbgOMVk8j4I/SfCTviwG'),
(2, 'andi', '$2y$10$FEU87sPcViZPrOUiwabfQeaU5PrpWhFH0wp03FPD1wc8OOneKVqJi');

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `todos`
--
ALTER TABLE `todos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_todos_users` (`user_id`);

--
-- Indeks untuk tabel `todo_shares`
--
ALTER TABLE `todo_shares`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_todo_user` (`todo_id`,`user_id`),
  ADD KEY `fk_shares_users` (`user_id`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `todos`
--
ALTER TABLE `todos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT untuk tabel `todo_shares`
--
ALTER TABLE `todo_shares`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `todos`
--
ALTER TABLE `todos`
  ADD CONSTRAINT `fk_todos_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `todo_shares`
--
ALTER TABLE `todo_shares`
  ADD CONSTRAINT `fk_shares_todos` FOREIGN KEY (`todo_id`) REFERENCES `todos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_shares_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
