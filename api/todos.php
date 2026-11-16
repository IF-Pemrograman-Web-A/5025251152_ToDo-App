<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require __DIR__ . '/../includes/config.php';

function respond(int $status, array $body = []): never
{
    http_response_code($status);

    if ($status !== 204) {
        echo json_encode($body, JSON_UNESCAPED_UNICODE);
    }

    exit;
}

function fail(int $status, string $code, string $message): never
{
    respond($status, [
        'success' => false,
        'error' => [
            'code' => $code,
            'message' => $message
        ]
    ]);
}

function readJsonBody(): array
{
    try {
        $body = json_decode(
            file_get_contents('php://input'),
            true,
            512,
            JSON_THROW_ON_ERROR
        );
    } catch (JsonException $error) {
        fail(400, 'invalid_json', 'Body harus berisi JSON yang valid.');
    }

    if (!is_array($body)) {
        fail(400, 'invalid_body', 'Body JSON harus berupa object.');
    }

    return $body;
}

function getTodoId(): int
{
    $id = filter_var(
        $_GET['id'] ?? null,
        FILTER_VALIDATE_INT,
        ['options' => ['min_range' => 1]]
    );

    if (!$id) {
        fail(400, 'invalid_id', 'id harus berupa bilangan bulat positif.');
    }

    return (int) $id;
}

function validateDueDate(mixed $value): ?string
{
    if ($value === null || $value === '') {
        return null;
    }

    if (
        !is_string($value) ||
        !preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $value)
    ) {
        fail(400, 'invalid_due_date', 'Format due_date harus YYYY-MM-DD HH:MM:SS atau null.');
    }

    $date = DateTimeImmutable::createFromFormat('!Y-m-d H:i:s', $value);

    if (!$date || $date->format('Y-m-d H:i:s') !== $value) {
        fail(400, 'invalid_due_date', 'Tanggal due_date tidak valid.');
    }

    return $value;
}

function findVisibleTodo(PDO $pdo, int $id, int $userId): ?array
{
    $statement = $pdo->prepare("
        SELECT DISTINCT
            t.id, t.title, t.description, t.is_completed,
            t.due_date, t.is_notified, t.image_path, t.task_type, t.user_id
        FROM todos t
        LEFT JOIN todo_shares s ON s.todo_id = t.id
        WHERE t.id = :id
        AND (
            (t.task_type = 'personal' AND t.user_id = :owner_id)
            OR
            (t.task_type = 'shared' AND
                (t.user_id = :shared_owner_id OR s.user_id = :shared_user_id))
        )
    ");

    $statement->execute([
        'id' => $id,
        'owner_id' => $userId,
        'shared_owner_id' => $userId,
        'shared_user_id' => $userId
    ]);

    return $statement->fetch() ?: null;
}

function validateImagePath(mixed $imagePath): ?string
{
    if ($imagePath === null || $imagePath === '') {
        return null;
    }

    if (
        !is_string($imagePath) ||
        !preg_match('/^uploads\/[a-f0-9]{32}\.(jpg|png|webp)$/', $imagePath) ||
        !is_file(__DIR__ . '/../' . $imagePath)
    ) {
        fail(400, 'invalid_image_path', 'image_path tidak valid atau file tidak ditemukan.');
    }

    return $imagePath;
}

$userId = 1;
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($method === 'GET') {
        if (isset($_GET['id'])) {
            $todo = findVisibleTodo($pdo, getTodoId(), $userId);

            if (!$todo) {
                fail(404, 'todo_not_found', 'Tugas tidak ditemukan.');
            }

            unset($todo['user_id']);
            respond(200, ['success' => true, 'data' => $todo]);
        }

        $type = $_GET['type'] ?? 'personal';

        if (!in_array($type, ['personal', 'shared'], true)) {
            fail(400, 'invalid_type', 'type harus personal atau shared.');
        }

        if ($type === 'shared') {
            $statement = $pdo->prepare("
                SELECT DISTINCT
                    t.id, t.title, t.description, t.is_completed,
                    t.due_date, t.is_notified, t.image_path, t.task_type
                FROM todos t
                LEFT JOIN todo_shares s ON s.todo_id = t.id
                WHERE t.task_type = 'shared'
                AND (t.user_id = :owner_id OR s.user_id = :shared_user_id)
                ORDER BY t.id DESC
            ");

            $statement->execute([
                'owner_id' => $userId,
                'shared_user_id' => $userId
            ]);
        } else {
            $statement = $pdo->prepare("
                SELECT
                    id, title, description, is_completed,
                    due_date, is_notified, image_path, task_type
                FROM todos
                WHERE user_id = :user_id
                AND task_type = 'personal'
                ORDER BY id DESC
            ");

            $statement->execute(['user_id' => $userId]);
        }

        respond(200, [
            'success' => true,
            'data' => $statement->fetchAll()
        ]);
    }

    if ($method === 'POST') {
        $body = readJsonBody();
        $title = trim(is_string($body['title'] ?? null) ? $body['title'] : '');
        $description = $body['description'] ?? '';
        $type = $body['task_type'] ?? 'personal';

        if ($title === '') {
            fail(400, 'title_required', 'title wajib diisi.');
        }

        if (mb_strlen($title) > 255) {
            fail(400, 'title_too_long', 'title maksimal 255 karakter.');
        }

        if (!is_string($description)) {
            fail(400, 'invalid_description', 'description harus berupa teks.');
        }

        if (!in_array($type, ['personal', 'shared'], true)) {
            fail(400, 'invalid_type', 'task_type harus personal atau shared.');
        }

        $dueDate = validateDueDate($body['due_date'] ?? null);
        $imagePath = validateImagePath($body['image_path'] ?? null);

        $pdo->beginTransaction();

        $statement = $pdo->prepare("
            INSERT INTO todos (
                user_id, title, description, is_completed,
                task_type, image_path, due_date
            )
            VALUES (?, ?, ?, 0, ?, ?, ?)
        ");

        $statement->execute([
            $userId, $title, $description, $type, $imagePath, $dueDate
        ]);

        $id = (int) $pdo->lastInsertId();

        if ($type === 'shared') {
            $share = $pdo->prepare("
                INSERT INTO todo_shares (todo_id, user_id)
                VALUES (?, 2)
            ");
            $share->execute([$id]);
        }

        $pdo->commit();

        $created = findVisibleTodo($pdo, $id, $userId);
        unset($created['user_id']);

        header('Location: todos.php?id=' . $id);

        respond(201, [
            'success' => true,
            'data' => $created
        ]);
    }

    if ($method === 'PATCH' || $method === 'PUT') {
        $id = getTodoId();
        $body = readJsonBody();

        if (!$body) {
            fail(400, 'empty_body', 'Body pembaruan tidak boleh kosong.');
        }

        $todo = findVisibleTodo($pdo, $id, $userId);

        if (!$todo) {
            fail(404, 'todo_not_found', 'Tugas tidak ditemukan.');
        }

        if ($todo['task_type'] !== 'personal' || (int) $todo['user_id'] !== $userId) {
            fail(403, 'forbidden', 'Tugas ini tidak dapat diubah.');
        }

        $allowedFields = [
            'title', 'description', 'completed',
            'due_date', 'image_path', 'is_notified'
        ];

        if (array_diff(array_keys($body), $allowedFields)) {
            fail(400, 'unknown_fields', 'Body berisi field yang tidak dikenal.');
        }

        $title = array_key_exists('title', $body)
            ? trim(is_string($body['title']) ? $body['title'] : '')
            : $todo['title'];

        $description = $body['description'] ?? $todo['description'];
        $completed = $body['completed'] ?? ((int) $todo['is_completed'] === 1);
        $notified = $body['is_notified'] ?? ((int) $todo['is_notified'] === 1);

        if ($title === '') {
            fail(400, 'title_required', 'title tidak boleh kosong.');
        }

        if (mb_strlen($title) > 255) {
            fail(400, 'title_too_long', 'title maksimal 255 karakter.');
        }

        if (
            !is_string($description) ||
            !is_bool($completed) ||
            !is_bool($notified)
        ) {
            fail(400, 'invalid_fields', 'Tipe field tidak valid.');
        }

        $dueDate = array_key_exists('due_date', $body)
            ? validateDueDate($body['due_date'])
            : $todo['due_date'];

        $imagePath = array_key_exists('image_path', $body)
            ? validateImagePath($body['image_path'])
            : $todo['image_path'];

        $statement = $pdo->prepare("
            UPDATE todos
            SET title = ?, description = ?, is_completed = ?,
                due_date = ?, image_path = ?, is_notified = ?
            WHERE id = ? AND user_id = ? AND task_type = 'personal'
        ");

        $statement->execute([
            $title,
            $description,
            $completed ? 1 : 0,
            $dueDate,
            $imagePath,
            $notified ? 1 : 0,
            $id,
            $userId
        ]);

        $updated = findVisibleTodo($pdo, $id, $userId);
        unset($updated['user_id']);

        respond(200, ['success' => true, 'data' => $updated]);
    }

    if ($method === 'DELETE') {
        $id = getTodoId();
        $todo = findVisibleTodo($pdo, $id, $userId);

        if (!$todo) {
            fail(404, 'todo_not_found', 'Tugas tidak ditemukan.');
        }

        if ($todo['task_type'] !== 'personal' || (int) $todo['user_id'] !== $userId) {
            fail(403, 'forbidden', 'Tugas ini tidak dapat dihapus.');
        }

        $statement = $pdo->prepare("
            DELETE FROM todos
            WHERE id = ? AND user_id = ? AND task_type = 'personal'
        ");
        $statement->execute([$id, $userId]);

        respond(204);
    }

    header('Allow: GET, POST, PUT, PATCH, DELETE');
    fail(405, 'method_not_allowed', 'Metode HTTP tidak didukung.');
} catch (PDOException $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log($error->getMessage());
    fail(500, 'database_error', 'Terjadi kesalahan saat mengakses database.');
} catch (Throwable $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log($error->getMessage());
    fail(500, 'internal_error', 'Terjadi kesalahan internal.');
}