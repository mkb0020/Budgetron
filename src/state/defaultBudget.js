// Default/empty shape of everything Budgetron tracks. Every field here
// should be editable from the UI — nothing in Version 1 should require
// touching this file to reflect a raise, a new expense, or a changed goal.

export const defaultBudget = {
  income: {
    grossAnnual: 0,
    payFrequency: "biweekly", // weekly | biweekly | semimonthly | monthly
    filingStatus: "single", // single | marriedJoint
    preTax: {
      retirementPct: 0, // % of gross into 401k/403b etc.
      hsaAnnual: 0, // $ per year into HSA
      otherPreTaxAnnual: 0, // FSA, other pretax benefits
    },
    postTaxBenefits: {
      healthInsuranceMonthly: 0,
      otherMonthly: 0,
    },
  },

  livingExpenses: [
    // { id, name, amount, frequency: 'monthly' | 'annual', category }
  ],

  groceries: [
    // { id, date, amount } — one entry per grocery trip
  ],

  business: {
    recurringExpenses: [
      // { id, name, amount, frequency: 'monthly' | 'annual' }
    ],
    oneTimePurchases: [
      // { id, name, amount, targetDate }
    ],
    savingsGoals: [
      // { id, name, targetAmount, currentAmount, targetDate }
    ],
  },

  revenue: [
    // { id, source, platform, amount, date }
  ],

  personalSavingsGoals: [
    // { id, name, targetAmount, currentAmount, targetDate }
  ],
};

/**
 * Deep-merges a saved/loaded budget on top of defaultBudget so that adding
 * a new field to the schema later (like the groceries tab) never crashes
 * on old saved data that predates it — missing keys just fall back to
 * their default rather than being `undefined`.
 */
export function mergeWithDefaults(stored) {
  if (!stored || typeof stored !== "object") return structuredClone(defaultBudget);

  return {
    ...defaultBudget,
    ...stored,
    income: {
      ...defaultBudget.income,
      ...(stored.income ?? {}),
      preTax: {
        ...defaultBudget.income.preTax,
        ...(stored.income?.preTax ?? {}),
      },
      postTaxBenefits: {
        ...defaultBudget.income.postTaxBenefits,
        ...(stored.income?.postTaxBenefits ?? {}),
      },
    },
    business: {
      ...defaultBudget.business,
      ...(stored.business ?? {}),
    },
    livingExpenses: stored.livingExpenses ?? defaultBudget.livingExpenses,
    groceries: stored.groceries ?? defaultBudget.groceries,
    revenue: stored.revenue ?? defaultBudget.revenue,
    personalSavingsGoals: stored.personalSavingsGoals ?? defaultBudget.personalSavingsGoals,
  };
}
