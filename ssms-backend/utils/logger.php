<?php
/**
 * Logger Utility
 * Handles application logging for debugging
 */

class Logger {
    private static $debugData = [];
    
    /**
     * Write log entry to file
     */
    public static function writeLog($level, $message, $context = []) {
        if (!defined('LOGS_DIR')) {
            return;
        }
        
        // Create logs directory if it doesn't exist
        if (!file_exists(LOGS_DIR)) {
            mkdir(LOGS_DIR, 0755, true);
        }
        
        $logFile = LOGS_DIR . 'app.log';
        $timestamp = date('Y-m-d H:i:s');
        
        // Sanitize context (remove passwords)
        $safeContext = self::sanitizeContext($context);
        
        $logEntry = sprintf(
            "[%s] %s: %s %s\n",
            $timestamp,
            strtoupper($level),
            $message,
            !empty($safeContext) ? json_encode($safeContext) : ''
        );
        
        file_put_contents($logFile, $logEntry, FILE_APPEND);
    }
    
    /**
     * Log info level message
     */
    public static function info($message, $context = []) {
        self::writeLog('info', $message, $context);
    }
    
    /**
     * Log error level message
     */
    public static function error($message, $context = []) {
        self::writeLog('error', $message, $context);
    }
    
    /**
     * Log debug level message
     */
    public static function debug($message, $context = []) {
        if (DEBUG_MODE) {
            self::writeLog('debug', $message, $context);
        }
    }
    
    /**
     * Add debug data to be included in response
     */
    public static function addDebug($key, $value) {
        if (DEBUG_MODE) {
            self::$debugData[$key] = $value;
        }
    }
    
    /**
     * Get all debug data
     */
    public static function getDebugData() {
        return self::$debugData;
    }
    
    /**
     * Clear debug data
     */
    public static function clearDebug() {
        self::$debugData = [];
    }
    
    /**
     * Sanitize context data (remove sensitive info)
     */
    private static function sanitizeContext($context) {
        if (!is_array($context)) {
            return $context;
        }
        
        $sanitized = $context;
        $sensitiveKeys = ['password', 'password_hash', 'token', 'secret', 'api_key'];
        
        foreach ($sensitiveKeys as $key) {
            if (isset($sanitized[$key])) {
                $sanitized[$key] = '***REDACTED***';
            }
        }
        
        // Recursively sanitize nested arrays
        foreach ($sanitized as $k => $v) {
            if (is_array($v)) {
                $sanitized[$k] = self::sanitizeContext($v);
            }
        }
        
        return $sanitized;
    }
    
    /**
     * Log incoming HTTP request
     */
    public static function logRequest() {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN';
        $uri = $_SERVER['REQUEST_URI'] ?? '';
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        
        $rawBody = file_get_contents('php://input');
        $bodyLength = strlen($rawBody);
        
        $parsedBody = null;
        if ($contentType === 'application/json' || strpos($contentType, 'application/json') !== false) {
            $parsedBody = json_decode($rawBody, true);
        }
        
        $requestData = [
            'method' => $method,
            'uri' => $uri,
            'content_type' => $contentType,
            'body_length' => $bodyLength,
            'parsed_body' => self::sanitizeContext($parsedBody),
            'session_user_id' => $_SESSION['user_id'] ?? null,
        ];
        
        self::debug('Incoming Request', $requestData);
        self::addDebug('request', $requestData);
        
        return $parsedBody;
    }
}
