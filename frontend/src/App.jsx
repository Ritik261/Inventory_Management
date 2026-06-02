import { useState } from "react";
import Products from "./components/Products";
import Customers from "./components/Customers";
import Orders from "./components/Orders";
import Inventory from "./components/Inventory";

const TABS = [
  { key: "products", label: "Products" },
  { key: "customers", label: "Customers" },
  { key: "orders", label: "Orders" },
  { key: "inventory", label: "Inventory" },
];

export default function App() {
  const [tab, setTab] = useState("products");

  return (
    <>
      <header className="app-header">
        <h1>Inventory & Order Management</h1>
        <p>API Testing Dashboard</p>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab-btn ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "products" && <Products />}
      {tab === "customers" && <Customers />}
      {tab === "orders" && <Orders />}
      {tab === "inventory" && <Inventory />}
    </>
  );
}
