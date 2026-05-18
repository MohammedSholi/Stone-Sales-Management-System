import { STONES } from "../data/stones-data.js";
import { CartStorage } from "../storage.js";
import toast from "../ui/toast.js";
import { refreshRevealObservers } from "../ui/motion.js";
import { formatCurrency, formatDate, getQueryParam } from "../app.js";
import { createPageTranslator } from "../ui/page-translator.js";

const translator = createPageTranslator({
  en: {
    home: "Home",
    catalog: "Catalog",
    luxurySelection: "Luxury Selection",
    priceLabel: "Price",
    typeLabel: "Type",
    sizeLabel: "Size",
    finishesLabel: "Finishes",
    stockLabel: "Stock",
    whyThisStone: "Why this stone?",
    projectReviews: "Project Reviews",
    reviewsSubtitle: "Architects and designers choose this stone for its craft-forward material story.",
    readyToSource: "Ready to source",
    outOfStock: "Out of stock",
    perUnit: "per",
    addToCart: "Add to Cart",
    addedToCart: "added to cart",
    reviewBy: "by",
  },
  ar: {
    home: "الرئيسية",
    catalog: "الكتالوج",
    luxurySelection: "اختيار فاخر",
    priceLabel: "السعر",
    typeLabel: "النوع",
    sizeLabel: "الحجم",
    finishesLabel: "التشطيبات",
    stockLabel: "المخزون",
    whyThisStone: "لماذا هذا الحجر؟",
    projectReviews: "آراء المشاريع",
    reviewsSubtitle: "يختار المهندسون والمصممون هذا الحجر لقصة مادية متقنة.",
    readyToSource: "جاهز للتوريد",
    outOfStock: "غير متوفر",
    perUnit: "لكل",
    addToCart: "أضف إلى السلة",
    addedToCart: "أضيف إلى السلة",
    reviewBy: "بقلم",
  },
});

let currentStone = null;
let quantity = 1;

document.addEventListener("DOMContentLoaded", () => {
  translator.translate();
  const stoneId = getQueryParam("id");
  if (!stoneId) {
    window.location.href = "/catalog/stones.html";
    return;
  }

  currentStone = STONES.find((stone) => stone.id === stoneId);
  if (!currentStone) {
    window.location.href = "/catalog/stones.html";
    return;
  }

  renderStoneDetails();
  refreshRevealObservers();
  window.addEventListener("ssms:languagechange", () => {
    renderStoneDetails();
    translator.translate();
  });
});

function renderStoneDetails() {
  const lang = translator.getLanguage();
  const localizedName = lang === "ar" && currentStone.name_ar ? currentStone.name_ar : currentStone.name;
  const localizedDescription = lang === "ar" && currentStone.description_ar ? currentStone.description_ar : currentStone.description;

  document.getElementById("breadcrumbStone").textContent = localizedName;
  document.title = `${localizedName} — Hajari`;

  const ratingStars = Array.from({ length: 5 })
    .map((_, index) => (index < Math.round(currentStone.rating) ? "★" : "☆"))
    .join("");

  const strings = translator.translate();

  const specs = [
    { label: strings.priceLabel || "Price", value: `${formatCurrency(currentStone.price)} / ${currentStone.unit}` },
    { label: strings.typeLabel || "Type", value: currentStone.type },
    { label: strings.sizeLabel || "Size", value: currentStone.size },
    { label: strings.finishesLabel || "Finishes", value: currentStone.finishes.join(", ") },
    { label: strings.stockLabel || "Stock", value: `${currentStone.stock} ${currentStone.unit}` },
  ]
    .filter((item) => item.value)
    .map(
      (item) => `
        <div class="spec-item">
          <span class="spec-label">${item.label}</span>
          <span class="spec-value">${item.value}</span>
        </div>
      `,
    )
    .join("");

  document.getElementById("stoneDetails").innerHTML = `
    <section class="stone-details-grid">
      <div class="stone-gallery">
        <div class="stone-hero">
          <img src="${currentStone.image}" alt="${currentStone.name}" />
          <div class="stone-hero-badge">${currentStone.type}</div>
        </div>
      </div>

      <div class="stone-summary">
        <div class="stone-headline">
          <span class="stone-flag">${strings.luxurySelection || 'Luxury Selection'}</span>
          <h1>${localizedName}</h1>
          <p>${localizedDescription}</p>
        </div>

        <div class="stone-meta-grid">
          <div class="stone-meta-rating">
            <span>${ratingStars}</span>
            <small>${currentStone.rating} · ${currentStone.reviewCount} ${lang === "ar" ? "مراجعات" : "reviews"}</small>
          </div>
          <div class="stone-meta-availability">${currentStone.stock > 0 ? strings.readyToSource || "Ready to source" : strings.outOfStock || "Out of stock"}</div>
        </div>

        <div class="stone-price-block">
          <div class="stone-price-large">${formatCurrency(currentStone.price)}</div>
          <div class="stone-price-note">${strings.perUnit || 'per'} ${currentStone.unit}</div>
        </div>

        <div class="stone-specs-panel">${specs}</div>

        <div class="stone-actions">
          <div class="quantity-picker">
            <button class="quantity-btn" type="button" onclick="window.decreaseQuantity()">−</button>
            <div id="quantityValue" class="quantity-value">${quantity}</div>
            <button class="quantity-btn" type="button" onclick="window.increaseQuantity()">+</button>
          </div>
            <button class="btn btn-accent btn-lg" type="button" onclick="window.addToCart()" ${currentStone.stock <= 0 ? "disabled" : ""}>
            🛒 ${strings.addToCart || 'Add to Cart'}
          </button>
        </div>

        <div class="stone-detail-features">
          <h2>${strings.whyThisStone || 'Why this stone?'}</h2>
          <ul>
            ${(lang === 'ar' && currentStone.features_ar ? currentStone.features_ar : currentStone.features).map((feature) => `<li>${feature}</li>`).join("")}
          </ul>
        </div>
      </div>
    </section>
    <section class="stone-reviews">
      <div class="reviews-header">
        <h2>${strings.projectReviews || 'Project Reviews'}</h2>
        <p>${strings.reviewsSubtitle || 'Architects and designers choose this stone for its craft-forward material story.'}</p>
      </div>
      <div class="review-cards">
        ${generateReviewCards(currentStone)}
      </div>
    </section>
  `;
}

function generateReviewCards(stone) {
  const lang = translator.getLanguage();
  const defaultReviews = [
    { author: "Maya A.", author_ar: "مايا أ.", rating: 5, text: "The stone elevated the entire kitchen. Perfect depth and finish.", text_ar: "رفع الحجر مستوى المطبخ بالكامل. عمق ولمسة نهائية مثالية.", date: "2025-11-20" },
    { author: "Omar R.", author_ar: "عمر ر.", rating: 5, text: "Beautiful material with premium presence. Our clients loved it.", text_ar: "مادة جميلة بحضور فاخر. أعجب عملاؤنا بها.", date: "2025-09-10" },
    { author: "Lina S.", author_ar: "لينا س.", rating: 4, text: "Exceptional surface quality and a strong design statement.", text_ar: "جودة سطح استثنائية وبيان تصميم قوي.", date: "2026-01-04" },
  ];

  const reviews = Array.isArray(stone.reviews) && stone.reviews.length ? stone.reviews : defaultReviews;
  const strings = translator.translate();

  return reviews
    .map((review) => {
      const author = lang === "ar" && review.author_ar ? review.author_ar : review.author;
      const text = lang === "ar" && review.text_ar ? review.text_ar : review.text;
      const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);

      return `
      <article class="review-card">
        <div class="review-card__header">
          <div>
            <div class="review-author">${author}</div>
            <div class="review-date">${formatDate(review.date)}</div>
          </div>
          <div class="review-stars">${stars}</div>
        </div>
        <p>${text}</p>
      </article>
    `;
    })
    .join("");
}

window.increaseQuantity = function () {
  if (quantity < 12) {
    quantity += 1;
    document.getElementById("quantityValue").textContent = quantity;
  }
};

window.decreaseQuantity = function () {
  if (quantity > 1) {
    quantity -= 1;
    document.getElementById("quantityValue").textContent = quantity;
  }
};

window.addToCart = function () {
  if (!currentStone) return;
  const lang = translator.getLanguage();
  const localizedName = lang === "ar" && currentStone.name_ar ? currentStone.name_ar : currentStone.name;

  CartStorage.addToCart({
    id: currentStone.id,
    name: localizedName,
    price: currentStone.price,
    image: currentStone.image,
    type: currentStone.type,
    quantity,
  });

  const strings = translator.translate();
  const addedText = strings.addedToCart || "added to cart";
  toast.success(`${quantity} x ${localizedName} ${addedText}`);
  quantity = 1;
  document.getElementById("quantityValue").textContent = quantity;
};
