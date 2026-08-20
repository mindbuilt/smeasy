import { Router, Response } from "express";
import { Resend } from "resend";
import { AuthRequest, authenticate } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();
router.use(authenticate);

router.post("/", async (req: AuthRequest, res: Response) => {
  if (req.role !== "staff") { res.status(403).json({ error: "Staff access required" }); return; }

  const { fromShiftId, toStaffId, toShiftId } = req.body;
  if (!fromShiftId || !toStaffId) {
    res.status(400).json({ error: "fromShiftId and toStaffId required" }); return;
  }

  // Verify fromShift belongs to this staff member
  const fromShift = await prisma.shift.findFirst({
    where: { id: fromShiftId, staffId: req.staffId! },
    include: { staff: { select: { name: true, email: true } } },
  });
  if (!fromShift) { res.status(404).json({ error: "Shift not found" }); return; }

  // Verify toStaff is in same business
  const toStaff = await prisma.staff.findFirst({
    where: { id: toStaffId, businessId: req.businessId! },
  });
  if (!toStaff) { res.status(404).json({ error: "Target staff not found" }); return; }

  const swap = await prisma.swap.create({
    data: {
      fromStaffId: req.staffId!,
      toStaffId,
      fromShiftId,
      toShiftId: toShiftId || null,
      status: "Pending",
    },
    include: {
      fromStaff: { select: { name: true, email: true } },
      toStaff: { select: { name: true, email: true } },
      fromShift: true,
    },
  });

  // Email toStaff and manager
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const dateStr = new Date(fromShift.date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
    const subject = `Shift swap request from ${fromShift.staff.name}`;
    const text = `${fromShift.staff.name} wants to swap their ${dateStr} shift with you.`;

    const emails: string[] = [];
    if (toStaff.email) emails.push(toStaff.email);

    // Get manager email
    const biz = await prisma.business.findUnique({ where: { id: req.businessId! }, include: { user: true } });
    if (biz?.user?.email) emails.push(biz.user.email);

    for (const to of emails) {
      await resend.emails.send({
        from: "Smeasy Rostering <roster@smeasy.app>",
        to,
        subject,
        text,
      }).catch(() => {});
    }
  }

  res.status(201).json(swap);
});

router.get("/", async (req: AuthRequest, res: Response) => {
  if (req.role === "manager") {
    const biz = await prisma.business.findUnique({ where: { userId: req.userId! } });
    if (!biz) { res.status(404).json({ error: "Business not found" }); return; }
    const staffIds = (await prisma.staff.findMany({ where: { businessId: biz.id }, select: { id: true } })).map(s => s.id);
    res.json(await prisma.swap.findMany({
      where: { OR: [{ fromStaffId: { in: staffIds } }, { toStaffId: { in: staffIds } }] },
      include: {
        fromStaff: { select: { name: true, email: true } },
        toStaff: { select: { name: true, email: true } },
        fromShift: true,
        toShift: true,
      },
      orderBy: { createdAt: "desc" },
    }));
  } else {
    res.json(await prisma.swap.findMany({
      where: { OR: [{ fromStaffId: req.staffId! }, { toStaffId: req.staffId! }] },
      include: {
        fromStaff: { select: { name: true, email: true } },
        toStaff: { select: { name: true, email: true } },
        fromShift: true,
        toShift: true,
      },
      orderBy: { createdAt: "desc" },
    }));
  }
});

router.put("/:id", async (req: AuthRequest, res: Response) => {
  if (req.role !== "manager") { res.status(403).json({ error: "Manager access required" }); return; }

  const id = parseInt(req.params.id);
  const biz = await prisma.business.findUnique({ where: { userId: req.userId! } });
  if (!biz) { res.status(404).json({ error: "Business not found" }); return; }

  const swap = await prisma.swap.findFirst({
    where: { id },
    include: {
      fromStaff: { select: { name: true, email: true } },
      toStaff: { select: { name: true, email: true } },
    },
  });
  if (!swap) { res.status(404).json({ error: "Swap not found" }); return; }

  const { status } = req.body;
  if (!status) { res.status(400).json({ error: "status required" }); return; }

  const updated = await prisma.swap.update({ where: { id }, data: { status } });

  // Email both staff
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const statusWord = status.toLowerCase();
    const subject = `Your swap request has been ${statusWord}`;
    const text = `Your swap request has been ${statusWord}.`;
    const emails: string[] = [];
    if (swap.fromStaff.email) emails.push(swap.fromStaff.email);
    if (swap.toStaff.email) emails.push(swap.toStaff.email);
    for (const to of emails) {
      await resend.emails.send({
        from: "Smeasy Rostering <roster@smeasy.app>",
        to,
        subject,
        text,
      }).catch(() => {});
    }
  }

  res.json(updated);
});

export default router;
