import { CreateDietPlanDTO } from "../../../dtos/dietPlan.dto";
import DietPlanModel from "../../../models/dietPlan";
import { DietPlan } from "../../../types/user";
import { calculateNutritionPercentage } from "../nutritionCalculator";

/**
 * Creates a new diet plan with calculated nutrition percentages
 */
export async function createDietPlan(
  data: CreateDietPlanDTO
): Promise<DietPlan> {
  const enrichedPlan = await calculateNutritionPercentage(data.plan);
  const created = await DietPlanModel.create({ ...data, plan: enrichedPlan });

  // Convert schema type to business type
  return {
    _id: created._id.toString(),
    nutritionsPerDay: created.nutritionsPerDay,
    plan: enrichedPlan,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
  };
}
