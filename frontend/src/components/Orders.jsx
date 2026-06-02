import { useState, useEffect } from "react";
import * as api from "../api";

const STATUS_OPTIONS = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [detail, setDetail] = useState(null);

  const [form, setForm] = useState({ customer_id: "" });
  const [orderItems, setOrderItems] = useState([{ product_id: "", quantity: "1" }]);

  const load = async () => {
    try {
      const [o, p, c] = await Promise.all([
        api.getOrders(),
        api.getProducts(),
        api.getCustomers(),
      ]);
      setOrders(o);
      setProducts(p);
      setCustomers(c);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => { load(); }, []);

  const clearAlerts = () => { setError(""); setSuccess(""); };

  const addItem = () => setOrderItems([...orderItems, { product_id: "", quantity: "1" }]);
  const removeItem = (i) => setOrderItems(orderItems.filter((_, idx) => idx !== i));
  const updateItem = (i, field, val) => {
    const copy = [...orderItems];
    copy[i][field] = val;
    setOrderItems(copy);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    clearAlerts();
    const body = {
      customer_id: parseInt(form.customer_id),
      items: orderItems.map((it) => ({
        product_id: parseInt(it.product_id),
        quantity: parseInt(it.quantity),
      })),
    };
    try {
      await api.createOrder(body);
      setSuccess("Order created!");
      setShowForm(false);
      setOrderItems([{ product_id: "", quantity: "1" }]);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleStatusChange = async (id, status) => {
    clearAlerts();
    try {
      await api.updateOrderStatus(id, status);
      setSuccess(`Order #${id} → ${status}`);
      load();
      if (detail && detail.id === id) viewDetail(id);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this order?")) return;
    clearAlerts();
    try {
      await api.deleteOrder(id);
      setSuccess("Order deleted, stock restored!");
      setDetail(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const viewDetail = async (id) => {
    clearAlerts();
    try {
      const data = await api.getOrder(id);
      setDetail(data);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="panel">
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="toolbar">
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); clearAlerts(); }}>
          {showForm ? "Cancel" : "+ New Order"}
        </button>
        <button className="btn btn-outline" onClick={load}>Refresh</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{ marginBottom: 16 }}>
          <div className="form-grid">
            <div className="form-group">
              <label>Customer</label>
              <select required value={form.customer_id} onChange={(e) => setForm({ customer_id: e.target.value })}>
                <option value="">Select...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                ))}
              </select>
            </div>
          </div>

          <label style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
            Order Items
          </label>
          <div className="order-items-builder">
            {orderItems.map((it, i) => (
              <div key={i} className="order-item-row">
                <div className="form-group">
                  <label>Product</label>
                  <select required value={it.product_id} onChange={(e) => updateItem(i, "product_id", e.target.value)}>
                    <option value="">Select...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ maxWidth: 100 }}>
                  <label>Qty</label>
                  <input type="number" min="1" required value={it.quantity} onChange={(e) => updateItem(i, "quantity", e.target.value)} />
                </div>
                {orderItems.length > 1 && (
                  <button type="button" className="btn btn-sm btn-red" onClick={() => removeItem(i)}>✕</button>
                )}
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-sm btn-outline" onClick={addItem} style={{ marginBottom: 12 }}>+ Add Item</button>
          <br />
          <button className="btn btn-green" type="submit">Place Order</button>
        </form>
      )}

      {/* Order detail view */}
      {detail && (
        <div style={{ marginBottom: 16, background: "var(--surface2)", borderRadius: "var(--radius)", padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <strong>Order #{detail.id}</strong>
            <button className="btn btn-sm btn-outline" onClick={() => setDetail(null)}>Close</button>
          </div>
          <p>Customer: {detail.customer_name} ({detail.customer_email})</p>
          <p>Status: <span className={`badge badge-${detail.status}`}>{detail.status}</span></p>
          <p>Total: ₹{detail.total_amount}</p>
          {detail.items && detail.items.length > 0 && (
            <table style={{ marginTop: 10 }}>
              <thead><tr><th>Product</th><th>SKU</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
              <tbody>
                {detail.items.map((it) => (
                  <tr key={it.id}>
                    <td>{it.product_name}</td>
                    <td><code>{it.product_sku}</code></td>
                    <td>{it.quantity}</td>
                    <td>₹{it.unit_price}</td>
                    <td>₹{it.total_price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Orders table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>ID</th><th>Customer</th><th>Status</th><th>Total</th><th>Date</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {orders.length === 0 && <tr><td colSpan={6} className="empty">No orders found</td></tr>}
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td>{o.customer_name || `#${o.customer_id}`}</td>
                <td><span className={`badge badge-${o.status}`}>{o.status}</span></td>
                <td>₹{o.total_amount}</td>
                <td>{new Date(o.created_at).toLocaleDateString()}</td>
                <td style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  <button className="btn btn-sm btn-outline" onClick={() => viewDetail(o.id)}>View</button>
                  <select
                    className="btn btn-sm btn-outline"
                    style={{ padding: "4px 8px" }}
                    value={o.status}
                    onChange={(e) => handleStatusChange(o.id, e.target.value)}
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {o.status === "pending" && (
                    <button className="btn btn-sm btn-red" onClick={() => handleDelete(o.id)}>Del</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
