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

    $title = trim($input['title'] ?? '');
    $description = trim($input['description'] ?? '');
    $taskType = $input['task_type'] ?? 'personal';
    if (!in_array($taskType, ['personal', 'shared'], true)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Jenis Todo tidak valid']);
        exit;
    }

    $dueDate = $input['due_date'] ?? null;

if ($dueDate !== null) {
    if (
        !is_string($dueDate) ||
        !preg_match(
            '/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/',
            $dueDate
        )
    ) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Format tanggal reminder tidak valid'
        ]);
        exit;
    }

    $date = DateTimeImmutable::createFromFormat(
        '!Y-m-d H:i:s',
        $dueDate
    );

    if (!$date || $date->format('Y-m-d H:i:s') !== $dueDate) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Tanggal reminder tidak valid'
        ]);
        exit;
    }
}

    $imagePath = $input['image_path'] ?? null;

    if ($imagePath !== null) {
        if (
            !is_string($imagePath) ||
            !preg_match('/^uploads\/[a-f0-9]{32}\.(jpg|png|webp)$/', $imagePath) ||
            !is_file(__DIR__ . '/../' . $imagePath)
        ) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Lokasi foto tidak valid'
            ]);
            exit;
        }
    }

    if ($title === '' || mb_strlen($title) > 255) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Judul wajib diisi (maksimal 255 karakter)'
        ]);
        exit;
    }

    $userId = 1;

    
    $pdo->beginTransaction();
    $stmt = $pdo->prepare("
        INSERT INTO todos (
            user_id,
            title,
            description,
            is_completed,
            task_type,
            image_path,
            due_date
        )
        VALUES (
            :user_id,
            :title,
            :description,
            0,
            :task_type,
            :image_path,
            :due_date
        )
    ");

    $stmt->execute([
    'user_id' => $userId,
    'title' => $title,
    'description' => $description,
    'task_type' => $taskType,
    'image_path' => $imagePath,
    'due_date' => $dueDate
    ]);

    $newTodoId = (int) $pdo->lastInsertId();
    // Demo lokal: tugas Shared milik Budi (1) dibagikan ke Andi (2).
    if ($taskType === 'shared') {
        $shareStmt = $pdo->prepare("INSERT INTO todo_shares (todo_id, user_id) VALUES (:todo_id, :user_id)");
        $shareStmt->execute(['todo_id' => $newTodoId, 'user_id' => 2]);
    }
    $pdo->commit();

    http_response_code(201);

    echo json_encode([
        'success' => true,
        'id' => $newTodoId,
        'message' => 'Todo berhasil ditambahkan'
    ]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Gagal menyimpan Todo'
    ]);
}
