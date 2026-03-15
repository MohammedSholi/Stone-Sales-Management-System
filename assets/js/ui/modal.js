/*
 * SSMS - Modal Component
 * Vanilla JS Modal System
 */

export class Modal {
  constructor(options = {}) {
    this.title = options.title || "";
    this.content = options.content || "";
    this.size = options.size || "md"; // 'sm', 'md', 'lg', 'xl'
    this.showClose = options.showClose !== false;
    this.onClose = options.onClose || null;
    this.backdrop = null;
    this.modal = null;
  }

  create() {
    // Create backdrop
    this.backdrop = document.createElement("div");
    this.backdrop.className = "modal-backdrop";

    // Create modal
    this.modal = document.createElement("div");
    this.modal.className = `modal modal-${this.size}`;

    // Build modal HTML
    this.modal.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">${this.title}</h3>
        ${this.showClose ? '<button class="modal-close" aria-label="Close">&times;</button>' : ""}
      </div>
      <div class="modal-body">
        ${this.content}
      </div>
    `;

    this.backdrop.appendChild(this.modal);

    // Event listeners
    if (this.showClose) {
      const closeBtn = this.modal.querySelector(".modal-close");
      closeBtn.addEventListener("click", () => this.close());
    }

    // Close on backdrop click
    this.backdrop.addEventListener("click", (e) => {
      if (e.target === this.backdrop) {
        this.close();
      }
    });

    // Close on Escape key
    this.escapeHandler = (e) => {
      if (e.key === "Escape") {
        this.close();
      }
    };
    document.addEventListener("keydown", this.escapeHandler);

    return this;
  }

  open() {
    if (!this.backdrop) {
      this.create();
    }
    document.body.appendChild(this.backdrop);
    document.body.style.overflow = "hidden";
    return this;
  }

  close() {
    if (this.backdrop && this.backdrop.parentElement) {
      this.backdrop.parentElement.removeChild(this.backdrop);
      document.body.style.overflow = "";
      document.removeEventListener("keydown", this.escapeHandler);

      if (this.onClose) {
        this.onClose();
      }
    }
    return this;
  }

  setContent(content) {
    if (this.modal) {
      const body = this.modal.querySelector(".modal-body");
      if (body) {
        body.innerHTML = content;
      }
    }
    return this;
  }

  setTitle(title) {
    if (this.modal) {
      const titleEl = this.modal.querySelector(".modal-title");
      if (titleEl) {
        titleEl.textContent = title;
      }
    }
    return this;
  }

  addFooter(html) {
    if (this.modal) {
      let footer = this.modal.querySelector(".modal-footer");
      if (!footer) {
        footer = document.createElement("div");
        footer.className = "modal-footer";
        this.modal.appendChild(footer);
      }
      footer.innerHTML = html;
    }
    return this;
  }
}

// Helper function to create confirmation modal
export function showConfirm(options = {}) {
  const title = options.title || "Confirm Action";
  const message = options.message || "Are you sure?";
  const confirmText = options.confirmText || "Confirm";
  const cancelText = options.cancelText || "Cancel";
  const onConfirm = options.onConfirm || null;
  const onCancel = options.onCancel || null;

  const modal = new Modal({
    title,
    content: `<p>${message}</p>`,
    size: "sm",
  });

  modal.create();
  modal.addFooter(`
    <button class="btn btn-ghost" data-action="cancel">${cancelText}</button>
    <button class="btn btn-primary" data-action="confirm">${confirmText}</button>
  `);

  const footer = modal.modal.querySelector(".modal-footer");

  footer
    .querySelector('[data-action="cancel"]')
    .addEventListener("click", () => {
      modal.close();
      if (onCancel) onCancel();
    });

  footer
    .querySelector('[data-action="confirm"]')
    .addEventListener("click", () => {
      modal.close();
      if (onConfirm) onConfirm();
    });

  modal.open();
  return modal;
}

// Helper function to create alert modal
export function showAlert(options = {}) {
  const title = options.title || "Alert";
  const message = options.message || "";
  const type = options.type || "info"; // 'success', 'warning', 'error', 'info'
  const buttonText = options.buttonText || "OK";
  const onConfirm = options.onConfirm || null;

  const icons = {
    success: "✓",
    warning: "⚠",
    error: "✕",
    info: "ℹ",
  };

  const modal = new Modal({
    title,
    content: `
      <div class="alert alert-${type}">
        <span style="font-size: 1.5rem; margin-right: 0.5rem;">${icons[type]}</span>
        <span>${message}</span>
      </div>
    `,
    size: "sm",
  });

  modal.create();
  modal.addFooter(`
    <button class="btn btn-primary" data-action="ok">${buttonText}</button>
  `);

  const footer = modal.modal.querySelector(".modal-footer");
  footer.querySelector('[data-action="ok"]').addEventListener("click", () => {
    modal.close();
    if (onConfirm) onConfirm();
  });

  modal.open();
  return modal;
}

// Export default
export default Modal;
