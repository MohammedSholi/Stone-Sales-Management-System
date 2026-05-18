<?php
/**
 * Customer Account Model
 * Handles profile, settings, addresses, payment methods, and sessions.
 */

class CustomerAccountModel {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
        $this->ensureSettingsTable();
        $this->ensureAddressesTable();
        $this->ensurePaymentMethodsTable();
        $this->ensureLoginHistoryTable();
    }

    private function ensureSettingsTable() {
        $this->db->exec(<<<SQL
            CREATE TABLE IF NOT EXISTS customer_account_settings (
                user_id BIGINT UNSIGNED PRIMARY KEY,
                first_name VARCHAR(100) DEFAULT NULL,
                last_name VARCHAR(100) DEFAULT NULL,
                avatar_url VARCHAR(255) DEFAULT NULL,
                city VARCHAR(100) DEFAULT NULL,
                country VARCHAR(100) DEFAULT NULL,
                postal_code VARCHAR(20) DEFAULT NULL,
                display_name VARCHAR(120) DEFAULT NULL,
                recovery_email VARCHAR(100) DEFAULT NULL,
                recovery_phone VARCHAR(20) DEFAULT NULL,
                preferred_language VARCHAR(20) NOT NULL DEFAULT 'en',
                preferred_currency VARCHAR(10) NOT NULL DEFAULT 'USD',
                timezone VARCHAR(100) NOT NULL DEFAULT 'Asia/Jerusalem',
                theme_preference ENUM('light', 'dark', 'system') NOT NULL DEFAULT 'system',
                email_notifications TINYINT(1) NOT NULL DEFAULT 1,
                sms_notifications TINYINT(1) NOT NULL DEFAULT 0,
                order_updates TINYINT(1) NOT NULL DEFAULT 1,
                marketing_emails TINYINT(1) NOT NULL DEFAULT 0,
                security_alerts TINYINT(1) NOT NULL DEFAULT 1,
                two_factor_enabled TINYINT(1) NOT NULL DEFAULT 0,
                privacy_profile_public TINYINT(1) NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL);
    }

    private function ensureLoginHistoryTable() {
        $this->db->exec(<<<SQL
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
    }

    private function getUserRow($userId, $withPassword = false) {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE user_id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            jsonNotFound('User not found');
        }

        if (!$withPassword) {
            unset($user['password_hash']);
        }

        return $user;
    }

    private function getCustomerIdByUserId($userId) {
        $stmt = $this->db->prepare("SELECT customer_id FROM customers WHERE user_id = ?");
        $stmt->execute([$userId]);
        $customer = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$customer) {
            jsonForbidden('Customer account not found');
        }

        return intval($customer['customer_id']);
    }

    private function splitFullName($fullName) {
        $parts = preg_split('/\s+/', trim((string) $fullName));
        if (!$parts || count($parts) === 0) {
            return ['', ''];
        }

        $first = array_shift($parts);
        $last = trim(implode(' ', $parts));
        return [$first, $last];
    }

    private function detectCardBrand($cardNumber) {
        $digits = preg_replace('/\D+/', '', (string) $cardNumber);
        if (preg_match('/^4/', $digits)) return 'Visa';
        if (preg_match('/^(5[1-5]|2[2-7])/', $digits)) return 'Mastercard';
        if (preg_match('/^3[47]/', $digits)) return 'American Express';
        if (preg_match('/^6/', $digits)) return 'Discover';
        return 'Card';
    }

    private function inferDeviceName($userAgent) {
        $ua = strtolower((string) $userAgent);
        if (strpos($ua, 'iphone') !== false || strpos($ua, 'android') !== false) return 'Mobile Device';
        if (strpos($ua, 'ipad') !== false || strpos($ua, 'tablet') !== false) return 'Tablet';
        if (strpos($ua, 'windows') !== false) return 'Windows PC';
        if (strpos($ua, 'mac') !== false) return 'Mac';
        return 'Web Browser';
    }

    private function ensureSettingsRow($userId) {
        $this->ensureSettingsTable();
        $stmt = $this->db->prepare("SELECT user_id FROM customer_account_settings WHERE user_id = ?");
        $stmt->execute([$userId]);

        if (!$stmt->fetch()) {
            $stmt = $this->db->prepare(<<<SQL
                INSERT INTO customer_account_settings (
                    user_id, first_name, last_name, avatar_url, city, country, postal_code,
                    display_name, recovery_email, recovery_phone, preferred_language, preferred_currency, timezone, theme_preference,
                    email_notifications, sms_notifications, order_updates, marketing_emails,
                    security_alerts, two_factor_enabled, privacy_profile_public, created_at, updated_at
                ) VALUES (?, '', '', NULL, '', '', '', NULL, NULL, NULL, 'en', 'USD', 'Asia/Jerusalem', 'system', 1, 0, 1, 0, 1, 0, 1, NOW(), NOW())
SQL);
            $stmt->execute([$userId]);
        }
    }

    private function ensureAddressesTable() {
        $this->db->exec(<<<SQL
            CREATE TABLE IF NOT EXISTS customer_addresses (
                address_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id BIGINT UNSIGNED NOT NULL,
                label VARCHAR(50) NOT NULL DEFAULT 'Home',
                full_name VARCHAR(100) DEFAULT NULL,
                phone VARCHAR(20) DEFAULT NULL,
                line1 VARCHAR(255) NOT NULL,
                line2 VARCHAR(255) DEFAULT NULL,
                city VARCHAR(100) NOT NULL,
                country VARCHAR(100) NOT NULL,
                postal_code VARCHAR(20) DEFAULT NULL,
                is_default_shipping TINYINT(1) NOT NULL DEFAULT 0,
                is_default_billing TINYINT(1) NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_default_shipping (is_default_shipping),
                INDEX idx_default_billing (is_default_billing)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL);
    }

    private function ensurePaymentMethodsTable() {
        $this->db->exec(<<<SQL
            CREATE TABLE IF NOT EXISTS customer_payment_methods (
                payment_method_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id BIGINT UNSIGNED NOT NULL,
                card_brand VARCHAR(30) NOT NULL,
                card_last4 CHAR(4) NOT NULL,
                masked_card_number VARCHAR(30) NOT NULL,
                card_holder_name VARCHAR(100) NOT NULL,
                exp_month TINYINT UNSIGNED NOT NULL,
                exp_year SMALLINT UNSIGNED NOT NULL,
                is_default TINYINT(1) NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_is_default (is_default)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL);
    }

    private function getSettingsRow($userId) {
        $this->ensureSettingsRow($userId);
        $stmt = $this->db->prepare("SELECT * FROM customer_account_settings WHERE user_id = ?");
        $stmt->execute([$userId]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
    }

    public function recordLoginSession($userId) {
        $this->ensureLoginHistoryTable();
        $sessionId = session_id();
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? null;
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;
        $deviceName = $this->inferDeviceName($userAgent);

        $stmt = $this->db->prepare(<<<SQL
            INSERT INTO customer_login_history (
                user_id, session_id, ip_address, user_agent, device_name,
                is_current, is_revoked, created_at, last_seen_at
            ) VALUES (?, ?, ?, ?, ?, 1, 0, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
                ip_address = VALUES(ip_address),
                user_agent = VALUES(user_agent),
                device_name = VALUES(device_name),
                is_current = 1,
                is_revoked = 0,
                revoked_at = NULL,
                last_seen_at = NOW()
SQL);
        $stmt->execute([$userId, $sessionId, $ipAddress, $userAgent, $deviceName]);
    }

    public function revokeCurrentSession($userId, $sessionId) {
        $this->ensureLoginHistoryTable();
        if (empty($sessionId)) {
            return;
        }

        $stmt = $this->db->prepare(<<<SQL
            UPDATE customer_login_history
            SET is_revoked = 1, is_current = 0, revoked_at = NOW()
            WHERE user_id = ? AND session_id = ?
SQL);
        $stmt->execute([$userId, $sessionId]);
    }

    public function revokeAllSessions($userId) {
        $this->ensureLoginHistoryTable();
        $stmt = $this->db->prepare(<<<SQL
            UPDATE customer_login_history
            SET is_revoked = 1, is_current = 0, revoked_at = NOW()
            WHERE user_id = ? AND is_revoked = 0
SQL);
        $stmt->execute([$userId]);
    }

    public function getProfileBundle($userId) {
        $user = $this->getUserRow($userId);
        $customerId = $this->getCustomerIdByUserId($userId);
        $settings = $this->getSettingsRow($userId);

        $statsStmt = $this->db->prepare(<<<SQL
            SELECT
                COUNT(*) AS total_orders,
                SUM(CASE WHEN order_status IN ('Completed', 'Delivered') THEN 1 ELSE 0 END) AS completed_orders,
                SUM(CASE WHEN order_status IN ('Pending', 'Assigned', 'In Progress') THEN 1 ELSE 0 END) AS pending_orders,
                COALESCE(SUM(CASE WHEN order_status IN ('Completed', 'Delivered') THEN total_amount ELSE 0 END), 0) AS total_amount_spent
            FROM orders
            WHERE customer_id = ?
SQL);
        $statsStmt->execute([$customerId]);
        $stats = $statsStmt->fetch(PDO::FETCH_ASSOC) ?: [];

        $reviewStmt = $this->db->prepare("SELECT COUNT(*) AS review_count FROM reviews WHERE customer_id = ?");
        $reviewStmt->execute([$customerId]);
        $reviews = $reviewStmt->fetch(PDO::FETCH_ASSOC) ?: [];

        $requestStmt = $this->db->prepare("SELECT COUNT(*) AS request_count FROM custom_orders WHERE customer_id = ?");
        $requestStmt->execute([$customerId]);
        $requests = $requestStmt->fetch(PDO::FETCH_ASSOC) ?: [];

        $recentOrdersStmt = $this->db->prepare(<<<SQL
            SELECT o.order_id, o.order_date, o.order_status, o.total_amount, COUNT(od.order_detail_id) AS item_count
            FROM orders o
            LEFT JOIN order_details od ON o.order_id = od.order_id
            WHERE o.customer_id = ?
            GROUP BY o.order_id
            ORDER BY o.order_date DESC
            LIMIT 5
    SQL);
        $recentOrdersStmt->execute([$customerId]);

        $recentRequestsStmt = $this->db->prepare(<<<SQL
            SELECT request_id, stone_name, stone_type, requested_quantity, request_status, created_at
            FROM custom_orders
            WHERE customer_id = ?
            ORDER BY created_at DESC
            LIMIT 4
    SQL);
        $recentRequestsStmt->execute([$customerId]);

        $recentReviewsStmt = $this->db->prepare(<<<SQL
            SELECT r.review_id, r.rating, r.comment, r.created_at, s.name AS stone_name
            FROM reviews r
            JOIN stones s ON r.stone_id = s.stone_id
            WHERE r.customer_id = ?
            ORDER BY r.created_at DESC
            LIMIT 4
    SQL);
        $recentReviewsStmt->execute([$customerId]);

        [$firstNameFromFull, $lastNameFromFull] = $this->splitFullName($user['full_name'] ?? '');

        return [
            'user' => [
                'user_id' => intval($user['user_id']),
                'customer_id' => $customerId,
                'username' => $user['username'],
                'full_name' => $user['full_name'],
                'email' => $user['email'],
                'phone' => $user['phone'],
                'address' => $user['address'],
                'role' => $user['role'],
                'account_status' => $user['account_status'],
                'created_at' => $user['created_at'],
                'last_login' => $user['last_login'],
                'avatar_url' => $settings['avatar_url'] ?? null,
            ],
            'profile' => [
                'first_name' => $settings['first_name'] ?: $firstNameFromFull,
                'last_name' => $settings['last_name'] ?: $lastNameFromFull,
                'avatar_url' => $settings['avatar_url'] ?? null,
                'city' => $settings['city'] ?? '',
                'country' => $settings['country'] ?? '',
                'postal_code' => $settings['postal_code'] ?? '',
            ],
            'stats' => [
                'total_orders' => intval($stats['total_orders'] ?? 0),
                'completed_orders' => intval($stats['completed_orders'] ?? 0),
                'pending_orders' => intval($stats['pending_orders'] ?? 0),
                'total_amount_spent' => round(floatval($stats['total_amount_spent'] ?? 0), 2),
                'review_count' => intval($reviews['review_count'] ?? 0),
                'request_count' => intval($requests['request_count'] ?? 0),
                'wishlist_count' => 0,
            ],
            'recent_orders' => $recentOrdersStmt->fetchAll(PDO::FETCH_ASSOC),
            'recent_requests' => $recentRequestsStmt->fetchAll(PDO::FETCH_ASSOC),
            'recent_reviews' => $recentReviewsStmt->fetchAll(PDO::FETCH_ASSOC),
        ];
    }

    public function updateProfile($userId, $data, $avatarUrl = null) {
        $user = $this->getUserRow($userId);
        $settings = $this->getSettingsRow($userId);

        $firstName = trim((string) ($data['first_name'] ?? $settings['first_name'] ?? ''));
        $lastName = trim((string) ($data['last_name'] ?? $settings['last_name'] ?? ''));
        $fullName = trim($firstName . ' ' . $lastName);
        if ($fullName === '') {
            $fullName = $user['full_name'];
        }

        $email = trim((string) ($data['email'] ?? $user['email'] ?? ''));
        $phone = trim((string) ($data['phone'] ?? $user['phone'] ?? ''));
        $address = trim((string) ($data['address'] ?? $user['address'] ?? ''));
        $city = trim((string) ($data['city'] ?? $settings['city'] ?? ''));
        $country = trim((string) ($data['country'] ?? $settings['country'] ?? ''));
        $postalCode = trim((string) ($data['postal_code'] ?? $settings['postal_code'] ?? ''));

        if ($email !== '') {
            Validator::email($email);
        }

        $stmt = $this->db->prepare("UPDATE users SET full_name = ?, email = ?, phone = ?, address = ? WHERE user_id = ?");
        $stmt->execute([
            $fullName,
            $email !== '' ? $email : null,
            $phone !== '' ? $phone : null,
            $address !== '' ? $address : null,
            $userId,
        ]);

        $stmt = $this->db->prepare(<<<SQL
            INSERT INTO customer_account_settings (
                user_id, first_name, last_name, avatar_url, city, country, postal_code,
                preferred_language, preferred_currency, timezone, theme_preference,
                email_notifications, sms_notifications, order_updates, marketing_emails,
                security_alerts, two_factor_enabled, privacy_profile_public, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'en', 'USD', 'Asia/Jerusalem', 'system', 1, 0, 1, 0, 1, 0, 1, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
                first_name = VALUES(first_name),
                last_name = VALUES(last_name),
                avatar_url = COALESCE(VALUES(avatar_url), avatar_url),
                city = VALUES(city),
                country = VALUES(country),
                postal_code = VALUES(postal_code),
                updated_at = NOW()
SQL);
        $stmt->execute([
            $userId,
            $firstName,
            $lastName,
            $avatarUrl !== null ? $avatarUrl : ($settings['avatar_url'] ?? null),
            $city,
            $country,
            $postalCode,
        ]);

        return $this->getProfileBundle($userId);
    }

    public function verifyCurrentPassword($userId, $currentPassword) {
        $user = $this->getUserRow($userId, true);
        return $user && password_verify($currentPassword, $user['password_hash']);
    }

    public function updatePassword($userId, $newPassword) {
        $hash = password_hash($newPassword, PASSWORD_DEFAULT);
        $stmt = $this->db->prepare("UPDATE users SET password_hash = ? WHERE user_id = ?");
        $stmt->execute([$hash, $userId]);
        return true;
    }

    public function updateSettings($userId, $data) {
        $this->ensureSettingsRow($userId);

        $stmt = $this->db->prepare(<<<SQL
            UPDATE customer_account_settings
            SET display_name = ?, recovery_email = ?, recovery_phone = ?,
                preferred_language = ?, preferred_currency = ?, timezone = ?, theme_preference = ?,
                email_notifications = ?, sms_notifications = ?, order_updates = ?, marketing_emails = ?,
                security_alerts = ?, two_factor_enabled = ?, privacy_profile_public = ?, updated_at = NOW()
            WHERE user_id = ?
SQL);
        $stmt->execute([
            trim((string) ($data['display_name'] ?? '')) ?: null,
            trim((string) ($data['recovery_email'] ?? '')) ?: null,
            trim((string) ($data['recovery_phone'] ?? '')) ?: null,
            $data['preferred_language'] ?? 'en',
            $data['preferred_currency'] ?? 'USD',
            $data['timezone'] ?? 'Asia/Jerusalem',
            $data['theme_preference'] ?? 'system',
            !empty($data['email_notifications']) ? 1 : 0,
            !empty($data['sms_notifications']) ? 1 : 0,
            !empty($data['order_updates']) ? 1 : 0,
            !empty($data['marketing_emails']) ? 1 : 0,
            !empty($data['security_alerts']) ? 1 : 0,
            !empty($data['two_factor_enabled']) ? 1 : 0,
            !empty($data['privacy_profile_public']) ? 1 : 0,
            $userId,
        ]);

        return $this->getSettingsBundle($userId);
    }

    public function updateAvatar($userId, $avatarUrl) {
        $this->ensureSettingsRow($userId);
        $stmt = $this->db->prepare("UPDATE customer_account_settings SET avatar_url = ?, updated_at = NOW() WHERE user_id = ?");
        $stmt->execute([$avatarUrl, $userId]);
        return true;
    }

    public function getSettingsBundle($userId) {
        $settings = $this->getSettingsRow($userId);

        $addressesStmt = $this->db->prepare(<<<SQL
            SELECT * FROM customer_addresses
            WHERE user_id = ?
            ORDER BY is_default_shipping DESC, is_default_billing DESC, created_at DESC
    SQL);
        $addressesStmt->execute([$userId]);

        $paymentsStmt = $this->db->prepare(<<<SQL
            SELECT * FROM customer_payment_methods
            WHERE user_id = ?
            ORDER BY is_default DESC, created_at DESC
    SQL);
        $paymentsStmt->execute([$userId]);

        $sessionsStmt = $this->db->prepare(<<<SQL
            SELECT * FROM customer_login_history
            WHERE user_id = ?
            ORDER BY is_current DESC, created_at DESC
    SQL);
        $sessionsStmt->execute([$userId]);

        return [
            'settings' => $settings,
            'addresses' => $addressesStmt->fetchAll(PDO::FETCH_ASSOC),
            'payment_methods' => $paymentsStmt->fetchAll(PDO::FETCH_ASSOC),
            'sessions' => $sessionsStmt->fetchAll(PDO::FETCH_ASSOC),
        ];
    }

    public function saveAddress($userId, $data) {
        $label = trim((string) ($data['label'] ?? 'Home'));
        $fullName = trim((string) ($data['full_name'] ?? ''));
        $phone = trim((string) ($data['phone'] ?? ''));
        $line1 = trim((string) ($data['line1'] ?? ''));
        $line2 = trim((string) ($data['line2'] ?? ''));
        $city = trim((string) ($data['city'] ?? ''));
        $country = trim((string) ($data['country'] ?? ''));
        $postalCode = trim((string) ($data['postal_code'] ?? ''));
        $shipping = !empty($data['is_default_shipping']) ? 1 : 0;
        $billing = !empty($data['is_default_billing']) ? 1 : 0;
        $addressId = !empty($data['address_id']) ? intval($data['address_id']) : null;

        if ($line1 === '' || $city === '' || $country === '') {
            jsonValidationError('Address line 1, city, and country are required');
        }

        if ($addressId) {
            $stmt = $this->db->prepare(<<<SQL
                UPDATE customer_addresses
                SET label = ?, full_name = ?, phone = ?, line1 = ?, line2 = ?, city = ?, country = ?, postal_code = ?,
                    is_default_shipping = ?, is_default_billing = ?, updated_at = NOW()
                WHERE address_id = ? AND user_id = ?
SQL);
            $stmt->execute([$label, $fullName, $phone, $line1, $line2 ?: null, $city, $country, $postalCode, $shipping, $billing, $addressId, $userId]);
            $savedId = $addressId;
        } else {
            $stmt = $this->db->prepare(<<<SQL
                INSERT INTO customer_addresses (
                    user_id, label, full_name, phone, line1, line2, city, country, postal_code,
                    is_default_shipping, is_default_billing, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
SQL);
            $stmt->execute([$userId, $label, $fullName, $phone, $line1, $line2 ?: null, $city, $country, $postalCode, $shipping, $billing]);
            $savedId = $this->db->lastInsertId();
        }

        if ($shipping) {
            $stmt = $this->db->prepare("UPDATE customer_addresses SET is_default_shipping = 0 WHERE user_id = ? AND address_id <> ?");
            $stmt->execute([$userId, $savedId]);
        }

        if ($billing) {
            $stmt = $this->db->prepare("UPDATE customer_addresses SET is_default_billing = 0 WHERE user_id = ? AND address_id <> ?");
            $stmt->execute([$userId, $savedId]);
        }

        $stmt = $this->db->prepare("SELECT * FROM customer_addresses WHERE address_id = ? AND user_id = ?");
        $stmt->execute([$savedId, $userId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function deleteAddress($userId, $addressId) {
        $stmt = $this->db->prepare("DELETE FROM customer_addresses WHERE address_id = ? AND user_id = ?");
        $stmt->execute([$addressId, $userId]);
        return $stmt->rowCount() > 0;
    }

    public function savePaymentMethod($userId, $data) {
        $cardNumber = preg_replace('/\D+/', '', (string) ($data['card_number'] ?? ''));
        $holderName = trim((string) ($data['card_holder_name'] ?? ''));
        $expMonth = intval($data['exp_month'] ?? 0);
        $expYear = intval($data['exp_year'] ?? 0);
        $isDefault = !empty($data['is_default']) ? 1 : 0;

        if (strlen($cardNumber) < 12 || $holderName === '' || $expMonth < 1 || $expMonth > 12 || $expYear < intval(date('Y'))) {
            jsonValidationError('Please provide valid card details');
        }

        if ($isDefault) {
            $stmt = $this->db->prepare("UPDATE customer_payment_methods SET is_default = 0 WHERE user_id = ?");
            $stmt->execute([$userId]);
        }

        $brand = $this->detectCardBrand($cardNumber);
        $last4 = substr($cardNumber, -4);
        $masked = '•••• •••• •••• ' . $last4;

        $stmt = $this->db->prepare(<<<SQL
            INSERT INTO customer_payment_methods (
                user_id, card_brand, card_last4, masked_card_number, card_holder_name,
                exp_month, exp_year, is_default, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
SQL);
        $stmt->execute([$userId, $brand, $last4, $masked, $holderName, $expMonth, $expYear, $isDefault]);

        $savedId = $this->db->lastInsertId();
        $stmt = $this->db->prepare("SELECT * FROM customer_payment_methods WHERE payment_method_id = ? AND user_id = ?");
        $stmt->execute([$savedId, $userId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function deletePaymentMethod($userId, $paymentMethodId) {
        $stmt = $this->db->prepare("DELETE FROM customer_payment_methods WHERE payment_method_id = ? AND user_id = ?");
        $stmt->execute([$paymentMethodId, $userId]);
        return $stmt->rowCount() > 0;
    }

    public function setDefaultPaymentMethod($userId, $paymentMethodId) {
        $stmt = $this->db->prepare("UPDATE customer_payment_methods SET is_default = 0 WHERE user_id = ?");
        $stmt->execute([$userId]);

        $stmt = $this->db->prepare("UPDATE customer_payment_methods SET is_default = 1 WHERE payment_method_id = ? AND user_id = ?");
        $stmt->execute([$paymentMethodId, $userId]);

        if ($stmt->rowCount() === 0) {
            jsonNotFound('Payment method not found');
        }

        $stmt = $this->db->prepare("SELECT * FROM customer_payment_methods WHERE payment_method_id = ? AND user_id = ?");
        $stmt->execute([$paymentMethodId, $userId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function deactivateAccount($userId, $delete = false) {
        $user = $this->getUserRow($userId);
        $newUsername = $delete ? 'deleted_user_' . $userId : $user['username'];
        $newName = $delete ? 'Deleted Customer' : $user['full_name'];

        $stmt = $this->db->prepare(<<<SQL
            UPDATE users
            SET username = ?, full_name = ?, email = NULL, phone = NULL, address = NULL, account_status = 'Inactive'
            WHERE user_id = ?
    SQL);
        $stmt->execute([$newUsername, $newName, $userId]);

        $stmt = $this->db->prepare("DELETE FROM customer_addresses WHERE user_id = ?");
        $stmt->execute([$userId]);

        $stmt = $this->db->prepare("DELETE FROM customer_payment_methods WHERE user_id = ?");
        $stmt->execute([$userId]);

        $this->revokeAllSessions($userId);
    }
}