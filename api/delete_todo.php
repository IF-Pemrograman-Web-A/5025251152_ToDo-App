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

try {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!is_array($input)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Format JSON tidak valid'
        ]);
        exit;
    }

    $id = filter_var(
        $input['id'] ?? null,
        FILTER_VALIDATE_INT,
        ['options' => ['min_range' => 1]]
    );

    if (!$id) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'ID Todo tidak valid'
        ]);
        exit;
    }

    $userId = 1;

    $stmt = $pdo->prepare("
        DELETE FROM todos
        WHERE id = :id
        AND user_id = :user_id
        AND task_type = 'personal'
    ");

    $stmt->execute([
        'id' => $id,
        'user_id' => $userId
    ]);

    $deleted = $stmt->rowCount();

    if ($deleted === 0) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Todo tidak ditemukan'
        ]);
        exit;
    }

    echo json_encode([
        'success' => true,
        'deleted_rows' => $deleted,
        'message' => 'Todo berhasil dihapus'
    ]);

} catch (PDOException $e) {
    error_log($e->getMessage());

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Gagal menghapus Todo'
    ]);
}
