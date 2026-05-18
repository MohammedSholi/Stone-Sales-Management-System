/*
 * SSMS - Global App JavaScript
 * Global initialization, navbar functionality, theme, helpers
 */

import { initMotionEnhancements } from "./ui/motion.js";

// ========== GLOBAL STATE ==========
window.SSMS = {
  currentUser: null,
  currentRole: "Guest", // 'Guest' | 'Customer' | 'Employee' | 'Admin'
  currentLanguage: "en",
  cart: [],
  hasNavbarInteractionBinding: false,
  LANGUAGE_KEY: "ssms_language",

  init() {
    this.loadUserSession();
    this.loadLanguage();
    this.initNavbar();
    this.ensureBrandingLogo();
    this.updateCartBadge();
    initMotionEnhancements();
  },

  ensureBrandingLogo() {
    try {
      const brandingSrc = "/assets/img/branding/hajari-logo-transparent.png";
      document.querySelectorAll(".navbar-logo").forEach((img) => {
        if (!img) return;
        // only replace when branding file exists (best-effort)
        img.src = brandingSrc;
        img.classList.add("navbar-logo-hajari");
      });
    } catch (e) {
      // fail silently
    }
  },

  loadUserSession() {
    const user = localStorage.getItem("ssms_user");
    const role = localStorage.getItem("ssms_role");

    if (user) {
      this.currentUser = JSON.parse(user);
      this.currentRole = role || "Customer";
    }
  },

  setUserSession(user, role) {
    this.currentUser = user;
    this.currentRole = role;
    localStorage.setItem("ssms_user", JSON.stringify(user));
    localStorage.setItem("ssms_role", role);
    this.updateNavbar();
  },

  logout() {
    this.currentUser = null;
    this.currentRole = "Guest";
    localStorage.removeItem("ssms_user");
    localStorage.removeItem("ssms_role");
    this.closeAllNavbarDropdowns();
    window.location.href = "/index.php";
  },

  loadLanguage() {
    const storedLanguage = localStorage.getItem(this.LANGUAGE_KEY);
    const language = storedLanguage === "ar" ? "ar" : "en";
    this.applyLanguage(language, false);
  },

  applyLanguage(language, shouldRefreshNavbar = true) {
    const nextLanguage = language === "ar" ? "ar" : "en";
    const direction = nextLanguage === "ar" ? "rtl" : "ltr";
    const previousLanguage = this.currentLanguage;

    this.currentLanguage = nextLanguage;
    document.documentElement.setAttribute("lang", nextLanguage);
    document.documentElement.setAttribute("dir", direction);
    // Toggle RTL helper class on <body> so CSS can adjust layout when Arabic is active
    try {
      document.body.classList.toggle("is-rtl", nextLanguage === "ar");
    } catch (e) {
      // ignore if body not available yet
    }
    localStorage.setItem(this.LANGUAGE_KEY, nextLanguage);

    if (shouldRefreshNavbar) {
      this.updateNavbar();
    }

    window.dispatchEvent(
      new CustomEvent("ssms:languagechange", {
        detail: {
          language: nextLanguage,
          previousLanguage,
          direction,
        },
      }),
    );
  },

  initNavbar() {
    const toggle = document.querySelector(".navbar-toggle");
    const mobileMenu = document.querySelector(".navbar-mobile-menu");

    if (toggle && mobileMenu) {
      toggle.addEventListener("click", () => {
        toggle.classList.toggle("active");
        mobileMenu.classList.toggle("active");
      });
    }

    this.bindNavbarInteractions();

    // Set active link
    this.setActiveNavLink();

    // Update navbar based on role
    this.updateNavbar();
  },

  setActiveNavLink() {
    const currentPath = this.normalizePath(window.location.pathname);
    const navLinks = document.querySelectorAll(".navbar-link");

    navLinks.forEach((link) => link.classList.remove("active"));

    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (!href) return;

      const hrefPath = this.normalizePath(
        new URL(href, window.location.origin).pathname,
      );

      const rootMatch =
        (hrefPath === "/index.php" || hrefPath === "/") &&
        (currentPath === "/index.php" || currentPath === "/");

      if (rootMatch || currentPath === hrefPath) {
        link.classList.add("active");
      }
    });
  },

  normalizePath(pathname) {
    if (!pathname) return "/";
    return pathname.replace(/\/+$/, "") || "/";
  },

  t(key) {
    const dictionary = {
      en: {
        home: "Home",
        catalog: "Catalog",
        about: "About",
        dashboard: "Dashboard",
        login: "Login",
        signUp: "Sign Up",
        myProfile: "My Profile",
        settings: "Settings",
        myOrders: "My Orders",
        adminPanel: "Admin Panel",
        logout: "Logout",
        search: "Search",
        cart: "Cart",
        english: "English",
        arabic: "العربية",
      },
      ar: {
        home: "الرئيسية",
        catalog: "الكتالوج",
        about: "من نحن",
        dashboard: "لوحة التحكم",
        login: "تسجيل الدخول",
        signUp: "إنشاء حساب",
        myProfile: "ملفي الشخصي",
        settings: "الإعدادات",
        myOrders: "طلباتي",
        adminPanel: "لوحة الإدارة",
        logout: "تسجيل الخروج",
        search: "بحث",
        cart: "السلة",
        english: "English",
        arabic: "العربية",
      },
    };

    const language = this.currentLanguage === "ar" ? "ar" : "en";
    return dictionary[language][key] || dictionary.en[key] || key;
  },

  updateNavbar() {
    const role = this.resolveRoleKey(this.currentRole);

    // Define navigation items for different roles
    const navItems = {
      Guest: [
        { text: this.t("home"), href: "/index.php" },
        { text: this.t("catalog"), href: "/catalog/stones.html" },
        { text: this.t("about"), href: "/about.html" },
      ],
      Customer: [
        { text: this.t("home"), href: "/index.php" },
        { text: this.t("catalog"), href: "/catalog/stones.html" },
        { text: this.t("about"), href: "/about.html" },
        { text: this.t("dashboard"), href: "/customer/dashboard.html" },
      ],
      Employee: [
        { text: this.t("home"), href: "/index.php" },
        { text: this.t("catalog"), href: "/catalog/stones.html" },
        { text: this.t("about"), href: "/about.html" },
        { text: this.t("dashboard"), href: "/employee/dashboard.html" },
      ],
      Admin: [
        { text: this.t("home"), href: "/index.php" },
        { text: this.t("catalog"), href: "/catalog/stones.html" },
        { text: this.t("about"), href: "/about.html" },
        { text: this.t("dashboard"), href: "/admin/dashboard.html" },
      ],
    };

    const items = navItems[role] || navItems.Guest;

    // Generate nav HTML
    let navHTML = "";
    items.forEach((item) => {
      navHTML += `<a href="${item.href}" class="navbar-link">${item.text}</a>`;
    });

    // Populate desktop center nav and mobile menu nav
    document.querySelectorAll(".navbar-nav").forEach((el) => {
      el.innerHTML = navHTML;
    });

    // Re-set active links
    this.setActiveNavLink();

    // Update actions area
    this.updateNavbarActions();
  },

  resolveRoleKey(role) {
    const value = String(role || "Guest").toLowerCase();
    if (value === "admin") return "Admin";
    if (value === "employee") return "Employee";
    if (value === "customer") return "Customer";
    return "Guest";
  },

  getLanguageLabel() {
    return this.currentLanguage === "ar" ? this.t("arabic") : this.t("english");
  },

  getUserInitials() {
    if (!this.currentUser) return "U";

    const source = (
      this.currentUser.full_name ||
      this.currentUser.username ||
      "User"
    )
      .trim()
      .replace(/\s+/g, " ");
    const parts = source.split(" ");

    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }

    return source.slice(0, 2).toUpperCase();
  },

  getUserAvatarUrl() {
    if (!this.currentUser) return null;
    return this.currentUser.avatar_url || null;
  },

  escapeHTML(value = "") {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  },

  getDesktopUtilitiesHTML() {
    const languageLabel = this.escapeHTML(this.getLanguageLabel());

    return `
      <div class="navbar-utility-group">
        <a href="/catalog/stones.html" class="navbar-icon-btn" title="${this.t("search")}" aria-label="${this.t("search")}" data-action="search">
          <img src="https://cdn-icons-png.flaticon.com/512/16799/16799322.png" alt="" class="navbar-search-icon" aria-hidden="true" />
        </a>

        <a href="/cart/cart.html" class="navbar-icon-btn navbar-cart-link" title="${this.t("cart")}" aria-label="${this.t("cart")}">
          <img src="https://cdn-icons-png.flaticon.com/512/3737/3737151.png" alt="" class="navbar-cart-icon" aria-hidden="true" />
          <span class="navbar-cart-badge" style="display:none">0</span>
        </a>

        <div class="navbar-language" data-dropdown="language">
          <button class="navbar-language-toggle" type="button" aria-expanded="false" aria-haspopup="menu" data-toggle="language">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m7.93 9h-3.95a15.3 15.3 0 0 0-1.22-5.07A8.03 8.03 0 0 1 19.93 11M12 4c.98 1.34 1.74 3.26 1.96 5.5h-3.92C10.26 7.26 11.02 5.34 12 4M4.07 13h3.95c.11 1.76.53 3.5 1.22 5.07A8.03 8.03 0 0 1 4.07 13m3.95-2H4.07a8.03 8.03 0 0 1 5.17-5.07A15.3 15.3 0 0 0 8.02 11m1.99 2h3.98c-.22 2.24-.98 4.16-1.99 5.5-.98-1.34-1.74-3.26-1.99-5.5M14.76 18.07c.69-1.57 1.11-3.31 1.22-5.07h3.95a8.03 8.03 0 0 1-5.17 5.07"/></svg>
            <span class="navbar-language-label">${languageLabel}</span>
            <span class="navbar-chevron" aria-hidden="true"></span>
          </button>
          <div class="navbar-dropdown navbar-language-menu" data-menu="language" role="menu" aria-label="Language menu">
            <button class="navbar-dropdown-item ${this.currentLanguage === "en" ? "is-selected" : ""}" data-lang-option="en" role="menuitem">${this.t("english")}</button>
            <button class="navbar-dropdown-item ${this.currentLanguage === "ar" ? "is-selected" : ""}" data-lang-option="ar" role="menuitem">${this.t("arabic")}</button>
          </div>
        </div>
      </div>
    `;
  },

  getDesktopAuthHTML() {
    if (!this.currentUser) {
      return `
        <div class="navbar-auth-group">
          <a href="/auth/login.html" class="navbar-login-link">${this.t("login")}</a>
          <a href="/auth/register.html" class="navbar-signup-btn">${this.t("signUp")}</a>
        </div>
      `;
    }

    const roleKey = this.resolveRoleKey(this.currentRole);
    const isAdmin = roleKey === "Admin";
    const dashboardHref =
      roleKey === "Admin"
        ? "/admin/dashboard.html"
        : roleKey === "Employee"
          ? "/employee/dashboard.html"
          : "/customer/dashboard.html";
    const ordersHref = isAdmin
      ? "/admin/dashboard.html"
      : "/customer/my-orders.html";
    const ordersLabel = isAdmin ? this.t("adminPanel") : this.t("myOrders");
    const profileHref =
      roleKey === "Customer"
        ? "/customer/profile.html"
        : roleKey === "Admin"
          ? "/admin/profile.html"
          : dashboardHref;
    const settingsHref =
      roleKey === "Customer"
        ? "/customer/settings.html"
        : roleKey === "Admin"
          ? "/admin/settings.html"
          : `${dashboardHref}#settings`;
    const initials = this.escapeHTML(this.getUserInitials());
    const avatarUrl = this.getUserAvatarUrl();
    const fullName = this.escapeHTML(
      this.currentUser.full_name || this.currentUser.username || "User",
    );
    const avatarHTML = avatarUrl
      ? `<img src="${this.escapeHTML(avatarUrl)}" alt="Profile avatar" class="navbar-avatar-image" />`
      : initials;

    return `
      <div class="navbar-auth-group">
        <div class="navbar-profile" data-dropdown="profile">
          <button class="navbar-avatar-btn" type="button" aria-expanded="false" aria-haspopup="menu" data-toggle="profile" title="${fullName}">
            <span class="navbar-avatar">${avatarHTML}</span>
          </button>
          <div class="navbar-dropdown navbar-profile-menu" data-menu="profile" role="menu" aria-label="Profile menu">
            <div class="navbar-dropdown-header">${fullName}</div>
            <a href="${profileHref}" class="navbar-dropdown-item" role="menuitem">${this.t("myProfile")}</a>
            <a href="${settingsHref}" class="navbar-dropdown-item" role="menuitem">${this.t("settings")}</a>
            <a href="${ordersHref}" class="navbar-dropdown-item" role="menuitem">${ordersLabel}</a>
            <button class="navbar-dropdown-item is-danger" data-action="logout" role="menuitem">${this.t("logout")}</button>
          </div>
        </div>
      </div>
    `;
  },

  getMobileActionsHTML() {
    const languageMenu = `
      <div class="navbar-mobile-lang">
        <button class="navbar-dropdown-item ${this.currentLanguage === "en" ? "is-selected" : ""}" data-lang-option="en">${this.t("english")}</button>
        <button class="navbar-dropdown-item ${this.currentLanguage === "ar" ? "is-selected" : ""}" data-lang-option="ar">${this.t("arabic")}</button>
      </div>
    `;

    if (!this.currentUser) {
      return `
        <a href="/auth/login.html" class="navbar-login-link">${this.t("login")}</a>
        <a href="/auth/register.html" class="navbar-signup-btn">${this.t("signUp")}</a>
        <a href="/cart/cart.html" class="navbar-login-link navbar-cart-link">${this.t("cart")} <span class="navbar-cart-badge" style="display:none">0</span></a>
        ${languageMenu}
      `;
    }

    const roleKey = this.resolveRoleKey(this.currentRole);
    const isAdmin = roleKey === "Admin";
    const dashboardHref =
      roleKey === "Admin"
        ? "/admin/dashboard.html"
        : roleKey === "Employee"
          ? "/employee/dashboard.html"
          : "/customer/dashboard.html";
    const ordersHref = isAdmin
      ? "/admin/dashboard.html"
      : "/customer/my-orders.html";
    const ordersLabel = isAdmin ? this.t("adminPanel") : this.t("myOrders");
    const profileHref =
      roleKey === "Customer"
        ? "/customer/profile.html"
        : roleKey === "Admin"
          ? "/admin/profile.html"
          : dashboardHref;
    const settingsHref =
      roleKey === "Customer"
        ? "/customer/settings.html"
        : roleKey === "Admin"
          ? "/admin/settings.html"
          : `${dashboardHref}#settings`;

    return `
      <a href="/cart/cart.html" class="navbar-login-link navbar-cart-link">${this.t("cart")} <span class="navbar-cart-badge" style="display:none">0</span></a>
      <a href="${profileHref}" class="navbar-login-link">${this.t("myProfile")}</a>
      <a href="${settingsHref}" class="navbar-login-link">${this.t("settings")}</a>
      <a href="${ordersHref}" class="navbar-login-link">${ordersLabel}</a>
      <button class="navbar-dropdown-item is-danger" data-action="logout">${this.t("logout")}</button>
      ${languageMenu}
    `;
  },

  bindNavbarInteractions() {
    if (this.hasNavbarInteractionBinding) return;
    this.hasNavbarInteractionBinding = true;

    document.addEventListener("click", (e) => {
      const clickedToggle = e.target.closest("[data-toggle]");
      const clickedLanguage = e.target.closest("[data-lang-option]");
      const clickedLogout = e.target.closest('[data-action="logout"]');
      const clickedSearch = e.target.closest('[data-action="search"]');
      const navbar = e.target.closest(".navbar");

      if (clickedSearch) {
        return;
      }

      if (clickedLanguage) {
        e.preventDefault();
        this.applyLanguage(
          clickedLanguage.getAttribute("data-lang-option") || "en",
        );
        this.closeAllNavbarDropdowns();
        return;
      }

      if (clickedLogout) {
        e.preventDefault();
        this.logout();
        return;
      }

      if (clickedToggle) {
        e.preventDefault();
        const dropdownType = clickedToggle.getAttribute("data-toggle");
        const dropdownRoot = clickedToggle.closest("[data-dropdown]");
        if (!dropdownType || !dropdownRoot) return;

        this.toggleNavbarDropdown(dropdownRoot, dropdownType);
        return;
      }

      if (!navbar || !e.target.closest("[data-dropdown]")) {
        this.closeAllNavbarDropdowns();
      }

      const toggle = document.querySelector(".navbar-toggle");
      const mobileMenu = document.querySelector(".navbar-mobile-menu");
      if (toggle && mobileMenu && !navbar) {
        toggle.classList.remove("active");
        mobileMenu.classList.remove("active");
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeAllNavbarDropdowns();
      }
    });
  },

  toggleNavbarDropdown(dropdownRoot, dropdownType) {
    const menu = dropdownRoot.querySelector(`[data-menu="${dropdownType}"]`);
    const toggle = dropdownRoot.querySelector(
      `[data-toggle="${dropdownType}"]`,
    );
    if (!menu || !toggle) return;

    const shouldOpen = !menu.classList.contains("is-open");
    this.closeAllNavbarDropdowns();

    if (shouldOpen) {
      menu.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
    }
  },

  closeAllNavbarDropdowns() {
    document.querySelectorAll(".navbar-dropdown").forEach((menu) => {
      menu.classList.remove("is-open");
    });

    document.querySelectorAll("[data-toggle]").forEach((toggle) => {
      toggle.setAttribute("aria-expanded", "false");
    });
  },

  updateNavbarActions() {
    const desktopUtilitiesHTML = this.getDesktopUtilitiesHTML();
    const desktopAuthHTML = this.getDesktopAuthHTML();
    const desktopCombinedHTML = `${desktopUtilitiesHTML}${desktopAuthHTML}`;
    const mobileActionsHTML = this.getMobileActionsHTML();

    // New desktop structure: Search/Language -> Theme toggle -> Auth
    document.querySelectorAll(".navbar-actions-utilities").forEach((el) => {
      el.innerHTML = desktopUtilitiesHTML;
    });

    document.querySelectorAll(".navbar-actions-auth").forEach((el) => {
      el.innerHTML = desktopAuthHTML;
    });

    // New mobile structure
    document.querySelectorAll(".navbar-actions-mobile").forEach((el) => {
      el.innerHTML = mobileActionsHTML;
    });

    // Legacy structure kept for pages not migrated yet
    document.querySelectorAll(".navbar-actions").forEach((el) => {
      const isMobile = !!el.closest(".navbar-mobile-menu");
      el.innerHTML = isMobile ? mobileActionsHTML : desktopCombinedHTML;
    });

    this.updateCartBadge();
  },

  updateCartBadge() {
    const badges = document.querySelectorAll(".navbar-cart-badge");
    if (badges.length === 0) return;
    const cart = JSON.parse(localStorage.getItem("ssms_cart") || "[]");
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    badges.forEach((badge) => {
      badge.textContent = totalItems;
      badge.style.display = totalItems > 0 ? "flex" : "none";
    });
  },
};

// ========== HELPER FUNCTIONS ==========

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

// Format date with time
function formatDateTime(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Validate email
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Validate phone
function isValidPhone(phone) {
  const re = /^[\d\s\-\+\(\)]+$/;
  return re.test(phone) && phone.replace(/\D/g, "").length >= 10;
}

// Scroll to top
function scrollToTop(smooth = true) {
  window.scrollTo({
    top: 0,
    behavior: smooth ? "smooth" : "auto",
  });
}

// Get query parameter
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Set query parameter
function setQueryParam(param, value) {
  const url = new URL(window.location);
  url.searchParams.set(param, value);
  window.history.pushState({}, "", url);
}

// ========== INITIALIZE APP ==========
document.addEventListener("DOMContentLoaded", () => {
  window.SSMS.init();
});

// Export for ES6 modules
export {
  formatCurrency,
  formatDate,
  formatDateTime,
  debounce,
  generateId,
  isValidEmail,
  isValidPhone,
  scrollToTop,
  getQueryParam,
  setQueryParam,
};
