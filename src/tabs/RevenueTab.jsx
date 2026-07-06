import React from "react";
import { useBudget } from "../state/BudgetContext.jsx";

function newId() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

function currency(n) {
  return (n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function RevenueTab() {
  const { budget, updateBudget } = useBudget();
  const revenue = budget.revenue;

  function updateItem(id, key, value) {
    updateBudget("revenue", (prev) =>
      prev.map((item) => (item.id === id ? { ...item, [key]: value } : item))
    );
  }

  function addItem() {
    updateBudget("revenue", (prev) => [
      ...prev,
      { id: newId(), source: "", platform: "itch.io", amount: 0, date: "" },
    ]);
  }

  function removeItem(id) {
    updateBudget("revenue", (prev) => prev.filter((item) => item.id !== id));
  }

  const total = revenue.reduce((sum, r) => sum + (r.amount ?? 0), 0);

  return (
    <div className="pk-panel scroll-content">
      <div className="section-title pk-glow">Side-Hustle Revenue</div>

      <table className="entry-table">
        <thead>
          <tr>
            <th>Source</th>
            <th>Platform</th>
            <th>Amount</th>
            <th>Date</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {revenue.map((item) => (
            <tr key={item.id}>
              <td>
                <input
                  type="text"
                  value={item.source}
                  placeholder="Which project/product"
                  onChange={(e) => updateItem(item.id, "source", e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={item.platform}
                  placeholder="itch.io, Etsy..."
                  onChange={(e) => updateItem(item.id, "platform", e.target.value)}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={item.amount}
                  onChange={(e) => updateItem(item.id, "amount", Number(e.target.value))}
                />
              </td>
              <td>
                <input
                  type="date"
                  value={item.date}
                  onChange={(e) => updateItem(item.id, "date", e.target.value)}
                />
              </td>
              <td>
                <button className="remove-btn" onClick={() => removeItem(item.id)}>
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="holo-btn holo-btn--sm" onClick={addItem} style={{ marginTop: 12, alignSelf: "flex-start" }}>
        + Log Revenue
      </button>

      <hr className="pk-divider" />

      <div className="summary-grid">
        <div className="summary-card">
          <span className="label">Total Logged Revenue</span>
          <span className="value">{currency(total)}</span>
        </div>
      </div>
    </div>
  );
}
