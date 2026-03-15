<?php
/**
 * Input Validation Helpers
 */

class Validator {
    
    public static function required($value, $fieldName) {
        if (empty($value) && $value !== '0' && $value !== 0) {
            jsonValidationError("$fieldName is required");
        }
    }
    
    public static function email($value, $fieldName = 'Email') {
        if (!empty($value) && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
            jsonValidationError("$fieldName must be a valid email address");
        }
    }
    
    public static function minLength($value, $length, $fieldName) {
        if (strlen($value) < $length) {
            jsonValidationError("$fieldName must be at least $length characters");
        }
    }
    
    public static function maxLength($value, $length, $fieldName) {
        if (strlen($value) > $length) {
            jsonValidationError("$fieldName must not exceed $length characters");
        }
    }
    
    public static function numeric($value, $fieldName) {
        if (!is_numeric($value)) {
            jsonValidationError("$fieldName must be a number");
        }
    }
    
    public static function positive($value, $fieldName) {
        if ($value <= 0) {
            jsonValidationError("$fieldName must be greater than 0");
        }
    }
    
    public static function inArray($value, $array, $fieldName) {
        if (!in_array($value, $array)) {
            jsonValidationError("$fieldName has an invalid value");
        }
    }
    
    public static function sanitize($value) {
        return htmlspecialchars(strip_tags(trim($value)), ENT_QUOTES, 'UTF-8');
    }
    
    public static function sanitizeArray($data) {
        $sanitized = [];
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $sanitized[$key] = self::sanitizeArray($value);
            } else {
                $sanitized[$key] = self::sanitize($value);
            }
        }
        return $sanitized;
    }
}
