import { FYBrackets } from "./taxBrackets";

// Compute marginal tax rate for a given taxable income
// Returns effective marginal rate (top bracket rate) + medicare levy
export function getMarginalRate(income: number, fyBrackets: FYBrackets): number {
  if (income <= 0) return 0;
  const { brackets, medicareLevy } = fyBrackets;
  let topRate = 0;
  for (const b of brackets) {
    if (income >= b.min) {
      topRate = b.rate;
    }
  }
  return topRate + medicareLevy;
}

// Compute actual tax on income (used for effective rate display)
export function computeTax(income: number, fyBrackets: FYBrackets): number {
  if (income <= fyBrackets.taxFreeThreshold) return 0;
  const { brackets, medicareLevy } = fyBrackets;
  let tax = 0;
  for (const b of brackets) {
    if (income > b.min) {
      const upper = b.max !== null ? Math.min(income, b.max) : income;
      tax = b.baseTax + (upper - b.min) * b.rate;
    }
  }
  return tax + (income * medicareLevy);
}

export interface TaxEstimate {
  netIncome: number;           // actual period net income
  annualisedIncome: number;    // annualised for bracket selection
  totalIncome: number;         // annualisedIncome + otherIncome (for rate selection)
  marginalRate: number;        // rate used (decimal)
  setAside: number;            // dollar amount to set aside
  fyUsed: string;
  isZeroFloor: boolean;
  periodMonths: number;
}

export function computeSetAside({
  netIncome,
  periodMonths,
  otherIncome,
  otherIncomeBand,
  fyBrackets,
}: {
  netIncome: number;
  periodMonths: number;
  otherIncome: number;
  otherIncomeBand: string;
  fyBrackets: FYBrackets;
}): TaxEstimate {
  if (netIncome <= 0) {
    return {
      netIncome,
      annualisedIncome: 0,
      totalIncome: 0,
      marginalRate: 0,
      setAside: 0,
      fyUsed: fyBrackets.year,
      isZeroFloor: true,
      periodMonths,
    };
  }

  const safeMonths = periodMonths > 0 ? periodMonths : 12;
  // Annualise business income for bracket selection ONLY
  const annualisedIncome = (netIncome / safeMonths) * 12;

  // Other income floor from band
  const otherIncomeBandFloor: Record<string, number> = {
    none: 0,
    under45k: 0,
    '45k-135k': 45000,
    'above135k': 135000,
  };
  const otherIncomeEstimate = otherIncome > 0 ? otherIncome : (otherIncomeBandFloor[otherIncomeBand] ?? 0);

  // Total income for rate selection = other income + annualised business
  const totalIncome = otherIncomeEstimate + annualisedIncome;

  // Marginal rate selected from total income
  const marginalRate = getMarginalRate(totalIncome, fyBrackets);

  // Set-aside applied to ACTUAL period net income (not annualised)
  const setAside = Math.ceil(netIncome * marginalRate);

  return {
    netIncome,
    annualisedIncome,
    totalIncome,
    marginalRate,
    setAside,
    fyUsed: fyBrackets.year,
    isZeroFloor: false,
    periodMonths,
  };
}
