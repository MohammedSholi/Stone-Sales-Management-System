<?php
/**
 * Customer Account Controller
 * Handles profile, settings, addresses, payment methods, and security actions.
 */

require_once __DIR__ . '/../models/CustomerAccountModel.php';

class CustomerAccountController {
    private $accountModel;

    public function __construct() {
        $modelClass = 'CustomerAccountModel';
        $this->accountModel = new $modelClass();
    }

    public function getProfile() {
        requireCustomer();
        jsonResponse($this->accountModel->getProfileBundle(getCurrentUserId()));
    }

    public function updateProfile() {
        requireCustomer();
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        jsonResponse($this->accountModel->updateProfile(getCurrentUserId(), $data), 'Profile updated successfully');
    }

    public function uploadAvatar() {
        requireCustomer();

        if (empty($_FILES['avatar'])) {
            jsonValidationError('Avatar image is required');
        }

        $avatarUrl = Uploader::uploadImage($_FILES['avatar'], 'avatars/');
        $this->accountModel->updateAvatar(getCurrentUserId(), $avatarUrl);

        jsonResponse(['avatar_url' => $avatarUrl], 'Profile image updated successfully');
    }

    public function changePassword() {
        requireCustomer();
        $data = json_decode(file_get_contents('php://input'), true) ?: [];

        Validator::required($data['current_password'] ?? '', 'Current password');
        Validator::required($data['new_password'] ?? '', 'New password');
        Validator::required($data['confirm_password'] ?? '', 'Confirm password');

        if (($data['new_password'] ?? '') !== ($data['confirm_password'] ?? '')) {
            jsonValidationError('Passwords do not match');
        }

        Validator::minLength($data['new_password'], 8, 'New password');

        if (!$this->accountModel->verifyCurrentPassword(getCurrentUserId(), $data['current_password'])) {
            jsonValidationError('Current password is incorrect');
        }

        $this->accountModel->updatePassword(getCurrentUserId(), $data['new_password']);
        jsonResponse(null, 'Password updated successfully');
    }

    public function getSettings() {
        requireCustomer();
        jsonResponse($this->accountModel->getSettingsBundle(getCurrentUserId()));
    }

    public function updateSettings() {
        requireCustomer();
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        jsonResponse($this->accountModel->updateSettings(getCurrentUserId(), $data), 'Settings saved successfully');
    }

    public function listAddresses() {
        requireCustomer();
        jsonResponse($this->accountModel->getSettingsBundle(getCurrentUserId())['addresses']);
    }

    public function saveAddress() {
        requireCustomer();
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $address = $this->accountModel->saveAddress(getCurrentUserId(), $data);
        jsonResponse($address, 'Address saved successfully', !empty($data['address_id']) ? 200 : 201);
    }

    public function deleteAddress($addressId) {
        requireCustomer();
        if (!$this->accountModel->deleteAddress(getCurrentUserId(), $addressId)) {
            jsonNotFound('Address not found');
        }
        jsonResponse(null, 'Address deleted successfully');
    }

    public function listPaymentMethods() {
        requireCustomer();
        jsonResponse($this->accountModel->getSettingsBundle(getCurrentUserId())['payment_methods']);
    }

    public function savePaymentMethod() {
        requireCustomer();
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $payment = $this->accountModel->savePaymentMethod(getCurrentUserId(), $data);
        jsonResponse($payment, 'Payment method saved successfully', 201);
    }

    public function deletePaymentMethod($paymentMethodId) {
        requireCustomer();
        if (!$this->accountModel->deletePaymentMethod(getCurrentUserId(), $paymentMethodId)) {
            jsonNotFound('Payment method not found');
        }
        jsonResponse(null, 'Payment method removed successfully');
    }

    public function setDefaultPaymentMethod($paymentMethodId) {
        requireCustomer();
        $method = $this->accountModel->setDefaultPaymentMethod(getCurrentUserId(), $paymentMethodId);
        jsonResponse($method, 'Default payment method updated successfully');
    }

    public function getSessions() {
        requireCustomer();
        jsonResponse($this->accountModel->getSettingsBundle(getCurrentUserId())['sessions']);
    }

    public function logoutAllSessions() {
        requireCustomer();
        $this->accountModel->revokeAllSessions(getCurrentUserId());
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_destroy();
        }
        jsonResponse(null, 'Signed out from all devices');
    }

    public function deactivateAccount() {
        requireCustomer();
        $data = json_decode(file_get_contents('php://input'), true) ?: [];

        Validator::required($data['current_password'] ?? '', 'Current password');
        if (!$this->accountModel->verifyCurrentPassword(getCurrentUserId(), $data['current_password'])) {
            jsonValidationError('Current password is incorrect');
        }

        $this->accountModel->deactivateAccount(getCurrentUserId(), false);
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_destroy();
        }
        jsonResponse(null, 'Account deactivated successfully');
    }

    public function deleteAccount() {
        requireCustomer();
        $data = json_decode(file_get_contents('php://input'), true) ?: [];

        Validator::required($data['current_password'] ?? '', 'Current password');
        if (!$this->accountModel->verifyCurrentPassword(getCurrentUserId(), $data['current_password'])) {
            jsonValidationError('Current password is incorrect');
        }

        $this->accountModel->deactivateAccount(getCurrentUserId(), true);
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_destroy();
        }
        jsonResponse(null, 'Account deleted successfully');
    }
}