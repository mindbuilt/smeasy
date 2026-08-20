import { Router, Response } from "express";
import { AuthRequest, authenticate } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();
router.use(authenticate);

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function fmtTime(h: number): string {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "00")}`;
}

router.get("/csv", async (req: AuthRequest, res: Response) => {
  const { week } = req.query;
  if (!week) { res.status(400).json({ error: "week query param required (YYYY-MM-DD)" }); return; }

  const monday = new Date(week as string);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const shifts = await prisma.shift.findMany({
    where: { userId: req.userId!, date: { gte: monday, lte: sunday } },
    include: { staff: { select: { name: true } } },
    orderBy: [{ date: "asc" }, { startHour: "asc" }],
  });

  const rows = [["Name", "Date", "Day", "Start", "End", "Hours", "Role"]];
  for (const s of shifts) {
    const d = new Date(s.date);
    rows.push([
      s.staff.name,
      d.toISOString().slice(0, 10),
      DAY_NAMES[d.getDay()],
      fmtTime(s.startHour),
      fmtTime(s.endHour),
      String(s.endHour - s.startHour),
      s.role,
    ]);
  }

  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="roster-${week}.csv"`);
  res.send(csv);
});

export default router;
