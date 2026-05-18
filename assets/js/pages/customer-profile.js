import { API_BASE, apiCall } from "../api.js";
import { UserSession } from "../storage.js";
import { formatCurrency, formatDate } from "../app.js";
import toast from "../ui/toast.js";

const state = { profile: null };

document.addEventListener("DOMContentLoaded", async () => {
  if (!(await ensureCustomerSession())) return;
  bindPasswordToggles();
  bindForms();
  await loadProfile();
});

async function ensureCustomerSession() {
  const role = (UserSession.getRole() || "").toLowerCase();
  if (!UserSession.isLoggedIn() || role !== "customer") {
    window.location.href = "/auth/login.html";
    return false;
  }

  const sessionValid = await validateBackendSession();
  if (!sessionValid) {
    UserSession.logout();
    window.location.href = "/auth/login.html";
    return false;
  }

  return true;
}

async function loadProfile() {
  const res = await apiCall("/customer/profile");
  if (!res.success) {
    toast.error(res.error?.message || "Failed to load profile");
    return;
  }

  state.profile = res.data;
  renderProfile(res.data);

  const current = UserSession.getUser() || {};
  const nextAvatar =
    res.data?.user?.avatar_url || res.data?.profile?.avatar_url || null;
  if (current.avatar_url !== nextAvatar) {
    if (window.SSMS?.setUserSession) {
      window.SSMS.setUserSession(
        { ...current, avatar_url: nextAvatar },
        UserSession.getRole(),
      );
    } else {
      UserSession.setUser(
        { ...current, avatar_url: nextAvatar },
        UserSession.getRole(),
      );
    }
  }
}

function renderProfile(data) {
  const user = data.user || {};
  const profile = data.profile || {};
  const stats = data.stats || {};
  const recentOrders = data.recent_orders || [];

  const fullName =
    user.full_name ||
    `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
    user.username ||
    "Customer";
  const initials = getInitials(fullName);
  const avatarUrl = profile.avatar_url || null;

  setText("profileTitle", fullName);
  setText("profileSubtitle", `@${user.username || "customer"}`);
  setText("profileStatusBadge", user.account_status || "Active");
  setText(
    "profileTierBadge",
    (user.email ? "Verified" : "Standard") +
      (stats.total_amount_spent > 5000 ? " Premium" : ""),
  );

  const meta = document.getElementById("profileMeta");
  if (meta) {
    meta.innerHTML = `
      <span>Username: <strong>${escapeHTML(user.username || "")}</strong></span>
      <span>Email: <strong>${escapeHTML(user.email || "—")}</strong></span>
      <span>Phone: <strong>${escapeHTML(user.phone || "—")}</strong></span>
      <span>Member since: <strong>${formatDate(user.created_at)}</strong></span>
    `;
  }

  renderAvatar("profileAvatar", avatarUrl, initials);
  renderStats(stats);
  renderRecentOrders(recentOrders);

  setValue("firstName", profile.first_name || splitName(fullName).first);
  setValue("lastName", profile.last_name || splitName(fullName).last);
  setValue("profileEmail", user.email || "");
  setValue("profilePhone", user.phone || "");
  setValue("profileAddress", user.address || "");
  setValue("profileCity", profile.city || "");
  setValue("profileCountry", profile.country || "");
  setValue("profilePostalCode", profile.postal_code || "");
}

function renderAvatar(containerId, avatarUrl, initials) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (avatarUrl) {
    container.innerHTML = `<img src="${escapeHTML(avatarUrl)}" alt="Profile avatar" />`;
  } else {
    container.textContent = initials;
  }

  const preview = document.getElementById("avatarPreview");
  if (preview) {
    if (avatarUrl) {
      preview.innerHTML = `<img src="${escapeHTML(avatarUrl)}" alt="Profile avatar" />`;
    } else {
      preview.textContent = initials;
    }
  }
}

function renderStats(stats) {
  const container = document.getElementById("profileStats");
  if (!container) return;

  const items = [
    ["Total Orders", stats.total_orders ?? 0],
    ["Completed Orders", stats.completed_orders ?? 0],
    ["Pending Orders", stats.pending_orders ?? 0],
    ["Total Spent", formatCurrency(stats.total_amount_spent ?? 0)],
    ["Wishlist Count", stats.wishlist_count ?? 0],
    ["Reviews Count", stats.review_count ?? 0],
  ];

  container.innerHTML = items
    .map(
      ([label, value]) => `
        <article class="account-stat">
          <span class="account-stat__label">${escapeHTML(label)}</span>
          <p class="account-stat__value">${escapeHTML(String(value))}</p>
        </article>
      `,
    )
    .join("");
}

function renderRecentOrders(orders) {
  const body = document.getElementById("recentOrdersBody");
  if (!body) return;

  if (!orders.length) {
    body.innerHTML = `<tr><td colspan="5"><div class="account-empty">No orders yet. Start shopping to see activity here.</div></td></tr>`;
    return;
  }

  body.innerHTML = orders
    .map(
      (order) => `
        <tr>
          <td><strong>#${escapeHTML(String(order.order_id))}</strong><div class="mini-muted">${escapeHTML(String(order.item_count || 0))} item(s)</div></td>
          <td>${formatDate(order.order_date)}</td>
          <td><span class="badge badge-${getStatusBadgeClass(order.order_status)}">${escapeHTML(order.order_status || "")}</span></td>
          <td>${formatCurrency(order.total_amount || 0)}</td>
          <td><a class="btn btn-primary btn-sm" href="/customer/order-details.html?id=${order.order_id}">View Order</a></td>
        </tr>
      `,
    )
    .join("");
}

function bindForms() {
  const profileForm = document.getElementById("profileForm");
  if (profileForm) {
    profileForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = {
        first_name: getValue("firstName"),
        last_name: getValue("lastName"),
        email: getValue("profileEmail"),
        phone: getValue("profilePhone"),
        address: getValue("profileAddress"),
        city: getValue("profileCity"),
        country: getValue("profileCountry"),
        postal_code: getValue("profilePostalCode"),
      };

      const res = await apiCall("/customer/profile", "PUT", payload);
      if (!res.success) {
        toast.error(res.error?.message || "Failed to update profile");
        return;
      }

      if (res.data?.user) {
        const current = UserSession.getUser() || {};
        UserSession.setUser(
          { ...current, ...res.data.user },
          UserSession.getRole(),
        );
      }

      state.profile = res.data;
      renderProfile(res.data);
      toast.success("Profile updated successfully");
    });
  }

  const avatarForm = document.getElementById("avatarForm");
  if (avatarForm) {
    avatarForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const input = document.getElementById("avatarInput");
      if (!input || !input.files || !input.files[0]) {
        toast.error("Choose an image first");
        return;
      }

      const formData = new FormData();
      formData.append("avatar", input.files[0]);

      const response = await fetch(`${API_BASE}/customer/avatar`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data?.error?.message || "Failed to upload image");
        return;
      }

      const current = UserSession.getUser() || {};
      const updatedUser = { ...current, avatar_url: data.avatar_url || null };
      if (window.SSMS?.setUserSession) {
        window.SSMS.setUserSession(updatedUser, UserSession.getRole());
      } else {
        UserSession.setUser(updatedUser, UserSession.getRole());
      }

      toast.success("Profile image updated successfully");
      input.value = "";
      await loadProfile();
    });
  }

  const passwordForm = document.getElementById("passwordForm");
  if (passwordForm) {
    passwordForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = {
        current_password: getValue("currentPassword"),
        new_password: getValue("newPassword"),
        confirm_password: getValue("confirmPassword"),
      };

      const res = await apiCall("/customer/password", "PUT", payload);
      if (!res.success) {
        toast.error(res.error?.message || "Failed to update password");
        return;
      }

      passwordForm.reset();
      toast.success("Password updated successfully");
    });
  }
}

function bindPasswordToggles() {
  document.querySelectorAll(".password-toggle").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      const targetId = btn.getAttribute("data-target");
      const input = targetId ? document.getElementById(targetId) : null;
      if (!input) return;

      const show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.classList.toggle("is-visible", show);

      const showIcon = btn.querySelector(".icon-show");
      const hideIcon = btn.querySelector(".icon-hide");
      if (showIcon) showIcon.hidden = show;
      if (hideIcon) hideIcon.hidden = !show;

      btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
      btn.setAttribute("aria-pressed", show ? "true" : "false");
    });
  });
}

async function validateBackendSession() {
  try {
    const response = await apiCall("/auth/me");
    return response && (response.data || response.user_id);
  } catch {
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

function splitName(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return { first: parts[0] || "", last: parts.slice(1).join(" ") };
}

function getInitials(name) {
  return (
    String(name || "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "HJ"
  );
}

function getValue(id) {
  const element = document.getElementById(id);
  return element ? element.value.trim() : "";
}

function setValue(id, value) {
  const element = document.getElementById(id);
  if (element) element.value = value ?? "";
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
