import React from "react";
import { useBudget } from "../state/BudgetContext.jsx";
import { sumMonthly } from "../engine/calcEngine.js";

function newId() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

function currency(n) {
  return (n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function ExpensesTab() {
  const { budget, updateBudget } = useBudget();
  const expenses = budget.livingExpenses;

  function updateItem(id, key, value) {
    updateBudget("livingExpenses", (prev) =>
      prev.map((item) => (item.id === id ? { ...item, [key]: value } : item))
    );
  }

  function addItem() {
    updateBudget("livingExpenses", (prev) => [
      ...prev,
      { id: newId(), name: "", amount: 0, frequency: "monthly", category: "" },
    ]);
  }

  function removeItem(id) {
    updateBudget("livingExpenses", (prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="pk-panel scroll-content">
      <div className="section-title pk-glow">Living Expenses</div>

      <table className="entry-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Frequency</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((item) => (
            <tr key={item.id}>
              <td>
                <input
                  type="text"
                  value={item.name}
                  placeholder="Rent, groceries, etc."
                  onChange={(e) => updateItem(item.id, "name", e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={item.category}
                  placeholder="Housing, food..."
                  onChange={(e) => updateItem(item.id, "category", e.target.value)}
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
                <select
                  value={item.frequency}
                  onChange={(e) => updateItem(item.id, "frequency", e.target.value)}
                  style={{
                    background: "transparent",
                    color: "inherit",
                    border: "1px solid rgba(0,255,255,0.15)",
                    borderRadius: 4,
                    padding: "6px 8px",
                  }}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>
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

      <button className="holo-btn holo-btn--sm" onClick={addItem} style={{ marginTop: 12, alignSelf: "flex-start" }}>
        + Add Expense
      </button>

      <hr className="pk-divider" />

      <div className="summary-grid">
        <div className="summary-card">
          <span className="label">Total Monthly Living Expenses</span>
          <span className="value">{currency(sumMonthly(expenses))}</span>
        </div>
      </div>
    </div>
  );
}
