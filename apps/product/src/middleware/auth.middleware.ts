import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

interface Token extends JwtPayload {
  id: string;
}

export const verify = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorised" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as Token;
    if (!decoded) return res.status(403).json({ message: "Invalid token" });

    if (decoded.role !== "seller")
      return res.status(403).json({ message: "Unauthorised" });

    req.sellerId = decoded.id;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};
