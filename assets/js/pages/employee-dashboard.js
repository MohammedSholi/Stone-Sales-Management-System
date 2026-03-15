/* Employee Dashboard JavaScript */

import { OrderStorage, UserSession } from "../storage.js";
import { formatCurrency, formatDate } from "../app.js";

document.addEventListener("DOMContentLoaded", () => {
  if (
    !UserSession.isLoggedIn() ||
    (UserSession.getRole() || "").toLowerCase() !== "employee"
  ) {
    window.location.href = "/auth/login.html";
    return;
  }

  loadDashboardData();
});

function loadDashboardData() {
  const orders = OrderStorage.getOrders();
  const user = UserSession.getUser();

  // Filter orders assigned to current employee
  const myOrders = orders.filter((o) => o.assignedTo === user.id);

  const assignedOrders = myOrders.filter((o) => o.status === "Assigned").length;
  const inProgressOrders = myOrders.filter(
    (o) => o.status === "In Progress",
  ).length;
  const completedOrders = myOrders.filter(
    (o) => o.status === "Completed" || o.status === "Delivered",
  );

  // Calculate completed today
  const today = new Date().toDateString();
  const completedToday = completedOrders.filter((o) => {
    const lastUpdate = o.timeline?.[o.timeline.length - 1]?.date;
    return lastUpdate && new Date(lastUpdate).toDateString() === today;
  }).length;

  document.getElementById("assignedOrders").textContent = assignedOrders;
  document.getElementById("inProgressOrders").textContent = inProgressOrders;
  document.getElementById("completedToday").textContent = completedToday;
  document.getElementById("totalCompleted").textContent =
    completedOrders.length;

  renderOrders(myOrders.slice(0, 5));
}

function renderOrders(orders) {
  const container = document.getElementById("ordersContainer");

  if (orders.length === 0) {
    container.innerHTML = '<p class="text-muted">No orders assigned yet.</p>';
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
      <div class="mb-md">
        <div class="text-muted mb-xs">Customer: ${order.customerName}</div>
        <div class="text-muted">${order.items.length} item(s) • ${formatCurrency(order.total)}</div>
      </div>
      <div class="flex gap-md">
        <a href="/employee/order-manage.html?id=${order.id}" class="btn btn-primary btn-sm">Manage</a>
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
  };
  return classes[status] || "primary";
}
