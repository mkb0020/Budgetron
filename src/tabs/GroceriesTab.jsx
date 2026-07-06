import React from "react";
import { useBudget } from "../state/BudgetContext.jsx";
import { calculateGroceryStats } from "../engine/calcEngine.js";

function newId() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

function currency(n) {
  return (n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function GroceriesTab() {
  const { budget, updateBudget } = useBudget();
  const groceries = budget.groceries;

  function updateItem(id, key, value) {
    updateBudget("groceries", (prev) =>
      prev.map((item) => (item.id === id ? { ...item, [key]: value } : item))
    );
  }

  function addItem() {
    updateBudget("groceries", (prev) => [
      ...prev,
      { id: newId(), date: todayISO(), amount: 0 },
    ]);
  }

  function removeItem(id) {
    updateBudget("groceries", (prev) => prev.filter((item) => item.id !== id));
  }

  const stats = calculateGroceryStats(groceries);

  // Most recent trips first, for easier logging as you go.
  const sorted = [...groceries].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="pk-panel scroll-content">
      <div className="section-title pk-glow">Grocery Trips</div>
      <p className="pk-text-dim" style={{ fontSize: "0.8rem", marginTop: -6 }}>
        Log the total from each trip — amount varies, cadence doesn't have to.
      </p>

      <table className="entry-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Amount</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((item) => (
            <tr key={item.id}>
              <td>
                <input
                  type="date"
                  value={item.date}
                  onChange={(e) => updateItem(item.id, "date", e.target.value)}
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
                <button className="remove-btn" onClick={() => removeItem(item.id)} aria-label="Remove">
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        className="holo-btn holo-btn--sm"
        onClick={addItem}
        style={{ marginTop: 12, alignSelf: "flex-start" }}
      >
        + Log Grocery Trip
      </button>

      <hr className="pk-divider" />

      <div className="summary-grid">
        <div className="summary-card">
          <span className="label">Trips Logged</span>
          <span className="value">{stats.tripCount}</span>
        </div>
        <div className="summary-card">
          <span className="label">Average Per Trip</span>
          <span className="value">{currency(stats.averagePerTrip)}</span>
        </div>
        <div className="summary-card">
          <span className="label">Monthly Avg (Calendar)</span>
          <span className="value">{currency(stats.averageMonthlyByCalendar)}</span>
        </div>
        <div className="summary-card">
          <span className="label">Monthly Avg (Weekly Cadence)</span>
          <span className="value">{currency(stats.averageMonthlyByCadence)}</span>
        </div>
      </div>
      <p className="pk-text-dim" style={{ fontSize: "0.75rem", marginTop: 10 }}>
        The Dashboard uses the calendar-based average — it settles in once you've
        logged a few weeks. The weekly-cadence figure is just a quick estimate
        for early on, before there's much history to average over.
      </p>
    </div>
  );
}
