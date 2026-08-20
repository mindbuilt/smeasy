import { Router, Request, Response } from "express";
import { Resend } from "resend";
import { prisma } from "../lib/prisma";

const router = Router();

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtDate(d: Date): string {
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

async function validateToken(token: string) {
  const record = await prisma.rosterToken.findUnique({
    where: { token },
    include: {
      roster: true,
      staff: { select: { id: true, name: true, email: true } },
    },
  });
  if (!record) return { error: "Invalid link" as string };
  if (record.expiresAt < new Date()) return { error: "This link has expired" as string };
  return { record };
}

// GET /public/roster/:token — return roster + all shifts
router.get("/:token", async (req: Request, res: Response) => {
  const { record, error } = await validateToken(req.params.token);
  if (error || !record) { res.status(404).json({ error }); return; }

  const { roster, staff } = record;

  const [shifts, business] = await Promise.all([
    prisma.shift.findMany({
      where: { businessId: roster.businessId, date: { gte: roster.weekStart, lte: roster.weekEnd } },
      include: { staff: { select: { id: true, name: true } } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    prisma.business.findUnique({
      where: { id: roster.businessId },
      select: { name: true },
    }),
  ]);

  res.json({
    roster: {
      id: roster.id,
      weekStart: roster.weekStart,
      weekEnd: roster.weekEnd,
      status: roster.status,
    },
    staff: { id: staff.id, name: staff.name },
    business: business?.name ?? "",
    shifts: shifts.map((s) => ({
      id: s.id,
      staffId: s.staffId,
      staffName: s.staff.name,
      date: s.date,
      dateLabel: fmtDate(new Date(s.date)),
      startTime: s.startTime,
      endTime: s.endTime,
      role: s.role,
      mine: s.staffId === staff.id,
    })),
  });
});

// POST /public/roster/:token/timeoff — submit time-off request
router.post("/:token/timeoff", async (req: Request, res: Response) => {
  const { record, error } = await validateToken(req.params.token);
  if (error || !record) { res.status(404).json({ error }); return; }

  const { dateFrom, dateTo, note } = req.body;
  if (!dateFrom) { res.status(400).json({ error: "dateFrom required" }); return; }

  const { roster, staff } = record;

  const timeOff = await prisma.timeOff.create({
    data: {
      businessId: roster.businessId,
      staffId: staff.id,
      date: new Date(dateFrom),
      dateTo: dateTo ? new Date(dateTo) : null,
      reason: note || "",
      type: "Time Off Request",
      status: "Pending",
    },
  });

  if (staff.email && process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const firstName = staff.name.split(" ")[0];
    const dateLabel = dateTo && dateTo !== dateFrom ? `${dateFrom} to ${dateTo}` : dateFrom;
    await resend.emails.send({
      from: "Smeasy Rostering <roster@smeasy.app>",
      to: staff.email,
      subject: "Time-off request submitted",
      text: `Hi ${firstName},\n\nYour time-off request for ${dateLabel} has been submitted. Your manager will review it shortly.\n\n— Smeasy`,
    }).catch(() => {});
  }

  res.json({ ok: true, id: timeOff.id });
});

// POST /public/roster/:token/swap — submit swap request
router.post("/:token/swap", async (req: Request, res: Response) => {
  const { record, error } = await validateToken(req.params.token);
  if (error || !record) { res.status(404).json({ error }); return; }

  const { myShiftId, theirShiftId } = req.body;
  if (!myShiftId) { res.status(400).json({ error: "myShiftId required" }); return; }

  const { staff } = record;

  const myShift = await prisma.shift.findFirst({ where: { id: Number(myShiftId), staffId: staff.id } });
  if (!myShift) { res.status(403).json({ error: "That shift is not yours" }); return; }

  let theirStaffId = staff.id; // fallback: open swap
  let theirStaffName = "";
  if (theirShiftId) {
    const theirShift = await prisma.shift.findUnique({
      where: { id: Number(theirShiftId) },
      include: { staff: { select: { id: true, name: true } } },
    });
    if (theirShift) {
      theirStaffId = theirShift.staffId;
      theirStaffName = theirShift.staff.name;
    }
  }

  const swap = await prisma.swap.create({
    data: {
      fromStaffId: staff.id,
      toStaffId: theirStaffId,
      fromShiftId: Number(myShiftId),
      toShiftId: theirShiftId ? Number(theirShiftId) : null,
      status: "Pending",
    },
  });

  if (staff.email && process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const firstName = staff.name.split(" ")[0];
    const body = theirStaffName
      ? `Hi ${firstName},\n\nYour swap offer with ${theirStaffName} has been submitted. Your manager will approve it if both parties agree.\n\n— Smeasy`
      : `Hi ${firstName},\n\nYour open swap request has been submitted. Your manager will find a match.\n\n— Smeasy`;
    await resend.emails.send({
      from: "Smeasy Rostering <roster@smeasy.app>",
      to: staff.email,
      subject: "Swap request submitted",
      text: body,
    }).catch(() => {});
  }

  res.json({ ok: true, id: swap.id });
});

export default router;
