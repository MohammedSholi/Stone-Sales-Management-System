# ⚡ QUICK START - Test Registration NOW

## 🎯 3 Simple Steps

### STEP 1: Start XAMPP

1. Open **XAMPP Control Panel**
2. Click **Start** on Apache
3. Click **Start** on MySQL
4. Wait for green "Running" status

### STEP 2: Test Database

Open browser and go to:

```
http://localhost/ssms-backend/public/api/debug/ping
```

**✅ If you see this, database is working:**

```json
{
  "success": true,
  "data": {
    "db_connected": true
  }
}
```

**❌ If you see error:**

- Check MySQL is running in XAMPP
- Check database `ssms` exists in phpMyAdmin
- Check `config/config.php` has correct DB credentials

### STEP 3: Test Registration

Open this file in your browser:

```
c:\Users\moham\OneDrive\Desktop\Programming\Web Development\SSMS\ssms-backend\test-register.html
```

**Fill the form:**

- Username: `testuser123`
- Password: `password123`
- Email: `test@example.com`
- Phone: `0590000000`
- Address: `Nablus`

**Click "Test Register"**

**✅ Success looks like:**

```json
{
  "success": true,
  "data": {
    "user_id": 4,
    "customer_id": 2,
    "username": "testuser123"
  }
}
```

---

## 🔍 Verify in Database

Open phpMyAdmin:

```
http://localhost/phpmyadmin
```

Run this SQL:

```sql
SELECT u.user_id, u.username, u.email, c.customer_id, c.phone, c.address
FROM users u
JOIN customers c ON u.user_id = c.user_id
WHERE u.username = 'testuser123';
```

**You should see:**
| user_id | username | email | customer_id | phone | address |
|---------|----------|-------|-------------|-------|---------|
| 4 | testuser123 | test@example.com | 2 | 0590000000 | Nablus |

---

## 📋 Check Logs

Open log file:

```
C:\Users\moham\OneDrive\Desktop\Programming\Web Development\SSMS\ssms-backend\logs\app.log
```

Look for entries like:

```
[2026-02-23 12:00:00] DEBUG: Incoming Request
[2026-02-23 12:00:01] DEBUG: UserModel::register - User inserted {"user_id":4}
[2026-02-23 12:00:01] DEBUG: UserModel::register - Customer inserted
[2026-02-23 12:00:01] DEBUG: UserModel::register - Transaction committed
```

---

## ✅ SUCCESS CHECKLIST

After testing, you should have:

- [ ] HTTP 201 response
- [ ] `success: true` in JSON
- [ ] New user in database
- [ ] Log entries created
- [ ] Session created (can see in debug field)

---

## 🐛 Common Issues

### "Username already exists"

**Solution:** Use a different username or delete the test user from database

### "Database connection failed"

**Solution:**

1. Start MySQL in XAMPP
2. Create database: `CREATE DATABASE ssms;`
3. Import schema: `ssms-backend/database/ssms.sql`

### "404 Not Found"

**Solution:**

1. Check URL is: `http://localhost/ssms-backend/public/api/auth/register`
2. Enable mod_rewrite in Apache (see SETUP.md)

### "CORS Error"

**Solution:** This shouldn't happen anymore. If it does:

1. Make sure you're using `localhost` not `127.0.0.1`
2. Check browser console for exact error
3. Verify `middleware/cors.php` is being loaded

---

## 🔄 Test Again with Different User

```bash
curl -X POST http://localhost/ssms-backend/public/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"anotheruser\",\"password\":\"pass123\",\"email\":\"another@example.com\"}"
```

---

## 🎉 IT WORKS!

If you see the user in your database, **CONGRATULATIONS!**

Your registration is now working correctly. The issue was:

- ❌ **Before:** Trying to insert into columns that don't exist
- ✅ **After:** Correctly inserting into proper columns

Now you can:

1. Use the frontend registration form
2. See users appear in database
3. Login with registered users
4. Build your full application!

---

## 📚 More Info

- Full details: `DEBUG_GUIDE.md`
- All changes: `FIX_SUMMARY.md`
- API reference: `API_REFERENCE.md`
- Setup help: `SETUP.md`

---

**Need help? Check the log file first - it will tell you exactly what happened!**
