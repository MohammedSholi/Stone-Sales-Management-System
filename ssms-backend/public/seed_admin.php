<?php
/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  ADMIN SEED SCRIPT — ONE-TIME USE                       ║
 * ║  DELETE THIS FILE AFTER RUNNING!                        ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * Creates or updates the admin account with a real bcrypt hash.
 *
 * Usage (browser or curl):
 *   http://localhost/ssms-backend/public/seed_admin.php
 *
 * Default credentials after running:
 *   username: admin
 *   password: Admin123!
 */

header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';

// ── Config ──────────────────────────────────────────────
$adminUsername    = 'admin';
$adminPassword    = 'Admin123!';            // Change before production!
$adminFullName    = 'System Administrator';
$adminEmail       = 'admin@ssms.local';
$adminPhone       = '';
$adminAddress     = '';

try {
    $db = Database::getInstance()->getConnection();
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $hash = password_hash($adminPassword, PASSWORD_DEFAULT);

    // Check if an admin user already exists
    $stmt = $db->prepare("SELECT user_id, password_hash FROM users WHERE username = ?");
    $stmt->execute([$adminUsername]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        // Update password hash (handles placeholder or outdated hashes)
        $stmt = $db->prepare("
            UPDATE users 
            SET password_hash  = ?,
                full_name      = ?,
                email          = ?,
                role           = 'Admin',
                account_status = 'Active'
            WHERE user_id = ?
        ");
        $stmt->execute([$hash, $adminFullName, $adminEmail, $existing['user_id']]);

        echo json_encode([
            'success' => true,
            'action'  => 'updated',
            'message' => "Admin user (user_id={$existing['user_id']}) password and profile updated.",
            'credentials' => [
                'username' => $adminUsername,
                'password' => $adminPassword
            ],
            'warning' => '⚠️  DELETE THIS FILE NOW: seed_admin.php'
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    } else {
        // Create new admin user
        $db->beginTransaction();

        $stmt = $db->prepare("
            INSERT INTO users (username, password_hash, full_name, phone, address, email, role, account_status)
            VALUES (?, ?, ?, ?, ?, ?, 'Admin', 'Active')
        ");
        $stmt->execute([$adminUsername, $hash, $adminFullName, $adminPhone, $adminAddress, $adminEmail]);
        $userId = $db->lastInsertId();

        $db->commit();

        echo json_encode([
            'success' => true,
            'action'  => 'created',
            'message' => "Admin user created with user_id={$userId}.",
            'credentials' => [
                'username' => $adminUsername,
                'password' => $adminPassword
            ],
            'warning' => '⚠️  DELETE THIS FILE NOW: seed_admin.php'
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
