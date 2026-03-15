/*
 * SSMS - Local Storage Management
 * Handle cart, favorites, and user session in localStorage
 */

// ========== CART MANAGEMENT ==========
export const CartStorage = {
  CART_KEY: "ssms_cart",

  getCart() {
    const cart = localStorage.getItem(this.CART_KEY);
    return cart ? JSON.parse(cart) : [];
  },

  saveCart(cart) {
    localStorage.setItem(this.CART_KEY, JSON.stringify(cart));
    this.updateCartBadge();
  },

  addToCart(item) {
    const cart = this.getCart();
    const existingItem = cart.find((i) => i.id === item.id);

    if (existingItem) {
      existingItem.quantity += item.quantity || 1;
    } else {
      cart.push({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        type: item.type,
        quantity: item.quantity || 1,
      });
    }

    this.saveCart(cart);
    return cart;
  },

  removeFromCart(itemId) {
    let cart = this.getCart();
    cart = cart.filter((item) => item.id !== itemId);
    this.saveCart(cart);
    return cart;
  },

  updateQuantity(itemId, quantity) {
    const cart = this.getCart();
    const item = cart.find((i) => i.id === itemId);

    if (item) {
      if (quantity <= 0) {
        return this.removeFromCart(itemId);
      }
      item.quantity = quantity;
      this.saveCart(cart);
    }

    return cart;
  },

  clearCart() {
    localStorage.removeItem(this.CART_KEY);
    this.updateCartBadge();
  },

  getCartTotal() {
    const cart = this.getCart();
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  },

  getCartCount() {
    const cart = this.getCart();
    return cart.reduce((count, item) => count + item.quantity, 0);
  },

  updateCartBadge() {
    if (window.SSMS) {
      window.SSMS.updateCartBadge();
    }
  },
};

// ========== ORDER MANAGEMENT ==========
export const OrderStorage = {
  ORDERS_KEY: "ssms_orders",

  getOrders() {
    const orders = localStorage.getItem(this.ORDERS_KEY);
    return orders ? JSON.parse(orders) : [];
  },

  saveOrders(orders) {
    localStorage.setItem(this.ORDERS_KEY, JSON.stringify(orders));
  },

  addOrder(order) {
    const orders = this.getOrders();
    const newOrder = {
      id: "ORD-" + Date.now(),
      ...order,
      createdAt: new Date().toISOString(),
      status: "Pending",
    };
    orders.unshift(newOrder);
    this.saveOrders(orders);
    return newOrder;
  },

  getOrderById(orderId) {
    const orders = this.getOrders();
    return orders.find((order) => order.id === orderId);
  },

  updateOrderStatus(orderId, status, note = "") {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      order.status = status;
      order.updatedAt = new Date().toISOString();

      // Add to timeline
      if (!order.timeline) {
        order.timeline = [];
      }
      order.timeline.push({
        status: status,
        date: new Date().toISOString(),
        note: note,
      });

      this.saveOrders(orders);
    }
    return order;
  },

  assignOrder(orderId, employeeId) {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      order.assignedTo = employeeId;
      order.status = "Assigned";
      order.updatedAt = new Date().toISOString();

      // Add to timeline
      if (!order.timeline) {
        order.timeline = [];
      }
      order.timeline.push({
        status: "Assigned",
        date: new Date().toISOString(),
        note: "Order assigned to employee",
      });

      this.saveOrders(orders);
    }
    return order;
  },
};

// ========== CUSTOM REQUEST MANAGEMENT ==========
export const RequestStorage = {
  REQUESTS_KEY: "ssms_requests",

  getRequests() {
    const requests = localStorage.getItem(this.REQUESTS_KEY);
    return requests ? JSON.parse(requests) : [];
  },

  saveRequests(requests) {
    localStorage.setItem(this.REQUESTS_KEY, JSON.stringify(requests));
  },

  addRequest(request) {
    const requests = this.getRequests();
    const newRequest = {
      id: "REQ-" + Date.now(),
      ...request,
      createdAt: new Date().toISOString(),
      status: "Pending",
    };
    requests.unshift(newRequest);
    this.saveRequests(requests);
    return newRequest;
  },

  getRequestById(requestId) {
    const requests = this.getRequests();
    return requests.find((req) => req.id === requestId);
  },

  updateRequestStatus(requestId, status) {
    const requests = this.getRequests();
    const request = requests.find((r) => r.id === requestId);
    if (request) {
      request.status = status;
      request.updatedAt = new Date().toISOString();
      this.saveRequests(requests);
    }
    return request;
  },
};

// ========== FAVORITES MANAGEMENT ==========
export const FavoritesStorage = {
  FAVORITES_KEY: "ssms_favorites",

  getFavorites() {
    const favorites = localStorage.getItem(this.FAVORITES_KEY);
    return favorites ? JSON.parse(favorites) : [];
  },

  saveFavorites(favorites) {
    localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(favorites));
  },

  addToFavorites(itemId) {
    const favorites = this.getFavorites();
    if (!favorites.includes(itemId)) {
      favorites.push(itemId);
      this.saveFavorites(favorites);
    }
    return favorites;
  },

  removeFromFavorites(itemId) {
    let favorites = this.getFavorites();
    favorites = favorites.filter((id) => id !== itemId);
    this.saveFavorites(favorites);
    return favorites;
  },

  isFavorite(itemId) {
    const favorites = this.getFavorites();
    return favorites.includes(itemId);
  },

  toggleFavorite(itemId) {
    if (this.isFavorite(itemId)) {
      return this.removeFromFavorites(itemId);
    } else {
      return this.addToFavorites(itemId);
    }
  },
};

// ========== USER SESSION ==========
export const UserSession = {
  USER_KEY: "ssms_user",
  ROLE_KEY: "ssms_role",

  setUser(user, role = "Customer") {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    localStorage.setItem(this.ROLE_KEY, role);
  },

  getUser() {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  getRole() {
    return localStorage.getItem(this.ROLE_KEY) || "Guest";
  },

  isLoggedIn() {
    return this.getUser() !== null;
  },

  logout() {
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.ROLE_KEY);
  },

  // Quick role change for development/testing
  switchRole(role) {
    localStorage.setItem(this.ROLE_KEY, role);
    window.location.reload();
  },
};
