<?php
/**
 * Authentication Middleware
 */

function requireLogin() {
    if (!isset($_SESSION['user_id'])) {
        jsonUnauthorized('Please login to continue');
    }
    
    if (($_SESSION['role'] ?? '') === 'Customer' && !validateCustomerSession()) {
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_unset();
            session_destroy();
        }
        jsonUnauthorized('Your session has expired. Please login again');
    }
}

function requireRole($allowedRoles) {
    requireLogin();
    
    if (!is_array($allowedRoles)) {
        $allowedRoles = [$allowedRoles];
    }
    
    if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], $allowedRoles)) {
        jsonForbidden('You do not have permission to access this resource');
    }
}

function requireCustomer() {
    requireRole('Customer');
}

function requireEmployee() {
    requireRole(['Employee', 'Admin']);
}

function requireAdmin() {
    requireRole('Admin');
}

function getCurrentUserId() {
    return $_SESSION['user_id'] ?? null;
}

function getCurrentUserRole() {
    return $_SESSION['role'] ?? null;
}

function getSessionUser() {
    if (!isset($_SESSION['user_id'])) {
        return null;
    }
    
    return [
        'user_id' => $_SESSION['user_id'],
        'username' => $_SESSION['username'] ?? '',
        'full_name' => $_SESSION['full_name'] ?? '',
        'email' => $_SESSION['email'] ?? '',
        'role' => $_SESSION['role'] ?? '',
        'customer_id' => $_SESSION['customer_id'] ?? null,
        'employee_id' => $_SESSION['employee_id'] ?? null
    ];
}

function validateCustomerSession() {
    if (empty($_SESSION['user_id'])) {
        return false;
    }

    try {
        $db = Database::getInstance()->getConnection();
        $sessionId = $_SESSION['session_id'] ?? session_id();
        ensureCustomerLoginHistoryTable($db);

        $stmt = $db->prepare("SELECT is_revoked FROM customer_login_history WHERE user_id = ? AND session_id = ? ORDER BY created_at DESC LIMIT 1");
        $stmt->execute([$_SESSION['user_id'], $sessionId]);
        $session = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$session || intval($session['is_revoked']) === 1) {
            return false;
        }

        $stmt = $db->prepare("UPDATE customer_login_history SET last_seen_at = NOW() WHERE user_id = ? AND session_id = ?");
        $stmt->execute([$_SESSION['user_id'], $sessionId]);

        return true;
    } catch (Throwable $e) {
        return true;
    }
}

function ensureCustomerLoginHistoryTable(PDO $db) {
    static $initialized = false;

    if ($initialized) {
        return;
    }

    $db->exec(<<<SQL
        CREATE TABLE IF NOT EXISTS customer_login_history (
            history_id INT AUTO_INCREMENT PRIMARY KEY,
            user_id BIGINT UNSIGNED NOT NULL,
            session_id VARCHAR(128) NOT NULL,
            ip_address VARCHAR(45) DEFAULT NULL,
            user_agent TEXT DEFAULT NULL,
            device_name VARCHAR(100) DEFAULT NULL,
            is_current TINYINT(1) NOT NULL DEFAULT 1,
            is_revoked TINYINT(1) NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            revoked_at TIMESTAMP NULL DEFAULT NULL,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
            UNIQUE KEY uniq_user_session (user_id, session_id),
            INDEX idx_user_id (user_id),
            INDEX idx_is_current (is_current),
            INDEX idx_is_revoked (is_revoked)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL);

    $initialized = true;
}
