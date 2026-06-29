import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";

export function isAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user?.isAdmin) {
    res.status(403).json({ message: "წვდომა აკრძალულია. საჭიროა ადმინის უფლება." });
    return;
  }
  next();
}
