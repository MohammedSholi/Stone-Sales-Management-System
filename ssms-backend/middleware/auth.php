<?php
/**
 * Authentication Middleware
 */

function requireLogin() {
    if (!isset($_SESSION['user_id'])) {
        jsonUnauthorized('Please login to continue');
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
