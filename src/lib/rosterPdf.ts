import { fmtDay, fmtTime, fmtWeek, shiftHours, weekDates } from "./dates";
import { roleSwatch } from "./roleColors";
import { holidayOn } from "./holidays";

export interface PdfShift {
  date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  role: string | null;
  notes?: string | null;
  staff_name: string; // "" = unfilled
}

/**
 * Builds an A4 landscape roster (people down the side, Mon–Sun across) and
 * downloads it. jsPDF is loaded on demand so it doesn't weigh down page loads.
 */
export async function downloadRosterPdf(opts: {
  business: string;
  weekStart: string;
  shifts: PdfShift[];
  people?: string[]; // include people with no shifts (manager view)
  roles?: string[];
  state?: string | null;
  dayNotes?: { date: string; note: string }[];
  teamLink?: string;
}) {
  const roles = opts.roles ?? [];
  const [{ jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const days = weekDates(opts.weekStart);
  const named = opts.shifts.filter((s) => s.staff_name);
  const names = Array.from(new Set([...(opts.people ?? []), ...named.map((s) => s.staff_name)]))
    .sort((a, b) => a.localeCompare(b));
  const hasUnfilled = opts.shifts.some((s) => !s.staff_name);
  const rowNames = hasUnfilled ? ["", ...names] : names;
  const cellRole: (string | null)[][] = [];

  const body = rowNames.map((name) => {
    const mine = opts.shifts.filter((s) => s.staff_name === name);
    const hours = name ? mine.reduce((h, s) => h + shiftHours(s.start_time, s.end_time, s.break_minutes), 0) : 0;
    const roleRow: (string | null)[] = [];
    const cells = days.map((d) => {
      const day = mine.filter((s) => s.date === d).sort((a, b) => a.start_time.localeCompare(b.start_time));
      roleRow.push(day.length ? day[0].role ?? "" : null);
      return day
        .map((s) => `${fmtTime(s.start_time)}–${fmtTime(s.end_time)}${s.role ? `\n${s.role}` : ""}${s.notes ? `\n${s.notes}` : ""}`)
        .join("\n\n");
    });
    cellRole.push(roleRow);
    return [name || "Unfilled", ...cells, hours ? hours.toFixed(1).replace(/\.0$/, "") : ""];
  });
  const header = days.map((d) => {
    const extra = [holidayOn(d, opts.state), opts.dayNotes?.find((n) => n.date === d)?.note].filter(Boolean);
    return [fmtDay(d).replace(/ \w+$/, ""), ...extra].join("\n");
  });

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(opts.business, 12, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(90);
  doc.text(`Roster · ${fmtWeek(opts.weekStart)}`, 12, 20);

  const dayWidth = (doc.internal.pageSize.getWidth() - 24 - 38 - 14) / 7;

  autoTable(doc, {
    startY: 25,
    margin: { left: 12, right: 12 },
    head: [["", ...header, "Hrs"]],
    body,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2, valign: "top", lineColor: [220, 216, 205], textColor: [33, 31, 26] },
    headStyles: { fillColor: [33, 31, 26], textColor: 255, fontStyle: "bold", halign: "center" },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 38 },
      ...Object.fromEntries(days.map((_, i) => [i + 1, { cellWidth: dayWidth }])),
      8: { halign: "center", cellWidth: 14 },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index > 0 && data.column.index < 8 && data.cell.raw) {
        const unfilledRow = hasUnfilled && data.row.index === 0;
        const role = cellRole[data.row.index]?.[data.column.index - 1];
        data.cell.styles.fillColor = unfilledRow ? [255, 240, 238] : roleSwatch(role || null, roles).pdf;
      }
      if (data.section === "head" && data.column.index > 0 && data.column.index < 8) {
        data.cell.styles.fontSize = 8;
      }
    },
  });

  doc.setFontSize(8);
  doc.setTextColor(130);
  const footer = opts.teamLink ? `Live roster: ${opts.teamLink}` : "Made with Smeasy";
  doc.text(footer, 12, doc.internal.pageSize.getHeight() - 8);

  doc.save(`${opts.business.replace(/[^\w]+/g, "-").toLowerCase()}-roster-${opts.weekStart}.pdf`);
}
