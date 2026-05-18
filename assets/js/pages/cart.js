import { CartStorage } from "../storage.js";
import toast from "../ui/toast.js";
import { formatCurrency } from "../app.js";

document.addEventListener("DOMContentLoaded", () => {
  renderCart();
  const checkoutBtn = document.getElementById("checkoutBtn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      window.location.href = "/checkout/checkout.html";
    });
  }
});

function renderCart() {
  const cart = CartStorage.getCart();
  const container = document.getElementById("cartItems");

  if (!cart.length) {
    container.innerHTML = `
      <div class="empty-cart">
        <div class="empty-cart-icon">🛒</div>
        <h2>Your cart is empty</h2>
        <p class="text-muted mb-xl">Select a premium stone and add it to the cart to start your order.</p>
        <a href="/catalog/stones.html" class="btn btn-primary btn-lg">Browse the collection</a>
      </div>
    `;
    updateSummary(0, 0, 0);
    const checkoutBtn = document.getElementById("checkoutBtn");
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }

  const checkoutBtn = document.getElementById("checkoutBtn");
  if (checkoutBtn) checkoutBtn.disabled = false;

  container.innerHTML = cart
    .map(
      (item) => `
      <article class="cart-item">
        <div class="cart-item-image">
          <img src="${item.image}" alt="${item.name}" />
        </div>
        <div class="cart-item-details">
          <div class="cart-item-headline">
            <h3 class="cart-item-title">${item.name}</h3>
            <span class="cart-item-subtitle">${item.type}</span>
          </div>
          <p class="cart-item-meta">${formatCurrency(item.price)} / unit</p>
          <div class="cart-item-controls">
            <div class="quantity-input">
              <button type="button" class="quantity-btn" onclick="window.updateCartQuantity('${item.id}', ${item.quantity - 1})">−</button>
              <div class="quantity-value">${item.quantity}</div>
              <button type="button" class="quantity-btn" onclick="window.updateCartQuantity('${item.id}', ${item.quantity + 1})">＋</button>
            </div>
            <div class="cart-item-total">${formatCurrency(item.price * item.quantity)}</div>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" onclick="window.removeFromCart('${item.id}')">Remove</button>
        </div>
      </article>
    `,
    )
    .join("");

  const subtotal = CartStorage.getCartTotal();
  const delivery = subtotal > 0 ? 65 : 0;
  const total = subtotal + delivery;
  updateSummary(subtotal, delivery, total);
}

function updateSummary(subtotal, delivery, total) {
  document.getElementById("subtotal").textContent = formatCurrency(subtotal);
  document.getElementById("delivery").textContent = formatCurrency(delivery);
  document.getElementById("total").textContent = formatCurrency(total);
}

window.updateCartQuantity = function (itemId, quantity) {
  if (quantity < 1) {
    return;
  }

  CartStorage.updateQuantity(itemId, quantity);
  renderCart();
  toast.success("Cart updated");
};

window.removeFromCart = function (itemId) {
  CartStorage.removeFromCart(itemId);
  renderCart();
  toast.success("Item removed from cart");
};
