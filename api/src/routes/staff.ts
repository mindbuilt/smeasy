import { Router, Response } from "express";
import crypto from "crypto";
import { Resend } from "resend";
import { AuthRequest, authenticate, requireManager } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();
router.use(authenticate, requireManager);

async function getBusinessId(userId: number): Promise<number | null> {
  const biz = await prisma.business.findUnique({ where: { userId } });
  return biz?.id ?? null;
}

router.get("/", async (req: AuthRequest, res: Response) => {
  const businessId = await getBusinessId(req.userId!);
  if (!businessId) { res.status(404).json({ error: "Business not found" }); return; }
  res.json(await prisma.staff.findMany({ where: { businessId }, orderBy: { createdAt: "asc" } }));
});

router.post("/", async (req: AuthRequest, res: Response) => {
  const businessId = await getBusinessId(req.userId!);
  if (!businessId) { res.status(404).json({ error: "Business not found" }); return; }
  const { name, email, phone, defaultRole, canManage, canBeRostered } = req.body;
  if (!name) { res.status(400).json({ error: "Name required" }); return; }
  res.status(201).json(await prisma.staff.create({
    data: {
      businessId,
      name,
      email: email || null,
      phone: phone || null,
      defaultRole: defaultRole || "Floor",
      canManage: !!canManage,
      canBeRostered: canBeRostered !== false,
    },
  }));
});

router.put("/:id", async (req: AuthRequest, res: Response) => {
  const businessId = await getBusinessId(req.userId!);
  if (!businessId) { res.status(404).json({ error: "Business not found" }); return; }
  const id = parseInt(req.params.id);
  const existing = await prisma.staff.findFirst({ where: { id, businessId } });
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await prisma.staff.update({
    where: { id },
    data: {
      name: req.body.name ?? existing.name,
      email: req.body.email !== undefined ? req.body.email : existing.email,
      phone: req.body.phone !== undefined ? req.body.phone : existing.phone,
      defaultRole: req.body.defaultRole ?? existing.defaultRole,
      canManage: req.body.canManage ?? existing.canManage,
      canBeRostered: req.body.canBeRostered ?? existing.canBeRostered,
    },
  }));
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  const businessId = await getBusinessId(req.userId!);
  if (!businessId) { res.status(404).json({ error: "Business not found" }); return; }
  const id = parseInt(req.params.id);
  if (!(await prisma.staff.findFirst({ where: { id, businessId } }))) {
    res.status(404).json({ error: "Not found" }); return;
  }
  // Cascade delete swaps, shifts, timeoff
  await prisma.swap.deleteMany({ where: { OR: [{ fromStaffId: id }, { toStaffId: id }] } });
  await prisma.shift.deleteMany({ where: { staffId: id } });
  await prisma.timeOff.deleteMany({ where: { staffId: id } });
  await prisma.inviteToken.deleteMany({ where: { businessId } });
  await prisma.staff.delete({ where: { id } });
  res.json({ ok: true });
});

// POST /staff/invite — generate invite token, send email
router.post("/invite", async (req: AuthRequest, res: Response) => {
  const businessId = await getBusinessId(req.userId!);
  if (!businessId) { res.status(404).json({ error: "Business not found" }); return; }
  const { email } = req.body;
  if (!email) { res.status(400).json({ error: "email required" }); return; }

  if (!process.env.RESEND_API_KEY) { res.status(503).json({ error: "RESEND_API_KEY not configured" }); return; }

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) { res.status(404).json({ error: "Business not found" }); return; }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.inviteToken.create({
    data: { businessId, email, token, expiresAt },
  });

  const link = `https://smeasy.vercel.app/rostering/invite?token=${token}`;
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    await resend.emails.send({
      from: "Smeasy Rostering <roster@smeasy.app>",
      to: email,
      subject: `You've been invited to join ${business.name} on Smeasy`,
      text: `You've been invited to join ${business.name} on Smeasy. Click to set up your account:\n\n${link}\n\nThis link expires in 7 days.`,
    });
    res.json({ ok: true, token, expiresAt });
  } catch (e: unknown) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to send email" });
  }
});

export default router;
