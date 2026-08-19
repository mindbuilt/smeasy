"use client";

import { useState, useCallback, useEffect, useRef, DragEvent, ChangeEvent } from "react";
import * as XLSX from "xlsx";
import {
  parseFile,
  parseSheet,
  isLikelyTransfer,
  detectFlags,
  ParsedRow,
  ParseResult,
  Flag,
} from "@/lib/parser";
import { getFYFromDate, getBracketsForFY } from "@/lib/taxBrackets";
import { computeSetAside, TaxEstimate } from "@/lib/taxCalculator";

type Step = "landing" | "upload" | "review" | "income" | "processing" | "results";
type IncomeBand = "under45k" | "45k-135k" | "above135k";
type IncomeAnswer = "only" | "other";

interface ExcludedRow {
  rowIndex: number;
  description: string;
  amount: number;
  reason: string;
  excluded: boolean;
}

const fmtAUD = (n: number) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(n);

const fmtMonth = (d: Date) =>
  new Intl.DateTimeFormat("en-AU", { month: "short", year: "numeric" }).format(d);

function periodLabel(start: Date, end: Date, months: number): string {
  const s = fmtMonth(start);
  const e = fmtMonth(end);
  const periodStr = s === e ? s : `${s} \u2013 ${e}`;
  const monthWord = months === 1 ? "month" : "months";
  return `${periodStr} \u2014 about ${months} ${monthWord}`;
}

function spansTwoFY(start: Date, end: Date): boolean {
  return getFYFromDate(start) !== getFYFromDate(end);
}

const bandLabels: Record<IncomeBand, string> = {
  under45k: "Under $45,000",
  "45k-135k": "$45,000 \u2013 $135,000",
  above135k: "Over $135,000",
};

// ── Design tokens ─────────────────────────────────────────────────────────────

const S = {
  bg: "#f6f4ef",
  dark: "#1f1d19",
  body: "#4a463c",
  secondary: "#6b6558",
  muted: "#8a8474",
  veryMuted: "#a89f8c",
  border: "#e5e1d6",
  callout: "#f0eee6",
  selectedBg: "#f4f9e6",
  successBg: "#eef8d3",
  selectedBorder: "#8fae3f",
  green: "#3a5518",
  darkGreen: "#20321a",
  accent: "#cdf564",
  white: "#ffffff",
  card: "#1f1d19",
};

const primaryBtn = (enabled: boolean): React.CSSProperties => ({
  width: "100%",
  padding: "16px",
  borderRadius: 10,
  border: "none",
  background: enabled ? S.accent : S.border,
  fontSize: 15.5,
  fontWeight: 600,
  color: enabled ? S.darkGreen : S.veryMuted,
  cursor: enabled ? "pointer" : "not-allowed",
  fontFamily: "inherit",
});

const optionCard = (selected: boolean): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "15px 16px",
  borderRadius: 10,
  border: `1.5px solid ${selected ? S.selectedBorder : S.border}`,
  background: selected ? S.selectedBg : S.white,
  cursor: "pointer",
});

const optionDot = (selected: boolean): React.CSSProperties => ({
  width: 18,
  height: 18,
  borderRadius: "50%",
  flexShrink: 0,
  border: `1.5px solid ${selected ? S.green : S.border}`,
  background: selected ? S.accent : "transparent",
});

// ── Main component ────────────────────────────────────────────────────────────

export default function Home() {
  const [step, setStep] = useState<Step>("landing");

  // Upload
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Review
  const [selectedSheetName, setSelectedSheetName] = useState<string>("");
  const [incomeCol, setIncomeCol] = useState<string>("");
  const [expenseCol, setExpenseCol] = useState<string>("");
  const [amountCol, setAmountCol] = useState<string>("");
  const [excludedRows, setExcludedRows] = useState<ExcludedRow[]>([]);
  const workbookRef = useRef<XLSX.WorkBook | null>(null);

  // Income
  const [incomeAnswer, setIncomeAnswer] = useState<IncomeAnswer | null>(null);
  const [incomeBand, setIncomeBand] = useState<IncomeBand | null>(null);

  // Results
  const [estimate, setEstimate] = useState<TaxEstimate | null>(null);
  const [rate, setRate] = useState<number>(28);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [copyDone, setCopyDone] = useState(false);
  const [email, setEmail] = useState("");
  const [emailDone, setEmailDone] = useState(false);

  const processingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (processingTimer.current) clearTimeout(processingTimer.current); }, []);

  // ── File handling ────────────────────────────────────────────────────────

  function getTransferReason(desc: string): string {
    if (/transfer/i.test(desc)) return "Looks like a transfer";
    if (/draw/i.test(desc) || /drawings/i.test(desc)) return "Looks like drawings";
    if (/loan/i.test(desc)) return "Looks like a loan movement";
    if (/credit card payment|cc payment/i.test(desc)) return "Looks like a CC payment";
    if (/bpay/i.test(desc)) return "Looks like a BPay";
    return "Looks like a transfer";
  }

  const processFile = useCallback((f: File) => {
    setFile(f);
    setParseError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buf = e.target?.result as ArrayBuffer;
        const wb = XLSX.read(buf, { type: "array", cellDates: true });
        workbookRef.current = wb;
        const result = parseFile(buf);
        setParseResult(result);
        const sheet = result.selectedSheet;
        setSelectedSheetName(sheet.sheetName);
        setIncomeCol(sheet.columnMapping.incomeCol ?? sheet.columnMapping.amountCol ?? "");
        setExpenseCol(sheet.columnMapping.expenseCol ?? "");
        setAmountCol(sheet.columnMapping.amountCol ?? "");
        const transfers: ExcludedRow[] = sheet.rows
          .filter((r) => r.description && isLikelyTransfer(r.description))
          .map((r) => ({
            rowIndex: r.rowIndex,
            description: r.description,
            amount: r.amount ?? 0,
            reason: getTransferReason(r.description),
            excluded: true,
          }));
        setExcludedRows(transfers);
        setStep("upload");
      } catch {
        setParseError(
          "We couldn't read that file. Try saving it as .csv or .xlsx and uploading again."
        );
      }
    };
    reader.onerror = () =>
      setParseError("Something went wrong reading the file. Try again.");
    reader.readAsArrayBuffer(f);
  }, []);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  }

  function handleSheetChange(name: string) {
    if (!workbookRef.current) return;
    setSelectedSheetName(name);
    const warnings: string[] = [];
    const sheet = parseSheet(workbookRef.current, name, warnings);
    setIncomeCol(sheet.columnMapping.incomeCol ?? sheet.columnMapping.amountCol ?? "");
    setExpenseCol(sheet.columnMapping.expenseCol ?? "");
    setAmountCol(sheet.columnMapping.amountCol ?? "");
  }

  // ── Compute & go to results ──────────────────────────────────────────────

  function startProcessing() {
    const sheet = parseResult?.selectedSheet;
    if (!sheet) return;
    const excludedSet = new Set(excludedRows.filter((r) => r.excluded).map((r) => r.rowIndex));
    const includedRows = sheet.rows.filter((r) => !excludedSet.has(r.rowIndex));
    const income = includedRows
      .filter((r) => (r.amount ?? 0) > 0)
      .reduce((s, r) => s + (r.amount ?? 0), 0);
    const expenses = includedRows
      .filter((r) => (r.amount ?? 0) < 0)
      .reduce((s, r) => s + (r.amount ?? 0), 0);
    const netIncome = income + expenses;
    const { periodMonths, dateRange } = sheet;
    const fy = dateRange ? getFYFromDate(dateRange.end) : "2025-26";
    const fyBrackets = getBracketsForFY(fy);
    const est = computeSetAside({
      netIncome,
      periodMonths,
      otherIncome: 0,
      otherIncomeBand:
        incomeAnswer === "only" ? "none" : (incomeBand ?? "none"),
      fyBrackets,
    });
    setEstimate(est);
    setRate(Math.round(est.marginalRate * 100));
    setFlags(detectFlags(includedRows));
    setStep("processing");
    processingTimer.current = setTimeout(() => setStep("results"), 1600);
  }

  // ── Derived values ───────────────────────────────────────────────────────

  const sheet = parseResult?.selectedSheet;
  const dateRange = sheet?.dateRange ?? null;
  const twoFY = dateRange ? spansTwoFY(dateRange.start, dateRange.end) : false;
  const fy = dateRange ? getFYFromDate(dateRange.end) : "2025-26";
  const excludedSet = new Set(excludedRows.filter((r) => r.excluded).map((r) => r.rowIndex));
  const includedRows = sheet?.rows.filter((r) => !excludedSet.has(r.rowIndex)) ?? [];
  const totalIncome = includedRows
    .filter((r) => (r.amount ?? 0) > 0)
    .reduce((s, r) => s + (r.amount ?? 0), 0);
  const totalExpenses = Math.abs(
    includedRows
      .filter((r) => (r.amount ?? 0) < 0)
      .reduce((s, r) => s + (r.amount ?? 0), 0)
  );
  const balanceColName = sheet?.columnMapping.balanceCol ?? null;
  const setAsideDollars =
    estimate && !estimate.isZeroFloor
      ? Math.max(0, Math.ceil(estimate.netIncome * (rate / 100)))
      : 0;

  // ── Copy summary ─────────────────────────────────────────────────────────

  function copySummary() {
    const excl = excludedRows
      .filter((r) => r.excluded)
      .map((r) => `- ${r.description} (${fmtAUD(Math.abs(r.amount))})`)
      .join("\n");
    const bandLabel = incomeBand ? bandLabels[incomeBand] : null;
    const incomeLine =
      incomeAnswer === "only"
        ? "This business is their only income"
        : `Also earns wage/salary elsewhere (${bandLabel ?? "band not given"})`;
    const periodStr = dateRange
      ? periodLabel(dateRange.start, dateRange.end, sheet?.periodMonths ?? 1)
      : "period unknown";
    const text = [
      "smeasy summary \u2014 for your accountant",
      "",
      `Period covered: ${periodStr}${twoFY ? " (spans two tax years)" : ""}`,
      `FY rates used: ${fy}`,
      estimate?.isZeroFloor
        ? "Estimated tax to set aside: $0 (expenses equal or exceed income)"
        : `Estimated tax to set aside: ${fmtAUD(setAsideDollars)} (using ${rate}% rough rate, incl. 2% Medicare Levy)`,
      incomeLine,
      "",
      `Income: ${fmtAUD(totalIncome)}`,
      `Expenses: ${fmtAUD(totalExpenses)}`,
      `Net income: ${fmtAUD(totalIncome - totalExpenses)}`,
      "",
      excl ? `Excluded as non-income/expense:\n${excl}` : "No rows excluded.",
      "",
      "Note: income tax estimate only. Assumes figures exclude GST. Not a full-year estimate. Not tax advice. Confirm with your accountant.",
    ].join("\n");
    navigator.clipboard.writeText(text).catch(() => {});
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 1800);
  }

  function reset() {
    setStep("landing");
    setFile(null);
    setParseResult(null);
    setParseError(null);
    setExcludedRows([]);
    setIncomeAnswer(null);
    setIncomeBand(null);
    setEstimate(null);
    setEmail("");
    setEmailDone(false);
    workbookRef.current = null;
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: "100vh",
        background: S.bg,
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        color: S.dark,
        display: "flex",
        justifyContent: "center",
        padding: "0 0 40px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          padding: "28px 20px 0",
          boxSizing: "border-box",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.01em" }}>smeasy</span>
          <span
            style={{ display: "inline-block", width: 6, height: 6, borderRadius: 2, background: S.accent }}
          />
        </div>

        {/* ── LANDING ────────────────────────────────────────────────── */}
        {step === "landing" && (
          <div style={{ marginTop: 28 }}>
            <h1 style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700, letterSpacing: "-0.015em", margin: "0 0 16px" }}>
              Know what you owe, before it&apos;s due.
            </h1>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: S.body, margin: "0 0 20px" }}>
              Upload the spreadsheet you already keep, and we&apos;ll tell you roughly what to put
              aside for tax — and flag anything that looks off. No account, no setup, and
              we&apos;re not connected to the ATO.
            </p>
            <div style={{ borderLeft: "2px solid #d6d1c3", paddingLeft: 14, marginBottom: 28 }}>
              <div style={{ fontSize: 13.5, lineHeight: 1.6, color: S.secondary }}>
                We&apos;re an independent tool — we don&apos;t report to anyone, and we don&apos;t
                keep your file. Your spreadsheet is read once, then it&apos;s gone.
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.55, color: S.veryMuted, marginTop: 8 }}>
                Built for sole traders. This is for sole traders and side hustles taxed at personal
                rates. If you run a company (Pty Ltd) or a trust, your tax works differently and
                this won&apos;t be accurate for you.
              </div>
            </div>
            <button onClick={() => setStep("upload")} style={primaryBtn(true)}>
              Upload your spreadsheet
            </button>
            <div style={{ textAlign: "center", fontSize: 12.5, color: S.muted, marginTop: 12 }}>
              Excel or CSV · takes about 30 seconds
            </div>
          </div>
        )}

        {/* ── UPLOAD ─────────────────────────────────────────────────── */}
        {step === "upload" && (
          <div style={{ marginTop: 20 }}>
            <div
              onClick={() => { setStep("landing"); setFile(null); setParseError(null); }}
              style={{ fontSize: 13, color: S.muted, cursor: "pointer", marginBottom: 18 }}
            >
              ← Back
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.01em", margin: "0 0 8px" }}>
              Upload your spreadsheet
            </h1>
            <p style={{ fontSize: 14.5, lineHeight: 1.6, color: S.secondary, margin: "0 0 20px" }}>
              Export it from your bank, your accounting app, or wherever you keep your books —
              Excel or CSV both work.
            </p>

            {/* Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                border: `1.5px dashed ${file || dragOver ? S.selectedBorder : "#d6d1c3"}`,
                background: file || dragOver ? S.selectedBg : S.white,
                borderRadius: 14,
                padding: "36px 20px",
                textAlign: "center",
                cursor: "pointer",
              }}
            >
              {!file ? (
                <>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: S.dark, marginBottom: 4 }}>
                    Drag your file here, or tap to choose
                  </div>
                  <div style={{ fontSize: 12.5, color: S.muted }}>.xlsx, .xls or .csv</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: S.dark, marginBottom: 4 }}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: 12.5, color: S.muted }}>Ready</div>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />

            {parseError && (
              <div
                style={{
                  marginTop: 14,
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "#fff0f0",
                  border: "1px solid #ffd0d0",
                  fontSize: 13,
                  color: "#8b2020",
                  lineHeight: 1.5,
                }}
              >
                {parseError}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, margin: "20px 0 26px" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: S.accent, flexShrink: 0, marginTop: 6 }} />
              <div style={{ fontSize: 13, lineHeight: 1.55, color: S.secondary }}>
                This gets read once to pull out the numbers — we don&apos;t save it anywhere.
              </div>
            </div>

            <button
              onClick={() => { if (file && !parseError) setStep("review"); }}
              style={primaryBtn(!!file && !parseError)}
            >
              Read my spreadsheet
            </button>
          </div>
        )}

        {/* ── REVIEW & EXCLUDE ───────────────────────────────────────── */}
        {step === "review" && sheet && (
          <div style={{ marginTop: 20 }}>
            <div
              onClick={() => setStep("upload")}
              style={{ fontSize: 13, color: S.muted, cursor: "pointer", marginBottom: 18 }}
            >
              ← Back
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em", margin: "0 0 8px" }}>
              Quick check before we do the maths
            </h1>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: S.secondary, margin: "0 0 20px" }}>
              We&apos;ve had a look at your file. Before we work out your tax, have a quick squiz
              and fix anything we&apos;ve got wrong.
            </p>

            {/* Sheet picker */}
            {parseResult && parseResult.sheets.length > 1 && (
              <>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: S.muted, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 10 }}>
                  Which tab has your transactions
                </div>
                <div style={{ background: S.white, border: `1px solid ${S.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
                  <div style={{ fontSize: 13, color: S.body, marginBottom: 10 }}>
                    Your file has a few tabs. Which one has your transactions?
                  </div>
                  <select
                    value={selectedSheetName}
                    onChange={(e) => handleSheetChange(e.target.value)}
                    style={{ width: "100%", padding: "9px 10px", borderRadius: 7, border: `1px solid ${S.border}`, fontSize: 13.5, background: S.bg, color: S.dark, fontFamily: "inherit" }}
                  >
                    {parseResult.sheets.map((s) => (
                      <option key={s.name} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Column mapping */}
            <div style={{ fontSize: 12.5, fontWeight: 600, color: S.muted, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 10 }}>
              How we read your columns
            </div>
            <div style={{ background: S.white, border: `1px solid ${S.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 14, display: "flex", flexDirection: "column", gap: 12 }}>
              {sheet.columnMapping.incomeCol && sheet.columnMapping.expenseCol ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ fontSize: 13.5, color: S.body }}>Money in</span>
                    <select value={incomeCol} onChange={(e) => setIncomeCol(e.target.value)} style={{ padding: "7px 10px", borderRadius: 7, border: `1px solid ${S.border}`, fontSize: 13, background: S.bg, color: S.dark, fontFamily: "inherit" }}>
                      {sheet.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ fontSize: 13.5, color: S.body }}>Money out</span>
                    <select value={expenseCol} onChange={(e) => setExpenseCol(e.target.value)} style={{ padding: "7px 10px", borderRadius: 7, border: `1px solid ${S.border}`, fontSize: 13, background: S.bg, color: S.dark, fontFamily: "inherit" }}>
                      {sheet.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ fontSize: 13.5, color: S.body }}>Amount column</span>
                  <select value={amountCol} onChange={(e) => setAmountCol(e.target.value)} style={{ padding: "7px 10px", borderRadius: 7, border: `1px solid ${S.border}`, fontSize: 13, background: S.bg, color: S.dark, fontFamily: "inherit" }}>
                    {sheet.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Balance column notice */}
            {balanceColName && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: S.callout, borderRadius: 10, padding: "12px 14px", marginBottom: 20 }}>
                <span style={{ fontSize: 13, color: S.green, flexShrink: 0 }}>✓</span>
                <div style={{ fontSize: 12.5, lineHeight: 1.5, color: S.body }}>
                  We spotted a running balance column ({balanceColName}) — we&apos;re leaving that out (it&apos;s not income). Ignored.
                </div>
              </div>
            )}

            {/* Period */}
            {dateRange && (
              <div style={{ background: S.white, border: `1px solid ${S.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 22 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: S.dark, marginBottom: 4 }}>
                  This file covers {periodLabel(dateRange.start, dateRange.end, sheet.periodMonths)}.
                </div>
                <div style={{ fontSize: 12.5, color: S.muted, lineHeight: 1.5 }}>
                  Heads up: your set-aside below is for this period only, not a full year.
                </div>
              </div>
            )}

            {/* Two-FY warning */}
            {twoFY && (
              <div style={{ background: S.callout, borderRadius: 10, padding: "12px 14px", marginBottom: 22 }}>
                <div style={{ fontSize: 12.5, lineHeight: 1.5, color: S.body }}>
                  This data spans two tax years. We&apos;re treating it as one continuous period for this estimate.
                </div>
              </div>
            )}

            {/* Excluded rows */}
            {excludedRows.length > 0 && (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: S.muted, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    Not income or expenses
                  </div>
                  <div style={{ fontSize: 12, color: S.muted }}>
                    {excludedRows.filter((r) => r.excluded).length} excluded
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 1, background: S.border, borderRadius: 12, overflow: "hidden", marginBottom: 18 }}>
                  {excludedRows.map((row) => (
                    <div
                      key={row.rowIndex}
                      onClick={() =>
                        setExcludedRows((prev) =>
                          prev.map((r) => r.rowIndex === row.rowIndex ? { ...r, excluded: !r.excluded } : r)
                        )
                      }
                      style={{ background: S.white, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                    >
                      <span
                        style={{
                          width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 12, color: S.darkGreen,
                          border: `1.5px solid ${row.excluded ? "#d6d1c3" : S.selectedBorder}`,
                          background: row.excluded ? S.bg : S.accent,
                        }}
                      >
                        {!row.excluded ? "✓" : ""}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500, color: S.dark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {row.description}
                        </div>
                        {row.excluded && (
                          <div style={{ fontSize: 11.5, color: S.muted, marginTop: 2 }}>{row.reason}</div>
                        )}
                      </div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: row.excluded ? S.veryMuted : S.dark, whiteSpace: "nowrap" }}>
                        {row.amount >= 0 ? "+" : "\u2212"}{fmtAUD(Math.abs(row.amount))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div style={{ background: S.callout, borderRadius: 10, padding: "14px 16px", marginBottom: 26 }}>
              <div style={{ fontSize: 13, lineHeight: 1.55, color: S.body }}>
                <strong>Why this matters:</strong> if you move $2,000 from your business account to your personal one, that&apos;s not income — but a spreadsheet can&apos;t tell. Taking these out keeps your estimate from being overblown.
              </div>
            </div>

            <button onClick={() => setStep("income")} style={primaryBtn(true)}>
              Looks right — work out my tax
            </button>
          </div>
        )}

        {/* ── ABOUT YOUR INCOME ──────────────────────────────────────── */}
        {step === "income" && (
          <div style={{ marginTop: 60 }}>
            <div onClick={() => setStep("review")} style={{ fontSize: 13, color: S.muted, cursor: "pointer", marginBottom: 18 }}>
              ← Back
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.01em", margin: "0 0 6px" }}>
              One last thing
            </h1>
            <div style={{ fontSize: 12, color: S.veryMuted, marginBottom: 14 }}>
              Built for sole traders and side hustles taxed at personal rates.
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: S.body, margin: "0 0 22px" }}>
              Is this business your only income this year — or do you also earn a wage or salary somewhere else?
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {(["only", "other"] as IncomeAnswer[]).map((key) => (
                <div
                  key={key}
                  onClick={() => { setIncomeAnswer(key); if (key === "only") setIncomeBand(null); }}
                  style={optionCard(incomeAnswer === key)}
                >
                  <span style={optionDot(incomeAnswer === key)} />
                  <span style={{ fontSize: 14.5, fontWeight: 500, color: S.dark }}>
                    {key === "only" ? "This is my only income" : "I also earn a wage/salary elsewhere"}
                  </span>
                </div>
              ))}
            </div>

            {incomeAnswer === "other" && (
              <>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: S.dark, marginBottom: 10 }}>
                  Roughly what do you earn from that job, before tax?
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                  {(["under45k", "45k-135k", "above135k"] as IncomeBand[]).map((band) => (
                    <div key={band} onClick={() => setIncomeBand(band)} style={optionCard(incomeBand === band)}>
                      <span style={optionDot(incomeBand === band)} />
                      <span style={{ fontSize: 14.5, fontWeight: 500, color: S.dark }}>{bandLabels[band]}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div style={{ background: S.callout, borderRadius: 10, padding: "14px 16px", marginBottom: 28 }}>
              <div style={{ fontSize: 13, lineHeight: 1.55, color: S.body }}>
                This matters a lot. If you&apos;ve already got a job, your business profit stacks on top of it and gets taxed higher — so knowing roughly what you earn there lets us set aside the right amount, not just a guess.
              </div>
            </div>

            <button
              onClick={() => {
                if (incomeAnswer === "only" || (incomeAnswer === "other" && !!incomeBand)) {
                  startProcessing();
                }
              }}
              style={primaryBtn(incomeAnswer === "only" || (incomeAnswer === "other" && !!incomeBand))}
            >
              Show me where I stand
            </button>
          </div>
        )}

        {/* ── PROCESSING ─────────────────────────────────────────────── */}
        {step === "processing" && (
          <div style={{ marginTop: 100, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div
              style={{
                width: 44, height: 44, borderRadius: "50%",
                border: `3px solid ${S.border}`, borderTopColor: S.accent,
                animation: "smspin 0.9s linear infinite",
                marginBottom: 26,
              }}
            />
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>
              Working out where you stand…
            </div>
            <div style={{ fontSize: 13.5, color: S.muted }}>
              Nothing&apos;s being saved while we do this.
            </div>
          </div>
        )}

        {/* ── RESULTS ────────────────────────────────────────────────── */}
        {step === "results" && estimate && (
          <div style={{ marginTop: 20 }}>
            <h1 style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em", margin: "0 0 18px" }}>
              Here&apos;s where you stand
            </h1>

            {/* Hero card */}
            <div style={{ background: S.card, borderRadius: 16, padding: "26px 24px", marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: S.accent, letterSpacing: "0.02em", marginBottom: 8 }}>
                Put aside for tax
              </div>
              {estimate.isZeroFloor ? (
                <>
                  <div style={{ fontSize: 24, fontWeight: 700, color: S.white, letterSpacing: "-0.01em", lineHeight: 1.3, marginBottom: 8 }}>
                    Nothing to set aside right now
                  </div>
                  <div style={{ fontSize: 13, color: "#c9c2ae", lineHeight: 1.55 }}>
                    Your recorded business expenses equal or exceed your income for this period, so there&apos;s no income tax to put aside. Still worth keeping an eye on as things change.
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 42, fontWeight: 700, color: S.white, letterSpacing: "-0.02em", lineHeight: 1 }}>
                    {fmtAUD(setAsideDollars)}
                  </div>
                  <div style={{ fontSize: 13, color: "#c9c2ae", marginTop: 10, lineHeight: 1.55 }}>
                    {dateRange
                      ? `For ${periodLabel(dateRange.start, dateRange.end, sheet?.periodMonths ?? 1)}, based on your income and expenses minus the bits we took out.`
                      : "Based on your income and expenses minus the bits we took out."}{" "}
                    It&apos;s a rough guide to keep you safe — not exact, and not tax advice. Worth confirming with your accountant.
                  </div>
                  <div style={{ fontSize: 11.5, color: "#8a8474", marginTop: 10 }}>
                    Estimated using FY{fy} tax rates. Includes the standard 2% Medicare Levy.
                  </div>
                </>
              )}
            </div>

            {/* Rate slider */}
            {!estimate.isZeroFloor && (
              <div style={{ background: S.white, border: `1px solid ${S.border}`, borderRadius: 12, padding: "16px 18px", marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: S.body, marginBottom: 10 }}>
                  We&apos;ve used <strong>{rate}%</strong> based on what you told us. Slide it if your situation&apos;s different.
                </div>
                <input
                  type="range"
                  min={15}
                  max={47}
                  step={1}
                  value={rate}
                  onChange={(e) => setRate(parseInt(e.target.value, 10))}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: S.veryMuted, marginTop: 4 }}>
                  <span>15%</span>
                  <span>47%</span>
                </div>
              </div>
            )}

            {/* Income breakdown */}
            <div style={{ background: S.white, border: `1px solid ${S.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: S.body }}>
                <span>Income</span>
                <span style={{ fontWeight: 600, color: S.green }}>{fmtAUD(totalIncome)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: S.body }}>
                <span>Expenses</span>
                <span style={{ fontWeight: 600 }}>\u2212{fmtAUD(totalExpenses)}</span>
              </div>
              <div style={{ borderTop: `1px solid ${S.border}`, paddingTop: 8, marginTop: 2, display: "flex", justifyContent: "space-between", fontSize: 13.5 }}>
                <span style={{ fontWeight: 600 }}>Net income</span>
                <span style={{ fontWeight: 700 }}>{fmtAUD(totalIncome - totalExpenses)}</span>
              </div>
            </div>

            {/* GST callout */}
            <div style={{ display: "flex", gap: 10, background: S.callout, borderRadius: 10, padding: "14px 16px", marginBottom: 24 }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>ⓘ</span>
              <div style={{ fontSize: 12.5, lineHeight: 1.55, color: S.body }}>
                Heads up on GST: this is income tax only, and we&apos;ve assumed your figures don&apos;t include GST. If you&apos;re registered for GST (usually once you&apos;re over $75,000 annual turnover), your bank amounts include GST that isn&apos;t yours to keep — treat this number as on the high side, and remember your BAS is separate.
              </div>
            </div>

            {/* Flags */}
            {flags.length > 0 && (
              <>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: S.muted, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 10 }}>
                  Worth a look
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
                  {flags.map((flag, i) => (
                    <div key={i} style={{ background: S.white, border: `1px solid ${S.border}`, borderRadius: 12, padding: "16px 18px" }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: S.dark, marginBottom: 4 }}>
                        Worth a look:{" "}
                        {flag.type === "duplicate" ? "possible double-up"
                          : flag.type === "outlier" ? "unusual spike"
                          : "notably large expense"}
                      </div>
                      <div style={{ fontSize: 13.5, lineHeight: 1.55, color: S.secondary }}>
                        {flag.message}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {flags.length === 0 && (
              <div style={{ fontSize: 13.5, color: S.muted, marginBottom: 22, padding: "14px 16px", background: S.white, border: `1px solid ${S.border}`, borderRadius: 12 }}>
                Nothing flagged — your data looks clean.
              </div>
            )}

            {/* Copy for accountant */}
            <button
              onClick={copySummary}
              style={{ width: "100%", padding: 14, borderRadius: 10, border: `1px solid ${S.border}`, background: S.white, fontSize: 14, fontWeight: 600, color: S.dark, cursor: "pointer", marginBottom: 20, fontFamily: "inherit" }}
            >
              {copyDone ? "Copied ✓" : "Copy a summary for my accountant"}
            </button>

            {/* File deleted notice */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: S.successBg, borderRadius: 10, padding: "14px 16px", marginBottom: 28 }}>
              <span style={{ fontSize: 16, color: S.green, flexShrink: 0 }}>✓</span>
              <div style={{ fontSize: 13, color: S.green, lineHeight: 1.5 }}>
                Your file&apos;s been deleted — this session was all there was. We&apos;re not wired to the ATO.
              </div>
            </div>

            {/* Email capture */}
            <div style={{ borderTop: `1px solid ${S.border}`, paddingTop: 22 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                Want to check this each month?
              </div>
              <div style={{ fontSize: 13, color: S.muted, marginBottom: 12, lineHeight: 1.5 }}>
                Leave your email and we&apos;ll let you know if we build a monthly version. No spam, no account.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@business.com.au"
                  style={{ flex: 1, minWidth: 0, padding: "11px 12px", borderRadius: 8, border: `1px solid ${S.border}`, fontSize: 13.5, background: S.white, color: S.dark, fontFamily: "inherit" }}
                />
                <button
                  onClick={() => { if (email) setEmailDone(true); }}
                  style={{ padding: "11px 16px", borderRadius: 8, border: `1px solid ${S.border}`, background: S.white, fontSize: 13.5, fontWeight: 600, color: S.dark, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}
                >
                  {emailDone ? "Saved ✓" : "Notify me"}
                </button>
              </div>
            </div>

            <div
              onClick={reset}
              style={{ textAlign: "center", fontSize: 13, color: S.muted, marginTop: 30, cursor: "pointer", textDecoration: "underline" }}
            >
              Check another spreadsheet
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
