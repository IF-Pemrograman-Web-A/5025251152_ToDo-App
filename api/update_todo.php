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

    $title = trim($input['title'] ?? '');
    $description = trim($input['description'] ?? '');
    
    $dueDateProvided = array_key_exists('due_date', $input);
    $dueDate = $input['due_date'] ?? null;

    if ($dueDateProvided && $dueDate !== null) {
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

    
    $imagePathProvided = array_key_exists('image_path', $input);
    $imagePath = $input['image_path'] ?? null;

    if ($imagePathProvided && $imagePath !== null) {
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

    $completed = $input['completed'] ?? null;

    if (!$id || $title === '' || mb_strlen($title) > 255 ||
        !is_bool($completed)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Data Todo tidak valid'
        ]);
        exit;
    }

    $userId = 1;

    $stmt = $pdo->prepare("
        UPDATE todos
        SET title = :title,
            description = :description,
            is_completed = :completed,
            image_path = CASE
                WHEN :change_image = 1 THEN :image_path
                ELSE image_path
            END,
            due_date = CASE
                WHEN :change_due_date = 1 THEN :due_date
                ELSE due_date
            END,
            is_notified = CASE
                WHEN :change_due_date_status = 1 THEN 0
                WHEN :change_notified = 1 THEN :is_notified
                ELSE is_notified
            END
        WHERE id = :id
        AND user_id = :user_id
        AND task_type = 'personal'
    ");

    
    $stmt->execute([
    'title' => $title,
    'description' => $description,
    'completed' => $completed ? 1 : 0,
    'change_image' => $imagePathProvided ? 1 : 0,
    'image_path' => $imagePath,
    'change_due_date' => $dueDateProvided ? 1 : 0,
    'change_due_date_status' => $dueDateProvided ? 1 : 0,
    'due_date' => $dueDate,
    'change_notified' => array_key_exists('is_notified', $input) ? 1 : 0,
    'is_notified' => !empty($input['is_notified']) ? 1 : 0,
    'id' => $id,
    'user_id' => $userId
    ]);


    echo json_encode([
        'success' => true,
        'affected_rows' => $stmt->rowCount(),
        'message' => 'Permintaan Update diproses'
    ]);

} catch (PDOException $e) {
    error_log($e->getMessage());

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Gagal memperbarui Todo'
    ]);
}
