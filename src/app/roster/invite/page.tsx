"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const API = "https://smeasy-production.up.railway.app";

const C = {
  bg: "#faf8f3",
  white: "#ffffff",
  dark: "#211f1a",
  accent: "#b7e021",
  border: "#e7e2d6",
  divider: "#f0ede4",
  muted: "#8a8678",
  secondary: "#5b584f",
  shiftBg: "#eaf9c8",
  shiftBorder: "#b7e021",
  shiftColor: "#3d5200",
  offBg: "#fdf1e0",
  offColor: "#8a5a10",
  danger: "#b3261e",
};

interface ShiftData {
  id: number;
  staffId: number;
  staffName: string;
  date: string;
  dateLabel: string;
  startTime: string;
  endTime: string;
  role: string;
  mine: boolean;
}

interface RosterData {
  roster: { id: number; weekStart: string; weekEnd: string; status: string };
  staff: { id: number; name: string };
  business: string;
  shifts: ShiftData[];
}

function fmtWeek(start: string, end: string): string {
  function parse(s: string) {
    const iso = s.slice(0, 10);
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const s = parse(start);
  const e = parse(end);
  return `${s.getDate()} ${MONTHS[s.getMonth()]} – ${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}`;
}

function fmtShiftDate(dateStr: string): string {
  const iso = dateStr.slice(0, 10);
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${DAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

// ---- Spinner ----
function Spinner({ text }: { text: string }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: C.muted, fontSize: 16 }}>{text}</p>
    </div>
  );
}

// ---- Logo ----
function Logo() {
  return (
    <span style={{
      display: "inline-block",
      background: C.accent,
      color: C.dark,
      fontWeight: 800,
      fontSize: 15,
      padding: "3px 10px",
      borderRadius: 6,
      letterSpacing: "-0.5px",
    }}>
      Smeasy
    </span>
  );
}

// ---- Back button ----
function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        color: C.secondary,
        fontSize: 14,
        cursor: "pointer",
        padding: "8px 0",
        display: "flex",
        alignItems: "center",
        gap: 4,
        minHeight: 44,
      }}
    >
      ← Back to roster
    </button>
  );
}

// ---- Roster View ----
function RosterView({
  data,
  weekLabel,
  onTimeOff,
  onSwap,
}: {
  data: RosterData;
  weekLabel: string;
  onTimeOff: () => void;
  onSwap: () => void;
}) {
  const myShifts = data.shifts.filter((s) => s.mine);

  return (
    <div>
      <p style={{ margin: "0 0 20px", color: C.secondary, fontSize: 15, lineHeight: 1.5 }}>
        Hi <strong style={{ color: C.dark }}>{data.staff.name.split(" ")[0]}</strong>, here&apos;s your roster for {weekLabel}
      </p>

      {data.shifts.length === 0 ? (
        <p style={{ color: C.muted, fontSize: 14, margin: "0 0 24px" }}>No shifts scheduled this week.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {data.shifts.map((shift) => (
            <div
              key={shift.id}
              style={{
                background: shift.mine ? C.shiftBg : C.white,
                border: `1.5px solid ${shift.mine ? C.shiftBorder : C.border}`,
                borderRadius: 10,
                padding: "12px 14px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: shift.mine ? C.shiftColor : C.dark, marginBottom: 2 }}>
                    {fmtShiftDate(shift.date)}
                  </div>
                  <div style={{ fontSize: 14, color: shift.mine ? C.shiftColor : C.secondary }}>
                    {shift.startTime}–{shift.endTime}
                    <span style={{ color: C.muted, marginLeft: 6 }}>({shift.role})</span>
                  </div>
                </div>
                <div style={{
                  fontSize: 13,
                  color: shift.mine ? C.shiftColor : C.muted,
                  fontWeight: shift.mine ? 600 : 400,
                  textAlign: "right",
                  flexShrink: 0,
                }}>
                  {shift.staffName}
                  {shift.mine && (
                    <span style={{
                      display: "block",
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.shiftColor,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}>You</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={onTimeOff}
          style={{
            background: C.accent,
            color: C.dark,
            border: "none",
            borderRadius: 10,
            padding: "14px 20px",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            minHeight: 48,
            width: "100%",
          }}
        >
          Request time off
        </button>
        {myShifts.length > 0 && (
          <button
            onClick={onSwap}
            style={{
              background: C.white,
              color: C.dark,
              border: `1.5px solid ${C.border}`,
              borderRadius: 10,
              padding: "14px 20px",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              minHeight: 48,
              width: "100%",
            }}
          >
            Offer a swap
          </button>
        )}
      </div>
    </div>
  );
}

// ---- Time Off View ----
function TimeOffView({ token, onBack }: { token: string; onBack: () => void }) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const r = await fetch(`${API}/public/roster/${token}/timeoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateFrom, dateTo, note }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || "Something went wrong"); return; }
      setSuccess(true);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div>
        <BackBtn onClick={onBack} />
        <div style={{
          background: C.shiftBg,
          border: `1.5px solid ${C.shiftBorder}`,
          borderRadius: 12,
          padding: "20px 18px",
          marginTop: 16,
        }}>
          <p style={{ margin: 0, fontWeight: 700, color: C.shiftColor, fontSize: 16 }}>Request submitted!</p>
          <p style={{ margin: "6px 0 16px", color: C.shiftColor, fontSize: 14 }}>Your manager will be in touch.</p>
          <button
            onClick={onBack}
            style={{
              background: C.accent,
              color: C.dark,
              border: "none",
              borderRadius: 8,
              padding: "12px 18px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              minHeight: 44,
            }}
          >
            Back to roster
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <BackBtn onClick={onBack} />
      <h2 style={{ margin: "4px 0 20px", fontSize: 20, fontWeight: 800, color: C.dark }}>Request time off</h2>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.secondary, marginBottom: 6 }}>
            From
          </label>
          <input
            type="date"
            required
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); if (dateTo && e.target.value > dateTo) setDateTo(e.target.value); }}
            style={{
              width: "100%",
              padding: "12px 14px",
              border: `1.5px solid ${C.border}`,
              borderRadius: 8,
              fontSize: 15,
              background: C.white,
              color: C.dark,
              boxSizing: "border-box",
              minHeight: 48,
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.secondary, marginBottom: 6 }}>
            To
          </label>
          <input
            type="date"
            required
            min={dateFrom}
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px",
              border: `1.5px solid ${C.border}`,
              borderRadius: 8,
              fontSize: 15,
              background: C.white,
              color: C.dark,
              boxSizing: "border-box",
              minHeight: 48,
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.secondary, marginBottom: 6 }}>
            Note <span style={{ fontWeight: 400, color: C.muted }}>(optional)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Any details for your manager…"
            rows={3}
            style={{
              width: "100%",
              padding: "12px 14px",
              border: `1.5px solid ${C.border}`,
              borderRadius: 8,
              fontSize: 15,
              background: C.white,
              color: C.dark,
              boxSizing: "border-box",
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
        </div>

        {error && (
          <p style={{ margin: 0, color: C.danger, fontSize: 14 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            background: submitting ? C.border : C.accent,
            color: C.dark,
            border: "none",
            borderRadius: 10,
            padding: "14px 20px",
            fontSize: 15,
            fontWeight: 700,
            cursor: submitting ? "not-allowed" : "pointer",
            minHeight: 48,
            width: "100%",
          }}
        >
          {submitting ? "Submitting…" : "Submit request"}
        </button>
      </form>
    </div>
  );
}

// ---- Swap View ----
function SwapView({ token, data, onBack }: { token: string; data: RosterData; onBack: () => void }) {
  const myShifts = data.shifts.filter((s) => s.mine);
  const otherShifts = data.shifts.filter((s) => !s.mine);

  const [myShiftId, setMyShiftId] = useState(myShifts[0]?.id.toString() ?? "");
  const [theirShiftId, setTheirShiftId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function shiftLabel(s: ShiftData, includeStaff: boolean) {
    const d = fmtShiftDate(s.date);
    const base = `${d}, ${s.startTime}–${s.endTime} (${s.role})`;
    return includeStaff ? `${s.staffName} — ${base}` : base;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const r = await fetch(`${API}/public/roster/${token}/swap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          myShiftId: Number(myShiftId),
          theirShiftId: theirShiftId ? Number(theirShiftId) : undefined,
        }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Something went wrong"); return; }
      setSuccess(true);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div>
        <BackBtn onClick={onBack} />
        <div style={{
          background: C.shiftBg,
          border: `1.5px solid ${C.shiftBorder}`,
          borderRadius: 12,
          padding: "20px 18px",
          marginTop: 16,
        }}>
          <p style={{ margin: 0, fontWeight: 700, color: C.shiftColor, fontSize: 16 }}>Swap request submitted!</p>
          <p style={{ margin: "6px 0 16px", color: C.shiftColor, fontSize: 14 }}>Your manager will be in touch.</p>
          <button
            onClick={onBack}
            style={{
              background: C.accent,
              color: C.dark,
              border: "none",
              borderRadius: 8,
              padding: "12px 18px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              minHeight: 44,
            }}
          >
            Back to roster
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <BackBtn onClick={onBack} />
      <h2 style={{ margin: "4px 0 20px", fontSize: 20, fontWeight: 800, color: C.dark }}>Offer a swap</h2>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.secondary, marginBottom: 6 }}>
            My shift
          </label>
          <select
            required
            value={myShiftId}
            onChange={(e) => setMyShiftId(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px",
              border: `1.5px solid ${C.border}`,
              borderRadius: 8,
              fontSize: 14,
              background: C.white,
              color: C.dark,
              boxSizing: "border-box",
              minHeight: 48,
            }}
          >
            {myShifts.map((s) => (
              <option key={s.id} value={s.id.toString()}>
                {shiftLabel(s, false)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.secondary, marginBottom: 6 }}>
            Their shift <span style={{ fontWeight: 400, color: C.muted }}>(optional — leave blank for open swap)</span>
          </label>
          <select
            value={theirShiftId}
            onChange={(e) => setTheirShiftId(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px",
              border: `1.5px solid ${C.border}`,
              borderRadius: 8,
              fontSize: 14,
              background: C.white,
              color: C.dark,
              boxSizing: "border-box",
              minHeight: 48,
            }}
          >
            <option value="">— Open swap (no specific shift) —</option>
            {otherShifts.map((s) => (
              <option key={s.id} value={s.id.toString()}>
                {shiftLabel(s, true)}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p style={{ margin: 0, color: C.danger, fontSize: 14 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            background: submitting ? C.border : C.accent,
            color: C.dark,
            border: "none",
            borderRadius: 10,
            padding: "14px 20px",
            fontSize: 15,
            fontWeight: 700,
            cursor: submitting ? "not-allowed" : "pointer",
            minHeight: 48,
            width: "100%",
          }}
        >
          {submitting ? "Submitting…" : "Submit swap request"}
        </button>
      </form>
    </div>
  );
}

// ---- Inner page (uses useSearchParams) ----
function RosterInviteInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RosterData | null>(null);
  const [tokenError, setTokenError] = useState("");
  const [networkError, setNetworkError] = useState("");
  const [view, setView] = useState<"roster" | "timeoff" | "swap">("roster");

  useEffect(() => {
    if (!token) {
      setTokenError("No token provided.");
      setLoading(false);
      return;
    }
    fetch(`${API}/public/roster/${token}`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) { setTokenError(json.error || "Invalid link"); return; }
        setData(json);
      })
      .catch(() => setNetworkError("Could not reach the server. Please try again."))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <Spinner text="Loading your roster…" />;

  if (networkError) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <p style={{ color: C.danger, fontSize: 15, textAlign: "center" }}>{networkError}</p>
      </div>
    );
  }

  if (tokenError || !data) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{
          background: C.white,
          border: `1.5px solid ${C.border}`,
          borderRadius: 14,
          padding: "32px 24px",
          maxWidth: 360,
          width: "100%",
          textAlign: "center",
        }}>
          <Logo />
          <p style={{ fontWeight: 700, fontSize: 17, color: C.dark, margin: "20px 0 8px" }}>
            {tokenError || "Link invalid or expired"}
          </p>
          <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>Contact your manager for a new link.</p>
        </div>
      </div>
    );
  }

  const weekLabel = fmtWeek(data.roster.weekStart, data.roster.weekEnd);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div style={{
        background: C.white,
        borderBottom: `1.5px solid ${C.border}`,
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}>
        <Logo />
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{data.business}</div>
          <div style={{ fontSize: 12, color: C.muted }}>{weekLabel}</div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px 48px" }}>
        {view === "roster" && (
          <RosterView
            data={data}
            weekLabel={weekLabel}
            onTimeOff={() => setView("timeoff")}
            onSwap={() => setView("swap")}
          />
        )}
        {view === "timeoff" && (
          <TimeOffView token={token} onBack={() => setView("roster")} />
        )}
        {view === "swap" && (
          <SwapView token={token} data={data} onBack={() => setView("roster")} />
        )}
      </div>
    </div>
  );
}

// ---- Default export wrapped in Suspense ----
export default function RosterInvitePage() {
  return (
    <Suspense fallback={<Spinner text="Loading your roster…" />}>
      <RosterInviteInner />
    </Suspense>
  );
}
