# SSMS Backend - Quick Setup Guide

## 🚀 Quick Setup (5 Minutes)

### Step 1: Place Files

1. Copy `ssms-backend` folder to `C:\xampp\htdocs\`
2. Your path should be: `C:\xampp\htdocs\ssms-backend\`

### Step 2: Start XAMPP

1. Open XAMPP Control Panel
2. Start **Apache** and **MySQL**

### Step 3: Import Database

1. Open browser → http://localhost/phpmyadmin
2. Click "New" to create database
3. Database name: `ssms`
4. Collation: `utf8mb4_unicode_ci`
5. Go to "Import" tab
6. Choose file: `ssms-backend/database/ssms.sql`
7. Click "Go"

### Step 4: Configure Database

1. Open `ssms-backend/config/config.php` in editor
2. Update if needed (default works for XAMPP):
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'ssms');
   define('DB_USER', 'root');
   define('DB_PASS', '');  // Empty for XAMPP
   ```

### Step 5: Test API

Open browser → http://localhost/ssms-backend/public/api/auth/me

Should see:

```json
{ "success": false, "error": "Not authenticated" }
```

✅ **Success!** Your backend is running.

---

## 📋 Default Login Credentials

### Admin Account

- **Username**: `admin`
- **Email**: `admin@ssms.com`
- **Password**: `Admin123!`

> If you need to reset or recreate the admin password, open:
> `http://localhost/ssms-backend/public/seed_admin.php`

### Employee Account

- **Username**: `employee1`
- **Email**: `employee1@ssms.com`
- **Password**: `password`

### Customer Account

- **Username**: `customer1`
- **Email**: `customer1@example.com`
- **Password**: `password`

---

## 🔧 Common Issues

### Issue: "Database connection failed"

**Solution**:

- Make sure MySQL is running in XAMPP
- Check database name is `ssms`
- Verify credentials in `config/config.php`

### Issue: "404 Not Found" on all routes

**Solution**:

- Enable mod_rewrite in Apache:
  1. Open `C:\xampp\apache\conf\httpd.conf`
  2. Find `LoadModule rewrite_module modules/mod_rewrite.so`
  3. Remove `#` at start (uncomment it)
  4. Save and restart Apache

### Issue: "Headers already sent"

**Solution**:

- Check no whitespace before `<?php` in files
- Make sure files are saved with UTF-8 NO BOM encoding

### Issue: Images not uploading

**Solution**:

- Right-click `uploads` folder → Properties
- Security tab → Edit → Allow "Modify" for Users
- Apply to folder and subfolders

---

## 📁 Folder Structure

```
ssms-backend/
├── config/          # Database and app configuration
├── middleware/      # Authentication and CORS
├── utils/           # Helper functions
├── models/          # Database operations
├── controllers/     # API endpoints
├── public/          # Entry point (index.php)
├── uploads/         # Uploaded images
├── database/        # SQL schema file
└── README.md        # Full documentation
```

---

## 🧪 Test the API

### Test 1: Register New User

```bash
curl -X POST http://localhost/ssms-backend/public/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "phone": "1234567890",
    "address": "123 Test St"
  }'
```

### Test 2: Login

```bash
curl -X POST http://localhost/ssms-backend/public/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password"
  }'
```

### Test 3: Get Stones (No auth required)

```bash
curl http://localhost/ssms-backend/public/api/stones
```

---

## 🔗 Connect Frontend

In your frontend JavaScript:

```javascript
// Set base API URL
const API_URL = "http://localhost/ssms-backend/public/api";

// Enable credentials for session cookies
fetch(`${API_URL}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include", // Important!
  body: JSON.stringify({ username: "admin", password: "password" }),
})
  .then((res) => res.json())
  .then((data) => console.log(data));
```

---

## 📖 Next Steps

1. **Read Full Documentation**: See `README.md` for complete API reference
2. **Test All Endpoints**: Use Postman or curl to test CRUD operations
3. **Connect Frontend**: Update frontend API calls to use real backend
4. **Change Passwords**: Update default passwords for security
5. **Enable HTTPS**: For production deployment

---

## 💡 Pro Tips

- Use **Postman** or **Thunder Client** (VS Code) for API testing
- Enable PHP error display during development:
  ```php
  // In public/index.php
  ini_set('display_errors', 1);
  error_reporting(E_ALL);
  ```
- Check Apache error logs: `C:\xampp\apache\logs\error.log`
- Check PHP errors in browser console → Network → Response

---

## 🎯 Sample Database Includes

- ✅ 5 sample stones (different types and prices)
- ✅ 1 admin user
- ✅ 1 employee user
- ✅ 1 customer user
- ✅ Database triggers for stock validation
- ✅ Auto status history logging

---

**Need Help?** Check the full `README.md` for detailed documentation.

**Ready to Build?** 🚀 Your backend is fully functional and waiting for frontend integration!
