import { Request, Response } from "express";
import { UserUpdateType } from "../constants/userForm.enum";
import { CreateUserDTO, UpdateUserDTO } from "../dtos/user.dto";
import LycheeAIService from "../services/AI/lycheeServices";
import {
  createDietPlan,
  updateDietPlan,
} from "../services/dietPlanServices/dietPlanServices";
import * as userService from "../services/userServices";
import { AuthUser } from "../types/user";
import catchAsync from "../utils/catchAsync";

export const registerUser = catchAsync(async (req: Request, res: Response) => {
  try {
    const data: CreateUserDTO = req.body.payload;
    const result = await userService.registerUser(data);
    res.status(201).json(result);
  } catch (error: any) {
    if (error.message === "User already exists") {
      return res.status(400).json({ message: error.message });
    }
    throw error;
  }
});

export const loginUser = catchAsync(async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await userService.loginUser(email, password);
    res.json(result);
  } catch (error: any) {
    if (error.message === "Invalid credentials") {
      return res.status(401).json({ message: error.message });
    }
    throw error;
  }
});

export const getProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const user = await userService.getUserProfile(userId.toString());
  if (!user) return res.status(404).json({ message: "User not found" });

  res.json(user);
});

export const updateUser = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user as AuthUser;
  const userId = user?._id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const updateData: UpdateUserDTO = req.body;

  const type = req.query.type;

  switch (type) {
    case UserUpdateType.BODY_INFO: {
      if (!updateData.bodyInfo) {
        return res
          .status(400)
          .json({ message: "Body info is required for first time setup" });
      }
      const mealResponse = await LycheeAIService.generateMealPlan(
        updateData.bodyInfo
      );
      const dietPlan = await createDietPlan({
        nutritionsPerDay: mealResponse.daily_targets,
        plan: [
          {
            meals: mealResponse.meal_plan,
            date: new Date(),
          },
        ],
      });
      await userService.updateUser(userId.toString(), {
        dietPlan: dietPlan._id.toString(),
      });
      return res.json({ dietPlan });
    }
    case UserUpdateType.MEAL_LENGTH: {
      if (!user.bodyInfo) {
        return res
          .status(400)
          .json({ message: "Body info is required to get meal plan" });
      }
      const initialMealPlan = user.dietPlan?.plan?.[0]?.meals.map((meal) =>
        (meal as any).foodId._id.toString()
      );
      const { plans } = await LycheeAIService.getSimilarMealPlans(
        initialMealPlan,
        +updateData.mealPlanDays
      );
      const dietPlan = await updateDietPlan(user.dietPlan?._id.toString(), {
        plan: plans,
      });
      return res.json({ dietPlan });
    }
  }
  const result = await userService.updateUser(userId.toString(), updateData);

  if (!result) return res.status(404).json({ message: "User not found" });

  res.json(result);
});

export const logoutUser = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  if (userId) {
    await userService.logoutUser(userId.toString());
  }

  res.json({ message: "Logged out successfully" });
});
