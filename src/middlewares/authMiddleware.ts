import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/user";
import CacheService from "../services/cacheService";
import * as dietPlanService from "../services/dietPlanServices/dietPlanServices";
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
          .lean();

        if (!userFromDb) {
          return res.status(401).json({ message: "User not found" });
        }

        // Get diet plan using dietPlanServices if user has one
        let dietPlan = null;
        if (userFromDb.dietPlan) {
          try {
            dietPlan = await dietPlanService.getDietPlanById(
              userFromDb.dietPlan.toString()
            );
          } catch (error) {
            console.error(
              "Error fetching diet plan in auth middleware:",
              error
            );
            // Continue without diet plan if fetch fails
          }
        }

        // Create user object with diet plan
        const userWithDietPlan = {
          ...userFromDb,
          dietPlan,
        };

        // Create a properly typed user object for caching
        user = userWithDietPlan as IUser;
        // Cache the user with diet plan for future requests
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
