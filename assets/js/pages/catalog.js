import { STONES } from "../data/stones-data.js";
import { refreshRevealObservers } from "../ui/motion.js";
import { formatCurrency, debounce, getQueryParam, setQueryParam } from "../app.js";
import { createPageTranslator } from "../ui/page-translator.js";

const translator = createPageTranslator({
  en: {
    eyebrow: "The Atelier Collection",
    heroHeadline: "Curated premium stones for projects that demand presence.",
    heroSubtitle: "Discover a refined material marketplace designed for modern architecture, luxury interiors and procurement teams who want clarity, quality and a seamless shopping flow.",
    requestSample: "Request a curated sample",
    learnStory: "Learn our sourcing story",
    stat1Value: "70+",
    stat1Label: "Exclusive finishes crafted for premium spaces.",
    stat2Value: "White-glove",
    stat2Label: "delivery, logistics and project support.",
    stat3Value: "Transparent",
    stat3Label: "pricing, specs and curated stone sourcing.",
    searchPlaceholder: "Search stones, finishes, or textures",
    sortBy: "Sort by",
    sortFeatured: "Featured",
    sortPriceAsc: "Price: Low to High",
    sortPriceDesc: "Price: High to Low",
    sortTopRated: "Top Rated",
    filterAll: "All Materials",
    filterMarble: "Marble",
    filterLimestone: "Limestone",
    filterJerusalem: "Jerusalem Stone",
    filterGranite: "Granite",
    filterTravertine: "Travertine",
    filterBasalt: "Basalt",
    resultsCount: "{count} premium selections ready to specify.",
    inStockSuffix: "in stock",
    unitSeparator: "/",
    perUnit: "per",
  },
  ar: {
    eyebrow: "مجموعة الأتيلييه",
    heroHeadline: "أحجار مميزة للمشاريع التي تطلب حضورًا.",
    heroSubtitle: "اكتشف سوق مواد مُنتقاة للهندسة المعمارية الحديثة والديكورات الفاخرة وفرق الشراء التي تريد الوضوح والجودة وتدفق تسوق سلس.",
    requestSample: "اطلب عينة مخصصة",
    learnStory: "تعرف على قصة مصدرنا",
    stat1Value: "70+",
    stat1Label: "تشطيبات حصرية للمساحات الفاخرة.",
    stat2Value: "خدمة مميزة",
    stat2Label: "التوصيل والدعم اللوجستي للمشاريع.",
    stat3Value: "شفاف",
    stat3Label: "الأسعار والمواصفات ومصدر الحجر المنسق.",
    searchPlaceholder: "ابحث عن حجارة أو تشطيبات أو ملمس",
    sortBy: "فرز حسب",
    sortFeatured: "مميز",
    sortPriceAsc: "السعر: من الأقل للأعلى",
    sortPriceDesc: "السعر: من الأعلى للأقل",
    sortTopRated: "الأعلى تقييمًا",
    filterAll: "كل المواد",
    filterMarble: "رخام",
    filterLimestone: "حجر كلسي",
    filterJerusalem: "حجر إسرائيلي",
    filterGranite: "جرانيت",
    filterTravertine: "ترافرتين",
    filterBasalt: "بازلت",
    resultsCount: "{count} اختيارات جاهزة للتحديد.",
    inStockSuffix: "متوفر",
    unitSeparator: "/",
    perUnit: "لكل",
  },
});

const grid = document.getElementById("productsGrid");
const searchInput = document.getElementById("catalogSearch");
const filterButtons = Array.from(document.querySelectorAll("[data-filter-type]"));
const sortSelect = document.getElementById("sortBy");
const resultsText = document.getElementById("catalogResults");

const state = {
  query: "",
  type: "all",
  sortBy: "featured",
  stones: STONES,
};

function renderProducts(products) {
  const lang = translator.getLanguage();
  grid.innerHTML = products
    .map((stone) => {
      const isLowStock = stone.stock <= 8;
      const localizedName = lang === "ar" && stone.name_ar ? stone.name_ar : stone.name;
      const localizedDescription = lang === "ar" && stone.description_ar ? stone.description_ar : stone.description;
      const inStockText = translator.translate().inStockSuffix || "in stock";
      return `
      <a href="/catalog/stone-details.html?id=${stone.id}" class="catalog-card" data-type="${stone.type.toLowerCase()}">
        <div class="catalog-card__media">
          <img src="${stone.image}" alt="${localizedName}" />
          <div class="catalog-card__badge">${stone.type}</div>
        </div>

        <div class="catalog-card__body">
          <div class="catalog-card__title">${localizedName}</div>
          <p class="catalog-card__meta">${localizedDescription}</p>
          <div class="catalog-card__footer">
            <span class="catalog-card__price">${formatCurrency(stone.price)} / ${stone.unit}</span>
            <span class="catalog-card__stock ${isLowStock ? "low-stock" : ""}">${stone.stock} ${inStockText}</span>
          </div>
        </div>
      </a>
    `;
    })
    .join("");

  const strings = translator.translate();
  const template = strings.resultsCount || "{count} premium selections ready to specify.";
  resultsText.textContent = template.replace("{count}", products.length);
}

function applyFilters() {
  let filtered = state.stones.slice();

  if (state.type !== "all") {
    filtered = filtered.filter(
      (stone) => stone.type.toLowerCase() === state.type.toLowerCase(),
    );
  }

  if (state.query) {
    const query = state.query.toLowerCase();
    filtered = filtered.filter((stone) => {
      return (
        (stone.name && stone.name.toLowerCase().includes(query)) ||
        (stone.name_ar && stone.name_ar.toLowerCase().includes(query)) ||
        (stone.type && stone.type.toLowerCase().includes(query)) ||
        (stone.description && stone.description.toLowerCase().includes(query)) ||
        (stone.description_ar && stone.description_ar.toLowerCase().includes(query))
      );
    });
  }

  if (state.sortBy === "price-asc") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (state.sortBy === "price-desc") {
    filtered.sort((a, b) => b.price - a.price);
  } else if (state.sortBy === "rating") {
    filtered.sort((a, b) => b.rating - a.rating);
  } else {
    filtered.sort((a, b) => (b.bestseller === a.bestseller ? 0 : b.bestseller ? -1 : 1));
  }

  renderProducts(filtered);
  refreshRevealObservers();
}

function setActiveFilter(type) {
  filterButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-filter-type") === type);
  });
}

function initControls() {
  if (searchInput) {
    searchInput.value = state.query;
    searchInput.addEventListener(
      "input",
      debounce((event) => {
        state.query = event.target.value.trim();
        setQueryParam("q", state.query);
        applyFilters();
      }, 220),
    );
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.type = button.getAttribute("data-filter-type") || "all";
      setQueryParam("type", state.type);
      setActiveFilter(state.type);
      applyFilters();
    });
  });

  if (sortSelect) {
    sortSelect.value = state.sortBy;
    sortSelect.addEventListener("change", (event) => {
      state.sortBy = event.target.value;
      setQueryParam("sort", state.sortBy);
      applyFilters();
    });
  }
}

function restoreStateFromUrl() {
  const type = getQueryParam("type");
  const q = getQueryParam("q");
  const sort = getQueryParam("sort");

  if (type) {
    state.type = type;
  }
  if (q) {
    state.query = q;
  }
  if (sort) {
    state.sortBy = sort;
  }

  setActiveFilter(state.type);
}

if (grid) {
  document.addEventListener("DOMContentLoaded", () => {
    translator.translate();
    restoreStateFromUrl();
    initControls();
    applyFilters();
    window.addEventListener("ssms:languagechange", () => {
      translator.translate();
      applyFilters();
    });
  });
}
