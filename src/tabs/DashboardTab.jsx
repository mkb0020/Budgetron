import React from "react";
import { useBudget } from "../state/BudgetContext.jsx";
import { calculateAllocation } from "../engine/calcEngine.js";

function currency(n) {
  return (n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function DashboardTab() {
  const { budget } = useBudget();
  const result = calculateAllocation(budget);
  const isNegative = result.discretionaryMonthly < 0;

  return (
    <>
      <div className="pk-panel">
        <div className="section-title pk-glow">This Month, At a Glance</div>
        <div className="summary-grid">
          <div className="summary-card">
            <span className="label">Net Income (Job)</span>
            <span className="value">{currency(result.netIncome.netMonthly)}</span>
          </div>
          <div className="summary-card">
            <span className="label">Revenue (Side Hustle)</span>
            <span className="value">{currency(result.revenueMonthly)}</span>
          </div>
          <div className="summary-card">
            <span className="label">Living Expenses</span>
            <span className="value">{currency(result.livingExpensesMonthly)}</span>
          </div>
          <div className="summary-card">
            <span className="label">Groceries (Monthly Avg)</span>
            <span className="value">{currency(result.groceriesMonthly)}</span>
          </div>
          <div className="summary-card">
            <span className="label">Business Overhead</span>
            <span className="value">{currency(result.businessExpensesMonthly)}</span>
          </div>
        </div>
      </div>

      <div className="pk-panel">
        <div className="section-title pk-glow">What Can I Actually Spend, Save, or Invest?</div>
        <div className="summary-grid">
          <div className="summary-card">
            <span className="label">Total Monthly Income</span>
            <span className="value">{currency(result.totalMonthlyIncome)}</span>
          </div>
          <div className="summary-card">
            <span className="label">Total Committed</span>
            <span className="value">{currency(result.totalCommitted)}</span>
          </div>
          <div className="summary-card">
            <span className="label">Free to Allocate</span>
            <span className={`value${isNegative ? " negative" : ""}`}>
              {currency(result.discretionaryMonthly)}
            </span>
          </div>
        </div>
        {isNegative && (
          <p className="pk-text-dim" style={{ marginTop: 10, fontSize: "0.8rem" }}>
            Committed spending exceeds income this month — something in Living
            Expenses or Business Overhead needs a second look.
          </p>
        )}
      </div>

      <div className="pk-panel scroll-content">
        <div className="section-title pk-glow">Business Savings Goals</div>
        {budget.business.savingsGoals.length === 0 && (
          <p className="pk-text-dim" style={{ fontSize: "0.8rem" }}>
            No goals yet — add some on the Business tab.
          </p>
        )}
        {budget.business.savingsGoals.map((goal) => {
          const pct = goal.targetAmount
            ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
            : 0;
          return (
            <div key={goal.id} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: 4 }}>
                <span>{goal.name || "Untitled goal"}</span>
                <span>{pct.toFixed(0)}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
