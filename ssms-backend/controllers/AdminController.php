<?php
/**
 * Admin Controller
 * Handles admin-specific operations
 */

class AdminController {
    private $orderModel;
    private $requestModel;
    private $auditModel;
    private $notificationModel;
    private $userModel;
    
    public function __construct() {
        $this->orderModel = new OrderModel();
        $this->requestModel = new RequestModel();
        $this->auditModel = new AuditModel();
        $this->notificationModel = new NotificationModel();
        $this->userModel = new UserModel();
    }
    
    // ========== ORDER MANAGEMENT ==========
    
    public function getAllOrders() {
        requireAdmin();
        
        $filters = [
            'status' => $_GET['status'] ?? '',
            'from_date' => $_GET['from_date'] ?? '',
            'to_date' => $_GET['to_date'] ?? ''
        ];
        
        $orders = $this->orderModel->getAllOrders($filters);
        
        jsonResponse($orders);
    }
    
    public function assignOrder($orderId) {
        requireAdmin();
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        Validator::required($data['employee_id'] ?? '', 'Employee ID');
        Validator::numeric($data['employee_id'], 'Employee ID');
        
        $employeeId = intval($data['employee_id']);
        
        $this->orderModel->assignEmployee($orderId, $employeeId);
        
        // Get employee user_id for notification
        $userModel = new UserModel();
        $employeeData = $this->getEmployeeUser($employeeId);
        
        if ($employeeData) {
            $this->notificationModel->create(
                $employeeData['user_id'],
                'New Order Assigned',
                'Order #' . $orderId . ' has been assigned to you'
            );
        }
        
        // Log audit
        $this->auditModel->log(getCurrentUserId(), 'ASSIGN_ORDER', 'orders', $orderId);
        
        jsonResponse(null, 'Order assigned successfully');
    }
    
    public function updateOrderStatus($orderId) {
        requireAdmin();
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        Validator::required($data['status'] ?? '', 'Status');
        
        $this->orderModel->updateStatus($orderId, $data['status'], getCurrentUserId());
        
        // Log audit
        $this->auditModel->log(getCurrentUserId(), 'UPDATE_ORDER_STATUS', 'orders', $orderId);
        
        jsonResponse(null, 'Order status updated successfully');
    }
    
    // ========== REQUEST MANAGEMENT ==========
    
    public function getAllRequests() {
        requireEmployee();
        
        $filters = [
            'status' => $_GET['status'] ?? ''
        ];
        
        $requests = $this->requestModel->getAllRequests($filters);
        
        jsonResponse($requests);
    }
    
    public function approveRequest($requestId) {
        requireEmployee();
        
        $request = $this->requestModel->approve($requestId);
        
        // Get customer user_id for notification
        $customerData = $this->getCustomerUser($request['customer_id']);
        
        if ($customerData) {
            $this->notificationModel->create(
                $customerData['user_id'],
                'Request Approved',
                'Your custom request #' . $requestId . ' has been approved'
            );
        }
        
        // Log audit
        $this->auditModel->log(getCurrentUserId(), 'APPROVE_REQUEST', 'custom_orders', $requestId);
        
        jsonResponse($request, 'Request approved successfully');
    }
    
    public function rejectRequest($requestId) {
        requireEmployee();
        
        $request = $this->requestModel->reject($requestId);
        
        // Get customer user_id for notification
        $customerData = $this->getCustomerUser($request['customer_id']);
        
        if ($customerData) {
            $this->notificationModel->create(
                $customerData['user_id'],
                'Request Rejected',
                'Your custom request #' . $requestId . ' has been rejected'
            );
        }
        
        // Log audit
        $this->auditModel->log(getCurrentUserId(), 'REJECT_REQUEST', 'custom_orders', $requestId);
        
        jsonResponse($request, 'Request rejected');
    }
    
    public function convertRequest($requestId) {
        requireAdmin();
        
        $result = $this->requestModel->convertToOrder($requestId);
        
        // Get customer user_id for notification
        $customerData = $this->getCustomerUser($result['request']['customer_id']);
        
        if ($customerData) {
            $this->notificationModel->create(
                $customerData['user_id'],
                'Request Converted to Order',
                'Your custom request #' . $requestId . ' has been converted to order #' . $result['order_id']
            );
        }
        
        // Log audit
        $this->auditModel->log(getCurrentUserId(), 'CONVERT_REQUEST', 'custom_orders', $requestId);
        
        jsonResponse($result, 'Request converted to order successfully');
    }
    
    // ========== USER MANAGEMENT ==========
    
    /**
     * GET /api/admin/users
     * List all users (optional ?role=Employee&status=Active filters).
     */
    public function getAllUsers() {
        requireAdmin();
        
        $filters = [
            'role'   => $_GET['role'] ?? '',
            'status' => $_GET['status'] ?? ''
        ];
        
        $users = $this->userModel->getAllUsers($filters);
        jsonResponse($users);
    }
    
    /**
     * POST /api/admin/users/{id}/reset-password
     * Body: { "new_password": "..." }
     */
    public function resetPassword($userId) {
        requireAdmin();
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $newPassword = $data['new_password'] ?? '';
        Validator::required($newPassword, 'New password');
        Validator::minLength($newPassword, 6, 'New password');
        
        // Verify target user exists
        $targetUser = $this->userModel->getUserById($userId);
        if (!$targetUser) {
            jsonNotFound('User not found');
        }
        
        $hash = password_hash($newPassword, PASSWORD_DEFAULT);
        $this->userModel->updatePasswordHash($userId, $hash);
        
        // Audit log
        $this->auditModel->log(getCurrentUserId(), 'RESET_PASSWORD', 'users', $userId);
        
        Logger::info('Admin reset password', [
            'admin_user_id' => getCurrentUserId(),
            'target_user_id' => $userId
        ]);
        
        jsonResponse(null, "Password reset successfully for user #{$userId}");
    }
    
    /**
     * PUT /api/admin/users/{id}/status
     * Body: { "status": "Active" | "Inactive" | "Suspended" }
     */
    public function updateUserStatus($userId) {
        requireAdmin();
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $status = $data['status'] ?? '';
        Validator::required($status, 'Status');
        Validator::inArray($status, ['Active', 'Inactive', 'Suspended'], 'Status');
        
        $targetUser = $this->userModel->getUserById($userId);
        if (!$targetUser) {
            jsonNotFound('User not found');
        }
        
        // Prevent admin from deactivating themselves
        if ((int)$userId === (int)getCurrentUserId() && $status !== 'Active') {
            jsonValidationError('Cannot deactivate your own account');
        }
        
        $this->userModel->updateAccountStatus($userId, $status);
        
        $this->auditModel->log(getCurrentUserId(), 'UPDATE_USER_STATUS', 'users', $userId);
        
        jsonResponse(null, "User #{$userId} status updated to {$status}");
    }
    
    // ========== EMPLOYEE MANAGEMENT ==========
    
    /**
     * POST /api/admin/employees
     * Body: { "username", "password", "full_name", "email", "phone", "address", "salary", "date_hired" }
     */
    public function createEmployee() {
        requireAdmin();
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        Validator::required($data['username'] ?? '', 'Username');
        Validator::required($data['password'] ?? '', 'Password');
        Validator::minLength($data['password'] ?? '', 6, 'Password');
        Validator::required($data['full_name'] ?? '', 'Full name');
        
        if (!empty($data['email'])) {
            Validator::email($data['email'], 'Email');
        }
        
        $salary    = $data['salary'] ?? 0;
        $dateHired = $data['date_hired'] ?? date('Y-m-d');
        
        try {
            $result = $this->userModel->createEmployee(
                Validator::sanitize($data['username']),
                $data['password'],
                Validator::sanitize($data['full_name']),
                Validator::sanitize($data['email'] ?? ''),
                Validator::sanitize($data['phone'] ?? ''),
                Validator::sanitize($data['address'] ?? ''),
                $salary,
                $dateHired
            );
            
            // Audit log
            $this->auditModel->log(getCurrentUserId(), 'CREATE_EMPLOYEE', 'employees', $result['employee_id']);
            
            Logger::info('Admin created employee', [
                'admin_user_id'  => getCurrentUserId(),
                'new_user_id'    => $result['user_id'],
                'new_employee_id'=> $result['employee_id']
            ]);
            
            jsonResponse($result, 'Employee created successfully');
        } catch (\Throwable $e) {
            Logger::error('AdminController::createEmployee failed', ['error' => $e->getMessage()]);
            jsonServerError('Failed to create employee: ' . (DEBUG_MODE ? $e->getMessage() : 'Please try again'));
        }
    }
    
    // ========== AUDIT LOG ==========
    
    public function getAuditLogs() {
        requireAdmin();
        
        $filters = [
            'user_id' => $_GET['user_id'] ?? '',
            'table_name' => $_GET['table_name'] ?? '',
            'from_date' => $_GET['from_date'] ?? '',
            'to_date' => $_GET['to_date'] ?? ''
        ];
        
        $logs = $this->auditModel->getLogs($filters);
        
        jsonResponse($logs);
    }
    
    // ========== HELPER METHODS ==========
    
    private function getEmployeeUser($employeeId) {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT u.* FROM employees e JOIN users u ON e.user_id = u.user_id WHERE e.employee_id = ?");
        $stmt->execute([$employeeId]);
        return $stmt->fetch();
    }
    
    private function getCustomerUser($customerId) {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT u.* FROM customers c JOIN users u ON c.user_id = u.user_id WHERE c.customer_id = ?");
        $stmt->execute([$customerId]);
        return $stmt->fetch();
    }
}
