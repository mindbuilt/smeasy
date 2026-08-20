import { Router, Response } from "express";
import { AuthRequest, authenticate } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();
router.use(authenticate);

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

router.get("/", async (req: AuthRequest, res: Response) => {
  const where: Record<string, unknown> = { userId: req.userId! };
  if (req.query.week) where.date = weekRange(req.query.week as string);
  res.json(await prisma.shift.findMany({
    where,
    include: { staff: { select: { name: true, email: true } } },
    orderBy: [{ date: "asc" }, { startHour: "asc" }],
  }));
});

router.post("/", async (req: AuthRequest, res: Response) => {
  const { staffId, date, startHour, endHour, role } = req.body;
  if (!staffId || !date || startHour == null || endHour == null) {
    res.status(400).json({ error: "staffId, date, startHour, endHour required" }); return;
  }
  const member = await prisma.staff.findFirst({ where: { id: staffId, userId: req.userId! } });
  if (!member) { res.status(404).json({ error: "Staff not found" }); return; }
  if (await prisma.timeOff.findFirst({ where: { staffId, date: new Date(date), userId: req.userId! } })) {
    res.status(409).json({ error: "Staff has time-off on this date" }); return;
  }
  res.status(201).json(await prisma.shift.upsert({
    where: { staffId_date: { staffId, date: new Date(date) } },
    create: { userId: req.userId!, staffId, date: new Date(date), startHour, endHour, role: role || member.defaultRole },
    update: { startHour, endHour, role: role || member.defaultRole },
  }));
});

router.put("/:id", async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const existing = await prisma.shift.findFirst({ where: { id, userId: req.userId! } });
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await prisma.shift.update({
    where: { id },
    data: {
      startHour: req.body.startHour ?? existing.startHour,
      endHour: req.body.endHour ?? existing.endHour,
      role: req.body.role ?? existing.role,
    },
  }));
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  if (!(await prisma.shift.findFirst({ where: { id, userId: req.userId! } }))) {
    res.status(404).json({ error: "Not found" }); return;
  }
  await prisma.shift.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;
