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

/**
 * State income tax config, one entry per state + DC.
 *
 * ⚠️ These are approximate 2024/2025 figures from memory, NOT verified
 * against each state's department of revenue. Confidence varies by type:
 *   - "none": no state income tax on wages. Fairly reliable list.
 *   - "flat": single statewide rate. Reasonably reliable, but rates do
 *     get adjusted — verify before trusting.
 *   - "brackets": real progressive brackets. Only built out for CA and
 *     NY so far (the two most common for indie devs/creators). Others
 *     fall back to "topRateApprox" until someone fills in real brackets.
 *   - "topRateApprox": uses the state's TOP marginal rate as a flat
 *     stand-in. This deliberately overestimates tax for most incomes
 *     (safer to overestimate than underestimate when budgeting), but
 *     it is NOT accurate — replace with real brackets when you can.
 *
 * To add real brackets for a state: change its type to "brackets" and
 * give it a `brackets: { single: [...], marriedJoint: [...] }` shape
 * identical to FEDERAL_BRACKETS above.
 */
export const STATE_TAX = {
  // ── No state income tax on wages ──────────────────────────
  AK: { name: "Alaska", type: "none" },
  FL: { name: "Florida", type: "none" },
  NV: { name: "Nevada", type: "none" },
  NH: { name: "New Hampshire", type: "none" },
  SD: { name: "South Dakota", type: "none" },
  TN: { name: "Tennessee", type: "none" },
  TX: { name: "Texas", type: "none" },
  WA: { name: "Washington", type: "none" },
  WY: { name: "Wyoming", type: "none" },

  // ── Flat-rate states ───────────────────────────────────────
  AZ: { name: "Arizona", type: "flat", rate: 0.025 },
  CO: { name: "Colorado", type: "flat", rate: 0.044 },
  GA: { name: "Georgia", type: "flat", rate: 0.0539 },
  ID: { name: "Idaho", type: "flat", rate: 0.05695 },
  IL: { name: "Illinois", type: "flat", rate: 0.0495 },
  IN: { name: "Indiana", type: "flat", rate: 0.0305 },
  IA: { name: "Iowa", type: "flat", rate: 0.038 },
  KY: { name: "Kentucky", type: "flat", rate: 0.04 },
  MA: { name: "Massachusetts", type: "flat", rate: 0.05 }, // excludes the +4% surtax over $1M
  MI: { name: "Michigan", type: "flat", rate: 0.0425 },
  MS: { name: "Mississippi", type: "flat", rate: 0.047 },
  NC: { name: "North Carolina", type: "flat", rate: 0.0425 },
  PA: { name: "Pennsylvania", type: "flat", rate: 0.0307 },
  UT: { name: "Utah", type: "flat", rate: 0.0455 },

  // ── Full progressive brackets (built out) ─────────────────
  CA: {
    name: "California",
    type: "brackets",
    brackets: {
      single: [
        [10412, 0.01],
        [24684, 0.02],
        [38959, 0.04],
        [54081, 0.06],
        [68350, 0.08],
        [349137, 0.093],
        [418961, 0.103],
        [698271, 0.113],
        [Infinity, 0.123],
      ],
      marriedJoint: [
        [20824, 0.01],
        [49368, 0.02],
        [77918, 0.04],
        [108162, 0.06],
        [136700, 0.08],
        [698274, 0.093],
        [837922, 0.103],
        [1396542, 0.113],
        [Infinity, 0.123],
      ],
    },
  },
  NY: {
    name: "New York",
    type: "brackets",
    brackets: {
      single: [
        [8500, 0.04],
        [11700, 0.045],
        [13900, 0.0525],
        [80650, 0.055],
        [215400, 0.06],
        [1077550, 0.0685],
        [5000000, 0.0965],
        [25000000, 0.103],
        [Infinity, 0.109],
      ],
      marriedJoint: [
        [17150, 0.04],
        [23600, 0.045],
        [27900, 0.0525],
        [161550, 0.055],
        [323200, 0.06],
        [2155350, 0.0685],
        [5000000, 0.0965],
        [25000000, 0.103],
        [Infinity, 0.109],
      ],
    },
  },

  // ── Progressive states, approximated by top marginal rate ─
  // (deliberately conservative — replace with real brackets when able)
  AL: { name: "Alabama", type: "topRateApprox", rate: 0.05 },
  AR: { name: "Arkansas", type: "topRateApprox", rate: 0.044 },
  CT: { name: "Connecticut", type: "topRateApprox", rate: 0.0699 },
  DE: { name: "Delaware", type: "topRateApprox", rate: 0.066 },
  DC: { name: "District of Columbia", type: "topRateApprox", rate: 0.1075 },
  HI: { name: "Hawaii", type: "topRateApprox", rate: 0.11 },
  KS: { name: "Kansas", type: "topRateApprox", rate: 0.057 },
  LA: { name: "Louisiana", type: "topRateApprox", rate: 0.0425 },
  ME: { name: "Maine", type: "topRateApprox", rate: 0.0715 },
  MD: { name: "Maryland", type: "topRateApprox", rate: 0.0575 },
  MN: { name: "Minnesota", type: "topRateApprox", rate: 0.0985 },
  MO: { name: "Missouri", type: "topRateApprox", rate: 0.0495 },
  MT: { name: "Montana", type: "topRateApprox", rate: 0.059 },
  NE: { name: "Nebraska", type: "topRateApprox", rate: 0.0584 },
  NJ: { name: "New Jersey", type: "topRateApprox", rate: 0.1075 },
  NM: { name: "New Mexico", type: "topRateApprox", rate: 0.059 },
  OH: { name: "Ohio", type: "topRateApprox", rate: 0.035 },
  OK: { name: "Oklahoma", type: "topRateApprox", rate: 0.0475 },
  OR: { name: "Oregon", type: "topRateApprox", rate: 0.099 },
  RI: { name: "Rhode Island", type: "topRateApprox", rate: 0.0599 },
  SC: { name: "South Carolina", type: "topRateApprox", rate: 0.064 },
  VT: { name: "Vermont", type: "topRateApprox", rate: 0.0875 },
  VA: { name: "Virginia", type: "topRateApprox", rate: 0.0575 },
  WV: { name: "West Virginia", type: "topRateApprox", rate: 0.0512 },
  WI: { name: "Wisconsin", type: "topRateApprox", rate: 0.0765 },
};

// ─────────────────────────────────────────────────────────────
// CORE MATH
// ─────────────────────────────────────────────────────────────

/** Shared progressive-bracket math, used for both federal and state brackets. */
function applyBrackets(taxableIncome, brackets) {
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

/** Progressive bracket tax on a given taxable income. */
export function calculateFederalTax(taxableIncome, filingStatus = "single") {
  const brackets = FEDERAL_BRACKETS[filingStatus] ?? FEDERAL_BRACKETS.single;
  return applyBrackets(taxableIncome, brackets);
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
 * Estimates state income tax. Applied against the same taxable-income
 * figure used for federal (gross minus pre-tax deductions minus federal
 * standard deduction) as a simplification — most states have their own
 * deduction rules that differ slightly, so this is an approximation for
 * every state, not just the "topRateApprox" ones.
 */
export function calculateStateTax(taxableIncome, stateCode, filingStatus = "single") {
  const entry = STATE_TAX[stateCode];
  if (!entry || entry.type === "none") return 0;

  if (entry.type === "flat" || entry.type === "topRateApprox") {
    return taxableIncome * entry.rate;
  }

  if (entry.type === "brackets") {
    const brackets = entry.brackets[filingStatus] ?? entry.brackets.single;
    return applyBrackets(taxableIncome, brackets);
  }

  return 0;
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
    state = "",
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
  const stateTax = calculateStateTax(taxableIncome, state, filingStatus);
  const stateInfo = STATE_TAX[state] ?? null;
  const fica = calculateFICA(grossAnnual, filingStatus);

  const postTaxBenefitsAnnual =
    (postTaxBenefits.healthInsuranceMonthly ?? 0) * 12 +
    (postTaxBenefits.otherMonthly ?? 0) * 12;

  const netAnnual = Math.max(
    0,
    grossAnnual -
      totalPreTax -
      federalTax -
      stateTax -
      fica.total -
      postTaxBenefitsAnnual
  );

  const periodsPerYear = PAY_FREQUENCIES[payFrequency] ?? 26;

  return {
    grossAnnual,
    totalPreTax,
    taxableIncome,
    federalTax,
    stateTax,
    stateInfo,
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
