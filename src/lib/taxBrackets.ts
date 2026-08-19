export interface Bracket {
  min: number;
  max: number | null; // null = no upper limit
  baseTax: number;
  rate: number; // marginal rate as decimal e.g. 0.19
}

export interface FYBrackets {
  year: string; // e.g. "2025-26"
  taxFreeThreshold: number;
  brackets: Bracket[];
  medicareLevy: number; // 0.02
  gstThreshold: number; // 75000
}

export const TAX_BRACKETS: Record<string, FYBrackets> = {
  "2024-25": {
    year: "2024-25",
    taxFreeThreshold: 18200,
    medicareLevy: 0.02,
    gstThreshold: 75000,
    brackets: [
      { min: 0,      max: 18200,  baseTax: 0,      rate: 0 },
      { min: 18201,  max: 45000,  baseTax: 0,      rate: 0.19 },
      { min: 45001,  max: 135000, baseTax: 5092,   rate: 0.325 },
      { min: 135001, max: 190000, baseTax: 34279,  rate: 0.37 },
      { min: 190001, max: null,   baseTax: 54679,  rate: 0.45 },
    ],
  },
  "2025-26": {
    year: "2025-26",
    taxFreeThreshold: 18200,
    medicareLevy: 0.02,
    gstThreshold: 75000,
    brackets: [
      { min: 0,      max: 18200,  baseTax: 0,      rate: 0 },
      { min: 18201,  max: 45000,  baseTax: 0,      rate: 0.19 },
      { min: 45001,  max: 135000, baseTax: 5092,   rate: 0.325 },
      { min: 135001, max: 190000, baseTax: 34279,  rate: 0.37 },
      { min: 190001, max: null,   baseTax: 54679,  rate: 0.45 },
    ],
  },
};

// Determine FY from a date: AU FY runs Jul 1 – Jun 30
export function getFYFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  if (month >= 6) { // July onwards = new FY
    return `${year}-${String(year + 1).slice(2)}`;
  } else {
    return `${year - 1}-${String(year).slice(2)}`;
  }
}

export function getBracketsForFY(fy: string): FYBrackets {
  return TAX_BRACKETS[fy] ?? TAX_BRACKETS["2025-26"];
}
