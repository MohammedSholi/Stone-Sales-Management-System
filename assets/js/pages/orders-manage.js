/* Admin Orders Management JavaScript */

import { UserSession } from "../storage.js";
import { apiCall } from "../api.js";
import { formatCurrency, formatDate } from "../app.js";
import toast from "../ui/toast.js";

let orders = [];
let currentTab = "all";
let focusedOrderId = null;
let focusedOrderDetails = null;

document.addEventListener("DOMContentLoaded", async () => {
  if (
    !UserSession.isLoggedIn() ||
    (UserSession.getRole() || "").toLowerCase() !== "admin"
  ) {
    window.location.href = "/auth/login.html";
    return;
  }

  focusedOrderId = new URLSearchParams(window.location.search).get("id");

  await loadOrders();

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
  const response = await apiCall("/admin/orders");
  if (!response.success) {
    toast.error(response.error?.message || "Failed to load orders");
    orders = [];
  } else {
    orders = Array.isArray(response.data) ? response.data : [];
  }

  renderOverview();
  renderOrders();
  await loadFocusedOrderDetails();
  renderFocusedOrder();
}

async function loadFocusedOrderDetails() {
  focusedOrderDetails = null;
  if (!focusedOrderId) return;

  const response = await apiCall(`/orders/${focusedOrderId}`);
  if (response.success && response.data) {
    focusedOrderDetails = response.data;
  }
}

function renderOverview() {
  const total = orders.length;
  const pending = orders.filter((o) => getOrderStatus(o) === "Pending").length;
  const inProgress = orders.filter((o) =>
    ["Assigned", "In Progress"].includes(getOrderStatus(o)),
  ).length;
  const done = orders.filter((o) =>
    ["Completed", "Delivered"].includes(getOrderStatus(o)),
  ).length;

  const totalEl = document.getElementById("ordersMetricTotal");
  const pendingEl = document.getElementById("ordersMetricPending");
  const inProgressEl = document.getElementById("ordersMetricInProgress");
  const doneEl = document.getElementById("ordersMetricDone");

  if (totalEl) totalEl.textContent = String(total);
  if (pendingEl) pendingEl.textContent = String(pending);
  if (inProgressEl) inProgressEl.textContent = String(inProgress);
  if (doneEl) doneEl.textContent = String(done);
}

function renderOrders() {
  let filteredOrders = orders;

  if (currentTab !== "all") {
    const statusMap = {
      pending: ["Pending"],
      "in-progress": ["Assigned", "In Progress"],
      completed: ["Completed", "Delivered"],
    };

    filteredOrders = orders.filter((o) =>
      statusMap[currentTab].includes(getOrderStatus(o)),
    );
  }

  const tbody = document.getElementById("ordersTableBody");
  if (!tbody) return;

  if (filteredOrders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted">No orders match this filter.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filteredOrders
    .map((order) => {
      const orderId = getOrderId(order);
      const status = getOrderStatus(order);
      const amount = parseFloat(order.total_amount ?? order.total ?? 0);
      const customer = order.customer_name || order.customerName || "Customer";
      const dateValue = order.order_date || order.created_at || order.createdAt;
      const assigned = order.employee_name || "Unassigned";

      return `
      <tr>
        <td><strong>#${orderId}</strong></td>
        <td>${customer}</td>
        <td>${formatDate(dateValue)}</td>
        <td>${formatCurrency(amount)}</td>
        <td><span class="badge badge-${getStatusBadgeClass(status)}">${status}</span></td>
        <td>${assigned}</td>
        <td>
          <div class="orders-actions">
            <a href="/admin/orders-manage.html?id=${orderId}" class="btn btn-primary btn-sm">View Details</a>
          </div>
        </td>
      </tr>
    `;
    })
    .join("");
}

function renderFocusedOrder() {
  const section = document.getElementById("focusedOrderSection");
  const container = document.getElementById("focusedOrderContent");
  if (!section || !container) return;

  if (!focusedOrderId) {
    section.hidden = true;
    container.innerHTML = "";
    return;
  }

  const order = orders.find(
    (item) => String(getOrderId(item)) === String(focusedOrderId),
  );
  if (!order) {
    section.hidden = false;
    container.innerHTML = `
      <div class="focused-order-card">
        <div class="focused-order-head">
          <div>
            <h2 class="focused-order-title">Order #${focusedOrderId}</h2>
            <p class="focused-order-subtitle">The selected order was not found.</p>
          </div>
        </div>
      </div>
    `;
    return;
  }

  const fullOrder = focusedOrderDetails || order;
  const orderId = getOrderId(order);
  const status = getOrderStatus(order);
  const amount = parseFloat(
    fullOrder.total_amount ??
      fullOrder.total ??
      order.total_amount ??
      order.total ??
      0,
  );
  const orderDate =
    fullOrder.order_date || fullOrder.created_at || fullOrder.createdAt;
  const updatedDate = fullOrder.updated_at || fullOrder.updatedAt || orderDate;
  const items = Array.isArray(fullOrder.items) ? fullOrder.items : [];
  const customerName =
    fullOrder.customer_name ||
    fullOrder.customerName ||
    order.customer_name ||
    order.customerName ||
    "Customer";
  const customerEmail =
    fullOrder.customer_email || fullOrder.customerEmail || "-";
  const customerPhone =
    fullOrder.customer_phone || fullOrder.customerPhone || "-";
  const address =
    fullOrder.customer_address || fullOrder.deliveryAddress || "-";
  const assigned =
    order.employee_name || fullOrder.employee_name || "Unassigned";

  section.hidden = false;
  container.innerHTML = `
    <article class="focused-order-card">
      <header class="focused-order-head">
        <div>
          <h2 class="focused-order-title">Order #${orderId}</h2>
          <p class="focused-order-subtitle">Placed on ${formatDate(orderDate)} • Last update ${formatDate(updatedDate)}</p>
        </div>
        <span class="badge badge-${getStatusBadgeClass(status)} badge-lg">${status}</span>
      </header>

      <div class="focused-order-body">
        <section>
          <div class="order-info-grid">
            <article class="order-info-item">
              <span class="order-info-label">Customer</span>
              <p class="order-info-value">${customerName}</p>
            </article>
            <article class="order-info-item">
              <span class="order-info-label">Assigned Employee</span>
              <p class="order-info-value">${assigned}</p>
            </article>
            <article class="order-info-item">
              <span class="order-info-label">Email</span>
              <p class="order-info-value">${customerEmail}</p>
            </article>
            <article class="order-info-item">
              <span class="order-info-label">Phone</span>
              <p class="order-info-value">${customerPhone}</p>
            </article>
            <article class="order-info-item" style="grid-column: 1 / -1;">
              <span class="order-info-label">Delivery Address</span>
              <p class="order-info-value">${address}</p>
            </article>
            <article class="order-info-item" style="grid-column: 1 / -1;">
              <span class="order-info-label">Total Amount</span>
              <p class="order-info-value text-accent">${formatCurrency(amount)}</p>
            </article>
          </div>

          <div class="focused-order-items">
            <h3>Order Items</h3>
            <div class="table-container">
              <table class="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${renderItemRows(items)}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <aside class="focused-order-actions">
          <h3>Order Actions</h3>
          <div class="form-group">
            <label for="adminOrderStatus" class="form-label">Update Status</label>
            <select id="adminOrderStatus" class="form-input">
              ${renderStatusOptions(status)}
            </select>
          </div>
          <button id="saveOrderStatusBtn" class="btn btn-accent w-full" data-order-id="${orderId}">Save Status</button>
          <p class="focused-order-note">This updates workflow immediately for admin and employee dashboards.</p>
        </aside>
      </div>
    </article>
  `;

  const saveBtn = document.getElementById("saveOrderStatusBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const selectedStatus = document.getElementById("adminOrderStatus")?.value;
      if (!selectedStatus) {
        toast.error("Please select a status");
        return;
      }
      await updateOrderStatus(orderId, selectedStatus);
    });
  }
}

function renderItemRows(items) {
  if (!items.length) {
    return '<tr><td colspan="4" class="text-muted">No line items available.</td></tr>';
  }

  return items
    .map((item) => {
      const itemName =
        item.name ||
        item.stone_name ||
        `Stone #${item.stone_id || item.stoneId || "-"}`;
      const qty = item.quantity_ordered ?? item.quantity ?? 0;
      const price = parseFloat(item.unit_price ?? item.price ?? 0);
      const total = parseFloat(item.subtotal ?? item.total ?? price * qty);

      return `
        <tr>
          <td>${itemName}</td>
          <td>${formatCurrency(price)}</td>
          <td>${qty}</td>
          <td>${formatCurrency(total)}</td>
        </tr>
      `;
    })
    .join("");
}

function renderStatusOptions(currentStatus) {
  const statuses = [
    "Pending",
    "Assigned",
    "In Progress",
    "Completed",
    "Delivered",
    "Canceled",
  ];

  return statuses
    .map(
      (status) =>
        `<option value="${status}" ${status === currentStatus ? "selected" : ""}>${status}</option>`,
    )
    .join("");
}

async function updateOrderStatus(orderId, status) {
  const response = await apiCall(`/admin/orders/${orderId}/status`, "PUT", {
    status,
  });
  if (!response.success) {
    toast.error(response.error?.message || "Failed to update order status");
    return;
  }

  toast.success("Order status updated");
  await loadOrders();
}

function getOrderId(order) {
  return order.order_id ?? order.id;
}

function getOrderStatus(order) {
  return order.order_status || order.status || "Pending";
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
