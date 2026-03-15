<?php
/**
 * Review Model
 * Handles product review operations
 */

class ReviewModel {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    public function create($customerId, $stoneId, $rating, $comment) {
        // Check if customer has purchased this stone
        $stmt = $this->db->prepare("
            SELECT COUNT(*) as count
            FROM order_details od
            JOIN orders o ON od.order_id = o.order_id
            WHERE o.customer_id = ? AND od.stone_id = ? 
            AND o.order_status IN ('Completed', 'Delivered')
        ");
        $stmt->execute([$customerId, $stoneId]);
        $result = $stmt->fetch();
        
        if ($result['count'] == 0) {
            jsonValidationError('You can only review stones you have purchased');
        }
        
        // Check if already reviewed
        $stmt = $this->db->prepare("
            SELECT review_id FROM reviews 
            WHERE customer_id = ? AND stone_id = ?
        ");
        $stmt->execute([$customerId, $stoneId]);
        if ($stmt->fetch()) {
            jsonValidationError('You have already reviewed this stone');
        }
        
        // Create review
        $stmt = $this->db->prepare("
            INSERT INTO reviews (customer_id, stone_id, rating, comment, created_at, is_visible)
            VALUES (?, ?, ?, ?, NOW(), 1)
        ");
        $stmt->execute([$customerId, $stoneId, $rating, $comment]);
        
        return $this->getById($this->db->lastInsertId());
    }
    
    public function getById($reviewId) {
        $stmt = $this->db->prepare("
            SELECT r.*, u.full_name as customer_name, s.name as stone_name
            FROM reviews r
            JOIN customers c ON r.customer_id = c.customer_id
            JOIN users u ON c.user_id = u.user_id
            JOIN stones s ON r.stone_id = s.stone_id
            WHERE r.review_id = ?
        ");
        $stmt->execute([$reviewId]);
        
        return $stmt->fetch();
    }
    
    public function getStoneReviews($stoneId) {
        $stmt = $this->db->prepare("
            SELECT r.*, u.full_name as customer_name
            FROM reviews r
            JOIN customers c ON r.customer_id = c.customer_id
            JOIN users u ON c.user_id = u.user_id
            WHERE r.stone_id = ? AND r.is_visible = 1
            ORDER BY r.created_at DESC
        ");
        $stmt->execute([$stoneId]);
        $reviews = $stmt->fetchAll();
        
        // Calculate average rating
        $avgStmt = $this->db->prepare("
            SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
            FROM reviews
            WHERE stone_id = ? AND is_visible = 1
        ");
        $avgStmt->execute([$stoneId]);
        $stats = $avgStmt->fetch();
        
        return [
            'reviews' => $reviews,
            'average_rating' => round($stats['avg_rating'], 1),
            'review_count' => $stats['review_count']
        ];
    }
    
    public function toggleVisibility($reviewId, $isVisible) {
        $stmt = $this->db->prepare("UPDATE reviews SET is_visible = ? WHERE review_id = ?");
        $stmt->execute([$isVisible, $reviewId]);
        
        return $this->getById($reviewId);
    }
}
