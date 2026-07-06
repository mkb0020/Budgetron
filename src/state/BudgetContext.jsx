import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { defaultBudget, mergeWithDefaults } from "./defaultBudget.js";
import { loadValue, saveValue } from "./persistStore.js";

const BUDGET_KEY = "budget";

const BudgetContext = createContext(null);

export function BudgetProvider({ children }) {
  const [budget, setBudget] = useState(defaultBudget);
  const [isLoaded, setIsLoaded] = useState(false);
  const saveTimeout = useRef(null);

  // Load once on mount.
  useEffect(() => {
    (async () => {
      const stored = await loadValue(BUDGET_KEY, defaultBudget);
      setBudget(mergeWithDefaults(stored));
      setIsLoaded(true);
    })();
  }, []);

  // Debounced auto-save whenever budget changes, after initial load.
  useEffect(() => {
    if (!isLoaded) return;
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveValue(BUDGET_KEY, budget);
    }, 400);
    return () => clearTimeout(saveTimeout.current);
  }, [budget, isLoaded]);

  // Convenience updater: updateBudget('income', prev => ({ ...prev, grossAnnual: 90000 }))
  function updateBudget(section, updater) {
    setBudget((prev) => ({
      ...prev,
      [section]: typeof updater === "function" ? updater(prev[section]) : updater,
    }));
  }

  return (
    <BudgetContext.Provider value={{ budget, setBudget, updateBudget, isLoaded }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget must be used within a BudgetProvider");
  return ctx;
}
