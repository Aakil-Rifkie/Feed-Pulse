import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const protect = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "Unauthorised" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    jwt.verify(token as string, process.env.JWT_SECRET as string);
    next();
  } catch {
    res.status(401).json({ success: false, error: "Invalid token" });
  }
};