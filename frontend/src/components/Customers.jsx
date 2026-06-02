import { useState, useEffect } from "react";
import * as api from "../api";

export default function Customers() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });

  const load = async () => {
    try {
      const data = await api.getCustomers(search);
      setItems(data);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => { load(); }, []);

  const clearAlerts = () => { setError(""); setSuccess(""); };

  const resetForm = () => {
    setForm({ name: "", email: "", phone: "", address: "" });
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearAlerts();
    const body = {
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      address: form.address || null,
    };
    try {
      if (editId) {
        await api.updateCustomer(editId, body);
        setSuccess("Customer updated!");
      } else {
        await api.createCustomer(body);
        setSuccess("Customer created!");
      }
      resetForm();
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const startEdit = (c) => {
    setForm({ name: c.name, email: c.email, phone: c.phone || "", address: c.address || "" });
    setEditId(c.id);
    setShowForm(true);
    clearAlerts();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this customer?")) return;
    clearAlerts();
    try {
      await api.deleteCustomer(id);
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
        <input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn btn-outline" onClick={load}>Search</button>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); clearAlerts(); }}>
          {showForm ? "Cancel" : "+ Add Customer"}
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
              <label>Email</label>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
          <button className="btn btn-green" type="submit">{editId ? "Update" : "Create"}</button>
        </form>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={5} className="empty">No customers found</td></tr>}
            {items.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.name}</td>
                <td>{c.email}</td>
                <td>{c.phone || "—"}</td>
                <td>
                  <button className="btn btn-sm btn-outline" onClick={() => startEdit(c)}>Edit</button>{" "}
                  <button className="btn btn-sm btn-red" onClick={() => handleDelete(c.id)}>Del</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
