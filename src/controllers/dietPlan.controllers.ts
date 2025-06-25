import { Request, Response } from "express";
import { EAiModel } from "../constants/model.enum";
import {
  BatchUpdateMealStatusDTO,
  CreateDietPlanDTO,
  UpdateDietPlanDTO,
  UpdateMealStatusDTO,
} from "../dtos/dietPlan.dto";
import DietPlanModel from "../models/dietPlan";
import food from "../models/food";
import { IUser } from "../models/user";
import { OpenAIService } from "../services/AI/openaiService";
import * as dietPlanService from "../services/dietPlanServices/dietPlanServices";
import { addOrUpdateAiPlan } from "../utils/aiPlanUtils";
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
  const dietPlan = await dietPlanService.getDietPlanById(req.params.id);
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

export const updateDietPlanWithAI = catchAsync(
  async (req: Request, res: Response) => {
    const model = req.body.model as EAiModel;
    const user = (req as any).user as IUser;

    // Get existing diet plan first to check for existing AI plans
    const existingDietPlan = await dietPlanService.getDietPlanById(
      req.params.id
    );
    if (!existingDietPlan) {
      return res.status(404).json({ message: "Diet plan not found" });
    }

    // Handle LYCHEE model - no AI plan needed
    if (model === EAiModel.LYCHEE) {
      const dietPlan = await DietPlanModel.findByIdAndUpdate(
        user.dietPlan._id.toString(),
        { type: model },
        { new: true }
      );
      return res.json(dietPlan);
    }

    // Check if user already has a plan for this model
    const existingAiPlan = existingDietPlan.aiPlans?.find(
      (aiPlan) => aiPlan.model === model
    );

    let updatedAiPlans = existingDietPlan.aiPlans || [];

    if (existingAiPlan) {
      // User already has a plan for this model, use existing plan
      console.log(`Using existing AI plan for model: ${model}`);
    } else {
      // User doesn't have a plan for this model, create new one
      console.log(`Creating new AI plan for model: ${model}`);

      const foodList = await food.find().lean();
      const dateLast = await dietPlanService.getRemainingDietPlans(
        user.dietPlan._id.toString(),
        user.mealPlanDays
      );
      const OpenAIServiceInstance = new OpenAIService(user, foodList, dateLast);

      let updateDietPlan = {};
      switch (model) {
        case EAiModel.GEMMA:
          updateDietPlan = await OpenAIServiceInstance.getGemmaResponse();
          break;
        case EAiModel.GEMINI:
          updateDietPlan = await OpenAIServiceInstance.getFlashResponse();
          break;
        default:
          return res
            .status(400)
            .json({ message: "Invalid AI model specified" });
      }

      const newAiPlan = {
        model: model,
        plan: updateDietPlan as any,
        createdAt: new Date(),
      };

      // Use utility function to add the new AI plan
      updatedAiPlans = addOrUpdateAiPlan(existingDietPlan.aiPlans, newAiPlan);
    }

    // Update diet plan with the selected model type and AI plans
    const dietPlan = await dietPlanService.updateDietPlan(req.params.id, {
      type: model,
      aiPlans: updatedAiPlans,
    });
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
    const requestBody = req.body;

    try {
      let updatedDietPlan: any;

      // Check if this is a batch update (has 'updates' array) or single update
      if (requestBody.updates && Array.isArray(requestBody.updates)) {
        // Batch update
        const batchUpdateData: BatchUpdateMealStatusDTO = requestBody;
        updatedDietPlan = await dietPlanService.updateMealStatusBatch(
          dietPlanId,
          batchUpdateData
        );
      } else {
        // Single update (backwards compatibility)
        const updateData: UpdateMealStatusDTO = requestBody;
        updatedDietPlan = await dietPlanService.updateMealStatus(
          dietPlanId,
          updateData
        );
      }

      if (!updatedDietPlan) {
        return res.status(404).json({ message: "Diet plan not found" });
      }

      res.json({
        message: "Meal status updated successfully",
        dietPlan: updatedDietPlan,
        updatesProcessed: requestBody.updates ? requestBody.updates.length : 1,
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

export const updateMealStatusBatch = catchAsync(
  async (req: Request, res: Response) => {
    const dietPlanId = req.params.id;
    const batchUpdateData: BatchUpdateMealStatusDTO = req.body;

    try {
      if (!batchUpdateData.updates || !Array.isArray(batchUpdateData.updates)) {
        return res.status(400).json({
          message: "Invalid request format. Expected 'updates' array.",
        });
      }

      if (batchUpdateData.updates.length === 0) {
        return res.status(400).json({
          message: "No meal status updates provided",
        });
      }

      const updatedDietPlan = await dietPlanService.updateMealStatusBatch(
        dietPlanId,
        batchUpdateData
      );

      if (!updatedDietPlan) {
        return res.status(404).json({ message: "Diet plan not found" });
      }

      res.json({
        message: "Meal statuses updated successfully",
        dietPlan: updatedDietPlan,
        updatesProcessed: batchUpdateData.updates.length,
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

export const getAiPlans = catchAsync(async (req: Request, res: Response) => {
  const dietPlanId = req.params.id;

  try {
    const dietPlan = await dietPlanService.getDietPlanById(dietPlanId);
    if (!dietPlan) {
      return res.status(404).json({ message: "Diet plan not found" });
    }

    const aiPlans = dietPlan.aiPlans || [];

    // Return AI plans with metadata
    const aiPlansWithStats = aiPlans.map((aiPlan) => ({
      model: aiPlan.model,
      createdAt: aiPlan.createdAt,
      planCount: aiPlan.plan.length,
      isActive: aiPlan.model === dietPlan.type,
    }));

    res.json({
      message: "AI plans retrieved successfully",
      aiPlans: aiPlansWithStats,
      totalPlans: aiPlans.length,
      activeModel: dietPlan.type,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});
