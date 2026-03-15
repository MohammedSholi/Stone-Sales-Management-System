<?php
/**
 * User Model
 * Handles user authentication and management
 */

class UserModel {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
        // Ensure PDO throws exceptions on error (belt-and-suspenders)
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }
    
    public function register($username, $password, $fullName, $email, $phone, $address) {
        Logger::debug('UserModel::register - Start', [
            'username'  => $username,
            'full_name' => $fullName,
            'email'     => $email,
            'phone'     => $phone,
            'address'   => $address
        ]);

        // Normalise email: treat empty string as NULL
        $email = !empty($email) ? $email : null;

        // Check if username exists
        try {
            $stmt = $this->db->prepare("SELECT user_id FROM users WHERE username = ?");
            $stmt->execute([$username]);
            if ($stmt->fetch()) {
                Logger::debug('UserModel::register - Username already exists');
                jsonValidationError('Username already exists');
            }
            Logger::addDebug('sql_steps', ['check_username' => 'passed']);
        } catch (PDOException $e) {
            Logger::error('UserModel::register - Error checking username', [
                'error' => $e->getMessage(),
                'code' => $e->getCode()
            ]);
            Logger::addDebug('sql_error', ['step' => 'check_username', 'error' => $e->getMessage()]);
            jsonServerError('Database error: ' . (DEBUG_MODE ? $e->getMessage() : 'Please try again'));
        }
        
        // Check if email exists (if provided)
        if (!empty($email)) {
            try {
                $stmt = $this->db->prepare("SELECT user_id FROM users WHERE email = ?");
                $stmt->execute([$email]);
                if ($stmt->fetch()) {
                    Logger::debug('UserModel::register - Email already exists');
                    jsonValidationError('Email already exists');
                }
                Logger::addDebug('sql_steps', ['check_email' => 'passed']);
            } catch (PDOException $e) {
                Logger::error('UserModel::register - Error checking email', [
                    'error' => $e->getMessage(),
                    'code' => $e->getCode()
                ]);
                Logger::addDebug('sql_error', ['step' => 'check_email', 'error' => $e->getMessage()]);
                jsonServerError('Database error: ' . (DEBUG_MODE ? $e->getMessage() : 'Please try again'));
            }
        }
        
        try {
            $this->db->beginTransaction();
            Logger::debug('UserModel::register - Transaction started');
            Logger::addDebug('transaction', 'started');
            
            // Create user - Match actual database schema
            // users table: username, password_hash, full_name, phone, address, email, role, account_status
            $passwordHash = password_hash($password, PASSWORD_DEFAULT);
            
            Logger::debug('UserModel::register - Preparing INSERT into users table', [
                'columns' => 'username, password_hash, full_name, phone, address, email, role, account_status'
            ]);
            
            $stmt = $this->db->prepare("
                INSERT INTO users (username, password_hash, full_name, phone, address, email, role, account_status) 
                VALUES (?, ?, ?, ?, ?, ?, 'Customer', 'Active')
            ");
            
            Logger::debug('UserModel::register - Executing INSERT into users');
            $stmt->execute([$username, $passwordHash, $fullName, $phone, $address, $email]);
            $userId = $this->db->lastInsertId();
            
            Logger::debug('UserModel::register - User inserted successfully', ['user_id' => $userId]);
            Logger::addDebug('sql_steps', ['insert_user' => 'success', 'user_id' => $userId]);
            
            // Create customer record - customers table only has: customer_id, user_id
            Logger::debug('UserModel::register - Preparing INSERT into customers table', [
                'columns' => 'user_id'
            ]);
            
            $stmt = $this->db->prepare("INSERT INTO customers (user_id) VALUES (?)");
            
            Logger::debug('UserModel::register - Executing INSERT into customers');
            $stmt->execute([$userId]);
            $customerId = $this->db->lastInsertId();
            
            Logger::debug('UserModel::register - Customer inserted successfully', ['customer_id' => $customerId]);
            Logger::addDebug('sql_steps', ['insert_customer' => 'success', 'customer_id' => $customerId]);
            
            $this->db->commit();
            Logger::debug('UserModel::register - Transaction committed successfully');
            Logger::addDebug('transaction', 'committed');
            
            return [
                'user_id' => $userId,
                'customer_id' => $customerId,
                'username' => $username,
                'full_name' => $fullName,
                'email' => $email,
                'role' => 'Customer'
            ];
        } catch (PDOException $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
                Logger::debug('UserModel::register - Transaction rolled back');
            }
            
            Logger::error('UserModel::register - Registration failed during transaction', [
                'error_message' => $e->getMessage(),
                'error_code' => $e->getCode(),
                'sql_state' => $e->errorInfo[0] ?? null,
                'driver_code' => $e->errorInfo[1] ?? null
            ]);
            
            Logger::addDebug('sql_error', [
                'step' => 'transaction_insert',
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'sql_state' => $e->errorInfo[0] ?? null
            ]);
            
            Logger::addDebug('transaction', 'rolled_back');
            
            jsonServerError('Registration failed: ' . (DEBUG_MODE ? $e->getMessage() : 'Database error occurred'));
        }
    }
    
    public function login($username, $password) {
        $stmt = $this->db->prepare("
            SELECT u.*, c.customer_id, e.employee_id 
            FROM users u
            LEFT JOIN customers c ON u.user_id = c.user_id
            LEFT JOIN employees e ON u.user_id = e.user_id
            WHERE u.username = ? AND u.account_status = 'Active'
        ");
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        
        if (!$user || !password_verify($password, $user['password_hash'])) {
            jsonValidationError('Invalid username or password');
        }
        
        // Update last login
        $stmt = $this->db->prepare("UPDATE users SET last_login = NOW() WHERE user_id = ?");
        $stmt->execute([$user['user_id']]);
        
        // Set session
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['full_name'] = $user['full_name'];
        $_SESSION['email'] = $user['email'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['customer_id'] = $user['customer_id'];
        $_SESSION['employee_id'] = $user['employee_id'];
        
        return [
            'user_id' => $user['user_id'],
            'username' => $user['username'],
            'full_name' => $user['full_name'],
            'email' => $user['email'],
            'phone' => $user['phone'],
            'address' => $user['address'],
            'role' => $user['role'],
            'customer_id' => $user['customer_id'],
            'employee_id' => $user['employee_id']
        ];
    }
    
    public function getUserById($userId) {
        $stmt = $this->db->prepare("
            SELECT u.*, c.customer_id, e.employee_id, e.salary, e.date_hired
            FROM users u
            LEFT JOIN customers c ON u.user_id = c.user_id
            LEFT JOIN employees e ON u.user_id = e.user_id
            WHERE u.user_id = ?
        ");
        $stmt->execute([$userId]);
        return $stmt->fetch();
    }
    
    public function updateLastLogin($userId) {
        $stmt = $this->db->prepare("UPDATE users SET last_login = NOW() WHERE user_id = ?");
        $stmt->execute([$userId]);
    }
    
    // ========== ADMIN OPERATIONS ==========
    
    /**
     * Update a user's password hash (admin reset).
     */
    public function updatePasswordHash($userId, $newHash) {
        $stmt = $this->db->prepare("UPDATE users SET password_hash = ? WHERE user_id = ?");
        $stmt->execute([$newHash, $userId]);
        return $stmt->rowCount() > 0;
    }
    
    /**
     * Get all users with optional role filter.
     */
    public function getAllUsers($filters = []) {
        $sql = "
            SELECT u.user_id, u.username, u.full_name, u.email, u.phone, u.address,
                   u.role, u.account_status, u.created_at, u.last_login,
                   c.customer_id, e.employee_id
            FROM users u
            LEFT JOIN customers c ON u.user_id = c.user_id
            LEFT JOIN employees e ON u.user_id = e.user_id
            WHERE 1=1
        ";
        $params = [];
        
        if (!empty($filters['role'])) {
            $sql .= " AND u.role = ?";
            $params[] = $filters['role'];
        }
        if (!empty($filters['status'])) {
            $sql .= " AND u.account_status = ?";
            $params[] = $filters['status'];
        }
        
        $sql .= " ORDER BY u.user_id ASC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Update user account status (Active / Inactive / Suspended).
     */
    public function updateAccountStatus($userId, $status) {
        $allowed = ['Active', 'Inactive', 'Suspended'];
        if (!in_array($status, $allowed, true)) {
            throw new InvalidArgumentException("Invalid status: $status");
        }
        $stmt = $this->db->prepare("UPDATE users SET account_status = ? WHERE user_id = ?");
        $stmt->execute([$status, $userId]);
        return $stmt->rowCount() > 0;
    }
    
    /**
     * Create an employee user inside a transaction.
     * Returns ['user_id' => ..., 'employee_id' => ...].
     */
    public function createEmployee($username, $password, $fullName, $email, $phone, $address, $salary, $dateHired) {
        // Check if username exists
        $stmt = $this->db->prepare("SELECT user_id FROM users WHERE username = ?");
        $stmt->execute([$username]);
        if ($stmt->fetch()) {
            jsonValidationError('Username already exists');
        }
        
        // Check if email exists
        if (!empty($email)) {
            $stmt = $this->db->prepare("SELECT user_id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                jsonValidationError('Email already exists');
            }
        }
        
        $this->db->beginTransaction();
        try {
            $hash = password_hash($password, PASSWORD_DEFAULT);
            
            $stmt = $this->db->prepare("
                INSERT INTO users (username, password_hash, full_name, phone, address, email, role, account_status)
                VALUES (?, ?, ?, ?, ?, ?, 'Employee', 'Active')
            ");
            $stmt->execute([$username, $hash, $fullName, $phone, $address, $email]);
            $userId = $this->db->lastInsertId();
            
            $stmt = $this->db->prepare("
                INSERT INTO employees (user_id, salary, date_hired)
                VALUES (?, ?, ?)
            ");
            $stmt->execute([$userId, $salary, $dateHired]);
            $employeeId = $this->db->lastInsertId();
            
            $this->db->commit();
            
            return [
                'user_id'     => $userId,
                'employee_id' => $employeeId,
                'username'    => $username,
                'full_name'   => $fullName,
                'email'       => $email,
                'role'        => 'Employee'
            ];
        } catch (\Throwable $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $e;
        }
    }
}
