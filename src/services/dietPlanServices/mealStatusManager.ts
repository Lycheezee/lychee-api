import { ObjectId } from "mongodb";
import { DailyPlan, UpdateMealStatusDTO } from "../../dtos/dietPlan.dto";
import DietPlanModel from "../../models/dietPlan";
import { DietPlan } from "../../types/user";
import { updateUserCachesForDietPlan } from "./dietPlanCacheManager";
import { calculateNutritionPercentage } from "./nutritionCalculator";

/**
 * Updates the status of a specific meal in a diet plan
 * @param dietPlanId The ID of the diet plan
 * @param updateData Contains date, foodId, and new status
 * @returns Updated diet plan or null if not found
 */
export async function updateMealStatus(
  dietPlanId: string,
  updateData: UpdateMealStatusDTO
): Promise<DietPlan | null> {
  const { date, foodId, status } = updateData;

  // Convert date string to Date object for comparison
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  // Find the diet plan
  const dietPlan = await DietPlanModel.findById(dietPlanId);

  if (!dietPlan) {
    return null;
  }

  // Find the specific day and meal to update
  let mealFound = false;

  for (const dayPlan of dietPlan.plan) {
    const dayDate = new Date(dayPlan.date!);
    dayDate.setHours(0, 0, 0, 0);

    if (dayDate.getTime() === targetDate.getTime()) {
      // Find the meal with the matching foodId
      for (const meal of dayPlan.meals) {
        if (meal.foodId.toString() === foodId) {
          meal.status = status;
          mealFound = true;
          break;
        }
      }
      break;
    }
  }

  if (!mealFound) {
    throw new Error(`Meal with foodId ${foodId} not found for date ${date}`);
  }

  // Convert to business plan format for percentage recalculation
  const businessPlan: DailyPlan[] = dietPlan.plan.map((entry: any) => ({
    date: entry.date,
    meals: entry.meals.map((meal: any) => ({
      foodId: meal.foodId._id
        ? meal.foodId._id.toString()
        : meal.foodId.toString(),
      status: meal.status,
    })),
    percentageOfCompletions: entry.percentageOfCompletions,
  }));

  // Recalculate percentages
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

  // Create business type result
  const businessResult = {
    _id: dietPlan._id.toString(),
    nutritionsPerDay: dietPlan.nutritionsPerDay,
    plan: updatedPlan,
    createdAt: dietPlan.createdAt,
    updatedAt: dietPlan.updatedAt,
  };

  // Update user caches for users who have this diet plan
  await updateUserCachesForDietPlan(dietPlanId, businessResult);

  return businessResult;
}
