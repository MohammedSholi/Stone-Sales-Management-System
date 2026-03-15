<?php
/**
 * Order Model
 * Handles order operations
 */

class OrderModel {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    public function createOrder($customerId, $cartItems, $cartId = null) {
        Logger::debug('OrderModel::createOrder - Start', [
            'customer_id' => $customerId,
            'cart_id' => $cartId,
            'cart_items_count' => count($cartItems)
        ]);
        Logger::addDebug('checkout_step', 'createOrder_start');
        
        if (empty($cartItems)) {
            Logger::debug('OrderModel::createOrder - Cart is empty');
            jsonValidationError('Cart is empty');
        }
        
        try {
            $this->db->beginTransaction();
            Logger::debug('OrderModel::createOrder - Transaction started');
            Logger::addDebug('checkout_txn', 'started');
            
            // ── 1. Calculate total ──
            $totalAmount = 0;
            foreach ($cartItems as $item) {
                $totalAmount += $item['quantity'] * $item['unit_price'];
            }
            $totalAmount = round($totalAmount, 2);
            Logger::debug('OrderModel::createOrder - Total calculated', ['total' => $totalAmount]);
            Logger::addDebug('checkout_total', $totalAmount);
            
            // ── 2. Validate each stone still exists and is active ──
            foreach ($cartItems as $item) {
                $stmt = $this->db->prepare("SELECT stone_id, is_active, quantity_in_stock FROM stones WHERE stone_id = ?");
                $stmt->execute([$item['stone_id']]);
                $stone = $stmt->fetch();
                if (!$stone || !$stone['is_active']) {
                    $this->db->rollBack();
                    jsonValidationError('Stone #' . $item['stone_id'] . ' is no longer available');
                }
            }
            Logger::addDebug('checkout_validation', 'stones_ok');
            
            // ── 3. INSERT order ──
            $stmt = $this->db->prepare("
                INSERT INTO orders (customer_id, employee_id, order_date, total_amount, order_status, stock_deducted)
                VALUES (?, NULL, NOW(), ?, 'Pending', 0)
            ");
            $stmt->execute([$customerId, $totalAmount]);
            $orderId = $this->db->lastInsertId();
            Logger::debug('OrderModel::createOrder - Order inserted', ['order_id' => $orderId]);
            Logger::addDebug('checkout_order_id', $orderId);
            
            // ── 4. INSERT order_details (triggers may validate stock) ──
            $detailCount = 0;
            foreach ($cartItems as $item) {
                try {
                    $stmt = $this->db->prepare("
                        INSERT INTO order_details (order_id, stone_id, quantity_ordered, unit_price)
                        VALUES (?, ?, ?, ?)
                    ");
                    $stmt->execute([
                        $orderId,
                        $item['stone_id'],
                        $item['quantity'],
                        $item['unit_price']
                    ]);
                    $detailCount++;
                    Logger::debug('OrderModel::createOrder - Order detail inserted', [
                        'stone_id' => $item['stone_id'],
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price']
                    ]);
                } catch (PDOException $e) {
                    // Handle trigger errors (e.g. insufficient stock)
                    $this->db->rollBack();
                    $msg = $e->getMessage();
                    Logger::error('OrderModel::createOrder - order_details insert failed', [
                        'stone_id' => $item['stone_id'],
                        'error' => $msg
                    ]);
                    if (stripos($msg, 'stock') !== false || stripos($msg, 'Insufficient') !== false) {
                        jsonValidationError('Insufficient stock for stone #' . $item['stone_id'] . ': ' . (DEBUG_MODE ? $msg : 'Not enough stock'));
                    }
                    throw $e; // re-throw if not a stock error
                }
            }
            Logger::addDebug('checkout_details_count', $detailCount);
            
            // ── 5. Clear cart items (inside same transaction) ──
            if ($cartId) {
                $stmt = $this->db->prepare("DELETE FROM cart_items WHERE cart_id = ?");
                $stmt->execute([$cartId]);
                $cleared = $stmt->rowCount();
                Logger::debug('OrderModel::createOrder - Cart cleared', ['cart_id' => $cartId, 'items_deleted' => $cleared]);
                Logger::addDebug('checkout_cart_cleared', $cleared);
            }
            
            // ── 6. Commit ──
            $this->db->commit();
            Logger::debug('OrderModel::createOrder - Transaction committed');
            Logger::addDebug('checkout_txn', 'committed');
            
            // Return the full order with details
            return $this->getById($orderId, $customerId);
            
        } catch (PDOException $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
                Logger::debug('OrderModel::createOrder - Transaction rolled back');
            }
            Logger::error('OrderModel::createOrder - FAILED', [
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
                'sql_state' => $e->errorInfo[0] ?? null
            ]);
            jsonServerError('Failed to create order: ' . (DEBUG_MODE ? $e->getMessage() : 'Database error'));
        }
    }
    
    public function getById($orderId, $customerId = null) {
        $query = "
            SELECT o.*, c.user_id as customer_user_id,
                   u.full_name as customer_name, u.email as customer_email, 
                   u.phone as customer_phone, u.address as customer_address,
                   e.full_name as employee_name
            FROM orders o
            JOIN customers c ON o.customer_id = c.customer_id
            JOIN users u ON c.user_id = u.user_id
            LEFT JOIN employees emp ON o.employee_id = emp.employee_id
            LEFT JOIN users e ON emp.user_id = e.user_id
            WHERE o.order_id = ?
        ";
        
        $params = [$orderId];
        
        if ($customerId !== null) {
            $query .= " AND o.customer_id = ?";
            $params[] = $customerId;
        }
        
        $stmt = $this->db->prepare($query);
        $stmt->execute($params);
        $order = $stmt->fetch();
        
        if (!$order) {
            jsonNotFound('Order not found');
        }
        
        // Get order details
        $stmt = $this->db->prepare("
            SELECT od.*, s.name, s.type, s.size, s.image_url,
                   (od.quantity_ordered * od.unit_price) as subtotal
            FROM order_details od
            JOIN stones s ON od.stone_id = s.stone_id
            WHERE od.order_id = ?
        ");
        $stmt->execute([$orderId]);
        $order['items'] = $stmt->fetchAll();
        
        // Timeline feature removed (order_status_history table not in schema)
        $order['timeline'] = [];
        
        return $order;
    }
    
    public function getCustomerOrders($customerId, $filters = []) {
        $query = "
            SELECT o.*, COUNT(od.order_detail_id) as item_count
            FROM orders o
            LEFT JOIN order_details od ON o.order_id = od.order_id
            WHERE o.customer_id = ?
        ";
        $params = [$customerId];
        
        if (!empty($filters['status'])) {
            $query .= " AND o.order_status = ?";
            $params[] = $filters['status'];
        }
        
        $query .= " GROUP BY o.order_id ORDER BY o.order_date DESC";
        
        // Pagination
        $page = max(1, intval($filters['page'] ?? 1));
        $limit = min(intval($filters['limit'] ?? DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
        $offset = ($page - 1) * $limit;
        $query .= " LIMIT $limit OFFSET $offset";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute($params);
        
        return $stmt->fetchAll();
    }
    
    public function getEmployeeOrders($employeeId, $filters = []) {
        $query = "
            SELECT o.*, u.full_name as customer_name, COUNT(od.order_detail_id) as item_count
            FROM orders o
            JOIN customers c ON o.customer_id = c.customer_id
            JOIN users u ON c.user_id = u.user_id
            LEFT JOIN order_details od ON o.order_id = od.order_id
            WHERE o.employee_id = ?
        ";
        $params = [$employeeId];
        
        if (!empty($filters['status'])) {
            $query .= " AND o.order_status = ?";
            $params[] = $filters['status'];
        }
        
        $query .= " GROUP BY o.order_id ORDER BY o.order_date DESC";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute($params);
        
        return $stmt->fetchAll();
    }
    
    public function getAllOrders($filters = []) {
        $query = "
            SELECT o.*, u.full_name as customer_name, e.full_name as employee_name,
                   COUNT(od.order_detail_id) as item_count
            FROM orders o
            JOIN customers c ON o.customer_id = c.customer_id
            JOIN users u ON c.user_id = u.user_id
            LEFT JOIN employees emp ON o.employee_id = emp.employee_id
            LEFT JOIN users e ON emp.user_id = e.user_id
            LEFT JOIN order_details od ON o.order_id = od.order_id
            WHERE 1=1
        ";
        $params = [];
        
        if (!empty($filters['status'])) {
            $query .= " AND o.order_status = ?";
            $params[] = $filters['status'];
        }
        
        if (!empty($filters['from_date'])) {
            $query .= " AND o.order_date >= ?";
            $params[] = $filters['from_date'];
        }
        
        if (!empty($filters['to_date'])) {
            $query .= " AND o.order_date <= ?";
            $params[] = $filters['to_date'];
        }
        
        $query .= " GROUP BY o.order_id ORDER BY o.order_date DESC";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute($params);
        
        return $stmt->fetchAll();
    }
    
    public function updateStatus($orderId, $newStatus, $userId) {
        Logger::debug('OrderModel::updateStatus - Start', [
            'order_id' => $orderId,
            'new_status' => $newStatus,
            'user_id' => $userId
        ]);
        
        $validStatuses = ['Pending', 'Assigned', 'In Progress', 'Completed', 'Delivered', 'Canceled'];
        if (!in_array($newStatus, $validStatuses)) {
            Logger::debug('OrderModel::updateStatus - Invalid status');
            jsonValidationError('Invalid status');
        }
        
        try {
            $this->db->beginTransaction();
            Logger::debug('OrderModel::updateStatus - Transaction started');
            
            // Get current status
            Logger::debug('OrderModel::updateStatus - Fetching current order status');
            $stmt = $this->db->prepare("SELECT order_status FROM orders WHERE order_id = ?");
            $stmt->execute([$orderId]);
            $order = $stmt->fetch();
            
            if (!$order) {
                Logger::debug('OrderModel::updateStatus - Order not found');
                jsonNotFound('Order not found');
            }
            
            $oldStatus = $order['order_status'];
            Logger::debug('OrderModel::updateStatus - Status change', [
                'from' => $oldStatus,
                'to' => $newStatus
            ]);
            
            // Update order status
            Logger::debug('OrderModel::updateStatus - Updating order_status column');
            $stmt = $this->db->prepare("UPDATE orders SET order_status = ? WHERE order_id = ?");
            $stmt->execute([$newStatus, $orderId]);
            
            $this->db->commit();
            Logger::debug('OrderModel::updateStatus - Transaction committed');
            
            return true;
        } catch (PDOException $e) {
            $this->db->rollBack();
            Logger::error('OrderModel::updateStatus - Error', [
                'error' => $e->getMessage(),
                'code' => $e->getCode()
            ]);
            error_log("Status Update Error: " . $e->getMessage());
            jsonServerError('Failed to update status');
        }
    }
    
    public function assignEmployee($orderId, $employeeId) {
        // Verify employee exists
        $stmt = $this->db->prepare("SELECT employee_id FROM employees WHERE employee_id = ?");
        $stmt->execute([$employeeId]);
        if (!$stmt->fetch()) {
            jsonNotFound('Employee not found');
        }
        
        $stmt = $this->db->prepare("UPDATE orders SET employee_id = ?, order_status = 'Assigned' WHERE order_id = ?");
        $stmt->execute([$employeeId, $orderId]);
        
        return true;
    }
}
