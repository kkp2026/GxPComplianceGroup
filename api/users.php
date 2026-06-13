<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth_helper.php';
apply_cors();

$current = require_auth();
require_admin($current);

$conn = db_connect();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $result = $conn->query('SELECT uid, username, role FROM users ORDER BY uid ASC');
    $users = [];
    while ($row = $result->fetch_assoc()) $users[] = $row;
    send_json(['ok' => true, 'users' => $users]);
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $username = trim($input['username'] ?? '');
    $password = $input['password'] ?? '';
    $role = $input['role'] ?? 'user';

    if ($username === '' || $password === '') {
        send_json(['ok' => false, 'error' => 'Username and password required.'], 400);
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);

    $stmt = $conn->prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)');
    $stmt->bind_param('sss', $username, $hash, $role);

    if (!$stmt->execute()) {
        if ($conn->errno === 1062) { // duplicate key
            send_json(['ok' => false, 'error' => 'Username already exists.'], 400);
        }
        send_json(['ok' => false, 'error' => 'Failed to create user.'], 500);
    }

    $uid = $stmt->insert_id;
    send_json(['ok' => true, 'user' => ['uid' => $uid, 'username' => $username, 'role' => $role]], 201);
}

send_json(['ok' => false, 'error' => 'Method not allowed.'], 405);
