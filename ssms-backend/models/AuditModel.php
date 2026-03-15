<?php
/**
 * Audit Log Model
 * Handles audit logging for admin actions
 */

class AuditModel {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    public function log($userId, $action, $tableName, $recordId = null) {
        $stmt = $this->db->prepare("
            INSERT INTO audit_log (user_id, action, table_name, record_id, created_at)
            VALUES (?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$userId, $action, $tableName, $recordId]);
        
        return $this->db->lastInsertId();
    }
    
    public function getLogs($filters = []) {
        $query = "
            SELECT al.*, u.username, u.full_name
            FROM audit_log al
            LEFT JOIN users u ON al.user_id = u.user_id
            WHERE 1=1
        ";
        $params = [];
        
        if (!empty($filters['user_id'])) {
            $query .= " AND al.user_id = ?";
            $params[] = $filters['user_id'];
        }
        
        if (!empty($filters['table_name'])) {
            $query .= " AND al.table_name = ?";
            $params[] = $filters['table_name'];
        }
        
        if (!empty($filters['from_date'])) {
            $query .= " AND al.created_at >= ?";
            $params[] = $filters['from_date'];
        }
        
        if (!empty($filters['to_date'])) {
            $query .= " AND al.created_at <= ?";
            $params[] = $filters['to_date'];
        }
        
        $query .= " ORDER BY al.created_at DESC LIMIT 100";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute($params);
        
        return $stmt->fetchAll();
    }
}
