/*
 * SSMS - Backend API Client
 * Shared helper for all pages that talk to the PHP backend.
 * Import: import { apiCall, API_BASE } from "../api.js";
 */

export const API_BASE = "http://localhost/ssms-backend/public/api";

/**
 * Call the backend API.
 * @param {string}  endpoint  e.g. "/cart" or "/auth/login"
 * @param {string}  method    HTTP verb (GET, POST, PUT, DELETE)
 * @param {object|null} body  JSON body (omit for GET/DELETE)
 * @returns {Promise<object>} Parsed JSON response
 */
export async function apiCall(endpoint, method = "GET", body = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "include", // send session cookie
  };

  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  const url = API_BASE + endpoint;

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: data?.error?.code || `HTTP_${response.status}`,
          message: data?.error?.message || data?.message || response.statusText,
        },
      };
    }

    return data;
  } catch (err) {
    console.error(`API ${method} ${url} failed:`, err);
    return {
      success: false,
      error: { code: "NETWORK_ERROR", message: "Could not reach the server" },
    };
  }
}
