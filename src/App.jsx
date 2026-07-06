import React, { useState } from "react";
import { BudgetProvider } from "./state/BudgetContext.jsx";
import IncomeTab from "./tabs/IncomeTab.jsx";
import ExpensesTab from "./tabs/ExpensesTab.jsx";
import GroceriesTab from "./tabs/GroceriesTab.jsx";
import BusinessTab from "./tabs/BusinessTab.jsx";
import RevenueTab from "./tabs/RevenueTab.jsx";
import DashboardTab from "./tabs/DashboardTab.jsx";

const TABS = [
  { id: "dashboard", label: "Dashboard", Component: DashboardTab },
  { id: "income", label: "Income", Component: IncomeTab },
  { id: "expenses", label: "Living Expenses", Component: ExpensesTab },
  { id: "groceries", label: "Groceries", Component: GroceriesTab },
  { id: "business", label: "Business", Component: BusinessTab },
  { id: "revenue", label: "Revenue", Component: RevenueTab },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <BudgetProvider>
      <div className="tab-bar" role="tablist" aria-label="Budgetron sections">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn${activeTab === tab.id ? " active" : ""}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {TABS.map(({ id, Component }) => (
        <div
          key={id}
          className={`tab-panel${activeTab === id ? " active" : ""}`}
          role="tabpanel"
          hidden={activeTab !== id}
        >
          <Component />
        </div>
      ))}
    </BudgetProvider>
  );
}
