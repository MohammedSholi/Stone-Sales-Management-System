/*
 * Catalog Page JavaScript
 * Search, Filter, Sort, and Pagination functionality
 */

import { apiCall } from "../api.js";
import LoadingSkeletons from "../ui/loader.js";
import {
  formatCurrency,
  debounce,
  getQueryParam,
  setQueryParam,
} from "../app.js";

/**
 * Normalise a stone row coming from the PHP backend so every template
 * expression that was written for the old mock data still works.
 */
function normalizeStone(s) {
  return {
    // identity
    id: s.stone_id, // numeric PK – used in links + cart
    stone_id: s.stone_id,

    // display
    name: s.name || "Unnamed Stone",
    type: s.type || "Other",
    description: s.description || s.name || "",
    price: parseFloat(s.price_per_unit) || 0,
    unit: s.unit || "unit",
    stock: parseInt(s.quantity_in_stock, 10) || 0,
    image: s.image_url || "https://placehold.co/400x300?text=No+Image",
    size: s.size || "",

    // fields the template references that the backend may not have
    sizes: s.sizes || [],
    finish: s.finish || [],
    bestseller: !!s.bestseller,
    featured: !!s.featured,
    rating: parseFloat(s.rating) || 0,
    reviewCount: parseInt(s.review_count || s.reviewCount, 10) || 0,
  };
}

// State
let allStones = [];
let filteredStones = [];
let currentPage = 1;
const itemsPerPage = 9;

// Filter state
const filters = {
  search: "",
  types: ["all"],
  priceMin: 0,
  priceMax: 200,
  inStockOnly: false,
  bestsellersOnly: false,
  sortBy: "featured",
};

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  initFilters();
  loadStones();
});

// Load stones from backend API
async function loadStones() {
  const grid = document.getElementById("productsGrid");
  LoadingSkeletons.show(grid, "productGrid", 9);

  try {
    const res = await apiCall("/stones");
    if (res.success && res.data && res.data.stones) {
      allStones = res.data.stones.map(normalizeStone);
    } else {
      allStones = [];
      console.warn("Stones API returned unexpected shape", res);
    }

    // Apply filters from URL query params
    applyUrlFilters();

    // Apply filters and render
    applyFilters();
  } catch (error) {
    console.error("Error loading stones:", error);
    grid.innerHTML =
      '<p class="text-center text-muted">Failed to load products. Please try again later.</p>';
  }
}

// Apply filters from URL
function applyUrlFilters() {
  const type = getQueryParam("type");
  if (type) {
    filters.types = [type];
    // Update type checkboxes
    document
      .querySelectorAll('#typeFilters input[type="checkbox"]')
      .forEach((cb) => {
        if (cb.value === type) {
          cb.checked = true;
        } else if (cb.value === "all") {
          cb.checked = false;
        }
      });
  }
}

// Initialize filter controls
function initFilters() {
  // Search input
  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener(
    "input",
    debounce((e) => {
      filters.search = e.target.value.toLowerCase();
      currentPage = 1;
      applyFilters();
    }, 300),
  );

  // Type filters
  document
    .querySelectorAll('#typeFilters input[type="checkbox"]')
    .forEach((checkbox) => {
      checkbox.addEventListener("change", (e) => {
        if (e.target.value === "all") {
          if (e.target.checked) {
            filters.types = ["all"];
            document
              .querySelectorAll('#typeFilters input[type="checkbox"]')
              .forEach((cb) => {
                if (cb.value !== "all") cb.checked = false;
              });
          }
        } else {
          document.querySelector('#typeFilters input[value="all"]').checked =
            false;
          filters.types = Array.from(
            document.querySelectorAll(
              '#typeFilters input[type="checkbox"]:checked:not([value="all"])',
            ),
          ).map((cb) => cb.value);

          if (filters.types.length === 0) {
            filters.types = ["all"];
            document.querySelector('#typeFilters input[value="all"]').checked =
              true;
          }
        }
        currentPage = 1;
        applyFilters();
      });
    });

  // Price range
  const priceMin = document.getElementById("priceMin");
  const priceMax = document.getElementById("priceMax");
  const priceMinValue = document.getElementById("priceMinValue");
  const priceMaxValue = document.getElementById("priceMaxValue");

  priceMin.addEventListener("input", (e) => {
    filters.priceMin = parseInt(e.target.value);
    priceMinValue.textContent = filters.priceMin;
    if (filters.priceMin > filters.priceMax) {
      filters.priceMax = filters.priceMin;
      priceMax.value = filters.priceMin;
      priceMaxValue.textContent = filters.priceMin;
    }
    currentPage = 1;
    applyFilters();
  });

  priceMax.addEventListener("input", (e) => {
    filters.priceMax = parseInt(e.target.value);
    priceMaxValue.textContent = filters.priceMax;
    if (filters.priceMax < filters.priceMin) {
      filters.priceMin = filters.priceMax;
      priceMin.value = filters.priceMax;
      priceMinValue.textContent = filters.priceMax;
    }
    currentPage = 1;
    applyFilters();
  });

  // Stock and bestsellers
  document.getElementById("inStockOnly").addEventListener("change", (e) => {
    filters.inStockOnly = e.target.checked;
    currentPage = 1;
    applyFilters();
  });

  document.getElementById("bestsellersOnly").addEventListener("change", (e) => {
    filters.bestsellersOnly = e.target.checked;
    currentPage = 1;
    applyFilters();
  });

  // Sort
  document.getElementById("sortBy").addEventListener("change", (e) => {
    filters.sortBy = e.target.value;
    applyFilters();
  });

  // Clear filters
  document.getElementById("clearFilters").addEventListener("click", () => {
    document.getElementById("searchInput").value = "";
    document
      .querySelectorAll('#typeFilters input[type="checkbox"]')
      .forEach((cb) => {
        cb.checked = cb.value === "all";
      });
    priceMin.value = 0;
    priceMax.value = 200;
    priceMinValue.textContent = 0;
    priceMaxValue.textContent = 200;
    document.getElementById("inStockOnly").checked = false;
    document.getElementById("bestsellersOnly").checked = false;
    document.getElementById("sortBy").value = "featured";

    filters.search = "";
    filters.types = ["all"];
    filters.priceMin = 0;
    filters.priceMax = 200;
    filters.inStockOnly = false;
    filters.bestsellersOnly = false;
    filters.sortBy = "featured";
    currentPage = 1;

    applyFilters();
  });

  // View toggle
  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document
        .querySelectorAll(".view-btn")
        .forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");

      const grid = document.getElementById("productsGrid");
      if (e.target.dataset.view === "list") {
        grid.classList.remove("product-grid");
        grid.classList.add("product-list");
      } else {
        grid.classList.remove("product-list");
        grid.classList.add("product-grid");
      }
    });
  });
}

// Apply all filters
function applyFilters() {
  filteredStones = allStones.filter((stone) => {
    // Search
    if (
      filters.search &&
      !stone.name.toLowerCase().includes(filters.search) &&
      !(stone.description || "").toLowerCase().includes(filters.search)
    ) {
      return false;
    }

    // Type
    if (!filters.types.includes("all") && !filters.types.includes(stone.type)) {
      return false;
    }

    // Price
    if (stone.price < filters.priceMin || stone.price > filters.priceMax) {
      return false;
    }

    // In stock
    if (filters.inStockOnly && stone.stock <= 0) {
      return false;
    }

    // Bestsellers
    if (filters.bestsellersOnly && !stone.bestseller) {
      return false;
    }

    return true;
  });

  // Sort
  sortStones();

  // Render
  renderProducts();
  renderPagination();
  updateResultsCount();
}

// Sort stones
function sortStones() {
  switch (filters.sortBy) {
    case "price-low":
      filteredStones.sort((a, b) => a.price - b.price);
      break;
    case "price-high":
      filteredStones.sort((a, b) => b.price - a.price);
      break;
    case "name":
      filteredStones.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "rating":
      filteredStones.sort((a, b) => b.rating - a.rating);
      break;
    default:
      // Featured - bestsellers first, then by rating
      filteredStones.sort((a, b) => {
        if (a.bestseller && !b.bestseller) return -1;
        if (!a.bestseller && b.bestseller) return 1;
        return b.rating - a.rating;
      });
  }
}

// Render products
function renderProducts() {
  const grid = document.getElementById("productsGrid");
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageStonesfiltered = filteredStones.slice(start, end);

  if (filteredStones.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: var(--spacing-4xl);">
        <h3>No stones found</h3>
        <p class="text-muted">Try adjusting your filters</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = pageStonesfiltered
    .map((stone) => createProductCard(stone))
    .join("");
}

// Create product card
function createProductCard(stone) {
  const desc = stone.description
    ? truncateText(stone.description, 100)
    : stone.type;
  const ratingHtml = stone.rating
    ? `<span>⭐ ${stone.rating} (${stone.reviewCount})</span>`
    : "";
  const badgeHtml = stone.bestseller
    ? '<span class="product-card-badge"><span class="badge badge-warning">Bestseller</span></span>'
    : stone.stock <= 0
      ? '<span class="product-card-badge"><span class="badge badge-danger">Out of Stock</span></span>'
      : "";
  const unitLabel = stone.unit ? `/${stone.unit}` : "";

  return `
    <div class="product-card" data-tilt>
      <div class="product-card-image">
        <img src="${stone.image}" alt="${stone.name}" loading="lazy">
        ${badgeHtml}
      </div>
      <div class="product-card-content">
        <h3 class="product-card-title">${stone.name}</h3>
        <p class="product-card-description">${desc}</p>
        <div class="product-card-meta">
          <span>📦 ${stone.type}</span>
          ${ratingHtml}
        </div>
        <div class="product-card-footer">
          <div class="product-card-price">${formatCurrency(stone.price)}${unitLabel}</div>
          <a href="/catalog/stone-details.html?id=${stone.id}" class="btn btn-primary btn-sm">View Details</a>
        </div>
      </div>
    </div>
  `;
}

// Render pagination
function renderPagination() {
  const pagination = document.getElementById("pagination");
  const totalPages = Math.ceil(filteredStones.length / itemsPerPage);

  if (totalPages <= 1) {
    pagination.innerHTML = "";
    return;
  }

  let html = "";

  // Previous button
  html += `
    <button class="pagination-btn" ${currentPage === 1 ? "disabled" : ""} data-page="${currentPage - 1}">
      ← Prev
    </button>
  `;

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      html += `
        <button class="pagination-btn ${i === currentPage ? "active" : ""}" data-page="${i}">
          ${i}
        </button>
      `;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      html += '<span class="pagination-ellipsis">...</span>';
    }
  }

  // Next button
  html += `
    <button class="pagination-btn" ${currentPage === totalPages ? "disabled" : ""} data-page="${currentPage + 1}">
      Next →
    </button>
  `;

  pagination.innerHTML = html;

  // Add event listeners
  pagination
    .querySelectorAll(".pagination-btn:not([disabled])")
    .forEach((btn) => {
      btn.addEventListener("click", (e) => {
        currentPage = parseInt(e.target.dataset.page);
        renderProducts();
        renderPagination();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
}

// Update results count
function updateResultsCount() {
  const resultsCount = document.getElementById("resultsCount");
  resultsCount.textContent = `${filteredStones.length} stone${filteredStones.length !== 1 ? "s" : ""} found`;
}

// Helper function
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + "...";
}
