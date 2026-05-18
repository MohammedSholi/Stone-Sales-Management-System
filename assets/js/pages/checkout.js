import { CartStorage, UserSession } from "../storage.js";
import { apiCall } from "../api.js";
import toast from "../ui/toast.js";
import { formatCurrency, isValidEmail, isValidPhone } from "../app.js";

document.addEventListener("DOMContentLoaded", async () => {
  const role = (UserSession.getRole() || "").toLowerCase();
  if (!UserSession.isLoggedIn() || role !== "customer") {
    window.location.href = "/auth/login.html";
    return;
  }

  const cart = CartStorage.getCart();
  if (!cart.length) {
    const formContainer = document.getElementById("checkoutForm");
    if (formContainer) {
      formContainer.innerHTML = `
        <div class="empty-cart">
          <div class="empty-cart-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p class="text-muted mb-xl">Add one of our premium stones before checkout.</p>
          <a href="/catalog/stones.html" class="btn btn-primary btn-lg">Browse Collection</a>
        </div>
      `;
    }
    const summary = document.querySelector(".cart-summary");
    if (summary) summary.style.display = "none";
    return;
  }

  renderOrderSummary(cart);
  const checkoutForm = document.getElementById("checkoutForm");
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", (event) => handleCheckout(event));
  }
});

function renderOrderSummary(cart) {
  const itemsHtml = cart
    .map(
      (item) => `
      <div class="summary-item">
        <span>${item.name} x${item.quantity}</span>
        <strong>${formatCurrency(item.price * item.quantity)}</strong>
      </div>
    `,
    )
    .join("");

  document.getElementById("orderItems").innerHTML = itemsHtml;

  const subtotal = CartStorage.getCartTotal();
  const delivery = 65;
  const total = subtotal + delivery;

  document.getElementById("subtotal").textContent = formatCurrency(subtotal);
  document.getElementById("delivery").textContent = formatCurrency(delivery);
  document.getElementById("total").textContent = formatCurrency(total);
}

async function handleCheckout(event) {
  event.preventDefault();

  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const address = document.getElementById("address").value.trim();
  const city = document.getElementById("city").value.trim();
  const zipCode = document.getElementById("zipCode").value.trim();
  const notes = document.getElementById("notes").value.trim();

  if (!fullName || !isValidEmail(email) || !isValidPhone(phone) || !address || !city || !zipCode) {
    toast.error("Please complete all required fields with valid values.");
    return;
  }

  const cart = CartStorage.getCart();
  if (!cart.length) {
    toast.error("Your cart is empty.");
    return;
  }

  const submitBtn = document.querySelector('#checkoutForm button[type="submit"]');
  const originalLabel = submitBtn ? submitBtn.textContent : "Place Order";
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Placing order...";
  }

  try {
    // Sync browser cart to backend cart before checkout.
    await apiCall("/cart", "DELETE");

    for (const item of cart) {
      const stoneId = Number.parseInt(item.id, 10);
      if (Number.isNaN(stoneId)) {
        throw new Error(`Invalid stone id for item: ${item.name || item.id}`);
      }

      const addRes = await apiCall("/cart/add", "POST", {
        stone_id: stoneId,
        quantity: item.quantity,
      });

      if (!addRes.success) {
        throw new Error(addRes.error?.message || `Failed to add ${item.name}`);
      }
    }

    const checkoutRes = await apiCall("/checkout", "POST", {
      contact_name: fullName,
      contact_email: email,
      contact_phone: phone,
      delivery_address: `${address}, ${city}, ${zipCode}`,
      notes,
    });

    if (!checkoutRes.success) {
      throw new Error(checkoutRes.error?.message || "Checkout failed");
    }

    const order = checkoutRes.data || {};
    CartStorage.clearCart();
    toast.success("Order confirmed. We are preparing your premium delivery.");

    const orderId = order.order_id || order.id;
    setTimeout(() => {
      window.location.href = orderId
        ? `/customer/order-details.html?id=${orderId}`
        : "/customer/my-orders.html";
    }, 900);
  } catch (err) {
    console.error("Checkout failed:", err);
    toast.error(err.message || "Could not place order. Please try again.");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  }
}
