import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user";
import catchAsync from "../utils/catchAsync";
import CacheService from "../services/cacheService";
import UserContextService from "../services/userContextService";
import { IUser } from "../models/user";

export interface AuthenticatedRequest extends Request {
  user?: IUser;
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

      // Try to get user from cache first
      let user = CacheService.getUser(decoded.id);

      // If not in cache, fetch from database and cache it
      if (!user) {
        user = await User.findById(decoded.id).select("-hashPassword");
        if (!user) {
          return res.status(401).json({ message: "User not found" });
        }
        // Cache the user for future requests
        CacheService.setUser(decoded.id, user);
      }

      // Set user in request object
      req.user = user;

      // Run the next middleware/controller within user context
      UserContextService.runWithContext(user, () => {
        next();
      });
    } catch (err) {
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }
);
