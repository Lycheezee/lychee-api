import { DailyPlan } from "../../../dtos/dietPlan.dto";
import DietPlanModel from "../../../models/dietPlan";
import { DietPlan } from "../../../types/user";
import { findAiPlanByModel } from "../../../utils/aiPlanUtils";
import { updateUserCachesForDietPlan } from "../dietPlanCacheManager";
import { calculateNutritionPercentage } from "../nutritionCalculator";

/**
 * Gets a diet plan by ID with updated nutrition percentages
 */
export async function getDietPlanById(id: string): Promise<DietPlan | null> {
  const dietPlan = await DietPlanModel.findById(id)
    .populate([
      {
        path: "aiPlans.plan.meals.foodId",
        model: "Food",
      },
      {
        path: "plan.meals.foodId",
        model: "Food",
      },
    ])
    .lean();

  if (!dietPlan) return null;
  // Find the AI plan that matches the current type, or use the latest one
  const currentAiPlan = findAiPlanByModel(
    dietPlan.aiPlans as any,
    dietPlan.type
  );

  const choosenPlan = currentAiPlan?.plan || dietPlan.plan;

  const businessPlan: DailyPlan[] = choosenPlan.map((entry: any) => ({
    date: entry.date,
    meals: entry.meals.map((meal: any) => ({
      ...meal.foodId,
      foodId: meal.foodId._id.toString(),
      status: meal.status,
    })),
    percentageOfCompletions: entry.percentageOfCompletions,
  }));

  const businessAiPlans = (dietPlan.aiPlans || []).map((aiPlan: any) => ({
    model: aiPlan.model,
    plan: aiPlan.plan.map((entry: any) => ({
      ...entry,
      meals: entry.meals.map((meal: any) => ({
        ...meal.foodId,
        foodId: meal.foodId._id.toString(),
        status: meal.status,
      })),
    })),
    createdAt: aiPlan.createdAt,
  }));

  const updatedPlan = await calculateNutritionPercentage(businessPlan);
  const businessResult = {
    _id: dietPlan._id.toString(),
    nutritionsPerDay: dietPlan.nutritionsPerDay,
    plan: updatedPlan,
    aiPlans: businessAiPlans,
    type: dietPlan.type,
    createdAt: dietPlan.createdAt,
    updatedAt: dietPlan.updatedAt,
  };

  await updateUserCachesForDietPlan(id, businessResult);

  return businessResult;
}
