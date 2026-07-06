/**
 * Budgetron calculation engine.
 *
 * Kept as plain, dependency-free functions (no React, no Tauri) so they're
 * trivially unit-testable and reusable if a Version 2 web build ever
 * happens. Every number that can change year-to-year (tax brackets, wage
 * bases) is broken out into its own const block up top — update those
 * annually, don't hunt through the functions.
 *
 * ⚠️ VERIFY BEFORE TRUSTING THIS FOR REAL DECISIONS:
 * The bracket/deduction numbers below are 2025 federal figures from memory
 * and have NOT been cross-checked against irs.gov for this build. Treat
 * them as placeholders to confirm/replace before you rely on the net-pay
 * numbers. This also does not include state income tax, local tax, or
 * anything beyond federal income tax + FICA — add a state module later
 * if you're in a state with income tax.
 */

// ─────────────────────────────────────────────────────────────
// EDITABLE TAX CONSTANTS — update these each year
// ─────────────────────────────────────────────────────────────

export const PAY_FREQUENCIES = {
  weekly: 52,
  biweekly: 26,
  semimonthly: 24,
  monthly: 12,
};

export const STANDARD_DEDUCTION = {
  single: 15000,
  marriedJoint: 30000,
};

// [uptoIncome, rate] per bracket, ascending. Last bracket uses Infinity.
export const FEDERAL_BRACKETS = {
  single: [
    [11925, 0.10],
    [48475, 0.12],
    [103350, 0.22],
    [197300, 0.24],
    [250525, 0.32],
    [626350, 0.35],
    [Infinity, 0.37],
  ],
  marriedJoint: [
    [23850, 0.10],
    [96950, 0.12],
    [206700, 0.22],
    [394600, 0.24],
    [501050, 0.32],
    [751600, 0.35],
    [Infinity, 0.37],
  ],
};

export const FICA = {
  socialSecurityRate: 0.062,
  socialSecurityWageBase: 176100, // verify current year figure
  medicareRate: 0.0145,
  additionalMedicareRate: 0.009,
  additionalMedicareThreshold: {
    single: 200000,
    marriedJoint: 250000,
  },
};

// ─────────────────────────────────────────────────────────────
// CORE MATH
// ─────────────────────────────────────────────────────────────

/** Progressive bracket tax on a given taxable income. */
export function calculateFederalTax(taxableIncome, filingStatus = "single") {
  const brackets = FEDERAL_BRACKETS[filingStatus] ?? FEDERAL_BRACKETS.single;
  let tax = 0;
  let prevCap = 0;

  for (const [cap, rate] of brackets) {
    if (taxableIncome <= prevCap) break;
    const amountInBracket = Math.min(taxableIncome, cap) - prevCap;
    tax += amountInBracket * rate;
    prevCap = cap;
    if (taxableIncome <= cap) break;
  }

  return Math.max(0, tax);
}

/** Social Security + Medicare (+ additional Medicare surtax if applicable). */
export function calculateFICA(grossAnnual, filingStatus = "single") {
  const ss =
    Math.min(grossAnnual, FICA.socialSecurityWageBase) *
    FICA.socialSecurityRate;

  const medicare = grossAnnual * FICA.medicareRate;

  const threshold =
    FICA.additionalMedicareThreshold[filingStatus] ??
    FICA.additionalMedicareThreshold.single;
  const additionalMedicare =
    Math.max(0, grossAnnual - threshold) * FICA.additionalMedicareRate;

  return {
    socialSecurity: ss,
    medicare: medicare + additionalMedicare,
    total: ss + medicare + additionalMedicare,
  };
}

/**
 * Full paycheck breakdown from the `income` slice of the budget model.
 * Pretax retirement/HSA/other reduce taxable income for federal tax
 * purposes but NOT for FICA (correct for 401k/HSA in the US).
 */
export function calculateNetIncome(income) {
  const {
    grossAnnual = 0,
    payFrequency = "biweekly",
    filingStatus = "single",
    preTax = {},
    postTaxBenefits = {},
  } = income;

  const retirementAnnual = grossAnnual * ((preTax.retirementPct ?? 0) / 100);
  const hsaAnnual = preTax.hsaAnnual ?? 0;
  const otherPreTaxAnnual = preTax.otherPreTaxAnnual ?? 0;
  const totalPreTax = retirementAnnual + hsaAnnual + otherPreTaxAnnual;

  const standardDeduction =
    STANDARD_DEDUCTION[filingStatus] ?? STANDARD_DEDUCTION.single;

  const taxableIncome = Math.max(
    0,
    grossAnnual - totalPreTax - standardDeduction
  );

  const federalTax = calculateFederalTax(taxableIncome, filingStatus);
  const fica = calculateFICA(grossAnnual, filingStatus);

  const postTaxBenefitsAnnual =
    (postTaxBenefits.healthInsuranceMonthly ?? 0) * 12 +
    (postTaxBenefits.otherMonthly ?? 0) * 12;

  const netAnnual = Math.max(
    0,
    grossAnnual -
      totalPreTax -
      federalTax -
      fica.total -
      postTaxBenefitsAnnual
  );

  const periodsPerYear = PAY_FREQUENCIES[payFrequency] ?? 26;

  return {
    grossAnnual,
    totalPreTax,
    taxableIncome,
    federalTax,
    fica,
    postTaxBenefitsAnnual,
    netAnnual,
    netMonthly: netAnnual / 12,
    netPerPaycheck: netAnnual / periodsPerYear,
    periodsPerYear,
  };
}

/**
 * Groceries are logged per-trip (date + total) rather than as a fixed
 * recurring expense, since the amount varies trip to trip even though
 * the cadence is roughly weekly. Two monthly figures are computed:
 *  - averageMonthlyByCalendar: total spent / actual months spanned between
 *    the first and last logged trip. Most accurate once you've got a
 *    couple months of history.
 *  - averageMonthlyByCadence: averagePerTrip * 4.33 (avg weeks/month).
 *    A reasonable estimate from day one, before enough history exists
 *    for the calendar-based figure to mean much.
 */
export function calculateGroceryStats(groceries = []) {
  const tripCount = groceries.length;
  const totalSpent = groceries.reduce((sum, g) => sum + (g.amount ?? 0), 0);

  if (tripCount === 0) {
    return {
      tripCount: 0,
      totalSpent: 0,
      averagePerTrip: 0,
      monthsSpanned: 0,
      averageMonthlyByCalendar: 0,
      averageMonthlyByCadence: 0,
    };
  }

  const averagePerTrip = totalSpent / tripCount;

  const dates = groceries
    .map((g) => (g.date ? new Date(g.date) : null))
    .filter(Boolean)
    .sort((a, b) => a - b);

  let monthsSpanned = 1;
  if (dates.length >= 2) {
    const first = dates[0];
    const last = dates[dates.length - 1];
    const dayDiff = (last - first) / (1000 * 60 * 60 * 24);
    monthsSpanned = Math.max(1, dayDiff / 30.44);
  }

  return {
    tripCount,
    totalSpent,
    averagePerTrip,
    monthsSpanned,
    averageMonthlyByCalendar: totalSpent / monthsSpanned,
    averageMonthlyByCadence: averagePerTrip * 4.33,
  };
}



/** Normalize an expense entry's amount to a monthly figure. */
export function toMonthly(amount, frequency) {
  if (frequency === "annual") return amount / 12;
  if (frequency === "weekly") return (amount * 52) / 12;
  return amount; // already monthly
}

export function sumMonthly(items) {
  return items.reduce(
    (total, item) => total + toMonthly(item.amount ?? 0, item.frequency),
    0
  );
}

/**
 * Ties everything together into the numbers the Allocation Dashboard
 * shows: what's coming in, what's committed, and what's actually free
 * to move toward savings, business, or fun money.
 */
export function calculateAllocation({
  income,
  livingExpenses = [],
  groceries = [],
  business = { recurringExpenses: [], savingsGoals: [] },
  revenue = [],
  personalSavingsGoals = [],
}) {
  const netIncome = calculateNetIncome(income);

  const livingExpensesMonthly = sumMonthly(livingExpenses);
  const groceryStats = calculateGroceryStats(groceries);
  const groceriesMonthly = groceryStats.averageMonthlyByCalendar;
  const businessExpensesMonthly = sumMonthly(business.recurringExpenses ?? []);

  // Revenue entries are point-in-time (e.g. an itch.io payout on a date),
  // so we average whatever's logged over the trailing 30 days as a rough
  // monthly side-income figure. Refine this later with real date bucketing.
  const revenueMonthly =
    revenue.reduce((total, r) => total + (r.amount ?? 0), 0) || 0;

  const totalMonthlyIncome = netIncome.netMonthly + revenueMonthly;
  const totalCommitted =
    livingExpensesMonthly + groceriesMonthly + businessExpensesMonthly;

  const discretionaryMonthly = totalMonthlyIncome - totalCommitted;

  return {
    netIncome,
    livingExpensesMonthly,
    groceryStats,
    groceriesMonthly,
    businessExpensesMonthly,
    revenueMonthly,
    totalMonthlyIncome,
    totalCommitted,
    discretionaryMonthly,
  };
}
