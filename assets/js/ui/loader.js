/*
 * SSMS - Loading Skeleton Component
 * Create loading placeholder animations
 */

export class LoadingSkeletons {
  // Create product card skeleton
  static productCard() {
    return `
      <div class="card skeleton-card">
        <div class="skeleton skeleton-image"></div>
        <div class="card-body">
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text" style="width: 80%;"></div>
          <div class="skeleton skeleton-text" style="width: 60%;"></div>
        </div>
      </div>
    `;
  }

  // Create product grid skeleton
  static productGrid(count = 6) {
    let html = '<div class="product-grid">';
    for (let i = 0; i < count; i++) {
      html += this.productCard();
    }
    html += "</div>";
    return html;
  }

  // Create table row skeleton
  static tableRow(columns = 5) {
    let html = "<tr>";
    for (let i = 0; i < columns; i++) {
      html += '<td><div class="skeleton skeleton-text"></div></td>';
    }
    html += "</tr>";
    return html;
  }

  // Create table skeleton
  static table(rows = 5, columns = 5) {
    let html = '<div class="table-container"><table class="table"><tbody>';
    for (let i = 0; i < rows; i++) {
      html += this.tableRow(columns);
    }
    html += "</tbody></table></div>";
    return html;
  }

  // Create stat card skeleton
  static statCard() {
    return `
      <div class="stat-card">
        <div class="skeleton" style="width: 3.5rem; height: 3.5rem; border-radius: var(--radius-lg);"></div>
        <div style="flex: 1;">
          <div class="skeleton skeleton-text" style="width: 80px; margin-bottom: 0.5rem;"></div>
          <div class="skeleton skeleton-title" style="width: 100px;"></div>
        </div>
      </div>
    `;
  }

  // Create stats grid skeleton
  static statsGrid(count = 4) {
    let html = '<div class="stats-grid">';
    for (let i = 0; i < count; i++) {
      html += this.statCard();
    }
    html += "</div>";
    return html;
  }

  // Create list item skeleton
  static listItem() {
    return `
      <div class="skeleton-card" style="margin-bottom: 1rem;">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text" style="width: 70%;"></div>
      </div>
    `;
  }

  // Create list skeleton
  static list(count = 5) {
    let html = "";
    for (let i = 0; i < count; i++) {
      html += this.listItem();
    }
    return html;
  }

  // Show loading in element
  static show(element, type = "productGrid", count = 6) {
    if (!element) return;

    const skeletonTypes = {
      productGrid: () => this.productGrid(count),
      statsGrid: () => this.statsGrid(count),
      table: () => this.table(count),
      list: () => this.list(count),
    };

    const skeletonHTML = skeletonTypes[type]
      ? skeletonTypes[type]()
      : this.productGrid(count);
    element.innerHTML = skeletonHTML;
  }

  // Hide loading (clear element)
  static hide(element) {
    if (element) {
      element.innerHTML = "";
    }
  }
}

// Create loading overlay
export class LoadingOverlay {
  constructor() {
    this.overlay = null;
  }

  show(message = "Loading...") {
    if (!this.overlay) {
      this.overlay = document.createElement("div");
      this.overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      `;

      this.overlay.innerHTML = `
        <div class="spinner spinner-lg"></div>
        <p style="color: white; margin-top: 1rem; font-size: 1.125rem;">${message}</p>
      `;
    }

    document.body.appendChild(this.overlay);
    document.body.style.overflow = "hidden";
  }

  hide() {
    if (this.overlay && this.overlay.parentElement) {
      this.overlay.parentElement.removeChild(this.overlay);
      document.body.style.overflow = "";
    }
  }

  setMessage(message) {
    if (this.overlay) {
      const p = this.overlay.querySelector("p");
      if (p) {
        p.textContent = message;
      }
    }
  }
}

// Simulate loading delay (for development)
export function simulateLoading(callback, duration = 800) {
  const loader = new LoadingOverlay();
  loader.show();

  setTimeout(() => {
    loader.hide();
    if (callback) callback();
  }, duration);
}

export default LoadingSkeletons;
