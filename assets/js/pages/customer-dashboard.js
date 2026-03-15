/* Customer Dashboard JavaScript */

import { OrderStorage, RequestStorage, UserSession } from "../storage.js";
import { formatCurrency, formatDate } from "../app.js";

document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  if (!UserSession.isLoggedIn()) {
    window.location.href = "/auth/login.html";
    return;
  }

  const user = UserSession.getUser();
  document.getElementById("userName").textContent =
    user.full_name || user.name || user.username || "";

  loadDashboardData();
});

function loadDashboardData() {
  const orders = OrderStorage.getOrders();
  const requests = RequestStorage.getRequests();

  // Calculate stats
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(
    (o) =>
      o.status === "Pending" ||
      o.status === "Assigned" ||
      o.status === "In Progress",
  ).length;
  const completedOrders = orders.filter(
    (o) => o.status === "Completed" || o.status === "Delivered",
  ).length;
  const totalRequests = requests.length;

  document.getElementById("totalOrders").textContent = totalOrders;
  document.getElementById("pendingOrders").textContent = pendingOrders;
  document.getElementById("completedOrders").textContent = completedOrders;
  document.getElementById("totalRequests").textContent = totalRequests;

  // Render recent orders
  renderRecentOrders(orders.slice(0, 3));

  // Render requests
  renderRequests(requests.slice(0, 3));
}

function renderRecentOrders(orders) {
  const container = document.getElementById("recentOrders");

  if (orders.length === 0) {
    container.innerHTML =
      '<p class="text-muted">No orders yet. Start shopping!</p>';
    return;
  }

  container.innerHTML = orders
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
      <div class="order-items">
        ${order.items.length} item${order.items.length !== 1 ? "s" : ""}
      </div>
      <div class="order-footer">
        <div class="order-total">${formatCurrency(order.total)}</div>
        <a href="/customer/order-details.html?id=${order.id}" class="btn btn-primary btn-sm">View Details</a>
      </div>
    </div>
  `,
    )
    .join("");
}

function renderRequests(requests) {
  const container = document.getElementById("customRequests");

  if (requests.length === 0) {
    container.innerHTML = '<p class="text-muted">No custom requests yet.</p>';
    return;
  }

  container.innerHTML = requests
    .map(
      (request) => `
    <div class="order-card">
      <div class="order-header">
        <div>
          <div class="order-id">${request.id}</div>
          <div class="order-date">${formatDate(request.createdAt)}</div>
        </div>
        <span class="badge badge-${getStatusBadgeClass(request.status)}">${request.status}</span>
      </div>
      <div class="order-items">
        ${request.stoneType} • ${request.quantity} units
      </div>
    </div>
  `,
    )
    .join("");
}

function getStatusBadgeClass(status) {
  const classes = {
    Pending: "pending",
    Assigned: "assigned",
    "In Progress": "in-progress",
    Completed: "completed",
    Delivered: "delivered",
    Canceled: "canceled",
    Approved: "success",
    Rejected: "danger",
    "In Review": "warning",
  };
  return classes[status] || "primary";
}
