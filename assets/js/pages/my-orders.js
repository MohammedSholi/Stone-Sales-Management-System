/* My Orders Page JavaScript — backed by PHP API */

import { apiCall } from "../api.js";
import { UserSession } from "../storage.js";
import { formatCurrency, formatDate } from "../app.js";
import toast from "../ui/toast.js";

let currentTab = "all";
let orders = [];

document.addEventListener("DOMContentLoaded", async () => {
  if (!UserSession.isLoggedIn()) {
    window.location.href = "/auth/login.html";
    return;
  }

  await loadOrders();

  // Tab switching
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".tab-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentTab = btn.dataset.tab;
      renderOrders();
    });
  });
});

async function loadOrders() {
  const res = await apiCall("/orders");

  if (!res.success) {
    toast.error(res.error?.message || "Failed to load orders");
    orders = [];
  } else {
    orders = res.data || [];
  }

  renderOrders();
}

function renderOrders() {
  const container = document.getElementById("ordersContainer");

  let filteredOrders = orders;

  if (currentTab !== "all") {
    const statusMap = {
      pending: ["Pending", "Assigned"],
      "in-progress": ["In Progress"],
      completed: ["Completed", "Delivered"],
      canceled: ["Canceled"],
    };

    filteredOrders = orders.filter((o) =>
      (statusMap[currentTab] || []).includes(o.order_status || o.status),
    );
  }

  if (filteredOrders.length === 0) {
    container.innerHTML =
      '<div class="empty-state"><p class="text-muted">No orders found</p></div>';
    return;
  }

  container.innerHTML = filteredOrders
    .map(
      (order) => `
    <div class="order-card">
      <div class="order-header">
        <div>
          <div class="order-id">Order #${order.order_id}</div>
          <div class="order-date">${formatDate(order.order_date)}</div>
        </div>
        <span class="badge badge-${getStatusBadgeClass(order.order_status)}">${order.order_status}</span>
      </div>
      <div class="order-items mb-md">
        <div class="text-muted">${order.item_count || 0} item(s)</div>
      </div>
      <div class="order-footer">
        <div class="order-total">${formatCurrency(order.total_amount)}</div>
        <a href="/customer/order-details.html?id=${order.order_id}" class="btn btn-primary btn-sm">View Details</a>
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
