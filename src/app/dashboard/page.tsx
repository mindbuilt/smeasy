"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const API = "https://smeasy-production.up.railway.app";

const C = {
  bg: "#faf8f3", white: "#ffffff", dark: "#211f1a", accent: "#b7e021",
  border: "#e7e2d6", divider: "#f0ede4", muted: "#8a8678", secondary: "#5b584f",
  shiftBg: "#eaf9c8", shiftBorder: "#b7e021", shiftColor: "#3d5200",
  offBg: "#fdf1e0", offColor: "#8a5a10", danger: "#b3261e",
};

interface Roster {
  id: number;
  weekStart: string;
  weekEnd: string;
  status: "draft" | "published";
  publishedAt: string | null;
  createdAt: string;
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

function fmtWeekLabel(weekStart: string): string {
  const [y, m, d] = weekStart.split("-").map(Number);
  const mon = new Date(y, m - 1, d);
  const sun = addDays(mon, 6);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mMon = months[mon.getMonth()];
  const mSun = months[sun.getMonth()];
  if (mon.getMonth() === sun.getMonth()) return `${mon.getDate()}–${sun.getDate()} ${mMon} ${sun.getFullYear()}`;
  return `${mon.getDate()} ${mMon} – ${sun.getDate()} ${mSun} ${sun.getFullYear()}`;
}

function thisWeekStart(): string {
  const mon = getMonday(new Date());
  return `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, "0")}-${String(mon.getDate()).padStart(2, "0")}`;
}


async function apiFetch(path: string, token: string, options?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", ...options?.headers },
  });
  return res.json();
}

export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("My Business");
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [publishing, setPublishing] = useState<number | null>(null);

  const currentWeek = thisWeekStart();

  // Auth check
  useEffect(() => {
    if (typeof window === "undefined") return;
    const tk = localStorage.getItem("smeasy_token");
    const role = localStorage.getItem("smeasy_role");
    if (!tk || role !== "manager") { router.replace("/auth/login"); return; }
    setToken(tk);
    setBusinessName(localStorage.getItem("smeasy_business_name") || "My Business");
  }, [router]);

  const loadRosters = useCallback(async (tk: string) => {
    const data = await apiFetch("/rosters", tk);
    if (Array.isArray(data)) setRosters(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!token) return;
    loadRosters(token);
  }, [token, loadRosters]);

  const thisWeekRoster = rosters.find((r) => r.weekStart.slice(0, 10) === currentWeek);
  const pastRosters = rosters.filter((r) => r.weekStart.slice(0, 10) !== currentWeek);

  async function createThisWeekRoster() {
    if (!token) return;
    setCreating(true);
    const data = await apiFetch("/rosters", token, {
      method: "POST",
      body: JSON.stringify({ weekStart: currentWeek }),
    });
    if (data.id) setRosters((prev) => [data, ...prev]);
    setCreating(false);
  }

  async function publishRoster(rosterId: number, weekStart: string) {
    if (!token) return;
    setPublishing(rosterId);
    // Mark as published in DB
    const updated = await apiFetch(`/rosters/${rosterId}`, token, {
      method: "PUT",
      body: JSON.stringify({ status: "published" }),
    });
    // Send emails
    await apiFetch("/publish", token, {
      method: "POST",
      body: JSON.stringify({ weekStart }),
    });
    if (updated.id) setRosters((prev) => prev.map((r) => r.id === rosterId ? { ...r, status: "published", publishedAt: updated.publishedAt } : r));
    setPublishing(null);
  }

  function downloadCSV(weekStart: string) {
    if (!token) return;
    const url = `${API}/export/csv?week=${weekStart}`;
    const a = document.createElement("a");
    a.href = url;
    a.setAttribute("download", `roster-${weekStart}.csv`);
    // Need auth header — fetch and blob instead
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `roster-${weekStart}.csv`;
        link.click();
      });
  }

  function openRosterWeek(rosterId: number) {
    router.push(`/roster/${rosterId}/edit`);
  }

  function handleLogout() {
    localStorage.removeItem("smeasy_token");
    localStorage.removeItem("smeasy_role");
    localStorage.removeItem("smeasy_business_name");
    router.replace("/auth/login");
  }

  const statusBadge = (status: string) => ({
    fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
    background: status === "published" ? "#e6f4ea" : C.offBg,
    color: status === "published" ? "#1a6b2f" : C.offColor,
    border: `1px solid ${status === "published" ? "#b7dfbf" : "#f0d9ab"}`,
  });

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      {/* Header */}
      <div style={{ height: 58, background: C.white, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/" style={{ display: "block", width: 28, height: 28, background: C.accent, borderRadius: 5, textDecoration: "none", flexShrink: 0 }} />
          <span style={{ fontWeight: 700, fontSize: 16, color: C.dark }}>Smeasy</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/rostering" style={{ fontSize: 13, color: C.secondary, textDecoration: "none", fontWeight: 600 }}>Open roster</Link>
          <button onClick={handleLogout} style={{ fontSize: 13, color: C.muted, background: "none", border: "none", cursor: "pointer" }}>Log out</button>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px" }}>
        {/* Welcome */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: C.dark, margin: "0 0 4px" }}>
            Hi, {businessName}
          </h1>
          <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>Here&apos;s your rostering overview.</p>
        </div>

        {/* This week card */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: "24px 28px", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>This week</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.dark }}>{fmtWeekLabel(currentWeek)}</div>
            </div>
            {thisWeekRoster && <span style={statusBadge(thisWeekRoster.status)}>{thisWeekRoster.status}</span>}
          </div>

          <div style={{ marginTop: 20, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {loading ? (
              <span style={{ fontSize: 13, color: C.muted }}>Loading…</span>
            ) : !thisWeekRoster ? (
              <button onClick={createThisWeekRoster} disabled={creating}
                style={{ padding: "9px 18px", background: C.dark, color: C.white, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: creating ? "default" : "pointer", opacity: creating ? 0.7 : 1 }}>
                {creating ? "Creating…" : "Create roster"}
              </button>
            ) : thisWeekRoster.status === "draft" ? (
              <>
                <button onClick={() => openRosterWeek(thisWeekRoster.id)}
                  style={{ padding: "9px 18px", background: C.dark, color: C.white, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Edit shifts
                </button>
                <button onClick={() => publishRoster(thisWeekRoster.id, currentWeek)} disabled={publishing === thisWeekRoster.id}
                  style={{ padding: "9px 18px", background: C.white, color: C.dark, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: publishing === thisWeekRoster.id ? "default" : "pointer", opacity: publishing === thisWeekRoster.id ? 0.7 : 1 }}>
                  {publishing === thisWeekRoster.id ? "Publishing…" : "Publish & notify staff"}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => openRosterWeek(thisWeekRoster.id)}
                  style={{ padding: "9px 18px", background: C.white, color: C.dark, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  View shifts
                </button>
                <button onClick={() => downloadCSV(currentWeek)}
                  style={{ padding: "9px 18px", background: C.white, color: C.dark, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Download CSV
                </button>
              </>
            )}
          </div>
        </div>

        {/* Past rosters */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: C.dark, margin: 0 }}>Past rosters</h2>
          <button onClick={createThisWeekRoster} style={{ fontSize: 13, color: C.secondary, background: "none", border: `1px solid ${C.border}`, borderRadius: 7, padding: "5px 12px", cursor: "pointer", fontWeight: 600 }}>
            + New roster
          </button>
        </div>

        {loading ? (
          <p style={{ color: C.muted, fontSize: 14 }}>Loading…</p>
        ) : pastRosters.length === 0 ? (
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "28px 24px", textAlign: "center" }}>
            <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>No past rosters yet.</p>
          </div>
        ) : (
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
            {/* Table header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 1fr", padding: "10px 20px", background: C.bg, borderBottom: `1px solid ${C.border}`, gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>WEEK</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>STATUS</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textAlign: "right" }}>ACTIONS</div>
            </div>
            {pastRosters.map((r, idx) => (
              <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1fr 100px 1fr", alignItems: "center", padding: "14px 20px", borderBottom: idx < pastRosters.length - 1 ? `1px solid ${C.divider}` : "none", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.dark }}>{fmtWeekLabel(r.weekStart.slice(0, 10))}</div>
                  {r.publishedAt && (
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                      Published {new Date(r.publishedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                    </div>
                  )}
                </div>
                <div><span style={statusBadge(r.status)}>{r.status}</span></div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
                  <button onClick={() => openRosterWeek(r.id)}
                    style={{ padding: "5px 12px", background: C.white, color: C.dark, border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    View
                  </button>
                  {r.status === "draft" && (
                    <button onClick={() => publishRoster(r.id, r.weekStart.slice(0, 10))} disabled={publishing === r.id}
                      style={{ padding: "5px 12px", background: C.dark, color: C.white, border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: publishing === r.id ? "default" : "pointer", opacity: publishing === r.id ? 0.7 : 1 }}>
                      {publishing === r.id ? "…" : "Publish"}
                    </button>
                  )}
                  {r.status === "published" && (
                    <button onClick={() => downloadCSV(r.weekStart.slice(0, 10))}
                      style={{ padding: "5px 12px", background: C.white, color: C.dark, border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      CSV
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
