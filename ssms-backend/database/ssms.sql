-- ========================================
-- Stone Sales Management System (SSMS)
-- Corrected Database Schema
-- MySQL 5.7+ / MariaDB 10.3+
--
-- HOW TO USE
--   1. Open phpMyAdmin or MySQL CLI
--   2. DROP DATABASE IF EXISTS ssms;   (optional – fresh start)
--   3. Run this entire file
-- ========================================

CREATE DATABASE IF NOT EXISTS ssms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ssms;

-- ========================================
-- USERS AND AUTHENTICATION
-- ========================================

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE DEFAULT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    address TEXT DEFAULT NULL,
    role ENUM('Customer', 'Employee', 'Admin') NOT NULL DEFAULT 'Customer',
    account_status ENUM('Active', 'Inactive', 'Suspended') NOT NULL DEFAULT 'Active',
    last_login DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- customers table: links a user to a customer_id (1-to-1)
CREATE TABLE customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- employees table: links a user to an employee_id + extra fields
CREATE TABLE employees (
    employee_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    salary DECIMAL(10, 2) DEFAULT NULL,
    date_hired DATE DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- PRODUCTS (STONES)
-- ========================================

CREATE TABLE stones (
    stone_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    size VARCHAR(50) DEFAULT NULL,
    price_per_unit DECIMAL(10, 2) NOT NULL,
    quantity_in_stock INT NOT NULL DEFAULT 0,
    description TEXT DEFAULT NULL,
    image_url VARCHAR(255) DEFAULT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_is_active (is_active),
    INDEX idx_price (price_per_unit)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- SHOPPING CART
-- ========================================

CREATE TABLE carts (
    cart_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    INDEX idx_customer_id (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cart_items (
    cart_item_id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    stone_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES carts(cart_id) ON DELETE CASCADE,
    FOREIGN KEY (stone_id) REFERENCES stones(stone_id) ON DELETE CASCADE,
    INDEX idx_cart_id (cart_id),
    INDEX idx_stone_id (stone_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- ORDERS
-- ========================================

CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    employee_id INT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2) NOT NULL,
    order_status ENUM('Pending', 'Assigned', 'In Progress', 'Completed', 'Delivered', 'Canceled') NOT NULL DEFAULT 'Pending',
    stock_deducted TINYINT(1) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE SET NULL,
    INDEX idx_customer_id (customer_id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_order_status (order_status),
    INDEX idx_order_date (order_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE order_details (
    order_detail_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    stone_id INT NOT NULL,
    quantity_ordered INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (stone_id) REFERENCES stones(stone_id),
    INDEX idx_order_id (order_id),
    INDEX idx_stone_id (stone_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE order_status_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    order_status ENUM('Pending', 'Assigned', 'In Progress', 'Completed', 'Delivered', 'Canceled') NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INT NULL,
    notes TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_order_id (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- CUSTOM REQUESTS
-- ========================================

CREATE TABLE custom_orders (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    stone_name VARCHAR(100) NOT NULL,
    stone_type VARCHAR(50) DEFAULT NULL,
    size VARCHAR(50) DEFAULT NULL,
    requested_quantity INT NOT NULL,
    notes TEXT DEFAULT NULL,
    reference_image_url VARCHAR(255) DEFAULT NULL,
    request_status ENUM('Pending', 'Approved', 'Rejected', 'Converted') NOT NULL DEFAULT 'Pending',
    converted_order_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (converted_order_id) REFERENCES orders(order_id) ON DELETE SET NULL,
    INDEX idx_customer_id (customer_id),
    INDEX idx_request_status (request_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- REVIEWS
-- ========================================

CREATE TABLE reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    stone_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    is_visible TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (stone_id) REFERENCES stones(stone_id) ON DELETE CASCADE,
    UNIQUE KEY unique_customer_stone (customer_id, stone_id),
    INDEX idx_stone_id (stone_id),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- NOTIFICATIONS
-- ========================================

CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- AUDIT LOG
-- ========================================

CREATE TABLE audit_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_table_name (table_name),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TRIGGERS
-- ========================================

-- Trigger: Validate stock before creating order detail
DELIMITER //
CREATE TRIGGER before_order_detail_insert
BEFORE INSERT ON order_details
FOR EACH ROW
BEGIN
    DECLARE current_stock INT;

    SELECT quantity_in_stock INTO current_stock
    FROM stones
    WHERE stone_id = NEW.stone_id;

    IF current_stock < NEW.quantity_ordered THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Insufficient stock for the requested quantity';
    END IF;

    -- Reduce stock
    UPDATE stones
    SET quantity_in_stock = quantity_in_stock - NEW.quantity_ordered
    WHERE stone_id = NEW.stone_id;
END//
DELIMITER ;

-- Trigger: Log initial order status
DELIMITER //
CREATE TRIGGER after_order_insert
AFTER INSERT ON orders
FOR EACH ROW
BEGIN
    INSERT INTO order_status_history (order_id, order_status, user_id)
    VALUES (NEW.order_id, NEW.order_status, NULL);
END//
DELIMITER ;

-- ========================================
-- SAMPLE DATA
-- ========================================

-- Admin User  (password will be set by seed_admin.php)
INSERT INTO users (username, password_hash, full_name, email, phone, role, account_status) VALUES
('admin', '$2y$10$PLACEHOLDER_HASH_RUN_SEED_ADMIN', 'System Admin', 'admin@ssms.com', '555-0000', 'Admin', 'Active');

-- Sample Employee
INSERT INTO users (username, password_hash, full_name, email, phone, role, account_status) VALUES
('employee1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Mohammed Al-Harbi', 'employee1@ssms.com', '555-0101', 'Employee', 'Active');
-- Password: password

INSERT INTO employees (user_id, salary, date_hired) VALUES
(2, 5000.00, '2025-01-15');

-- Sample Customer
INSERT INTO users (username, password_hash, full_name, email, phone, address, role, account_status) VALUES
('customer1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ahmed Al-Rashid', 'customer1@example.com', '555-0201', '123 Main Street, Riyadh', 'Customer', 'Active');
-- Password: password

INSERT INTO customers (user_id) VALUES (3);

-- Sample Stones
INSERT INTO stones (name, type, size, price_per_unit, quantity_in_stock, description) VALUES
('Italian Marble',     'Marble',    '12x12', 150.00, 100, 'Premium white marble from Italy'),
('Granite Slab',       'Granite',   '24x24', 200.00,  50, 'Durable black granite'),
('Limestone Tile',     'Limestone', '6x6',    80.00, 200, 'Natural limestone tiles'),
('Quartz Countertop',  'Quartz',    '36x24', 300.00,  30, 'Engineered quartz surface'),
('Slate Tile',         'Slate',     '12x12', 120.00, 150, 'Natural slate flooring');

-- ========================================
-- END OF SCHEMA
-- ========================================
