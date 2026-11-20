"use client";

// A short memory of recent problems in this tab (JS errors, failed requests), sent with beta
// feedback so a bug report comes with some context. Only messages, status codes and URL paths:
// never request bodies, headers, tokens or query strings.

const MAX = 20;
const recent: string[] = [];
let installed = false;

function note(line: string) {
  recent.push(`${new Date().toISOString().slice(11, 19)} ${line.slice(0, 280)}`);
  if (recent.length > MAX) recent.shift();
}

/** Path only: drops the query string and hash, which can hold tokens. */
function pathOf(input: RequestInfo | URL): string {
  try {
    const u = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, window.location.href);
    return `${u.host === window.location.host ? "" : u.host}${u.pathname}`;
  } catch { return "(request)"; }
}

export function installDiagnostics() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (e) => note(`error: ${e.message}`));
  window.addEventListener("unhandledrejection", (e) => note(`unhandled: ${e.reason instanceof Error ? e.reason.message : String(e.reason)}`));

  const origError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    note(`console: ${args.map((a) => (a instanceof Error ? a.message : typeof a === "string" ? a : "[object]")).join(" ")}`);
    origError(...args);
  };

  const origFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    try {
      const res = await origFetch(input, init);
      if (!res.ok) note(`${(init?.method ?? "GET").toUpperCase()} ${pathOf(input)} → ${res.status}`);
      return res;
    } catch (e) {
      note(`${(init?.method ?? "GET").toUpperCase()} ${pathOf(input)} → failed (${e instanceof Error ? e.message : "network"})`);
      throw e;
    }
  };
}

export const recentProblems = () => [...recent];
