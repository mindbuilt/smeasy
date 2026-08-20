import { Router, Response } from "express";
import { Resend } from "resend";
import { AuthRequest, authenticate, requireManager } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();
router.use(authenticate, requireManager);

async function getBusinessId(userId: number): Promise<number | null> {
  const biz = await prisma.business.findUnique({ where: { userId } });
  return biz?.id ?? null;
}

// GET /manager/requests — all pending TimeOff + Swaps for business
router.get("/requests", async (req: AuthRequest, res: Response) => {
  const businessId = await getBusinessId(req.userId!);
  if (!businessId) { res.status(404).json({ error: "Business not found" }); return; }

  const [timeOff, swaps] = await Promise.all([
    prisma.timeOff.findMany({
      where: { businessId, status: "Pending" },
      include: { staff: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.swap.findMany({
      where: {
        status: "Pending",
        fromStaff: { businessId },
      },
      include: {
        fromStaff: { select: { name: true, email: true } },
        toStaff: { select: { name: true, email: true } },
        fromShift: true,
        toShift: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  res.json({ timeOff, swaps });
});

// POST /manager/requests/timeoff/:id/approve
router.post("/requests/timeoff/:id/approve", async (req: AuthRequest, res: Response) => {
  const businessId = await getBusinessId(req.userId!);
  if (!businessId) { res.status(404).json({ error: "Business not found" }); return; }
  const id = parseInt(req.params.id);
  const record = await prisma.timeOff.findFirst({ where: { id, businessId }, include: { staff: { select: { name: true, email: true } } } });
  if (!record) { res.status(404).json({ error: "Not found" }); return; }

  const updated = await prisma.timeOff.update({ where: { id }, data: { status: "Approved" } });

  if (process.env.RESEND_API_KEY && record.staff.email) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const dateStr = new Date(record.date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
    await resend.emails.send({
      from: "Smeasy Rostering <roster@smeasy.app>",
      to: record.staff.email,
      subject: "Your time-off request has been approved",
      text: `Your time-off request for ${dateStr} has been approved.`,
    }).catch(() => {});
  }

  res.json(updated);
});

// POST /manager/requests/timeoff/:id/deny
router.post("/requests/timeoff/:id/deny", async (req: AuthRequest, res: Response) => {
  const businessId = await getBusinessId(req.userId!);
  if (!businessId) { res.status(404).json({ error: "Business not found" }); return; }
  const id = parseInt(req.params.id);
  const record = await prisma.timeOff.findFirst({ where: { id, businessId }, include: { staff: { select: { name: true, email: true } } } });
  if (!record) { res.status(404).json({ error: "Not found" }); return; }

  const updated = await prisma.timeOff.update({ where: { id }, data: { status: "Denied" } });

  if (process.env.RESEND_API_KEY && record.staff.email) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const dateStr = new Date(record.date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
    await resend.emails.send({
      from: "Smeasy Rostering <roster@smeasy.app>",
      to: record.staff.email,
      subject: "Your time-off request has been denied",
      text: `Your time-off request for ${dateStr} has been denied.`,
    }).catch(() => {});
  }

  res.json(updated);
});

// POST /manager/requests/swap/:id/approve
router.post("/requests/swap/:id/approve", async (req: AuthRequest, res: Response) => {
  const businessId = await getBusinessId(req.userId!);
  if (!businessId) { res.status(404).json({ error: "Business not found" }); return; }
  const id = parseInt(req.params.id);
  const swap = await prisma.swap.findFirst({
    where: { id, fromStaff: { businessId } },
    include: {
      fromStaff: { select: { name: true, email: true } },
      toStaff: { select: { name: true, email: true } },
    },
  });
  if (!swap) { res.status(404).json({ error: "Not found" }); return; }

  const updated = await prisma.swap.update({ where: { id }, data: { status: "Approved" } });

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const emails: string[] = [];
    if (swap.fromStaff.email) emails.push(swap.fromStaff.email);
    if (swap.toStaff.email) emails.push(swap.toStaff.email);
    for (const to of emails) {
      await resend.emails.send({
        from: "Smeasy Rostering <roster@smeasy.app>",
        to,
        subject: "Your swap request has been approved",
        text: "Your swap request has been approved.",
      }).catch(() => {});
    }
  }

  res.json(updated);
});

// POST /manager/requests/swap/:id/deny
router.post("/requests/swap/:id/deny", async (req: AuthRequest, res: Response) => {
  const businessId = await getBusinessId(req.userId!);
  if (!businessId) { res.status(404).json({ error: "Business not found" }); return; }
  const id = parseInt(req.params.id);
  const swap = await prisma.swap.findFirst({
    where: { id, fromStaff: { businessId } },
    include: {
      fromStaff: { select: { name: true, email: true } },
      toStaff: { select: { name: true, email: true } },
    },
  });
  if (!swap) { res.status(404).json({ error: "Not found" }); return; }

  const updated = await prisma.swap.update({ where: { id }, data: { status: "Denied" } });

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const emails: string[] = [];
    if (swap.fromStaff.email) emails.push(swap.fromStaff.email);
    if (swap.toStaff.email) emails.push(swap.toStaff.email);
    for (const to of emails) {
      await resend.emails.send({
        from: "Smeasy Rostering <roster@smeasy.app>",
        to,
        subject: "Your swap request has been denied",
        text: "Your swap request has been denied.",
      }).catch(() => {});
    }
  }

  res.json(updated);
});

export default router;
