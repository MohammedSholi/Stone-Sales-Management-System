/* Admin Requests Management JavaScript */

import { RequestStorage, UserSession } from "../storage.js";
import { formatDate, formatCurrency } from "../app.js";
import { showConfirm } from "../ui/modal.js";
import toast from "../ui/toast.js";

let requests = [];
let currentTab = "all";

document.addEventListener("DOMContentLoaded", () => {
  if (
    !UserSession.isLoggedIn() ||
    (UserSession.getRole() || "").toLowerCase() !== "admin"
  ) {
    window.location.href = "/auth/login.html";
    return;
  }

  requests = RequestStorage.getRequests();
  renderRequests();

  // Tab switching
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".tab-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentTab = btn.dataset.tab;
      renderRequests();
    });
  });
});

function renderRequests() {
  let filteredRequests = requests;

  if (currentTab !== "all") {
    const statusMap = {
      pending: ["Pending", "In Review"],
      approved: ["Approved"],
      rejected: ["Rejected"],
    };

    filteredRequests = requests.filter((r) =>
      statusMap[currentTab].includes(r.status),
    );
  }

  const container = document.getElementById("requestsContainer");

  if (filteredRequests.length === 0) {
    container.innerHTML =
      '<div class="empty-state"><p class="text-muted">No requests found</p></div>';
    return;
  }

  container.innerHTML = filteredRequests
    .map(
      (request) => `
    <div class="card mb-lg">
      <div class="flex justify-between items-start mb-lg">
        <div>
          <h3 class="mb-xs">${request.id}</h3>
          <p class="text-muted">${formatDate(request.createdAt)}</p>
        </div>
        <span class="badge badge-${getStatusBadgeClass(request.status)} badge-lg">${request.status}</span>
      </div>
      
      <div class="grid grid-cols-2 gap-lg mb-lg">
        <div>
          <strong>Customer:</strong> ${request.customerName}<br>
          <strong>Email:</strong> ${request.customerEmail || "N/A"}<br>
          <strong>Stone Type:</strong> ${request.stoneType}<br>
          <strong>Quantity:</strong> ${request.quantity} sq ft
        </div>
        <div>
          ${request.budget ? `<strong>Budget:</strong> ${formatCurrency(request.budget)}<br>` : ""}
          ${request.deadline ? `<strong>Deadline:</strong> ${formatDate(request.deadline)}<br>` : ""}
        </div>
      </div>
      
      <div class="mb-lg">
        <strong>Description:</strong>
        <p class="text-muted mt-xs">${request.description}</p>
      </div>
      
      ${
        request.status === "Pending" || request.status === "In Review"
          ? `
        <div class="flex gap-md">
          <button class="btn btn-success btn-sm" onclick="window.approveRequest('${request.id}')">Approve</button>
          <button class="btn btn-danger btn-sm" onclick="window.rejectRequest('${request.id}')">Reject</button>
          <button class="btn btn-accent btn-sm" onclick="window.convertToOrder('${request.id}')">Convert to Order</button>
        </div>
      `
          : ""
      }
    </div>
  `,
    )
    .join("");
}

window.approveRequest = function (id) {
  showConfirm({
    title: "Approve Request",
    message: "Are you sure you want to approve this custom request?",
    confirmText: "Approve",
    onConfirm: () => {
      RequestStorage.updateRequestStatus(id, "Approved");
      toast.success("Request approved successfully");
      requests = RequestStorage.getRequests();
      renderRequests();
    },
  });
};

window.rejectRequest = function (id) {
  showConfirm({
    title: "Reject Request",
    message: "Are you sure you want to reject this custom request?",
    confirmText: "Reject",
    onConfirm: () => {
      RequestStorage.updateRequestStatus(id, "Rejected");
      toast.success("Request rejected");
      requests = RequestStorage.getRequests();
      renderRequests();
    },
  });
};

window.convertToOrder = function (id) {
  showConfirm({
    title: "Convert to Order",
    message: "This will create a new order from this custom request. Continue?",
    confirmText: "Convert",
    onConfirm: () => {
      // In a real app, this would create an order and update the request
      RequestStorage.updateRequestStatus(id, "Approved");
      toast.success("Request converted to order successfully");
      requests = RequestStorage.getRequests();
      renderRequests();
    },
  });
};

function getStatusBadgeClass(status) {
  const classes = {
    Pending: "pending",
    "In Review": "warning",
    Approved: "success",
    Rejected: "danger",
  };
  return classes[status] || "primary";
}
