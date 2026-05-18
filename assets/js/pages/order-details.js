/* Order Details Page JavaScript — backed by PHP API */

import { apiCall } from "../api.js";
import { UserSession } from "../storage.js";
import { formatCurrency, formatDate } from "../app.js";
import { showConfirm } from "../ui/modal.js";
import toast from "../ui/toast.js";

document.addEventListener("DOMContentLoaded", async () => {
  const role = (UserSession.getRole() || "").toLowerCase();
  if (!UserSession.isLoggedIn() || role !== "customer") {
    window.location.href = "/auth/login.html";
    return;
  }

  // Validate backend session is still active
  const sessionValid = await validateBackendSession();
  if (!sessionValid) {
    UserSession.logout();
    window.location.href = "/auth/login.html";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("id");

  if (!orderId) {
    window.location.href = "/customer/my-orders.html";
    return;
  }

  const res = await apiCall(`/orders/${orderId}`);

  if (!res.success) {
    toast.error(res.error?.message || "Order not found");
    setTimeout(() => (window.location.href = "/customer/my-orders.html"), 1500);
    return;
  }

  renderOrderDetails(res.data);
});

function renderOrderDetails(order) {
  const breadcrumb = document.getElementById("breadcrumbOrderId");
  if (breadcrumb) breadcrumb.textContent = `#${order.order_id}`;

  const canCancel =
    order.order_status === "Pending" || order.order_status === "Assigned";
  const items = order.items || [];
  const itemCount = items.length;

  const renderDetail = (label, value) => `
    <div class="order-detail-item">
      <span class="order-detail-label">${label}</span>
      <p class="order-detail-value">${value || "—"}</p>
    </div>
  `;

  const html = `
    <section class="order-details-hero card">
      <div class="order-details-hero__copy">
        <span class="order-details-kicker">Customer Order Details</span>
        <h1 class="order-details-title">Order #${order.order_id}</h1>
        <p class="order-details-subtitle">Placed on ${formatDate(order.order_date)}</p>
      </div>
      <div class="order-details-hero__actions">
        <span class="badge badge-${getStatusBadgeClass(order.order_status)} badge-lg">${order.order_status}</span>
        ${canCancel ? `<button id="cancelOrderBtn" class="btn btn-danger btn-sm" data-order-id="${order.order_id}">Cancel Order</button>` : ""}
      </div>
    </section>

    <div class="order-details-grid">
      <div class="card order-details-card">
        <div class="order-details-card__header">
          <div>
            <h3>Customer Information</h3>
            <p>Contact and delivery details for this order.</p>
          </div>
        </div>
        <div class="order-detail-list">
          ${renderDetail("Name", order.customer_name)}
          ${renderDetail("Email", order.customer_email)}
          ${renderDetail("Phone", order.customer_phone)}
          ${renderDetail("Address", order.customer_address)}
        </div>
      </div>

      <div class="card order-details-card order-summary-card">
        <div class="order-details-card__header">
          <div>
            <h3>Order Summary</h3>
            <p>A quick view of the order total and item count.</p>
          </div>
        </div>

        <div class="order-summary-list">
          <div class="order-summary-row">
            <span>Items</span>
            <strong>${itemCount}</strong>
          </div>
          <div class="order-summary-row">
            <span>Subtotal</span>
            <strong>${formatCurrency(order.total_amount)}</strong>
          </div>
        </div>

        <div class="order-summary-total">
          <span>Total</span>
          <strong class="text-accent">${formatCurrency(order.total_amount)}</strong>
        </div>
      </div>
    </div>

    <div class="card order-details-card order-items-card">
      <div class="order-details-card__header">
        <div>
          <h3>Order Items</h3>
          <p>${itemCount} ${itemCount === 1 ? "item" : "items"} in this order.</p>
        </div>
      </div>
      <div class="table-container order-items-table-container">
        <table class="table order-items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (item) => `
              <tr>
                <td class="order-item-name">${item.name || "Stone #" + item.stone_id}</td>
                <td>${formatCurrency(item.unit_price)}</td>
                <td>${item.quantity_ordered}</td>
                <td>${formatCurrency(item.subtotal)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById("orderDetails").innerHTML = html;

  // Bind cancel button if present
  const cancelBtn = document.getElementById("cancelOrderBtn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => handleCancelOrder(order));
  }
}

async function handleCancelOrder(order) {
  showConfirm({
    title: "Cancel Order",
    message:
      "Are you sure you want to cancel this order? This action cannot be undone.",
    confirmText: "Yes, Cancel",
    cancelText: "Keep Order",
    onConfirm: async () => {
      const res = await apiCall(`/orders/${order.order_id}/status`, "PUT", {
        status: "Canceled",
      });

      if (!res.success) {
        toast.error(res.error?.message || "Failed to cancel order");
        return;
      }

      toast.success("Order canceled successfully");
      setTimeout(() => window.location.reload(), 1000);
    },
  });
}

function getStatusBadgeClass(status) {
  const classes = {
    Pending: "pending",
    Assigned: "assigned",
    "In Progress": "in-progress",
    Completed: "completed",
    Delivered: "delivered",
    Canceled: "canceled",
  };
  return classes[status] || "primary";
}

async function validateBackendSession() {
  try {
    const response = await apiCall("/auth/me");
    // Session is valid if we get any successful response with user data
    return response && (response.data || response.user_id);
  } catch (err) {
    console.error("Session validation error:", err);
    return false;
  }
}
