import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: number;
  staffId?: number;
  businessId?: number;
  role?: string;
}

type JwtPayload =
  | { userId: number; role: "manager" }
  | { staffId: number; businessId: number; role: "staff" };

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET!) as JwtPayload;
    req.role = payload.role;
    if (payload.role === "manager") {
      req.userId = payload.userId;
    } else {
      req.staffId = payload.staffId;
      req.businessId = payload.businessId;
    }
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export function requireManager(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.role !== "manager") {
    res.status(403).json({ error: "Manager access required" });
    return;
  }
  next();
}

export function requireStaff(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.role !== "staff") {
    res.status(403).json({ error: "Staff access required" });
    return;
  }
  next();
}
