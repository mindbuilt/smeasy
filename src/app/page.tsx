"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  parseFile,
  parseSheet,
  isLikelyTransfer,
  detectFlags,
  ParsedRow,
  ParseResult,
  Flag,
  ParsedSheet,
} from "@/lib/parser";
import { getFYFromDate, getBracketsForFY } from "@/lib/taxBrackets";
import { computeSetAside, TaxEstimate } from "@/lib/taxCalculator";

type Step = "landing" | "upload" | "review" | "income" | "processing" | "results";
type OtherIncomeBand = "none" | "under45k" | "45k-135k" | "above135k";

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("en-AU", { month: "short", year: "numeric" }).format(d);

const fmtPercent = (rate: number) => `${Math.round(rate * 100)}%`;

function toRatePercent(rate: number): number {
  return Math.round(rate * 100);
}

function fromRatePercent(pct: number): number {
  return pct / 100;
}

// Helper component for column row display
function ColRow({
  label,
  value,
  headers,
}: {
  label: string;
  value: string | null;
  headers: string[];
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[#6B7280] w-28 shrink-0">{label}</span>
      {value ? (
        <span className="font-medium text-[#1C1C1C]">{value}</span>
      ) : (
        <span className="text-amber-600 text-xs">
          Not detected
          {headers.length > 0
            ? ` — columns: ${headers.slice(0, 4).join(", ")}${headers.length > 4 ? "..." : ""}`
            : ""}
        </span>
      )}
    </div>
  );
}

export default function Home() {
  const [step, setStep] = useState<Step>("landing");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [selectedSheetName, setSelectedSheetName] = useState<string>("");
  const [workbookRef, setWorkbookRef] = useState<XLSX.WorkBook | null>(null);
  const [currentSheet, setCurrentSheet] = useState<ParsedSheet | null>(null);
  const [excludedRows, setExcludedRows] = useState<Set<number>>(new Set());
  const [manuallyIncluded, setManuallyIncluded] = useState<Set<number>>(new Set());
  const [hasOtherIncome, setHasOtherIncome] = useState<boolean | null>(null);
  const [otherIncomeBand, setOtherIncomeBand] = useState<OtherIncomeBand>("none");
  const [taxEstimate, setTaxEstimate] = useState<TaxEstimate | null>(null);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [sliderPct, setSliderPct] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute active rows based on current sheet and exclusion state
  const getActiveRows = useCallback(
    (sheet: ParsedSheet, excluded: Set<number>, included: Set<number>): ParsedRow[] => {
      return sheet.rows.filter((row) => {
        if (included.has(row.rowIndex)) return true;
        if (excluded.has(row.rowIndex)) return false;
        return true;
      });
    },
    []
  );

  // Auto-advance from processing
  useEffect(() => {
    if (step === "processing") {
      const timer = setTimeout(() => {
        runCalculation();
      }, 1500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function runCalculation() {
    if (!currentSheet) return;

    const active = getActiveRows(currentSheet, excludedRows, manuallyIncluded);

    const totalIncome = active
      .filter((r) => r.amount !== null && r.amount > 0)
      .reduce((sum, r) => sum + (r.amount ?? 0), 0);

    const totalExpenses = active
      .filter((r) => r.amount !== null && r.amount < 0)
      .reduce((sum, r) => sum + Math.abs(r.amount ?? 0), 0);

    const netIncome = totalIncome - totalExpenses;

    // Determine FY
    let fy = "2025-26";
    if (currentSheet.dateRange) {
      fy = getFYFromDate(currentSheet.dateRange.end);
    }
    const fyBrackets = getBracketsForFY(fy);

    const estimate = computeSetAside({
      netIncome,
      periodMonths: currentSheet.periodMonths,
      otherIncome: 0,
      otherIncomeBand: hasOtherIncome ? otherIncomeBand : "none",
      fyBrackets,
    });

    const detectedFlags = detectFlags(active);

    setTaxEstimate(estimate);
    setFlags(detectedFlags);
    setSliderPct(toRatePercent(estimate.marginalRate));
    setStep("results");
  }

  const processFile = useCallback(
    (buffer: ArrayBuffer) => {
      try {
        const result = parseFile(buffer);
        const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
        setWorkbookRef(workbook);
        setParseResult(result);
        setSelectedSheetName(result.selectedSheet.sheetName);
        setCurrentSheet(result.selectedSheet);

        const excluded = new Set<number>();
        result.selectedSheet.rows.forEach((row) => {
          if (isLikelyTransfer(row.description)) {
            excluded.add(row.rowIndex);
          }
        });
        setExcludedRows(excluded);
        setManuallyIncluded(new Set());
        setUploadError(null);
        setStep("review");
      } catch {
        setUploadError(
          "We couldn't read that file. Make sure it's a .csv, .xlsx, or .xls file with transaction data."
        );
      }
    },
    []
  );

  const handleFile = useCallback(
    (file: File) => {
      if (!file) return;
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["csv", "xlsx", "xls"].includes(ext ?? "")) {
        setUploadError("Please upload a .csv, .xlsx, or .xls file.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        processFile(buffer);
      };
      reader.onerror = () => {
        setUploadError("Failed to read the file. Please try again.");
      };
      reader.readAsArrayBuffer(file);
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  function handleSheetChange(sheetName: string) {
    if (!workbookRef || !parseResult) return;
    setSelectedSheetName(sheetName);
    const warnings: string[] = [];
    const sheet = parseSheet(workbookRef, sheetName, warnings);
    setCurrentSheet(sheet);

    const excluded = new Set<number>();
    sheet.rows.forEach((row) => {
      if (isLikelyTransfer(row.description)) {
        excluded.add(row.rowIndex);
      }
    });
    setExcludedRows(excluded);
    setManuallyIncluded(new Set());
  }

  function toggleRowExclusion(rowIndex: number, currentlyExcluded: boolean) {
    if (currentlyExcluded) {
      setExcludedRows((prev) => {
        const next = new Set(prev);
        next.delete(rowIndex);
        return next;
      });
      setManuallyIncluded((prev) => new Set(prev).add(rowIndex));
    } else {
      setExcludedRows((prev) => new Set(prev).add(rowIndex));
      setManuallyIncluded((prev) => {
        const next = new Set(prev);
        next.delete(rowIndex);
        return next;
      });
    }
  }

  function buildCopyText(): string {
    if (!taxEstimate || !currentSheet) return "";
    const lines: string[] = [
      "SMEASY Tax Set-Aside Estimate",
      "================================",
      "",
    ];
    if (currentSheet.dateRange) {
      lines.push(
        `Period: ${fmtDate(currentSheet.dateRange.start)} – ${fmtDate(currentSheet.dateRange.end)} (${currentSheet.periodMonths} months)`
      );
    }
    lines.push(`FY Rates Used: ${taxEstimate.fyUsed}`);
    lines.push("");
    lines.push(`Net Business Income (period): ${fmtCurrency(taxEstimate.netIncome)}`);
    lines.push(`Annualised Income: ${fmtCurrency(taxEstimate.annualisedIncome)}`);
    if (hasOtherIncome) {
      lines.push(`Other Income Band: ${otherIncomeBand}`);
      lines.push(`Total Income (annualised): ${fmtCurrency(taxEstimate.totalIncome)}`);
    }
    lines.push(`Marginal Rate Applied: ${fmtPercent(fromRatePercent(sliderPct))}`);
    lines.push("");
    lines.push(
      `Recommended Set-Aside: ${fmtCurrency(Math.ceil(taxEstimate.netIncome * fromRatePercent(sliderPct)))}`
    );
    lines.push("");
    lines.push("Notes:");
    lines.push("- This is a rough estimate only, not formal tax advice.");
    lines.push(
      "- Figures assumed GST-exclusive. If GST-registered, actual tax may be lower."
    );
    lines.push("- Medicare Levy (2%) included in rate.");
    lines.push("- Verify with your accountant.");
    lines.push("");
    lines.push("Generated by SMEASY — not connected to the ATO.");
    return lines.join("\n");
  }

  async function handleCopy() {
    const text = buildCopyText();
    try {
      await navigator.clipboard.writeText(text);
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2500);
    } catch {
      // fallback — silently fail
    }
  }

  // Check for FY crossing
  const fySpan = (() => {
    if (!currentSheet?.dateRange) return null;
    const startFY = getFYFromDate(currentSheet.dateRange.start);
    const endFY = getFYFromDate(currentSheet.dateRange.end);
    if (startFY !== endFY) return { startFY, endFY };
    return null;
  })();

  // Pre-excluded transfer rows for display in review step
  const transferRows =
    currentSheet?.rows.filter(
      (r) => isLikelyTransfer(r.description) && !manuallyIncluded.has(r.rowIndex)
    ) ?? [];

  // Active rows (for preview income/expense totals in review step)
  const activeRowsPreview = currentSheet
    ? getActiveRows(currentSheet, excludedRows, manuallyIncluded)
    : [];

  const previewIncome = activeRowsPreview
    .filter((r) => (r.amount ?? 0) > 0)
    .reduce((s, r) => s + (r.amount ?? 0), 0);

  const previewExpenses = activeRowsPreview
    .filter((r) => (r.amount ?? 0) < 0)
    .reduce((s, r) => s + Math.abs(r.amount ?? 0), 0);

  const previewNet = previewIncome - previewExpenses;

  // Slider-adjusted set-aside
  const sliderSetAside = taxEstimate
    ? Math.ceil(taxEstimate.netIncome * fromRatePercent(sliderPct))
    : 0;

  // Active rows used in results (for breakdown display)
  const resultActiveRows = currentSheet
    ? getActiveRows(currentSheet, excludedRows, manuallyIncluded)
    : [];
  const resultIncome = resultActiveRows
    .filter((r) => (r.amount ?? 0) > 0)
    .reduce((s, r) => s + (r.amount ?? 0), 0);
  const resultExpenses = resultActiveRows
    .filter((r) => (r.amount ?? 0) < 0)
    .reduce((s, r) => s + Math.abs(r.amount ?? 0), 0);

  // ---- RENDER ----

  if (step === "landing") {
    return (
      <main className="min-h-screen bg-[#FAF9F6] flex flex-col items-center px-5 py-16">
        <div className="w-full max-w-2xl">
          {/* Logo / wordmark */}
          <div className="mb-12">
            <span className="text-2xl font-bold tracking-tight text-[#1C1C1C]">
              sm<span className="text-[#84CC16]">easy</span>
            </span>
          </div>

          {/* Hero */}
          <h1 className="text-4xl sm:text-5xl font-bold text-[#1C1C1C] leading-tight mb-5">
            Know what to set aside.{" "}
            <span className="text-[#6B7280] font-normal">No accountant required right now.</span>
          </h1>
          <p className="text-lg text-[#6B7280] mb-3 leading-relaxed">
            Upload your bank export or spreadsheet. Get a rough tax set-aside estimate.
            Independent and private — not connected to the tax office, reports to no one.
          </p>
          <p className="text-sm text-[#6B7280] border-l-2 border-[#84CC16] pl-3 mb-10 leading-relaxed">
            Built for sole traders taxed at personal rates — if you run a company or trust,
            your tax works differently and this won&apos;t fit.
          </p>

          {/* CTA */}
          <button
            onClick={() => setStep("upload")}
            className="bg-[#84CC16] text-white font-semibold text-lg px-8 py-4 rounded-xl hover:bg-[#65a30d] transition-colors mb-10 w-full sm:w-auto"
          >
            Upload my spreadsheet
          </button>

          {/* How it works */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
            <h2 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wide mb-4">
              How it works
            </h2>
            <div className="flex flex-col sm:flex-row gap-6">
              {[
                {
                  n: "1",
                  title: "Upload",
                  desc: "Drop in your bank export or accounting CSV/spreadsheet.",
                },
                {
                  n: "2",
                  title: "Review",
                  desc: "Check what we found — columns, period, any transfers we excluded.",
                },
                {
                  n: "3",
                  title: "Get your number",
                  desc: "See a set-aside estimate at your marginal tax rate.",
                },
              ].map((item) => (
                <div key={item.n} className="flex-1">
                  <div className="text-[#84CC16] font-bold text-xl mb-1">{item.n}</div>
                  <div className="font-semibold text-[#1C1C1C] mb-1">{item.title}</div>
                  <div className="text-sm text-[#6B7280]">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy note */}
          <p className="text-xs text-[#6B7280] text-center">
            Your file isn&apos;t kept. We&apos;re not connected to the ATO.
            Everything runs in your browser — nothing leaves your device.
          </p>
        </div>
      </main>
    );
  }

  if (step === "upload") {
    return (
      <main className="min-h-screen bg-[#FAF9F6] flex flex-col items-center px-5 py-16">
        <div className="w-full max-w-xl">
          <button
            onClick={() => setStep("landing")}
            className="text-sm text-[#6B7280] hover:text-[#1C1C1C] mb-8 flex items-center gap-1"
          >
            ← Back
          </button>

          <div className="mb-10">
            <span className="text-xl font-bold tracking-tight text-[#1C1C1C]">
              sm<span className="text-[#84CC16]">easy</span>
            </span>
          </div>

          <h2 className="text-2xl font-bold text-[#1C1C1C] mb-2">Upload your file</h2>
          <p className="text-[#6B7280] mb-8">
            A bank CSV, MYOB export, Xero report, or any spreadsheet with dates and amounts.
          </p>

          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer ${
              isDragging
                ? "border-[#84CC16] bg-[#f0fdf4]"
                : "border-gray-200 bg-white hover:border-[#84CC16]"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-4xl mb-3">📂</div>
            <p className="font-semibold text-[#1C1C1C] mb-1">Drop your file here</p>
            <p className="text-sm text-[#6B7280]">.csv, .xlsx, or .xls — or click to browse</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 w-full bg-[#84CC16] text-white font-semibold py-3 rounded-xl hover:bg-[#65a30d] transition-colors"
          >
            Choose file
          </button>

          {uploadError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
              {uploadError}
            </div>
          )}

          <p className="text-xs text-[#6B7280] text-center mt-8">
            Your file stays in your browser. Nothing is uploaded to a server.
          </p>
        </div>
      </main>
    );
  }

  if (step === "review") {
    if (!currentSheet || !parseResult) return null;
    const { columnMapping, dateRange, periodMonths, headers } = currentSheet;

    return (
      <main className="min-h-screen bg-[#FAF9F6] px-5 py-12">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setStep("upload")}
            className="text-sm text-[#6B7280] hover:text-[#1C1C1C] mb-8 flex items-center gap-1"
          >
            ← Back
          </button>

          <div className="mb-8">
            <span className="text-xl font-bold tracking-tight text-[#1C1C1C]">
              sm<span className="text-[#84CC16]">easy</span>
            </span>
          </div>

          <h2 className="text-2xl font-bold text-[#1C1C1C] mb-1">Review what we found</h2>
          <p className="text-[#6B7280] mb-8">
            Check the details below before we calculate your estimate.
          </p>

          {/* Sheet picker */}
          {parseResult.sheets.length > 1 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-5">
              <label className="block text-sm font-semibold text-[#1C1C1C] mb-2">Sheet</label>
              <select
                value={selectedSheetName}
                onChange={(e) => handleSheetChange(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#1C1C1C] bg-white"
              >
                {parseResult.sheets.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name} ({s.rowCount} rows)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Column mapping */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-5">
            <h3 className="text-sm font-semibold text-[#1C1C1C] mb-3">Detected columns</h3>
            <div className="space-y-2 text-sm">
              <ColRow label="Date" value={columnMapping.dateCol} headers={headers} />
              <ColRow
                label="Description"
                value={columnMapping.descriptionCol}
                headers={headers}
              />
              {columnMapping.incomeCol && columnMapping.expenseCol ? (
                <>
                  <ColRow
                    label="Income"
                    value={columnMapping.incomeCol}
                    headers={headers}
                  />
                  <ColRow
                    label="Expenses"
                    value={columnMapping.expenseCol}
                    headers={headers}
                  />
                </>
              ) : (
                <ColRow label="Amount" value={columnMapping.amountCol} headers={headers} />
              )}
              {columnMapping.balanceCol && (
                <div className="flex items-center gap-2">
                  <span className="text-[#6B7280] w-28 shrink-0">Balance</span>
                  <span className="font-medium text-[#1C1C1C] line-through opacity-50">
                    {columnMapping.balanceCol}
                  </span>
                  <span className="text-xs text-[#6B7280] bg-gray-50 px-2 py-0.5 rounded">
                    excluded — running balance
                  </span>
                </div>
              )}
            </div>

            {parseResult.warnings.length > 0 && (
              <div className="mt-3 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 space-y-1">
                {parseResult.warnings.map((w, i) => (
                  <p key={i}>{w}</p>
                ))}
              </div>
            )}
          </div>

          {/* Period */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-5">
            <h3 className="text-sm font-semibold text-[#1C1C1C] mb-2">Period covered</h3>
            {dateRange ? (
              <p className="text-sm text-[#1C1C1C]">
                <span className="font-medium">{fmtDate(dateRange.start)}</span>
                {" "}&ndash;{" "}
                <span className="font-medium">{fmtDate(dateRange.end)}</span>
                <span className="text-[#6B7280] ml-2">
                  ({periodMonths} month{periodMonths !== 1 ? "s" : ""})
                </span>
              </p>
            ) : (
              <p className="text-sm text-[#6B7280]">
                Could not detect dates — using 12-month period.
              </p>
            )}

            {fySpan && (
              <div className="mt-3 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                This data spans two tax years (FY{fySpan.startFY} and FY{fySpan.endFY}). We&apos;re
                treating it as one continuous period for this estimate.
              </div>
            )}
          </div>

          {/* Income/expense preview */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-5">
            <h3 className="text-sm font-semibold text-[#1C1C1C] mb-3">Transaction summary</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Total income</span>
                <span className="font-medium text-[#1C1C1C]">{fmtCurrency(previewIncome)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Total expenses</span>
                <span className="font-medium text-[#1C1C1C]">{fmtCurrency(previewExpenses)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2 mt-2">
                <span className="font-semibold text-[#1C1C1C]">Net income</span>
                <span
                  className={`font-semibold ${previewNet >= 0 ? "text-[#1C1C1C]" : "text-red-600"}`}
                >
                  {fmtCurrency(previewNet)}
                </span>
              </div>
            </div>
          </div>

          {/* Transfer exclusions */}
          {transferRows.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-5">
              <h3 className="text-sm font-semibold text-[#1C1C1C] mb-1">
                Auto-excluded transfers
              </h3>
              <p className="text-xs text-[#6B7280] mb-3">
                These look like transfers, owner drawings, or internal movements — not real income
                or expenses. We&apos;ve excluded them. Tick any you want to include.
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {transferRows.slice(0, 30).map((row) => {
                  const isIncluded = manuallyIncluded.has(row.rowIndex);
                  return (
                    <label
                      key={row.rowIndex}
                      className="flex items-start gap-2 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={isIncluded}
                        onChange={() => toggleRowExclusion(row.rowIndex, !isIncluded)}
                        className="mt-0.5 shrink-0 accent-[#84CC16]"
                      />
                      <div className="text-xs">
                        <span className="text-[#1C1C1C]">
                          {row.description || "(no description)"}
                        </span>
                        {row.amount !== null && (
                          <span
                            className={`ml-2 ${row.amount >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {fmtCurrency(row.amount)}
                          </span>
                        )}
                        {row.date && (
                          <span className="ml-2 text-[#6B7280]">{fmtDate(row.date)}</span>
                        )}
                      </div>
                    </label>
                  );
                })}
                {transferRows.length > 30 && (
                  <p className="text-xs text-[#6B7280]">
                    ... and {transferRows.length - 30} more excluded items
                  </p>
                )}
              </div>
            </div>
          )}

          <button
            onClick={() => setStep("income")}
            className="w-full bg-[#84CC16] text-white font-semibold py-4 rounded-xl hover:bg-[#65a30d] transition-colors text-lg"
          >
            Looks right — continue
          </button>
        </div>
      </main>
    );
  }

  if (step === "income") {
    return (
      <main className="min-h-screen bg-[#FAF9F6] px-5 py-12">
        <div className="max-w-xl mx-auto">
          <button
            onClick={() => setStep("review")}
            className="text-sm text-[#6B7280] hover:text-[#1C1C1C] mb-8 flex items-center gap-1"
          >
            ← Back
          </button>

          <div className="mb-8">
            <span className="text-xl font-bold tracking-tight text-[#1C1C1C]">
              sm<span className="text-[#84CC16]">easy</span>
            </span>
          </div>

          <h2 className="text-2xl font-bold text-[#1C1C1C] mb-2">One more question</h2>
          <p className="text-[#6B7280] mb-8">
            Your tax bracket depends on your total income — business plus anything else.
          </p>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
            <h3 className="text-base font-semibold text-[#1C1C1C] mb-4">
              Is this your only income, or do you also earn a wage or salary?
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="otherIncome"
                  checked={hasOtherIncome === false}
                  onChange={() => {
                    setHasOtherIncome(false);
                    setOtherIncomeBand("none");
                  }}
                  className="accent-[#84CC16]"
                />
                <span className="text-sm text-[#1C1C1C]">This is my only income</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="otherIncome"
                  checked={hasOtherIncome === true}
                  onChange={() => setHasOtherIncome(true)}
                  className="accent-[#84CC16]"
                />
                <span className="text-sm text-[#1C1C1C]">
                  I also earn a wage or salary elsewhere
                </span>
              </label>
            </div>

            {hasOtherIncome === true && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <p className="text-sm font-medium text-[#1C1C1C] mb-3">
                  Roughly, what band is that other income in?
                </p>
                <div className="space-y-2">
                  {[
                    { value: "under45k" as OtherIncomeBand, label: "Under $45,000" },
                    { value: "45k-135k" as OtherIncomeBand, label: "$45,000 – $135,000" },
                    { value: "above135k" as OtherIncomeBand, label: "Above $135,000" },
                  ].map((opt) => (
                    <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="incomeBand"
                        checked={otherIncomeBand === opt.value}
                        onChange={() => setOtherIncomeBand(opt.value)}
                        className="accent-[#84CC16]"
                      />
                      <span className="text-sm text-[#1C1C1C]">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-xs text-blue-700">
            <strong>Why this matters:</strong> Your business income stacks on top of other income
            for tax purposes. If you already earn a salary, even a modest side income might be
            taxed at a higher bracket. We use your answer to pick the right marginal rate.
          </div>

          <button
            disabled={
              hasOtherIncome === null ||
              (hasOtherIncome === true && otherIncomeBand === "none")
            }
            onClick={() => setStep("processing")}
            className="w-full bg-[#84CC16] text-white font-semibold py-4 rounded-xl hover:bg-[#65a30d] transition-colors text-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Calculate my set-aside
          </button>
        </div>
      </main>
    );
  }

  if (step === "processing") {
    return (
      <main className="min-h-screen bg-[#FAF9F6] flex items-center justify-center px-5">
        <div className="text-center">
          <div className="text-5xl mb-6 animate-pulse">🧮</div>
          <h2 className="text-2xl font-bold text-[#1C1C1C] mb-2">
            Crunching your numbers&hellip;
          </h2>
          <p className="text-[#6B7280]">Applying ATO rates to your period income.</p>
        </div>
      </main>
    );
  }

  if (step === "results") {
    if (!taxEstimate || !currentSheet) return null;

    const rateDisplay = fmtPercent(fromRatePercent(sliderPct));

    return (
      <main className="min-h-screen bg-[#FAF9F6] px-5 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <span className="text-xl font-bold tracking-tight text-[#1C1C1C]">
              sm<span className="text-[#84CC16]">easy</span>
            </span>
            <button
              onClick={() => {
                setStep("landing");
                setParseResult(null);
                setTaxEstimate(null);
                setCurrentSheet(null);
                setHasOtherIncome(null);
                setOtherIncomeBand("none");
              }}
              className="text-sm text-[#6B7280] hover:text-[#1C1C1C]"
            >
              Start over
            </button>
          </div>

          {/* Hero result */}
          <div className="bg-white border border-gray-100 rounded-3xl p-8 mb-5 text-center">
            <p className="text-sm text-[#6B7280] mb-1">Recommended set-aside</p>
            {taxEstimate.isZeroFloor ? (
              <div>
                <p className="text-5xl font-bold text-[#84CC16] mb-2">$0</p>
                <p className="text-sm text-[#6B7280]">
                  Net income is zero or negative — no tax set-aside needed for this period.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-6xl font-bold text-[#84CC16] mb-2">
                  {fmtCurrency(sliderSetAside)}
                </p>
                <p className="text-sm text-[#6B7280]">at {rateDisplay} marginal rate</p>
              </div>
            )}

            {currentSheet.dateRange && (
              <p className="text-sm text-[#6B7280] mt-3">
                Covers {fmtDate(currentSheet.dateRange.start)} –{" "}
                {fmtDate(currentSheet.dateRange.end)}, about {currentSheet.periodMonths} month
                {currentSheet.periodMonths !== 1 ? "s" : ""}
              </p>
            )}
            <p className="text-xs text-[#6B7280] mt-1">
              Estimated using FY{taxEstimate.fyUsed} rates
            </p>
          </div>

          {/* Income breakdown */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-5">
            <h3 className="text-sm font-semibold text-[#1C1C1C] mb-3">Income breakdown</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Income (period)</span>
                <span className="font-medium text-[#1C1C1C]">{fmtCurrency(resultIncome)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Expenses (period)</span>
                <span className="font-medium text-[#1C1C1C]">{fmtCurrency(resultExpenses)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2 mt-1">
                <span className="font-semibold text-[#1C1C1C]">Net income (period)</span>
                <span
                  className={`font-semibold ${taxEstimate.netIncome >= 0 ? "text-[#1C1C1C]" : "text-red-600"}`}
                >
                  {fmtCurrency(taxEstimate.netIncome)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Annualised income</span>
                <span className="font-medium text-[#1C1C1C]">
                  {fmtCurrency(taxEstimate.annualisedIncome)}
                </span>
              </div>
              {hasOtherIncome && taxEstimate.totalIncome > taxEstimate.annualisedIncome && (
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Other income (floor estimate)</span>
                  <span className="font-medium text-[#1C1C1C]">
                    {fmtCurrency(taxEstimate.totalIncome - taxEstimate.annualisedIncome)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Total income (annualised, for bracket)</span>
                <span className="font-medium text-[#1C1C1C]">
                  {fmtCurrency(taxEstimate.totalIncome)}
                </span>
              </div>
            </div>
          </div>

          {/* Rate slider */}
          {!taxEstimate.isZeroFloor && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-[#1C1C1C]">Adjust the rate</h3>
                <span className="text-lg font-bold text-[#84CC16]">{rateDisplay}</span>
              </div>
              <p className="text-xs text-[#6B7280] mb-4">
                We pre-filled your marginal rate. Slide to explore different scenarios.
              </p>
              <input
                type="range"
                min={15}
                max={47}
                step={1}
                value={sliderPct}
                onChange={(e) => setSliderPct(Number(e.target.value))}
                className="w-full accent-[#84CC16]"
              />
              <div className="flex justify-between text-xs text-[#6B7280] mt-1">
                <span>15%</span>
                <span>47%</span>
              </div>
              <div className="mt-4 flex justify-between items-center bg-[#FAF9F6] rounded-xl px-4 py-3">
                <span className="text-sm text-[#6B7280]">Set aside at {rateDisplay}</span>
                <span className="text-xl font-bold text-[#84CC16]">
                  {fmtCurrency(sliderSetAside)}
                </span>
              </div>
            </div>
          )}

          {/* Flags */}
          {flags.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-5">
              <h3 className="text-sm font-semibold text-amber-900 mb-2">Worth a check</h3>
              <div className="space-y-2">
                {flags.map((flag, i) => (
                  <p key={i} className="text-xs text-amber-800">
                    {flag.type === "duplicate" && "⚠️ "}
                    {flag.type === "outlier" && "📊 "}
                    {flag.type === "large-expense" && "💸 "}
                    {flag.message}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* GST + Medicare + disclaimer caveats */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-5 space-y-3 text-xs text-[#6B7280]">
            <div>
              <span className="font-semibold text-[#1C1C1C]">GST: </span>
              Figures assumed GST-exclusive. If you&apos;re registered for GST (generally required
              over $75k annual turnover), bank amounts include GST that isn&apos;t yours — treat
              this number as high. Your BAS is separate.
            </div>
            <div>
              <span className="font-semibold text-[#1C1C1C]">Medicare Levy: </span>
              Includes the standard 2% Medicare Levy.
            </div>
            <div>
              <span className="font-semibold text-[#1C1C1C]">Rough estimate only: </span>
              This is not formal tax advice. Deductible expenses, offsets, and your exact income
              may differ. Verify with your accountant.
            </div>
          </div>

          {/* Copy for accountant */}
          <button
            onClick={handleCopy}
            className="w-full border-2 border-[#84CC16] text-[#1C1C1C] font-semibold py-3 rounded-xl hover:bg-[#f0fdf4] transition-colors mb-3 text-sm"
          >
            {copyDone ? "Copied to clipboard!" : "Copy summary for my accountant"}
          </button>

          <button
            onClick={() => setStep("income")}
            className="w-full text-sm text-[#6B7280] hover:text-[#1C1C1C] py-2"
          >
            ← Adjust income question
          </button>

          {/* Privacy footer */}
          <p className="text-xs text-[#6B7280] text-center mt-8">
            Your file wasn&apos;t kept. We&apos;re not wired to the ATO.
            All calculations ran in your browser.
          </p>
        </div>
      </main>
    );
  }

  return null;
}
