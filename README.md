# Stone Sales Management System (SSMS)

A complete, professional **frontend-only** web application for managing stone sales, built with **HTML5**, **CSS3**, and **Vanilla JavaScript** (ES6 Modules). No frameworks, no libraries – just clean, modern web development.

## 🌟 Features

### For Customers

- Browse premium stone catalog with advanced filters (search, type, price range, availability)
- View detailed stone information with image gallery and specifications
- Add items to cart with persistent localStorage
- Complete checkout process with form validation
- Track orders with real-time status updates and timeline
- Submit custom stone requests with detailed requirements
- View order history and manage account

### For Employees

- Dashboard with assigned order statistics
- Manage orders and update order status
- Add notes and track order progress
- View customer information and order details

### For Admins

- Complete system overview with statistics
- Manage stone products (Add, Edit, Delete)
- View and assign orders to employees
- Review and approve/reject custom requests
- Convert custom requests to orders
- Monitor overall system performance

## 🎨 Design Features

- **Premium Stone/Architecture Theme**: Luxury aesthetic with elegant typography
- **Color Palette**:
  - Primary: `#1F2328` (Deep Stone Charcoal)
  - Secondary: `#D8C3A5` (Warm Sand)
  - Accent: `#B07A3E` (Copper/Gold)
  - Background: `#F7F5F2` (Off-white)
- **Typography**:
  - Headings: Playfair Display (serif, luxury)
  - Body: Poppins (modern, readable)
- **Interactive Effects**:
  - 3D card tilt on hover
  - Smooth animations and transitions
  - Loading skeletons for better UX
  - Toast notifications
  - Modal dialogs

## 📁 Project Structure

```
SSMS/
├── index.html                    # Landing page
├── auth/
│   ├── login.html               # Login page
│   └── register.html            # Registration page
├── catalog/
│   ├── stones.html              # Products catalog with filters
│   └── stone-details.html       # Individual product details
├── cart/
│   └── cart.html                # Shopping cart
├── checkout/
│   └── checkout.html            # Checkout process
├── customer/
│   ├── dashboard.html           # Customer dashboard
│   ├── my-orders.html           # Order history
│   ├── order-details.html       # Individual order details
│   └── custom-request.html      # Submit custom request
├── employee/
│   ├── dashboard.html           # Employee dashboard
│   └── order-manage.html        # Manage orders
├── admin/
│   ├── dashboard.html           # Admin dashboard
│   ├── stones-manage.html       # Manage products
│   ├── orders-manage.html       # Manage all orders
│   └── requests-manage.html     # Manage custom requests
├── shared/
│   └── 404.html                 # 404 error page
└── assets/
    ├── css/
    │   ├── base.css             # CSS variables, reset, utilities
    │   ├── components.css       # Reusable UI components
    │   ├── layout.css           # Layout structures
    │   └── pages/               # Page-specific styles
    ├── js/
    │   ├── app.js               # Global app state
    │   ├── storage.js           # localStorage management
    │   ├── ui/                  # UI components (modal, toast, loader)
    │   ├── data/                # Mock API system
    │   └── pages/               # Page-specific scripts
    └── data/
        ├── stones.json          # Stone products data
        ├── orders.json          # Orders data
        ├── requests.json        # Custom requests data
        ├── reviews.json         # Customer reviews
        └── employees.json       # Employee data
```

## 🚀 Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Edge, Safari)
- A local web server (optional but recommended)

### Installation

1. **Clone or download** this repository
2. **Open the project** in your code editor

### Running the Application

#### Option 1: Using a Local Server (Recommended)

**Using VS Code Live Server:**

```bash
# Install the Live Server extension in VS Code
# Right-click on index.html and select "Open with Live Server"
```

**Using Python:**

```bash
# Python 3
python -m http.server 8000

# Then open http://localhost:8000 in your browser
```

**Using Node.js:**

```bash
npm install -g http-server
http-server -p 8000

# Then open http://localhost:8000 in your browser
```

#### Option 2: Direct File Opening

Simply open `index.html` in your browser. However, some features (like ES6 modules) may not work properly due to CORS restrictions.

## 🔐 User Roles & Demo Mode

The application includes a **role switching demo feature** for testing different user interfaces.

### Switching Roles in Demo Mode

Open browser console (F12) and use:

```javascript
// Switch to Customer view
SSMS.setUserSession({
  name: "John Doe",
  email: "john@example.com",
  role: "customer",
});
SSMS.switchRole("customer");
location.reload();

// Switch to Employee view
SSMS.switchRole("employee");
location.reload();

// Switch to Admin view
SSMS.switchRole("admin");
location.reload();
```

### Available Roles:

- **Customer**: Browse catalog, manage cart, place orders, submit custom requests
- **Employee**: Manage assigned orders, update order status
- **Admin**: Full system access, manage products, orders, and requests

## 💾 Data Persistence

The application uses **localStorage** to persist data across sessions:

- Shopping cart items
- Orders
- Custom requests
- User session
- Favorites (if implemented)

To reset all data:

```javascript
localStorage.clear();
location.reload();
```

## 🛠️ Technology Stack

- **HTML5**: Semantic markup
- **CSS3**:
  - CSS Custom Properties (variables)
  - Flexbox & Grid layouts
  - Transitions & Animations
  - Media queries for responsiveness
- **JavaScript ES6+**:
  - ES6 Modules
  - Async/Await
  - Promises
  - LocalStorage API
  - Fetch API
- **No External Libraries**: Pure vanilla JavaScript for full control

## 📱 Responsive Design

The application is fully responsive with breakpoints at:

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## ✨ Key Features Explained

### Mock Data System

All data (stones, orders, requests) is loaded from JSON files via a mock API system that simulates real backend calls with artificial 500ms delays.

### State Management

Global state is managed through the `SSMS` object (`window.SSMS`) with helper functions for:

- User session management
- Role-based navigation
- Currency formatting
- Date formatting
- Email/Phone validation
- Debouncing

### LocalStorage Abstraction

Clean storage modules (`CartStorage`, `OrderStorage`, `RequestStorage`, `UserSession`) provide a consistent API for data persistence.

### UI Components

Reusable UI components include:

- Modal dialogs (with confirm/alert helpers)
- Toast notifications
- Loading skeletons
- Breadcrumbs
- Pagination
- Tabs
- Cards with 3D tilt effect

### Form Validation

Client-side validation for:

- Email format
- Phone numbers
- Required fields
- Number ranges
- Text length

## 🔗 Backend Integration (Future)

This is a **frontend-only** application ready for backend integration. To connect to a PHP (or any) backend:

1. Replace mock API calls in `/assets/js/data/api-mock.js` with real fetch calls
2. Update storage modules to use API endpoints instead of localStorage
3. Add authentication tokens/sessions
4. Implement server-side validation
5. Add image upload functionality

Example API endpoint structure:

```
GET    /api/stones              # Get all stones
GET    /api/stones/:id          # Get stone by ID
POST   /api/stones              # Create stone (admin)
PUT    /api/stones/:id          # Update stone (admin)
DELETE /api/stones/:id          # Delete stone (admin)

GET    /api/orders              # Get orders
POST   /api/orders              # Create order
PUT    /api/orders/:id/status   # Update order status

GET    /api/requests            # Get custom requests
POST   /api/requests            # Create request
PUT    /api/requests/:id/status # Update request status
```

## 🎯 Performance Optimizations

- Lazy loading for images
- Debounced search input (300ms)
- CSS containment for cards
- Optimized animations using transform/opacity
- Minimal DOM manipulation
- Event delegation where appropriate

## 🌐 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Opera (latest)

**Note**: ES6 modules require a modern browser. IE11 is not supported.

## 📝 Development Notes

### Adding New Stones

Admin users can add stones through the admin panel, or you can edit `/assets/data/stones.json` directly.

### Customizing Colors

All colors are defined as CSS variables in `/assets/css/base.css`. Change them there to update the entire theme.

### Adding New Pages

1. Create HTML file with navbar/footer structure
2. Add corresponding CSS in `/assets/css/pages/`
3. Create JavaScript module in `/assets/js/pages/`
4. Update navigation in `app.js` if needed

## 🐛 Known Limitations

- No real backend (data is stored in localStorage)
- Image uploads are UI-only (URLs only)
- No real authentication/authorization
- No email/SMS notifications (simulated)
- No payment processing (UI only)

## 📄 License

This is a demo/educational project. Feel free to use and modify as needed.

## 🤝 Contributing

This is a frontend-only demo project. If you'd like to extend it:

1. Keep the vanilla JavaScript approach (no frameworks)
2. Follow the existing code structure
3. Maintain the design system consistency
4. Test across browsers

## 📧 Contact

For questions or suggestions, feel free to open an issue or contact the development team.

---

**Built with ❤️ using Vanilla JavaScript**
