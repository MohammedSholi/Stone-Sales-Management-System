/* Admin Stones Management JavaScript */

import { UserSession } from "../storage.js";
import { StonesAPI } from "../data/api-mock.js";
import { formatCurrency } from "../app.js";
import { Modal, showConfirm } from "../ui/modal.js";
import toast from "../ui/toast.js";

let stones = [];
let stoneModal = null;
let currentEditingId = null;

document.addEventListener("DOMContentLoaded", async () => {
  if (
    !UserSession.isLoggedIn() ||
    (UserSession.getRole() || "").toLowerCase() !== "admin"
  ) {
    window.location.href = "/auth/login.html";
    return;
  }

  stoneModal = new Modal(document.getElementById("stoneModal"));

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
});

async function loadStones() {
  stones = await StonesAPI.getAll();
  renderStones();
}

function renderStones() {
  const tbody = document.getElementById("stonesTableBody");

  tbody.innerHTML = stones
    .map(
      (stone) => `
    <tr>
      <td><img src="${stone.image}" alt="${stone.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;"></td>
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

function openAddStoneModal() {
  currentEditingId = null;
  document.getElementById("modalTitle").textContent = "Add New Stone";
  document.getElementById("stoneForm").reset();
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

  const stoneData = {
    name: document.getElementById("stoneName").value,
    type: document.getElementById("stoneType").value,
    price: parseFloat(document.getElementById("stonePrice").value),
    stock: parseInt(document.getElementById("stoneStock").value),
    description: document.getElementById("stoneDescription").value,
    image:
      document.getElementById("stoneImage").value ||
      "https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=400",
  };

  if (currentEditingId) {
    // Update existing stone
    toast.success("Stone updated successfully");
  } else {
    // Add new stone
    toast.success("Stone added successfully");
  }

  stoneModal.close();
  loadStones();
}
