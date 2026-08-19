import * as XLSX from "xlsx";

export interface ParsedRow {
  date: Date | null;
  description: string;
  amount: number | null; // signed: positive = income, negative = expense
  rawIncome: number | null;
  rawExpense: number | null;
  isBalance: boolean;
  rowIndex: number;
}

export interface ColumnMapping {
  dateCol: string | null;
  descriptionCol: string | null;
  amountCol: string | null;  // single signed amount col
  incomeCol: string | null;  // debit/credit split
  expenseCol: string | null;
  balanceCol: string | null; // detected balance column — excluded
}

export interface ParsedSheet {
  sheetName: string;
  headers: string[];
  rows: ParsedRow[];
  columnMapping: ColumnMapping;
  dateRange: { start: Date; end: Date } | null;
  periodMonths: number;
}

export interface ParseResult {
  sheets: { name: string; rowCount: number }[];
  selectedSheet: ParsedSheet;
  warnings: string[];
}

// Sanitise a cell value to a number
// Handles: $1,234.56, AUD, (500.00), -500, blanks, text-only
export function sanitiseAmount(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  let s = String(raw).trim();
  if (!s) return null;

  // Bracketed negatives: (500.00) → -500
  const bracketed = s.match(/^\(([0-9,.$AUD\s]+)\)$/i);
  if (bracketed) s = '-' + bracketed[1];

  // Strip currency symbols and non-numeric except . -
  s = s.replace(/[^0-9.\-]/g, '');

  if (!s || s === '-' || s === '.') return null;
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

// Detect if a column looks like a running balance
function isBalanceColumn(header: string): boolean {
  const h = header.toLowerCase();
  if (/balance|running|cumulative|total to date/.test(h)) return true;
  return false;
}

// Detect if a column is likely a date column
function isDateColumn(header: string, samples: unknown[]): boolean {
  const h = header.toLowerCase();
  if (/date|time|when/.test(h)) return true;
  // Check if samples parse as dates
  const parsed = samples.slice(0, 5).filter(Boolean).map(v => {
    if (v instanceof Date) return v;
    const d = new Date(String(v));
    return isNaN(d.getTime()) ? null : d;
  });
  return parsed.filter(Boolean).length >= 2;
}

// Transfer/drawing exclusion patterns
const TRANSFER_PATTERNS = [
  /transfer/i, /owner['s]?\s*draw/i, /drawings/i, /loan/i,
  /credit card payment/i, /cc payment/i, /bpay/i,
  /opening balance/i, /closing balance/i, /internal/i,
];

export function isLikelyTransfer(description: string): boolean {
  return TRANSFER_PATTERNS.some(p => p.test(description));
}

export function parseFile(buffer: ArrayBuffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetNames = workbook.SheetNames;
  const warnings: string[] = [];

  // Pick the most transaction-like sheet (most rows)
  const sheetMeta = sheetNames.map(name => {
    const ws = workbook.Sheets[name];
    const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1:A1');
    return { name, rowCount: range.e.r - range.s.r };
  });

  const defaultSheet = sheetMeta.sort((a, b) => b.rowCount - a.rowCount)[0];
  const selectedSheetName = defaultSheet?.name ?? sheetNames[0];

  const selectedSheet = parseSheet(workbook, selectedSheetName, warnings);

  return {
    sheets: sheetMeta.map(s => ({ name: s.name, rowCount: s.rowCount })),
    selectedSheet,
    warnings,
  };
}

export function parseSheet(workbook: XLSX.WorkBook, sheetName: string, warnings: string[]): ParsedSheet {
  const ws = workbook.Sheets[sheetName];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' });

  if (raw.length < 2) {
    return {
      sheetName,
      headers: [],
      rows: [],
      columnMapping: { dateCol: null, descriptionCol: null, amountCol: null, incomeCol: null, expenseCol: null, balanceCol: null },
      dateRange: null,
      periodMonths: 0,
    };
  }

  const headers = (raw[0] as unknown[]).map(h => String(h ?? '').trim());
  const dataRows = raw.slice(1);

  // Identify columns
  const colData: Record<string, unknown[]> = {};
  headers.forEach((h, i) => {
    colData[h] = dataRows.map(row => (row as unknown[])[i]);
  });

  // Detect column types
  let dateCol: string | null = null;
  let descriptionCol: string | null = null;
  let amountCol: string | null = null;
  let incomeCol: string | null = null;
  let expenseCol: string | null = null;
  let balanceCol: string | null = null;

  // Balance column detection (must happen before amount detection)
  for (const h of headers) {
    if (isBalanceColumn(h)) {
      balanceCol = h;
      warnings.push(`We ignored your "${h}" column — it looks like a running balance, not individual transactions.`);
    }
  }

  // Date detection
  for (const h of headers) {
    if (isDateColumn(h, colData[h])) { dateCol = h; break; }
  }

  // Description detection
  for (const h of headers) {
    const hl = h.toLowerCase();
    if (/description|detail|narration|memo|particulars|payee|reference|narrative/.test(hl)) {
      descriptionCol = h; break;
    }
  }

  // Amount column detection
  // Check for debit/credit split first
  const debitHeader = headers.find(h => /debit|withdrawal|money.?out|expense|dr\b/.test(h.toLowerCase()));
  const creditHeader = headers.find(h => /credit|deposit|money.?in|income|cr\b/.test(h.toLowerCase()));

  if (debitHeader && creditHeader) {
    expenseCol = debitHeader;
    incomeCol = creditHeader;
  } else {
    // Look for single signed amount column
    for (const h of headers) {
      if (h === balanceCol || h === dateCol || h === descriptionCol) continue;
      const hl = h.toLowerCase();
      if (/amount|value|sum|total|net|transaction/.test(hl)) {
        amountCol = h; break;
      }
    }
    // Fallback: first numeric-looking column that isn't balance
    if (!amountCol) {
      for (const h of headers) {
        if (h === balanceCol || h === dateCol || h === descriptionCol) continue;
        const nums = colData[h].map(v => sanitiseAmount(v)).filter(v => v !== null);
        if (nums.length > dataRows.length * 0.3) {
          amountCol = h; break;
        }
      }
    }
  }

  // Parse rows
  const rows: ParsedRow[] = dataRows.map((row, i) => {
    const rowArr = row as unknown[];
    const get = (col: string | null) => col ? rowArr[headers.indexOf(col)] : null;

    // Parse date
    let date: Date | null = null;
    const rawDate = get(dateCol);
    if (rawDate instanceof Date) {
      date = rawDate;
    } else if (rawDate) {
      const d = new Date(String(rawDate));
      if (!isNaN(d.getTime())) date = d;
    }

    // Parse description
    const description = String(get(descriptionCol) ?? '').trim();

    // Parse amounts
    let amount: number | null = null;
    let rawIncome: number | null = null;
    let rawExpense: number | null = null;

    if (incomeCol && expenseCol) {
      rawIncome = sanitiseAmount(get(incomeCol));
      rawExpense = sanitiseAmount(get(expenseCol));
      // Expenses are positive values in the debit column — make them negative
      if (rawIncome !== null && rawExpense !== null) {
        amount = (rawIncome ?? 0) - (rawExpense ?? 0);
      } else if (rawIncome !== null) {
        amount = rawIncome;
      } else if (rawExpense !== null) {
        amount = -(rawExpense);
      }
    } else {
      amount = sanitiseAmount(get(amountCol));
    }

    return {
      date,
      description,
      amount,
      rawIncome,
      rawExpense,
      isBalance: false,
      rowIndex: i,
    };
  }).filter(row => row.amount !== null || row.date !== null);

  // Detect date range
  const dates = rows.map(r => r.date).filter((d): d is Date => d !== null);
  dates.sort((a, b) => a.getTime() - b.getTime());
  const dateRange = dates.length >= 2 ? { start: dates[0], end: dates[dates.length - 1] } : null;

  // Period in months
  let periodMonths = 12;
  if (dateRange) {
    const months = (dateRange.end.getFullYear() - dateRange.start.getFullYear()) * 12
      + (dateRange.end.getMonth() - dateRange.start.getMonth()) + 1;
    periodMonths = Math.max(1, months);
  }

  return {
    sheetName,
    headers,
    rows,
    columnMapping: { dateCol, descriptionCol, amountCol, incomeCol, expenseCol, balanceCol },
    dateRange,
    periodMonths,
  };
}

// Detect flags: duplicates, outliers, large single expenses
export interface Flag {
  type: 'duplicate' | 'outlier' | 'large-expense' | 'uncategorised';
  message: string;
  rowIndices: number[];
}

export function detectFlags(rows: ParsedRow[]): Flag[] {
  const flags: Flag[] = [];
  const amounts = rows.map(r => r.amount).filter((a): a is number => a !== null && a < 0).map(Math.abs);

  if (amounts.length === 0) return flags;

  // Detect duplicates (same amount + same date + similar description)
  const seen = new Map<string, number[]>();
  rows.forEach((row, i) => {
    if (!row.amount || !row.date) return;
    const key = `${row.date.toDateString()}|${row.amount}|${row.description.slice(0, 20)}`;
    const arr = seen.get(key) ?? [];
    arr.push(i);
    seen.set(key, arr);
  });
  for (const [, indices] of seen) {
    if (indices.length > 1) {
      flags.push({ type: 'duplicate', message: `Possible duplicate: ${indices.length} rows with the same amount, date, and description.`, rowIndices: indices });
    }
  }

  // Outlier: expense > mean + 3*stddev
  const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const stddev = Math.sqrt(amounts.map(a => Math.pow(a - mean, 2)).reduce((a, b) => a + b, 0) / amounts.length);
  const outlierThreshold = mean + 3 * stddev;
  const outliers = rows.filter(r => r.amount !== null && Math.abs(r.amount) > outlierThreshold && r.amount < 0);
  if (outliers.length > 0) {
    flags.push({ type: 'outlier', message: `Unusually large expense${outliers.length > 1 ? 's' : ''} detected (more than 3\u00d7 the typical amount).`, rowIndices: outliers.map(r => r.rowIndex) });
  }

  // Notably large single expense (> $5000)
  const largeExpenses = rows.filter(r => r.amount !== null && r.amount < -5000);
  if (largeExpenses.length > 0 && largeExpenses.length !== outliers.length) {
    flags.push({ type: 'large-expense', message: `${largeExpenses.length} expense${largeExpenses.length > 1 ? 's' : ''} over $5,000 \u2014 worth reviewing.`, rowIndices: largeExpenses.map(r => r.rowIndex) });
  }

  return flags;
}
