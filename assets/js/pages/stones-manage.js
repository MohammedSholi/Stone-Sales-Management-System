/* Admin Stones Management JavaScript */

import { UserSession } from "../storage.js";
import { formatCurrency } from "../app.js";
import { showConfirm } from "../ui/modal.js";
import { apiCall, API_BASE } from "../api.js";
import toast from "../ui/toast.js";

const BACKEND_BASE = "http://localhost/ssms-backend";

let stones = [];
let stoneModal = null;
let currentEditingId = null;
let selectedStoneImageFile = null;

document.addEventListener("DOMContentLoaded", async () => {
  if (
    !UserSession.isLoggedIn() ||
    (UserSession.getRole() || "").toLowerCase() !== "admin"
  ) {
    window.location.href = "/auth/login.html";
    return;
  }

  stoneModal = createStaticModal(document.getElementById("stoneModal"));

  await loadStones();

  document
    .getElementById("addStoneBtn")
    .addEventListener("click", () => openAddStoneModal());
  document
    .getElementById("cancelBtn")
    .addEventListener("click", () => stoneModal.close());
  document
    .getElementById("saveStoneBtn")
    .addEventListener("click", handleSaveStone);

  const uploadStoneImageBtn = document.getElementById("uploadStoneImageBtn");
  const stoneImageFile = document.getElementById("stoneImageFile");
  if (uploadStoneImageBtn && stoneImageFile) {
    uploadStoneImageBtn.addEventListener("click", () => stoneImageFile.click());
    stoneImageFile.addEventListener("change", handleStoneImageSelected);
  }
});

async function loadStones() {
  const res = await apiCall("/stones");
  // Accept multiple response shapes. Common shapes:
  // - Array of stones
  // - { data: [ ... ] }
  // - { success: true, data: { stones: [ ... ], pagination: {...} } }
  // - { result: [ ... ] }
  let raw = [];
  if (Array.isArray(res)) {
    raw = res;
  } else if (res && Array.isArray(res.data)) {
    raw = res.data;
  } else if (res && res.data && Array.isArray(res.data.stones)) {
    raw = res.data.stones;
  } else if (res && Array.isArray(res.result)) {
    raw = res.result;
  } else if (res && typeof res === "object" && Object.keys(res).length === 0) {
    raw = [];
  } else {
    console.warn("Unexpected /stones response shape:", res);
    raw = [];
  }

  // Normalize backend fields to the UI format
  stones = (raw || []).map((s) => ({
    id: s.stone_id || s.id,
    name: s.name,
    type: s.type,
    image: resolveImageUrl(s.image_url || s.image || ""),
    price: s.price_per_unit || s.price || 0,
    stock: s.quantity_in_stock || s.stock || 0,
    description: s.description || "",
  }));
  renderStones();
}

// Small helper to wrap the static modal element and provide open/close
function createStaticModal(el) {
  // Hook backdrop click and close button automatically
  function onBackdropClick(e) {
    if (e.target === el) {
      modalAPI.close();
    }
  }

  const modalAPI = {
    open() {
      if (!el) return;
      el.classList.add("open");
      document.body.style.overflow = "hidden";
    },
    close() {
      if (!el) return;
      el.classList.remove("open");
      document.body.style.overflow = "";
    },
  };

  // Backdrop click closes
  el.addEventListener("click", onBackdropClick);

  // Close button inside modal
  const closeBtn = el.querySelector(".modal-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => modalAPI.close());
  }

  return modalAPI;
}

function renderStones() {
  const tbody = document.getElementById("stonesTableBody");

  tbody.innerHTML = stones
    .map(
      (stone) => `
    <tr>
      <td><img src="${stone.image || "/assets/img/logo-hajari.svg"}" alt="${stone.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;"></td>
      <td><strong>${stone.name}</strong></td>
      <td>${stone.type}</td>
      <td>${formatCurrency(stone.price)}</td>
      <td>${stone.stock} sq ft</td>
      <td><span class="badge badge-${stone.stock > 0 ? "success" : "danger"}">${stone.stock > 0 ? "In Stock" : "Out of Stock"}</span></td>
      <td>
        <button class="btn btn-primary btn-sm" onclick="window.editStone('${stone.id}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="window.deleteStone('${stone.id}')">Delete</button>
      </td>
    </tr>
  `,
    )
    .join("");
}

function resolveImageUrl(imageUrl) {
  if (!imageUrl) return "";
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  if (imageUrl.startsWith("/")) return `${BACKEND_BASE}${imageUrl}`;
  return `${BACKEND_BASE}/${imageUrl.replace(/^\/+/, "")}`;
}

function openAddStoneModal() {
  currentEditingId = null;
  selectedStoneImageFile = null;
  document.getElementById("modalTitle").textContent = "Add New Stone";
  document.getElementById("stoneForm").reset();
  document.getElementById("stoneImagePreview").innerHTML = "";
  stoneModal.open();
}

window.editStone = function (id) {
  const stone = stones.find((s) => s.id === id);
  if (!stone) return;

  currentEditingId = id;
  document.getElementById("modalTitle").textContent = "Edit Stone";
  document.getElementById("stoneName").value = stone.name;
  document.getElementById("stoneType").value = stone.type;
  document.getElementById("stonePrice").value = stone.price;
  document.getElementById("stoneStock").value = stone.stock;
  document.getElementById("stoneDescription").value = stone.description || "";
  document.getElementById("stoneImage").value = stone.image || "";
  selectedStoneImageFile = null;
  document.getElementById("stoneImageFile").value = "";
  document.getElementById("stoneImagePreview").innerHTML = stone.image
    ? `<div class="stone-image-preview-card"><img src="${stone.image}" alt="Stone preview" /></div>`
    : "";

  stoneModal.open();
};

window.deleteStone = function (id) {
  showConfirm({
    title: "Delete Stone",
    message:
      "Are you sure you want to delete this stone? This action cannot be undone.",
    confirmText: "Delete",
    onConfirm: () => {
      // In a real app, this would call an API
      toast.success("Stone deleted successfully");
      loadStones();
    },
  });
};

function handleSaveStone() {
  const form = document.getElementById("stoneForm");
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  const payload = {
    name: document.getElementById("stoneName").value,
    type: document.getElementById("stoneType").value,
    price_per_unit: parseFloat(document.getElementById("stonePrice").value),
    quantity_in_stock: parseInt(document.getElementById("stoneStock").value),
    description: document.getElementById("stoneDescription").value,
    image_url: document.getElementById("stoneImage").value.trim() || null,
  };

  (async () => {
    try {
      let res;
      if (currentEditingId) {
        res = await apiCall(`/stones/${currentEditingId}`, "PUT", payload);
      } else {
        res = await apiCall("/stones", "POST", payload);
      }

      if (!res || res.success === false) {
        toast.error(res?.error?.message || "Failed to save stone");
        return;
      }

      const savedStone = res.data || res;
      const stoneId =
        currentEditingId || savedStone?.stone_id || savedStone?.id;

      if (selectedStoneImageFile && stoneId) {
        const formData = new FormData();
        formData.append("image", selectedStoneImageFile);

        const uploadResponse = await fetch(
          `${API_BASE}/stones/${stoneId}/image`,
          {
            method: "POST",
            credentials: "include",
            body: formData,
          },
        );
        const uploadResult = await uploadResponse.json();

        if (!uploadResult.success) {
          toast.error(uploadResult.error?.message || "Image upload failed");
          return;
        }
      }

      toast.success(
        res.message ||
          (currentEditingId
            ? "Stone updated successfully"
            : "Stone added successfully"),
      );
      stoneModal.close();
      await loadStones();
    } catch (err) {
      console.error("Save stone error:", err);
      toast.error("Failed to save stone");
    }
  })();
}

function handleStoneImageSelected(event) {
  const file = event.target.files && event.target.files[0];
  const preview = document.getElementById("stoneImagePreview");

  if (!file) {
    selectedStoneImageFile = null;
    preview.innerHTML = "";
    return;
  }

  if (!file.type.startsWith("image/")) {
    toast.error("Please choose an image file");
    event.target.value = "";
    selectedStoneImageFile = null;
    preview.innerHTML = "";
    return;
  }

  selectedStoneImageFile = file;
  const objectUrl = URL.createObjectURL(file);
  preview.innerHTML = `
    <div class="stone-image-preview-card">
      <img src="${objectUrl}" alt="Stone preview" />
    </div>
  `;
}
