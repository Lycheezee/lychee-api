import { ObjectId } from "mongodb";
import { DailyPlan } from "../../../dtos/dietPlan.dto";
import DietPlanModel from "../../../models/dietPlan";
import { DietPlan } from "../../../types/user";
import { updateUserCachesForDietPlan } from "../dietPlanCacheManager";
import { calculateNutritionPercentage } from "../nutritionCalculator";

/**
 * Gets all diet plans with updated nutrition percentages
 */
export async function getAllDietPlans(): Promise<DietPlan[]> {
  const dietPlans = await DietPlanModel.find().populate({
    path: "plan.meals.foodId",
    model: "Food",
  });

  const businessDietPlans: DietPlan[] = [];

  // Recalculate percentages for each plan and convert to business type
  for (const dietPlan of dietPlans) {
    // Convert schema plan to business plan for calculations
    const businessPlan: DailyPlan[] = dietPlan.plan.map((entry: any) => ({
      date: entry.date,
      meals: entry.meals.map((meal: any) => ({
        foodId: meal.foodId.toString(),
        status: meal.status,
      })),
      percentageOfCompletions: entry.percentageOfCompletions,
    }));

    const updatedPlan = await calculateNutritionPercentage(businessPlan);

    // Convert back to schema format and save
    const schemaFormattedPlan = updatedPlan.map((entry) => ({
      ...entry,
      meals: entry.meals.map((meal) => ({
        ...meal,
        foodId: new ObjectId(meal.foodId),
      })),
    }));
    dietPlan.plan = schemaFormattedPlan as any;
    await dietPlan.save();

    // Create business result for this diet plan
    const businessResult = {
      _id: dietPlan._id.toString(),
      nutritionsPerDay: dietPlan.nutritionsPerDay,
      plan: updatedPlan,
      createdAt: dietPlan.createdAt,
      updatedAt: dietPlan.updatedAt,
    };

    // Update user caches for users who have this diet plan
    await updateUserCachesForDietPlan(dietPlan._id.toString(), businessResult);

    // Add to business result
    businessDietPlans.push(businessResult);
  }

  return businessDietPlans;
}
