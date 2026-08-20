import { Router, Response } from "express";
import { AuthRequest, authenticate } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();
router.use(authenticate);

router.get("/", async (req: AuthRequest, res: Response) => {
  const where: Record<string, unknown> = { userId: req.userId! };
  if (req.query.week) {
    const d = new Date(req.query.week as string);
    const mon = new Date(d);
    mon.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1));
    mon.setHours(0, 0, 0, 0);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23, 59, 59, 999);
    where.date = { gte: mon, lte: sun };
  }
  res.json(await prisma.timeOff.findMany({
    where,
    include: { staff: { select: { name: true } } },
    orderBy: { date: "asc" },
  }));
});

router.post("/", async (req: AuthRequest, res: Response) => {
  const { staffId, date, reason } = req.body;
  if (!staffId || !date) { res.status(400).json({ error: "staffId and date required" }); return; }
  if (!(await prisma.staff.findFirst({ where: { id: staffId, userId: req.userId! } }))) {
    res.status(404).json({ error: "Staff not found" }); return;
  }
  res.status(201).json(await prisma.timeOff.upsert({
    where: { staffId_date: { staffId, date: new Date(date) } },
    create: { userId: req.userId!, staffId, date: new Date(date), reason: reason || "" },
    update: { reason: reason || "" },
  }));
});

router.put("/:id", async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const existing = await prisma.timeOff.findFirst({ where: { id, userId: req.userId! } });
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await prisma.timeOff.update({
    where: { id },
    data: { status: req.body.status ?? existing.status, reason: req.body.reason ?? existing.reason },
  }));
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  if (!(await prisma.timeOff.findFirst({ where: { id, userId: req.userId! } }))) {
    res.status(404).json({ error: "Not found" }); return;
  }
  await prisma.timeOff.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;
