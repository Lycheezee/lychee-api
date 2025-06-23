import { DailyPlan } from "../../../dtos/dietPlan.dto";
import DietPlanModel from "../../../models/dietPlan";
import { DietPlan } from "../../../types/user";
import { removeDeletedDietPlanFromUserCaches } from "../dietPlanCacheManager";

/**
 * Deletes a diet plan and removes references from user caches
 */
export async function deleteDietPlan(id: string): Promise<DietPlan | null> {
  const deletedPlan = await DietPlanModel.findByIdAndDelete(id);

  if (!deletedPlan) {
    return null;
  }

  // Remove diet plan reference from user caches
  await removeDeletedDietPlanFromUserCaches(id);

  // Convert to business type for return
  const businessPlan: DailyPlan[] = deletedPlan.plan.map((entry: any) => ({
    date: entry.date,
    meals: entry.meals.map((meal: any) => ({
      foodId: meal.foodId.toString(),
      status: meal.status,
    })),
    percentageOfCompletions: entry.percentageOfCompletions,
  }));

  return {
    _id: deletedPlan._id.toString(),
    nutritionsPerDay: deletedPlan.nutritionsPerDay,
    plan: businessPlan,
    createdAt: deletedPlan.createdAt,
    updatedAt: deletedPlan.updatedAt,
  };
}
