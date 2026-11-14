// Fetches Australian public holidays (by state) from the Nager.Date public
// holiday calendar and writes src/data/au-holidays.json. Runs before each
// build; if the fetch fails, the committed file is kept so builds never break.
import { writeFileSync, readFileSync } from "node:fs";

const OUT = new URL("../src/data/au-holidays.json", import.meta.url);
const year = new Date().getFullYear();
const years = [year - 1, year, year + 1, year + 2];

try {
  const all = [];
  for (const y of years) {
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${y}/AU`);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${y}`);
    for (const h of await res.json()) {
      all.push({
        date: h.date,
        name: h.localName,
        states: h.global || !h.counties ? [] : h.counties.map((c) => c.replace("AU-", "")),
      });
    }
  }
  if (all.length < 40) throw new Error(`only ${all.length} holidays returned`);
  writeFileSync(OUT, JSON.stringify({ source: "date.nager.at", fetched: new Date().toISOString().slice(0, 10), holidays: all }, null, 0) + "\n");
  console.log(`au-holidays: ${all.length} holidays for ${years.join(", ")}`);
} catch (e) {
  const existing = JSON.parse(readFileSync(OUT, "utf8"));
  console.warn(`au-holidays: fetch failed (${e.message}); keeping file from ${existing.fetched}`);
}
