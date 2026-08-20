import { Router, Response } from "express";
import { AuthRequest, authenticate } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();
router.use(authenticate);

router.get("/", async (req: AuthRequest, res: Response) => {
  res.json(await prisma.staff.findMany({ where: { userId: req.userId! }, orderBy: { createdAt: "asc" } }));
});

router.post("/", async (req: AuthRequest, res: Response) => {
  const { name, email, defaultRole, canManage, canBeRostered } = req.body;
  if (!name) { res.status(400).json({ error: "Name required" }); return; }
  res.status(201).json(await prisma.staff.create({
    data: { userId: req.userId!, name, email: email || null, defaultRole: defaultRole || "Floor", canManage: !!canManage, canBeRostered: canBeRostered !== false },
  }));
});

router.put("/:id", async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const existing = await prisma.staff.findFirst({ where: { id, userId: req.userId! } });
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await prisma.staff.update({
    where: { id },
    data: {
      name: req.body.name ?? existing.name,
      email: req.body.email !== undefined ? req.body.email : existing.email,
      defaultRole: req.body.defaultRole ?? existing.defaultRole,
      canManage: req.body.canManage ?? existing.canManage,
      canBeRostered: req.body.canBeRostered ?? existing.canBeRostered,
    },
  }));
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  if (!(await prisma.staff.findFirst({ where: { id, userId: req.userId! } }))) {
    res.status(404).json({ error: "Not found" }); return;
  }
  await prisma.shift.deleteMany({ where: { staffId: id } });
  await prisma.timeOff.deleteMany({ where: { staffId: id } });
  await prisma.staff.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;
