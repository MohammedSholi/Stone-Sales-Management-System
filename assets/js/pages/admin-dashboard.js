/* Admin Dashboard JavaScript */

import { UserSession } from "../storage.js";
import { apiCall } from "../api.js";
import { formatCurrency, formatDate } from "../app.js";

document.addEventListener("DOMContentLoaded", async () => {
  const role = (UserSession.getRole() || "").toLowerCase();
  console.log(
    "admin-dashboard: isLoggedIn=",
    UserSession.isLoggedIn(),
    "role=",
    role,
  );
  if (!UserSession.isLoggedIn() || role !== "admin") {
    window.location.href = "/auth/login.html";
    return;
  }

  await loadDashboardData();
});

async function loadDashboardData() {
  // Fetch real data from backend in parallel
  const [ordersRes, stonesRes, requestsRes] = await Promise.all([
    apiCall("/admin/orders"),
    apiCall("/stones"),
    apiCall("/admin/requests"),
  ]);

  const orders =
    ordersRes.success && Array.isArray(ordersRes.data) ? ordersRes.data : [];
  const stones =
    stonesRes.success && stonesRes.data?.stones ? stonesRes.data.stones : [];
  const requests =
    requestsRes.success && Array.isArray(requestsRes.data)
      ? requestsRes.data
      : [];

  // Calculate stats
  const totalOrders = orders.length;
  const totalStones = stones.length;
  const totalRequests = requests.length;
  const totalRevenue = orders.reduce((sum, order) => {
    if (order.order_status !== "Canceled") {
      return sum + parseFloat(order.total_amount || 0);
    }
    return sum;
  }, 0);

  document.getElementById("totalOrders").textContent = totalOrders;
  document.getElementById("totalStones").textContent = totalStones;
  document.getElementById("totalRequests").textContent = totalRequests;
  document.getElementById("totalRevenue").textContent =
    formatCurrency(totalRevenue);

  renderRecentOrders(orders.slice(0, 5));
  renderPendingRequests(
    requests
      .filter(
        (r) =>
          (r.request_status || r.status) === "Pending" ||
          (r.request_status || r.status) === "In Review",
      )
      .slice(0, 5),
  );
}

function renderRecentOrders(orders) {
  const container = document.getElementById("recentOrders");

  if (orders.length === 0) {
    container.innerHTML = '<p class="text-muted">No orders yet.</p>';
    return;
  }

  container.innerHTML = orders
    .map(
      (order) => `
    <div class="order-card">
      <div class="order-header">
        <div>
          <div class="order-id">#${order.order_id}</div>
          <div class="order-date">${formatDate(order.order_date || order.created_at)}</div>
        </div>
        <span class="badge badge-${getStatusBadgeClass(order.order_status || order.status)}">${order.order_status || order.status}</span>
      </div>
      <div class="order-items mb-md">
        Customer #${order.customer_id}<br>
        ${formatCurrency(parseFloat(order.total_amount || 0))}
      </div>
      <a href="/admin/orders-manage.html?id=${order.order_id}" class="btn btn-primary btn-sm">View Details</a>
    </div>
  `,
    )
    .join("");
}

function renderPendingRequests(requests) {
  const container = document.getElementById("pendingRequests");

  if (requests.length === 0) {
    container.innerHTML = '<p class="text-muted">No pending requests.</p>';
    return;
  }

  container.innerHTML = requests
    .map(
      (request) => `
    <div class="order-card">
      <div class="order-header">
        <div>
          <div class="order-id">#${request.custom_order_id || request.id}</div>
          <div class="order-date">${formatDate(request.created_at || request.createdAt)}</div>
        </div>
        <span class="badge badge-${getStatusBadgeClass(request.request_status || request.status)}">${request.request_status || request.status}</span>
      </div>
      <div class="order-items mb-md">
        Customer #${request.customer_id}<br>
        ${request.stone_type || request.stoneType || ""} • ${request.requested_quantity || request.quantity || ""} ${request.unit || "sq ft"}
      </div>
      <a href="/admin/requests-manage.html?id=${request.custom_order_id || request.id}" class="btn btn-primary btn-sm">Review</a>
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
    "In Review": "warning",
    Approved: "success",
    Rejected: "danger",
  };
  return classes[status] || "primary";
}
