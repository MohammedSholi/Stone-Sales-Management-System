/* Employee Dashboard JavaScript */

import { UserSession } from "../storage.js";
import { apiCall } from "../api.js";
import { formatCurrency, formatDate } from "../app.js";
import toast from "../ui/toast.js";
import { createPageTranslator } from "../ui/page-translator.js";

const translator = createPageTranslator({
  en: {
    employeeDashboardHeading: "Employee Dashboard",
    dashboardSubtitle: "Manage assigned orders",
    assignedOrdersLabel: "Assigned Orders",
    inProgressOrdersLabel: "In Progress",
    completedTodayLabel: "Completed Today",
    totalCompletedLabel: "Total Completed",
    assignedOrdersHeading: "My Assigned Orders",
    manageAllOrders: "Manage All Orders",
    noOrdersText: "No orders assigned yet.",
    manageButton: "Manage"
  },
  ar: {
    employeeDashboardHeading: "لوحة الموظف",
    dashboardSubtitle: "إدارة الطلبات الموكلة",
    assignedOrdersLabel: "الطلبات الموكلة",
    inProgressOrdersLabel: "قيد التنفيذ",
    completedTodayLabel: "مكتملة اليوم",
    totalCompletedLabel: "مجموع المكتمل",
    assignedOrdersHeading: "الطلبات الموكلة لي",
    manageAllOrders: "إدارة جميع الطلبات",
    noOrdersText: "لا توجد طلبات موكلة بعد.",
    manageButton: "إدارة"
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  translator.translate();
  if (
    !UserSession.isLoggedIn() ||
    (UserSession.getRole() || "").toLowerCase() !== "employee"
  ) {
    window.location.href = "/auth/login.html";
    return;
  }

  const sessionValid = await validateBackendSession();
  if (!sessionValid) {
    UserSession.logout();
    window.location.href = "/auth/login.html";
    return;
  }

  await loadDashboardData();
});

async function loadDashboardData() {
  const response = await apiCall("/employee/orders");
  if (!response.success) {
    toast.error(response.error?.message || "Failed to load employee orders");
    renderOrders([]);
    return;
  }

  const myOrders = Array.isArray(response.data) ? response.data : [];

  const assignedOrders = myOrders.filter((o) => getOrderStatus(o) === "Assigned").length;
  const inProgressOrders = myOrders.filter(
    (o) => getOrderStatus(o) === "In Progress",
  ).length;
  const completedOrders = myOrders.filter(
    (o) => ["Completed", "Delivered"].includes(getOrderStatus(o)),
  );

  // Calculate completed today
  const today = new Date().toDateString();
  const completedToday = completedOrders.filter((o) => {
    const dateValue = o.updated_at || o.order_date || o.created_at;
    return dateValue && new Date(dateValue).toDateString() === today;
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
    container.innerHTML = `<p class="text-muted">${translator.getText("noOrdersText")}</p>`;
    return;
  }

  const lang = translator.getLanguage();
  const manageText = translator.getText("manageButton");

  container.innerHTML = orders
    .map(
      (order) => `
    <div class="order-card">
      <div class="order-header">
        <div>
          <div class="order-id">${lang === "ar" ? "#" : "#"}${order.order_id}</div>
          <div class="order-date">${formatDate(order.order_date || order.created_at)}</div>
        </div>
        <span class="badge badge-${getStatusBadgeClass(getOrderStatus(order))}">${getOrderStatus(order)}</span>
      </div>
      <div class="mb-md">
        <div class="text-muted mb-xs">${lang === "ar" ? "العميل:" : "Customer:"} ${order.customer_name || (lang === "ar" ? "عميل" : "Customer")}</div>
        <div class="text-muted">${order.item_count || 0} ${lang === "ar" ? "عنصر" : "item(s)"} • ${formatCurrency(parseFloat(order.total_amount || 0))}</div>
      </div>
      <div class="flex gap-md">
        <a href="/employee/order-manage.html?id=${order.order_id}" class="btn btn-primary btn-sm">${manageText}</a>
      </div>
    </div>
  `,
    )
    .join("");
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
