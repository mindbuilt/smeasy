import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Resend } from "resend";
import { prisma } from "../lib/prisma";

const router = Router();

router.post("/signup", async (req: Request, res: Response) => {
  const { email, password, businessName } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }
  if (await prisma.user.findUnique({ where: { email } })) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }
  const name = businessName || "My Business";
  const user = await prisma.user.create({
    data: {
      email,
      password: await bcrypt.hash(password, 10),
      businessName: name,
      business: { create: { name } },
    },
  });
  const token = jwt.sign({ userId: user.id, role: "manager" }, process.env.JWT_SECRET!, { expiresIn: "30d" });
  res.json({ token, email: user.email, businessName: user.businessName });
});

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const token = jwt.sign({ userId: user.id, role: "manager" }, process.env.JWT_SECRET!, { expiresIn: "30d" });
  res.json({ token, email: user.email, businessName: user.businessName });
});

// POST /auth/magic — send magic link email
router.post("/magic", async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) { res.status(400).json({ error: "Email required" }); return; }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) { res.status(404).json({ error: "No account found for that email" }); return; }
  if (!process.env.RESEND_API_KEY) { res.status(503).json({ error: "Email not configured" }); return; }

  const magicToken = jwt.sign({ userId: user.id, type: "magic" }, process.env.JWT_SECRET!, { expiresIn: "15m" });
  const link = `https://smeasy.vercel.app/auth/callback?token=${magicToken}`;

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: "Smeasy Rostering <roster@smeasy.app>",
    to: email,
    subject: "Your Smeasy login link",
    text: `Click to log in to Smeasy (link expires in 15 minutes):\n\n${link}`,
  });

  res.json({ ok: true });
});

// GET /auth/magic/verify?token=... — exchange magic token for session JWT
router.get("/magic/verify", async (req: Request, res: Response) => {
  const { token } = req.query;
  if (!token) { res.status(400).json({ error: "Token required" }); return; }
  try {
    const payload = jwt.verify(token as string, process.env.JWT_SECRET!) as { userId: number; type: string };
    if (payload.type !== "magic") { res.status(401).json({ error: "Invalid token" }); return; }
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    const sessionToken = jwt.sign({ userId: user.id, role: "manager" }, process.env.JWT_SECRET!, { expiresIn: "30d" });
    res.json({ token: sessionToken, email: user.email, businessName: user.businessName });
  } catch {
    res.status(401).json({ error: "Link expired or invalid — request a new one" });
  }
});

export default router;
