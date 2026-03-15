<?php
/**
 * Cart Model
 * Handles shopping cart operations with MySQL persistence
 */

class CartModel {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }
    
    /**
     * Get existing cart or create one for the customer
     */
    public function getOrCreateCart($customerId) {
        Logger::debug('CartModel::getOrCreateCart', ['customer_id' => $customerId]);
        
        $stmt = $this->db->prepare("SELECT cart_id FROM carts WHERE customer_id = ?");
        $stmt->execute([$customerId]);
        $cart = $stmt->fetch();
        
        if ($cart) {
            Logger::debug('CartModel::getOrCreateCart - Found existing cart', ['cart_id' => $cart['cart_id']]);
            return $cart['cart_id'];
        }
        
        $stmt = $this->db->prepare("INSERT INTO carts (customer_id, created_at) VALUES (?, NOW())");
        $stmt->execute([$customerId]);
        $cartId = $this->db->lastInsertId();
        
        Logger::debug('CartModel::getOrCreateCart - Created new cart', ['cart_id' => $cartId]);
        return $cartId;
    }
    
    /**
     * Get full cart with items for a customer
     */
    public function getCart($customerId) {
        Logger::debug('CartModel::getCart', ['customer_id' => $customerId]);
        $cartId = $this->getOrCreateCart($customerId);
        
        $stmt = $this->db->prepare("
            SELECT ci.cart_item_id, ci.cart_id, ci.stone_id, ci.quantity, ci.unit_price,
                   s.name, s.type, s.size, s.image_url, s.quantity_in_stock,
                   (ci.quantity * ci.unit_price) as subtotal
            FROM cart_items ci
            JOIN stones s ON ci.stone_id = s.stone_id
            WHERE ci.cart_id = ? AND s.is_active = 1
            ORDER BY ci.created_at DESC
        ");
        $stmt->execute([$cartId]);
        $items = $stmt->fetchAll();
        
        $total = 0;
        foreach ($items as $item) {
            $total += (float)$item['subtotal'];
        }
        
        Logger::debug('CartModel::getCart - Result', [
            'cart_id' => $cartId,
            'item_count' => count($items),
            'total' => $total
        ]);
        
        return [
            'cart_id' => $cartId,
            'items' => $items,
            'total' => round($total, 2),
            'item_count' => count($items)
        ];
    }
    
    /**
     * Add an item to the cart (or update quantity if already present)
     */
    public function addItem($customerId, $stoneId, $quantity) {
        Logger::debug('CartModel::addItem', [
            'customer_id' => $customerId,
            'stone_id' => $stoneId,
            'quantity' => $quantity
        ]);
        
        $cartId = $this->getOrCreateCart($customerId);
        
        // Validate stone exists and is active
        $stoneStmt = $this->db->prepare(
            "SELECT stone_id, price_per_unit, quantity_in_stock FROM stones WHERE stone_id = ? AND is_active = 1"
        );
        $stoneStmt->execute([$stoneId]);
        $stone = $stoneStmt->fetch();
        
        if (!$stone) {
            Logger::debug('CartModel::addItem - Stone not found or inactive', ['stone_id' => $stoneId]);
            jsonNotFound('Stone not found or unavailable');
        }
        
        if ($stone['quantity_in_stock'] < $quantity) {
            Logger::debug('CartModel::addItem - Insufficient stock', [
                'requested' => $quantity,
                'available' => $stone['quantity_in_stock']
            ]);
            jsonValidationError('Insufficient stock. Only ' . $stone['quantity_in_stock'] . ' available.');
        }
        
        // Check if item already exists in cart
        $stmt = $this->db->prepare("SELECT cart_item_id, quantity FROM cart_items WHERE cart_id = ? AND stone_id = ?");
        $stmt->execute([$cartId, $stoneId]);
        $existingItem = $stmt->fetch();
        
        if ($existingItem) {
            $newQuantity = $existingItem['quantity'] + $quantity;
            if ($stone['quantity_in_stock'] < $newQuantity) {
                jsonValidationError('Insufficient stock for total quantity. Only ' . $stone['quantity_in_stock'] . ' available.');
            }
            
            $stmt = $this->db->prepare("UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?");
            $stmt->execute([$newQuantity, $existingItem['cart_item_id']]);
            Logger::debug('CartModel::addItem - Updated existing item', [
                'cart_item_id' => $existingItem['cart_item_id'],
                'old_qty' => $existingItem['quantity'],
                'new_qty' => $newQuantity
            ]);
        } else {
            $stmt = $this->db->prepare("
                INSERT INTO cart_items (cart_id, stone_id, quantity, unit_price, created_at)
                VALUES (?, ?, ?, ?, NOW())
            ");
            $stmt->execute([$cartId, $stoneId, $quantity, $stone['price_per_unit']]);
            Logger::debug('CartModel::addItem - Inserted new item', [
                'cart_item_id' => $this->db->lastInsertId(),
                'unit_price' => $stone['price_per_unit']
            ]);
        }
        
        return $this->getCart($customerId);
    }
    
    /**
     * Update the quantity of a specific cart item
     */
    public function updateItemQuantity($customerId, $cartItemId, $quantity) {
        Logger::debug('CartModel::updateItemQuantity', [
            'customer_id' => $customerId,
            'cart_item_id' => $cartItemId,
            'new_quantity' => $quantity
        ]);
        
        $cartId = $this->getOrCreateCart($customerId);
        
        // Verify item belongs to customer's cart and get stock
        $stmt = $this->db->prepare("
            SELECT ci.stone_id, s.quantity_in_stock
            FROM cart_items ci
            JOIN stones s ON ci.stone_id = s.stone_id
            WHERE ci.cart_item_id = ? AND ci.cart_id = ?
        ");
        $stmt->execute([$cartItemId, $cartId]);
        $item = $stmt->fetch();
        
        if (!$item) {
            jsonNotFound('Cart item not found');
        }
        
        if ($item['quantity_in_stock'] < $quantity) {
            jsonValidationError('Insufficient stock. Only ' . $item['quantity_in_stock'] . ' available.');
        }
        
        $stmt = $this->db->prepare("UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?");
        $stmt->execute([$quantity, $cartItemId]);
        
        Logger::debug('CartModel::updateItemQuantity - Updated', ['cart_item_id' => $cartItemId, 'quantity' => $quantity]);
        
        return $this->getCart($customerId);
    }
    
    /**
     * Remove a single item from the cart
     */
    public function removeItem($customerId, $cartItemId) {
        Logger::debug('CartModel::removeItem', ['customer_id' => $customerId, 'cart_item_id' => $cartItemId]);
        
        $cartId = $this->getOrCreateCart($customerId);
        
        $stmt = $this->db->prepare("DELETE FROM cart_items WHERE cart_item_id = ? AND cart_id = ?");
        $stmt->execute([$cartItemId, $cartId]);
        
        if ($stmt->rowCount() === 0) {
            jsonNotFound('Cart item not found');
        }
        
        Logger::debug('CartModel::removeItem - Deleted', ['cart_item_id' => $cartItemId]);
        return $this->getCart($customerId);
    }
    
    /**
     * Clear all items from a customer's cart
     */
    public function clearCart($customerId) {
        Logger::debug('CartModel::clearCart', ['customer_id' => $customerId]);
        
        $cartId = $this->getOrCreateCart($customerId);
        
        $stmt = $this->db->prepare("DELETE FROM cart_items WHERE cart_id = ?");
        $stmt->execute([$cartId]);
        
        $deleted = $stmt->rowCount();
        Logger::debug('CartModel::clearCart - Cleared', ['deleted_items' => $deleted]);
        
        return $deleted;
    }
    
    /**
     * Clear cart items by cart_id (used inside transactions)
     */
    public function clearCartByCartId($cartId) {
        $stmt = $this->db->prepare("DELETE FROM cart_items WHERE cart_id = ?");
        $stmt->execute([$cartId]);
        return $stmt->rowCount();
    }
}
