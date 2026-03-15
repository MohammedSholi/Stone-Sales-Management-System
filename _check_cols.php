<?php
require_once __DIR__ . '/ssms-backend/config/config.php';
require_once __DIR__ . '/ssms-backend/config/database.php';
header('Content-Type: application/json');
$db = Database::getInstance()->getConnection();

$stmt = $db->query("DESCRIBE stones");
$stonesCols = array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'Field');

$stmt = $db->query("DESCRIBE orders");
$ordersCols = array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'Field');

$stmt = $db->query("DESCRIBE order_details");
$detailsCols = array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'Field');

$stmt = $db->query("DESCRIBE cart_items");
$cartCols = array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'Field');

$stmt = $db->query("SELECT COUNT(*) as cnt FROM stones");
$count = $stmt->fetch(PDO::FETCH_ASSOC);

echo json_encode([
    'stones' => $stonesCols,
    'orders' => $ordersCols,
    'order_details' => $detailsCols,
    'cart_items' => $cartCols,
    'stones_count' => $count['cnt']
], JSON_PRETTY_PRINT);
