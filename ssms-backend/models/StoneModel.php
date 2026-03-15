<?php
/**
 * Stone Model
 * Handles stone/product operations
 */

class StoneModel {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    public function getAll($filters = []) {
        $query = "SELECT * FROM stones WHERE is_active = 1";
        $params = [];
        
        // Search filter
        if (!empty($filters['search'])) {
            $query .= " AND (name LIKE ? OR type LIKE ? OR size LIKE ?)";
            $searchTerm = '%' . $filters['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        // Type filter
        if (!empty($filters['type'])) {
            $query .= " AND type = ?";
            $params[] = $filters['type'];
        }
        
        // Size filter
        if (!empty($filters['size'])) {
            $query .= " AND size = ?";
            $params[] = $filters['size'];
        }
        
        // Price range filters
        if (isset($filters['minPrice']) && is_numeric($filters['minPrice'])) {
            $query .= " AND price_per_unit >= ?";
            $params[] = $filters['minPrice'];
        }
        
        if (isset($filters['maxPrice']) && is_numeric($filters['maxPrice'])) {
            $query .= " AND price_per_unit <= ?";
            $params[] = $filters['maxPrice'];
        }
        
        // In stock filter
        if (isset($filters['inStock']) && $filters['inStock']) {
            $query .= " AND quantity_in_stock > 0";
        }
        
        // Sorting
        $sortBy = $filters['sort'] ?? 'created_at';
        $sortOrder = $filters['order'] ?? 'DESC';
        $allowedSorts = ['name', 'price_per_unit', 'created_at', 'quantity_in_stock'];
        $allowedOrders = ['ASC', 'DESC'];
        
        if (in_array($sortBy, $allowedSorts) && in_array(strtoupper($sortOrder), $allowedOrders)) {
            $query .= " ORDER BY $sortBy $sortOrder";
        }
        
        // Pagination
        $page = max(1, intval($filters['page'] ?? 1));
        $limit = min(intval($filters['limit'] ?? DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
        $offset = ($page - 1) * $limit;
        
        // Get total count
        $countStmt = $this->db->prepare(str_replace('SELECT *', 'SELECT COUNT(*) as total', $query));
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];
        
        // Add pagination to query
        $query .= " LIMIT $limit OFFSET $offset";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute($params);
        $stones = $stmt->fetchAll();
        
        return [
            'stones' => $stones,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ];
    }
    
    public function getById($stoneId) {
        $stmt = $this->db->prepare("SELECT * FROM stones WHERE stone_id = ? AND is_active = 1");
        $stmt->execute([$stoneId]);
        $stone = $stmt->fetch();
        
        if (!$stone) {
            jsonNotFound('Stone not found');
        }
        
        return $stone;
    }
    
    public function create($data) {
        $stmt = $this->db->prepare("
            INSERT INTO stones (name, type, size, price_per_unit, quantity_in_stock, image_url, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
        ");
        
        $stmt->execute([
            $data['name'],
            $data['type'],
            $data['size'] ?? null,
            $data['price_per_unit'],
            $data['quantity_in_stock'] ?? 0,
            $data['image_url'] ?? null
        ]);
        
        return $this->getById($this->db->lastInsertId());
    }
    
    public function update($stoneId, $data) {
        $fields = [];
        $params = [];
        
        if (isset($data['name'])) {
            $fields[] = "name = ?";
            $params[] = $data['name'];
        }
        if (isset($data['type'])) {
            $fields[] = "type = ?";
            $params[] = $data['type'];
        }
        if (isset($data['size'])) {
            $fields[] = "size = ?";
            $params[] = $data['size'];
        }
        if (isset($data['price_per_unit'])) {
            $fields[] = "price_per_unit = ?";
            $params[] = $data['price_per_unit'];
        }
        if (isset($data['quantity_in_stock'])) {
            $fields[] = "quantity_in_stock = ?";
            $params[] = $data['quantity_in_stock'];
        }
        if (isset($data['image_url'])) {
            $fields[] = "image_url = ?";
            $params[] = $data['image_url'];
        }
        
        $fields[] = "updated_at = NOW()";
        $params[] = $stoneId;
        
        $query = "UPDATE stones SET " . implode(', ', $fields) . " WHERE stone_id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->execute($params);
        
        return $this->getById($stoneId);
    }
    
    public function delete($stoneId) {
        // Soft delete
        $stmt = $this->db->prepare("UPDATE stones SET is_active = 0, updated_at = NOW() WHERE stone_id = ?");
        $stmt->execute([$stoneId]);
        
        return $stmt->rowCount() > 0;
    }
    
    public function updateImage($stoneId, $imageUrl) {
        $stmt = $this->db->prepare("UPDATE stones SET image_url = ?, updated_at = NOW() WHERE stone_id = ?");
        $stmt->execute([$imageUrl, $stoneId]);
        
        return $this->getById($stoneId);
    }
}
