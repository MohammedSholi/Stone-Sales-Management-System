import { API_BASE, apiCall } from "../api.js";
import { UserSession } from "../storage.js";
import toast from "../ui/toast.js";
import { formatDate } from "../app.js";
import { showConfirm } from "../ui/modal.js";

const state = {
  settings: null,
  addresses: [],
  paymentMethods: [],
  sessions: [],
};

const timezones = [
  "Asia/Jerusalem",
  "Europe/London",
  "Europe/Paris",
  "Asia/Dubai",
  "Asia/Riyadh",
  "UTC",
  "America/New_York",
  "Asia/Tokyo",
];

document.addEventListener("DOMContentLoaded", async () => {
  if (!(await ensureCustomerSession())) return;
  populateTimezones();
  bindTabs();
  bindPasswordToggles();
  bindForms();
  bindActions();
  await loadSettings();
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

async function loadSettings() {
  const res = await apiCall("/customer/settings");
  if (!res.success) {
    toast.error(res.error?.message || "Failed to load settings");
    return;
  }

  state.settings = res.data.settings || {};
  state.addresses = res.data.addresses || [];
  state.paymentMethods = res.data.payment_methods || [];
  state.sessions = res.data.sessions || [];

  renderBundle();

  const current = UserSession.getUser() || {};
  const nextAvatar = res.data?.settings?.avatar_url || null;
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

function renderBundle() {
  renderGeneralForm();
  renderNotificationForm();
  renderSecurityForm();
  renderAddresses();
  renderPaymentMethods();
  renderSessions();
  renderHeaderAvatar();
}

function renderHeaderAvatar() {
  const user = UserSession.getUser() || {};
  const fullName = user.full_name || user.username || "Customer";
  const initials = getInitials(fullName);
  const avatarUrl = state.settings?.avatar_url || null;

  const heroAvatar = document.getElementById("settingsAvatar");
  const previewAvatar = document.getElementById("settingsAvatarPreview");
  [heroAvatar, previewAvatar].forEach((el) => {
    if (!el) return;
    if (avatarUrl) {
      el.innerHTML = `<img src="${escapeHTML(avatarUrl)}" alt="Profile avatar" />`;
    } else {
      el.textContent = initials;
    }
  });

  setText("settingsTitle", fullName);
  setText(
    "settingsSubtitle",
    `@${user.username || "customer"} · update your preferences and security settings.`,
  );
  setText(
    "settingsPreviewBadge",
    capitalize(state.settings?.theme_preference || "system"),
  );
}

function renderGeneralForm() {
  const settings = state.settings || {};
  setValue("displayName", settings.display_name || "");
  setValue("languageSelect", settings.preferred_language || "en");
  setValue("currencySelect", settings.preferred_currency || "USD");
  setValue("timezoneSelect", settings.timezone || "Asia/Jerusalem");
  setValue("themeSelect", settings.theme_preference || "system");
  setValue("recoveryEmail", settings.recovery_email || "");
  setValue("recoveryPhone", settings.recovery_phone || "");
  syncThemePreview(settings.theme_preference || "system");
}

function renderNotificationForm() {
  const settings = state.settings || {};
  setChecked("emailNotifications", !!Number(settings.email_notifications ?? 1));
  setChecked("smsNotifications", !!Number(settings.sms_notifications ?? 0));
  setChecked("orderUpdates", !!Number(settings.order_updates ?? 1));
  setChecked("marketingEmails", !!Number(settings.marketing_emails ?? 0));
  setChecked("securityAlerts", !!Number(settings.security_alerts ?? 1));
  setChecked("twoFactorEnabled", !!Number(settings.two_factor_enabled ?? 0));
  setChecked("profilePublic", !!Number(settings.privacy_profile_public ?? 1));
}

function renderSecurityForm() {
  // kept for symmetry; fields are filled in renderNotificationForm
}

function renderAddresses() {
  const container = document.getElementById("addressList");
  if (!container) return;

  if (!state.addresses.length) {
    container.innerHTML = `<div class="account-empty">No saved addresses yet. Add your shipping or billing destination.</div>`;
    return;
  }

  container.innerHTML = state.addresses
    .map(
      (address) => `
      <article class="account-list-item">
        <div class="account-list-item__title">
          <strong>${escapeHTML(address.label || "Address")}</strong>
          <span class="account-actions-row">
            ${Number(address.is_default_shipping) ? '<span class="badge badge-primary">Shipping</span>' : ""}
            ${Number(address.is_default_billing) ? '<span class="badge badge-secondary">Billing</span>' : ""}
          </span>
        </div>
        <div class="account-list-item__meta">
          ${escapeHTML(address.full_name || "")}<br />
          ${escapeHTML(address.line1 || "")}${address.line2 ? `<br />${escapeHTML(address.line2)}` : ""}<br />
          ${escapeHTML(address.city || "")}, ${escapeHTML(address.country || "")} ${escapeHTML(address.postal_code || "")}
        </div>
        <div class="account-actions-row">
          <button class="btn btn-secondary btn-sm" data-action="edit-address" data-id="${address.address_id}">Edit</button>
          <button class="btn btn-danger btn-sm" data-action="delete-address" data-id="${address.address_id}">Delete</button>
        </div>
      </article>
    `,
    )
    .join("");

  container.querySelectorAll('[data-action="edit-address"]').forEach((btn) => {
    btn.addEventListener("click", () => editAddress(Number(btn.dataset.id)));
  });

  container
    .querySelectorAll('[data-action="delete-address"]')
    .forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = Number(btn.dataset.id);
        const res = await apiCall(`/customer/addresses/${id}`, "DELETE");
        if (!res.success) {
          toast.error(res.error?.message || "Failed to delete address");
          return;
        }
        toast.success("Address deleted successfully");
        await loadSettings();
      });
    });
}

function renderPaymentMethods() {
  const container = document.getElementById("paymentList");
  if (!container) return;

  if (!state.paymentMethods.length) {
    container.innerHTML = `<div class="account-empty">No saved cards yet. Add a payment method for faster checkout.</div>`;
    return;
  }

  container.innerHTML = state.paymentMethods
    .map(
      (method) => `
      <article class="account-list-item">
        <div class="account-list-item__title">
          <strong>${escapeHTML(method.card_brand || "Card")} · ${escapeHTML(method.masked_card_number || `•••• •••• •••• ${method.card_last4 || "0000"}`)}</strong>
          <span>${Number(method.is_default) ? '<span class="badge badge-primary">Default</span>' : ""}</span>
        </div>
        <div class="account-list-item__meta">
          ${escapeHTML(method.card_holder_name || "")}<br />
          Expires ${escapeHTML(String(method.exp_month).padStart(2, "0"))}/${escapeHTML(String(method.exp_year || ""))}
        </div>
        <div class="account-actions-row">
          ${!Number(method.is_default) ? `<button class="btn btn-secondary btn-sm" data-action="default-card" data-id="${method.payment_method_id}">Set Default</button>` : ""}
          <button class="btn btn-danger btn-sm" data-action="delete-card" data-id="${method.payment_method_id}">Remove</button>
        </div>
      </article>
    `,
    )
    .join("");

  container.querySelectorAll('[data-action="default-card"]').forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.dataset.id);
      const res = await apiCall(
        `/customer/payment-methods/${id}/default`,
        "PUT",
      );
      if (!res.success) {
        toast.error(res.error?.message || "Failed to update default card");
        return;
      }
      toast.success("Default payment method updated");
      await loadSettings();
    });
  });

  container.querySelectorAll('[data-action="delete-card"]').forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.dataset.id);
      const res = await apiCall(`/customer/payment-methods/${id}`, "DELETE");
      if (!res.success) {
        toast.error(res.error?.message || "Failed to remove payment method");
        return;
      }
      toast.success("Payment method removed");
      await loadSettings();
    });
  });
}

function renderSessions() {
  const currentContainer = document.getElementById("sessionsList");
  const historyContainer = document.getElementById("loginHistoryList");
  const activeSessions = state.sessions.filter(
    (session) => Number(session.is_revoked) === 0,
  );

  const render = (container, items, emptyText) => {
    if (!container) return;
    if (!items.length) {
      container.innerHTML = `<div class="account-empty">${escapeHTML(emptyText)}</div>`;
      return;
    }

    container.innerHTML = items
      .map(
        (session) => `
          <article class="account-list-item">
            <div class="account-list-item__title">
              <strong>${escapeHTML(session.device_name || "Web Browser")}</strong>
              <span>${Number(session.is_current) ? '<span class="badge badge-primary">Current</span>' : ""}${Number(session.is_revoked) ? ' <span class="badge badge-danger">Revoked</span>' : ""}</span>
            </div>
            <div class="account-list-item__meta">
              ${escapeHTML(session.ip_address || "Unknown IP")}<br />
              Last seen: ${formatDate(session.last_seen_at || session.created_at)}<br />
              Signed in: ${formatDate(session.created_at)}
            </div>
          </article>
        `,
      )
      .join("");
  };

  render(currentContainer, activeSessions, "No active sessions.");
  render(historyContainer, state.sessions.slice(0, 8), "No login history yet.");
}

function bindTabs() {
  document.querySelectorAll(".account-tab-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const tab = button.dataset.tab;
      document
        .querySelectorAll(".account-tab-btn")
        .forEach((el) => el.classList.remove("is-active"));
      document
        .querySelectorAll(".account-panel")
        .forEach((panel) => panel.classList.remove("is-active"));
      button.classList.add("is-active");
      document
        .querySelector(`.account-panel[data-panel="${tab}"]`)
        ?.classList.add("is-active");
    });
  });
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
    });
  });
}

function bindForms() {
  const generalSettingsForm = document.getElementById("generalSettingsForm");
  if (generalSettingsForm) {
    generalSettingsForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = buildSettingsPayload({
        preferred_language: getValue("languageSelect") || "en",
        preferred_currency: getValue("currencySelect") || "USD",
        timezone: getValue("timezoneSelect") || "Asia/Jerusalem",
        theme_preference: getValue("themeSelect") || "system",
      });

      const res = await apiCall("/customer/settings", "PUT", payload);
      if (!res.success) {
        toast.error(res.error?.message || "Failed to save settings");
        return;
      }

      state.settings = res.data.settings || state.settings;
      syncThemePreference(payload.theme_preference);
      renderBundle();
      toast.success("General settings saved");
    });
  }

  const profileImageInput = document.getElementById("profileImageInput");
  if (profileImageInput) {
    profileImageInput.addEventListener("change", async () => {
      if (!profileImageInput.files?.length) return;

      const formData = new FormData();
      formData.append("avatar", profileImageInput.files[0]);

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
      profileImageInput.value = "";
      await loadSettings();
    });
  }

  const notificationsForm = document.getElementById("notificationsForm");
  if (notificationsForm) {
    notificationsForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = buildSettingsPayload({
        email_notifications: isChecked("emailNotifications"),
        sms_notifications: isChecked("smsNotifications"),
        order_updates: isChecked("orderUpdates"),
        marketing_emails: isChecked("marketingEmails"),
        security_alerts: isChecked("securityAlerts"),
      });

      const res = await apiCall("/customer/settings", "PUT", payload);
      if (!res.success) {
        toast.error(
          res.error?.message || "Failed to save notification settings",
        );
        return;
      }

      state.settings = res.data.settings || state.settings;
      renderBundle();
      toast.success("Notification settings saved");
    });
  }

  const securityForm = document.getElementById("securityForm");
  if (securityForm) {
    securityForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = buildSettingsPayload({
        two_factor_enabled: isChecked("twoFactorEnabled"),
        privacy_profile_public: isChecked("profilePublic"),
      });

      const res = await apiCall("/customer/settings", "PUT", payload);
      if (!res.success) {
        toast.error(res.error?.message || "Failed to save security settings");
        return;
      }

      state.settings = res.data.settings || state.settings;
      renderBundle();
      toast.success("Security settings saved");
    });
  }

  const passwordForm = document.getElementById("passwordForm");
  if (passwordForm) {
    passwordForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = {
        current_password: getValue("settingsCurrentPassword"),
        new_password: getValue("settingsNewPassword"),
        confirm_password: getValue("settingsConfirmPassword"),
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

  const addressForm = document.getElementById("addressForm");
  if (addressForm) {
    addressForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const addressId = getValue("addressId");
      const payload = {
        address_id: addressId || undefined,
        label: getValue("addressLabel") || "Home",
        full_name: getValue("addressFullName"),
        phone: getValue("addressPhone"),
        line1: getValue("addressLine1"),
        line2: getValue("addressLine2"),
        city: getValue("addressCity"),
        country: getValue("addressCountry"),
        postal_code: getValue("addressPostalCode"),
        is_default_shipping: isChecked("defaultShipping"),
        is_default_billing: isChecked("defaultBilling"),
      };

      const method = addressId ? "PUT" : "POST";
      const res = await apiCall("/customer/addresses", method, payload);
      if (!res.success) {
        toast.error(res.error?.message || "Failed to save address");
        return;
      }

      clearAddressForm();
      toast.success("Address saved successfully");
      await loadSettings();
    });
  }

  const paymentForm = document.getElementById("paymentForm");
  if (paymentForm) {
    paymentForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = {
        card_number: getValue("cardNumber"),
        card_holder_name: getValue("cardHolder"),
        exp_month: getValue("cardMonth"),
        exp_year: getValue("cardYear"),
        is_default: isChecked("defaultPayment"),
      };

      const res = await apiCall("/customer/payment-methods", "POST", payload);
      if (!res.success) {
        toast.error(res.error?.message || "Failed to save payment method");
        return;
      }

      paymentForm.reset();
      toast.success("Payment method saved successfully");
      await loadSettings();
    });
  }

  const deactivateForm = document.getElementById("deactivateForm");
  if (deactivateForm) {
    deactivateForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const currentPassword = getValue("deactivatePassword");
      if (!currentPassword) {
        toast.error("Enter your current password");
        return;
      }

      const res = await apiCall("/customer/account/deactivate", "POST", {
        current_password: currentPassword,
      });
      if (!res.success) {
        toast.error(res.error?.message || "Failed to deactivate account");
        return;
      }

      toast.success("Account deactivated");
      UserSession.logout();
      window.location.href = "/auth/login.html";
    });
  }
}

function bindActions() {
  const logoutAllBtn = document.getElementById("logoutAllBtn");
  if (logoutAllBtn) {
    logoutAllBtn.addEventListener("click", () => {
      showConfirm({
        title: "Logout All Devices",
        message: "This will end every active session for your account.",
        confirmText: "Logout All",
        cancelText: "Cancel",
        onConfirm: async () => {
          const res = await apiCall("/customer/sessions/logout-all", "POST");
          if (!res.success) {
            toast.error(res.error?.message || "Failed to logout all devices");
            return;
          }
          UserSession.logout();
          window.location.href = "/auth/login.html";
        },
      });
    });
  }

  const deleteAccountBtn = document.getElementById("deleteAccountBtn");
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener("click", () => {
      showConfirm({
        title: "Delete Account",
        message:
          "This permanently anonymizes your profile details and removes saved addresses/cards.",
        confirmText: "Delete Account",
        cancelText: "Cancel",
        onConfirm: async () => {
          const currentPassword = getValue("deactivatePassword");
          if (!currentPassword) {
            toast.error("Enter your current password first");
            return;
          }

          const res = await apiCall("/customer/account", "DELETE", {
            current_password: currentPassword,
          });
          if (!res.success) {
            toast.error(res.error?.message || "Failed to delete account");
            return;
          }

          UserSession.logout();
          window.location.href = "/auth/login.html";
        },
      });
    });
  }

  const downloadPersonalDataBtn = document.getElementById(
    "downloadPersonalDataBtn",
  );
  if (downloadPersonalDataBtn) {
    downloadPersonalDataBtn.addEventListener("click", () => {
      const payload = {
        profile: state.settings,
        addresses: state.addresses,
        payment_methods: state.paymentMethods,
        sessions: state.sessions,
      };
      downloadJson(`hajari-personal-data-${Date.now()}.json`, payload);
    });
  }

  const exportOrdersBtn = document.getElementById("exportOrdersBtn");
  if (exportOrdersBtn) {
    exportOrdersBtn.addEventListener("click", async () => {
      const res = await apiCall("/orders");
      if (!res.success) {
        toast.error(res.error?.message || "Failed to export order history");
        return;
      }
      downloadJson(`hajari-order-history-${Date.now()}.json`, res.data || []);
    });
  }

  const cancelAddressEditBtn = document.getElementById("cancelAddressEditBtn");
  if (cancelAddressEditBtn) {
    cancelAddressEditBtn.addEventListener("click", clearAddressForm);
  }
}

function populateTimezones() {
  const select = document.getElementById("timezoneSelect");
  if (!select) return;

  select.innerHTML = timezones
    .map((zone) => `<option value="${zone}">${zone}</option>`)
    .join("");
}

function editAddress(addressId) {
  const address = state.addresses.find(
    (item) => Number(item.address_id) === addressId,
  );
  if (!address) return;

  setValue("addressId", address.address_id);
  setValue("addressLabel", address.label || "Home");
  setValue("addressFullName", address.full_name || "");
  setValue("addressPhone", address.phone || "");
  setValue("addressLine1", address.line1 || "");
  setValue("addressLine2", address.line2 || "");
  setValue("addressCity", address.city || "");
  setValue("addressCountry", address.country || "");
  setValue("addressPostalCode", address.postal_code || "");
  setChecked("defaultShipping", !!Number(address.is_default_shipping));
  setChecked("defaultBilling", !!Number(address.is_default_billing));
  setText("addressFormTitle", `Edit ${address.label || "Address"}`);
}

function clearAddressForm() {
  [
    "addressId",
    "addressFullName",
    "addressPhone",
    "addressLine1",
    "addressLine2",
    "addressCity",
    "addressCountry",
    "addressPostalCode",
  ].forEach((id) => setValue(id, ""));
  setValue("addressLabel", "Home");
  setChecked("defaultShipping", false);
  setChecked("defaultBilling", false);
  setText("addressFormTitle", "Add Address");
}

function buildSettingsPayload(overrides = {}) {
  return {
    display_name: getValue("displayName") || null,
    preferred_language: getValue("languageSelect") || "en",
    preferred_currency: getValue("currencySelect") || "USD",
    timezone: getValue("timezoneSelect") || "Asia/Jerusalem",
    theme_preference: getValue("themeSelect") || "system",
    recovery_email: getValue("recoveryEmail") || null,
    recovery_phone: getValue("recoveryPhone") || null,
    email_notifications: isChecked("emailNotifications"),
    sms_notifications: isChecked("smsNotifications"),
    order_updates: isChecked("orderUpdates"),
    marketing_emails: isChecked("marketingEmails"),
    security_alerts: isChecked("securityAlerts"),
    two_factor_enabled: isChecked("twoFactorEnabled"),
    privacy_profile_public: isChecked("profilePublic"),
    ...overrides,
  };
}

function syncThemePreference(preference) {
  if (preference === "dark") {
    if (!window.SSMSTheme) return;
    window.SSMSTheme.set(true);
  } else if (preference === "light") {
    if (!window.SSMSTheme) return;
    window.SSMSTheme.set(false);
  } else {
    localStorage.removeItem("ssms_dark_mode");
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark-mode", prefersDark);
    document.body.classList.toggle("dark-mode", prefersDark);
    document.querySelectorAll(".theme-toggle__input").forEach((box) => {
      box.checked = prefersDark;
    });
  }
}

function syncThemePreview(preference) {
  const badge = document.getElementById("settingsPreviewBadge");
  if (badge) badge.textContent = capitalize(preference || "system");
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function validateBackendSession() {
  return apiCall("/auth/me")
    .then((response) => response && (response.data || response.user_id))
    .catch(() => false);
}

function getValue(id) {
  const element = document.getElementById(id);
  return element ? element.value.trim() : "";
}

function setValue(id, value) {
  const element = document.getElementById(id);
  if (element) element.value = value ?? "";
}

function isChecked(id) {
  const element = document.getElementById(id);
  return !!(element && element.checked);
}

function setChecked(id, value) {
  const element = document.getElementById(id);
  if (element) element.checked = !!value;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
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

function capitalize(value) {
  return String(value || "")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
