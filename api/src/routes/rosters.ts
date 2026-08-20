import { Router, Response } from "express";
import { AuthRequest, authenticate, requireManager } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();
router.use(authenticate, requireManager);

async function getBusinessId(userId: number): Promise<number | null> {
  const biz = await prisma.business.findUnique({ where: { userId } });
  return biz?.id ?? null;
}

function mondayOf(dateStr: string): Date {
  const d = new Date(dateStr);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

// GET /rosters/:id — fetch single roster with its shifts
router.get("/:id", async (req: AuthRequest, res: Response) => {
  const businessId = await getBusinessId(req.userId!);
  if (!businessId) { res.status(404).json({ error: "Business not found" }); return; }
  const id = parseInt(req.params.id);
  const roster = await prisma.roster.findFirst({ where: { id, businessId } });
  if (!roster) { res.status(404).json({ error: "Not found" }); return; }

  const shifts = await prisma.shift.findMany({
    where: { businessId, date: { gte: roster.weekStart, lte: roster.weekEnd } },
    include: { staff: { select: { name: true } } },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  res.json({ ...roster, shifts });
});

// GET /rosters — list all rosters for business, newest first
router.get("/", async (req: AuthRequest, res: Response) => {
  const businessId = await getBusinessId(req.userId!);
  if (!businessId) { res.status(404).json({ error: "Business not found" }); return; }
  res.json(await prisma.roster.findMany({
    where: { businessId },
    orderBy: { weekStart: "desc" },
  }));
});

// POST /rosters — create or upsert a roster record for a week
router.post("/", async (req: AuthRequest, res: Response) => {
  const businessId = await getBusinessId(req.userId!);
  if (!businessId) { res.status(404).json({ error: "Business not found" }); return; }
  const { weekStart } = req.body;
  if (!weekStart) { res.status(400).json({ error: "weekStart required (YYYY-MM-DD)" }); return; }

  const mon = mondayOf(weekStart);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);

  res.status(201).json(await prisma.roster.upsert({
    where: { businessId_weekStart: { businessId, weekStart: mon } },
    create: { businessId, weekStart: mon, weekEnd: sun, status: "draft" },
    update: {},
  }));
});

// PUT /rosters/:id — update status (draft → published)
router.put("/:id", async (req: AuthRequest, res: Response) => {
  const businessId = await getBusinessId(req.userId!);
  if (!businessId) { res.status(404).json({ error: "Business not found" }); return; }
  const id = parseInt(req.params.id);
  const existing = await prisma.roster.findFirst({ where: { id, businessId } });
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  const status = req.body.status ?? existing.status;
  res.json(await prisma.roster.update({
    where: { id },
    data: {
      status,
      publishedAt: status === "published" && !existing.publishedAt ? new Date() : existing.publishedAt,
    },
  }));
});

// DELETE /rosters/:id
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  const businessId = await getBusinessId(req.userId!);
  if (!businessId) { res.status(404).json({ error: "Business not found" }); return; }
  const id = parseInt(req.params.id);
  if (!(await prisma.roster.findFirst({ where: { id, businessId } }))) {
    res.status(404).json({ error: "Not found" }); return;
  }
  await prisma.roster.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;
