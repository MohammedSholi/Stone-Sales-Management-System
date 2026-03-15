/*
 * Stone Details Page JavaScript
 */

import { apiCall } from "../api.js";
import toast from "../ui/toast.js";
import { formatCurrency, formatDate, getQueryParam } from "../app.js";

/**
 * Normalise a stone row from the PHP backend into the shape the template needs.
 */
function normalizeStone(s) {
  return {
    id: s.stone_id,
    stone_id: s.stone_id,
    name: s.name || "Unnamed Stone",
    type: s.type || "Other",
    description: s.description || s.name || "",
    price: parseFloat(s.price_per_unit) || 0,
    unit: s.unit || "unit",
    stock: parseInt(s.quantity_in_stock, 10) || 0,
    image: s.image_url || "https://placehold.co/400x300?text=No+Image",
    size: s.size || "",
    sizes: s.sizes || (s.size ? [s.size] : []),
    finish: s.finish || [],
    bestseller: !!s.bestseller,
    rating: parseFloat(s.rating) || 0,
    reviewCount: parseInt(s.review_count || s.reviewCount, 10) || 0,
  };
}

let currentStone = null;
let quantity = 1;

document.addEventListener("DOMContentLoaded", () => {
  const stoneId = getQueryParam("id");
  if (stoneId) {
    loadStoneDetails(stoneId);
  } else {
    window.location.href = "/catalog/stones.html";
  }
});

async function loadStoneDetails(stoneId) {
  try {
    const res = await apiCall(`/stones/${stoneId}`);

    if (!res.success || !res.data) {
      toast.error("Stone not found");
      setTimeout(() => (window.location.href = "/catalog/stones.html"), 2000);
      return;
    }

    currentStone = normalizeStone(res.data);

    renderStoneDetails();
    loadReviews(stoneId);
  } catch (error) {
    console.error("Error loading stone details:", error);
    toast.error("Failed to load stone details");
  }
}

function renderStoneDetails() {
  document.getElementById("breadcrumbStone").textContent = currentStone.name;
  document.title = `${currentStone.name} - SSMS`;

  const ratingHtml = currentStone.rating
    ? `<div class="stone-meta-item">
            <div class="stone-meta-label">Rating</div>
            <div class="stone-meta-value">⭐ ${currentStone.rating} (${currentStone.reviewCount} reviews)</div>
          </div>`
    : "";

  const sizesHtml = currentStone.sizes.length
    ? `<div class="spec-item">
              <span class="spec-label">Available Sizes:</span>
              <span class="spec-value">${currentStone.sizes.join(", ")}</span>
            </div>`
    : "";

  const finishHtml = currentStone.finish.length
    ? `<div class="spec-item">
              <span class="spec-label">Finishes:</span>
              <span class="spec-value">${currentStone.finish.join(", ")}</span>
            </div>`
    : "";

  const unitLabel = currentStone.unit ? ` / ${currentStone.unit}` : "";

  const container = document.getElementById("stoneDetails");
  container.innerHTML = `
    <div class="stone-details-layout">
      <div class="stone-gallery">
        <div class="gallery-main">
          <img src="${currentStone.image}" alt="${currentStone.name}" id="mainImage">
        </div>
        <div class="gallery-thumbs">
          <div class="gallery-thumb active" data-image="${currentStone.image}">
            <img src="${currentStone.image}" alt="${currentStone.name}">
          </div>
        </div>
      </div>
      
      <div class="stone-info">
        <div class="flex items-center gap-md mb-md">
          <span class="badge badge-primary">${currentStone.type}</span>
          ${currentStone.bestseller ? '<span class="badge badge-warning">Bestseller</span>' : ""}
          ${currentStone.stock > 0 ? '<span class="badge badge-success">In Stock</span>' : '<span class="badge badge-danger">Out of Stock</span>'}
        </div>
        
        <h1>${currentStone.name}</h1>
        
        <div class="stone-meta">
          ${ratingHtml}
          <div class="stone-meta-item">
            <div class="stone-meta-label">Availability</div>
            <div class="stone-meta-value">${currentStone.stock} ${currentStone.unit} in stock</div>
          </div>
        </div>
        
        ${currentStone.description ? `<p class="text-lg">${currentStone.description}</p>` : ""}
        
        <div class="stone-price">${formatCurrency(currentStone.price)}${unitLabel}</div>
        
        <div class="stone-specs">
          <h3>Specifications</h3>
          <div class="specs-grid">
            <div class="spec-item">
              <span class="spec-label">Type:</span>
              <span class="spec-value">${currentStone.type}</span>
            </div>
            ${
              currentStone.size
                ? `<div class="spec-item">
              <span class="spec-label">Size:</span>
              <span class="spec-value">${currentStone.size}</span>
            </div>`
                : ""
            }
            ${sizesHtml}
            ${finishHtml}
          </div>
        </div>
        
        <div class="stone-actions">
          <div class="quantity-selector">
            <label>Quantity:</label>
            <div class="quantity-input">
              <button class="quantity-btn" onclick="window.decreaseQuantity()">-</button>
              <div class="quantity-value" id="quantityValue">${quantity}</div>
              <button class="quantity-btn" onclick="window.increaseQuantity()">+</button>
            </div>
          </div>
          
          <button class="btn btn-accent btn-lg" onclick="window.addToCart()" ${currentStone.stock <= 0 ? "disabled" : ""}>
            🛒 Add to Cart
          </button>
        </div>
      </div>
    </div>
  `;

  // Gallery thumbs interaction
  document.querySelectorAll(".gallery-thumb").forEach((thumb) => {
    thumb.addEventListener("click", (e) => {
      document
        .querySelectorAll(".gallery-thumb")
        .forEach((t) => t.classList.remove("active"));
      thumb.classList.add("active");
      const mainImage = document.getElementById("mainImage");
      mainImage.src = thumb.dataset.image;
    });
  });
}

async function loadReviews(stoneId) {
  try {
    const res = await apiCall(`/stones/${stoneId}/reviews`);
    const reviewData = res.success && res.data ? res.data : {};
    const reviews = Array.isArray(reviewData.reviews)
      ? reviewData.reviews
      : Array.isArray(reviewData)
        ? reviewData
        : [];

    // Summary (prefer backend stats, fall back to stone-level data)
    const avgRating = reviewData.average_rating || currentStone.rating || 0;
    const totalReviews =
      reviewData.review_count || currentStone.reviewCount || reviews.length;

    document.getElementById("reviewsSummary").innerHTML = totalReviews
      ? `
      <div class="flex items-center gap-md">
        <span class="text-3xl font-bold">${avgRating || "-"}</span>
        <div>
          <div class="text-lg">${"⭐".repeat(Math.round(avgRating))}</div>
          <div class="text-sm text-muted">${totalReviews} reviews</div>
        </div>
      </div>
    `
      : '<p class="text-muted">No ratings yet</p>';

    // Reviews list
    if (reviews.length === 0) {
      document.getElementById("reviewsList").innerHTML =
        '<p class="text-muted">No reviews yet. Be the first to review!</p>';
      return;
    }

    document.getElementById("reviewsList").innerHTML = reviews
      .map((review) => {
        const name = review.customer_name || review.customerName || "Anonymous";
        const date = review.created_at || review.createdAt || "";
        const initials = name
          .split(" ")
          .map((n) => n[0])
          .join("");
        return `
      <div class="review-card">
        <div class="review-header">
          <div class="review-author">
            <div class="review-avatar">${initials}</div>
            <div>
              <div class="review-name">${name}</div>
              <div class="review-date">${formatDate(date)}</div>
            </div>
          </div>
          <div class="review-rating">${"⭐".repeat(review.rating || 0)}</div>
        </div>
        ${review.title ? `<div class="review-title">${review.title}</div>` : ""}
        <p class="review-text">${review.comment || ""}</p>
        ${review.verified ? '<span class="badge badge-success">Verified Purchase</span>' : ""}
      </div>
    `;
      })
      .join("");
  } catch (error) {
    console.error("Error loading reviews:", error);
  }
}

// Quantity controls (exposed to window for onclick)
window.increaseQuantity = function () {
  quantity++;
  document.getElementById("quantityValue").textContent = quantity;
};

window.decreaseQuantity = function () {
  if (quantity > 1) {
    quantity--;
    document.getElementById("quantityValue").textContent = quantity;
  }
};

window.addToCart = async function () {
  if (!currentStone) return;

  const res = await apiCall("/cart/add", "POST", {
    stone_id: currentStone.stone_id,
    quantity: quantity,
  });

  if (!res.success) {
    toast.error(res.error?.message || "Failed to add to cart");
    return;
  }

  toast.success(
    `Added ${quantity} ${currentStone.unit || "unit(s)"} of ${currentStone.name} to cart`,
    "Added to Cart",
  );
  quantity = 1;
  document.getElementById("quantityValue").textContent = quantity;
};
