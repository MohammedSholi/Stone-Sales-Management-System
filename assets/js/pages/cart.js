/* Cart Page JavaScript — backed by PHP API */

import { apiCall } from "../api.js";
import { UserSession } from "../storage.js";
import toast from "../ui/toast.js";
import { formatCurrency } from "../app.js";

document.addEventListener("DOMContentLoaded", () => {
  if (!UserSession.isLoggedIn()) {
    window.location.href = "/auth/login.html";
    return;
  }

  loadCart();

  document.getElementById("checkoutBtn").addEventListener("click", () => {
    window.location.href = "/checkout/checkout.html";
  });
});

async function loadCart() {
  const res = await apiCall("/cart");

  if (!res.success) {
    toast.error(res.error?.message || "Failed to load cart");
    return;
  }

  renderCart(res.data);
}

function renderCart(cart) {
  const container = document.getElementById("cartItems");
  const items = cart.items || [];

  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-cart">
        <div class="empty-cart-icon">🛒</div>
        <h2>Your cart is empty</h2>
        <p class="text-muted mb-xl">Start adding some premium stones to your cart!</p>
        <a href="/catalog/stones.html" class="btn btn-primary btn-lg">Browse Catalog</a>
      </div>
    `;
    updateSummary(0, 0, 0);
    document.getElementById("checkoutBtn").disabled = true;
    return;
  }

  document.getElementById("checkoutBtn").disabled = false;

  container.innerHTML = items
    .map(
      (item) => `
    <div class="cart-item">
      <div class="cart-item-image">
        <img src="${item.image_url || "/assets/images/placeholder.jpg"}" alt="${item.name}">
      </div>
      <div class="cart-item-details">
        <h3 class="cart-item-title">${item.name}</h3>
        <p class="cart-item-meta">Type: ${item.type || ""} • ${formatCurrency(item.unit_price)} per unit</p>
        <div class="cart-item-controls">
          <div class="quantity-input">
            <button class="quantity-btn" onclick="window.updateCartQuantity(${item.cart_item_id}, ${item.quantity - 1})">-</button>
            <div class="quantity-value">${item.quantity}</div>
            <button class="quantity-btn" onclick="window.updateCartQuantity(${item.cart_item_id}, ${item.quantity + 1})">+</button>
          </div>
          <div class="font-bold text-lg">${formatCurrency(item.subtotal)}</div>
          <button class="btn btn-danger btn-sm" onclick="window.removeFromCart(${item.cart_item_id})">Remove</button>
        </div>
      </div>
    </div>
  `,
    )
    .join("");

  const subtotal = parseFloat(cart.total) || 0;
  const delivery = subtotal > 0 ? 150 : 0;
  const total = subtotal + delivery;
  updateSummary(subtotal, delivery, total);
}

function updateSummary(subtotal, delivery, total) {
  document.getElementById("subtotal").textContent = formatCurrency(subtotal);
  document.getElementById("delivery").textContent = formatCurrency(delivery);
  document.getElementById("total").textContent = formatCurrency(total);
}

window.updateCartQuantity = async function (cartItemId, newQuantity) {
  if (newQuantity < 1) return;

  const res = await apiCall(`/cart/item/${cartItemId}`, "PUT", {
    quantity: newQuantity,
  });

  if (!res.success) {
    toast.error(res.error?.message || "Failed to update cart");
    return;
  }

  renderCart(res.data);
  toast.success("Cart updated");
};

window.removeFromCart = async function (cartItemId) {
  const res = await apiCall(`/cart/item/${cartItemId}`, "DELETE");

  if (!res.success) {
    toast.error(res.error?.message || "Failed to remove item");
    return;
  }

  renderCart(res.data);
  toast.success("Item removed from cart");
};
