const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    const msg =
      typeof data.detail === "string"
        ? data.detail
        : JSON.stringify(data.detail);
    throw new Error(msg);
  }
  return data;
}

// ─── Products ────────────────────────────────────────────
export const getProducts = (search = "") =>
  request(`/products/?search=${search}`);

export const getProduct = (id) => request(`/products/${id}`);

export const createProduct = (body) =>
  request("/products/", { method: "POST", body: JSON.stringify(body) });

export const updateProduct = (id, body) =>
  request(`/products/${id}`, { method: "PUT", body: JSON.stringify(body) });

export const deleteProduct = (id) =>
  request(`/products/${id}`, { method: "DELETE" });

// ─── Customers ───────────────────────────────────────────
export const getCustomers = (search = "") =>
  request(`/customers/?search=${search}`);

export const getCustomer = (id) => request(`/customers/${id}`);

export const createCustomer = (body) =>
  request("/customers/", { method: "POST", body: JSON.stringify(body) });

export const updateCustomer = (id, body) =>
  request(`/customers/${id}`, { method: "PUT", body: JSON.stringify(body) });

export const deleteCustomer = (id) =>
  request(`/customers/${id}`, { method: "DELETE" });

// ─── Orders ──────────────────────────────────────────────
export const getOrders = () => request("/orders/");

export const getOrder = (id) => request(`/orders/${id}`);

export const createOrder = (body) =>
  request("/orders/", { method: "POST", body: JSON.stringify(body) });

export const updateOrderStatus = (id, status) =>
  request(`/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

export const deleteOrder = (id) =>
  request(`/orders/${id}`, { method: "DELETE" });

// ─── Inventory ───────────────────────────────────────────
export const getInventoryLogs = (productId = "") =>
  request(`/inventory/logs${productId ? `/${productId}` : ""}`);

export const adjustInventory = (body) =>
  request("/inventory/adjust", { method: "POST", body: JSON.stringify(body) });

export const getInventorySummary = () => request("/inventory/summary");
