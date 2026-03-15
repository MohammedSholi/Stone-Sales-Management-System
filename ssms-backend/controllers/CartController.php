<?php
/**
 * Cart Controller
 * Handles shopping cart operations
 */

class CartController {
    private $cartModel;
    
    public function __construct() {
        $this->cartModel = new CartModel();
    }
    
    public function getCart() {
        requireCustomer();
        
        $customerId = $_SESSION['customer_id'];
        $cart = $this->cartModel->getCart($customerId);
        
        jsonResponse($cart);
    }
    
    public function addItem() {
        requireCustomer();
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        Validator::required($data['stone_id'] ?? '', 'Stone ID');
        Validator::numeric($data['stone_id'], 'Stone ID');
        
        Validator::required($data['quantity'] ?? '', 'Quantity');
        Validator::numeric($data['quantity'], 'Quantity');
        Validator::positive($data['quantity'], 'Quantity');
        
        $customerId = $_SESSION['customer_id'];
        $stoneId = intval($data['stone_id']);
        $quantity = intval($data['quantity']);
        
        $cart = $this->cartModel->addItem($customerId, $stoneId, $quantity);
        
        jsonResponse($cart, 'Item added to cart');
    }
    
    public function updateItem($cartItemId) {
        requireCustomer();
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        Validator::required($data['quantity'] ?? '', 'Quantity');
        Validator::numeric($data['quantity'], 'Quantity');
        Validator::positive($data['quantity'], 'Quantity');
        
        $customerId = $_SESSION['customer_id'];
        $quantity = intval($data['quantity']);
        
        $cart = $this->cartModel->updateItemQuantity($customerId, $cartItemId, $quantity);
        
        jsonResponse($cart, 'Cart updated');
    }
    
    public function removeItem($cartItemId) {
        requireCustomer();
        
        $customerId = $_SESSION['customer_id'];
        
        $cart = $this->cartModel->removeItem($customerId, $cartItemId);
        
        jsonResponse($cart, 'Item removed from cart');
    }
    
    public function clearCart() {
        requireCustomer();
        
        $customerId = $_SESSION['customer_id'];
        
        $this->cartModel->clearCart($customerId);
        
        jsonResponse(null, 'Cart cleared');
    }
}
