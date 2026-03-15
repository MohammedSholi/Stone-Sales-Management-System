<?php
/**
 * Custom Request Model
 * Handles custom stone request operations
 */

class RequestModel {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    public function create($customerId, $data) {
        $stmt = $this->db->prepare("
            INSERT INTO custom_orders (customer_id, stone_name, stone_type, size, requested_quantity, notes, reference_image_url, request_status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', NOW())
        ");
        
        $stmt->execute([
            $customerId,
            $data['stone_name'],
            $data['stone_type'],
            $data['size'] ?? null,
            $data['requested_quantity'],
            $data['notes'] ?? null,
            $data['reference_image_url'] ?? null
        ]);
        
        return $this->getById($this->db->lastInsertId());
    }
    
    public function getById($requestId, $customerId = null) {
        $query = "
            SELECT cr.*, u.full_name as customer_name, u.email as customer_email, u.phone as customer_phone
            FROM custom_orders cr
            JOIN customers c ON cr.customer_id = c.customer_id
            JOIN users u ON c.user_id = u.user_id
            WHERE cr.request_id = ?
        ";
        $params = [$requestId];
        
        if ($customerId !== null) {
            $query .= " AND cr.customer_id = ?";
            $params[] = $customerId;
        }
        
        $stmt = $this->db->prepare($query);
        $stmt->execute($params);
        $request = $stmt->fetch();
        
        if (!$request) {
            jsonNotFound('Request not found');
        }
        
        return $request;
    }
    
    public function getCustomerRequests($customerId) {
        $stmt = $this->db->prepare("
            SELECT * FROM custom_orders
            WHERE customer_id = ?
            ORDER BY created_at DESC
        ");
        $stmt->execute([$customerId]);
        
        return $stmt->fetchAll();
    }
    
    public function getAllRequests($filters = []) {
        $query = "
            SELECT cr.*, u.full_name as customer_name, u.email as customer_email
            FROM custom_orders cr
            JOIN customers c ON cr.customer_id = c.customer_id
            JOIN users u ON c.user_id = u.user_id
            WHERE 1=1
        ";
        $params = [];
        
        if (!empty($filters['status'])) {
            $query .= " AND cr.request_status = ?";
            $params[] = $filters['status'];
        }
        
        $query .= " ORDER BY cr.created_at DESC";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute($params);
        
        return $stmt->fetchAll();
    }
    
    public function approve($requestId) {
        $stmt = $this->db->prepare("UPDATE custom_orders SET request_status = 'Approved' WHERE request_id = ?");
        $stmt->execute([$requestId]);
        
        return $this->getById($requestId);
    }
    
    public function reject($requestId) {
        $stmt = $this->db->prepare("UPDATE custom_orders SET request_status = 'Rejected' WHERE request_id = ?");
        $stmt->execute([$requestId]);
        
        return $this->getById($requestId);
    }
    
    public function convertToOrder($requestId) {
        $request = $this->getById($requestId);
        
        try {
            $this->db->beginTransaction();
            
            // Try to find matching stone
            $stmt = $this->db->prepare("
                SELECT stone_id, price_per_unit, quantity_in_stock
                FROM stones
                WHERE name = ? AND type = ? AND (size = ? OR size IS NULL) AND is_active = 1
                LIMIT 1
            ");
            $stmt->execute([$request['stone_name'], $request['stone_type'], $request['size']]);
            $stone = $stmt->fetch();
            
            if (!$stone) {
                $this->db->rollBack();
                jsonValidationError('Matching stone not found in catalog. Please create the stone product first.');
            }
            
            if ($stone['quantity_in_stock'] < $request['requested_quantity']) {
                $this->db->rollBack();
                jsonValidationError('Insufficient stock for this request');
            }
            
            // Create order
            $totalAmount = $stone['price_per_unit'] * $request['requested_quantity'];
            $stmt = $this->db->prepare("
                INSERT INTO orders (customer_id, order_date, total_amount, order_status, stock_deducted)
                VALUES (?, NOW(), ?, 'Pending', 0)
            ");
            $stmt->execute([$request['customer_id'], $totalAmount]);
            $orderId = $this->db->lastInsertId();
            
            // Create order detail
            $stmt = $this->db->prepare("
                INSERT INTO order_details (order_id, stone_id, quantity_ordered, unit_price)
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([$orderId, $stone['stone_id'], $request['requested_quantity'], $stone['price_per_unit']]);
            
            // Update request status and link order
            $stmt = $this->db->prepare("
                UPDATE custom_orders 
                SET request_status = 'Converted', converted_order_id = ?
                WHERE request_id = ?
            ");
            $stmt->execute([$orderId, $requestId]);
            
            $this->db->commit();
            
            return [
                'request' => $this->getById($requestId),
                'order_id' => $orderId
            ];
        } catch (PDOException $e) {
            $this->db->rollBack();
            error_log("Convert Request Error: " . $e->getMessage());
            jsonServerError('Failed to convert request to order');
        }
    }
}
