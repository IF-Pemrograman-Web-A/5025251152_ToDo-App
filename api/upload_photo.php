<?php
header('Content-Type: application/json; charset=utf-8');

require __DIR__ . '/../includes/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Metode tidak diizinkan'
    ]);
    exit;
}

if (!isset($_FILES['photo']) ||
    $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'File foto tidak valid'
    ]);
    exit;
}

$file = $_FILES['photo'];

if ($file['size'] > 5 * 1024 * 1024) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Ukuran foto maksimal 5 MB'
    ]);
    exit;
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($file['tmp_name']);

$allowedTypes = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp'
];

if (!isset($allowedTypes[$mime])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Format foto tidak didukung'
    ]);
    exit;
}

$extension = $allowedTypes[$mime];
$filename = bin2hex(random_bytes(16)) . '.' . $extension;

$uploadDir = __DIR__ . '/../uploads/';
$destination = $uploadDir . $filename;

if (!move_uploaded_file($file['tmp_name'], $destination)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Gagal menyimpan foto'
    ]);
    exit;
}

echo json_encode([
    'success' => true,
    'image_path' => 'uploads/' . $filename
]);
