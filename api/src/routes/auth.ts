import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
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

export default router;
