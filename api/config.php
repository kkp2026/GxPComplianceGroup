<?php
/**
 * Database configuration
 * --------------------------------------------------------------
 * Fill in the values below with the MySQL database credentials
 * from your Hostinger hPanel → Databases → MySQL Databases.
 *
 * DB_HOST is almost always "localhost" on Hostinger shared hosting.
 * DB_NAME / DB_USER are typically prefixed, e.g. u123456789_gxp
 * --------------------------------------------------------------
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'u123456789_gxp');
define('DB_USER', 'u123456789_gxpuser');
define('DB_PASS', 'CHANGE_ME');

// Secret key used to sign login session tokens. Change this to a long
// random string before going live.
define('JWT_SECRET', 'CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_STRING');

// Allowed origin for CORS (your site's domain). Use '*' for testing only.
define('CORS_ORIGIN', '*');

function db_connect() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['ok' => false, 'error' => 'Database connection failed.']);
        exit;
    }
    $conn->set_charset('utf8mb4');
    return $conn;
}

function send_json($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function apply_cors() {
    header('Access-Control-Allow-Origin: ' . CORS_ORIGIN);
    header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}
