<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
require __DIR__ . '/../includes/config.php';

function reply($status, $data) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}
function invalid($message) {
    throw new InvalidArgumentException($message);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') reply(405, ['success'=>false,'message'=>'Metode tidak diizinkan.']);

try {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) invalid('Format JSON tidak valid.');
    $key = $input['operation_key'] ?? '';
    $action = $input['action'] ?? '';
    $todo = $input['todo'] ?? null;
    if (!is_string($key) || !preg_match('/^[a-f0-9-]{36}$/i', $key)) invalid('ID operasi tidak valid.');
    if (!in_array($action, ['create','update','delete'], true) || !is_array($todo)) invalid('Operasi tidak valid.');
    $userId = 1;
    $pdo->beginTransaction();
    $stmt = $pdo->prepare('INSERT INTO todo_sync_operations (operation_key,user_id) VALUES (?,?) ON DUPLICATE KEY UPDATE operation_key=VALUES(operation_key)');
    $stmt->execute([$key,$userId]);
    $stmt = $pdo->prepare('SELECT user_id,result_json FROM todo_sync_operations WHERE operation_key=? FOR UPDATE');
    $stmt->execute([$key]);
    $previous = $stmt->fetch();
    if ((int)$previous['user_id'] !== $userId) invalid('Operasi bukan milik pengguna ini.');
    if ($previous['result_json'] !== null) {
        $result = json_decode($previous['result_json'], true);
        $pdo->commit();
        reply(200,$result);
    }

    if ($action !== 'create') {
        $id = filter_var($todo['id'] ?? null,FILTER_VALIDATE_INT,['options'=>['min_range'=>1]]);
        if (!$id) invalid('ID tugas belum tersinkron atau tidak valid.');
        $stmt = $pdo->prepare('SELECT user_id,task_type FROM todos WHERE id=? FOR UPDATE');
        $stmt->execute([$id]);
        $existing = $stmt->fetch();
        if ($existing && ((int)$existing['user_id'] !== $userId || $existing['task_type'] !== 'personal')) {
            invalid('Tugas ini tidak dapat diubah oleh pengguna ini.');
        }
        if (!$existing && $action === 'update') invalid('Tugas sudah tidak tersedia di server.');
    }
    if ($action !== 'delete') {
        $title = $todo['title'] ?? '';
        $description = $todo['description'] ?? '';
        $taskType = $todo['task_type'] ?? 'personal';
        $completed = $todo['completed'] ?? false;
        $notified = $todo['is_notified'] ?? false;
        if (!is_string($title) || trim($title)==='' || mb_strlen(trim($title))>255) invalid('Judul wajib diisi, maksimal 255 karakter.');
        if (!is_string($description) || !is_bool($completed) || !is_bool($notified)) invalid('Isi tugas tidak valid.');
        if (!in_array($taskType,['personal','shared'],true)) invalid('Jenis tugas tidak valid.');
        $due = $todo['due_date'] ?? null;
        if ($due !== null) {
            if (!is_string($due) || !preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/',$due)) invalid('Format waktu tidak valid.');
            $date = DateTimeImmutable::createFromFormat('!Y-m-d H:i:s',$due);
            if (!$date || $date->format('Y-m-d H:i:s') !== $due) invalid('Tanggal tidak valid.');
        }
        $image = $todo['image_path'] ?? null;
        if ($image !== null && (!is_string($image) || !preg_match('/^uploads\/[a-f0-9]{32}\.(jpg|png|webp)$/',$image) || !is_file(__DIR__.'/../'.$image))) invalid('Lokasi foto tidak valid.');
    }

    if ($action === 'create') {
        $stmt = $pdo->prepare('INSERT INTO todos (user_id,title,description,is_completed,task_type,image_path,due_date,is_notified) VALUES (?,?,?,?,?,?,?,?)');
        $stmt->execute([$userId,trim($title),$description,$completed?1:0,$taskType,$image,$due,$notified?1:0]);
        $id = (int)$pdo->lastInsertId();
        if ($taskType === 'shared') {
            $stmt = $pdo->prepare('INSERT INTO todo_shares (todo_id,user_id) VALUES (?,?)');
            $stmt->execute([$id,2]);
        }
    } elseif ($action === 'update') {
        $changedDue = !empty($todo['change_due_date']);
        $stmt = $pdo->prepare('UPDATE todos SET title=?,description=?,is_completed=?,image_path=?,due_date=CASE WHEN ?=1 THEN ? ELSE due_date END,is_notified=? WHERE id=? AND user_id=? AND task_type=\'personal\'');
        $stmt->execute([trim($title),$description,$completed?1:0,$image,$changedDue?1:0,$due,$changedDue?0:($notified?1:0),$id,$userId]);
    } else {
        $stmt = $pdo->prepare('DELETE FROM todos WHERE id=? AND user_id=? AND task_type=\'personal\'');
        $stmt->execute([$id,$userId]);
    }
    $result = ['success'=>true,'id'=>$id,'action'=>$action];
    $stmt = $pdo->prepare('UPDATE todo_sync_operations SET result_json=? WHERE operation_key=?');
    $stmt->execute([json_encode($result),$key]);
    $pdo->commit();
    reply(200,$result);
} catch (InvalidArgumentException $error) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    reply(400,['success'=>false,'message'=>$error->getMessage()]);
} catch (Throwable $error) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log($error->getMessage());
    reply(500,['success'=>false,'message'=>'Sinkronisasi gagal. Periksa MySQL dan pastikan offline-sync.sql sudah dijalankan.']);
}
