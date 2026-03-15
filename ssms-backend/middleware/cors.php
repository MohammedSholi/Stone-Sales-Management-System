<?php
/**
 * CORS and JSON Headers Middleware
 * Must be included BEFORE any output.
 */

// ── Always send JSON content-type ──
header('Content-Type: application/json; charset=UTF-8');

// ── CORS ──
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = [
    'http://localhost',
    'http://127.0.0.1',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'http://localhost:8080',
];

if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    // For same-origin requests $origin is often empty – echo the first allowed
    header('Access-Control-Allow-Origin: http://localhost');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');

// ── Handle preflight OPTIONS immediately ──
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
