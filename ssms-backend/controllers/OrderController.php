<?php
/**
 * Order Controller
 * Handles order operations and checkout
 */

class OrderController {
    private $orderModel;
    private $cartModel;
    private $notificationModel;
    
    public function __construct() {
        $this->orderModel = new OrderModel();
        $this->cartModel = new CartModel();
        $this->notificationModel = new NotificationModel();
    }
    
    public function checkout() {
        requireCustomer();
        
        $customerId = $_SESSION['customer_id'];
        Logger::debug('OrderController::checkout - Start', ['customer_id' => $customerId]);
        Logger::addDebug('checkout_customer_id', $customerId);
        
        try {
            // 1. Get cart items from DB
            $cart = $this->cartModel->getCart($customerId);
            Logger::addDebug('checkout_cart', [
                'cart_id' => $cart['cart_id'],
                'item_count' => $cart['item_count'],
                'total' => $cart['total']
            ]);
            
            if (empty($cart['items'])) {
                jsonValidationError('Your cart is empty. Add items before checking out.');
            }
            
            // 2. Create order + order_details + clear cart — all in one transaction
            $order = $this->orderModel->createOrder($customerId, $cart['items'], $cart['cart_id']);
            
            Logger::debug('OrderController::checkout - Order created', ['order_id' => $order['order_id']]);
            
            // 3. Send notification (best-effort, don't fail checkout if this errors)
            try {
                $this->notificationModel->create(
                    getCurrentUserId(),
                    'Order Placed',
                    'Your order #' . $order['order_id'] . ' has been placed successfully. Total: ' . $order['total_amount']
                );
            } catch (\Throwable $e) {
                Logger::error('OrderController::checkout - Notification failed (non-fatal)', [
                    'error' => $e->getMessage()
                ]);
            }
            
            jsonResponse($order, 'Order placed successfully', 201);
            
        } catch (\Throwable $e) {
            Logger::error('OrderController::checkout - EXCEPTION', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            jsonServerError('Checkout failed: ' . (DEBUG_MODE ? $e->getMessage() : 'Please try again'));
        }
    }
    
    public function getOrders() {
        requireLogin();
        
        $role = getCurrentUserRole();
        $filters = [
            'status' => $_GET['status'] ?? '',
            'page' => $_GET['page'] ?? 1,
            'limit' => $_GET['limit'] ?? DEFAULT_PAGE_SIZE
        ];
        
        if ($role === 'Customer') {
            $customerId = $_SESSION['customer_id'];
            $orders = $this->orderModel->getCustomerOrders($customerId, $filters);
        } elseif ($role === 'Employee') {
            $employeeId = $_SESSION['employee_id'];
            $orders = $this->orderModel->getEmployeeOrders($employeeId, $filters);
        } else {
            jsonForbidden();
        }
        
        jsonResponse($orders);
    }
    
    public function getOrderById($orderId) {
        requireLogin();
        
        $role = getCurrentUserRole();
        
        if ($role === 'Customer') {
            $customerId = $_SESSION['customer_id'];
            $order = $this->orderModel->getById($orderId, $customerId);
        } elseif ($role === 'Employee' || $role === 'Admin') {
            $order = $this->orderModel->getById($orderId);
        } else {
            jsonForbidden();
        }
        
        jsonResponse($order);
    }
    
    public function updateStatus($orderId) {
        requireEmployee();
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        Validator::required($data['status'] ?? '', 'Status');
        
        $this->orderModel->updateStatus($orderId, $data['status'], getCurrentUserId());
        
        // Get order to send notification
        $order = $this->orderModel->getById($orderId);
        
        // Send notification to customer using the user_id from the joined query
        if (!empty($order['customer_user_id'])) {
            $this->notificationModel->create(
                $order['customer_user_id'],
                'Order Status Updated',
                'Your order #' . $orderId . ' status has been updated to: ' . $data['status']
            );
        }
        
        jsonResponse(null, 'Order status updated successfully');
    }
}
