<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth_helper.php';
apply_cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['ok' => false, 'error' => 'Method not allowed.'], 405);
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$username = trim($input['username'] ?? '');
$password = $input['password'] ?? '';

if ($username === '' || $password === '') {
    send_json(['ok' => false, 'error' => 'Username and password are required.'], 400);
}

$conn = db_connect();
$stmt = $conn->prepare('SELECT uid, username, password_hash, role FROM users WHERE username = ?');
$stmt->bind_param('s', $username);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
$stmt->close();
$conn->close();

if (!$user || !password_verify($password, $user['password_hash'])) {
    send_json(['ok' => false, 'error' => 'Invalid username or password.'], 401);
}

$token = create_token([
    'uid' => $user['uid'],
    'username' => $user['username'],
    'role' => $user['role'],
]);

send_json([
    'ok' => true,
    'token' => $token,
    'user' => ['username' => $user['username'], 'role' => $user['role']],
]);
