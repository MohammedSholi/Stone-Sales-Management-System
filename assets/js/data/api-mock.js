/*
 * SSMS - API Mock
 * Simulate backend API calls with local JSON data
 * Later these can be replaced with actual PHP endpoints
 */

// Base URL for data files
const DATA_BASE_PATH = "/assets/data/";

// Simulate network delay
const SIMULATED_DELAY = 500; // ms

// Helper to simulate API delay
function simulateDelay(data) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), SIMULATED_DELAY);
  });
}

// Generic fetch JSON data
async function fetchData(filename) {
  try {
    const response = await fetch(DATA_BASE_PATH + filename);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${filename}`);
    }
    const data = await response.json();
    return simulateDelay(data);
  } catch (error) {
    console.error("API Mock Error:", error);
    return simulateDelay([]);
  }
}

// ========== STONES API ==========
export const StonesAPI = {
  async getAll() {
    return fetchData("stones.json");
  },

  async getById(id) {
    const stones = await this.getAll();
    return stones.find((stone) => stone.id === id) || null;
  },

  async search(query) {
    const stones = await this.getAll();
    const lowerQuery = query.toLowerCase();
    return stones.filter(
      (stone) =>
        stone.name.toLowerCase().includes(lowerQuery) ||
        stone.description.toLowerCase().includes(lowerQuery) ||
        stone.type.toLowerCase().includes(lowerQuery),
    );
  },

  async filterByType(type) {
    const stones = await this.getAll();
    return stones.filter((stone) => stone.type === type);
  },

  async filterByPrice(minPrice, maxPrice) {
    const stones = await this.getAll();
    return stones.filter(
      (stone) => stone.price >= minPrice && stone.price <= maxPrice,
    );
  },
};

// ========== ORDERS API ==========
export const OrdersAPI = {
  async getAll() {
    return fetchData("orders.json");
  },

  async getById(id) {
    const orders = await this.getAll();
    return orders.find((order) => order.id === id) || null;
  },

  async getByStatus(status) {
    const orders = await this.getAll();
    return orders.filter((order) => order.status === status);
  },

  async getByCustomer(customerId) {
    const orders = await this.getAll();
    return orders.filter((order) => order.customerId === customerId);
  },
};

// ========== REQUESTS API ==========
export const RequestsAPI = {
  async getAll() {
    return fetchData("requests.json");
  },

  async getById(id) {
    const requests = await this.getAll();
    return requests.find((request) => request.id === id) || null;
  },

  async getByStatus(status) {
    const requests = await this.getAll();
    return requests.filter((request) => request.status === status);
  },
};

// ========== REVIEWS API ==========
export const ReviewsAPI = {
  async getAll() {
    return fetchData("reviews.json");
  },

  async getByStoneId(stoneId) {
    const reviews = await this.getAll();
    return reviews.filter((review) => review.stoneId === stoneId);
  },
};

// ========== EMPLOYEES API ==========
export const EmployeesAPI = {
  async getAll() {
    return fetchData("employees.json");
  },

  async getById(id) {
    const employees = await this.getAll();
    return employees.find((emp) => emp.id === id) || null;
  },
};

// Export all APIs
export default {
  Stones: StonesAPI,
  Orders: OrdersAPI,
  Requests: RequestsAPI,
  Reviews: ReviewsAPI,
  Employees: EmployeesAPI,
};
