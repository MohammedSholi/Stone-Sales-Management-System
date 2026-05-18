/* Customer Dashboard JavaScript */

import { UserSession } from "../storage.js";
import { formatCurrency, formatDate } from "../app.js";
import { apiCall } from "../api.js";
import toast from "../ui/toast.js";
import { createPageTranslator } from "../ui/page-translator.js";

const translator = createPageTranslator({
  en: {
    welcomeLabel: "Welcome,",
    dashboardSubtitle: "Manage your orders and custom requests",
    newCustomRequest: "+ New Custom Request",
    totalOrdersLabel: "Total Orders",
    pendingOrdersLabel: "Pending",
    completedOrdersLabel: "Completed",
    requestsLabel: "Requests",
    recentOrdersHeading: "Recent Orders",
    viewAllOrders: "View All Orders",
    customRequestsHeading: "Custom Requests",
    newRequest: "New Request",
    noOrdersText: "No orders yet. Start shopping!",
    noRequestsText: "No custom requests yet.",
    viewDetails: "View Details"
  },
  ar: {
    welcomeLabel: "مرحباً،",
    dashboardSubtitle: "إدارة طلباتك والطلبات المخصصة",
    newCustomRequest: "+ طلب مخصص جديد",
    totalOrdersLabel: "إجمالي الطلبات",
    pendingOrdersLabel: "قيد الانتظار",
    completedOrdersLabel: "مكتملة",
    requestsLabel: "الطلبات",
    recentOrdersHeading: "أحدث الطلبات",
    viewAllOrders: "عرض جميع الطلبات",
    customRequestsHeading: "الطلبات المخصصة",
    newRequest: "طلب جديد",
    noOrdersText: "لا توجد طلبات بعد. ابدأ بالتسوق!",
    noRequestsText: "لا توجد طلبات مخصصة بعد.",
    viewDetails: "عرض التفاصيل"
  },
});

document.addEventListener("DOMContentLoaded", async () => {
  translator.translate();
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

  const user = UserSession.getUser();
  document.getElementById("userName").textContent =
    user.full_name || user.name || user.username || "";

  await loadDashboardData();
});

async function loadDashboardData() {
  try {
    const ordersRes = await apiCall("/orders");
    const requestsRes = await apiCall("/requests");

    const orders = ordersRes.success === false ? [] : ordersRes.data || [];
    const requests = requestsRes.success === false ? [] : requestsRes.data || [];

    const totalOrders = orders.length;
    const pendingOrders = orders.filter(
      (o) =>
        o.order_status === "Pending" ||
        o.order_status === "Assigned" ||
        o.order_status === "In Progress",
    ).length;
    const completedOrders = orders.filter(
      (o) => o.order_status === "Completed" || o.order_status === "Delivered",
    ).length;
    const totalRequests = requests.length;

    document.getElementById("totalOrders").textContent = totalOrders;
    document.getElementById("pendingOrders").textContent = pendingOrders;
    document.getElementById("completedOrders").textContent = completedOrders;
    document.getElementById("totalRequests").textContent = totalRequests;

    renderRecentOrders(orders.slice(0, 3));
    renderRequests(requests.slice(0, 3));
  } catch (err) {
    console.error("Dashboard had an error loading data:", err);

    const containerOrders = document.getElementById("recentOrders");
    const containerRequests = document.getElementById("customRequests");
    const noOrders = `<p class="text-muted">${translator.getText("noOrdersText")}</p>`;
    const noRequests = `<p class="text-muted">${translator.getText("noRequestsText")}</p>`;

    if (containerOrders) containerOrders.innerHTML = noOrders;
    if (containerRequests) containerRequests.innerHTML = noRequests;
  }
}

function renderRecentOrders(orders) {
  const container = document.getElementById("recentOrders");
  if (orders.length === 0) {
    container.innerHTML = `<p class="text-muted">${translator.getText("noOrdersText")}</p>`;
    return;
  }

  const lang = translator.getLanguage();
  const viewDetailsText = translator.getText("viewDetails");

  container.innerHTML = orders
    .map(
      (order) => `
    <div class="order-card">
      <div class="order-header">
        <div>
          <div class="order-id">${lang === "ar" ? "طلب رقم" : "Order #"}${order.order_id}</div>
          <div class="order-date">${formatDate(order.order_date)}</div>
        </div>
        <span class="badge badge-${getStatusBadgeClass(order.order_status)}">${order.order_status}</span>
      </div>
      <div class="order-items">
        ${order.item_count || 0} ${lang === "ar" ? "عنصر" : "item"}${order.item_count !== 1 ? (lang === "ar" ? "(أصناف)" : "s") : ""}
      </div>
      <div class="order-footer">
        <div class="order-total">${formatCurrency(order.total_amount)}</div>
        <a href="/customer/order-details.html?id=${order.order_id}" class="btn btn-primary btn-sm">${viewDetailsText}</a>
      </div>
    </div>
  `,
    )
    .join("");
}

function renderRequests(requests) {
  const container = document.getElementById("customRequests");
  if (requests.length === 0) {
    container.innerHTML = `<p class="text-muted">${translator.getText("noRequestsText")}</p>`;
    return;
  }

  const lang = translator.getLanguage();

  container.innerHTML = requests
    .map(
      (request) => `
    <div class="order-card">
      <div class="order-header">
        <div>
          <div class="order-id">${lang === "ar" ? "طلب مخصص رقم" : "Request #"}${request.request_id}</div>
          <div class="order-date">${formatDate(request.created_at)}</div>
        </div>
        <span class="badge badge-${getStatusBadgeClass(request.status)}">${request.status}</span>
      </div>
      <div class="order-items">
        ${request.stone_type} • ${request.quantity} ${lang === "ar" ? "وحدة" : "units"}
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
