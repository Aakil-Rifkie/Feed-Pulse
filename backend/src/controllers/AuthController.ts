import type { Request, Response } from "express";
import jwt from "jsonwebtoken";

export const login = (req: Request, res: Response): void => {
  const { email, password } = req.body;

  if (
    email !== process.env.ADMIN_EMAIL ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    res.status(401).json({ success: false, error: "Invalid credentials" });
    return;
  }

  const token = jwt.sign({ email }, process.env.JWT_SECRET as string, {
    expiresIn: "24h",
  });

  res.json({ success: true, data: { token }, message: "Login successful" });
};