/* Order Details Page JavaScript — backed by PHP API */

import { apiCall } from "../api.js";
import { UserSession } from "../storage.js";
import { formatCurrency, formatDate } from "../app.js";
import { showConfirm } from "../ui/modal.js";
import toast from "../ui/toast.js";

document.addEventListener("DOMContentLoaded", async () => {
  if (!UserSession.isLoggedIn()) {
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

  const html = `
    <div class="flex justify-between items-start mb-2xl">
      <div>
        <h1 class="mb-sm">Order #${order.order_id}</h1>
        <p class="text-muted">${formatDate(order.order_date)}</p>
      </div>
      <div class="flex gap-md items-center">
        <span class="badge badge-${getStatusBadgeClass(order.order_status)} badge-lg">${order.order_status}</span>
        ${canCancel ? `<button id="cancelOrderBtn" class="btn btn-danger btn-sm" data-order-id="${order.order_id}">Cancel Order</button>` : ""}
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2xl mb-2xl">
      <div class="card">
        <h3 class="mb-lg">Customer Information</h3>
        <div class="mb-md"><strong>Name:</strong> ${order.customer_name || ""}</div>
        <div class="mb-md"><strong>Email:</strong> ${order.customer_email || ""}</div>
        <div class="mb-md"><strong>Phone:</strong> ${order.customer_phone || ""}</div>
        <div><strong>Address:</strong> ${order.customer_address || ""}</div>
      </div>
      
      <div class="card">
        <h3 class="mb-lg">Order Summary</h3>
        <div class="flex justify-between mb-sm">
          <span>Subtotal:</span>
          <span>${formatCurrency(order.total_amount)}</span>
        </div>
        <div class="divider"></div>
        <div class="flex justify-between">
          <strong>Total:</strong>
          <strong class="text-accent">${formatCurrency(order.total_amount)}</strong>
        </div>
      </div>
    </div>

    <div class="card mb-2xl">
      <h3 class="mb-lg">Order Items</h3>
      <div class="table-container">
        <table class="table">
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
                <td>${item.name || "Stone #" + item.stone_id}</td>
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
