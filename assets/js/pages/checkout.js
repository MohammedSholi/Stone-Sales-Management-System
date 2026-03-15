/* Checkout Page JavaScript — backed by PHP API */

import { apiCall } from "../api.js";
import { UserSession } from "../storage.js";
import toast from "../ui/toast.js";
import { showAlert } from "../ui/modal.js";
import { formatCurrency } from "../app.js";

let cartData = null;

document.addEventListener("DOMContentLoaded", async () => {
  if (!UserSession.isLoggedIn()) {
    window.location.href = "/auth/login.html";
    return;
  }

  // Load cart from backend
  const res = await apiCall("/cart");

  if (!res.success || !res.data || res.data.item_count === 0) {
    showAlert({
      title: "Cart is Empty",
      message: "Your cart is empty. Please add items before checkout.",
      type: "warning",
      onConfirm: () => {
        window.location.href = "/catalog/stones.html";
      },
    });
    return;
  }

  cartData = res.data;
  renderOrderSummary();

  document
    .getElementById("checkoutForm")
    .addEventListener("submit", handleCheckout);
});

function renderOrderSummary() {
  const items = cartData.items || [];

  const itemsHtml = items
    .map(
      (item) => `
    <div class="flex justify-between text-sm mb-sm">
      <span>${item.name} x${item.quantity}</span>
      <span>${formatCurrency(item.subtotal)}</span>
    </div>
  `,
    )
    .join("");

  document.getElementById("orderItems").innerHTML = itemsHtml;

  const subtotal = parseFloat(cartData.total) || 0;
  const delivery = 150;
  const total = subtotal + delivery;

  document.getElementById("subtotal").textContent = formatCurrency(subtotal);
  document.getElementById("delivery").textContent = formatCurrency(delivery);
  document.getElementById("total").textContent = formatCurrency(total);
}

async function handleCheckout(e) {
  e.preventDefault();

  // Disable button to prevent double-submit
  const submitBtn = e.target.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Placing Order...";
  }

  // Call backend checkout endpoint
  const res = await apiCall("/checkout", "POST");

  if (!res.success) {
    toast.error(res.error?.message || "Checkout failed. Please try again.");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Place Order";
    }
    return;
  }

  const order = res.data;

  showAlert({
    title: "Order Placed Successfully!",
    message: `Your order #${order.order_id} has been placed. Total: ${formatCurrency(order.total_amount)}`,
    type: "success",
    onConfirm: () => {
      window.location.href = `/customer/order-details.html?id=${order.order_id}`;
    },
  });
}
