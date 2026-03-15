/*
 * SSMS - Toast Notification Component
 * Vanilla JS Toast System
 */

class ToastManager {
  constructor() {
    this.container = null;
    this.toasts = [];
    this.init();
  }

  init() {
    // Create toast container if it doesn't exist
    if (!document.querySelector(".toast-container")) {
      this.container = document.createElement("div");
      this.container.className = "toast-container";
      document.body.appendChild(this.container);
    } else {
      this.container = document.querySelector(".toast-container");
    }
  }

  show(options = {}) {
    const {
      title = "",
      message = "",
      type = "info", // 'success', 'warning', 'error', 'info'
      duration = 5000,
      showClose = true,
    } = options;

    const icons = {
      success: "✓",
      warning: "⚠",
      error: "✕",
      info: "ℹ",
    };

    // Create toast element
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    toast.innerHTML = `
      <div class="toast-icon">${icons[type]}</div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ""}
        ${message ? `<div class="toast-message">${message}</div>` : ""}
      </div>
      ${showClose ? '<button class="toast-close" aria-label="Close">&times;</button>' : ""}
    `;

    // Add to container
    this.container.appendChild(toast);
    this.toasts.push(toast);

    // Close button handler
    if (showClose) {
      const closeBtn = toast.querySelector(".toast-close");
      closeBtn.addEventListener("click", () => this.remove(toast));
    }

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => this.remove(toast), duration);
    }

    return toast;
  }

  remove(toast) {
    if (toast && toast.parentElement) {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";

      setTimeout(() => {
        if (toast.parentElement) {
          toast.parentElement.removeChild(toast);
        }
        this.toasts = this.toasts.filter((t) => t !== toast);
      }, 300);
    }
  }

  success(message, title = "Success") {
    return this.show({ title, message, type: "success" });
  }

  error(message, title = "Error") {
    return this.show({ title, message, type: "error" });
  }

  warning(message, title = "Warning") {
    return this.show({ title, message, type: "warning" });
  }

  info(message, title = "Info") {
    return this.show({ title, message, type: "info" });
  }

  clearAll() {
    this.toasts.forEach((toast) => this.remove(toast));
  }
}

// Create singleton instance
const toast = new ToastManager();

export default toast;

// Named exports for convenience
export const showToast = (options) => toast.show(options);
export const showSuccess = (message, title) => toast.success(message, title);
export const showError = (message, title) => toast.error(message, title);
export const showWarning = (message, title) => toast.warning(message, title);
export const showInfo = (message, title) => toast.info(message, title);
