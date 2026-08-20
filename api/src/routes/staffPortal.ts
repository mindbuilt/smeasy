import { Router, Response } from "express";
import { AuthRequest, authenticate, requireStaff } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();
router.use(authenticate, requireStaff);

function weekRange(dateStr: string) {
  const d = new Date(dateStr);
  const mon = new Date(d);
  mon.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1));
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  sun.setHours(23, 59, 59, 999);
  return { gte: mon, lte: sun };
}

// GET /staff/roster — shifts for logged-in staff member
router.get("/roster", async (req: AuthRequest, res: Response) => {
  const where: Record<string, unknown> = { staffId: req.staffId! };
  if (req.query.week) where.date = weekRange(req.query.week as string);
  res.json(await prisma.shift.findMany({
    where,
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  }));
});

// GET /staff/colleagues — other staff in same business (name only)
router.get("/colleagues", async (req: AuthRequest, res: Response) => {
  const colleagues = await prisma.staff.findMany({
    where: { businessId: req.businessId!, id: { not: req.staffId! } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  res.json(colleagues);
});

export default router;
