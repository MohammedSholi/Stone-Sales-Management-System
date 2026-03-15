<?php
/**
 * Notification Model
 * Handles user notification operations
 */

class NotificationModel {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    public function create($userId, $title, $body) {
        $stmt = $this->db->prepare("
            INSERT INTO notifications (user_id, title, body, is_read, created_at)
            VALUES (?, ?, ?, 0, NOW())
        ");
        $stmt->execute([$userId, $title, $body]);
        
        return $this->db->lastInsertId();
    }
    
    public function getUserNotifications($userId, $unreadOnly = false) {
        $query = "SELECT * FROM notifications WHERE user_id = ?";
        $params = [$userId];
        
        if ($unreadOnly) {
            $query .= " AND is_read = 0";
        }
        
        $query .= " ORDER BY created_at DESC LIMIT 50";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute($params);
        
        return $stmt->fetchAll();
    }
    
    public function markAsRead($notificationId, $userId) {
        $stmt = $this->db->prepare("
            UPDATE notifications 
            SET is_read = 1 
            WHERE notification_id = ? AND user_id = ?
        ");
        $stmt->execute([$notificationId, $userId]);
        
        return $stmt->rowCount() > 0;
    }
    
    public function markAllAsRead($userId) {
        $stmt = $this->db->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?");
        $stmt->execute([$userId]);
        
        return $stmt->rowCount();
    }
    
    public function getUnreadCount($userId) {
        $stmt = $this->db->prepare("SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0");
        $stmt->execute([$userId]);
        $result = $stmt->fetch();
        
        return $result['count'];
    }
}
