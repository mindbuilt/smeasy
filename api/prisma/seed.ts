import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPw = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: { email: "owner@acmecafe.com.au" },
    update: {},
    create: {
      email: "owner@acmecafe.com.au",
      password: hashedPw,
      businessName: "Acme Café",
    },
  });

  await prisma.shift.deleteMany({ where: { userId: user.id } });
  await prisma.timeOff.deleteMany({ where: { userId: user.id } });
  await prisma.staff.deleteMany({ where: { userId: user.id } });

  const staffData = [
    { name: "Priya Nair", email: "priya@acmecafe.com.au", defaultRole: "Floor", canManage: true, canBeRostered: true },
    { name: "Jack O'Sullivan", email: null, defaultRole: "Kitchen", canManage: false, canBeRostered: true },
    { name: "Mia Tran", email: null, defaultRole: "Barista", canManage: false, canBeRostered: true },
    { name: "Tom Reyes", email: null, defaultRole: "Floor", canManage: false, canBeRostered: true },
    { name: "Sarah Kim", email: null, defaultRole: "Barista", canManage: false, canBeRostered: true },
    { name: "Liam Ngata", email: null, defaultRole: "Floor", canManage: true, canBeRostered: false },
  ];

  const createdStaff = [];
  for (const s of staffData) {
    const member = await prisma.staff.create({ data: { ...s, userId: user.id } });
    createdStaff.push(member);
  }

  const [priya, jack, mia, tom, sarah] = createdStaff;

  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);

  const shiftData = [
    { staffId: priya.id, offset: 0, start: 7, end: 15, role: "Floor" },
    { staffId: priya.id, offset: 1, start: 7, end: 15, role: "Floor" },
    { staffId: priya.id, offset: 3, start: 7, end: 15, role: "Floor" },
    { staffId: priya.id, offset: 4, start: 7, end: 15, role: "Floor" },
    { staffId: jack.id,  offset: 1, start: 9, end: 17, role: "Kitchen" },
    { staffId: jack.id,  offset: 2, start: 9, end: 17, role: "Kitchen" },
    { staffId: jack.id,  offset: 3, start: 9, end: 17, role: "Kitchen" },
    { staffId: mia.id,   offset: 0, start: 12, end: 20, role: "Barista" },
    { staffId: tom.id,   offset: 0, start: 7, end: 15, role: "Floor" },
    { staffId: tom.id,   offset: 2, start: 7, end: 15, role: "Floor" },
    { staffId: sarah.id, offset: 2, start: 9, end: 17, role: "Barista" },
  ];

  for (const s of shiftData) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + s.offset);
    await prisma.shift.create({
      data: { userId: user.id, staffId: s.staffId, date, startHour: s.start, endHour: s.end, role: s.role },
    });
  }

  const tue = new Date(monday); tue.setDate(monday.getDate() + 1);
  const sat = new Date(monday); sat.setDate(monday.getDate() + 5);

  await prisma.timeOff.create({ data: { userId: user.id, staffId: mia.id, date: tue, reason: "Dr appointment", status: "Approved" } });
  await prisma.timeOff.create({ data: { userId: user.id, staffId: sarah.id, date: sat, reason: "Family event", status: "Pending" } });

  console.log("✓ Seeded: 1 user (owner@acmecafe.com.au / password123), 6 staff, 11 shifts, 2 time-off entries");
}

main().catch(console.error).finally(() => prisma.$disconnect());
