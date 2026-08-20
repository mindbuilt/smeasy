import { Router, Response } from "express";
import { Resend } from "resend";
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
  if (req.role === "manager") {
    const biz = await prisma.business.findUnique({ where: { userId: req.userId! } });
    if (!biz) { res.status(404).json({ error: "Business not found" }); return; }
    const where: Record<string, unknown> = { businessId: biz.id };
    if (req.query.week) where.date = weekRange(req.query.week as string);
    res.json(await prisma.timeOff.findMany({
      where,
      include: { staff: { select: { name: true } } },
      orderBy: { date: "asc" },
    }));
  } else {
    // staff sees own
    const where: Record<string, unknown> = { staffId: req.staffId! };
    if (req.query.week) where.date = weekRange(req.query.week as string);
    res.json(await prisma.timeOff.findMany({
      where,
      orderBy: { date: "asc" },
    }));
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  const { date, reason, type } = req.body;

  if (req.role === "staff") {
    // Staff submitting time-off request
    if (!date) { res.status(400).json({ error: "date required" }); return; }
    const staffId = req.staffId!;
    const businessId = req.businessId!;

    const record = await prisma.timeOff.upsert({
      where: { staffId_date: { staffId, date: new Date(date) } },
      create: { businessId, staffId, date: new Date(date), type: type || "Day Off", reason: reason || "", status: "Pending" },
      update: { type: type || "Day Off", reason: reason || "" },
    });

    // Email manager
    if (process.env.RESEND_API_KEY) {
      const staff = await prisma.staff.findUnique({ where: { id: staffId }, include: { business: { include: { user: true } } } });
      if (staff?.business?.user?.email) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const dateStr = new Date(date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
        await resend.emails.send({
          from: "Smeasy Rostering <roster@smeasy.app>",
          to: staff.business.user.email,
          subject: `Time-off request from ${staff.name}`,
          text: `${staff.name} has requested time off on ${dateStr}${reason ? `: ${reason}` : ""}.`,
        }).catch(() => {});
      }
    }

    res.status(201).json(record);
  } else {
    // Manager creating directly
    const { staffId } = req.body;
    if (!staffId || !date) { res.status(400).json({ error: "staffId and date required" }); return; }
    const biz = await prisma.business.findUnique({ where: { userId: req.userId! } });
    if (!biz) { res.status(404).json({ error: "Business not found" }); return; }
    if (!(await prisma.staff.findFirst({ where: { id: staffId, businessId: biz.id } }))) {
      res.status(404).json({ error: "Staff not found" }); return;
    }
    res.status(201).json(await prisma.timeOff.upsert({
      where: { staffId_date: { staffId, date: new Date(date) } },
      create: { businessId: biz.id, staffId, date: new Date(date), type: type || "Day Off", reason: reason || "" },
      update: { type: type || "Day Off", reason: reason || "" },
    }));
  }
});

router.put("/:id", async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  let existing;

  if (req.role === "manager") {
    const biz = await prisma.business.findUnique({ where: { userId: req.userId! } });
    if (!biz) { res.status(404).json({ error: "Business not found" }); return; }
    existing = await prisma.timeOff.findFirst({ where: { id, businessId: biz.id } });
  } else {
    existing = await prisma.timeOff.findFirst({ where: { id, staffId: req.staffId! } });
  }

  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  const updated = await prisma.timeOff.update({
    where: { id },
    data: {
      status: req.body.status ?? existing.status,
      reason: req.body.reason ?? existing.reason,
      type: req.body.type ?? existing.type,
    },
    include: { staff: { select: { name: true, email: true } } },
  });

  // If manager approved/denied, email the staff member
  if (req.role === "manager" && req.body.status && req.body.status !== existing.status && process.env.RESEND_API_KEY) {
    const staffEmail = updated.staff.email;
    if (staffEmail) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const dateStr = new Date(updated.date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
      const statusWord = req.body.status.toLowerCase();
      await resend.emails.send({
        from: "Smeasy Rostering <roster@smeasy.app>",
        to: staffEmail,
        subject: `Your time-off request has been ${statusWord}`,
        text: `Your time-off request for ${dateStr} has been ${statusWord}.`,
      }).catch(() => {});
    }
  }

  res.json(updated);
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  let found;
  if (req.role === "manager") {
    const biz = await prisma.business.findUnique({ where: { userId: req.userId! } });
    if (!biz) { res.status(404).json({ error: "Business not found" }); return; }
    found = await prisma.timeOff.findFirst({ where: { id, businessId: biz.id } });
  } else {
    found = await prisma.timeOff.findFirst({ where: { id, staffId: req.staffId! } });
  }
  if (!found) { res.status(404).json({ error: "Not found" }); return; }
  await prisma.timeOff.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;
