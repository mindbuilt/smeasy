import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

const router = Router();

// GET /invite/:token — validate invite token, return business + email info
router.get("/invite/:token", async (req: Request, res: Response) => {
  const invite = await prisma.inviteToken.findUnique({
    where: { token: req.params.token },
    include: { business: { select: { id: true, name: true } } },
  });
  if (!invite) {
    res.status(404).json({ error: "Invalid or expired invite token" });
    return;
  }
  if (new Date() > invite.expiresAt) {
    res.status(410).json({ error: "Invite token has expired" });
    return;
  }
  res.json({ businessId: invite.businessId, businessName: invite.business.name, email: invite.email });
});

// POST /staff-auth/signup — set passwordHash for staff member, return staff JWT
router.post("/signup", async (req: Request, res: Response) => {
  const { token, password } = req.body;
  if (!token || !password) {
    res.status(400).json({ error: "token and password required" });
    return;
  }
  const invite = await prisma.inviteToken.findUnique({
    where: { token },
    include: { business: true },
  });
  if (!invite) {
    res.status(404).json({ error: "Invalid invite token" });
    return;
  }
  if (new Date() > invite.expiresAt) {
    res.status(410).json({ error: "Invite token has expired" });
    return;
  }
  const staff = await prisma.staff.findFirst({
    where: { businessId: invite.businessId, email: invite.email },
  });
  if (!staff) {
    res.status(404).json({ error: "Staff member not found" });
    return;
  }
  const updated = await prisma.staff.update({
    where: { id: staff.id },
    data: { passwordHash: await bcrypt.hash(password, 10) },
  });
  // Optionally delete invite after use
  await prisma.inviteToken.delete({ where: { token } });

  const jwtToken = jwt.sign(
    { staffId: updated.id, businessId: updated.businessId, role: "staff" },
    process.env.JWT_SECRET!,
    { expiresIn: "30d" }
  );
  res.json({ token: jwtToken, staffId: updated.id, name: updated.name, businessId: updated.businessId });
});

// POST /staff-auth/login — verify staff credentials, return staff JWT
router.post("/login", async (req: Request, res: Response) => {
  const { email, password, businessId } = req.body;
  if (!email || !password || !businessId) {
    res.status(400).json({ error: "email, password, and businessId required" });
    return;
  }
  const staff = await prisma.staff.findFirst({
    where: { email, businessId: Number(businessId) },
  });
  if (!staff || !staff.passwordHash || !(await bcrypt.compare(password, staff.passwordHash))) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const jwtToken = jwt.sign(
    { staffId: staff.id, businessId: staff.businessId, role: "staff" },
    process.env.JWT_SECRET!,
    { expiresIn: "30d" }
  );
  res.json({ token: jwtToken, staffId: staff.id, name: staff.name, businessId: staff.businessId });
});

export default router;
