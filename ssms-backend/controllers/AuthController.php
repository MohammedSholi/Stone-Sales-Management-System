<?php
/**
 * Authentication Controller
 * Handles user registration, login, logout
 */

class AuthController {
    private $userModel;
    
    public function __construct() {
        $this->userModel = new UserModel();
    }
    
    public function register() {
        Logger::debug('AuthController::register - Start');

        try {
            // ── 1. Decode JSON body ──
            $raw  = file_get_contents('php://input');
            $data = json_decode($raw, true);

            if (!is_array($data)) {
                Logger::debug('AuthController::register - Invalid JSON body', [
                    'raw_length' => strlen($raw),
                    'json_error' => json_last_error_msg()
                ]);
                jsonError('VALIDATION_ERROR', 'Invalid JSON body', 400);
            }

            Logger::debug('AuthController::register - Request data received', [
                'username'     => $data['username']  ?? null,
                'full_name'    => $data['full_name'] ?? null,
                'email'        => $data['email']     ?? null,
                'phone'        => $data['phone']     ?? null,
                'address'      => $data['address']   ?? null,
                'has_password' => isset($data['password'])
            ]);

            // ── 2. Validate required fields ──
            Validator::required($data['username'] ?? '', 'Username');
            Validator::minLength($data['username'], 3, 'Username');
            Validator::maxLength($data['username'], 50, 'Username');

            Validator::required($data['password'] ?? '', 'Password');
            Validator::minLength($data['password'], 6, 'Password');

            Validator::required($data['full_name'] ?? '', 'Full name');
            Validator::maxLength($data['full_name'], 100, 'Full name');

            Validator::required($data['phone'] ?? '', 'Phone');

            Validator::required($data['address'] ?? '', 'Address');

            // Validate email if provided
            if (!empty($data['email'])) {
                Validator::email($data['email']);
            }

            Logger::addDebug('validation', 'passed');

            // ── 3. Register user via model ──
            $user = $this->userModel->register(
                Validator::sanitize($data['username']),
                $data['password'],                        // Don't sanitize — goes through password_hash
                Validator::sanitize($data['full_name']),
                !empty($data['email']) ? Validator::sanitize($data['email']) : null,
                Validator::sanitize($data['phone']),
                Validator::sanitize($data['address'])
            );

            Logger::debug('AuthController::register - User registered successfully', [
                'user_id'     => $user['user_id'],
                'customer_id' => $user['customer_id']
            ]);

            // ── 4. Set session ──
            $_SESSION['user_id']     = $user['user_id'];
            $_SESSION['username']    = $user['username'];
            $_SESSION['full_name']   = $user['full_name'];
            $_SESSION['role']        = $user['role'];
            $_SESSION['customer_id'] = $user['customer_id'];

            Logger::debug('AuthController::register - Session set', [
                'session_id' => session_id()
            ]);
            Logger::addDebug('session', 'created');

            jsonResponse($user, 'Registration successful', 201);

        } catch (\Throwable $e) {
            Logger::error('AuthController::register - EXCEPTION', [
                'message' => $e->getMessage(),
                'file'    => $e->getFile(),
                'line'    => $e->getLine()
            ]);
            jsonServerError('Registration failed: ' . (DEBUG_MODE ? $e->getMessage() : 'Please try again'));
        }
    }
    
    public function login() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        Validator::required($data['username'] ?? '', 'Username');
        Validator::required($data['password'] ?? '', 'Password');
        
        $user = $this->userModel->login(
            Validator::sanitize($data['username']),
            $data['password']
        );
        
        jsonResponse($user, 'Login successful');
    }
    
    public function logout() {
        session_destroy();
        jsonResponse(null, 'Logout successful');
    }
    
    public function me() {
        requireLogin();
        
        $user = getSessionUser();
        $userData = $this->userModel->getUserById($user['user_id']);
        
        // Remove sensitive data
        unset($userData['password_hash']);
        
        jsonResponse($userData);
    }
}
