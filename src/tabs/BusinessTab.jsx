import React from "react";
import { useBudget } from "../state/BudgetContext.jsx";
import { sumMonthly } from "../engine/calcEngine.js";

function newId() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

function currency(n) {
  return (n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function BusinessTab() {
  const { budget, updateBudget } = useBudget();
  const business = budget.business;

  function updateList(listKey, updater) {
    updateBudget("business", (prev) => ({
      ...prev,
      [listKey]: updater(prev[listKey]),
    }));
  }

  function addRecurring() {
    updateList("recurringExpenses", (list) => [
      ...list,
      { id: newId(), name: "", amount: 0, frequency: "monthly" },
    ]);
  }

  function addOneTime() {
    updateList("oneTimePurchases", (list) => [
      ...list,
      { id: newId(), name: "", amount: 0, targetDate: "" },
    ]);
  }

  function addGoal() {
    updateList("savingsGoals", (list) => [
      ...list,
      { id: newId(), name: "", targetAmount: 0, currentAmount: 0, targetDate: "" },
    ]);
  }

  return (
    <div className="scroll-content" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="pk-panel">
        <div className="section-title pk-glow">Recurring Business Expenses</div>
        <table className="entry-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Amount</th>
              <th>Frequency</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {business.recurringExpenses.map((item) => (
              <tr key={item.id}>
                <td>
                  <input
                    type="text"
                    value={item.name}
                    placeholder="Hosting, software, etc."
                    onChange={(e) =>
                      updateList("recurringExpenses", (list) =>
                        list.map((i) => (i.id === item.id ? { ...i, name: e.target.value } : i))
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={item.amount}
                    onChange={(e) =>
                      updateList("recurringExpenses", (list) =>
                        list.map((i) =>
                          i.id === item.id ? { ...i, amount: Number(e.target.value) } : i
                        )
                      )
                    }
                  />
                </td>
                <td>
                  <select
                    value={item.frequency}
                    onChange={(e) =>
                      updateList("recurringExpenses", (list) =>
                        list.map((i) =>
                          i.id === item.id ? { ...i, frequency: e.target.value } : i
                        )
                      )
                    }
                    style={{ background: "transparent", color: "inherit", border: "1px solid rgba(0,255,255,0.15)", borderRadius: 4, padding: "6px 8px" }}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </td>
                <td>
                  <button
                    className="remove-btn"
                    onClick={() =>
                      updateList("recurringExpenses", (list) => list.filter((i) => i.id !== item.id))
                    }
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="holo-btn holo-btn--sm" onClick={addRecurring} style={{ marginTop: 12 }}>
          + Add Recurring Expense
        </button>
        <hr className="pk-divider" />
        <div className="summary-card">
          <span className="label">Total Monthly Business Overhead</span>
          <span className="value">{currency(sumMonthly(business.recurringExpenses))}</span>
        </div>
      </div>

      <div className="pk-panel">
        <div className="section-title pk-glow">One-Time Purchases</div>
        <table className="entry-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Amount</th>
              <th>Target Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {business.oneTimePurchases.map((item) => (
              <tr key={item.id}>
                <td>
                  <input
                    type="text"
                    value={item.name}
                    placeholder="New PC, equipment..."
                    onChange={(e) =>
                      updateList("oneTimePurchases", (list) =>
                        list.map((i) => (i.id === item.id ? { ...i, name: e.target.value } : i))
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={item.amount}
                    onChange={(e) =>
                      updateList("oneTimePurchases", (list) =>
                        list.map((i) =>
                          i.id === item.id ? { ...i, amount: Number(e.target.value) } : i
                        )
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    type="date"
                    value={item.targetDate}
                    onChange={(e) =>
                      updateList("oneTimePurchases", (list) =>
                        list.map((i) =>
                          i.id === item.id ? { ...i, targetDate: e.target.value } : i
                        )
                      )
                    }
                  />
                </td>
                <td>
                  <button
                    className="remove-btn"
                    onClick={() =>
                      updateList("oneTimePurchases", (list) => list.filter((i) => i.id !== item.id))
                    }
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="holo-btn holo-btn--sm" onClick={addOneTime} style={{ marginTop: 12 }}>
          + Add One-Time Purchase
        </button>
      </div>

      <div className="pk-panel">
        <div className="section-title pk-glow">Business Savings Goals</div>
        {business.savingsGoals.map((goal) => {
          const pct = goal.targetAmount
            ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
            : 0;
          return (
            <div key={goal.id} className="field-grid" style={{ marginBottom: 14 }}>
              <div className="field-group">
                <label>Goal Name</label>
                <input
                  type="text"
                  value={goal.name}
                  onChange={(e) =>
                    updateList("savingsGoals", (list) =>
                      list.map((g) => (g.id === goal.id ? { ...g, name: e.target.value } : g))
                    )
                  }
                />
              </div>
              <div className="field-group">
                <label>Current Amount</label>
                <input
                  type="number"
                  value={goal.currentAmount}
                  onChange={(e) =>
                    updateList("savingsGoals", (list) =>
                      list.map((g) =>
                        g.id === goal.id ? { ...g, currentAmount: Number(e.target.value) } : g
                      )
                    )
                  }
                />
              </div>
              <div className="field-group">
                <label>Target Amount</label>
                <input
                  type="number"
                  value={goal.targetAmount}
                  onChange={(e) =>
                    updateList("savingsGoals", (list) =>
                      list.map((g) =>
                        g.id === goal.id ? { ...g, targetAmount: Number(e.target.value) } : g
                      )
                    )
                  }
                />
              </div>
              <div className="field-group">
                <label>&nbsp;</label>
                <button
                  className="remove-btn"
                  onClick={() =>
                    updateList("savingsGoals", (list) => list.filter((g) => g.id !== goal.id))
                  }
                >
                  Remove Goal ✕
                </button>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="pk-text-dim" style={{ fontSize: "0.75rem" }}>
                  {currency(goal.currentAmount)} / {currency(goal.targetAmount)} ({pct.toFixed(0)}%)
                </span>
              </div>
            </div>
          );
        })}
        <button className="holo-btn holo-btn--sm" onClick={addGoal}>
          + Add Savings Goal
        </button>
      </div>
    </div>
  );
}
