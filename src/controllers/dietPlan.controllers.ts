import { Request, Response } from "express";
import {
  CreateDietPlanDTO,
  UpdateDietPlanDTO,
  UpdateMealStatusDTO,
} from "../dtos/dietPlan.dto";
import * as dietPlanService from "../services/dietPlanServices/dietPlanServices";
import catchAsync from "../utils/catchAsync";
import CurrentUser from "../utils/currentUser";

export const createDietPlan = catchAsync(
  async (req: Request, res: Response) => {
    const currentUserId = CurrentUser.getId();
    console.log(`Diet plan being created by user ID: ${currentUserId}`);

    const data: CreateDietPlanDTO = req.body;
    const dietPlan = await dietPlanService.createDietPlan(data);
    res.status(201).json(dietPlan);
  }
);

export const getAllDietPlans = catchAsync(
  async (_req: Request, res: Response) => {
    const dietPlans = await dietPlanService.getAllDietPlans();
    res.json(dietPlans);
  }
);

export const getDietPlan = catchAsync(async (req: Request, res: Response) => {
  const dietPlan = await dietPlanService.getDietPlanByIdWithMeals(req.params.id);
  if (!dietPlan) {
    return res.status(404).json({ message: "Diet plan not found" });
  }
  res.json(dietPlan);
});

export const updateDietPlan = catchAsync(
  async (req: Request, res: Response) => {
    const data: UpdateDietPlanDTO = req.body;
    const dietPlan = await dietPlanService.updateDietPlan(req.params.id, data);
    if (!dietPlan) {
      return res.status(404).json({ message: "Diet plan not found" });
    }
    res.json(dietPlan);
  }
);

export const deleteDietPlan = catchAsync(
  async (req: Request, res: Response) => {
    const dietPlan = await dietPlanService.deleteDietPlan(req.params.id);
    if (!dietPlan) {
      return res.status(404).json({ message: "Diet plan not found" });
    }
    res.json({ message: "Diet plan deleted successfully", dietPlan });
  }
);

export const updateMealStatus = catchAsync(
  async (req: Request, res: Response) => {
    const dietPlanId = req.params.id;
    const updateData: UpdateMealStatusDTO = req.body;

    try {
      const updatedDietPlan = await dietPlanService.updateMealStatus(
        dietPlanId,
        updateData
      );

      if (!updatedDietPlan) {
        return res.status(404).json({ message: "Diet plan not found" });
      }

      res.json({
        message: "Meal status updated successfully",
        dietPlan: updatedDietPlan,
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);
