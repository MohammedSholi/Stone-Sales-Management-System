<?php
/**
 * Notification Controller
 * Handles user notification operations
 */

class NotificationController {
    private $notificationModel;
    
    public function __construct() {
        $this->notificationModel = new NotificationModel();
    }
    
    public function getNotifications() {
        requireLogin();
        
        $userId = getCurrentUserId();
        $unreadOnly = isset($_GET['unread']) ? filter_var($_GET['unread'], FILTER_VALIDATE_BOOLEAN) : false;
        
        $notifications = $this->notificationModel->getUserNotifications($userId, $unreadOnly);
        $unreadCount = $this->notificationModel->getUnreadCount($userId);
        
        jsonResponse([
            'notifications' => $notifications,
            'unread_count' => $unreadCount
        ]);
    }
    
    public function markAsRead($notificationId) {
        requireLogin();
        
        $userId = getCurrentUserId();
        
        $success = $this->notificationModel->markAsRead($notificationId, $userId);
        
        if (!$success) {
            jsonNotFound('Notification not found');
        }
        
        jsonResponse(null, 'Notification marked as read');
    }
    
    public function markAllAsRead() {
        requireLogin();
        
        $userId = getCurrentUserId();
        
        $count = $this->notificationModel->markAllAsRead($userId);
        
        jsonResponse(['count' => $count], "$count notifications marked as read");
    }
}
