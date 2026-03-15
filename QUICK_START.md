# SSMS - Quick Start Guide

## 🚀 Getting Started

### 1. Run the Application

**Option 1: VS Code Live Server (Recommended)**

```
- Install "Live Server" extension in VS Code
- Right-click on index.html
- Select "Open with Live Server"
- Application will open at http://127.0.0.1:5500
```

**Option 2: Python HTTP Server**

```bash
cd "c:\Users\moham\OneDrive\Desktop\Programming\Web Development\SSMS"
python -m http.server 8000
# Open http://localhost:8000 in browser
```

**Option 3: Node.js HTTP Server**

```bash
npx http-server -p 8000
# Open http://localhost:8000 in browser
```

---

## 🧭 Navigation Guide

### Public Pages (No Login Required)

| Page              | URL                                      | Description                                 |
| ----------------- | ---------------------------------------- | ------------------------------------------- |
| **Landing Page**  | `/index.html`                            | Hero, categories, bestsellers, testimonials |
| **Catalog**       | `/catalog/stones.html`                   | Browse all stones with filters              |
| **Stone Details** | `/catalog/stone-details.html?id=stone-1` | Individual product details                  |
| **Cart**          | `/cart/cart.html`                        | Shopping cart                               |
| **Login**         | `/auth/login.html`                       | Login with role selection                   |
| **Register**      | `/auth/register.html`                    | Create new account                          |

### Customer Pages (Login as Customer)

| Page               | URL                                       | Description                    |
| ------------------ | ----------------------------------------- | ------------------------------ |
| **Dashboard**      | `/customer/dashboard.html`                | Overview, stats, recent orders |
| **My Orders**      | `/customer/my-orders.html`                | All orders with filters        |
| **Order Details**  | `/customer/order-details.html?id=ORD-123` | Individual order tracking      |
| **Custom Request** | `/customer/custom-request.html`           | Submit custom stone request    |
| **Checkout**       | `/checkout/checkout.html`                 | Complete purchase              |

### Employee Pages (Login as Employee)

| Page              | URL                           | Description                |
| ----------------- | ----------------------------- | -------------------------- |
| **Dashboard**     | `/employee/dashboard.html`    | Assigned orders statistics |
| **Manage Orders** | `/employee/order-manage.html` | Update order status        |

### Admin Pages (Login as Admin)

| Page                | URL                           | Description                    |
| ------------------- | ----------------------------- | ------------------------------ |
| **Dashboard**       | `/admin/dashboard.html`       | System overview                |
| **Manage Stones**   | `/admin/stones-manage.html`   | Add/Edit/Delete products       |
| **Manage Orders**   | `/admin/orders-manage.html`   | Assign orders to employees     |
| **Manage Requests** | `/admin/requests-manage.html` | Approve/Reject custom requests |

---

## 🔐 Demo Accounts & Role Switching

### Method 1: Using Login Page

1. Go to `/auth/login.html`
2. Select role from dropdown: Customer / Employee / Admin
3. Enter any email/password (validation is UI-only)
4. Click Login

### Method 2: Browser Console (Quick Switch)

Open browser console (F12) and run:

```javascript
// Switch to Customer
SSMS.setUserSession(
  { id: "user-1", name: "John Doe", email: "john@example.com" },
  "customer",
);
location.reload();

// Switch to Employee
SSMS.setUserSession(
  { id: "emp-1", name: "Jane Smith", email: "jane@example.com" },
  "employee",
);
location.reload();

// Switch to Admin
SSMS.setUserSession(
  { id: "admin-1", name: "Admin", email: "admin@example.com" },
  "admin",
);
location.reload();

// Logout
localStorage.clear();
location.reload();
```

---

## 🧪 Testing Features

### 1. Test Shopping Flow (Customer)

```
1. Open index.html
2. Click "Browse Stones" or navigate to catalog
3. Use filters: Search "marble", price range, type checkboxes
4. Click any stone → View details
5. Click "Add to Cart" (cart badge updates)
6. Go to Cart → Update quantities or remove items
7. Click "Proceed to Checkout"
8. Fill form (email/phone validation works)
9. Submit order → Redirects to My Orders
10. View order details with timeline
```

### 2. Test Custom Request (Customer)

```
1. Login as customer
2. Go to dashboard → Click "New Custom Request"
   OR navigate to /customer/custom-request.html
3. Fill form (stone type, quantity, description)
4. Submit → Creates request with "Pending" status
5. View requests in dashboard
```

### 3. Test Order Management (Employee)

```
1. Switch role to employee:
   SSMS.setUserSession({ id: 'emp-1', name: 'Jane', email: 'jane@example.com' }, 'employee');
   location.reload();
2. View assigned orders in dashboard
3. Click "Manage" on any order
4. Update status: Assigned → In Progress → Completed → Delivered
5. Add notes to status updates
6. View timeline updates
```

### 4. Test Admin Functions

**Manage Stones:**

```
1. Login as admin
2. Go to Manage Stones
3. Click "Add New Stone"
4. Fill form → Save (UI only, not persisted to JSON)
5. Click "Edit" on existing stone
6. Click "Delete" → Confirmation modal
```

**Assign Orders:**

```
1. Go to Manage Orders
2. Find order with no assigned employee
3. Click "Assign" → Select employee → Confirm
4. Order status changes to "Assigned"
```

**Manage Requests:**

```
1. Go to Manage Requests
2. Click "Approve" or "Reject" on pending requests
3. Click "Convert to Order" to create order from request
```

---

## 📊 Mock Data Overview

All data is loaded from `/assets/data/*.json`:

- **stones.json**: 12 stone products (marble, granite, limestone, etc.)
- **orders.json**: 6 sample orders with various statuses
- **requests.json**: 5 custom requests (pending, approved, rejected)
- **reviews.json**: 10 customer reviews
- **employees.json**: 5 employee records

### Adding Test Data

**Add item to cart:**

```javascript
CartStorage.addToCart({
  id: "stone-1",
  name: "Carrara White Marble",
  price: 45.0,
  image: "https://images.unsplash.com/photo-1615971677499-5467cbab01c0",
  type: "Marble",
  quantity: 2,
});
location.reload();
```

**Create test order:**

```javascript
OrderStorage.addOrder({
  customerName: "Test User",
  customerEmail: "test@example.com",
  customerPhone: "+966 12 345 6789",
  deliveryAddress: "123 Test St, Riyadh, 12345",
  items: CartStorage.getCart(),
  subtotal: 1000,
  delivery: 150,
  total: 1150,
});
```

**View all data:**

```javascript
console.log("Cart:", CartStorage.getCart());
console.log("Orders:", OrderStorage.getOrders());
console.log("Requests:", RequestStorage.getRequests());
```

**Clear all localStorage:**

```javascript
localStorage.clear();
location.reload();
```

---

## 🎨 Customization

### Change Colors

Edit `/assets/css/base.css` - CSS Variables section:

```css
:root {
  --color-primary: #1f2328; /* Main dark color */
  --color-secondary: #d8c3a5; /* Sand/beige */
  --color-accent: #b07a3e; /* Gold/copper */
  --color-background: #f7f5f2; /* Off-white */
}
```

### Add New Stone Product

Edit `/assets/data/stones.json`:

```json
{
  "id": "stone-13",
  "name": "Your Stone Name",
  "type": "Marble",
  "description": "Beautiful stone...",
  "price": 50.0,
  "stock": 500,
  "image": "https://images.unsplash.com/photo-...",
  "sizes": ["12x12", "24x24"],
  "finish": ["Polished", "Honed"],
  "bestseller": false,
  "rating": 4.5,
  "reviewCount": 10
}
```

---

## 🐛 Troubleshooting

### Cart badge not updating?

```javascript
SSMS.updateCartBadge();
```

### Navigation links not working?

Make sure you're running from a local server (not file://)

### Role-based pages show "Access Denied"?

Login first or switch role in console:

```javascript
UserSession.setUser({ name: "Test" }, "customer");
location.reload();
```

### Modal not closing?

Click backdrop or close button. Or run:

```javascript
document
  .querySelectorAll(".modal")
  .forEach((m) => m.classList.remove("active"));
```

### Reset everything?

```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

---

## 📱 Responsive Testing

Test on different screen sizes:

- **Desktop**: > 1024px (full sidebar, 3-4 column grids)
- **Tablet**: 768px - 1024px (2 column grids)
- **Mobile**: < 768px (stacked layouts, hamburger menu)

Use browser DevTools (F12) → Toggle device toolbar (Ctrl+Shift+M)

---

## 🔧 Integration with Backend (Future)

Replace mock API in `/assets/js/data/api-mock.js`:

```javascript
// Current (Mock):
export const StonesAPI = {
  async getAll() {
    return fetchData("stones.json");
  },
};

// Future (Real API):
export const StonesAPI = {
  async getAll() {
    const response = await fetch("https://your-api.com/api/stones");
    return response.json();
  },
};
```

Update localStorage operations to API calls in `/assets/js/storage.js`

---

## ✅ Feature Checklist

- [x] Landing page with hero & sections
- [x] Product catalog with advanced filters
- [x] Shopping cart with persistence
- [x] Checkout with validation
- [x] Order tracking with timeline
- [x] Custom request submission
- [x] Customer dashboard
- [x] Employee order management
- [x] Admin product/order/request management
- [x] Role-based navigation
- [x] Responsive design
- [x] Toast notifications
- [x] Modal dialogs
- [x] Form validation
- [x] 3D card effects
- [x] Loading states
- [x] LocalStorage persistence

---

## 📞 Support

For issues or questions:

1. Check browser console (F12) for errors
2. Verify you're using a local server
3. Clear localStorage and try again
4. Check README.md for detailed documentation

---

**Happy Testing! 🎉**
