/* Employee Order Management JavaScript */

import { UserSession } from "../storage.js";
import { apiCall } from "../api.js";
import { formatCurrency, formatDate } from "../app.js";
import toast from "../ui/toast.js";

let currentOrder = null;

document.addEventListener("DOMContentLoaded", async () => {
  if (
    !UserSession.isLoggedIn() ||
    (UserSession.getRole() || "").toLowerCase() !== "employee"
  ) {
    window.location.href = "/auth/login.html";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("id");

  const sessionValid = await validateBackendSession();
  if (!sessionValid) {
    UserSession.logout();
    window.location.href = "/auth/login.html";
    return;
  }

  if (!orderId) {
    await renderAllOrders();
  } else {
    await renderOrderManagement(orderId);
  }
});

async function renderAllOrders() {
  const response = await apiCall("/employee/orders");
  if (!response.success) {
    toast.error(response.error?.message || "Failed to load orders");
    document.getElementById("orderContent").innerHTML =
      '<p class="text-muted">No orders available.</p>';
    return;
  }

  const myOrders = Array.isArray(response.data) ? response.data : [];

  const html = `
    <h1 class="mb-xl">All My Orders</h1>
    ${myOrders
      .map(
        (order) => `
      <div class="order-card">
        <div class="order-header">
          <div>
              <div class="order-id">#${order.order_id}</div>
              <div class="order-date">${formatDate(order.order_date || order.created_at)}</div>
          </div>
            <span class="badge badge-${getStatusBadgeClass(getOrderStatus(order))}">${getOrderStatus(order)}</span>
        </div>
        <div class="mb-md">
            <div class="text-muted mb-xs">Customer: ${order.customer_name || "Customer"}</div>
            <div class="text-muted">${order.item_count || 0} item(s) • ${formatCurrency(parseFloat(order.total_amount || 0))}</div>
        </div>
          <a href="/employee/order-manage.html?id=${order.order_id}" class="btn btn-primary btn-sm">Manage Order</a>
      </div>
    `,
      )
      .join("")}
  `;

  document.getElementById("orderContent").innerHTML = html;
}

async function renderOrderManagement(orderId) {
  const response = await apiCall(`/orders/${orderId}`);
  currentOrder = response.success ? response.data : null;

  if (!currentOrder) {
    toast.error("Order not found");
    setTimeout(() => (window.location.href = "/employee/dashboard.html"), 1500);
    return;
  }

  const html = `
    <h1 class="mb-xl">#${currentOrder.order_id}</h1>

    <div class="grid grid-cols-2 gap-2xl mb-2xl">
      <div class="card">
        <h3 class="mb-lg">Customer Information</h3>
        <div class="mb-md"><strong>Name:</strong> ${currentOrder.customer_name || "-"}</div>
        <div class="mb-md"><strong>Email:</strong> ${currentOrder.customer_email || "-"}</div>
        <div class="mb-md"><strong>Phone:</strong> ${currentOrder.customer_phone || "-"}</div>
        <div><strong>Address:</strong> ${currentOrder.customer_address || "-"}</div>
      </div>
      
      <div class="card">
        <h3 class="mb-lg">Order Summary</h3>
        <div class="mb-lg">
          <span class="badge badge-${getStatusBadgeClass(getOrderStatus(currentOrder))} badge-lg">${getOrderStatus(currentOrder)}</span>
        </div>
        <div class="flex justify-between mb-sm">
          <span>Total:</span>
          <strong class="text-accent">${formatCurrency(parseFloat(currentOrder.total_amount || 0))}</strong>
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
            ${(currentOrder.items || [])
              .map(
                (item) => `
              <tr>
                <td>${item.name || `Stone #${item.stone_id}`}</td>
                <td>${formatCurrency(parseFloat(item.unit_price || 0))}</td>
                <td>${item.quantity_ordered || 0}</td>
                <td>${formatCurrency(parseFloat(item.subtotal || 0))}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>

    <div class="card mb-2xl">
      <h3 class="mb-lg">Update Order Status</h3>
      <form id="statusForm" class="max-w-md">
        <div class="form-group">
          <label for="newStatus" class="form-label">Change Status</label>
          <select id="newStatus" class="form-input">
            <option value="Assigned" ${getOrderStatus(currentOrder) === "Assigned" ? "selected" : ""}>Assigned</option>
            <option value="In Progress" ${getOrderStatus(currentOrder) === "In Progress" ? "selected" : ""}>In Progress</option>
            <option value="Completed" ${getOrderStatus(currentOrder) === "Completed" ? "selected" : ""}>Completed</option>
            <option value="Delivered" ${getOrderStatus(currentOrder) === "Delivered" ? "selected" : ""}>Delivered</option>
          </select>
        </div>
        <div class="form-group">
          <label for="statusNote" class="form-label">Note (optional)</label>
          <textarea id="statusNote" class="form-textarea" rows="3" placeholder="Add a note about this status change..."></textarea>
        </div>
        <button type="submit" class="btn btn-accent">Update Status</button>
      </form>
    </div>

    ${
      currentOrder.timeline && currentOrder.timeline.length
        ? `
      <div class="card">
        <h3 class="mb-lg">Order Timeline</h3>
        <div class="timeline">
          ${currentOrder.timeline
            .map(
              (event) => `
            <div class="timeline-item">
              <div class="timeline-marker"></div>
              <div class="timeline-content">
                <strong>${event.status}</strong>
                <div class="timeline-time">${formatDate(event.date)}</div>
                ${event.note ? `<p class="text-muted mt-sm">${event.note}</p>` : ""}
              </div>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
    `
        : ""
    }
  `;

  document.getElementById("orderContent").innerHTML = html;

  document
    .getElementById("statusForm")
    .addEventListener("submit", handleStatusUpdate);
}

async function handleStatusUpdate(e) {
  e.preventDefault();

  const newStatus = document.getElementById("newStatus").value;
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn ? submitBtn.textContent : "Update Status";
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Updating...";
  }

  const response = await apiCall(`/orders/${currentOrder.order_id}/status`, "PUT", {
    status: newStatus,
  });

  if (!response.success) {
    toast.error(response.error?.message || "Failed to update order status");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
    return;
  }

  toast.success("Order status updated successfully");
  setTimeout(() => window.location.reload(), 700);
}

function getOrderStatus(order) {
  return order.order_status || order.status || "Pending";
}

async function validateBackendSession() {
  try {
    const response = await apiCall("/auth/me");
    return response && (response.data || response.user_id);
  } catch (err) {
    console.error("Session validation error:", err);
    return false;
  }
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
