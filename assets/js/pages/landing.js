/*
 * Landing Page JavaScript
 */

import { StonesAPI } from "../data/api-mock.js";
import { initTiltCards } from "../ui/tilt.js";
import LoadingSkeletons from "../ui/loader.js";
import { formatCurrency } from "../app.js";

// Load and display best sellers
async function loadBestSellers() {
  const grid = document.getElementById("bestSellersGrid");

  // Show loading skeletons
  LoadingSkeletons.show(grid, "productGrid", 6);

  try {
    // Fetch all stones
    const stones = await StonesAPI.getAll();

    // Filter bestsellers
    const bestsellers = stones.filter((stone) => stone.bestseller).slice(0, 6);

    // Render products
    grid.innerHTML = bestsellers
      .map((stone) => createProductCard(stone))
      .join("");

    // Initialize tilt effect on product cards
    initTiltCards();
  } catch (error) {
    console.error("Error loading bestsellers:", error);
    grid.innerHTML =
      '<p class="text-center text-muted">Failed to load products. Please try again later.</p>';
  }
}

// Create product card HTML
function createProductCard(stone) {
  return `
    <div class="product-card" data-tilt>
      <div class="product-card-image">
        <img src="${stone.image}" alt="${stone.name}" loading="lazy">
        ${stone.bestseller ? '<span class="product-card-badge"><span class="badge badge-warning">Bestseller</span></span>' : ""}
      </div>
      <div class="product-card-content">
        <h3 class="product-card-title">${stone.name}</h3>
        <p class="product-card-description">${truncateText(stone.description, 80)}</p>
        <div class="product-card-meta">
          <span>📦 ${stone.type}</span>
          <span>⭐ ${stone.rating} (${stone.reviewCount})</span>
        </div>
        <div class="product-card-footer">
          <div class="product-card-price">${formatCurrency(stone.price)}/${stone.unit}</div>
          <a href="/catalog/stone-details.html?id=${stone.id}" class="btn btn-primary btn-sm">View Details</a>
        </div>
      </div>
    </div>
  `;
}

// Truncate text helper
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + "...";
}

// Smooth scroll for anchor links
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (href !== "#") {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }
    });
  });
}

// Add scroll-based animations
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate-slideUp");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all sections
  document.querySelectorAll(".section").forEach((section) => {
    observer.observe(section);
  });
}

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  loadBestSellers();
  initTiltCards();
  initSmoothScroll();
  initScrollAnimations();
});
