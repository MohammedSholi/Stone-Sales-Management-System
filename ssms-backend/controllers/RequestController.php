<?php
/**
 * Request Controller
 * Handles custom stone request operations
 */

class RequestController {
    private $requestModel;
    private $notificationModel;
    
    public function __construct() {
        $this->requestModel = new RequestModel();
        $this->notificationModel = new NotificationModel();
    }
    
    public function create() {
        requireCustomer();
        
        $data = $_POST; // Using $_POST because we might have file upload
        
        Validator::required($data['stone_name'] ?? '', 'Stone name');
        Validator::required($data['stone_type'] ?? '', 'Stone type');
        Validator::required($data['requested_quantity'] ?? '', 'Requested quantity');
        Validator::numeric($data['requested_quantity'], 'Requested quantity');
        Validator::positive($data['requested_quantity'], 'Requested quantity');
        
        $customerId = $_SESSION['customer_id'];
        
        $requestData = [
            'stone_name' => Validator::sanitize($data['stone_name']),
            'stone_type' => Validator::sanitize($data['stone_type']),
            'size' => Validator::sanitize($data['size'] ?? ''),
            'requested_quantity' => intval($data['requested_quantity']),
            'notes' => Validator::sanitize($data['notes'] ?? '')
        ];
        
        // Handle image upload
        if (isset($_FILES['reference_image'])) {
            $imageUrl = Uploader::uploadImage($_FILES['reference_image'], 'requests/');
            $requestData['reference_image_url'] = $imageUrl;
        }
        
        $request = $this->requestModel->create($customerId, $requestData);
        
        jsonResponse($request, 'Request submitted successfully', 201);
    }
    
    public function getRequests() {
        requireLogin();
        
        $role = getCurrentUserRole();
        
        if ($role === 'Customer') {
            $customerId = $_SESSION['customer_id'];
            $requests = $this->requestModel->getCustomerRequests($customerId);
        } else {
            jsonForbidden();
        }
        
        jsonResponse($requests);
    }
    
    public function getById($requestId) {
        requireLogin();
        
        $role = getCurrentUserRole();
        
        if ($role === 'Customer') {
            $customerId = $_SESSION['customer_id'];
            $request = $this->requestModel->getById($requestId, $customerId);
        } elseif ($role === 'Employee' || $role === 'Admin') {
            $request = $this->requestModel->getById($requestId);
        } else {
            jsonForbidden();
        }
        
        jsonResponse($request);
    }
}
