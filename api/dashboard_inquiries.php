<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth_helper.php';
apply_cors();

require_auth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_json(['ok' => false, 'error' => 'Method not allowed.'], 405);
}

$conn = db_connect();
$result = $conn->query('SELECT * FROM inquiries ORDER BY custid DESC');
$inquiries = [];
while ($row = $result->fetch_assoc()) {
    $inquiries[] = $row;
}
$conn->close();

send_json(['ok' => true, 'inquiries' => $inquiries]);
