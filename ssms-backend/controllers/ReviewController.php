<?php
/**
 * Review Controller
 * Handles product review operations
 */

class ReviewController {
    private $reviewModel;
    
    public function __construct() {
        $this->reviewModel = new ReviewModel();
    }
    
    public function create() {
        requireCustomer();
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        Validator::required($data['stone_id'] ?? '', 'Stone ID');
        Validator::numeric($data['stone_id'], 'Stone ID');
        
        Validator::required($data['rating'] ?? '', 'Rating');
        Validator::numeric($data['rating'], 'Rating');
        
        if ($data['rating'] < 1 || $data['rating'] > 5) {
            jsonValidationError('Rating must be between 1 and 5');
        }
        
        Validator::required($data['comment'] ?? '', 'Comment');
        
        $customerId = $_SESSION['customer_id'];
        $stoneId = intval($data['stone_id']);
        $rating = intval($data['rating']);
        $comment = Validator::sanitize($data['comment']);
        
        $review = $this->reviewModel->create($customerId, $stoneId, $rating, $comment);
        
        jsonResponse($review, 'Review submitted successfully', 201);
    }
    
    public function getStoneReviews($stoneId) {
        $reviews = $this->reviewModel->getStoneReviews($stoneId);
        
        jsonResponse($reviews);
    }
}
