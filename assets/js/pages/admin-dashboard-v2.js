import { UserSession } from "../storage.js";
import { apiCall } from "../api.js";
import { formatCurrency, formatDate } from "../app.js";
import { createPageTranslator } from "../ui/page-translator.js";

const translations = {
  en: {
    heroEyebrow: "Executive Control Room",
    heroTitle: "A sharper dashboard for revenue, operations, and decision speed.",
    heroSubtitle:
      "Monitor orders, requests, product inventory, and performance signals from one refined admin workspace built for clarity and momentum.",
    heroPrimary: "Open Orders",
    heroSecondary: "Manage Stones",
    heroPanelRevenue: "Revenue Pulse",
    heroPanelConversion: "Completion Rate",
    heroPanelSummary: "Operations Note",
    totalOrdersLabel: "Total Orders",
    totalStonesLabel: "Stones Listed",
    totalRequestsLabel: "Custom Requests",
    totalRevenueLabel: "Total Revenue",
    insightsTitle: "Performance Signals",
    insightsSubtitle: "High-level indicators for action and review.",
    avgOrderLabel: "Average Order Value",
    completionLabel: "Completion Rate",
    reviewPressureLabel: "Review Queue",
    materialsTitle: "Material Focus",
    materialsSubtitle: "Current product distribution across stone categories.",
    actionStonesTitle: "Refine Product Catalog",
    actionStonesText: "Curate inventory, replace weak listings, and keep the assortment premium.",
    actionOrdersTitle: "Direct Order Flow",
    actionOrdersText: "Prioritize assignments, check delays, and keep delivery promises visible.",
    actionRequestsTitle: "Handle Bespoke Requests",
    actionRequestsText: "Review custom demand early and turn intent into profitable sourcing.",
    recentOrdersTitle: "Recent Orders",
    recentOrdersSubtitle: "Latest commercial activity across the platform.",
    pendingRequestsTitle: "Pending Requests",
    pendingRequestsSubtitle: "Opportunities that still need review or pricing direction.",
    footerTitle: "Hajari",
    footerText:
      "A premium stone platform for curated materials, design-led sourcing, and elevated project execution.",
    footerExplore: "Explore",
    footerCatalog: "Catalog",
    footerAbout: "About",
    footerRequest: "Custom Request",
    footerAdmin: "Admin Login",
    footerContact: "Contact",
    footerPhone: "+972 59-394-3350",
    footerEmail: "info@hajari-stone.com",
    footerRights: "© 2026 Hajari - Stone Sales Management System. All rights reserved.",
    summaryHealthy: "Operations look healthy. Revenue is moving and the review queue is contained.",
    summaryBusy: "Request pressure is rising. Review custom demand and unblock assignments quickly.",
    summarySlow: "Order completion is lagging. Focus on stuck orders and delivery handoffs this cycle.",
    noOrders: "No recent orders yet.",
    noRequests: "No pending requests right now.",
    customerLabel: "Customer",
    amountLabel: "Amount",
    viewOrder: "View Details",
    assignEmployee: "Assign Employee",
    reviewRequest: "Review Request",
    requestStone: "Stone",
    requestQty: "Requested quantity",
    materialFallback: "No material mix data yet.",
  },
  ar: {
    heroEyebrow: "غرفة التحكم التنفيذية",
    heroTitle: "لوحة أذكى للإيرادات والعمليات وسرعة اتخاذ القرار.",
    heroSubtitle:
      "راقب الطلبات وطلبات التخصيص والمخزون وإشارات الأداء من مساحة إدارة راقية بُنيت للوضوح والسرعة.",
    heroPrimary: "افتح الطلبات",
    heroSecondary: "إدارة الأحجار",
    heroPanelRevenue: "نبض الإيرادات",
    heroPanelConversion: "معدل الإنجاز",
    heroPanelSummary: "ملاحظة تشغيلية",
    totalOrdersLabel: "إجمالي الطلبات",
    totalStonesLabel: "الأحجار المدرجة",
    totalRequestsLabel: "الطلبات المخصصة",
    totalRevenueLabel: "إجمالي الإيرادات",
    insightsTitle: "إشارات الأداء",
    insightsSubtitle: "مؤشرات عالية المستوى للمراجعة واتخاذ الإجراء.",
    avgOrderLabel: "متوسط قيمة الطلب",
    completionLabel: "معدل الإنجاز",
    reviewPressureLabel: "قائمة المراجعة",
    materialsTitle: "تركيز المواد",
    materialsSubtitle: "التوزيع الحالي للمنتجات حسب فئات الحجر.",
    actionStonesTitle: "صقل الكتالوج",
    actionStonesText: "نقّح المخزون، استبدل العروض الضعيفة، وأبقِ التشكيلة بمستوى فاخر.",
    actionOrdersTitle: "توجيه سير الطلبات",
    actionOrdersText: "أعطِ الأولوية للتعيين، راقب التأخير، وأبقِ وعود التسليم واضحة.",
    actionRequestsTitle: "معالجة الطلبات الخاصة",
    actionRequestsText: "راجع الطلبات المخصصة مبكرًا وحوّل الاهتمام إلى فرص توريد مربحة.",
    recentOrdersTitle: "أحدث الطلبات",
    recentOrdersSubtitle: "آخر النشاطات التجارية على المنصة.",
    pendingRequestsTitle: "الطلبات المعلّقة",
    pendingRequestsSubtitle: "فرص تحتاج إلى مراجعة أو تسعير أو توجيه سريع.",
    footerTitle: "Hajari",
    footerText:
      "منصة حجر فاخر للمواد المختارة، والتوريد القائم على الذائقة، وتنفيذ المشاريع بمستوى راقٍ.",
    footerExplore: "استكشف",
    footerCatalog: "الكتالوج",
    footerAbout: "من نحن",
    footerRequest: "طلب مخصص",
    footerAdmin: "دخول الإدارة",
    footerContact: "تواصل",
    footerPhone: "+972 59-394-3350",
    footerEmail: "info@hajari-stone.com",
    footerRights: "© 2026 Hajari - جميع الحقوق محفوظة.",
    summaryHealthy: "الوضع التشغيلي جيد. الإيرادات تتحرك وقائمة المراجعة تحت السيطرة.",
    summaryBusy: "ضغط الطلبات المخصصة يرتفع. راجع الطلبات سريعًا وفك اختناقات التعيين.",
    summarySlow: "معدل الإنجاز أبطأ من المطلوب. ركّز على الطلبات المتوقفة وتسليماتها.",
    noOrders: "لا توجد طلبات حديثة بعد.",
    noRequests: "لا توجد طلبات معلقة حاليًا.",
    customerLabel: "العميل",
    amountLabel: "القيمة",
    viewOrder: "عرض التفاصيل",
    assignEmployee: "تعيين موظف",
    reviewRequest: "مراجعة الطلب",
    requestStone: "الحجر",
    requestQty: "الكمية المطلوبة",
    materialFallback: "لا توجد بيانات كافية لتوزيع المواد بعد.",
  },
};

const translator = createPageTranslator(translations);
let dashboardState = {
  orders: [],
  stones: [],
  requests: [],
};

document.addEventListener("DOMContentLoaded", async () => {
  const role = (UserSession.getRole() || "").toLowerCase();
  if (!UserSession.isLoggedIn() || role !== "admin") {
    window.location.href = "/auth/login.html";
    return;
  }

  translator.translate();
  await loadDashboardData();
});

window.addEventListener("ssms:languagechange", () => {
  translator.translate();
  renderDashboard();
});

async function loadDashboardData() {
  try {
    const [ordersRes, stonesRes, requestsRes] = await Promise.all([
      apiCall("/admin/orders"),
      apiCall("/stones"),
      apiCall("/admin/requests"),
    ]);

    dashboardState.orders =
      ordersRes.success && Array.isArray(ordersRes.data) ? ordersRes.data : [];
    dashboardState.stones =
      stonesRes.success && stonesRes.data?.stones ? stonesRes.data.stones : [];
    dashboardState.requests =
      requestsRes.success && Array.isArray(requestsRes.data)
        ? requestsRes.data
        : [];

    renderDashboard();
  } catch (error) {
    console.error("Failed to load admin dashboard:", error);
  }
}

function getStrings() {
  const language = translator.getLanguage();
  return translations[language] || translations.en;
}

function renderDashboard() {
  const strings = getStrings();
  const { orders, stones, requests } = dashboardState;

  const totalOrders = orders.length;
  const totalStones = stones.length;
  const totalRequests = requests.length;
  const completedOrders = orders.filter((order) => {
    const status = order.order_status || order.status;
    return status === "Completed" || status === "Delivered";
  });
  const activeOrders = orders.filter((order) => (order.order_status || order.status) !== "Canceled");
  const totalRevenue = activeOrders.reduce(
    (sum, order) => sum + parseFloat(order.total_amount || 0),
    0,
  );
  const completionRate = activeOrders.length
    ? Math.round((completedOrders.length / activeOrders.length) * 100)
    : 0;
  const avgOrderValue = activeOrders.length
    ? totalRevenue / activeOrders.length
    : 0;
  const reviewQueue = requests.filter((request) => {
    const status = request.request_status || request.status;
    return status === "Pending" || status === "In Review";
  }).length;

  document.getElementById("totalOrders").textContent = totalOrders;
  document.getElementById("totalStones").textContent = totalStones;
  document.getElementById("totalRequests").textContent = totalRequests;
  document.getElementById("totalRevenue").textContent = formatCurrency(totalRevenue);
  document.getElementById("heroRevenue").textContent = formatCurrency(totalRevenue);
  document.getElementById("completionRate").textContent = `${completionRate}%`;
  document.getElementById("completionRateHero").textContent = `${completionRate}%`;
  document.getElementById("avgOrderValue").textContent = formatCurrency(avgOrderValue);
  document.getElementById("reviewPressure").textContent = reviewQueue;
  document.getElementById("operationsSummary").textContent = resolveSummary(strings, completionRate, reviewQueue);

  renderMaterialBreakdown(stones, strings);
  renderRecentOrders(orders.slice(0, 5), strings);
  renderPendingRequests(
    requests
      .filter((request) => {
        const status = request.request_status || request.status;
        return status === "Pending" || status === "In Review";
      })
      .slice(0, 5),
    strings,
  );
}

function resolveSummary(strings, completionRate, reviewQueue) {
  if (completionRate < 45) return strings.summarySlow;
  if (reviewQueue > 3) return strings.summaryBusy;
  return strings.summaryHealthy;
}

function renderMaterialBreakdown(stones, strings) {
  const container = document.getElementById("materialBreakdown");
  if (!stones.length) {
    container.innerHTML = `<p class="order-card__empty">${strings.materialFallback}</p>`;
    return;
  }

  const counts = stones.reduce((acc, stone) => {
    const key = stone.stone_type || stone.type || "Other";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const entries = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const max = entries[0]?.[1] || 1;

  container.innerHTML = entries
    .map(([type, count]) => {
      const width = `${Math.max((count / max) * 100, 10)}%`;
      return `
        <div class="material-breakdown__row">
          <div class="material-breakdown__meta">
            <span>${type}</span>
            <span>${count}</span>
          </div>
          <div class="material-breakdown__bar">
            <div class="material-breakdown__fill" style="width:${width}"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderRecentOrders(orders, strings) {
  const container = document.getElementById("recentOrders");
  if (!orders.length) {
    container.innerHTML = `<p class="order-card__empty">${strings.noOrders}</p>`;
    return;
  }

  container.innerHTML = orders
    .map((order) => {
      const status = order.order_status || order.status;
      return `
        <article class="order-card">
          <div class="order-card__top">
            <div>
              <div class="order-card__id">#${order.order_id}</div>
              <div class="order-card__date">${formatDate(order.order_date || order.created_at)}</div>
            </div>
            <span class="badge badge-${getStatusBadgeClass(status)}">${status}</span>
          </div>
          <p>${strings.customerLabel} #${order.customer_id}</p>
          <div class="order-card__bottom">
            <span class="order-card__amount">${strings.amountLabel}: ${formatCurrency(parseFloat(order.total_amount || 0))}</span>
            <div class="order-card__actions">
              <a href="/admin/orders-manage.html?id=${order.order_id}" class="btn btn-primary btn-sm">${strings.viewOrder}</a>
              ${
                !order.employee_id
                  ? `<a href="/admin/orders-manage.html?id=${order.order_id}" class="btn btn-outline btn-sm">${strings.assignEmployee}</a>`
                  : ""
              }
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderPendingRequests(requests, strings) {
  const container = document.getElementById("pendingRequests");
  if (!requests.length) {
    container.innerHTML = `<p class="order-card__empty">${strings.noRequests}</p>`;
    return;
  }

  container.innerHTML = requests
    .map((request) => {
      const status = request.request_status || request.status;
      return `
        <article class="order-card">
          <div class="order-card__top">
            <div>
              <div class="order-card__id">#${request.custom_order_id || request.id}</div>
              <div class="order-card__date">${formatDate(request.created_at || request.createdAt)}</div>
            </div>
            <span class="badge badge-${getStatusBadgeClass(status)}">${status}</span>
          </div>
          <p>${strings.requestStone}: ${request.stone_type || request.stoneType || "-"}</p>
          <div class="order-card__bottom">
            <span class="order-card__amount">${strings.requestQty}: ${request.requested_quantity || request.quantity || "-"}</span>
            <div class="order-card__actions">
              <a href="/admin/requests-manage.html?id=${request.custom_order_id || request.id}" class="btn btn-primary btn-sm">${strings.reviewRequest}</a>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function getStatusBadgeClass(status) {
  const classes = {
    Pending: "pending",
    Assigned: "assigned",
    "In Progress": "in-progress",
    Completed: "completed",
    Delivered: "delivered",
    Canceled: "canceled",
    "In Review": "warning",
    Approved: "success",
    Rejected: "danger",
  };
  return classes[status] || "primary";
}
