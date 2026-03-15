<?php
/**
 * Stone Controller
 * Handles stone/product operations
 */

class StoneController {
    private $stoneModel;
    
    public function __construct() {
        $this->stoneModel = new StoneModel();
    }
    
    public function getAll() {
        $filters = [
            'search' => $_GET['search'] ?? '',
            'type' => $_GET['type'] ?? '',
            'size' => $_GET['size'] ?? '',
            'minPrice' => $_GET['minPrice'] ?? null,
            'maxPrice' => $_GET['maxPrice'] ?? null,
            'inStock' => isset($_GET['inStock']) ? filter_var($_GET['inStock'], FILTER_VALIDATE_BOOLEAN) : false,
            'sort' => $_GET['sort'] ?? 'created_at',
            'order' => $_GET['order'] ?? 'DESC',
            'page' => $_GET['page'] ?? 1,
            'limit' => $_GET['limit'] ?? DEFAULT_PAGE_SIZE
        ];
        
        $result = $this->stoneModel->getAll($filters);
        
        jsonResponse($result);
    }
    
    public function getById($stoneId) {
        $stone = $this->stoneModel->getById($stoneId);
        
        jsonResponse($stone);
    }
    
    public function create() {
        requireAdmin();
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        Validator::required($data['name'] ?? '', 'Name');
        Validator::required($data['type'] ?? '', 'Type');
        Validator::required($data['price_per_unit'] ?? '', 'Price');
        Validator::numeric($data['price_per_unit'], 'Price');
        Validator::positive($data['price_per_unit'], 'Price');
        
        if (isset($data['quantity_in_stock'])) {
            Validator::numeric($data['quantity_in_stock'], 'Quantity');
        }
        
        $sanitizedData = [
            'name' => Validator::sanitize($data['name']),
            'type' => Validator::sanitize($data['type']),
            'size' => Validator::sanitize($data['size'] ?? ''),
            'price_per_unit' => floatval($data['price_per_unit']),
            'quantity_in_stock' => intval($data['quantity_in_stock'] ?? 0),
            'image_url' => Validator::sanitize($data['image_url'] ?? '')
        ];
        
        $stone = $this->stoneModel->create($sanitizedData);
        
        // Log audit
        $auditModel = new AuditModel();
        $auditModel->log(getCurrentUserId(), 'CREATE', 'stones', $stone['stone_id']);
        
        jsonResponse($stone, 'Stone created successfully', 201);
    }
    
    public function update($stoneId) {
        requireAdmin();
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (isset($data['price_per_unit'])) {
            Validator::numeric($data['price_per_unit'], 'Price');
            Validator::positive($data['price_per_unit'], 'Price');
            $data['price_per_unit'] = floatval($data['price_per_unit']);
        }
        
        if (isset($data['quantity_in_stock'])) {
            Validator::numeric($data['quantity_in_stock'], 'Quantity');
            $data['quantity_in_stock'] = intval($data['quantity_in_stock']);
        }
        
        $sanitizedData = Validator::sanitizeArray($data);
        
        $stone = $this->stoneModel->update($stoneId, $sanitizedData);
        
        // Log audit
        $auditModel = new AuditModel();
        $auditModel->log(getCurrentUserId(), 'UPDATE', 'stones', $stoneId);
        
        jsonResponse($stone, 'Stone updated successfully');
    }
    
    public function delete($stoneId) {
        requireAdmin();
        
        $this->stoneModel->delete($stoneId);
        
        // Log audit
        $auditModel = new AuditModel();
        $auditModel->log(getCurrentUserId(), 'DELETE', 'stones', $stoneId);
        
        jsonResponse(null, 'Stone deleted successfully');
    }
    
    public function uploadImage($stoneId) {
        requireAdmin();
        
        if (!isset($_FILES['image'])) {
            jsonValidationError('No image file uploaded');
        }
        
        // Verify stone exists
        $this->stoneModel->getById($stoneId);
        
        $imageUrl = Uploader::uploadImage($_FILES['image'], 'stones/');
        
        $stone = $this->stoneModel->updateImage($stoneId, $imageUrl);
        
        // Log audit
        $auditModel = new AuditModel();
        $auditModel->log(getCurrentUserId(), 'UPDATE_IMAGE', 'stones', $stoneId);
        
        jsonResponse($stone, 'Image uploaded successfully');
    }
}
