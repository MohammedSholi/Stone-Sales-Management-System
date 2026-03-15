# SSMS Backend API

Backend REST API for Stone Sales Management System built with **PHP 8+** and **MySQL PDO**.

## Requirements

- PHP 8.0 or higher
- MySQL 5.7 or higher
- Apache with mod_rewrite enabled
- XAMPP/WAMP/LAMP (recommended)

## Installation

### 1. Copy Files

Copy the `ssms-backend` folder to your web server directory:

```
xampp/htdocs/ssms-backend/
```

### 2. Database Setup

Import the SQL schema into MySQL:

```sql
-- Create database
CREATE DATABASE ssms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Import tables (execute the ssms.sql file)
```

### 3. Configure Database Connection

Edit `/config/config.php` with your database credentials:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'ssms');
define('DB_USER', 'root');
define('DB_PASS', '');
```

### 4. Create Upload Directories

Create the following directories with write permissions:

```
ssms-backend/uploads/
ssms-backend/uploads/stones/
ssms-backend/uploads/requests/
```

On Linux/Mac:

```bash
mkdir -p uploads/stones uploads/requests
chmod -R 775 uploads
```

On Windows (XAMPP):
Right-click folders → Properties → Security → Edit → Allow "Modify" for Users

### 5. Enable Apache mod_rewrite

**XAMPP:**

- Edit `xampp/apache/conf/httpd.conf`
- Uncomment: `LoadModule rewrite_module modules/mod_rewrite.so`
- Find `AllowOverride None` and change to `AllowOverride All`
- Restart Apache

### 6. Test Installation

Navigate to:

```
http://localhost/ssms-backend/public/api/auth/me
```

Should return:

```json
{ "success": false, "error": "Not authenticated" }
```

## API Endpoints

Base URL: `http://localhost/ssms-backend/public/api`

### Authentication

#### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "1234567890",
  "address": "123 Main St"
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "password123"
}
```

#### Logout

```http
POST /api/auth/logout
```

#### Get Current User

```http
GET /api/auth/me
```

### Stones (Products)

#### Get All Stones

```http
GET /api/stones?search=marble&type=Natural&page=1&limit=12
```

#### Get Stone by ID

```http
GET /api/stones/{id}
```

#### Create Stone (Admin Only)

```http
POST /api/stones
Content-Type: application/json

{
  "name": "Italian Marble",
  "type": "Natural",
  "size": "12x12",
  "price_per_unit": 150.00,
  "available_quantity": 100,
  "description": "Premium marble"
}
```

#### Update Stone (Admin Only)

```http
PUT /api/stones/{id}
Content-Type: application/json

{
  "price_per_unit": 160.00,
  "available_quantity": 90
}
```

#### Delete Stone (Admin Only)

```http
DELETE /api/stones/{id}
```

#### Upload Stone Image (Admin Only)

```http
POST /api/stones/{id}/image
Content-Type: multipart/form-data

image: [file]
```

### Cart

#### Get Cart

```http
GET /api/cart
```

#### Add Item to Cart

```http
POST /api/cart
Content-Type: application/json

{
  "stone_id": 1,
  "quantity": 5
}
```

#### Update Cart Item Quantity

```http
PUT /api/cart/{cart_item_id}
Content-Type: application/json

{
  "quantity": 10
}
```

#### Remove Cart Item

```http
DELETE /api/cart/{cart_item_id}
```

#### Clear Cart

```http
DELETE /api/cart
```

### Orders

#### Checkout (Create Order)

```http
POST /api/checkout
```

#### Get Customer Orders

```http
GET /api/orders?status=Pending&page=1
```

#### Get Order by ID

```http
GET /api/orders/{id}
```

#### Update Order Status (Employee/Admin)

```http
PUT /api/orders/{id}/status
Content-Type: application/json

{
  "status": "Confirmed"
}
```

### Employee Routes

#### Get Employee Orders

```http
GET /api/employee/orders?status=Processing
```

### Admin Routes

#### Get All Orders

```http
GET /api/admin/orders?status=Pending&from_date=2024-01-01
```

#### Assign Order to Employee

```http
PUT /api/admin/orders/{id}/assign
Content-Type: application/json

{
  "employee_id": 2
}
```

#### Update Order Status

```http
PUT /api/admin/orders/{id}/status
Content-Type: application/json

{
  "status": "Delivered"
}
```

#### Get All Requests

```http
GET /api/admin/requests?status=Pending
```

#### Approve Request

```http
PUT /api/admin/requests/{id}/approve
```

#### Reject Request

```http
PUT /api/admin/requests/{id}/reject
```

#### Convert Request to Order

```http
POST /api/admin/requests/{id}/convert
```

#### Get Audit Logs

```http
GET /api/admin/audit-logs?user_id=1&table_name=stones
```

### Custom Requests

#### Create Request

```http
POST /api/requests
Content-Type: multipart/form-data

stone_name: Custom Granite
stone_type: Natural
size: 24x24
requested_quantity: 50
notes: Specific color required
reference_image: [file]
```

#### Get Customer Requests

```http
GET /api/requests
```

#### Get Request by ID

```http
GET /api/requests/{id}
```

### Reviews

#### Create Review

```http
POST /api/reviews
Content-Type: application/json

{
  "stone_id": 1,
  "rating": 5,
  "comment": "Excellent quality"
}
```

#### Get Stone Reviews

```http
GET /api/stones/{id}/reviews
```

### Notifications

#### Get Notifications

```http
GET /api/notifications?unread=true
```

#### Mark Notification as Read

```http
PUT /api/notifications/{id}/read
```

#### Mark All as Read

```http
PUT /api/notifications/read-all
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful"
}
```

### Error Response

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Error description"
}
```

## Error Codes

- `UNAUTHORIZED` (401) - Not authenticated
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `VALIDATION_ERROR` (400) - Invalid input data
- `SERVER_ERROR` (500) - Internal server error

## Authentication

The API uses **PHP sessions** for authentication. After login, the session is stored server-side and the `PHPSESSID` cookie is sent to the client.

Include the session cookie in all subsequent requests:

```javascript
fetch("http://localhost/ssms-backend/public/api/cart", {
  credentials: "include", // Important for CORS
});
```

## Security Features

- Password hashing with `password_hash()`
- Prepared statements (PDO) to prevent SQL injection
- Input validation and sanitization
- Role-based access control (Customer, Employee, Admin)
- File upload validation (type, size, extension)
- CORS headers for cross-origin requests

## File Upload Limits

- Allowed types: JPG, JPEG, PNG, WebP
- Maximum size: 5MB
- Stored in: `/uploads/stones/` or `/uploads/requests/`

## Database Triggers

The database has triggers for:

- Stock validation on order creation
- Automatic order status history logging
- Preventing negative quantities

## Development

### Disable Error Display (Production)

In `/public/index.php`, change:

```php
error_reporting(0);
ini_set('display_errors', 0);
```

### Enable HTTPS (Recommended)

Update CORS headers in `/middleware/cors.php` to restrict origins:

```php
header('Access-Control-Allow-Origin: https://yourdomain.com');
```

## Folder Structure

```
ssms-backend/
├── config/
│   ├── config.php          # App configuration
│   └── database.php        # PDO connection
├── middleware/
│   ├── cors.php            # CORS headers
│   └── auth.php            # Authentication
├── utils/
│   ├── response.php        # JSON responses
│   ├── validator.php       # Input validation
│   └── uploader.php        # File upload
├── models/
│   ├── UserModel.php
│   ├── StoneModel.php
│   ├── CartModel.php
│   ├── OrderModel.php
│   ├── RequestModel.php
│   ├── ReviewModel.php
│   ├── NotificationModel.php
│   └── AuditModel.php
├── controllers/
│   ├── AuthController.php
│   ├── StoneController.php
│   ├── CartController.php
│   ├── OrderController.php
│   ├── RequestController.php
│   ├── ReviewController.php
│   ├── NotificationController.php
│   └── AdminController.php
├── public/
│   ├── index.php           # Router (entry point)
│   └── .htaccess           # URL rewriting
├── uploads/
│   ├── stones/
│   └── requests/
└── README.md
```

## Troubleshooting

### "Headers already sent" error

- Make sure there's no whitespace before `<?php` in any file
- Check that no output (echo, print) occurs before headers

### Database connection failed

- Verify MySQL is running
- Check credentials in `/config/config.php`
- Ensure database `ssms` exists

### 404 on all routes

- Enable Apache mod_rewrite
- Ensure `.htaccess` is in `/public/` folder
- Check Apache AllowOverride is set to "All"

### Upload directory not writable

```bash
chmod -R 775 uploads
chown -R www-data:www-data uploads  # Linux/Mac
```

## License

Proprietary - Stone Sales Management System

## Support

For issues or questions, contact the development team.
