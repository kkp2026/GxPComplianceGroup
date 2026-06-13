<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth_helper.php';
apply_cors();

$current = require_auth();
require_admin($current);

$uid = isset($_GET['uid']) ? intval($_GET['uid']) : 0;
if (!$uid) send_json(['ok' => false, 'error' => 'uid is required.'], 400);

$conn = db_connect();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'PATCH') {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $password = $input['password'] ?? null;
    $role = $input['role'] ?? null;

    $fields = [];
    $types = '';
    $values = [];

    if ($password) {
        $fields[] = 'password_hash = ?';
        $types .= 's';
        $values[] = password_hash($password, PASSWORD_BCRYPT);
    }
    if ($role) {
        $fields[] = 'role = ?';
        $types .= 's';
        $values[] = $role;
    }

    if (empty($fields)) {
        send_json(['ok' => false, 'error' => 'Nothing to update.'], 400);
    }

    $sql = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE uid = ?';
    $types .= 'i';
    $values[] = $uid;

    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$values);
    $stmt->execute();

    $check = $conn->prepare('SELECT uid, username, role FROM users WHERE uid = ?');
    $check->bind_param('i', $uid);
    $check->execute();
    $user = $check->get_result()->fetch_assoc();

    if (!$user) send_json(['ok' => false, 'error' => 'User not found.'], 404);
    send_json(['ok' => true, 'user' => $user]);
}

if ($method === 'DELETE') {
    $stmt = $conn->prepare('DELETE FROM users WHERE uid = ?');
    $stmt->bind_param('i', $uid);
    $stmt->execute();

    if ($stmt->affected_rows === 0) {
        send_json(['ok' => false, 'error' => 'User not found.'], 404);
    }
    send_json(['ok' => true]);
}

send_json(['ok' => false, 'error' => 'Method not allowed.'], 405);
