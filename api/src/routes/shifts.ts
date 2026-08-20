import { Router, Response } from "express";
import { AuthRequest, authenticate, requireManager } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();
router.use(authenticate, requireManager);

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

async function getBusinessId(userId: number): Promise<number | null> {
  const biz = await prisma.business.findUnique({ where: { userId } });
  return biz?.id ?? null;
}

// GET /shifts/weeks — distinct weeks that have shifts (for history view)
router.get("/weeks", async (req: AuthRequest, res: Response) => {
  const businessId = await getBusinessId(req.userId!);
  if (!businessId) { res.status(404).json({ error: "Business not found" }); return; }

  const shifts = await prisma.shift.findMany({
    where: { businessId },
    select: { date: true, staffId: true },
    orderBy: { date: "desc" },
  });

  const weeks = new Map<string, { staffIds: Set<number>; shiftCount: number }>();
  for (const s of shifts) {
    const d = new Date(s.date);
    const day = d.getDay();
    const mon = new Date(d);
    mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    mon.setHours(0, 0, 0, 0);
    const key = mon.toISOString().slice(0, 10);
    if (!weeks.has(key)) weeks.set(key, { staffIds: new Set(), shiftCount: 0 });
    const w = weeks.get(key)!;
    w.staffIds.add(s.staffId);
    w.shiftCount++;
  }

  res.json(Array.from(weeks.entries()).map(([weekStart, { staffIds, shiftCount }]) => ({
    weekStart,
    shiftCount,
    staffCount: staffIds.size,
  })));
});

router.get("/", async (req: AuthRequest, res: Response) => {
  const businessId = await getBusinessId(req.userId!);
  if (!businessId) { res.status(404).json({ error: "Business not found" }); return; }
  const where: Record<string, unknown> = { businessId };
  if (req.query.week) where.date = weekRange(req.query.week as string);
  res.json(await prisma.shift.findMany({
    where,
    include: { staff: { select: { name: true, email: true } } },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  }));
});

router.post("/", async (req: AuthRequest, res: Response) => {
  const businessId = await getBusinessId(req.userId!);
  if (!businessId) { res.status(404).json({ error: "Business not found" }); return; }
  const { staffId, date, startTime, endTime, role } = req.body;
  if (!staffId || !date || !startTime || !endTime) {
    res.status(400).json({ error: "staffId, date, startTime, endTime required" }); return;
  }
  const member = await prisma.staff.findFirst({ where: { id: staffId, businessId } });
  if (!member) { res.status(404).json({ error: "Staff not found" }); return; }
  if (await prisma.timeOff.findFirst({ where: { staffId, date: new Date(date), businessId } })) {
    res.status(409).json({ error: "Staff has time-off on this date" }); return;
  }
  res.status(201).json(await prisma.shift.upsert({
    where: { staffId_date: { staffId, date: new Date(date) } },
    create: { businessId, staffId, date: new Date(date), startTime, endTime, role: role || member.defaultRole },
    update: { startTime, endTime, role: role || member.defaultRole },
  }));
});

router.put("/:id", async (req: AuthRequest, res: Response) => {
  const businessId = await getBusinessId(req.userId!);
  if (!businessId) { res.status(404).json({ error: "Business not found" }); return; }
  const id = parseInt(req.params.id);
  const existing = await prisma.shift.findFirst({ where: { id, businessId } });
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await prisma.shift.update({
    where: { id },
    data: {
      startTime: req.body.startTime ?? existing.startTime,
      endTime: req.body.endTime ?? existing.endTime,
      role: req.body.role ?? existing.role,
    },
  }));
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  const businessId = await getBusinessId(req.userId!);
  if (!businessId) { res.status(404).json({ error: "Business not found" }); return; }
  const id = parseInt(req.params.id);
  if (!(await prisma.shift.findFirst({ where: { id, businessId } }))) {
    res.status(404).json({ error: "Not found" }); return;
  }
  await prisma.swap.deleteMany({ where: { OR: [{ fromShiftId: id }, { toShiftId: id }] } });
  await prisma.shift.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;
