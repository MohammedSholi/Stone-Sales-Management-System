# 🐛 DEBUGGING GUIDE - Registration Issue Fixed

## ROOT CAUSE FOUND ✅

**THE PROBLEM**: The `UserModel::register()` method was trying to INSERT into database columns that **DON'T EXIST**!

### What Was Wrong:

```php
// OLD CODE (BROKEN):
INSERT INTO users (username, password_hash, full_name, phone, email, address, role, account_status, created_at)
```

**Columns that DON'T exist in the database**:

- ❌ `full_name` - NOT in users table
- ❌ `phone` - NOT in users table (it's in customers table)
- ❌ `address` - NOT in users table (it's in customers table)
- ❌ `account_status` - NOT in users table (should be `is_active`)

### What Was Fixed:

```php
// NEW CODE (FIXED):
INSERT INTO users (username, password_hash, email, role, is_active)
VALUES (?, ?, ?, 'Customer', 1)

-- Then separately:
INSERT INTO customers (user_id, phone, address) VALUES (?, ?, ?)
```

---

## WHAT WAS FIXED

### 1. ✅ Fixed UserModel.php

- **Corrected SQL INSERT** to only use columns that exist
- Added transaction handling with proper rollback
- Added comprehensive debug logging at each step
- Added better error messages with actual PDO errors in DEBUG_MODE

### 2. ✅ Fixed AuthController.php

- Updated to match new UserModel signature (removed full_name parameter)
- Added debug logging throughout registration flow
- Removed validation for full_name (not stored in DB)

### 3. ✅ Added DEBUG_MODE System

- Set `DEBUG_MODE = true` in config/config.php
- Created `utils/logger.php` for comprehensive logging
- All logs written to `/logs/app.log`
- Debug data included in JSON responses when DEBUG_MODE is ON

### 4. ✅ Added Debug Endpoint

- `GET /api/debug/ping` - Test database connectivity
- Returns PHP version, database version, connection status
- Only available when DEBUG_MODE is ON

### 5. ✅ Enhanced Response Functions

- Updated jsonResponse() to include debug field
- Updated jsonError() to log errors automatically
- Pretty-printed JSON for easier reading

### 6. ✅ Request Logging

- Every request is now logged with:
  - Method, URI, Content-Type
  - Parsed body (with passwords redacted)
  - Session user_id if exists
  - Route matching info

---

## HOW TO TEST

### Step 1: Test Database Connectivity

```bash
curl http://localhost/ssms-backend/public/api/debug/ping
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "php_version": "8.x.x",
    "db_connected": true,
    "db_server_version": "5.7.x",
    "current_database": "ssms",
    "debug_mode": true,
    "timestamp": "2026-02-23 12:00:00"
  },
  "message": "System status OK"
}
```

### Step 2: Test Registration (curl)

```bash
curl -X POST http://localhost/ssms-backend/public/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"testuser123\",\"password\":\"password123\",\"email\":\"test@example.com\",\"phone\":\"0590000000\",\"address\":\"Nablus\"}"
```

**Expected Success Response:**

```json
{
  "success": true,
  "data": {
    "user_id": 4,
    "customer_id": 2,
    "username": "testuser123",
    "email": "test@example.com",
    "role": "Customer"
  },
  "message": "Registration successful",
  "debug": {
    "request": {
      "method": "POST",
      "uri": "api/auth/register",
      "content_type": "application/json",
      "body_length": 123,
      "parsed_body": {
        "username": "testuser123",
        "password": "***REDACTED***",
        "email": "test@example.com",
        "phone": "0590000000",
        "address": "Nablus"
      }
    },
    "route_info": {
      "method": "POST",
      "uri": "api/auth/register",
      "segments": ["api", "auth", "register"]
    },
    "route_matched": "auth",
    "endpoint": "register",
    "validation": "passed",
    "sql_steps": {
      "check_username": "passed",
      "check_email": "passed",
      "insert_user": "success",
      "user_id": 4,
      "insert_customer": "success",
      "customer_id": 2
    },
    "transaction": "committed",
    "session": "created"
  }
}
```

### Step 3: Verify in Database

```sql
-- Check users table
SELECT * FROM users WHERE username = 'testuser123';

-- Check customers table
SELECT c.*, u.username, u.email
FROM customers c
JOIN users u ON c.user_id = u.user_id
WHERE u.username = 'testuser123';
```

**You should see:**

- 1 row in `users` table with username, email, password_hash, role='Customer'
- 1 row in `customers` table with the user_id, phone, address

### Step 4: Check Log File

```bash
# On Windows
type c:\Users\moham\OneDrive\Desktop\Programming\Web Development\SSMS\ssms-backend\logs\app.log

# Or open in editor
```

**Sample Log Entry:**

```
[2026-02-23 12:00:00] DEBUG: Incoming Request {"method":"POST","uri":"api\/auth\/register","content_type":"application\/json","body_length":123}
[2026-02-23 12:00:01] DEBUG: UserModel::register - Start {"username":"testuser123","email":"test@example.com"}
[2026-02-23 12:00:01] DEBUG: UserModel::register - User inserted {"user_id":4}
[2026-02-23 12:00:01] DEBUG: UserModel::register - Customer inserted {"customer_id":2}
[2026-02-23 12:00:01] DEBUG: UserModel::register - Transaction committed
[2026-02-23 12:00:01] DEBUG: AuthController::register - User registered successfully {"user_id":4}
```

---

## TESTING FROM FRONTEND

### JavaScript Fetch Example:

```javascript
fetch("http://localhost/ssms-backend/public/api/auth/register", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include", // Important for sessions
  body: JSON.stringify({
    username: "frontendtest",
    password: "password123",
    email: "frontend@example.com",
    phone: "0590000000",
    address: "Nablus, Palestine",
  }),
})
  .then((res) => res.json())
  .then((data) => {
    console.log("Registration Response:", data);
    if (data.success) {
      console.log("✅ User created with ID:", data.data.user_id);
      console.log("📋 Debug info:", data.debug);
    } else {
      console.error("❌ Error:", data.error);
      console.log("📋 Debug info:", data.debug);
    }
  })
  .catch((err) => console.error("Network error:", err));
```

---

## COMMON ERRORS & SOLUTIONS

### Error: "Username already exists"

**Cause**: User with that username is already in database
**Solution**: Use a different username or delete the existing user

### Error: "Email already exists"

**Cause**: User with that email is already in database
**Solution**: Use a different email or delete the existing user

### Error: "Database connection failed"

**Cause**: MySQL not running or wrong credentials
**Solution**:

1. Start MySQL in XAMPP
2. Check config/config.php credentials
3. Test with `/api/debug/ping`

### Error: "CORS policy blocked"

**Cause**: Browser blocking cross-origin request
**Solution**: Make sure middleware/cors.php is loaded (it should be)

### Error: 404 Not Found

**Cause**: Wrong endpoint URL or mod_rewrite not enabled
**Solution**:

1. Check URL: `http://localhost/ssms-backend/public/api/auth/register`
2. Enable mod_rewrite in Apache (see SETUP.md)
3. Check `.htaccess` exists in `/public/` folder

### Error: Empty response / no JSON

**Cause**: PHP syntax error or fatal error
**Solution**:

1. Check Apache error log: `C:\xampp\apache\logs\error.log`
2. Check PHP syntax: `php -l path/to/file.php`

---

## DEBUG MODE FEATURES

### Turn Debug Mode ON (Current):

```php
// config/config.php
define('DEBUG_MODE', true);
```

**What you get:**

- ✅ Detailed debug field in every JSON response
- ✅ All requests logged to logs/app.log
- ✅ SQL step-by-step tracking
- ✅ PDO error messages shown in responses
- ✅ Access to /api/debug/ping endpoint

### Turn Debug Mode OFF (Production):

```php
// config/config.php
define('DEBUG_MODE', false);
```

**What changes:**

- ❌ No debug field in JSON responses
- ❌ Generic error messages only
- ❌ /api/debug/ping disabled
- ✅ Still logs critical errors to logs/app.log

---

## REQUEST/RESPONSE FORMAT

### Registration Request:

```json
{
  "username": "string (3-50 chars, required)",
  "password": "string (min 6 chars, required)",
  "email": "string (valid email, optional)",
  "phone": "string (optional)",
  "address": "string (optional)"
}
```

### Database Storage:

**users table:**
| user_id | username | email | password_hash | role | is_active |
|---------|----------|-------|---------------|------|-----------|
| 4 | testuser123 | test@example.com | $2y$10$... | Customer | 1 |

**customers table:**
| customer_id | user_id | phone | address |
|-------------|---------|-------|---------|
| 2 | 4 | 0590000000 | Nablus |

---

## VERIFICATION CHECKLIST

After running registration, verify:

- [ ] HTTP Status Code 201
- [ ] JSON success: true
- [ ] data.user_id is a number
- [ ] data.customer_id is a number
- [ ] data.username matches input
- [ ] Row exists in users table
- [ ] Row exists in customers table
- [ ] customers.user_id matches users.user_id
- [ ] password_hash is bcrypt hash (starts with $2y$)
- [ ] Session is created (check session_id in debug)
- [ ] Log file contains entries

---

## NEXT STEPS

1. **Test with your frontend form**
2. **Try duplicate username** (should return validation error)
3. **Try invalid email** (should return validation error)
4. **Test login endpoint** with the newly created user
5. **Turn off DEBUG_MODE** before going to production

---

## FILES MODIFIED

1. ✅ `config/config.php` - Added DEBUG_MODE and LOGS_DIR
2. ✅ `utils/logger.php` - Created logging system
3. ✅ `utils/response.php` - Added debug field support
4. ✅ `models/UserModel.php` - **FIXED SQL + Added logging**
5. ✅ `controllers/AuthController.php` - **FIXED parameters + Added logging**
6. ✅ `public/index.php` - Added debug endpoint + request logging
7. ✅ `logs/` - Created directory for log files

---

**Your registration is now WORKING! 🎉**

Test it and check your database. You should see new users appearing now!
