/* Employee Order Management JavaScript */

import { OrderStorage, UserSession } from "../storage.js";
import { formatCurrency, formatDate } from "../app.js";
import toast from "../ui/toast.js";

let currentOrder = null;

document.addEventListener("DOMContentLoaded", () => {
  if (
    !UserSession.isLoggedIn() ||
    (UserSession.getRole() || "").toLowerCase() !== "employee"
  ) {
    window.location.href = "/auth/login.html";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("id");

  if (!orderId) {
    renderAllOrders();
  } else {
    renderOrderManagement(orderId);
  }
});

function renderAllOrders() {
  const orders = OrderStorage.getOrders();
  const user = UserSession.getUser();
  const myOrders = orders.filter((o) => o.assignedTo === user.id);

  const html = `
    <h1 class="mb-xl">All My Orders</h1>
    ${myOrders
      .map(
        (order) => `
      <div class="order-card">
        <div class="order-header">
          <div>
            <div class="order-id">${order.id}</div>
            <div class="order-date">${formatDate(order.createdAt)}</div>
          </div>
          <span class="badge badge-${getStatusBadgeClass(order.status)}">${order.status}</span>
        </div>
        <div class="mb-md">
          <div class="text-muted mb-xs">Customer: ${order.customerName}</div>
          <div class="text-muted">${order.items.length} item(s) • ${formatCurrency(order.total)}</div>
        </div>
        <a href="/employee/order-manage.html?id=${order.id}" class="btn btn-primary btn-sm">Manage Order</a>
      </div>
    `,
      )
      .join("")}
  `;

  document.getElementById("orderContent").innerHTML = html;
}

function renderOrderManagement(orderId) {
  currentOrder = OrderStorage.getOrderById(orderId);

  if (!currentOrder) {
    toast.error("Order not found");
    setTimeout(() => (window.location.href = "/employee/dashboard.html"), 1500);
    return;
  }

  const html = `
    <h1 class="mb-xl">${currentOrder.id}</h1>

    <div class="grid grid-cols-2 gap-2xl mb-2xl">
      <div class="card">
        <h3 class="mb-lg">Customer Information</h3>
        <div class="mb-md"><strong>Name:</strong> ${currentOrder.customerName}</div>
        <div class="mb-md"><strong>Email:</strong> ${currentOrder.customerEmail}</div>
        <div class="mb-md"><strong>Phone:</strong> ${currentOrder.customerPhone}</div>
        <div><strong>Address:</strong> ${currentOrder.deliveryAddress}</div>
      </div>
      
      <div class="card">
        <h3 class="mb-lg">Order Summary</h3>
        <div class="mb-lg">
          <span class="badge badge-${getStatusBadgeClass(currentOrder.status)} badge-lg">${currentOrder.status}</span>
        </div>
        <div class="flex justify-between mb-sm">
          <span>Total:</span>
          <strong class="text-accent">${formatCurrency(currentOrder.total)}</strong>
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
            ${currentOrder.items
              .map(
                (item) => `
              <tr>
                <td>${item.name}</td>
                <td>${formatCurrency(item.price)}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.price * item.quantity)}</td>
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
            <option value="Assigned" ${currentOrder.status === "Assigned" ? "selected" : ""}>Assigned</option>
            <option value="In Progress" ${currentOrder.status === "In Progress" ? "selected" : ""}>In Progress</option>
            <option value="Completed" ${currentOrder.status === "Completed" ? "selected" : ""}>Completed</option>
            <option value="Delivered" ${currentOrder.status === "Delivered" ? "selected" : ""}>Delivered</option>
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
      currentOrder.timeline
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

function handleStatusUpdate(e) {
  e.preventDefault();

  const newStatus = document.getElementById("newStatus").value;
  const note = document.getElementById("statusNote").value.trim();

  OrderStorage.updateOrderStatus(currentOrder.id, newStatus, note);

  toast.success("Order status updated successfully");

  setTimeout(() => window.location.reload(), 1000);
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
