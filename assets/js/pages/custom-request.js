/* Custom Request Page JavaScript */

import { RequestStorage, UserSession } from "../storage.js";
import toast from "../ui/toast.js";
import { showAlert } from "../ui/modal.js";

document.addEventListener("DOMContentLoaded", () => {
  if (!UserSession.isLoggedIn()) {
    window.location.href = "/auth/login.html";
    return;
  }

  document
    .getElementById("customRequestForm")
    .addEventListener("submit", handleSubmit);
});

function handleSubmit(e) {
  e.preventDefault();

  const user = UserSession.getUser();

  const stoneType = document.getElementById("stoneType").value;
  const quantity = parseInt(document.getElementById("quantity").value);
  const budget = parseFloat(document.getElementById("budget").value) || null;
  const description = document.getElementById("description").value.trim();
  const deadline = document.getElementById("deadline").value;

  const request = {
    customerId: user.id,
    customerName: user.name,
    customerEmail: user.email,
    stoneType,
    quantity,
    budget,
    description,
    deadline: deadline || null,
  };

  const savedRequest = RequestStorage.addRequest(request);

  showAlert({
    title: "Request Submitted!",
    message: `Your custom request #${savedRequest.id} has been submitted successfully. Our team will review it and contact you within 24-48 hours.`,
    type: "success",
    onConfirm: () => {
      window.location.href = "/customer/dashboard.html";
    },
  });
}
