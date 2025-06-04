import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/user";
import CacheService from "../services/cacheService";
import UserContextService from "../services/userContextService";
import catchAsync from "../utils/catchAsync";

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
      }; // Try to get user from cache first
      let user = CacheService.getUser(decoded.id);

      // If not in cache, fetch from database and cache it
      if (!user) {
        const userFromDb = await User.findById(decoded.id)
          .select("-hashPassword")
          .populate({
            path: "dietPlan",
            populate: {
              path: "plan.meals.foodId",
              model: "Food",
            },
          })
          .lean();

        if (!userFromDb) {
          return res.status(401).json({ message: "User not found" });
        }

        // Create a properly typed user object for caching
        user = userFromDb as IUser;
        // Cache the user with all populated fields for future requests
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
