<?php
/**
 * File Upload Helper
 * Handles image uploads with validation
 */

class Uploader {
    
    public static function uploadImage($file, $subdir = '') {
        // Check if file was uploaded
        if (!isset($file) || $file['error'] === UPLOAD_ERR_NO_FILE) {
            return null;
        }
        
        // Check for upload errors
        if ($file['error'] !== UPLOAD_ERR_OK) {
            jsonValidationError('File upload failed');
        }
        
        // Validate file size
        if ($file['size'] > MAX_FILE_SIZE) {
            jsonValidationError('File size exceeds maximum allowed (' . (MAX_FILE_SIZE / 1024 / 1024) . 'MB)');
        }
        
        // Validate file type
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        
        if (!in_array($mimeType, ALLOWED_IMAGE_TYPES)) {
            jsonValidationError('Invalid file type. Only JPG, PNG, and WebP images are allowed');
        }
        
        // Validate file extension
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($extension, ALLOWED_EXTENSIONS)) {
            jsonValidationError('Invalid file extension');
        }
        
        // Generate unique filename
        $filename = uniqid() . '_' . time() . '.' . $extension;
        
        // Create upload directory if it doesn't exist
        $uploadPath = UPLOAD_DIR . $subdir;
        if (!is_dir($uploadPath)) {
            mkdir($uploadPath, 0755, true);
        }
        
        $destination = $uploadPath . $filename;
        
        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $destination)) {
            jsonServerError('Failed to save uploaded file');
        }
        
        // Return URL
        return UPLOAD_URL . $subdir . $filename;
    }
    
    public static function deleteImage($imageUrl) {
        if (empty($imageUrl)) {
            return;
        }
        
        // Extract filename from URL
        $filename = str_replace(UPLOAD_URL, '', $imageUrl);
        $filepath = UPLOAD_DIR . $filename;
        
        if (file_exists($filepath)) {
            unlink($filepath);
        }
    }
}
