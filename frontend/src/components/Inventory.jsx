import { useState, useEffect } from "react";
import * as api from "../api";

export default function Inventory() {
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAdjust, setShowAdjust] = useState(false);
  const [form, setForm] = useState({ product_id: "", quantity_change: "", notes: "" });

  const load = async () => {
    try {
      const [s, l, p] = await Promise.all([
        api.getInventorySummary(),
        api.getInventoryLogs(),
        api.getProducts(),
      ]);
      setSummary(s);
      setLogs(l);
      setProducts(p);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => { load(); }, []);

  const clearAlerts = () => { setError(""); setSuccess(""); };

  const handleAdjust = async (e) => {
    e.preventDefault();
    clearAlerts();
    try {
      await api.adjustInventory({
        product_id: parseInt(form.product_id),
        quantity_change: parseInt(form.quantity_change),
        notes: form.notes || null,
      });
      setSuccess("Inventory adjusted!");
      setShowAdjust(false);
      setForm({ product_id: "", quantity_change: "", notes: "" });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="panel">
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Summary Cards */}
      {summary && (
        <div className="summary-grid">
          <div className="summary-card">
            <div className="value">{summary.total_products}</div>
            <div className="label">Total Products</div>
          </div>
          <div className="summary-card">
            <div className="value">{summary.total_stock_units}</div>
            <div className="label">Total Stock</div>
          </div>
          <div className="summary-card">
            <div className="value">₹{summary.total_inventory_value.toLocaleString()}</div>
            <div className="label">Inventory Value</div>
          </div>
          <div className="summary-card">
            <div className="value" style={{ color: summary.out_of_stock_count > 0 ? "var(--red)" : undefined, WebkitTextFillColor: summary.out_of_stock_count > 0 ? "var(--red)" : undefined }}>
              {summary.out_of_stock_count}
            </div>
            <div className="label">Out of Stock</div>
          </div>
          <div className="summary-card">
            <div className="value" style={{ color: summary.low_stock_count > 0 ? "var(--orange)" : undefined, WebkitTextFillColor: summary.low_stock_count > 0 ? "var(--orange)" : undefined }}>
              {summary.low_stock_count}
            </div>
            <div className="label">Low Stock (≤10)</div>
          </div>
        </div>
      )}

      <div className="toolbar">
        <button className="btn btn-primary" onClick={() => { setShowAdjust(!showAdjust); clearAlerts(); }}>
          {showAdjust ? "Cancel" : "📦 Adjust Stock"}
        </button>
        <button className="btn btn-outline" onClick={load}>Refresh</button>
      </div>

      {showAdjust && (
        <form onSubmit={handleAdjust} style={{ marginBottom: 16 }}>
          <div className="form-grid">
            <div className="form-group">
              <label>Product</label>
              <select required value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}>
                <option value="">Select...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Change (+/-)</label>
              <input required type="number" placeholder="+10 or -5" value={form.quantity_change} onChange={(e) => setForm({ ...form, quantity_change: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <input value={form.notes} placeholder="Reason..." onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <button className="btn btn-green" type="submit">Apply Adjustment</button>
        </form>
      )}

      {/* Logs Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>ID</th><th>Product</th><th>Type</th><th>Change</th><th>Before</th><th>After</th><th>Notes</th><th>Date</th></tr>
          </thead>
          <tbody>
            {logs.length === 0 && <tr><td colSpan={8} className="empty">No inventory logs</td></tr>}
            {logs.map((l) => (
              <tr key={l.id}>
                <td>{l.id}</td>
                <td>{l.product_name || `#${l.product_id}`}</td>
                <td><code>{l.change_type}</code></td>
                <td style={{ color: l.quantity_change > 0 ? "var(--green)" : "var(--red)" }}>
                  {l.quantity_change > 0 ? `+${l.quantity_change}` : l.quantity_change}
                </td>
                <td>{l.previous_stock}</td>
                <td>{l.new_stock}</td>
                <td>{l.notes || "—"}</td>
                <td>{new Date(l.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
