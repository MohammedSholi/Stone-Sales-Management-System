<?php
/**
 * SSMS Backend Configuration
 * Database and application settings
 */

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'ssms');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Application Settings
define('BASE_URL', 'http://localhost/ssms-backend/public');
define('API_BASE_URL', BASE_URL . '/api');
define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('UPLOAD_URL', BASE_URL . '/uploads/');
define('LOGS_DIR', __DIR__ . '/../logs/');

// Debug Mode (set to false in production)
define('DEBUG_MODE', true);

// File Upload Settings
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB
define('ALLOWED_IMAGE_TYPES', ['image/jpeg', 'image/png', 'image/webp']);
define('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'webp']);

// Pagination
define('DEFAULT_PAGE_SIZE', 12);
define('MAX_PAGE_SIZE', 100);

// Session Settings
define('SESSION_LIFETIME', 86400); // 24 hours

// Error Reporting
// NOTE: display_errors is controlled by the router (public/index.php).
// Do NOT override it here — setting it to 1 can break JSON responses
// by injecting stray HTML error output.
// error_reporting(E_ALL);
// ini_set('display_errors', 1);

// Timezone
date_default_timezone_set('Asia/Riyadh');

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
