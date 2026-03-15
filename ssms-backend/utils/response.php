<?php
/**
 * JSON Response Helper Functions
 * Standardized API responses
 */

function jsonResponse($data = null, $message = '', $statusCode = 200) {
    http_response_code($statusCode);
    
    $response = [
        'success' => true,
        'data' => $data,
        'message' => $message
    ];
    
    // Add debug data if DEBUG_MODE is enabled
    if (defined('DEBUG_MODE') && DEBUG_MODE && class_exists('Logger')) {
        $debugData = Logger::getDebugData();
        if (!empty($debugData)) {
            $response['debug'] = $debugData;
        }
    }
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

function jsonError($code, $message, $statusCode = 400) {
    // Log error
    if (class_exists('Logger')) {
        Logger::error("API Error: $code - $message", ['status_code' => $statusCode]);
    }
    
    http_response_code($statusCode);
    
    $response = [
        'success' => false,
        'error' => [
            'code' => $code,
            'message' => $message
        ]
    ];
    
    // Add debug data if DEBUG_MODE is enabled
    if (defined('DEBUG_MODE') && DEBUG_MODE && class_exists('Logger')) {
        $debugData = Logger::getDebugData();
        if (!empty($debugData)) {
            $response['debug'] = $debugData;
        }
    }
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

function jsonUnauthorized($message = 'Authentication required') {
    jsonError('UNAUTHORIZED', $message, 401);
}

function jsonForbidden($message = 'Access denied') {
    jsonError('FORBIDDEN', $message, 403);
}

function jsonNotFound($message = 'Resource not found') {
    jsonError('NOT_FOUND', $message, 404);
}

function jsonValidationError($message) {
    jsonError('VALIDATION_ERROR', $message, 400);
}

function jsonServerError($message = 'Internal server error') {
    jsonError('SERVER_ERROR', $message, 500);
}
