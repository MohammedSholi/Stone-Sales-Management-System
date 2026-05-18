<?php
/**
 * Create/Update user Abd with password Abdallah1234
 * This script creates or updates the user account
 */

// Set error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Include required files
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';

// Database configuration from config.php
try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ];
    
    $db = new PDO($dsn, DB_USER, DB_PASS, $options);
    
    // User data
    $username = 'Abd';
    $password = 'Abdallah1234';
    $fullName = 'Abdallah Jibril';
    $email = 'abd@hajari.com';
    $phone = '+972569966980';
    $address = 'Palestine';
    
    // Hash the password
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    
    echo "Creating/Updating user account...\n";
    echo "Username: $username\n";
    echo "Password: $password\n";
    echo "Full Name: $fullName\n\n";
    
    // Check if user already exists
    $stmt = $db->prepare("SELECT user_id FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $existing = $stmt->fetch();
    
    if ($existing) {
        // Update existing user
        echo "User already exists (ID: {$existing['user_id']}).\n";
        echo "Updating password and profile...\n\n";
        
        $stmt = $db->prepare("
            UPDATE users 
            SET password_hash = ?,
                full_name = ?,
                email = ?,
                phone = ?,
                address = ?,
                account_status = 'Active'
            WHERE username = ?
        ");
        $stmt->execute([$passwordHash, $fullName, $email, $phone, $address, $username]);
        
        echo "✓ User updated successfully!\n\n";
        echo "Login credentials:\n";
        echo "Username: $username\n";
        echo "Password: $password\n";
    } else {
        // Create new user
        echo "User does not exist.\n";
        echo "Creating new user account...\n\n";
        
        $db->beginTransaction();
        
        try {
            // Insert into users table
            $stmt = $db->prepare("
                INSERT INTO users (username, password_hash, full_name, email, phone, address, role, account_status)
                VALUES (?, ?, ?, ?, ?, ?, 'Customer', 'Active')
            ");
            $stmt->execute([$username, $passwordHash, $fullName, $email, $phone, $address]);
            $userId = $db->lastInsertId();
            
            // Insert into customers table
            $stmt = $db->prepare("INSERT INTO customers (user_id) VALUES (?)");
            $stmt->execute([$userId]);
            
            $db->commit();
            
            echo "✓ User created successfully!\n\n";
            echo "User ID: $userId\n";
            echo "Login credentials:\n";
            echo "Username: $username\n";
            echo "Password: $password\n";
        } catch (Exception $e) {
            $db->rollBack();
            echo "✗ Error creating user: " . $e->getMessage() . "\n";
            exit(1);
        }
    }
    
    echo "\n" . str_repeat("=", 50) . "\n";
    echo "Account ready to use!\n";
    echo str_repeat("=", 50) . "\n";
    
} catch (PDOException $e) {
    echo "✗ Database connection error: " . $e->getMessage() . "\n";
    exit(1);
}
