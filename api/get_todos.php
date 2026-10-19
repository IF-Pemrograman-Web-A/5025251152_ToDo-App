
<?php
header('Content-Type: application/json; charset=utf-8');

require __DIR__ . '/../includes/config.php';

try {
    $userId = 1;

    $view = $_GET['type'] ?? 'personal';
    if ($view !== 'personal' && $view !== 'shared') {
        http_response_code(400);
        echo json_encode(['success'=>false,'message'=>'Tipe daftar tidak valid']);
        exit;
    }
    if ($view === 'shared') {
        $stmt = $pdo->prepare("
            SELECT DISTINCT t.id, t.title, t.description, t.is_completed,
                t.due_date, t.is_notified, t.image_path, t.task_type
            FROM todos t
            LEFT JOIN todo_shares s ON s.todo_id = t.id
            WHERE t.task_type = 'shared'
              AND (t.user_id = :owner_id OR s.user_id = :shared_id)
            ORDER BY t.id DESC
        ");
        $stmt->execute(['owner_id'=>$userId,'shared_id'=>$userId]);
    } else {
        $stmt = $pdo->prepare("
            SELECT id,title,description,is_completed,due_date,is_notified,image_path,task_type
            FROM todos WHERE user_id = :user_id AND task_type = 'personal'
            ORDER BY id DESC
        ");
        $stmt->execute(['user_id'=>$userId]);
    }

    $todos = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'todos' => $todos
    ]);
} catch (PDOException $e) {
    error_log($e->getMessage());

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Gagal mengambil data Todo'
    ]);
}
