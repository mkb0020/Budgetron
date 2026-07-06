import React from "react";
import { useBudget } from "../state/BudgetContext.jsx";
import { calculateNetIncome } from "../engine/calcEngine.js";

function currency(n) {
  return (n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function IncomeTab() {
  const { budget, updateBudget } = useBudget();
  const income = budget.income;

  function set(path, value) {
    updateBudget("income", (prev) => {
      const next = structuredClone(prev);
      const keys = path.split(".");
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  }

  const net = calculateNetIncome(income);

  return (
    <>
      <div className="pk-panel">
        <div className="section-title pk-glow">Salary & Filing</div>
        <div className="field-grid">
          <div className="field-group">
            <label>Gross Annual Salary</label>
            <input
              type="number"
              value={income.grossAnnual}
              onChange={(e) => set("grossAnnual", Number(e.target.value))}
            />
          </div>
          <div className="field-group">
            <label>Pay Frequency</label>
            <select
              value={income.payFrequency}
              onChange={(e) => set("payFrequency", e.target.value)}
            >
              <option value="weekly">Weekly</option>
              <option value="biweekly">Biweekly</option>
              <option value="semimonthly">Semimonthly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="field-group">
            <label>Filing Status</label>
            <select
              value={income.filingStatus}
              onChange={(e) => set("filingStatus", e.target.value)}
            >
              <option value="single">Single</option>
              <option value="marriedJoint">Married Filing Jointly</option>
            </select>
          </div>
        </div>
      </div>

      <div className="pk-panel">
        <div className="section-title pk-glow">Pre-Tax Deductions</div>
        <div className="field-grid">
          <div className="field-group">
            <label>Retirement Contribution (% of gross)</label>
            <input
              type="number"
              value={income.preTax.retirementPct}
              onChange={(e) => set("preTax.retirementPct", Number(e.target.value))}
            />
          </div>
          <div className="field-group">
            <label>HSA Contribution (annual $)</label>
            <input
              type="number"
              value={income.preTax.hsaAnnual}
              onChange={(e) => set("preTax.hsaAnnual", Number(e.target.value))}
            />
          </div>
          <div className="field-group">
            <label>Other Pre-Tax (annual $)</label>
            <input
              type="number"
              value={income.preTax.otherPreTaxAnnual}
              onChange={(e) => set("preTax.otherPreTaxAnnual", Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="pk-panel">
        <div className="section-title pk-glow">Post-Tax Benefits</div>
        <div className="field-grid">
          <div className="field-group">
            <label>Health Insurance (monthly $)</label>
            <input
              type="number"
              value={income.postTaxBenefits.healthInsuranceMonthly}
              onChange={(e) =>
                set("postTaxBenefits.healthInsuranceMonthly", Number(e.target.value))
              }
            />
          </div>
          <div className="field-group">
            <label>Other Benefits (monthly $)</label>
            <input
              type="number"
              value={income.postTaxBenefits.otherMonthly}
              onChange={(e) => set("postTaxBenefits.otherMonthly", Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="pk-panel">
        <div className="section-title pk-glow">Net Pay Summary</div>
        <div className="summary-grid">
          <div className="summary-card">
            <span className="label">Federal Tax (est.)</span>
            <span className="value">{currency(net.federalTax)}</span>
          </div>
          <div className="summary-card">
            <span className="label">FICA</span>
            <span className="value">{currency(net.fica.total)}</span>
          </div>
          <div className="summary-card">
            <span className="label">Net Monthly</span>
            <span className="value">{currency(net.netMonthly)}</span>
          </div>
          <div className="summary-card">
            <span className="label">Net Per Paycheck</span>
            <span className="value">{currency(net.netPerPaycheck)}</span>
          </div>
        </div>
      </div>
    </>
  );
}
