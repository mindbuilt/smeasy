import { Router, Response } from "express";
import { Resend } from "resend";
import { AuthRequest, authenticate, requireManager } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();
router.use(authenticate, requireManager);

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

router.post("/", async (req: AuthRequest, res: Response) => {
  const { weekStart } = req.body;
  if (!weekStart) { res.status(400).json({ error: "weekStart required (YYYY-MM-DD)" }); return; }
  if (!process.env.RESEND_API_KEY) { res.status(503).json({ error: "RESEND_API_KEY not configured" }); return; }

  const monday = new Date(weekStart);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const biz = await prisma.business.findUnique({ where: { userId: req.userId! } });
  if (!biz) { res.status(404).json({ error: "Business not found" }); return; }

  const staff = await prisma.staff.findMany({
    where: { businessId: biz.id, canBeRostered: true },
    include: { shifts: { where: { date: { gte: monday, lte: sunday } }, orderBy: { date: "asc" } } },
  });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const weekLabel =
    monday.toLocaleDateString("en-AU", { day: "numeric", month: "short" }) +
    " – " +
    sunday.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });

  const results: { name: string; email: string | null; sent: boolean; error?: string }[] = [];

  for (const member of staff) {
    if (!member.email) {
      results.push({ name: member.name, email: null, sent: false, error: "No email address" });
      continue;
    }

    const lines = member.shifts.map((s) => {
      const d = new Date(s.date);
      return `${DAY_NAMES[d.getDay()]} ${d.getDate()} — ${s.startTime}–${s.endTime} (${s.role})`;
    });

    const firstName = member.name.split(" ")[0];
    const body =
      lines.length > 0
        ? `Hi ${firstName},\n\nYour shifts for ${weekLabel}:\n\n${lines.join("\n")}\n\n— ${biz.name}`
        : `Hi ${firstName},\n\nYou have no shifts scheduled for ${weekLabel}.\n\n— ${biz.name}`;

    try {
      await resend.emails.send({
        from: "Smeasy Rostering <roster@smeasy.app>",
        to: member.email,
        subject: `Your roster for ${weekLabel}`,
        text: body,
      });
      results.push({ name: member.name, email: member.email, sent: true });
    } catch (e: unknown) {
      results.push({ name: member.name, email: member.email, sent: false, error: e instanceof Error ? e.message : "Unknown error" });
    }
  }

  res.json({ weekLabel, results });
});

export default router;
