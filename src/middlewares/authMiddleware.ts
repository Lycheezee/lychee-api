import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user";
import catchAsync from "../utils/catchAsync";

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const protect = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    let token = req.headers.authorization?.split(" ")[1];

    if (!token)
      return res.status(401).json({ message: "Not authorized, no token" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
      };
      req.user = await User.findById(decoded.id).select("-hashPassword");
      next();
    } catch (err) {
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }
);
