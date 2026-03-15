/*
 * Auth Pages JavaScript
 * Connects to PHP backend API for real authentication
 */

import toast from "../ui/toast.js";
import { UserSession } from "../storage.js";
import { isValidEmail, isValidPhone } from "../app.js";

// ========== API BASE URL ==========
// Adjust this to match your Apache/XAMPP setup
const API_BASE = "http://localhost/ssms-backend/public/api";

// ========== Helper: Call Backend API ==========
async function apiCall(endpoint, method = "GET", body = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "include", // send session cookies
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(API_BASE + endpoint, options);
  const data = await response.json();
  return data;
}

// ========== LOGIN ==========
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", handleLogin);
}

async function handleLogin(e) {
  e.preventDefault();
  clearErrors();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  // Validate
  let isValid = true;

  if (!username || username.length < 3) {
    showError("usernameError", "Username must be at least 3 characters");
    isValid = false;
  }

  if (!password) {
    showError("passwordError", "Password is required");
    isValid = false;
  }

  if (!isValid) return;

  // Disable button
  const submitBtn = loginForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Signing in...";

  try {
    const result = await apiCall("/auth/login", "POST", {
      username,
      password,
    });

    if (result.success) {
      const user = result.data;
      console.log("Login success, role:", user.role);

      // Save session to localStorage (for navbar/UI state)
      UserSession.setUser(user, user.role);
      if (window.SSMS && window.SSMS.setUserSession) {
        window.SSMS.setUserSession(user, user.role);
      }

      // Redirect based on role from server
      const role = (user.role || "").toLowerCase();
      console.log("Redirecting for role:", role);
      let dest = "/customer/dashboard.html";
      if (role === "admin") dest = "/admin/dashboard.html";
      else if (role === "employee") dest = "/employee/dashboard.html";

      console.log("Navigating to:", dest);
      toast.success("Login successful! Redirecting...", "Welcome");

      // Use multiple redirect strategies for reliability
      try {
        window.location.href = dest;
      } catch (navErr) {
        console.error("location.href failed:", navErr);
      }
      // Fallback: if location.href didn't navigate within 500ms, try again
      setTimeout(function () {
        console.log("Fallback redirect to:", dest);
        window.location = dest;
      }, 500);
      return; // stop further execution
    } else {
      // Show error from server
      const errorMsg =
        result.error?.message || "Login failed. Please try again.";
      toast.error(errorMsg);
      showError("usernameError", errorMsg);
    }
  } catch (err) {
    console.error("Login error:", err);
    toast.error("Network error. Is the backend server running?");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

// ========== REGISTER ==========
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", handleRegister);
}

async function handleRegister(e) {
  e.preventDefault();
  clearErrors();

  // Get all form values
  const fullName = document.getElementById("fullName").value.trim();
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const address = document.getElementById("address").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const terms = document.getElementById("terms").checked;

  // Validate
  let isValid = true;

  if (!fullName || fullName.length < 3) {
    showError("fullNameError", "Full name must be at least 3 characters");
    isValid = false;
  }

  if (!username || username.length < 3) {
    showError("usernameError", "Username must be at least 3 characters");
    isValid = false;
  }

  if (!email) {
    showError("emailError", "Email is required");
    isValid = false;
  } else if (!isValidEmail(email)) {
    showError("emailError", "Please enter a valid email");
    isValid = false;
  }

  if (!phone) {
    showError("phoneError", "Phone number is required");
    isValid = false;
  } else if (!isValidPhone(phone)) {
    showError("phoneError", "Please enter a valid phone number");
    isValid = false;
  }

  if (!address || address.length < 5) {
    showError("addressError", "Please enter your full address");
    isValid = false;
  }

  if (!password || password.length < 8) {
    showError("passwordError", "Password must be at least 8 characters");
    isValid = false;
  } else if (
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password)
  ) {
    showError(
      "passwordError",
      "Password must contain uppercase, lowercase and number",
    );
    isValid = false;
  }

  if (password !== confirmPassword) {
    showError("confirmPasswordError", "Passwords do not match");
    isValid = false;
  }

  if (!terms) {
    toast.error("You must agree to the terms and conditions");
    isValid = false;
  }

  if (!isValid) return;

  // Disable button
  const submitBtn = registerForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Creating account...";

  try {
    const result = await apiCall("/auth/register", "POST", {
      username,
      password,
      full_name: fullName,
      email,
      phone,
      address,
    });

    if (result.success) {
      const user = result.data;

      // Save session to localStorage (for navbar/UI state)
      UserSession.setUser(user, user.role);
      if (window.SSMS && window.SSMS.setUserSession) {
        window.SSMS.setUserSession(user, user.role);
      }

      toast.success("Account created successfully! Redirecting...", "Success");

      // Redirect to customer dashboard
      window.location.replace("/customer/dashboard.html");
      return;
    } else {
      // Show error from server
      const errorMsg =
        result.error?.message || "Registration failed. Please try again.";
      toast.error(errorMsg);

      // Try to show field-specific error
      if (errorMsg.toLowerCase().includes("username")) {
        showError("usernameError", errorMsg);
      } else if (errorMsg.toLowerCase().includes("email")) {
        showError("emailError", errorMsg);
      } else {
        showError("fullNameError", errorMsg);
      }
    }
  } catch (err) {
    console.error("Registration error:", err);
    toast.error("Network error. Is the backend server running?");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

// ========== HELPER FUNCTIONS ==========
function showError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.textContent = message;
    const input = errorElement.previousElementSibling;
    if (input && input.classList.contains("form-input")) {
      input.classList.add("error");
    }
  }
}

function clearErrors() {
  document.querySelectorAll(".form-error").forEach((el) => {
    el.textContent = "";
  });
  document.querySelectorAll(".form-input.error").forEach((el) => {
    el.classList.remove("error");
  });
}

// Real-time validation
document.querySelectorAll(".form-input").forEach((input) => {
  input.addEventListener("blur", function () {
    const errorId = this.id + "Error";
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
      errorElement.textContent = "";
      this.classList.remove("error");
    }
  });
});
