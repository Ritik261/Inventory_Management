import { useState, useEffect } from "react";
import * as api from "../api";

export default function Products() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    price: "",
    stock: "",
    description: "",
  });

  const load = async () => {
    try {
      const data = await api.getProducts(search);
      setItems(data);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => { load(); }, []);

  const clearAlerts = () => { setError(""); setSuccess(""); };

  const resetForm = () => {
    setForm({ name: "", sku: "", price: "", stock: "", description: "" });
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearAlerts();
    const body = {
      name: form.name,
      sku: form.sku,
      price: parseFloat(form.price),
      stock: parseInt(form.stock),
      description: form.description || null,
    };
    try {
      if (editId) {
        const { sku, ...updateBody } = body;
        await api.updateProduct(editId, updateBody);
        setSuccess("Product updated!");
      } else {
        await api.createProduct(body);
        setSuccess("Product created!");
      }
      resetForm();
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const startEdit = (p) => {
    setForm({ name: p.name, sku: p.sku, price: String(p.price), stock: String(p.stock), description: p.description || "" });
    setEditId(p.id);
    setShowForm(true);
    clearAlerts();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    clearAlerts();
    try {
      await api.deleteProduct(id);
      setSuccess("Deleted!");
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="panel">
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="toolbar">
        <input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn btn-outline" onClick={load}>Search</button>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); clearAlerts(); }}>
          {showForm ? "Cancel" : "+ Add Product"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
          <div className="form-grid">
            <div className="form-group">
              <label>Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>SKU</label>
              <input required disabled={!!editId} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Price</label>
              <input required type="number" step="0.01" min="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Stock</label>
              <input required type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <button className="btn btn-green" type="submit">{editId ? "Update" : "Create"}</button>
        </form>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>ID</th><th>Name</th><th>SKU</th><th>Price</th><th>Stock</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={6} className="empty">No products found</td></tr>}
            {items.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.name}</td>
                <td><code>{p.sku}</code></td>
                <td>₹{p.price}</td>
                <td>{p.stock}</td>
                <td>
                  <button className="btn btn-sm btn-outline" onClick={() => startEdit(p)}>Edit</button>{" "}
                  <button className="btn btn-sm btn-red" onClick={() => handleDelete(p.id)}>Del</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
