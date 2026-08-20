import { Router, Response } from "express";
import { AuthRequest, authenticate, requireManager } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();
router.use(authenticate, requireManager);

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function timeToHours(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h + m / 60;
}

router.get("/csv", async (req: AuthRequest, res: Response) => {
  const { week } = req.query;
  if (!week) { res.status(400).json({ error: "week query param required (YYYY-MM-DD)" }); return; }

  const monday = new Date(week as string);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const biz = await prisma.business.findUnique({ where: { userId: req.userId! } });
  if (!biz) { res.status(404).json({ error: "Business not found" }); return; }

  const shifts = await prisma.shift.findMany({
    where: { businessId: biz.id, date: { gte: monday, lte: sunday } },
    include: { staff: { select: { name: true } } },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  const rows = [["Name", "Date", "Day", "Start", "End", "Role"]];
  for (const s of shifts) {
    const d = new Date(s.date);
    rows.push([
      s.staff.name,
      d.toISOString().slice(0, 10),
      DAY_NAMES[d.getDay()],
      s.startTime,
      s.endTime,
      s.role,
    ]);
  }

  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="roster-${week}.csv"`);
  res.send(csv);
});

export default router;
